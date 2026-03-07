# Requirements: Bitwig Stage Display

**Defined:** 2026-03-07
**Core Value:** When the performer changes instruments in Bitwig, the current instrument name is shown immediately and clearly enough to trust on stage without relying on the normal Bitwig UI.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Display

- [x] **DISP-01**: Performer can see the active `Instrument Selector` instrument in giant high-contrast text on the laptop
- [x] **DISP-02**: Performer can switch the laptop view into a dedicated full-screen stage mode
- [x] **DISP-03**: Laptop display updates near-instantly when the active `Instrument Selector` instrument changes
- [x] **DISP-04**: Laptop display shows whether instrument state is live, stale, or disconnected

### Phone Mirror

- [ ] **PHON-01**: Performer can open a read-only phone display that mirrors the current active instrument
- [ ] **PHON-02**: Phone display shows whether mirrored state is live, stale, or disconnected
- [ ] **PHON-03**: Performer can connect the phone through a simple local join flow such as a fixed URL or QR code

### Instrument Context

- [x] **LABL-01**: Performer can define stable stage labels or aliases for instruments so display names match live expectations
- [ ] **LABL-02**: Performer can see previous, current, and next instrument context while switching sequentially
- [ ] **LABL-03**: Performer can show a secondary detail line for notes or cues related to the active instrument

### Profiles

- [ ] **PROF-01**: Performer can save and load profiles for a few different rigs without rebuilding the app

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Phone Experience

- **PHON-04**: Performer can use a portrait-optimized phone layout tailored to small-screen viewing

### Extended Scope

- **EXTN-01**: Performer can use the app with Bitwig selector or container types beyond `Instrument Selector`
- **EXTN-02**: Performer can add optional timing or pulse visuals when timing data is proven reliable
- **EXTN-03**: Performer can add richer song or set context beyond the current instrument and detail line

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Phone-based remote control of Bitwig | Increases failure risk and accidental-touch risk during live performance; phone remains read-only in v1 |
| Internet-dependent sync or cloud accounts | Venue internet is not required for the workflow and would reduce reliability |
| Full lyrics, setlist, or show-control platform | Broadens the product beyond the narrow instrument-visibility problem this project is solving |
| Heavy animation-first stage UI | Can reduce readability and trust under live conditions |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DISP-01 | Phase 1 | Complete |
| DISP-02 | Phase 1 | Complete |
| DISP-03 | Phase 1 | Complete |
| DISP-04 | Phase 1 | Complete |
| PHON-01 | Phase 2 | Pending |
| PHON-02 | Phase 2 | Pending |
| PHON-03 | Phase 2 | Pending |
| LABL-01 | Phase 1 | Complete |
| LABL-02 | Phase 3 | Pending |
| LABL-03 | Phase 3 | Pending |
| PROF-01 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

---
*Requirements defined: 2026-03-07*
*Last updated: 2026-03-07 after roadmap creation*
