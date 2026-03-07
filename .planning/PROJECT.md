# Bitwig Stage Display

## What This Is

A live performance companion for Bitwig that shows the currently selected `Instrument Selector` layer in a stage-readable display. It is designed for personal performance rigs first, with enough structure to reuse across a small number of similar setups, starting with a laptop display and expanding to a phone display.

## Core Value

When the performer changes instruments in Bitwig, the current instrument name is shown immediately and clearly enough to trust on stage without relying on the normal Bitwig UI.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Performer can see the current `Instrument Selector` instrument on the laptop in a large, high-contrast display during live use
- [ ] Performer can keep the laptop display as a reliable fallback even when a phone display is also active
- [ ] Performer can view the same current instrument state on a phone through a browser-based local display

### Out of Scope

- Dedicated hardware displays on MIDI controllers or external OLED devices — useful later, but not needed for the initial laptop-plus-phone workflow
- General support for every Bitwig container or selector type — v1 is focused specifically on `Instrument Selector`

## Context

The user performs live with a laptop, MIDI controller, and Bitwig. Songs contain multiple instruments, and the user currently cycles through them using the octave buttons on the keyboard mapped to movement inside Bitwig's `Instrument Selector`.

The laptop is intended to stay tucked away during performance so the audience does not focus on it, which makes it harder for the user to confirm visually which instrument is active. The first goal is a local on-laptop display with very large text that can be read from a short distance. The second goal is a phone display that can mirror the same state over a local connection, while preserving the laptop view as the dependable fallback when venue connectivity is unreliable.

The preferred experience is immediate updates, high readability from a few feet away, minimal setup before a set, and support for both laptop and phone views at the same time.

## Constraints

- **Compatibility**: Must work with Bitwig `Instrument Selector` workflows — that is the switching mechanism used in live performance
- **Reliability**: The laptop display must remain usable even if the phone connection is unavailable — venue conditions can make connectivity inconsistent
- **Usability**: The display must be readable quickly from performance distance — normal DAW-scale UI is not sufficient
- **Scope**: v1 should solve the user's rig first but avoid painting the design into a corner for a small number of future rigs

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Build in phases: laptop display first, phone display second | Reduces live-performance risk and gets the most reliable path working first | — Pending |
| Focus initial integration on Bitwig `Instrument Selector` state | This is the user's actual live switching workflow and the core source of truth | — Pending |
| Treat phone support as browser-based and local-network-friendly | Keeps Phase 2 broadly compatible across devices and avoids locking into a single mobile platform | — Pending |
| Keep laptop and phone views available simultaneously | The laptop is the fallback when venue connectivity makes phone display unreliable | — Pending |

---
*Last updated: 2026-03-07 after initialization*
