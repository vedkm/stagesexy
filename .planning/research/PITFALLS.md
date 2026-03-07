# Domain Pitfalls

**Domain:** Bitwig-linked local-first live performance companion display
**Researched:** 2026-03-07
**Overall confidence:** MEDIUM-HIGH

## Phase Reference

- **Phase 1:** Bitwig integration and trusted laptop display
- **Phase 2:** Phone mirroring over local network
- **Phase 3:** Live hardening, recovery, rehearsal validation

## Critical Pitfalls

### Pitfall 1: Using the Wrong Source of Truth
**What goes wrong:** The display follows Bitwig UI focus, selected device, or a manually renamed control instead of the actual active `Instrument Selector` layer.
**Why it happens:** Bitwig has multiple "current" concepts. Official docs emphasize that soft controls can follow the currently selected device, which is not the same thing as the performer's active instrument slot.
**Consequences:** The display looks alive but can show the wrong instrument, which is worse than showing nothing.
**Warning signs:**
- Clicking around Bitwig changes the display even when the playable instrument did not change.
- Octave-button switching changes the sound before the display updates.
- The display is correct only when Bitwig is left on one specific view.
**Prevention strategy:**
- Define one explicit contract: `displayed_name = active Instrument Selector layer name`.
- Build the integration around Bitwig observer callbacks on the selector state, not around generic "selected device" behavior.
- Add a regression harness that switches layers via the real performance workflow and verifies the rendered name sequence.
- Allow a manual alias per layer if the raw Bitwig name is too long for stage use, but keep the selector layer as the source of truth.
**Address in:** Phase 1

### Pitfall 2: Polling or Screen-Scraping Instead of Event-Driven State
**What goes wrong:** The app polls Bitwig state on an interval or scrapes UI-like state, so rapid instrument changes lag or arrive out of order under load.
**Why it happens:** Polling is easier to prototype than a proper controller-extension bridge.
**Consequences:** The performer gets delayed updates, missed transitions, or stale text during fast patch changes.
**Warning signs:**
- Noticeable 100 ms+ lag during rapid switching.
- CPU usage spikes when the display is open.
- Two fast changes collapse into one visible update.
**Prevention strategy:**
- Use observer-driven updates from the Bitwig side and push state changes outward immediately.
- Debounce rendering if needed, but never debounce the underlying state pipeline.
- Attach a monotonic sequence number or timestamp to each state update so the UI can ignore late arrivals.
- Rehearse worst-case switching speed, not just slow manual clicks.
**Address in:** Phase 1

### Pitfall 3: Failing Open on Disconnect
**What goes wrong:** When Bitwig, the bridge, or the browser connection dies, the display keeps showing the last known instrument with no warning.
**Why it happens:** Many dashboards treat "last value wins" as acceptable, but live performance needs truthfulness, not cosmetic continuity.
**Consequences:** The screen becomes a liar during the exact moments when the performer most needs confidence.
**Warning signs:**
- Restarting Bitwig leaves the last instrument name visible forever.
- Unplugging the network or killing the bridge does not change the display state.
- There is no visible distinction between "fresh" and "stale" data.
**Prevention strategy:**
- Fail closed: show `Disconnected`, `Waiting for Bitwig`, or `Stale state` instead of the last instrument once freshness expires.
- Emit a heartbeat from the Bitwig side and age out UI state after a short timeout.
- Show connection status on both laptop and phone views.
- Test restart, sleep/wake, and network-drop recovery explicitly.
**Address in:** Phase 1, reinforced in Phase 2

### Pitfall 4: Making the Phone a Peer Instead of a Fallback Mirror
**What goes wrong:** The architecture makes the phone path necessary for the main experience, or the laptop display depends on the same transport stack as the phone.
**Why it happens:** It is tempting to make one browser app serve both surfaces equally.
**Consequences:** A phone connectivity problem can take down the only trustworthy view on stage.
**Warning signs:**
- The laptop display is just another client of a network service.
- Disabling Wi-Fi breaks the laptop view.
- The "phone mode" code path also controls the laptop rendering path.
**Prevention strategy:**
- Make the laptop display local and primary, with no dependency on LAN reachability.
- Treat the phone as a subscriber to already-known-good state, not the source or coordinator.
- Keep local rendering available even if the mirroring server is disabled.
- Review architecture for a strict one-way dependency: `Bitwig -> local truth -> optional mirror`.
**Address in:** Phase 1

### Pitfall 5: Assuming Browser Security Rules Will Be Friendly to Local Mirroring
**What goes wrong:** The phone view works in one setup, then fails because the deployment depends on secure-context features while using insecure local transport, or because a secure page tries to call insecure local resources.
**Why it happens:** Browser security rules treat `localhost` specially on the same device, but a phone connecting to a laptop over LAN is not the same case. Mixed-content rules also block insecure fetch/XHR/script-style requests from secure pages.
**Consequences:** Mirroring breaks only on the phone, often right before a set, with confusing console-only errors.
**Warning signs:**
- The phone works on the laptop browser but not from another device.
- The UI loads, but data never arrives.
- Console errors mention mixed content, blocked fetches, or insecure origins.
**Prevention strategy:**
- Decide the phone-delivery model early:
- Either keep it a simple local-network page with limited browser features,
- Or invest in a real HTTPS/WSS story for cross-device use.
- Do not assume `localhost` behavior transfers to `192.168.x.x`, `.local`, or venue LAN addresses.
- Add a connection self-test screen that verifies transport, freshness, and feature availability on the actual phone.
**Address in:** Phase 2

### Pitfall 6: Trusting Mobile Browser "Kiosk" Behavior
**What goes wrong:** The phone dims, locks, rotates, loses fullscreen, or drops wake lock when the browser becomes briefly inactive.
**Why it happens:** Screen Wake Lock requires a secure context and can be released when the document is not visible. Fullscreen and orientation lock behavior on iPhone Safari remains inconsistent enough that it should not be treated as guaranteed stage behavior.
**Consequences:** The phone mirror is unreadable exactly when glanced at mid-song.
**Warning signs:**
- The phone sleeps after a few minutes.
- Returning from lock screen requires a manual refresh.
- Landscape mode or fullscreen behaves differently across devices.
**Prevention strategy:**
- Treat wake lock as opportunistic, not guaranteed.
- Show a visible "awake/connected" status so the performer can trust or dismiss the phone quickly.
- Reacquire wake lock on `visibilitychange` when possible.
- Design the phone UI to remain usable without fullscreen and without orientation lock.
- Prefer a stable physical mount orientation and large safe margins instead of pixel-tight kiosk assumptions.
**Address in:** Phase 2

### Pitfall 7: Designing for "Looks Good on Desk" Instead of "Readable on Stage"
**What goes wrong:** The display is visually nice up close but fails from a few feet away under low light, glare, or peripheral attention.
**Why it happens:** Desktop design instincts optimize for dense information and aesthetic polish instead of glanceability.
**Consequences:** The performer still has to lean in or second-guess the instrument change.
**Warning signs:**
- Long names wrap to two lines unpredictably.
- Similar patch names are visually indistinguishable at a glance.
- Brightness and contrast are only tested indoors at a desk.
**Prevention strategy:**
- Optimize for one job only: fast recognition of the current instrument.
- Set a strict text policy: large type, few words, no decorative motion, no tiny metadata competing with the instrument name.
- Support performer-facing aliases such as `PIANO`, `BASS`, `LEAD 2` instead of verbose preset names.
- Test from actual performance distance, standing up, with the laptop in its real stage position.
**Address in:** Phase 1

### Pitfall 8: No Recovery Story for Startup Order, Restarts, and Sleep/Wake
**What goes wrong:** The system works only if Bitwig, the bridge, and the browser are opened in a lucky order.
**Why it happens:** Greenfield prototypes usually assume a clean startup and never model mid-set restarts.
**Consequences:** Small operational mistakes become show-stopping failures.
**Warning signs:**
- "Refresh once after Bitwig opens" is part of the setup ritual.
- The port changes between runs.
- Closing and reopening Bitwig requires restarting the whole stack.
**Prevention strategy:**
- Build a deterministic startup path with explicit states: `waiting`, `connected`, `stale`, `reconnecting`.
- Use a fixed local port and predictable URL.
- Auto-reconnect on Bitwig restart and browser reconnect.
- Write a pre-show checklist that a tired performer can execute in under one minute.
**Address in:** Phase 1, reinforced in Phase 3

## Moderate Pitfalls

### Pitfall 9: Cross-Client Drift Between Laptop and Phone
**What goes wrong:** The phone and laptop disagree after reconnects or rapid changes because new clients do not receive an authoritative snapshot before incremental updates.
**Consequences:** The fallback and mirror cannot be trusted interchangeably.
**Warning signs:**
- The phone shows the previous instrument after joining mid-song.
- Reconnecting fixes the issue sometimes, but not always.
**Prevention strategy:**
- Send a full current-state snapshot on connect, then stream incremental updates.
- Include sequence numbers so clients can detect missed or out-of-order messages.
- Add a one-tap "resync" action for the phone.
**Address in:** Phase 2

### Pitfall 10: Letting the Display Path Compete with Audio Stability
**What goes wrong:** The UI, mirroring server, or browser effects consume enough CPU or event-loop time to matter on the performance laptop.
**Why it happens:** It is easy to underestimate how much rendering, logging, hot-reload tooling, or repeated serialization costs on the same machine running the DAW.
**Consequences:** Audio glitches, visual lag, or reluctance to trust the tool live.
**Warning signs:**
- CPU spikes when opening the display window or connecting the phone.
- The prototype depends on dev tooling during rehearsal.
- Animations or transitions are more noticeable than the text itself.
**Prevention strategy:**
- Keep the runtime minimal: static layout, almost no animation, tiny payloads, no heavy front-end framework overhead unless it clearly earns its place.
- Measure CPU impact with Bitwig open and the real project loaded.
- Ship a production launch path, not a dev-server ritual.
**Address in:** Phase 3

### Pitfall 11: Over-Generalizing Too Early Beyond `Instrument Selector`
**What goes wrong:** v1 tries to support every Bitwig selector/container pattern before the `Instrument Selector` workflow is proven.
**Why it happens:** Reuse and flexibility feel attractive at design time.
**Consequences:** The core live path gets delayed and the state model becomes ambiguous.
**Warning signs:**
- The codebase introduces abstractions for multiple container types before one is working on stage.
- The roadmap talks more about extensibility than about trust and latency.
**Prevention strategy:**
- Lock v1 to `Instrument Selector` only.
- Make unsupported configurations explicit in the UI and docs.
- Generalize only after rehearsed live use confirms the core contract.
**Address in:** Phase 1

### Pitfall 12: Discovery and URL Assumptions on the Phone
**What goes wrong:** The phone mirror depends on hostname discovery or a URL entry flow that is fragile under rehearsal-room or venue conditions.
**Why it happens:** Local-network demos often assume ideal device discovery and patient setup time.
**Consequences:** The mirror is technically available but operationally annoying enough that it is skipped live.
**Warning signs:**
- Connection instructions depend on remembering a port number or hostname.
- One phone/browser works while another cannot resolve the same address.
- Rejoining the mirror takes more than a few seconds.
**Prevention strategy:**
- Provide a dead-simple join path: bookmarked URL, QR code, and visible fallback IP/port.
- Test on the actual phone/browser combination intended for performance.
- Treat discovery convenience as a bonus, not a requirement.
**Address in:** Phase 2

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Bitwig state model | Wrong source of truth | Bind only to active `Instrument Selector` layer and test against real switching workflow |
| Bitwig bridge transport | Polling, stale state, restart brittleness | Observer-driven updates, heartbeats, reconnect states, fixed local port |
| Laptop UI | Poor stage readability | Large single-purpose typography, aliases, real-distance rehearsal tests |
| Phone transport | Secure-context and mixed-content breakage | Choose delivery model early and test cross-device on actual LAN |
| Phone UX | Sleep, rotation, fullscreen assumptions | Wake-lock status, visibility recovery, no dependence on fullscreen/orientation lock |
| Mirroring consistency | Laptop/phone divergence | Snapshot-on-connect plus ordered incremental updates |
| Deployment | Dev-only launch path | Production launcher, one-minute pre-show checklist, recovery drills |

## Recommended Planning Order

1. Solve truthfulness first: correct Bitwig source of truth, event-driven updates, stale-state behavior.
2. Solve trust on the laptop second: readability, startup reliability, restart recovery.
3. Add phone mirroring only after the laptop path is independently dependable.
4. Harden with rehearsal-driven failure tests before treating the system as stage-ready.

## Sources

- Bitwig User Guide: MIDI controllers and soft control assignments, including focus-following behavior: https://www.bitwig.com/userguide/latest/midi_controllers/ (HIGH)
- Bitwig official extensions repository README pointing to controller scripting documentation in-app: https://raw.githubusercontent.com/bitwig/bitwig-extensions/main/README.md (HIGH)
- MDN Mixed Content: secure pages block insecure fetch/XHR/script-style requests; `localhost` behavior does not generalize to cross-device LAN addresses: https://developer.mozilla.org/en-US/docs/Security/MixedContent (HIGH)
- MDN Screen Wake Lock API: secure-context requirement, release on invisibility, reacquire guidance: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API (HIGH)
- MDN Secure Contexts summary from search results: `localhost` and loopback are special cases, not a blanket rule for other LAN hosts (MEDIUM)
- MDN/compatibility search results on Screen Orientation and Fullscreen support in iPhone Safari: useful directional evidence, but implementation details should be validated on the target device/browser before locking roadmap assumptions (LOW-MEDIUM)
