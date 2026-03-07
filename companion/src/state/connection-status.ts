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
  snapshot: StageSnapshot,
  now: Date,
  thresholds: FreshnessThresholds = DEFAULT_FRESHNESS_THRESHOLDS,
): ConnectionStatus {
  if (!snapshot.updatedAt) {
    return "disconnected";
  }

  const updatedAt = new Date(snapshot.updatedAt);

  if (Number.isNaN(updatedAt.getTime())) {
    return "disconnected";
  }

  const elapsedMs = now.getTime() - updatedAt.getTime();

  if (elapsedMs >= thresholds.disconnectedAfterMs) {
    return "disconnected";
  }

  if (elapsedMs >= thresholds.staleAfterMs) {
    return "stale";
  }

  return "live";
}
