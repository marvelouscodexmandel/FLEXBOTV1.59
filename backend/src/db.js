import pg from 'pg';
const { Pool } = pg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
export async function initDb() {
 await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;
 CREATE TABLE IF NOT EXISTS users(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),username text UNIQUE NOT NULL,password_hash text NOT NULL,role text NOT NULL DEFAULT 'user',created_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS webhook_events(id bigserial PRIMARY KEY,event_key text UNIQUE NOT NULL,payload jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS audit_logs(id bigserial PRIMARY KEY,action text NOT NULL,metadata jsonb,created_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS wa_allowed_users(id bigserial PRIMARY KEY,phone text UNIQUE NOT NULL,label text,active boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
 CREATE INDEX IF NOT EXISTS wa_allowed_users_active_idx ON wa_allowed_users(active,created_at DESC);`);
}
