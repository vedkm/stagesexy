---
phase: 01-truthful-laptop-display
plan: "05"
subsystem: integration
tags: [bitwig, java, fastify, playwright, runtime]
requires:
  - phase: 01-truthful-laptop-display
    provides: Bitwig observer normalization plus the local companion truth pipeline from plans 01-02 and 01-04.
provides:
  - Real Bitwig-to-companion HTTP transport on the local `/ingest` path.
  - Runnable companion server entrypoint exposed through a normal package script.
  - Browser smoke coverage that launches the real runtime path and verifies live, stale, and disconnected display truth.
affects: [phase-01-06, phase-01-07, laptop-truth-pipeline]
tech-stack:
  added: [tsx]
  patterns:
    - Local Bitwig bridge transport posts normalized events directly to the companion ingest route.
    - Companion runtime configuration is exposed through a normal script plus env overrides instead of test-only setup.
    - Browser smoke tests launch the same companion server command intended for live use.
key-files:
  created:
    - bitwig-extension/src/main/java/com/stagesexy/CompanionIngestClient.java
    - bitwig-extension/scripts/test-with-fallback.sh
    - bitwig-extension/Dockerfile.test
    - companion/src/server/main.ts
  modified:
    - bitwig-extension/src/main/java/com/stagesexy/InstrumentSelectorDisplayExtension.java
    - bitwig-extension/src/test/java/com/stagesexy/CompanionIngestClientTest.java
    - companion/package.json
    - companion/package-lock.json
    - companion/tests/stage-mode.spec.ts
key-decisions:
  - "Use a deterministic local ingest target of http://127.0.0.1:3197/ingest so the Bitwig extension and companion share one production transport path."
  - "Expose the companion truth service through npm run start:server backed by src/server/main.ts with env-driven overrides for local rehearsal and tests."
  - "Keep browser verification honest by spawning the runtime entrypoint in Playwright instead of constructing the Fastify app directly in test code."
patterns-established:
  - "Source truth pattern: Bitwig observer -> CompanionIngestClient HTTP POST -> companion /ingest -> snapshot and SSE endpoints."
  - "Verification pattern: prefer local Java 21 for Gradle tests, then fall back to the repository-owned Docker image when the toolchain is unavailable."
requirements-completed: [DISP-01, DISP-03, DISP-04]
duration: 9 min
completed: 2026-03-07
---

# Phase 1 Plan 05: Real Runtime Bridge Summary

**Local Bitwig `/ingest` transport, companion runtime bootstrap, and browser smoke coverage running through the real server command**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-07T10:44:30-04:00
- **Completed:** 2026-03-07T10:53:21-04:00
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Replaced the Bitwig extension's host-log sink with a real local HTTP client that posts normalized selector events into the companion ingest route.
- Added a repository-owned Java 21 fallback path so source-side verification can pass without a preinstalled local toolchain.
- Exposed the companion truth service through a standard runtime script and proved the laptop browser path against that command instead of a test-only bootstrap.

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace log-only publishing with a real local companion transport** - `cdeedaa` (test), `7c58c22` (feat)
2. **Task 2: Add a normal companion runtime entrypoint and smoke it through the browser path** - `bd5099a` (feat)

**Plan metadata:** pending at summary creation; captured in the final docs commit.

_Note: Task 1 followed the TDD flow with a red test commit and a green implementation commit._

## Files Created/Modified
- `bitwig-extension/src/main/java/com/stagesexy/CompanionIngestClient.java` - Sends normalized Bitwig events to the local companion ingest endpoint with short timeouts and actionable failures.
- `bitwig-extension/src/main/java/com/stagesexy/InstrumentSelectorDisplayExtension.java` - Switches the production sink from host log output to the local companion transport.
- `bitwig-extension/src/test/java/com/stagesexy/CompanionIngestClientTest.java` - Locks the default ingest URL and validates transport behavior.
- `bitwig-extension/scripts/test-with-fallback.sh` - Runs local Gradle tests when Java 21 is present, then falls back to Docker when it is not.
- `bitwig-extension/Dockerfile.test` - Defines the repository-owned Java 21 test image used by the fallback script.
- `companion/src/server/main.ts` - Starts the companion server for live use on `127.0.0.1:3197` by default with env overrides for rehearsal and test control.
- `companion/package.json` - Adds the discoverable `start:server` runtime command.
- `companion/package-lock.json` - Records the `tsx` runtime dependency for the server entrypoint.
- `companion/tests/stage-mode.spec.ts` - Launches the real companion runtime command before exercising the laptop browser flow.

## Decisions Made
- Kept the transport path laptop-local and deterministic by hard-wiring the production default to `http://127.0.0.1:3197/ingest` rather than introducing another discovery layer.
- Added the companion entrypoint as a normal package script with env-based knobs so live use and automated smoke coverage share the same boot path.
- Left phone/LAN runtime behavior deferred, keeping the runtime default bound to `127.0.0.1` for the laptop-first phase contract.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Started the local Docker daemon so the repository fallback verification could execute**
- **Found during:** Task 1 (Replace log-only publishing with a real local companion transport)
- **Issue:** Java 21 was unavailable locally and Docker Desktop was installed but not running, so the planned fallback verification could not reach the daemon.
- **Fix:** Started Docker Desktop and reran `bitwig-extension/scripts/test-with-fallback.sh`.
- **Files modified:** None
- **Verification:** `cd bitwig-extension && ./scripts/test-with-fallback.sh`
- **Committed in:** Not applicable (environment-only recovery)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The recovery was limited to making the planned verification environment available. No code scope change.

## Issues Encountered
- The machine still lacks a local Java 21 toolchain, so Java-side verification currently relies on the new Docker fallback path.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Ready for `01-06` to expose alias management through a public companion command now that the real local runtime path exists.
- Ready for `01-07` human rehearsal against the true Bitwig -> companion -> laptop flow.

---
*Phase: 01-truthful-laptop-display*
*Completed: 2026-03-07*
