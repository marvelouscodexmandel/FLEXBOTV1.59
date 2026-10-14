import makeWASocket, { Browsers, BufferJSON, DisconnectReason, initAuthCreds } from '@whiskeysockets/baileys';
import { pool } from '../db.js';

let socket = null;
let status = { state: 'disconnected', qr: null, lastConnectedAt: null, lastError: null };
let startPromise = null;
let reconnectTimer = null;
let stopping = false;

function publicStatus() { return { ...status }; }
function phoneFromJid(jid = '') {
  if (!jid || jid.endsWith('@g.us') || jid === 'status@broadcast') return null;
  return jid.split('@')[0].split(':')[0].replace(/\D/g, '') || null;
}
function messageText(message) {
  const m = message?.message;
  return m?.conversation || m?.extendedTextMessage?.text
    || m?.imageMessage?.caption || m?.videoMessage?.caption || '';
}
function encode(value) { return JSON.stringify(value, BufferJSON.replacer); }
function decode(value) {
  if (value == null) return value;
  return typeof value === 'string' ? JSON.parse(value, BufferJSON.reviver) : JSON.parse(JSON.stringify(value), BufferJSON.reviver);
}

// Baileys credentials and Signal keys live in Postgres, not Render's ephemeral
// filesystem. This survives ordinary restarts and redeploys when DATABASE_URL
// points to a persistent PostgreSQL database.
async function usePostgresAuthState() {
  const result = await pool.query('SELECT creds FROM wa_auth_creds WHERE id = 1');
  const creds = result.rows[0]?.creds ? decode(result.rows[0].creds) : initAuthCreds();
  if (!result.rowCount) {
    await pool.query('INSERT INTO wa_auth_creds(id, creds) VALUES(1, $1::jsonb) ON CONFLICT(id) DO NOTHING', [encode(creds)]);
  }
  const keys = {
    async get(type, ids) {
      if (!ids.length) return {};
      const q = await pool.query(
        'SELECT key_id, value FROM wa_auth_keys WHERE category=$1 AND key_id = ANY($2::text[])',
        [type, ids]
      );
      const out = {};
      for (const row of q.rows) out[row.key_id] = decode(row.value);
      return out;
    },
    async set(data) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const [category, entries] of Object.entries(data || {})) {
          for (const [keyId, value] of Object.entries(entries || {})) {
            if (value == null) {
              await client.query('DELETE FROM wa_auth_keys WHERE category=$1 AND key_id=$2', [category, keyId]);
            } else {
              await client.query(
                'INSERT INTO wa_auth_keys(category,key_id,value) VALUES($1,$2,$3::jsonb) ON CONFLICT(category,key_id) DO UPDATE SET value=EXCLUDED.value',
                [category, keyId, encode(value)]
              );
            }
          }
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    }
  };
  return {
    state: { creds, keys },
    async saveCreds() {
      await pool.query(
        'INSERT INTO wa_auth_creds(id,creds) VALUES(1,$1::jsonb) ON CONFLICT(id) DO UPDATE SET creds=EXCLUDED.creds,updated_at=now()',
        [encode(creds)]
      );
    }
  };
}

async function handleIncoming(message) {
  const jid = message?.key?.remoteJid;
  const sender = phoneFromJid(jid);
  const text = messageText(message).trim();
  if (!sender || !text || message?.key?.fromMe) return;
  const allowed = await pool.query(
    'SELECT 1 FROM wa_allowed_users WHERE phone=$1 AND active=true LIMIT 1', [sender]
  );
  if (!allowed.rowCount) return;
  if (text.toLowerCase() === '!ping' || text.toLowerCase() === 'ping') {
    await socket?.sendMessage(jid, { text: 'Pong 🟢 FlexBot connection is responding.' });
  }
}

export function getQrStatus() { return publicStatus(); }

export async function startQrSession() {
  if (socket && ['connecting', 'qr_ready', 'connected'].includes(status.state)) return publicStatus();
  if (startPromise) return startPromise;
  stopping = false;
  startPromise = (async () => {
    const { state, saveCreds } = await usePostgresAuthState();
    status = { state: 'connecting', qr: null, lastConnectedAt: status.lastConnectedAt, lastError: null };
    socket = makeWASocket({
      auth: state,
      browser: Browsers.ubuntu('FlexBot AI'),
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      shouldIgnoreJid: jid => jid === 'status@broadcast'
    });
    socket.ev.on('creds.update', () => {
      saveCreds().catch(error => {
        status = { ...status, lastError: 'Could not persist WhatsApp session credentials.' };
        console.error('FlexBot credential persistence failed:', error?.message || 'unknown error');
      });
    });
    socket.ev.on('connection.update', update => {
      if (update.qr) status = { ...status, state: 'qr_ready', qr: update.qr, lastError: null };
      if (update.connection === 'open') status = {
        state: 'connected', qr: null, lastConnectedAt: new Date().toISOString(), lastError: null
      };
      if (update.connection === 'close') {
        const code = update.lastDisconnect?.error?.output?.statusCode;
        socket = null;
        status = {
          ...status,
          state: code === DisconnectReason.loggedOut ? 'logged_out' : 'disconnected',
          qr: null,
          lastError: code === DisconnectReason.loggedOut
            ? 'WhatsApp session logged out; owner must pair again.'
            : 'WhatsApp connection closed.'
        };
        if (!stopping && code !== DisconnectReason.loggedOut) {
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => startQrSession().catch(() => {}), 3000);
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
  try { return await startPromise; }
  catch (error) {
    socket = null;
    status = { ...status, state: 'error', qr: null, lastError: 'Could not initialize persistent WhatsApp session storage.' };
    throw error;
  } finally { startPromise = null; }
}

export async function stopQrSession() {
  stopping = true;
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  const current = socket;
  socket = null;
  if (current) { try { current.end(new Error('Stopped by owner')); } catch {} }
  status = { ...status, state: 'stopped', qr: null };
  return publicStatus();
}
