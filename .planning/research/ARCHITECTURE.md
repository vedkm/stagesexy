# Architecture Patterns

**Project:** Bitwig Stage Display
**Dimension:** Architecture
**Researched:** 2026-03-07
**Overall confidence:** MEDIUM

## Recommended Architecture

Structure the system as a **local-first host application on the laptop** with a **Bitwig observer adapter** feeding it, and treat the phone as an **optional read-only mirror**.

In plain terms: Bitwig should be the only place that decides which `Instrument Selector` layer is active. A small Bitwig-side adapter should observe that state and publish a normalized event to one local runtime on the laptop. That runtime should drive the laptop display directly and also serve a browser UI plus WebSocket stream for the phone. This keeps the stage-safe path short and makes the phone path additive rather than critical.

### Why this structure

- It keeps the **reliable fallback** on the laptop independent from LAN or phone issues.
- It creates **one source of truth** for display state after Bitwig: a local normalized state store.
- It keeps the phone setup minimal: connect to the laptop host, open one URL or scan one QR code, receive the same rendered state.
- It avoids a fragile design where the browser talks to Bitwig directly or where the phone becomes part of the critical path.

## Recommended Components

### 1. Bitwig Observer Adapter

**Responsibility:** Observe the current `Instrument Selector` state inside Bitwig and emit a normalized payload when it changes.

**Should do:**
- Attach to the relevant track/device context.
- Detect current selected layer and display name.
- Emit a small, versioned state object such as:

```json
{
  "selectorId": "main-rig-selector",
  "layerIndex": 2,
  "layerName": "Lead Brass",
  "updatedAt": "2026-03-07T20:14:03.221Z",
  "projectName": "Set A",
  "trackName": "Performance Rack"
}
```

**Should not do:**
- Render UI.
- Manage phone sessions.
- Store long-lived app state.

**Boundary:** Bitwig-specific code stops here. Everything after this component should operate on an app-owned state model, not Bitwig API objects.

**Implementation recommendation:** Prefer a packaged Bitwig extension/script whose only job is observation plus local publishing. Keep this adapter narrow so Bitwig API changes do not leak across the rest of the app.

### 2. Local Companion Runtime

**Responsibility:** Act as the host process on the laptop and own the post-Bitwig source of truth.

**Should do:**
- Receive observer events over a local transport.
- Validate and normalize them into an in-memory state store.
- Keep the latest snapshot available for late joiners.
- Publish updates to all renderers.
- Expose simple health information: connected, stale, disconnected.

**Boundary:** This is the core application boundary. It knows nothing about Bitwig internals beyond the normalized event contract, and nothing about rendering details beyond pushing state to subscribers.

**Recommendation:** Make this a single local process that owns:
- state store
- local pub/sub
- embedded HTTP server
- embedded WebSocket server

This gives minimal setup and avoids a multi-process chain during performance.

### 3. Laptop Stage Renderer

**Responsibility:** Render the active instrument in a large, high-contrast stage view on the laptop.

**Should do:**
- Subscribe to the local state store directly or through a same-process event channel.
- Show current instrument immediately.
- Show connection health if Bitwig observation becomes stale.
- Continue displaying the last known value if updates stop.

**Boundary:** This renderer must not depend on phone connectivity, browser discovery, or external network access.

**Recommendation:** Treat the laptop renderer as the primary display path. Even if the phone path is disabled, this component should remain fully functional.

### 4. Phone Web Renderer

**Responsibility:** Provide a browser-based mirror of the same state for a phone.

**Should do:**
- Load from the laptop-hosted HTTP server.
- Receive an initial snapshot on connect.
- Subscribe to incremental updates over WebSocket.
- Show a clear stale/disconnected indicator when updates stop.

**Should not do:**
- Control Bitwig in v1.
- Contain business logic that differs from the laptop renderer.

**Boundary:** The phone is a subscriber only. It should never become the state authority.

### 5. Session and Discovery Layer

**Responsibility:** Reduce setup friction for the phone path.

**Should do:**
- Expose a stable local URL and port.
- Show a QR code on the laptop for quick join.
- Support both local Wi-Fi and laptop hotspot workflows.
- Make reconnect safe and automatic.

**Boundary:** Discovery is convenience, not correctness. If this layer fails, the laptop display must still work.

## Component Boundaries

| Component | Responsibility | Talks To | Must Not Depend On |
|-----------|----------------|----------|--------------------|
| Bitwig Observer Adapter | Read Bitwig selector state and emit normalized events | Bitwig API, Local Companion Runtime | Phone browser, UI layout |
| Local Companion Runtime | Validate, store, and distribute current state | Observer Adapter, Laptop Renderer, Phone Renderer | Venue internet, cloud services |
| Laptop Stage Renderer | Primary local display | Local Companion Runtime | LAN availability, phone presence |
| Phone Web Renderer | Secondary mirror display | Local Companion Runtime over HTTP/WebSocket | Direct Bitwig access |
| Session/Discovery Layer | Pairing and reconnect convenience | Phone browser, Local Companion Runtime | Bitwig correctness |

## Data Flow

The data flow should be one-way and explicit:

```text
Bitwig Instrument Selector
  -> Bitwig Observer Adapter
  -> Normalized state event
  -> Local Companion Runtime
  -> In-memory latest-state store
  -> Laptop Stage Renderer
  -> Phone Web Renderer(s)
```

### Runtime sequence

1. Bitwig changes the active `Instrument Selector` layer.
2. The observer adapter receives the change from the Bitwig API.
3. The adapter emits a normalized event to the local runtime.
4. The local runtime validates the payload and updates the latest-state store.
5. The laptop renderer updates immediately from local state.
6. Connected phone clients receive the same update over WebSocket.
7. Newly connected phone clients first receive the latest snapshot, then live updates.

### Important direction rule

Only the Bitwig observer writes authoritative instrument state. Every renderer is downstream from that single write path.

## Local Transport Recommendation

Use a **local event bridge between the Bitwig observer and the runtime**, then **WebSocket for browser clients**.

### Recommended split

- **Observer -> Runtime:** local-only bridge on the laptop
- **Runtime -> Phone browser:** HTTP for app shell, WebSocket for live updates

### Why

- Browser clients are naturally good at HTTP + WebSocket.
- The laptop path does not need network discovery to stay alive.
- The runtime can hand out both a snapshot and incremental updates cleanly.

### Contract recommendation

Use a tiny event contract:
- `state.snapshot`
- `state.changed`
- `observer.connected`
- `observer.disconnected`

That keeps reconnect and stale-state handling straightforward.

## Reliability Considerations For Stage Use

### Design for degraded operation

The phone path should fail soft. If the phone disconnects, the laptop renderer should be unaffected. If Bitwig observation pauses, both renderers should keep the last known instrument visible and mark it stale rather than going blank.

### Reliability rules

- Keep the laptop renderer on the shortest path possible.
- Keep all services local to the laptop; do not require cloud infrastructure.
- Cache the last known good state in memory and optionally on disk for fast recovery.
- Add heartbeat or monotonic timestamps so stale data is obvious.
- Show explicit statuses: `live`, `stale`, `disconnected`.
- Make reconnect idempotent: reconnecting clients should always receive the full latest snapshot.
- Prefer one host process over several loosely coordinated daemons.
- Treat the phone as read-only in early phases; control features increase stage risk.

### Network reality check

Venue Wi-Fi is a weak dependency. The safest setup is:

1. Laptop display works with no network at all.
2. Phone can join over the same local network when available.
3. Laptop-hosted hotspot is the fallback when venue Wi-Fi is poor.

### Failure modes to plan for

| Failure | User impact | Required behavior |
|---------|-------------|-------------------|
| Phone disconnects | Secondary display lost | Laptop display continues normally |
| Phone reconnects | Brief mirror interruption | Phone receives latest snapshot automatically |
| Bitwig observer stops updating | Instrument may be stale | Render last value with stale indicator |
| Runtime restarts | Temporary display interruption | Recover latest state and reconnect renderers cleanly |
| Wrong selector context | Wrong instrument shown | Require explicit selector binding and visible diagnostics |

## Suggested Build Order

Build in dependency order so stage reliability is proven before phone convenience is added.

### Phase 1: Observation Spine

Build:
- Bitwig observer adapter
- normalized event schema
- local runtime state store
- simple diagnostics log or inspector

Why first:
- This proves the hardest project-specific dependency: reliable observation of current `Instrument Selector` state.
- Every later phase depends on this contract being correct.

### Phase 2: Laptop-Only Stage Display

Build:
- primary laptop renderer
- big-text/high-contrast display mode
- stale/disconnected UI states

Why second:
- This delivers the stage-safe fallback path early.
- It validates readability and update speed before adding network complexity.

### Phase 3: Embedded Web Server + Phone Mirror

Build:
- HTTP server
- browser app shell
- WebSocket snapshot/update subscription
- same-state phone renderer

Why third:
- The phone path should mirror a proven local state system, not define it.

### Phase 4: Pairing and Recovery

Build:
- QR join flow
- auto-reconnect
- hotspot-friendly instructions
- connection diagnostics

Why fourth:
- This is setup polish and resilience, not core correctness.

### Phase 5: Hardening

Build:
- startup sequencing
- watchdog/health surfaces
- crash recovery behavior
- optional persisted last-known state

Why fifth:
- These changes matter for live use, but only after the core observation and rendering flow is stable.

## Patterns To Follow

### Pattern 1: One Writer, Many Readers

**What:** Only the Bitwig observer can publish authoritative instrument changes; all displays subscribe.

**Why:** Prevents drift between laptop and phone views.

### Pattern 2: Snapshot + Stream

**What:** Every client gets the latest full state on connect, then incremental updates.

**Why:** Makes reconnect cheap and avoids blank screens after transient disconnects.

### Pattern 3: Local-First Primary Path

**What:** The local laptop renderer updates from the host runtime without needing LAN success.

**Why:** Stage confidence depends on a short, robust chain.

## Anti-Patterns To Avoid

### Anti-Pattern 1: Browser Direct To Bitwig

**What:** Letting the phone or browser poll Bitwig or talk to the Bitwig API directly.

**Why bad:** It couples fragile network clients to the DAW integration layer and makes recovery harder.

**Instead:** Keep one Bitwig observer and one local host runtime.

### Anti-Pattern 2: Phone As Primary Display

**What:** Designing the phone mirror as the main path and treating the laptop as backup only in theory.

**Why bad:** Phone battery, browser tab suspension, and LAN instability create stage risk.

**Instead:** Treat the laptop renderer as the always-on primary, phone as optional mirror.

### Anti-Pattern 3: Shared UI Logic Across Network Boundaries

**What:** Letting business logic live separately in the phone UI and laptop UI.

**Why bad:** Drift causes inconsistent instrument names or state handling.

**Instead:** Centralize state shaping in the runtime and keep renderers thin.

## Roadmap Implications

This architecture strongly suggests the roadmap should start with **state observation and local rendering**, then add **phone mirroring**, then add **pairing and resilience**.

Recommended dependency chain:

```text
Bitwig observation
  -> normalized state model
  -> laptop renderer
  -> embedded web serving
  -> phone mirror
  -> discovery/reconnect hardening
```

If Phase 1 cannot reliably identify the intended selector and current layer, later phone work should pause until that contract is trustworthy.

## Confidence Notes

| Area | Confidence | Notes |
|------|------------|-------|
| Bitwig extension/script installation surface | HIGH | Official Bitwig support docs describe `.js` scripts and `.bwextension` extensions |
| Instrument Selector behavior model | HIGH | Official Bitwig user guide documents selector modes and the importance of current target layer |
| Extension-to-browser bridge as a viable local pattern | MEDIUM | Community projects show Bitwig-to-WebSocket/browser bridges, but exact implementation details vary |
| Stage reliability recommendations | MEDIUM | Strongly supported by local-first systems practice, but still needs validation against the user’s actual rig and venue conditions |

## Sources

- Bitwig User Guide, Container Devices: https://www.bitwig.com/userguide/latest/container/
- Bitwig Support, controller script and extension installation: https://www.bitwig.com/support/technical_support/how-do-i-add-a-controller-extension-or-script-17/
- Bitwig official extensions repository: https://github.com/bitwig/bitwig-extensions
- `bitwig-websocket-rpc` README: https://github.com/jhorology/bitwig-websocket-rpc
- `remotewig` README: https://github.com/j28/remotewig
