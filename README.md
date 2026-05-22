# compyle

A personal life-management PWA built for yle — calendar, habits, money, and couple collaboration in one elegant mobile-first app.

---

## Tech stack

- **React 18 + Vite 5 + TypeScript** — project core
- **Firebase 10** — Firestore (offline-first), Auth (email/password), FCM (push notifications)
- **Zustand 4** — global state management
- **vite-plugin-pwa** — PWA manifest + Workbox service worker
- **Custom CSS design system** — cream/ink/clay editorial palette

---

## Getting started

### 1. Clone and install

```bash
git clone <repo-url> compyle
cd compyle
npm install
```

### 2. Run without Firebase (demo mode)

The app works fully offline with seed data when Firebase env vars are absent.

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). You'll see the full app with mock data for yle and Luis.

### 3. Firebase setup (optional — for real persistence and push)

#### Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Add project**
2. Enable **Firestore** (production mode, region: `asia-southeast1` for Philippines)
3. Enable **Authentication** → Email/Password
4. Enable **Cloud Messaging** (for push notifications)

#### Configure env vars

Copy `.env.example` to `.env.local` and fill in your Firebase values:

```bash
cp .env.example .env.local
```

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# FCM — get this from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
VITE_FCM_VAPID_KEY=your_vapid_key

# Cron secret for Vercel scheduled notification dispatch
CRON_SECRET=some_random_secret_string
```

#### Deploy Firestore rules

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project
firebase deploy --only firestore:rules
```

### 4. Local emulators (recommended for dev)

```bash
# Start emulators (Auth + Firestore)
npm run emulator

# In another terminal:
VITE_USE_EMULATOR=true npm run dev
```

The emulator UI is at [http://localhost:4000](http://localhost:4000).

### 5. PWA icons

Replace the placeholder icons in `public/` with real ones before deploying:

| File | Size |
|------|------|
| `public/pwa-192.png` | 192×192 |
| `public/pwa-512.png` | 512×512 |
| `public/apple-touch-icon.png` | 180×180 |

Tools: [PWA Builder](https://www.pwabuilder.com/imageGenerator) or [Favicon.io](https://favicon.io/).

---

## Build & deploy

### Vercel (recommended)

```bash
npm run build
```

Push to GitHub and connect the repo to Vercel. Add env vars in the Vercel dashboard.

For push notification cron dispatch, add a Vercel Cron job targeting `/api/cron/dispatch` with `CRON_SECRET` set.

### Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

---

## Project structure

```
src/
  App.tsx                   — root component + all CRUD handlers
  main.tsx                  — entry point
  types/index.ts            — TypeScript interfaces
  lib/
    seed.ts                 — mock data + date helpers + formatPHP
    firebase.ts             — Firebase init (demo mode fallback)
    messaging.ts            — FCM token + foreground listener
  store/appStore.ts         — Zustand store (UI + data state)
  styles/
    globals.css             — design system (mobile-first)
    forms.css               — form sheet styles
    web.css                 — desktop sidebar layout
  components/
    Icons.tsx               — SVG icon library
    ui/shared.tsx           — Progress, HeatGrid, Sheet, Toast, Confetti…
    forms/Forms.tsx         — TaskForm, HabitForm, TransactionForm…
    forms/FormPrimitives.tsx — Field, EmojiPicker, ColorPicker…
    layout/BottomNav.tsx    — mobile tab bar
  screens/
    TodayScreen.tsx         — daily dashboard
    CalendarScreen.tsx      — month / week / day views
    HabitsScreen.tsx        — habit tracker with heat grids
    MoneyScreen.tsx         — savings & payments (bills, debts)
    ProfileSheet.tsx        — partner link + privacy controls
public/
  favicon.svg
  pwa-192.png               — replace with real icon
  pwa-512.png               — replace with real icon
  firebase-messaging-sw.js  — FCM background notification handler
firestore.rules             — Firestore security rules
firebase.json               — Firebase config (hosting + emulators)
```

---

## Couple collaboration

The app supports two users — **yle** (primary) and **Luis** (partner).

- Tap the profile pill (top-right) to open the profile sheet
- Switch to **Luis's view** to browse his data (read-only)
- Privacy toggles control which categories Luis can see on your profile
- In demo mode, both users' data is pre-seeded locally

---

## Easter egg

Triple-tap any screen's title heading. 🎉

---

*made with ♥ by Luis · for yle*
