# Data Conventions

## Firestore Field Naming

Compyle currently preserves the existing persisted Firestore field names for backward compatibility.

- New application-only fields should use `camelCase`.
- Existing persisted fields such as `sort_order`, `created_at`, `updated_at`, `last_paid_at`, and `is_archived` remain unchanged until a deliberate migration is planned.
- Repository modules are responsible for normalizing Firestore documents into the TypeScript domain types used by the UI.
- UI components should not cast raw Firestore documents directly.

## IDs

New client-created entity IDs should use `createId(prefix)` from `src/lib/ids.ts`.

- Keep the existing entity prefixes: `t`, `h`, `tx`, `b`, `c`, `p`, `d`, `lc`, `li`, `n`.
- Prefer `crypto.randomUUID()` when available.
- Use the fallback only for older browsers or non-browser contexts.

