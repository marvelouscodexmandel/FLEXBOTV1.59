# FlexBot backend v1.8.1

Node.js/Express API for FlexBot, using PostgreSQL, official WhatsApp Business Cloud API, and Telegram Bot API.

## Deployment
Use the root `render.yaml` Blueprint or create a Node web service with root directory `backend`, build command `npm install`, start command `npm start`, and health path `/api/health`.

## Required server secrets
Set `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` (bcrypt hash), `WEBHOOK_VERIFY_TOKEN`, `META_APP_SECRET`, `WA_PHONE_NUMBER_ID`, `WA_ACCESS_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, and `PUBLIC_BASE_URL` as applicable. Never commit real credentials.

WhatsApp messaging requires an approved Meta WhatsApp Business Platform setup. This project never collects WhatsApp registration or verification codes. Telegram uses the official Bot API webhook secret header.

## Test
`GET /api/health` should return `{ "ok": true }`.
