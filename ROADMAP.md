# Compyle Roadmap

This roadmap tracks public project direction and version milestones. Private implementation notes can stay in the ignored local `tasks.md` file.

## Versioning

Compyle follows Semantic Versioning:

- `MAJOR`: breaking changes, data migrations, or major architecture rewrites.
- `MINOR`: new features, completed milestones, or meaningful non-breaking improvements.
- `PATCH`: bug fixes, documentation, tests, and small internal refactors.

## Current Version

- Current app version: `0.1.0`
- Current milestone: `0.2.0 - Architecture Stabilization`

## 0.2.0 - Architecture Stabilization

The goal of `0.2.0` is to make the app safer to maintain, easier to test, clearer to deploy, and lighter on first load without changing the product direction.

- [x] Correctness and security fixes.
- [x] Root component decomposition.
- [x] Feature-oriented structure.
- [x] Repository and data layer cleanup.
- [x] Test and quality tooling.
- [x] Performance and bundle splitting.
- [x] Developer documentation.

## Remaining Follow-Ups Before 0.2.0

- [ ] Install Java and verify `npm run rules:test` with the Firestore emulator.
- [ ] Review and resolve existing lint warnings gradually.
- [ ] Decide whether to bump `package.json` from `0.1.0` to `0.2.0`.

## Future Milestones

### 0.3.0 - Product Polish

- [ ] Improve partner collaboration UX and wording.
- [ ] Expand notification settings and user control.
- [ ] Improve money reporting and summary views.
- [ ] Add more focused tests around invite and privacy flows.

### 0.4.0 - Performance And Reliability

- [ ] Consider vendor chunk splitting if the main bundle warning remains important.
- [ ] Review offline/PWA behavior across more workflows.
- [ ] Add deployment or CI checks for typecheck, tests, lint, and build.

## Release Notes

`CHANGELOG.md` is intentionally deferred until formal releases begin.
