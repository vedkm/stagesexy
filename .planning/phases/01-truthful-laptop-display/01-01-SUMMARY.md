---
phase: 01-truthful-laptop-display
plan: 01
subsystem: testing
tags: [react, vite, vitest, playwright, typescript]
requires:
  - phase: none
    provides: project planning foundation
provides:
  - companion workspace with Vite, React, TypeScript, Vitest, and Playwright
  - shared stage event and snapshot contracts for later bridge, server, and UI work
  - red-path unit and smoke specs that lock the Phase 1 behaviors before implementation
affects: [01-02, 01-03, 01-04]
tech-stack:
  added: [react, react-dom, vite, vitest, @testing-library/react, @testing-library/jest-dom, @playwright/test, jsdom]
  patterns: [shared stage contract file, placeholder modules behind red tests, laptop-first Playwright smoke scaffold]
key-files:
  created:
    [
      companion/package.json,
      companion/playwright.config.ts,
      companion/src/types/stage.ts,
      companion/src/state/stage-store.ts,
      companion/src/state/connection-status.ts,
      companion/src/labels/alias-store.ts,
      companion/src/ui/StageDisplay.tsx,
      companion/tests/stage-mode.spec.ts
    ]
  modified:
    [companion/index.html, companion/src/App.tsx, companion/vite.config.ts, companion/tsconfig.app.json, companion/tsconfig.node.json]
key-decisions:
  - "Use a standalone Vite + React + TypeScript companion workspace for the laptop-first path."
  - "Keep one authoritative `companion/src/types/stage.ts` contract and import it from tests and future implementation files."
  - "Use placeholder modules so the first red tests fail on missing behavior instead of broken imports."
patterns-established:
  - "Pattern 1: Shared stage types are defined exactly once and reused across bridge, state, and UI boundaries."
  - "Pattern 2: Validation commands tolerate the plan's `--runInBand` flag while still running Vitest in non-watch mode."
requirements-completed: [DISP-01, DISP-02, DISP-03, DISP-04, LABL-01]
duration: 4 min
completed: 2026-03-07
---

# Phase 1 Plan 01: Scaffold Companion Workspace Summary

**Companion workspace scaffolded with shared stage contracts, intentional red unit specs, and a discoverable fullscreen smoke-test path for the laptop display.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-07T09:38:26-04:00
- **Completed:** 2026-03-07T13:42:51Z
- **Tasks:** 3
- **Files modified:** 26

## Accomplishments
- Created a runnable `companion/` workspace with Vite, React, TypeScript, Vitest, React Testing Library, and Playwright.
- Added the shared `stage.ts` truth contract plus placeholder modules that give later plans stable import targets.
- Locked all five Phase 1 requirements behind automated spec targets before implementation starts.

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold the companion workspace and validation tooling** - `f900562` (chore)
2. **Task 2: Freeze the shared truth contracts and encode failing unit tests** - `adc89a1` (test)
3. **Task 3: Add the fullscreen smoke-test scaffold for the stage path** - `0978924` (test)

Additional plan support:

- `9113e93` - `chore(01-01): capture companion root scaffold files`

## Files Created/Modified
- `companion/package.json` - Adds the laptop-local dev, build, unit-test, and e2e scripts.
- `companion/scripts/run-vitest.mjs` - Normalizes the planned `--runInBand` invocation into a working Vitest command.
- `companion/vite.config.ts` - Enables jsdom-based Vitest execution with shared setup.
- `companion/playwright.config.ts` - Declares the laptop-first Playwright harness and future `/stage` smoke path.
- `companion/src/types/stage.ts` - Defines the shared event, alias, and snapshot contracts for later plans.
- `companion/src/state/live-state.spec.ts` - Encodes immediate event application expectations.
- `companion/src/state/connection-status.spec.ts` - Encodes `live`, `stale`, and `disconnected` freshness transitions.
- `companion/src/labels/alias-store.spec.ts` - Encodes alias lookup by `layerKey`.
- `companion/src/ui/StageDisplay.test.tsx` - Encodes dominant label and truthful status rendering.
- `companion/tests/stage-mode.spec.ts` - Encodes the future fullscreen enter/exit smoke path for the laptop route.

## Decisions Made
- Used a standalone `companion/` browser workspace instead of introducing Electron or another desktop shell, matching the phase's laptop-first scope.
- Chose placeholder implementation modules for `stage-store`, `connection-status`, `alias-store`, and `StageDisplay` so the initial tests fail for the right reason: missing behavior.
- Kept the Playwright smoke spec discoverable-only for now; browser binaries are not required until later plans actually execute the end-to-end path.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Wrapped Vitest to accept the planned `--runInBand` verification flag**
- **Found during:** Task 1 (Scaffold the companion workspace and validation tooling)
- **Issue:** The plan's unit-test verification uses `--runInBand`, which `vitest` does not accept directly.
- **Fix:** Added `companion/scripts/run-vitest.mjs` and pointed `test:unit` at it so the planned command runs and forwards the remaining file arguments to Vitest.
- **Files modified:** `companion/package.json`, `companion/scripts/run-vitest.mjs`
- **Verification:** `npm --prefix companion run test:unit -- --runInBand src/state/live-state.spec.ts src/state/connection-status.spec.ts src/labels/alias-store.spec.ts src/ui/StageDisplay.test.tsx`
- **Committed in:** `f900562`

**2. [Rule 3 - Blocking] Switched the Vite config to the Vitest-aware config export**
- **Found during:** Task 1 (Scaffold the companion workspace and validation tooling)
- **Issue:** `tsc -b` rejected the `test` block when `defineConfig` came from `vite`.
- **Fix:** Imported `defineConfig` from `vitest/config` so the workspace can type-check and build with the embedded test configuration.
- **Files modified:** `companion/vite.config.ts`
- **Verification:** `npm --prefix companion run build`
- **Committed in:** `f900562`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes preserved the requested stack and verification flow without adding scope.

## Issues Encountered
- `npm exec ... --version` and `npm exec ... --list` on npm 11 treated the trailing flags as npm CLI options rather than passing them through to the target binary. Verification was completed with equivalent `npx --prefix companion ...` commands instead.
- The initial Vite scaffold left required root files (`companion/.gitignore`, `companion/tsconfig.json`) outside the first task commit; they were captured immediately in the follow-up support commit `9113e93`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `01-02-PLAN.md` can now build against the shared `NormalizedInstrumentEvent` contract instead of redefining payload shapes.
- `01-03-PLAN.md` can implement `StageDisplay` and fullscreen behavior against existing red specs and the `/stage` smoke scaffold.
- Playwright browser binaries are still deferred; install them when a later plan needs to run the e2e spec instead of just listing it.

## Self-Check: PASSED
- Verified `.planning/phases/01-truthful-laptop-display/01-01-SUMMARY.md` exists on disk.
- Verified task and support commits `f900562`, `9113e93`, `adc89a1`, and `0978924` exist in git history.

---
*Phase: 01-truthful-laptop-display*
*Completed: 2026-03-07*
