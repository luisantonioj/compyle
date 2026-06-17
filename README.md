# compyle

A personal life-management PWA built for yle — calendar, habits, money, notes, links, and collaboration in one elegant app with dedicated mobile and desktop layouts.

---

## Tech stack

- **React 18 + Vite 5 + TypeScript** - **Firebase 10** — Firestore (offline-first), Auth, Cloud Messaging
- **Zustand 4** — Global state management
- **vite-plugin-pwa** — PWA manifest & service worker

---

## Getting started

### 1. Clone and install

```bash
git clone <repo-url> compyle
cd compyle
npm install

```

### 2. Run without Firebase (Demo mode)

The app works fully offline with seed data when Firebase environment variables are absent.

```bash
npm run dev

```

Open [http://localhost:5173](https://www.google.com/search?q=http://localhost:5173) to see the full app with mock data.

### 3. Firebase setup (For production)

To enable real-time persistence and push notifications:

1. Create a Firebase project and enable **Firestore**, **Authentication** (Email/Password), and **Cloud Messaging**.
2. Copy `.env.example` to `.env.local` and fill in your Firebase configuration values.
3. Deploy the database rules:
```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules

```



*(Optional) Start local emulators for development:*

```bash
npm run emulator
# In a new terminal:
VITE_USE_EMULATOR=true npm run dev

```

---

## Build & deploy

**Vercel (Recommended):**

1. Push to GitHub and connect the repository to Vercel.
2. Add your Firebase environment variables in the Vercel dashboard.
3. *(Optional)* Add a Vercel Cron job targeting `/api/cron/dispatch` with your `CRON_SECRET` to enable scheduled push notifications.

**Firebase Hosting:**

```bash
npm run build
firebase deploy --only hosting

```

*made with ♥ by Luis*
