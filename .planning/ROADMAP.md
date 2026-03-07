# Roadmap: Bitwig Stage Display

## Overview

This roadmap stays intentionally narrow: first make the laptop path truthful and stage-readable, then add a phone mirror without weakening the laptop fallback, then round out performer context and lightweight multi-rig reuse. The phases are derived from the user's live workflow and the strict dependency chain from trusted Bitwig observation to secondary display paths.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Truthful Laptop Display** - Deliver the trusted laptop-first stage display driven by active `Instrument Selector` state.
- [ ] **Phase 2: Phone Mirror and Fallback Path** - Add a local phone mirror while keeping the laptop display available as the dependable fallback.
- [ ] **Phase 3: Performer Context and Rig Profiles** - Add richer switching context and reusable profile support for a few similar rigs.

## Phase Details

### Phase 1: Truthful Laptop Display
**Goal**: Performer can trust a laptop-first stage display that reflects the active `Instrument Selector` instrument clearly and truthfully during live use.
**Depends on**: Nothing (first phase)
**Requirements**: DISP-01, DISP-02, DISP-03, DISP-04, LABL-01
**Success Criteria** (what must be TRUE):
  1. Performer can see the active `Instrument Selector` instrument on the laptop in giant, high-contrast text from performance distance.
  2. Performer can switch the laptop view into a dedicated full-screen stage mode for live use.
  3. Laptop display updates near-instantly when the active `Instrument Selector` instrument changes and visibly shows `live`, `stale`, or `disconnected` status instead of implying old data is current.
  4. Performer can define stable stage labels so the displayed instrument name matches live expectations rather than raw Bitwig naming.
**Plans**: TBD

### Phase 2: Phone Mirror and Fallback Path
**Goal**: Performer can mirror the same current instrument state to a phone over a simple local browser path without losing the laptop as the trusted fallback display.
**Depends on**: Phase 1
**Requirements**: PHON-01, PHON-02, PHON-03
**Success Criteria** (what must be TRUE):
  1. Performer can open a read-only phone display through a simple local join flow, such as a fixed URL or QR code, and see the current active instrument.
  2. Phone display shows whether mirrored state is `live`, `stale`, or `disconnected`, so a frozen mirror is never mistaken for live state.
  3. Laptop and phone views can remain available at the same time, with the laptop still usable as the reliable fallback path if the phone connection becomes unreliable.
**Plans**: TBD

### Phase 3: Performer Context and Rig Profiles
**Goal**: Performer can recover faster during switching and reuse the display across a few similar rigs without rebuilding the app.
**Depends on**: Phase 2
**Requirements**: LABL-02, LABL-03, PROF-01
**Success Criteria** (what must be TRUE):
  1. Performer can see previous, current, and next instrument context while switching sequentially.
  2. Performer can show a secondary detail line with notes or cues related to the active instrument.
  3. Performer can save and load profiles for a small number of rigs so the app can be reused without code changes.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Truthful Laptop Display | 0/TBD | Not started | - |
| 2. Phone Mirror and Fallback Path | 0/TBD | Not started | - |
| 3. Performer Context and Rig Profiles | 0/TBD | Not started | - |
