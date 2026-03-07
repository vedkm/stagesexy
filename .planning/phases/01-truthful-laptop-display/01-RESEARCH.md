# Phase 1: Truthful Laptop Display - Research

**Researched:** 2026-03-07
**Domain:** Bitwig `Instrument Selector` observation, local-first bridge, stage-readable browser UI
**Confidence:** MEDIUM-HIGH

<user_constraints>
## User Constraints

No `CONTEXT.md` exists for this phase. Constraints below are sourced from `ROADMAP.md`, `PROJECT.md`, `STATE.md`, and `REQUIREMENTS.md`.

### Locked Decisions
- Build the product in phases with the laptop display first to reduce live-performance risk.
- Focus initial integration on Bitwig `Instrument Selector` state as the source of truth.
- Keep the scope narrow: Phase 1 must satisfy `DISP-01`, `DISP-02`, `DISP-03`, `DISP-04`, and `LABL-01`.
- The laptop display must remain trustworthy and usable locally; phone support is a later phase.
- The UI must optimize for giant, high-contrast readability from performance distance, not for dense information or animation.

### Claude's Discretion
- Exact JVM language for the Bitwig extension, as long as the output is a standard `.bwextension`.
- Exact component structure for the browser UI, as long as the state model remains truthful and simple.
- Exact stale/disconnected thresholds, as long as the UI never implies old data is current.

### Deferred Ideas (OUT OF SCOPE)
- Phone mirroring and join flow
- Support for selector/container types beyond `Instrument Selector`
- Previous/current/next strip, cue lines, rig profiles
- Internet-dependent sync, cloud accounts, remote control, animation-heavy UI
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISP-01 | Performer can see the active `Instrument Selector` instrument in giant high-contrast text on the laptop | Use a laptop-first browser UI with one dominant text element, plain CSS, and no competing metadata; test readability manually at real distance |
| DISP-02 | Performer can switch the laptop view into a dedicated full-screen stage mode | Use the browser Fullscreen API on the stage-display root instead of adding a desktop shell |
| DISP-03 | Laptop display updates near-instantly when the active `Instrument Selector` instrument changes | Use Bitwig observer callbacks in a controller extension, push state immediately to a local bridge, and fan out with SSE |
| DISP-04 | Laptop display shows whether instrument state is live, stale, or disconnected | Model freshness explicitly with heartbeat/update timestamps and UI states instead of preserving the last instrument indefinitely |
| LABL-01 | Performer can define stable stage labels or aliases for instruments so display names match live expectations | Store aliases in a companion-owned config file and resolve display labels server-side before rendering |
</phase_requirements>

## Summary

Phase 1 should be planned as a truth pipeline, not as a generic dashboard. The safest architecture is: Bitwig controller extension observes the active `Instrument Selector` layer, pushes compact state into a local companion service on the same laptop, and the browser UI renders that state in a fullscreen, high-contrast view with explicit freshness status. The primary planning risk is not frontend complexity; it is verifying the exact Bitwig observer chain that represents the real playable layer rather than UI focus or some adjacent "selected" concept.

The earlier stack research was directionally correct but one runtime detail needs correction: Fastify v5's official support matrix lists Node `20` and `22`, not `24`. For planning, use `Node 22.x` for the companion service until Fastify officially lists Node `24`. This keeps the browser/UI side boring and supportable while the Bitwig integration remains the only genuinely uncertain part.

For `LABL-01`, do not treat stage labels as a browser-only concern. Aliases should live in the local companion's persisted config so both the laptop view now and the phone mirror later can resolve the same stage label. If the Bitwig API exposes a stable per-layer identity, use it. If not, Phase 1 should intentionally use a documented fallback key and surface the remap risk rather than pretending aliases are more stable than they are.

**Primary recommendation:** Plan Phase 1 around an official Bitwig `.bwextension` source-of-truth bridge, a local `Node 22 + Fastify 5` companion, a fullscreen browser UI, and an explicit `live/stale/disconnected` state machine.

## Standard Stack

### Core
| Library / Platform | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Bitwig controller extension | `.bwextension` (Java extension format) | Read active `Instrument Selector` state inside Bitwig | Official Bitwig extension path; avoids UI scraping and MIDI-loopback hacks |
| Java | `21 LTS` | Build the Bitwig extension | Conservative, well-supported JVM baseline for a new extension project |
| Node.js | `22.x LTS` | Run the local companion process | Officially supported by Fastify v5 docs; lower risk than assuming Node 24 support |
| Fastify | `5.x` | Local HTTP API, SSE stream, static asset hosting | Small, fast, and sufficient for a single-machine local bridge |
| React | `19.x` | Render the stage display UI | Stable mainstream UI layer with minimal surface needed here |
| TypeScript | `5.x` | Shared state types and UI correctness | Keeps payload and render contracts aligned |
| Vite | `6.x` | Build tool and dev workflow | Standard modern toolchain for a small React SPA |

### Supporting
| Library / API | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Server-Sent Events (`EventSource`) | Browser-native | One-way live updates from companion to browser | Default fan-out transport for display clients |
| Fullscreen API | Browser-native | Dedicated stage mode on laptop | For `DISP-02` fullscreen entry/exit |
| Vitest | Current docs, 2026-03 | Unit/integration testing for UI and state logic | Default test runner for a Vite app |
| React Testing Library | Current docs, 2026-03 | Behavior-focused component tests | For text/status rendering tests |
| Playwright | Current docs, 2026-03 | Browser smoke coverage for fullscreen and reconnect flows | For the stage-mode and truthfulness smoke path |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `.bwextension` controller extension | `.js` Bitwig controller script | Faster to prototype, but less typed and less standard for a durable bridge |
| Node `22.x` | Node `24.x` | Node 24 is Active LTS, but Fastify v5 docs currently list support for 20 and 22 only |
| SSE | WebSocket | WebSocket is more flexible, but Phase 1 is one-way display sync and SSE is simpler |
| Browser fullscreen UI | Electron / Tauri | Desktop shells add packaging/runtime surface without helping the core truthfulness problem |
| Companion-owned alias config | Browser `localStorage` only | Browser-only persistence would fragment alias state before Phase 2 phone mirroring |

**Installation:**
```bash
npm create vite@latest . -- --template react-ts
npm install fastify
npm install -D vitest @testing-library/react @testing-library/dom @playwright/test typescript
```

## Architecture Patterns

### Recommended Project Structure
```text
bitwig-extension/
  src/main/java/        # Bitwig controller extension, observer callbacks, bridge client
companion/
  src/
    server/             # Fastify boot, routes, SSE endpoint, config I/O
    state/              # In-memory truth model and freshness logic
    labels/             # Alias resolution and persistence
    ui/                 # React stage display
    types/              # Shared event/state contracts
  tests/                # Vitest + Playwright tests
```

### Pattern 1: One Truth Pipeline
**What:** Build a single direction of truth: `Bitwig -> local companion -> browser UI`.
**When to use:** Always. Phase 1 should not have multiple competing sources of current instrument state.
**Example:**
```text
Bitwig observer callback
  -> normalize payload
  -> update companion in-memory state
  -> stamp updatedAt + sequence
  -> push SSE event
  -> browser renders alias-resolved stage label
```

### Pattern 2: Explicit Freshness State Machine
**What:** Model freshness as first-class state, not as presentation logic.
**When to use:** For every displayed instrument payload.
**Example:**
```text
waiting -> live -> stale -> disconnected
```

Recommended planning rule:
- `live`: recent update/heartbeat received
- `stale`: update age exceeds the freshness threshold
- `disconnected`: transport closed or heartbeat missing for multiple intervals

Do not let the UI continue showing a previous instrument name without a visible freshness change.

### Pattern 3: Alias Resolution Before Render
**What:** Convert raw Bitwig names into performer-facing stage labels before the UI renders them.
**When to use:** Always for displayed instrument text.
**Example:**
```text
raw Bitwig state -> alias lookup -> display label -> browser render
```

Recommended rule:
- Prefer a stable Bitwig-provided layer identity if the API exposes one.
- If no stable ID exists, use a documented fallback key such as `{selectorName, layerIndex}`.
- Do not key aliases by raw display name alone.

### Pattern 4: Laptop-Local by Default
**What:** Bind the laptop path to local-only assumptions first.
**When to use:** In Phase 1 boot flow and server defaults.
**Example:**
```text
Fastify listens on 127.0.0.1 by default
laptop browser consumes local SSE
phone/LAN binding is deferred to Phase 2
```

### Anti-Patterns to Avoid
- **Wrong source of truth:** Do not bind the display to Bitwig UI focus, selected device, or any generic "currently selected" concept.
- **Polling as core transport:** Do not poll Bitwig state on an interval when observer callbacks are available.
- **Fail-open UI:** Do not keep showing the last instrument as if it were live after updates stop.
- **Phone-driven architecture:** Do not make LAN or phone code paths prerequisites for the laptop view.
- **Early generalization:** Do not abstract for every Bitwig container type before `Instrument Selector` is proven.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bitwig state capture | Screen scraping, UI automation, MIDI loopback naming hacks | Official Bitwig controller extension observers | Only the extension path can truthfully observe Bitwig state |
| Full-screen stage mode | Custom desktop shell just for fullscreen | Browser Fullscreen API | Native browser support is enough for Phase 1 |
| Realtime display sync | Custom WebSocket protocol with ad hoc reconnect rules | SSE with `EventSource` | Simpler one-way transport with built-in reconnect behavior |
| Freshness handling | Implicit "last value wins" behavior | Timestamp/heartbeat-based state machine | Live use requires visible truthfulness, not cosmetic continuity |
| Label persistence | Browser-only settings store | Companion-owned config file with atomic writes | Keeps stage labels stable across restarts and future clients |

**Key insight:** Most Phase 1 complexity is deceptive. The parts that look "small" but cause rewrites are source-of-truth capture, freshness semantics, and alias identity. Keep the rest boring.

## Common Pitfalls

### Pitfall 1: Using the Wrong Source of Truth
**What goes wrong:** The display follows UI focus or selected device rather than the actual active `Instrument Selector` layer.
**Why it happens:** Bitwig has multiple "current" concepts.
**How to avoid:** Treat `displayed_name = active Instrument Selector layer` as the only accepted contract.
**Warning signs:** Clicking around the Bitwig UI changes the display without changing the playable instrument.

### Pitfall 2: Polling or Debouncing the Truth Path
**What goes wrong:** Rapid layer changes lag or collapse together.
**Why it happens:** Polling looks easy and render debouncing leaks into the underlying state pipeline.
**How to avoid:** Push state immediately from Bitwig observer callbacks; only debounce cosmetic animation, not truth.
**Warning signs:** Fast sequential switches visibly skip names or arrive late.

### Pitfall 3: Failing Open on Disconnect
**What goes wrong:** The last instrument remains visible with no stale/disconnected warning.
**Why it happens:** Dashboard habits treat old data as acceptable.
**How to avoid:** Age out the rendered state and switch the UI to `stale` or `disconnected`.
**Warning signs:** Restarting Bitwig leaves a believable but frozen instrument name on screen.

### Pitfall 4: Alias Keys That Drift
**What goes wrong:** Stage labels stop matching expectations after renames or layer reordering.
**Why it happens:** Aliases are keyed by raw name only, or by an unstable identity the planner never documented.
**How to avoid:** Verify whether Bitwig exposes stable layer identity; otherwise use an explicit fallback key and document the remap behavior.
**Warning signs:** Two different layers can collide onto the same alias record.

### Pitfall 5: Designing for Desk Distance
**What goes wrong:** The UI looks polished nearby but fails from a few feet away under pressure.
**Why it happens:** Too much secondary text, wrapping, low contrast, or decorative motion.
**How to avoid:** One dominant label, constrained text policy, real-distance rehearsal tests.
**Warning signs:** The performer needs to lean in or decode similar names mid-song.

### Pitfall 6: Startup-Order Fragility
**What goes wrong:** The system works only if Bitwig, the bridge, and the browser are opened in a lucky order.
**Why it happens:** No explicit waiting/reconnecting states.
**How to avoid:** Design startup and recovery states intentionally and test restart flows.
**Warning signs:** "Refresh once after Bitwig opens" becomes part of the setup ritual.

## Code Examples

Verified patterns from official sources:

### Fastify Server Bootstrap
```js
// Source: https://fastify.dev/docs/latest/Guides/Getting-Started/
import Fastify from 'fastify'

const fastify = Fastify({ logger: true })

fastify.get('/', async () => {
  return { hello: 'world' }
})

await fastify.listen({ port: 3000 })
```

### Browser EventSource Client
```js
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
const evtSource = new EventSource('/events')

evtSource.onmessage = (event) => {
  console.log(event.data)
}

evtSource.onerror = (err) => {
  console.error('EventSource failed:', err)
}
```

### Browser Fullscreen Toggle
```js
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
function toggleFullScreen(element) {
  if (!document.fullscreenElement) {
    element.requestFullscreen()
  } else {
    document.exitFullscreen?.()
  }
}
```

### React Root Mount
```js
// Source: https://react.dev/reference/react-dom/client/createRoot
import { createRoot } from 'react-dom/client'

const domNode = document.getElementById('root')
const root = createRoot(domNode)
root.render(<App />)
```

**Important gap:** I did not find a verified public web example for the exact Bitwig API call chain to observe the active `Instrument Selector` layer. Plan an implementation spike to validate that chain inside Bitwig's in-app developer documentation and/or a minimal extension prototype before committing detailed downstream tasks.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling or UI-driven state inference | Event-driven controller extension observers | Current best practice for Bitwig/controller integrations | Lower latency, fewer false updates |
| WebSocket-first local sync | SSE for one-way display streaming | Mature browser support; MDN baseline notes SSE widely available since 2020 | Simpler reconnect story for read-only displays |
| Desktop shell for "app feel" | Single browser UI with Fullscreen API | Modern browser APIs are sufficient for local stage display | Fewer runtimes and packaging paths |
| Raw DAW names shown directly | Alias layer between source state and performer display | Common pattern in live tools where internal names are not stage-friendly | Better glanceability and trust |

**Deprecated/outdated:**
- Polling the Bitwig UI: fragile and not truthful enough for a live-display product.
- Assuming Node 24 for Fastify 5 by default: current Fastify v5 support docs still list Node 20 and 22.

## Open Questions

1. **What is the exact Bitwig observer chain for the active `Instrument Selector` layer?**
   - What we know: the official path is a Bitwig controller extension, and Bitwig documents controller scripting in-app plus via the official extensions repo.
   - What's unclear: the precise object/observer sequence needed to track the active selector layer truthfully on the user's Bitwig version.
   - Recommendation: make this the first implementation spike and gate detailed downstream tasks on a verified prototype.

2. **Does the Bitwig API expose a stable per-layer identity for alias persistence?**
   - What we know: stable aliases are required, and raw-name-only keys are unsafe.
   - What's unclear: whether the API provides a durable ID or only names/indexes/path-like references.
   - Recommendation: prefer a stable API identity if available; otherwise use `{selectorName, layerIndex}` for Phase 1 and document reorder/remap behavior explicitly.

3. **What freshness thresholds feel truthful in rehearsal?**
   - What we know: the UI must distinguish `live`, `stale`, and `disconnected`.
   - What's unclear: the best thresholds for this rig and switching speed.
   - Recommendation: start with conservative thresholds and tune during live-style rehearsal, but implement the state machine in Wave 0 so threshold tuning stays additive.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected yet - recommend `Vitest + React Testing Library` for unit/integration and `Playwright` for browser smoke |
| Config file | `vite.config.ts` with `test` block, plus `playwright.config.ts` - none exist yet |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm run test:unit && npm run test:e2e` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISP-01 | Stage view renders the active stage label with dominant, readable display semantics | browser component | `npm run test:unit -- src/ui/StageDisplay.test.tsx -t "renders dominant stage label"` | ❌ Wave 0 |
| DISP-02 | Performer can enter and exit dedicated fullscreen stage mode | e2e smoke | `npm run test:e2e -- tests/stage-mode.spec.ts` | ❌ Wave 0 |
| DISP-03 | UI updates immediately when a new source event arrives | integration | `npm run test:unit -- src/state/live-state.spec.ts -t "applies latest instrument event immediately"` | ❌ Wave 0 |
| DISP-04 | UI moves between `live`, `stale`, and `disconnected` based on heartbeat/update age | integration | `npm run test:unit -- src/state/connection-status.spec.ts` | ❌ Wave 0 |
| LABL-01 | Alias resolution returns the configured stage label for a layer identity | integration | `npm run test:unit -- src/labels/alias-store.spec.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:unit`
- **Per wave merge:** `npm run test:unit && npm run test:e2e`
- **Phase gate:** Full suite green plus one manual distance-readability rehearsal before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `package.json` - workspace currently has no app/test scaffold
- [ ] `vite.config.ts` - Vite/Vitest config
- [ ] `playwright.config.ts` - browser smoke test config
- [ ] `src/ui/StageDisplay.test.tsx` - covers `DISP-01`
- [ ] `tests/stage-mode.spec.ts` - covers `DISP-02`
- [ ] `src/state/live-state.spec.ts` - covers `DISP-03`
- [ ] `src/state/connection-status.spec.ts` - covers `DISP-04`
- [ ] `src/labels/alias-store.spec.ts` - covers `LABL-01`
- [ ] Framework install: `npm create vite@latest . -- --template react-ts && npm install fastify && npm install -D vitest @testing-library/react @testing-library/dom @playwright/test typescript`

## Sources

### Primary (HIGH confidence)
- Bitwig support: `.js` scripts and `.bwextension` Java extensions are the official installable integration paths - https://www.bitwig.com/support/technical_support/how-do-i-add-a-controller-extension-or-script-17/
- Bitwig official extensions repository README: controller scripting guide and API reference are available in Bitwig under `Help > Documentation > Developer Resources` - https://raw.githubusercontent.com/bitwig/bitwig-extensions/main/README.md
- Bitwig user guide: `Instrument Selector` semantics and switching modes - https://www.bitwig.com/userguide/latest/container/
- Fastify v5 LTS reference: supported Node lines listed for Fastify 5 - https://fastify.dev/docs/v5.0.x/Reference/LTS/
- Fastify getting started guide: server bootstrap and plugin-loading conventions - https://fastify.dev/docs/latest/Guides/Getting-Started/
- Node.js releases page: Node 24 is Active LTS and Node 22 is Maintenance LTS as of 2026-03-07 - https://nodejs.org/en/about/releases/
- React 19 stable release / `createRoot` reference - https://react.dev/blog/2024/12/05/react-19 and https://react.dev/reference/react-dom/client/createRoot
- Vite 6 announcement and guide - https://vite.dev/blog/announcing-vite6 and https://vite.dev/guide/
- MDN SSE guide - https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
- MDN Fullscreen API reference - https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
- Vitest guide - https://vitest.dev/guide/
- React Testing Library intro - https://testing-library.com/docs/react-testing-library/intro/
- Playwright intro - https://playwright.dev/docs/intro

### Secondary (MEDIUM confidence)
- Web search cross-check: Fastify v5 still documented against Node 20/22, not 24 - verified against Fastify LTS docs
- Web search cross-check: public web results do not expose a definitive Bitwig `Instrument Selector` observer example; supports treating this as an implementation spike rather than assumed knowledge

### Tertiary (LOW confidence)
- None relied upon for core planning decisions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - official docs cover Bitwig extension packaging, Fastify/Node compatibility, browser APIs, and the web stack
- Architecture: MEDIUM - the bridge pattern is strong, but the exact Bitwig observer chain is still unverified on the public web
- Pitfalls: HIGH - corroborated by project research plus official browser/runtime docs and the live-truthfulness requirements themselves

**Research date:** 2026-03-07
**Valid until:** 2026-04-06
