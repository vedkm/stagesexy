# Project Research Summary

**Project:** Bitwig Stage Display
**Domain:** Local-first live performance companion for Bitwig
**Researched:** 2026-03-07
**Confidence:** MEDIUM-HIGH

## Executive Summary

This project is not a general live-show platform. It is a narrow trust product: when the performer changes instruments in Bitwig, the current `Instrument Selector` layer must appear immediately in a stage-readable display that stays truthful under pressure. The research converges on the same product shape from every angle: Bitwig remains the only source of truth, the laptop remains the primary display, and the phone remains an optional read-only mirror.

The recommended approach is a local-first system with three parts: a Bitwig observer packaged as a `.bwextension`, one small local companion service on the laptop, and one responsive browser UI rendered for both laptop and phone. The stack should stay deliberately boring: `Kotlin` on the Bitwig side, `Node.js 24 LTS` + `Fastify 5` for the local host runtime, and `React 19` + `TypeScript 5` + `Vite 6` for the UI. For transport, the synthesis favors `HTTP POST` from Bitwig into localhost and a snapshot-plus-stream browser contract, implemented with `SSE` by default because v1 is one-way and reliability matters more than flexibility.

The main risk is not framework choice. It is truthfulness. If the app reads the wrong Bitwig state, lags under fast switching, or silently shows stale data after a disconnect, it becomes actively dangerous on stage. The roadmap should therefore start with source-of-truth validation, event-driven updates, and explicit stale/disconnected behavior before any phone mirroring or setup polish.

## Key Findings

### Recommended Stack

The stack research is strongest where official surfaces exist and weakest where Bitwig's exact observer path for the active selector layer is under-documented. Even so, the direction is clear: use the official Bitwig extension model, a single localhost bridge, and one browser UI. Avoid desktop shells, cloud dependencies, and discovery-heavy networking in v1.

**Core technologies:**
- `Bitwig .bwextension` on `Java 21` with `Kotlin 2.x`: observe active `Instrument Selector` state at the source and keep Bitwig-specific logic isolated.
- `Node.js 24 LTS` + `Fastify 5`: host one local runtime that validates, stores, and distributes state with minimal operational overhead.
- `React 19` + `TypeScript 5` + `Vite 6`: render one responsive UI for laptop and phone without creating separate client stacks.
- `HTTP POST` ingress + `SSE` fan-out: match the one-way data flow, keep reconnect behavior simple, and avoid premature bidirectional session complexity.
- Fixed port + QR join flow: make phone access deterministic and debuggable under rehearsal and venue conditions.

### Expected Features

The feature research is unusually consistent: table stakes are about trust, readability, and low setup friction, not breadth. A v1 that nails giant readable instrument state, immediate updates, laptop-first fallback behavior, a read-only phone mirror, and clear stale/disconnected indicators is already solving the real problem. Everything else should justify itself against added live risk.

**Must have (table stakes):**
- Giant, high-contrast current instrument display on the laptop.
- Near-instant updates when the active `Instrument Selector` layer changes.
- Laptop-first behavior that remains usable with no phone connected.
- Browser-based read-only phone mirror on the same local network.
- Explicit stale/disconnected state on the phone, and ideally on the laptop too.
- Stable stage naming or aliases so labels match performer expectations.

**Should have (competitive):**
- Previous/current/next strip for sequential switching recovery.
- Device-specific layouts so laptop and phone optimize for different viewing distances.
- Secondary detail line for short performance cues.
- Quick phone-friendly layout improvements such as portrait-safe zoom and simple connection guidance.

**Defer (v2+):**
- Phone-based remote control of Bitwig.
- Full setlist/lyrics/show-control scope.
- Support for every Bitwig selector/container type.
- Internet-backed sync, accounts, or cloud services.
- Timing/beat visuals unless transport data is proven reliable.

### Architecture Approach

The architecture research recommends a strict one-way, local-first flow: `Bitwig -> observer adapter -> local companion runtime -> laptop renderer + phone renderer`. The most important pattern is not the exact browser transport but the boundary design: Bitwig-specific code ends at a small normalized event contract, the runtime owns the post-Bitwig source of truth, the laptop renderer stays on the shortest path, and every secondary client joins through snapshot-plus-stream synchronization.

**Major components:**
1. `Bitwig Observer Adapter` — reads the active selector layer and emits a tiny normalized event.
2. `Local Companion Runtime` — validates events, stores latest state, and exposes health plus live updates.
3. `Laptop Stage Renderer` — primary local display that must work independently of LAN conditions.
4. `Phone Web Renderer` — optional read-only mirror that receives an initial snapshot and live updates.
5. `Session / Discovery Layer` — QR and reconnect convenience only; never part of correctness.

### Critical Pitfalls

The pitfalls research is the clearest guide for roadmap order. Most risks come from building the wrong thing too early: wrong source of truth, polling instead of observing, stale data presented as live, or treating the phone as a peer rather than a mirror.

1. **Wrong Bitwig source of truth** — bind only to the active `Instrument Selector` layer, not generic selected-device or UI-focus state.
2. **Polling or screen-scraping** — use observer-driven events with timestamps or sequence numbers so fast changes stay ordered and immediate.
3. **Silent stale state** — fail closed with visible `waiting`, `stale`, or `disconnected` status instead of leaving old instrument text on screen forever.
4. **Phone path coupled to primary path** — keep the laptop renderer local and primary so Wi-Fi failure cannot break the trusted display.
5. **Cross-device browser assumptions** — validate the phone delivery model early because LAN access, secure-context rules, wake lock, fullscreen, and orientation behavior are less friendly on real phones than on the laptop.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Observation Spine and Truthful Laptop Display
**Rationale:** Every source agrees the real dependency is trustworthy observation of the active `Instrument Selector` layer. If this contract is wrong, everything built on top of it is false confidence.
**Delivers:** Bitwig observer adapter, normalized event schema, local runtime, laptop-first full-screen display, explicit `live/stale/disconnected` states, and stage naming/alias support.
**Addresses:** Current instrument display, near-instant updates, laptop-first fallback, stable naming.
**Avoids:** Wrong source of truth, polling lag, silent stale state, poor stage readability, startup-order brittleness.

### Phase 2: Phone Mirror and Snapshot Sync
**Rationale:** Phone support should mirror a proven local state system, not define it. This phase is valuable only after the laptop path is independently dependable.
**Delivers:** Embedded web serving, responsive phone renderer, snapshot-on-connect, live stream updates, QR join flow, and reconnect-safe mirror behavior.
**Uses:** Fixed local port, QR code join, shared browser UI, snapshot-plus-stream transport with `SSE` as the default v1 delivery path.
**Implements:** Phone web renderer plus session/discovery convenience.
**Avoids:** Laptop/phone drift, dependency on venue Wi-Fi, fragile discovery-only joins, and misleading frozen phone displays.

### Phase 3: Rehearsal Hardening and Recovery
**Rationale:** Live readiness depends less on new features than on proving recovery from the failures that actually happen during rehearsal and shows.
**Delivers:** Deterministic startup states, restart recovery, heartbeat/freshness aging, production launch flow, hotspot-friendly guidance, and lightweight diagnostics.
**Addresses:** Minimal setup path and sustained trust under disconnect/reconnect scenarios.
**Avoids:** Lucky startup order, dev-only launch rituals, phone sleep surprises, and performance overhead that competes with audio stability.

### Phase 4: Differentiators After Validation
**Rationale:** Only add secondary UX features after the core product proves sticky and truthful in rehearsal.
**Delivers:** Previous/current/next strip, device-specific layouts, secondary detail line, limited multi-rig profile support, and optional visual cues.
**Addresses:** Faster recovery and richer recognition without turning the app into a control surface.
**Avoids:** Premature generalization beyond `Instrument Selector`, scope creep into lyrics/setlists/control, and control-path risk on mobile.

### Phase Ordering Rationale

- The dependency chain is strict: selector observation must be correct before rendering, rendering must be trusted before mirroring, and mirroring must be stable before polish features matter.
- Grouping laptop display with the observation spine keeps the primary stage-safe path short and validates the core outcome early.
- Keeping discovery, reconnect polish, and advanced UX later reduces the chance of solving convenience problems before truthfulness problems.
- Deferring control features and broad selector support protects v1 from becoming a general live-show product before the narrow use case is proven.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** exact Bitwig observer chain for the active `Instrument Selector` layer needs implementation-level validation on the target Bitwig version.
- **Phase 2:** cross-device browser transport and phone behavior need targeted validation on the actual phone/browser and LAN setup because local network browser rules can be deceptive.
- **Phase 3:** rehearsal hardening should be driven by real rig tests, not only inferred best practices, because CPU headroom and recovery behavior are setup-specific.

Phases with standard patterns (skip research-phase):
- **Local companion runtime and browser UI shell:** standard Node/Fastify/React patterns are well documented and low novelty.
- **QR join flow and fixed-port local serving:** common, established patterns with low research uncertainty.
- **Differentiator UX features after validation:** product decisions matter more than technical unknowns here.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official sources strongly support the Bitwig extension model, Node/Fastify baseline, and current web stack choices. |
| Features | MEDIUM-HIGH | Adjacent stage-tool patterns agree on table stakes, but differentiator priority still depends on the user's real rehearsal behavior. |
| Architecture | MEDIUM | The local-first pattern is strong, but the exact Bitwig observer implementation details still need a spike. |
| Pitfalls | HIGH | Risks are concrete, cross-validated by official browser constraints and common live-systems failure modes. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Active selector observation path:** verify the exact Bitwig API observer chain for the current playable `Instrument Selector` layer before locking implementation details.
- **Transport finalization:** architecture research mentioned WebSocket for browser updates, but the stronger v1 synthesis is snapshot-plus-stream with `SSE`; confirm this is sufficient once the event cadence is measured.
- **Phone browser constraints:** validate wake lock, fullscreen behavior, reconnect flow, and LAN access on the actual target phone rather than assuming desktop-browser behavior.
- **Performance budget on the live rig:** measure CPU and responsiveness with Bitwig and the real project loaded before calling the system stage-ready.

## Sources

### Primary (HIGH confidence)
- Bitwig support docs on controller scripts and `.bwextension` installation — integration surface and packaging model.
- Bitwig user guide on MIDI controllers and container devices — selector behavior and controller API context.
- Bitwig official extensions repository — confirms the Java/JVM extension path.
- Node.js release policy — current LTS baseline.
- Fastify v5 docs — current server baseline.
- React 19 release docs — UI baseline.
- Vite 6 docs — frontend build baseline.
- MDN Mixed Content and Screen Wake Lock docs — browser constraints for phone mirroring.

### Secondary (MEDIUM confidence)
- AbleSet and QLab Remote documentation — adjacent live-tool patterns for secondary displays, local networking, and device-specific views.
- Community Bitwig browser bridge projects such as `bitwig-websocket-rpc` and `remotewig` — proof that local bridge architectures are viable.
- `qrcode` package docs — standard join-flow tooling.

### Tertiary (LOW confidence)
- `bonjour` / mDNS discovery — useful convenience only, not reliable enough to anchor the product.
- iPhone fullscreen/orientation compatibility evidence gathered from web research — directionally useful but must be tested on the actual device.

---
*Research completed: 2026-03-07*
*Ready for roadmap: yes*
