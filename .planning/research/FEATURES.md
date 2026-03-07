# Feature Landscape

**Domain:** Bitwig live performance companion display
**Project:** Bitwig Stage Display
**Researched:** 2026-03-07
**Overall confidence:** MEDIUM-HIGH

## Framing

This product is narrower than a full live-show control app. The performer needs one job done extremely well: show the currently selected `Instrument Selector` layer clearly enough to trust from a few feet away when the laptop is tucked away.

In plain terms, the table-stakes features are the ones that make the display trustworthy on stage. Differentiators are upgrades that improve speed, comfort, or future extensibility, but the product can still validate without them. Anti-features are features that look attractive because adjacent stage tools support them, but would increase setup burden or live-show risk in v1.

Research from adjacent live tools points to a consistent pattern: the most trusted performer-facing displays optimize for large readable state, local-network secondary views, and read-only monitoring rather than trying to become a full remote-control surface.

## Table Stakes

Features the product needs for live trust. Missing any of these makes the app feel risky on stage.

| Feature | Why Expected | Product Complexity | Setup Complexity | Dependencies | Notes |
|---------|--------------|-------------------|------------------|--------------|-------|
| Current instrument shown in very large high-contrast text | The performer must identify the active sound in under a second from performance distance | Low | Low | Bitwig state capture for active `Instrument Selector` layer | This is the core promise; instrument name is the primary state, not a secondary detail |
| Near-instant update when selection changes | A stage display that lags is worse than no display because it creates false confidence | Medium | Medium | Reliable detection of selector changes; low-latency state propagation | Target behavior should feel immediate to the performer, not “eventually consistent” |
| Laptop-first always-available view | The laptop remains the fallback when phone networking fails | Low | Low | Local app/window display independent of network transport | The local display must remain fully usable even if no other device is connected |
| Browser-based phone mirror as a read-only secondary view | A phone is useful as a convenient second sightline, but should not become the system of control | Medium | Medium | Local web serving; shared state sync from laptop source | Read-only is the safe default for v1 because it reduces accidental stage-side control mistakes |
| Full-screen stage mode with high-contrast themes | Normal DAW UI is not readable under stage lighting or at distance | Low | Low | Current instrument view | Include at least one dark high-contrast mode; optional light mode if outdoor/daylight use matters |
| Clear disconnected/stale-state indicator on the phone view | A mirrored view must tell the performer when it is no longer trustworthy | Medium | Low | Phone mirror; heartbeat or last-update tracking | Show connection state and last successful update age instead of silently freezing |
| Minimal pre-show setup path | If setup is fiddly, the tool will be skipped before real gigs | Medium | Medium | Stable config for one Bitwig project/rig; discoverable phone connect URL | The happy path should be: open project, start display, glance once, perform |
| Stable naming source for instrument labels | The display is only useful if names match what the performer thinks they switched to | Medium | Medium | Mapping from Bitwig layer names or explicit aliases | Support clean stage labels even if Bitwig device names are messy internally |

## Differentiators

Useful upgrades that improve speed, confidence, or future adoption, but are not required to validate the core product.

| Feature | Value Proposition | Product Complexity | Setup Complexity | Dependencies | Notes |
|---------|-------------------|-------------------|------------------|--------------|-------|
| Previous / current / next instrument strip | Helps the performer recover quickly if they overshoot while stepping through layers | Medium | Low | Current instrument state; stable ordering of selector layers | Strong fit for `Instrument Selector` workflows because switching is often sequential |
| Instrument color, icon, or category cues | Faster recognition than text alone under stress | Low | Medium | Stable label mapping | Best when performer uses recurring roles like bass, keys, lead, pad, vocal FX |
| Device-specific layouts | Laptop can favor giant single-line text while phone can use denser supporting details | Medium | Medium | Shared state model; separate view rendering | Adjacent tools commonly customize what each device shows |
| Secondary detail line | Can show patch notes such as split info, controller zone, capo/transposition reminder, or “hold pedal required” | Medium | Medium | Metadata per instrument | Useful if the same instrument family has multiple stage variants |
| Tap-to-zoom / portrait-friendly phone layout | Makes the phone usable whether mounted, hand-held, or placed beside the rig | Low | Low | Phone mirror | Good usability upgrade with low technical risk |
| Wired phone connection mode guidance | Increases reliability in noisy RF environments without changing the product model | Low | Medium | Phone mirror; documented local connection options | This can start as documentation plus a connection preference, not a deep feature |
| Optional set/song context | Showing current song or section reduces ambiguity when the same instrument names repeat across a set | Medium | High | Broader Bitwig or set-management integration | Valuable later, but depends on a stronger source of song context than the current project requires |
| Visual pulse or beat indicator | Gives reassurance that the system is alive and optionally helps with timing | Medium | Medium | Timing or transport signal | Only worthwhile if timing is reliable; otherwise it becomes distracting |
| Multi-rig profiles | Makes the tool reusable across a small number of similar setups without per-show reconfiguration | Medium | Medium | Config model; saved profiles | Fits the project goal of supporting the user’s rig first and a few related rigs later |

## Anti-Features

Features to deliberately avoid in v1 because they add scope, control risk, or setup burden faster than they add performer trust.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Phone-based remote control of Bitwig or instrument switching | Control surfaces add failure modes, permission questions, and accidental-touch risk during performance | Keep the phone read-only in v1 and let Bitwig + MIDI hardware remain the control path |
| Full setlist, lyrics, chords, and show-control suite | Adjacent tools support this, but it turns a narrow trust product into a broad live-show platform | Stay focused on instrument-state visibility first; revisit only after the core display proves sticky |
| Support for every Bitwig selector/container type | Generalizing too early will slow validation and complicate the state model | Support `Instrument Selector` first and design the internal model so other selectors can be added later |
| Internet-dependent sync, cloud accounts, or remote login | Venue connectivity is unreliable and internet is not required for the user’s actual workflow | Keep sync local-first and LAN-friendly |
| Deep edit/config UI on the phone | Small-screen configuration during a show is error-prone and slows setup | Keep mobile focused on viewing; perform setup on the laptop |
| Complex animation-heavy UI | Motion can reduce readability and create a less trustworthy “flashy” stage tool | Prefer static, immediate, legible state changes with restrained emphasis |

## Feature Dependencies

```text
Bitwig selector state capture -> Current instrument display
Current instrument display -> Full-screen stage mode
Current instrument display -> Laptop-first fallback view
Current instrument display -> Phone mirror
Phone mirror -> Connection / stale-state indicator
Stable naming source -> Current instrument display quality
Stable naming source -> Color / icon cues
Stable naming source -> Secondary detail line
Selector layer ordering -> Previous / current / next strip
Shared state model -> Device-specific layouts
Shared state model -> Multi-rig profiles
Transport / timing signal -> Visual pulse or beat indicator
Broader project context -> Optional set/song context
```

## MVP Recommendation

Prioritize these for the first requirements pass:

1. Current instrument shown in giant, high-contrast text on the laptop
2. Near-instant updates when `Instrument Selector` changes
3. Laptop-first fallback behavior that works with zero phone connected
4. Read-only phone browser mirror on the same local network
5. Clear stale/disconnected indication on the phone mirror
6. Stable instrument naming or aliasing so stage labels stay trustworthy

Defer for later validation:

- Previous / current / next strip: useful, but not required to prove the core visibility problem is solved
- Device-specific layouts: valuable once both laptop and phone usage patterns are observed
- Set/song context: promising, but introduces additional integration work not essential to the current job
- Visual pulse / beat indicator: only after reliable timing data exists

## Requirements Implications

For requirements definition, the safest framing is:

- The source of truth is the active `Instrument Selector` state on the laptop
- The primary user outcome is fast recognition, not rich control
- The phone is a convenience view, not a control plane
- v1 should optimize for low setup friction and explicit trust signals over breadth

## Sources

- Bitwig, `Instrument & FX Selector` overview: https://www.bitwig.com/learnings/instrument-fx-selector-52/ (official product learning page; confirms live-performance relevance of selector workflows)
- AbleSet docs, introduction: https://beta.ableset.app/docs/introduction (official docs; browser-based local secondary-device access)
- AbleSet docs, network connections: https://ableset.app/docs/network (official docs; local-network and wired stage-device patterns)
- AbleSet docs index: https://ableset.app/docs/ (official docs; confirms feature categories commonly present in mature stage companions)
- AbleSet docs, visual metronome: https://ableset.app/docs/visual-metronome (official docs; evidence for optional timing reassurance features)
- AbleSet docs, lyrics: https://ableset.app/docs/lyrics (official docs; evidence that per-device display customization is common in adjacent tools)
- QLab Remote docs: https://qlab.app/docs/v5/networking/qlab-remote/ (official docs; read-only remote monitor pattern for secondary devices)
- Web research on adjacent live-stage tools performed 2026-03-07; used to identify ecosystem patterns and cross-check table-stakes vs differentiators
