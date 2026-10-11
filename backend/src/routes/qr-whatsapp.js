import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { getQrStatus, startQrSession, stopQrSession } from '../services/qr-session.js';

const r = Router();
function ownerOnly(req, res, next) {
  try {
    const token = req.cookies?.flexbot_session;
    if (!token || !process.env.SESSION_SECRET) return res.status(401).json({ error: 'Owner sign-in required' });
    const user = jwt.verify(token, process.env.SESSION_SECRET);
    if (user.role !== 'admin') return res.status(403).json({ error: 'Owner access required' });
    req.owner = user;
    next();
  } catch { return res.status(401).json({ error: 'Please sign in again' }); }
}
r.use(ownerOnly);
r.get('/status', (_req, res) => res.json({ ok: true, ...getQrStatus() }));
r.post('/start', async (_req, res) => {
  try { res.json({ ok: true, ...await startQrSession() }); }
  catch (err) { res.status(503).json({ ok: false, error: 'Could not start QR session', detail: err.message }); }
});
r.post('/stop', async (_req, res) => res.json({ ok: true, ...await stopQrSession() }));
r.get('/users', async (_req, res) => {
  const q = await pool.query('SELECT phone, label, active, created_at FROM wa_allowed_users ORDER BY created_at DESC');
  res.json({ ok: true, users: q.rows });
});
r.post('/users', async (req, res) => {
  const phone = String(req.body?.phone || '').replace(/\D/g, '');
  const label = String(req.body?.label || '').trim().slice(0, 80) || null;
  if (phone.length < 8 || phone.length > 15) return res.status(400).json({ error: 'Enter a valid phone number with country code' });
  await pool.query('INSERT INTO wa_allowed_users(phone,label,active) VALUES($1,$2,true) ON CONFLICT(phone) DO UPDATE SET label=EXCLUDED.label,active=true', [phone, label]);
  await pool.query('INSERT INTO audit_logs(action,metadata) VALUES($1,$2)', ['wa_user_approved', { phone, by: req.owner.username }]);
  res.status(201).json({ ok: true, phone, label, active: true });
});
r.delete('/users/:phone', async (req, res) => {
  const phone = String(req.params.phone || '').replace(/\D/g, '');
  await pool.query('UPDATE wa_allowed_users SET active=false WHERE phone=$1', [phone]);
  await pool.query('INSERT INTO audit_logs(action,metadata) VALUES($1,$2)', ['wa_user_revoked', { phone, by: req.owner.username }]);
  res.json({ ok: true, phone, active: false });
});
export default r;
