---
phase: 1
slug: truthful-laptop-display
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-07
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + React Testing Library + Playwright |
| **Config file** | `vite.config.ts`, `playwright.config.ts` |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm run test:unit && npm run test:e2e` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit`
- **After every plan wave:** Run `npm run test:unit && npm run test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green plus one manual distance-readability rehearsal
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | DISP-01 | unit | `npm run test:unit -- src/ui/StageDisplay.test.tsx -t "renders dominant stage label"` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 0 | DISP-03 | integration | `npm run test:unit -- src/state/live-state.spec.ts -t "applies latest instrument event immediately"` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 0 | DISP-04 | integration | `npm run test:unit -- src/state/connection-status.spec.ts` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | DISP-02 | e2e smoke | `npm run test:e2e -- tests/stage-mode.spec.ts` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 1 | LABL-01 | integration | `npm run test:unit -- src/labels/alias-store.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` — workspace scaffold and test scripts
- [ ] `vite.config.ts` — Vite and Vitest configuration
- [ ] `playwright.config.ts` — browser smoke configuration
- [ ] `src/ui/StageDisplay.test.tsx` — covers `DISP-01`
- [ ] `tests/stage-mode.spec.ts` — covers `DISP-02`
- [ ] `src/state/live-state.spec.ts` — covers `DISP-03`
- [ ] `src/state/connection-status.spec.ts` — covers `DISP-04`
- [ ] `src/labels/alias-store.spec.ts` — covers `LABL-01`
- [ ] `npm create vite@latest . -- --template react-ts && npm install fastify && npm install -D vitest @testing-library/react @testing-library/dom @playwright/test typescript` — install base stack and test tooling

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stage label remains readable from performance distance under live-like lighting | DISP-01 | Readability and glanceability are human factors that automated tests cannot validate | Open stage mode on the actual laptop, stand at performance distance, and confirm the current label is readable without leaning in |
| `live`, `stale`, and `disconnected` states are interpreted truthfully by the performer | DISP-04 | The semantics are partly UX trust, not only state transitions | Rehearse normal switching, then stop the source feed and confirm the UI clearly stops implying the previous label is current |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 45s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
