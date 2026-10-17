# HirERP — mobile (workers)

Expo SDK 58 + React Native + Expo Router + TypeScript. For job seekers and employees.
Managers and HR use the web app.

## Run on your phone

1. Install **Expo Go** from the App Store or Google Play.
2. ```bash
   npm install
   npm start
   ```
3. Scan the QR code in the terminal (iPhone: Camera app, Android: Expo Go). The phone and PC
   must be on the same Wi-Fi.

`npm run web` opens a browser preview.

## Data source

Choose **Mock** or **Backend** on the login screen (same as the web app).

- **Mock:** demo data runs inside the app. No server needed.
- **Backend:** start `../back-end` first. (For the browser preview only, add `http://localhost:8081` to the
  backend's `CORS_ORIGIN`. Phones don't need it.) The phone reaches your PC by its LAN IP, which is detected automatically
  from Expo, on port 3000. To override it, set `EXPO_PUBLIC_API_URL=http://<pc-ip>:3000/api` in a `.env` file.
  If the phone can't connect, allow Node.js through the Windows firewall (private networks).

## Shared code

`src/shared/` is **generated**. It's copied from `../front-end/src` (types, mock API + demo data, HTTP client,
helpers), so web and mobile behave the same. Edit the front-end files, then run:

```bash
npm run sync:shared
```

The only hand-written file there is `src/shared/api/mode.ts`, the mobile storage (AsyncStorage + SecureStore).

## Screens (built from the "HR Platform Mobile" design)

```
src/app/
  login.tsx, register.tsx        login (role + dev box: Mock/Backend, demo location), sign-up
  (app)/                         everything that needs a session (one auth gate)
    seeker/                      tabs: Ажил хайх (+filter sheet) · Өргөдөл · Чат · Профайл
    employee/                    tabs: Нүүр · Хуваарь (shift only) · Цалин (+withdraw sheet) · Чат · Профайл
    job/[id]  company/[id]       job detail (+apply sheet), company profile
    contract/[id]                review, finger signature, sign / decline
    qr, qr-result                QR clock-in with geofence → success / error
    leave, leave-new             my leave requests, new request
    withdraw-done                QPay-style receipt (mock payment)
    notifications, chat/[id]     announcements + notifications, conversation
    profile-edit                 skills, availability
src/components/ui.tsx            mobile UI kit (cards, sheets, segmented, chips, step bar…)
src/theme/tokens.ts              design tokens (same blue as the web)
```

## Clock-in demo

- **QR:** the web app shows each branch's QR code at **Company → Ирцийн QR** (`/company/qr`). Print it or
  open it on a second screen, then scan it from **Нүүр → Ирц бүртгэх**. With no camera (web preview, emulator),
  use "Демо: QR-гүйгээр уншуулсан гэж үзэх".
- **Location:** "Демо байршил" on the login screen (on by default) pretends you're 45 m from the branch, so the demo
  works anywhere. Turn it off to use real GPS. In Backend mode the server checks your real coordinates.

## Checks

```bash
npm run typecheck
npx expo-doctor
```
