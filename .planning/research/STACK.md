# Technology Stack

**Project:** Bitwig Stage Display  
**Researched:** 2026-03-07  
**Scope:** Standard 2025 stack for a laptop-first, phone-second, local Bitwig live companion  
**Overall recommendation:** Use a `Bitwig .bwextension` as the source of truth, a single local `Node.js` companion service as the bridge, and one browser UI served to both laptop and phone.

## Executive Recommendation

For this project, the boring and reliable stack is:

1. **Bitwig integration:** a JVM-based Bitwig controller extension packaged as a `.bwextension`
2. **Local bridge:** a single `Node.js 24 LTS` service using `Fastify 5`
3. **Push protocol:** `HTTP POST` from Bitwig extension to localhost, then `SSE` from localhost to browser clients
4. **UI:** one responsive `React 19` + `TypeScript 5` + `Vite 6` app rendered full-screen on the laptop and opened in a phone browser over LAN
5. **Join flow:** fixed local port plus QR code; treat `mDNS/Bonjour` as optional convenience, not required infrastructure

This is the best fit because the live requirement is not "fancy desktop app." It is "show the right instrument name immediately, every time, with the fewest moving parts." A single local service and a single web UI gives you one rendering path, one state model, and one fallback story: if the phone drops, the laptop keeps working.

## Recommended Stack

### Bitwig Integration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Bitwig controller extension | `.bwextension` (Java extension format) | Read current `Instrument Selector` state inside Bitwig | This is the official extension path Bitwig documents for Java-based integrations, and it avoids screen-scraping or MIDI-loopback hacks | HIGH |
| JVM runtime target | `Java 21` | Stable target for the extension build | Modern LTS baseline, good tooling, and a safer long-lived choice than older JVM targets | MEDIUM |
| Language | `Kotlin 2.x` targeting JVM | Author the extension code | Kotlin gives a cleaner, more typed codebase than ad hoc JS controller scripts while still shipping as a standard JVM extension | MEDIUM |
| Bitwig API | Official controller extension API | Observe selector/layer/device state | This is the only credible source of truth for current selector state inside Bitwig | HIGH |

**Prescriptive choice:** build the Bitwig side as a Kotlin JVM project that outputs a `.bwextension`.

**Why this over a `.js` controller script:** Bitwig supports both `.js` scripts and `.bwextension` Java extensions, but the official extensions repo is Java-based, and JVM extensions are the better fit once you need typed code, packaging, and local bridge communication. For a stage tool, fewer ad hoc runtime edges matters more than faster initial scripting.

**Important caveat:** the exact observer chain for "currently active `Instrument Selector` layer" is not well documented on the public web. The first implementation spike should verify the precise Bitwig API path on your Bitwig version. Stack-wise, the correct answer is still "controller extension first," not polling the UI.

### Local Companion Service

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Node.js | `24.x LTS` | Run the local companion process | Current Active LTS, production-safe, and the least surprising runtime for a tiny local HTTP push service | HIGH |
| Fastify | `5.x` | Serve assets, health endpoints, and local API routes | Small, fast, stable, and simpler than heavier full-stack frameworks for a localhost utility | HIGH |
| Static asset serving | Fastify static plugin or equivalent | Serve the laptop/phone UI from the same process | One process, one port, one failure domain | HIGH |

**Prescriptive choice:** one local Node process bound to `127.0.0.1` by default, with optional LAN binding only when phone display mode is enabled.

That default matters on stage. In plain terms, "localhost first" means the laptop view does not depend on Wi-Fi, hotspot quality, or whether the phone is even present. The phone is an add-on consumer of the same state, not a dependency.

### Transport and Realtime Sync

| Link | Protocol | Library/Tool | Why | Confidence |
|------|----------|--------------|-----|------------|
| Bitwig extension -> companion | `HTTP POST` to `127.0.0.1` | JVM HTTP client | Easy to debug, low message volume, and no need to hold open a socket from Bitwig for simple state pushes | MEDIUM |
| Companion -> laptop and phone browsers | `SSE` (Server-Sent Events) | Native browser `EventSource` | One-way updates fit this use case, and SSE has built-in reconnect behavior that is friendlier on flaky mobile connections than a custom WebSocket heartbeat loop | MEDIUM |
| Optional future bidirectional control | `WebSocket` | `@fastify/websocket` | Only add if the phone will send commands back into the system later | MEDIUM |

**Prescriptive choice:** use `HTTP POST` for ingress and `SSE` for fan-out.

This is the key design call. A display companion is mostly one-way data: Bitwig changes, screens update. `SSE` is a better default than `WebSocket` because it is simpler, reconnects automatically, and does not ask you to solve bidirectional session management before you need it.

### Browser UI

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React | `19.x` | UI rendering | Still the most standard, maintainable browser UI choice in 2025 for a small team or solo builder | HIGH |
| TypeScript | `5.x` | Typed UI and bridge contracts | Prevents state-shape drift between extension payloads and rendered UI | HIGH |
| Vite | `6.x` | Frontend build and dev server | Current mainstream frontend toolchain with fast local iteration and low config overhead | HIGH |
| Styling | Plain CSS with CSS variables | High-contrast stage display styling | A tiny app does not need a design system or utility CSS framework; simple CSS is easier to trust and debug | HIGH |

**Prescriptive choice:** one responsive SPA with no client router and no global state library.

Keep the UI surface brutally simple:

- a full-screen laptop view
- a phone-safe responsive view from the same app
- a tiny settings/join screen if needed

Do not introduce Redux, Zustand, Tailwind, or a component library for v1. They solve problems this product does not have yet.

### Local Join and Discovery

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Fixed local URL + port | e.g. `http://127.0.0.1:8799` locally, LAN IP for phone | Deterministic access | Most reliable path on stage is the one you can type and troubleshoot by hand | HIGH |
| QR code generation | `qrcode` | Fast phone join flow | Removes typing friction without adding network complexity | MEDIUM |
| Optional service discovery | `bonjour` only if needed | Friendly `.local` discovery | Helpful convenience, but should never be required for the system to function | LOW |

**Prescriptive choice:** use a fixed port and QR code first. Treat Bonjour/mDNS as optional sugar.

This is a live-performance reliability issue, not just DX. Discovery protocols are nice when they work, but a fixed URL and QR code give you a deterministic fallback when a venue network behaves strangely.

## Recommended Data Contract

The extension should publish a small, explicit payload like:

```json
{
  "selectorName": "Instrument Selector",
  "selectedIndex": 3,
  "selectedLayerName": "Lead",
  "updatedAt": "2026-03-07T12:34:56.789Z",
  "source": "bitwig"
}
```

Keep this contract narrow. Do not send full project state, device trees, or Bitwig internals to the browser. The browser needs the current stage label, not a DAW mirror.

## What Not To Use

| Avoid | Why Not |
|-------|---------|
| `Electron` or `Tauri` for v1 | You already need a browser-delivered UI for the phone. Adding a desktop shell gives you another runtime, another packaging path, and another failure mode without improving the core live-display job |
| `WebRTC` / P2P sync | Overkill for a one-laptop local broadcaster. Discovery, pairing, and reconnect logic add fragility for no operational gain |
| Cloud relay, hosted backend, or remote database | A stage display should not depend on Internet reachability |
| Polling the Bitwig UI or reading screen pixels | Wrong source of truth, fragile, and likely to fail under layout or theme changes |
| MIDI loopback or OSC as the primary state bridge | Fine for some controller workflows, but a poor fit for "show the active selector layer name" unless you manually recreate naming/state logic outside Bitwig |
| Heavy frontend state or styling stacks | Unnecessary surface area for a single-screen display app |

## Implementation Order Implied By This Stack

1. **Laptop-only path first**
   - Bitwig `.bwextension`
   - local Node service
   - local browser display on the same laptop
2. **Phone mirror second**
   - LAN bind toggle
   - QR code join flow
   - SSE fan-out to a second browser client
3. **Optional polish later**
   - Bonjour discovery
   - auto-launch helper
   - bidirectional control via WebSocket only if you later need remote commands

## Final Recommendation

If you want the standard 2025 stack that is most likely to survive real stage use, build this as:

- `Kotlin` -> JVM -> Bitwig `.bwextension`
- `Node.js 24 LTS` + `Fastify 5`
- `HTTP POST` from Bitwig into localhost
- `SSE` from localhost to browser clients
- `React 19` + `TypeScript 5` + `Vite 6`
- fixed local port + QR code

That stack optimizes for the right thing: low setup, clear failure boundaries, and a laptop display that still works when the phone path does not.

## Sources

### Official / high confidence

- Bitwig support: controller integrations are installed as `.js` scripts or `.bwextension` Java extensions  
  [https://www.bitwig.com/support/technical_support/how-do-i-add-a-controller-extension-or-script-17/](https://www.bitwig.com/support/technical_support/how-do-i-add-a-controller-extension-or-script-17/)
- Bitwig user guide: controller API documentation is provided from Bitwig's Dashboard Help/Documentation flow  
  [https://www.bitwig.com/userguide/latest/midi_controllers](https://www.bitwig.com/userguide/latest/midi_controllers)
- Bitwig user guide: `Instrument Selector` is the relevant container concept for this project  
  [https://www.bitwig.com/userguide/latest/container/](https://www.bitwig.com/userguide/latest/container/)
- Official Bitwig extensions repository is Java-based  
  [https://github.com/bitwig/bitwig-extensions](https://github.com/bitwig/bitwig-extensions)
- Node.js release policy and current LTS lines  
  [https://nodejs.org/en/about/releases/](https://nodejs.org/en/about/releases/)
- Vite 6 official announcement  
  [https://vite.dev/blog/announcing-vite6](https://vite.dev/blog/announcing-vite6)
- React 19 official release  
  [https://react.dev/blog/2024/12/05/react-19](https://react.dev/blog/2024/12/05/react-19)
- Fastify v5 LTS reference  
  [https://fastify.dev/docs/v5.0.x/Reference/LTS](https://fastify.dev/docs/v5.0.x/Reference/LTS)

### Community / medium confidence

- `typed-bitwig-api` indicates an actively maintained TS typing ecosystem for Bitwig scripting, but this project is still better served by a JVM extension  
  [https://github.com/joslarson/typed-bitwig-api](https://github.com/joslarson/typed-bitwig-api)
- Community Bitwig/WebSocket bridge examples exist, which supports the feasibility of local bridge patterns  
  [https://github.com/jhorology/bitwig-websocket-rpc](https://github.com/jhorology/bitwig-websocket-rpc)
- `@fastify/websocket` is the standard Fastify WebSocket path if bidirectional control is added later  
  [https://www.npmjs.com/package/@fastify/websocket](https://www.npmjs.com/package/@fastify/websocket)
- `qrcode` is a standard Node/browser QR generation package for join flow  
  [https://www.npmjs.com/package/qrcode](https://www.npmjs.com/package/qrcode)

### Low confidence / optional only

- `bonjour` is a plausible zero-config discovery add-on, but should not be treated as a hard dependency for live reliability  
  [https://www.npmjs.com/package/bonjour](https://www.npmjs.com/package/bonjour)
