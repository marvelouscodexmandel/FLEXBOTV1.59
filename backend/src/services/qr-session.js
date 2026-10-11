import fs from 'node:fs/promises';
import path from 'node:path';
import makeWASocket, { Browsers, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { pool } from '../db.js';

const authDir = path.resolve(process.env.WA_SESSION_DIR || '.data/baileys-auth');
let socket = null;
let status = { state: 'disconnected', qr: null, lastConnectedAt: null, lastError: null };
let startPromise = null;
let reconnectTimer = null;
let stopping = false;

function publicStatus() {
  return { ...status };
}

function phoneFromJid(jid = '') {
  if (!jid || jid.endsWith('@g.us') || jid === 'status@broadcast') return null;
  return jid.split('@')[0].split(':')[0].replace(/\D/g, '') || null;
}

function messageText(message) {
  const m = message?.message;
  return m?.conversation
    || m?.extendedTextMessage?.text
    || m?.imageMessage?.caption
    || m?.videoMessage?.caption
    || '';
}

async function handleIncoming(message) {
  const jid = message?.key?.remoteJid;
  const sender = phoneFromJid(jid);
  const text = messageText(message).trim();
  if (!sender || !text || message?.key?.fromMe) return;

  const allowed = await pool.query(
    'SELECT 1 FROM wa_allowed_users WHERE phone = $1 AND active = true LIMIT 1',
    [sender]
  );
  if (!allowed.rowCount) return;

  // Keep the first end-to-end test deliberately narrow. Other commands are
  // enabled only after the transport and reply path have been verified.
  if (text.toLowerCase() === '!ping' || text.toLowerCase() === 'ping') {
    await socket?.sendMessage(jid, { text: 'Pong 🟢 FlexBot connection is responding.' });
  }
}

export function getQrStatus() {
  return publicStatus();
}

export async function startQrSession() {
  if (socket && (status.state === 'connecting' || status.state === 'connected')) {
    return publicStatus();
  }
  if (startPromise) return startPromise;
  stopping = false;
  startPromise = (async () => {
    await fs.mkdir(authDir, { recursive: true, mode: 0o700 });
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    status = { state: 'connecting', qr: null, lastConnectedAt: status.lastConnectedAt, lastError: null };
    socket = makeWASocket({
      auth: state,
      browser: Browsers.ubuntu('FlexBot AI'),
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      shouldIgnoreJid: jid => jid === 'status@broadcast'
    });

    socket.ev.on('creds.update', saveCreds);
    socket.ev.on('connection.update', update => {
      if (update.qr) status = { ...status, state: 'qr_ready', qr: update.qr, lastError: null };
      if (update.connection === 'open') {
        status = { state: 'connected', qr: null, lastConnectedAt: new Date().toISOString(), lastError: null };
      }
      if (update.connection === 'close') {
        const code = update.lastDisconnect?.error?.output?.statusCode;
        socket = null;
        status = {
          ...status,
          state: code === DisconnectReason.loggedOut ? 'logged_out' : 'disconnected',
          qr: null,
          lastError: code === DisconnectReason.loggedOut ? 'WhatsApp session logged out; owner must pair again.' : 'WhatsApp connection closed.'
        };
        if (!stopping && code !== DisconnectReason.loggedOut) {
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => {
            startQrSession().catch(() => {});
          }, 3000);
          reconnectTimer.unref?.();
        }
      }
    });
    socket.ev.on('messages.upsert', async event => {
      if (event.type !== 'notify') return;
      for (const message of event.messages || []) {
        try { await handleIncoming(message); }
        catch (error) {
          status = { ...status, lastError: 'Could not process an incoming message.' };
          console.error('FlexBot message handling failed:', error?.message || 'unknown error');
        }
      }
    });
    return publicStatus();
  })();
  try {
    return await startPromise;
  } finally {
    startPromise = null;
  }
}

export async function stopQrSession() {
  stopping = true;
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  const current = socket;
  socket = null;
  if (current) {
    try { current.end(new Error('Stopped by owner')); } catch {}
  }
  status = { ...status, state: 'stopped', qr: null };
  return publicStatus();
}
