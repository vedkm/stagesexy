import type { ConnectionStatus, StageSnapshot } from "../types/stage";

export interface FreshnessThresholds {
  staleAfterMs: number;
  disconnectedAfterMs: number;
}

export const DEFAULT_FRESHNESS_THRESHOLDS: FreshnessThresholds = {
  staleAfterMs: 1_500,
  disconnectedAfterMs: 5_000,
};

export function resolveConnectionStatus(
  _snapshot: StageSnapshot,
  _now: Date,
  _thresholds: FreshnessThresholds = DEFAULT_FRESHNESS_THRESHOLDS,
): ConnectionStatus {
  throw new Error("resolveConnectionStatus is not implemented yet.");
}
