# FlexBot AI v1.59 — QR WhatsApp milestone

## Intended design

- One dedicated FlexBot WhatsApp account is linked to the server.
- Users message that central account; users do not link their own accounts.
- The owner explicitly approves or revokes each user's phone number.
- Approved users can send commands at any hour while the server and WhatsApp session are online.
- Keep the existing Cloud API integration isolated until the QR transport is tested.

## Release gates

1. Confirm the dedicated number can be registered and recovered by the owner.
2. Select a WhatsApp integration approach and review its current terms and account-ban risk before connecting a real number.
3. Store session credentials in durable encrypted storage; never return credentials in an API response or log them.
4. Protect QR display, connection controls, and user approvals behind owner authentication.
5. Enforce an explicit approved-user allowlist before commands run.
6. Test QR pairing, incoming message, command reply, disconnect, reconnect, server restart, and access revocation.
7. Do not deploy the QR transport to production until these tests pass.

## Current state

This is a milestone checklist, not a claim that QR pairing or WhatsApp messaging is implemented or working. The current backend uses the official Cloud API transport. Unofficial automation may violate WhatsApp terms and can result in temporary or permanent account restrictions. Use a dedicated number and do not connect personal accounts.
