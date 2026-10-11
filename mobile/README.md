# FlexBot Mobile — v1.59

This is the first Expo/React Native Android companion app for the existing FlexBot backend.

## What works in this starter
- Mobile overview, command catalogue, and server settings screens.
- A live HTTP request to `/api/health` to test whether the configured API responds.
- Editable API base URL.
- No WhatsApp tokens or message contents are stored by the app.

## Run locally
1. Install Node.js LTS and Git.
2. From this folder run `npm install`.
3. Run `npx expo start`.
4. Use Expo Go for a quick device preview, or press `a` when Android Studio and its SDK are configured.

## Build an installable APK
1. Install EAS CLI: `npm install -g eas-cli`.
2. Sign in to your Expo account: `eas login`.
3. Run `eas build:configure` and replace the placeholder EAS project ID in `app.json` if prompted.
4. Run `eas build --platform android --profile preview`. The preview profile is configured to produce an APK.

## Important boundaries
- This mobile MVP does not yet authenticate users or send commands to WhatsApp.
- A successful API health check is not proof that WhatsApp is connected.
- The current backend is built for the official Meta WhatsApp Cloud API. It is not a QR-paired WhatsApp Web/linked-device bot.
- Do not add unofficial WhatsApp Web pairing or ask users to share session keys without first choosing and reviewing the security, account-ban, and policy risks.
- Next work: add secure mobile sign-in, authenticated per-user settings, and explicit owner-approved configuration changes before adding private account controls.
