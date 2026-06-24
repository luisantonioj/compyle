# Compyle Architecture

This document describes the current architecture after the refactor phases. It is intended as a stable reference for future changes.

## System Overview

Compyle is a React/Vite PWA with Firebase-backed persistence and a Vercel cron endpoint for scheduled push notifications.

At runtime the app can operate in two modes:

- Demo/offline mode, using seeded local data when Firebase config is absent.
- Firebase mode, using Auth, Firestore subscriptions, Firestore writes, and push token storage.

## Application Layers

```text
src/
  App.tsx
  app/
  components/
  features/
  hooks/
  lib/
  screens/
  services/
  store/
  types/
api/
  cron/
docs/
```

Primary responsibilities:

- `src/App.tsx` is the auth gate and top-level app entry.
- `src/app/AppShell.tsx` wires global shell state, sync hooks, action hooks, layouts, and overlays.
- `src/app/WebLayout.tsx` and `src/app/MobileLayout.tsx` render the appropriate responsive shell.
- `src/app/Overlays.tsx` renders modal/form overlays and global UI such as toast, confirm, confetti, and focus manager.
- `src/screens/` contains mobile and web screen surfaces.
- `src/features/` owns feature-specific actions, forms, repositories, domain helpers, and tests.
- `src/services/firebase/` owns Firestore path helpers and subscription orchestration.
- `src/store/` owns Zustand state.
- `src/lib/` owns shared utilities, seed data, Firebase initialization, note helpers, ID generation, and messaging.
- `api/cron/dispatch.ts` sends scheduled push notifications.

## Feature Folder Convention

Feature modules live under `src/features/<feature>/`.

Current feature areas:

- `tasks`
- `habits`
- `money`
- `links`
- `notes`
- `profile`

Each feature should own its domain-specific operations. For example:

- `useTaskActions.ts` owns task behavior and Firestore/local branching.
- `taskRepository.ts` owns Firestore writes and task document normalization.
- `TaskForm.tsx` owns task editing UI.
- `*.test.ts` or `*.test.tsx` owns feature-specific test coverage.

Shared primitives should stay outside feature folders only when they are genuinely reusable across domains.

## State And Data Flow

Zustand is the client state source for shell state and loaded user data.

Core flow:

1. `useAuth` observes Firebase auth when Firebase is configured.
2. `AppShell` calls `useFirestoreSync(user)`.
3. `useFirestoreSync` subscribes to the signed-in user's data and partner data when linked.
4. `subscribeUserData` in `src/services/firebase/userDataRepository.ts` listens to Firestore collections and normalizes documents.
5. Feature action hooks update local seeded state or call repository functions depending on whether Firebase is active.
6. Screens receive data and handlers from layout props.

The UI should not cast raw Firestore snapshots directly. Repository/subscription boundaries normalize data first.

## Firestore Data Model

Main collections and documents:

```text
users/{uid}
users/{uid}/tasks/{taskId}
users/{uid}/habits/{habitId}
users/{uid}/bank_accounts/{bankId}
users/{uid}/transactions/{transactionId}
users/{uid}/recurring_payments/{billId}
users/{uid}/pending_payments/{debtId}
users/{uid}/tracker_visibility/settings
users/{uid}/links/{linkId}
users/{uid}/link_categories/{categoryId}
users/{uid}/notes/{noteId}
users/{uid}/push_subscriptions/{docId}
users/{uid}/notification_settings/{docId}
device_tokens/{uid}
partner_invites/{code}
```

Centralized Firestore path helpers live in `src/services/firebase/client.ts`.

Data naming conventions are documented in [data-conventions.md](data-conventions.md). In short, existing persisted snake_case fields remain for compatibility, and new app-only fields should prefer camelCase unless a migration is planned.

## Repository Pattern

Repositories are feature-scoped:

- `src/features/tasks/taskRepository.ts`
- `src/features/habits/habitRepository.ts`
- `src/features/money/moneyRepository.ts`
- `src/features/links/linkRepository.ts`
- `src/features/notes/noteRepository.ts`
- `src/features/profile/profileRepository.ts`

Repository responsibilities:

- Write feature documents to Firestore.
- Batch multi-document writes when consistency matters.
- Normalize Firestore document data into TypeScript domain shapes.
- Hide raw collection names from UI and action hooks where practical.

`src/lib/db.ts` remains as a compatibility re-export barrel. New code should import from feature repositories directly.

## Money Consistency

Money transactions affect bank and category balances. The balance math is isolated in `src/features/money/moneyDomain.ts`.

Firestore transaction saves/deletes use batched writes through `moneyRepository.ts` so the transaction document and affected bank documents are committed together.

## Privacy And Partner Collaboration

Partner linking is stored on user profile documents through `partnerId`.

Privacy settings are stored at:

```text
users/{uid}/tracker_visibility/settings
```

Canonical privacy keys:

- `cal`
- `habits`
- `money`
- `links`
- `notes`

Firestore rules allow:

- Owners to read/write their own profile and feature data.
- Linked partners to read and write feature collections only when the matching privacy key is enabled.
- Linked partners to read the profile and privacy document needed for rules evaluation.
- Device tokens to remain unreadable to all client users.

The UI copy may describe partner mode as read-only in some places, but the current security model allows linked partner edits when privacy permits. If product behavior changes, update both UI copy and `firestore.rules`.

## Push Notification Flow

Push notification registration:

1. The user enables notifications from the profile sheet.
2. `src/lib/messaging.ts` requests browser notification permission.
3. The browser Push API creates a subscription.
4. The subscription is stored in `device_tokens/{uid}`.
5. `AppShell` writes a daily summary string for the signed-in user.

Scheduled delivery:

1. Vercel Cron calls `api/cron/dispatch.ts`.
2. The handler checks `CRON_SECRET`.
3. The handler creates a Firebase service-account access token using `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.
4. The handler reads `device_tokens`.
5. `web-push` sends the notification payload.
6. `src/service-worker.ts` displays the notification and broadcasts foreground messages.

The cron must use service-account credentials because client rules intentionally deny reads of `device_tokens`.

## Testing And Quality Gates

Primary commands:

```bash
npm run typecheck
npm run test
npm run lint
npm run build
```

Security rules command:

```bash
npm run rules:test
```

Quality coverage currently includes:

- Money domain balance updates.
- Privacy/profile normalization.
- Note preview extraction.
- ID generation.
- Task and transaction form behavior.
- Static Firestore rules regressions.
- Emulator-backed Firestore rules tests when Java is available.

Known lint state: `npm run lint` passes with warnings only. Existing warnings are mostly React hook dependency and Fast Refresh guidance.

## Code Splitting And PWA Behavior

The app uses `React.lazy` and `Suspense` for feature-level code splitting:

- Web tab screens are lazy-loaded.
- Mobile tab screens are lazy-loaded.
- Overlay forms are lazy-loaded.
- `NoteForm` and Tiptap editor dependencies are lazy-loaded separately.

Production build result after Phase 6:

- Main app chunk: about `772.65 kB` minified and `198.79 kB` gzip.
- Previous main app chunk: about `1,458.49 kB` minified and `402.30 kB` gzip.
- PWA precache includes split generated entries.

Vite may still warn about the main chunk being larger than 500 kB. Further improvements could split vendor libraries or tune Rollup manual chunks.

## Development Rules

- Keep behavior unchanged during architecture cleanup unless explicitly requested.
- Prefer feature-owned code over new cross-app catch-all modules.
- Add pure helpers before testing complex hook or UI behavior.
- Keep Firestore rules, UI privacy copy, and repository paths aligned.
- Run the quality commands before committing meaningful refactor batches.
