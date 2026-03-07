---
phase: 01-truthful-laptop-display
plan: "02"
subsystem: integration
tags: [bitwig, java, gradle, junit]
requires:
  - phase: 01-01
    provides: Shared stage contracts and validation scaffolding for the companion side of the truth pipeline.
provides:
  - Verified Bitwig observer scaffold from selected track -> first instrument -> layer bank.
  - Tested normalized Instrument Selector event publishing with an explicit fallback layer key.
affects: [phase-01-03, phase-01-04, companion-bridge]
tech-stack:
  added: [Java 21, Gradle 8.6 wrapper, Bitwig extension-api 22, JUnit 5]
  patterns:
    - CursorTrack FIRST_INSTRUMENT observation for Instrument Selector truth capture
    - Fallback layerKey strategy using selected-track:first-instrument:{layer index}
key-files:
  created:
    - bitwig-extension/build.gradle.kts
    - bitwig-extension/settings.gradle.kts
    - bitwig-extension/src/main/java/com/stagesexy/NormalizedInstrumentPublisher.java
    - bitwig-extension/src/test/java/com/stagesexy/NormalizedInstrumentPublisherTest.java
  modified:
    - bitwig-extension/src/main/java/com/stagesexy/InstrumentSelectorDisplayExtension.java
    - bitwig-extension/src/main/resources/META-INF/services/com.bitwig.extension.ExtensionDefinition
key-decisions:
  - "Use the selected-track -> FIRST_INSTRUMENT -> DeviceLayerBank observer path instead of UI-followed device selection."
  - "Document layerKey as selected-track:first-instrument:{layer index} unless Bitwig exposes a stable per-layer id."
patterns-established:
  - "Observer truth comes from layer activation, not editor focus."
  - "Normalization happens in a testable publisher before later companion ingestion work."
requirements-completed: [DISP-03, LABL-01]
duration: 15 min
completed: 2026-03-07
---

# Phase 1 Plan 02: Bitwig Observer Summary

**Java 21 Bitwig extension scaffold with first-instrument layer activation normalization and explicit fallback alias keys**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-07T13:41:15Z
- **Completed:** 2026-03-07T13:56:15Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Added a runnable Java 21 Gradle extension project that resolves the Bitwig extension API from Bitwig's Maven repository and packages a `.bwextension`.
- Wired the extension entrypoint around a narrow observer chain: selected track -> first instrument -> layer bank.
- Added a tested normalization path that rejects UI-focus-only signals and emits payloads matching the shared companion contract shape.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the Java 21 Bitwig extension skeleton and build path** - `35676ec` (feat)
2. **Task 2: Normalize the observed layer state and prove the alias key strategy** - `2a1e055` (feat)

**Plan metadata:** pending at summary creation; captured in the final docs commit.

## Files Created/Modified
- `bitwig-extension/build.gradle.kts` - Java 21 Gradle build using Bitwig's published extension API plus JUnit for task-level verification.
- `bitwig-extension/settings.gradle.kts` - Names the standalone Bitwig extension project.
- `bitwig-extension/gradlew` - Provides repeatable local builds for the task verify commands.
- `bitwig-extension/src/main/java/com/stagesexy/InstrumentSelectorDisplayExtension.java` - Registers the explicit Bitwig observer chain and publishes normalized events from layer activation state.
- `bitwig-extension/src/main/java/com/stagesexy/NormalizedInstrumentPublisher.java` - Normalizes selector observations into the shared event shape and documents the fallback layer-key strategy.
- `bitwig-extension/src/test/java/com/stagesexy/NormalizedInstrumentPublisherTest.java` - Proves fallback keys, stable-id preference, sequence behavior, and UI-focus rejection.

## Decisions Made
- Used `CursorTrack.createCursorDevice(..., CursorDeviceFollowMode.FIRST_INSTRUMENT)` to avoid UI-focus-followed device selection and keep the truth source tied to the playable instrument path.
- Treated `DeviceLayer.isActivated()` as the truthful signal for the active Instrument Selector layer and rejected `UI_FOCUS` observations in the publisher.
- Used the fallback `layerKey` format `selected-track:first-instrument:{layer index}` because the verified public API/build path here did not surface a durable per-layer identifier.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed Java 21 locally for Gradle toolchain compliance**
- **Found during:** Task 1 (Create the Java 21 Bitwig extension skeleton and build path)
- **Issue:** The machine only had Java 17, so Gradle could not satisfy the plan's Java 21 build requirement.
- **Fix:** Installed `openjdk@21` via Homebrew and reran the task build with `JAVA_HOME` pointed at the Java 21 keg.
- **Files modified:** None in the repository
- **Verification:** `cd bitwig-extension && ./gradlew build -x test`
- **Committed in:** `35676ec` (part of task verification)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The auto-fix was required to satisfy the plan's Java 21 build contract. No scope creep.

## Issues Encountered
- Public web references did not expose a definitive Bitwig per-layer identifier for `Instrument Selector`, so the implementation intentionally documents and tests the fallback key instead of inferring stability from raw names.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ready for `01-03` to build the fullscreen laptop UI without re-deciding the Bitwig event shape.
- `01-04` can consume the normalized Bitwig payload path and the explicit fallback alias-key strategy when the companion ingest route is added.

## Self-Check
PASSED

---
*Phase: 01-truthful-laptop-display*
*Completed: 2026-03-07*
