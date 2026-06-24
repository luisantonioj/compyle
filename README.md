# Compyle

Compyle is a personal life-management Progressive Web App for calendar tasks, habit tracking, money planning, notes, saved links, focus sessions, push reminders, and partner collaboration. It supports a seeded offline/demo mode for local development and Firebase-backed persistence for production.

## Features

- Today dashboard for tasks, habits, bills, and daily context.
- Calendar planning with recurring task support.
- Habit trackers with streak and calendar views.
- Money tools for accounts, category buckets, transactions, bills, and debts.
- Notes with a rich Tiptap editor and preview extraction.
- Saved links organized by category.
- Focus timer with configurable sessions.
- Partner linking, partner view, and per-feature privacy toggles.
- Web Push notification support through a Vercel cron endpoint.
- PWA install/offline support through a custom service worker.

## Tech Stack

- React 18, Vite 5, and TypeScript.
- Zustand for app state.
- Firebase Auth and Firestore for persistence.
- Web Push through `web-push` and a Vercel serverless cron route.
- `vite-plugin-pwa` for PWA manifest and service worker integration.
- Vitest, Testing Library, and ESLint for quality checks.

## Architecture

The app is organized around a small shell and feature-owned modules:

- `src/App.tsx` gates auth and renders the app shell.
- `src/app/` owns layout composition, overlays, and cross-feature wiring.
- `src/features/` owns domain actions, forms, repositories, and tests by feature.
- `src/services/firebase/` centralizes Firestore path helpers and user data subscriptions.
- `src/store/` owns Zustand state.
- `src/lib/` contains shared utilities, seed data, Firebase initialization, IDs, messaging, and note helpers.
- `api/cron/dispatch.ts` sends scheduled push notifications from Vercel.
- `firestore.rules` defines owner, partner, privacy, and server-only token access.

For deeper design notes, see [docs/architecture.md](docs/architecture.md). For Firestore naming and ID conventions, see [docs/data-conventions.md](docs/data-conventions.md).

## Requirements

- Node.js compatible with the installed toolchain.
- npm.
- Java on `PATH` only if you want to run Firestore emulator rules tests.
- A Firebase project for production persistence, auth, and push notification storage.
- A Vercel project for scheduled notification dispatch.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Open `http://localhost:5173`.

If Firebase environment variables are not present, Compyle runs in seeded demo mode. This is useful for UI work, layout work, and most local development that does not need real persistence.

## Environment Variables

Copy `.env.example` to `.env.local` for local Firebase-backed development.

Client Firebase variables:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Push notification variable:

```bash
VITE_FCM_VAPID_KEY=
```

Vercel cron and server-only Firebase variables:

```bash
CRON_SECRET=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Local emulator flag:

```bash
VITE_USE_EMULATOR=false
```

Important: only variables prefixed with `VITE_` are exposed to the browser bundle. Keep `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, and `CRON_SECRET` server-only.

## Firebase Setup

1. Create a Firebase project.
2. Enable Firebase Authentication.
3. Enable Firestore.
4. Add a Web app in Firebase Project Settings.
5. Copy the web app config values into `.env.local`.
6. Add a Web Push certificate and copy the public VAPID key to `VITE_FCM_VAPID_KEY`.
7. Deploy Firestore rules:

```bash
npm exec firebase deploy --only firestore:rules
```

Local emulator development:

```bash
npm run emulator
```

Then run the app with:

```bash
VITE_USE_EMULATOR=true npm run dev
```

On Windows PowerShell, use:

```powershell
$env:VITE_USE_EMULATOR="true"
npm.cmd run dev
```

## Available Scripts

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run typecheck
```

Runs TypeScript without emitting files. Use this after changing types, repositories, or shared data contracts.

```bash
npm run test
```

Runs the normal Vitest suite, including unit tests, component tests, and static Firestore rules regression checks.

```bash
npm run test:watch
```

Runs Vitest in watch mode during active development.

```bash
npm run lint
```

Runs ESLint. The current baseline allows warnings but should not produce errors.

```bash
npm run rules:test
```

Runs Firestore security rules tests through the Firebase emulator. This requires Java on `PATH`.

```bash
npm run build
```

Runs TypeScript and creates the production Vite/PWA build.

```bash
npm run preview
```

Serves the production build locally.

```bash
npm run emulator
```

Starts Firebase emulators and imports/exports local emulator data.

## Recommended Quality Check

Before committing larger changes, run:

```bash
npm run typecheck
npm run test
npm run lint
npm run build
```

When Firestore rules, privacy behavior, partner access, or device token access changes, also run:

```bash
npm run rules:test
```

If `rules:test` fails with `Could not spawn java -version`, install a JDK and ensure `java` is available on `PATH`.

## Testing Strategy

- Pure domain logic is tested without rendering the app.
- Feature forms have component tests for critical submit behavior.
- Firestore rules have static regression tests in the normal test suite.
- Emulator-backed Firestore rules tests live under `tests/firestore.rules.test.ts`.
- Rules tests cover owner, linked partner, unlinked user, privacy enabled, privacy disabled, and unreadable device tokens.

## Deployment

### Vercel

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Add all required environment variables.
4. Build with the default npm build command:

```bash
npm run build
```

5. Configure a Vercel Cron job that calls:

```text
/api/cron/dispatch
```

The cron request must include the expected `CRON_SECRET`. The cron function reads top-level `device_tokens` with Firebase service-account credentials, so Vercel must have:

```bash
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

If the private key is stored with escaped newlines, the cron code normalizes `\n` before signing service-account JWTs.

### Firebase Rules

Deploy rules after changing `firestore.rules`:

```bash
npm exec firebase deploy --only firestore:rules
```

### Firebase Hosting

Vercel is the primary deployment target because of the cron route. Firebase Hosting can serve the static app, but the scheduled push cron still needs a serverless runtime.

## PWA And Bundle Notes

Compyle uses `vite-plugin-pwa` with an inject-manifest service worker. Production builds precache generated assets, including lazy-loaded chunks.

The app uses route/feature-level code splitting:

- Web and mobile tab screens are lazy-loaded.
- Overlay forms are lazy-loaded.
- The Tiptap note editor loads only when the note form opens.

After the Phase 6 split, the main app chunk dropped from about `1,458.49 kB` to `772.65 kB` minified. Vite may still warn that the entry chunk is larger than 500 kB; this is known and can be improved later with additional vendor splitting.

## Troubleshooting

`npm run rules:test` fails with Java error:

- Install a JDK.
- Confirm `java -version` works in the same terminal.
- Rerun `npm run rules:test`.

Firebase config is missing:

- The app will use seeded demo data.
- Add `.env.local` with the `VITE_FIREBASE_*` values to enable real persistence.

Push notifications do not send:

- Confirm `VITE_FCM_VAPID_KEY` is set for the client.
- Confirm `CRON_SECRET` and Firebase service-account variables are set in Vercel.
- Confirm `/device_tokens/{uid}` documents are being written by the client.

Build fails in a restricted shell with Vite config access errors:

- Rerun the build in a shell with normal filesystem access.

## Project Status

This is a private personal app and architecture refactor in progress. Public milestone direction lives in [ROADMAP.md](ROADMAP.md).

Made with ♡ for Yle
