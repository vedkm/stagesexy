---
phase: 01-truthful-laptop-display
plan: "04"
subsystem: integration
tags: [fastify, sse, react, playwright, stage-display]
requires:
  - phase: 01-truthful-laptop-display
    provides: Bitwig normalized instrument events and the mocked fullscreen laptop shell from plans 01-02 and 01-03.
provides:
  - Local Fastify companion service with ingest, snapshot, and SSE endpoints bound for the laptop truth pipeline.
  - Persisted alias resolution and explicit live, stale, and disconnected freshness handling before browser render.
  - React stage shell wired to real snapshot and EventSource updates with end-to-end verification through the live ingress path.
affects: [phase-1-complete, laptop-truth-pipeline, local-stage-companion]
tech-stack:
  added: [fastify]
  patterns:
    - Server-resolved stage labels from a persisted local alias file
    - Snapshot plus EventSource browser hydration for the performer-facing stage shell
    - Server-owned freshness transitions broadcast over SSE instead of browser-side inference
key-files:
  created:
    - companion/src/server/app.ts
    - companion/src/server/routes/ingest.ts
    - companion/src/server/routes/events.ts
    - companion/src/server/routes/snapshot.ts
    - companion/src/server/app.spec.ts
    - companion/src/ui/useStageStream.ts
  modified:
    - companion/src/App.tsx
    - companion/src/state/stage-store.ts
    - companion/src/state/connection-status.ts
    - companion/src/labels/alias-store.ts
    - companion/tests/stage-mode.spec.ts
    - companion/vite.config.ts
key-decisions:
  - "Resolve aliases on the companion server from a persisted local file so the browser only renders finalized stage labels."
  - "Drive laptop freshness truth from the companion with explicit live, stale, and disconnected transitions that continue even when Bitwig stops sending updates."
  - "Hydrate the React shell from /snapshot and /events instead of keeping any mocked snapshot path in App.tsx."
patterns-established:
  - "Truth pipeline pattern: Bitwig event -> in-memory stage store -> server-resolved snapshot -> EventSource client render."
  - "Verification pattern: Playwright starts the local companion and drives real /ingest updates instead of routing mocked browser responses."
requirements-completed: [DISP-01, DISP-02, DISP-03, DISP-04, LABL-01]
duration: 13 min
completed: 2026-03-07
---

# Phase 1 Plan 04: Live Truth Pipeline Summary

**Local Fastify truth service with alias-resolved stage snapshots, SSE freshness broadcasting, and a React laptop shell wired to the real Bitwig ingress path**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-07T10:05:07-04:00
- **Completed:** 2026-03-07T10:18:36-04:00
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- Added the companion server surface needed for Phase 1: normalized event ingest, alias-resolved snapshot reads, and SSE pushes for live updates.
- Made freshness truthful on the server so the UI visibly moves from `live` to `stale` to `disconnected` instead of freezing the last instrument as if it were current.
- Replaced the mocked browser state with a real snapshot plus EventSource hook and proved the full local laptop path with Playwright.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the local truth service with freshness and alias persistence** - `5efc621` (feat)
2. **Task 2: Replace mocked UI state with the live EventSource pipeline and close the browser smoke path** - `f096b3c` (feat)

**Plan metadata:** Pending final docs commit
**Follow-up verification fix:** `a21aebe` (fix)

## Files Created/Modified
- `companion/src/server/app.ts` - Builds the local-only Fastify companion and coordinates freshness rebroadcasting.
- `companion/src/server/routes/ingest.ts` - Validates and ingests normalized Bitwig instrument events.
- `companion/src/server/routes/events.ts` - Streams current stage snapshots over SSE to browser clients.
- `companion/src/server/routes/snapshot.ts` - Serves the latest alias-resolved stage snapshot.
- `companion/src/server/app.spec.ts` - Verifies ingest, snapshot freshness, and SSE behavior.
- `companion/src/state/stage-store.ts` - Maintains the in-memory truth model for the latest instrument event.
- `companion/src/state/connection-status.ts` - Derives live, stale, and disconnected state from update time thresholds.
- `companion/src/labels/alias-store.ts` - Persists local alias records with atomic writes and resolves browser-facing labels.
- `companion/src/ui/useStageStream.ts` - Fetches the current snapshot and subscribes to `/events` with `EventSource`.
- `companion/src/App.tsx` - Replaces the mocked shell data with the live stage stream.
- `companion/tests/stage-mode.spec.ts` - Drives the real local ingest path and verifies alias, fullscreen, stale, and disconnected behavior.
- `companion/vite.config.ts` - Scopes Vitest to the intended unit spec surface.

## Decisions Made
- Aliases are resolved before serialization so the browser never has to infer performer-facing labels from raw Bitwig names.
- Freshness truth stays server-owned, with a polling rebroadcast loop that emits `stale` and `disconnected` transitions even when no new ingest event arrives.
- The browser keeps a single stage shell and swaps only its data source, preserving the Phase 03 fullscreen presentation surface instead of introducing a second view model.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected initial freshness evaluation for newly applied events**
- **Found during:** Task 1 (Build the local truth service with freshness and alias persistence)
- **Issue:** `applyEvent()` initially evaluated freshness against wall-clock time, which marked older test fixtures `disconnected` the moment they were applied.
- **Fix:** Used the event timestamp as the default freshness evaluation point when applying a new event.
- **Files modified:** `companion/src/state/stage-store.ts`
- **Verification:** `npm --prefix companion run test:unit -- --runInBand src/state/live-state.spec.ts src/state/connection-status.spec.ts src/labels/alias-store.spec.ts src/server/app.spec.ts`
- **Committed in:** `5efc621` (part of task commit)

**2. [Rule 3 - Blocking] Restored browser access to the SSE stream**
- **Found during:** Task 2 (Replace mocked UI state with the live EventSource pipeline and close the browser smoke path)
- **Issue:** The hijacked SSE response path bypassed Fastify's normal response hook, so browser clients missed the required CORS headers.
- **Fix:** Added raw CORS headers directly on the `/events` response before hijacking the connection.
- **Files modified:** `companion/src/server/routes/events.ts`
- **Verification:** `npm --prefix companion run test:e2e -- tests/stage-mode.spec.ts`
- **Committed in:** `f096b3c` (part of task commit)

**3. [Rule 3 - Blocking] Installed Playwright Chromium locally for the smoke path**
- **Found during:** Task 2 (Replace mocked UI state with the live EventSource pipeline and close the browser smoke path)
- **Issue:** The machine did not have the Playwright Chromium binary cached, so the required e2e verification could not launch.
- **Fix:** Ran `npx playwright install chromium`.
- **Files modified:** None in the repository
- **Verification:** `npm --prefix companion run test:e2e -- tests/stage-mode.spec.ts`
- **Committed in:** No repository files changed

**4. [Rule 3 - Blocking] Scoped the unit runner away from e2e and dependency test suites**
- **Found during:** Final plan verification
- **Issue:** The added Playwright spec caused Vitest to execute `tests/` and then traverse dependency-owned tests in `node_modules`, which broke the planned unit/e2e verification split.
- **Fix:** Scoped Vitest includes to `src/**/*.spec.ts(x)` and `src/**/*.test.ts(x)` while excluding `tests/**`.
- **Files modified:** `companion/vite.config.ts`
- **Verification:** `npm --prefix companion run test:unit && npm --prefix companion run test:e2e`
- **Committed in:** `a21aebe`

---

**Total deviations:** 4 auto-fixed (1 bug, 3 blocking)
**Impact on plan:** All auto-fixes were required to make the planned truth pipeline verifiable and browser-reachable. No scope creep beyond execution hardening.

## Issues Encountered
- The browser smoke path exposed SSE-specific response behavior that ordinary Fastify JSON routes did not share, so the stream needed route-local CORS headers.
- Long-lived SSE connections delayed Fastify shutdown during Playwright cleanup until forced connection closing was enabled in the companion app.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 1 now has the complete local truth pipeline promised in the roadmap: Bitwig extension -> Fastify companion -> laptop EventSource client.
- Manual laptop-distance rehearsal is still the last non-automated check before broader phase verification, but no implementation blockers remain for moving into Phase 2 planning.

## Self-Check: PASSED
- Verified `.planning/phases/01-truthful-laptop-display/01-04-SUMMARY.md` exists on disk.
- Verified task commits `5efc621`, `f096b3c`, and follow-up fix `a21aebe` exist in git history.

---
*Phase: 01-truthful-laptop-display*
*Completed: 2026-03-07*
