# FlexBot backend v1.8.1

Node.js/Express API for FlexBot, using PostgreSQL and the official WhatsApp Business Cloud API.

## Deployment
Use the root `render.yaml` Blueprint or create a Node web service with root directory `backend`, build command `npm install`, start command `npm start`, and health path `/api/health`.

## Required server secrets
Set `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` (bcrypt hash), `WEBHOOK_VERIFY_TOKEN`, `META_APP_SECRET`, `WA_PHONE_NUMBER_ID`, `WA_ACCESS_TOKEN`, and `PUBLIC_BASE_URL` as applicable. Never commit real credentials.

WhatsApp messaging requires an approved Meta WhatsApp Business Platform setup. This project never collects WhatsApp registration or verification codes.

## Test
`GET /api/health` should return `{ "ok": true }`.
