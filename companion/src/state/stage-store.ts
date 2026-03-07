import { resolveStageLabel } from "../labels/alias-store";
import {
  DEFAULT_FRESHNESS_THRESHOLDS,
  type FreshnessThresholds,
  resolveConnectionStatus,
} from "./connection-status";
import type { NormalizedInstrumentEvent, StageSnapshot } from "../types/stage";

export interface SnapshotOptions {
  now?: Date;
  resolveLabel?: (layerKey: string | null, rawName: string | null) => string;
}

export interface StageStore {
  applyEvent(event: NormalizedInstrumentEvent, options?: SnapshotOptions): StageSnapshot;
  getSnapshot(options?: SnapshotOptions): StageSnapshot;
}

export interface StageStoreOptions {
  now?: () => Date;
  thresholds?: FreshnessThresholds;
}

export function createStageStore(options: StageStoreOptions = {}): StageStore {
  const getNow = options.now ?? (() => new Date());
  const thresholds = options.thresholds ?? DEFAULT_FRESHNESS_THRESHOLDS;

  let currentEvent: NormalizedInstrumentEvent | null = null;

  return {
    applyEvent(event, snapshotOptions) {
      if (currentEvent && event.sequence < currentEvent.sequence) {
        return buildSnapshot(currentEvent, snapshotOptions, getNow, thresholds);
      }

      currentEvent = event;

      return buildSnapshot(
        currentEvent,
        {
          ...snapshotOptions,
          now: snapshotOptions?.now ?? new Date(event.occurredAt),
        },
        getNow,
        thresholds,
      );
    },
    getSnapshot(snapshotOptions) {
      return buildSnapshot(currentEvent, snapshotOptions, getNow, thresholds);
    },
  };
}

function buildSnapshot(
  event: NormalizedInstrumentEvent | null,
  options: SnapshotOptions | undefined,
  getNow: () => Date,
  thresholds: FreshnessThresholds,
): StageSnapshot {
  if (!event) {
    return createDisconnectedSnapshot();
  }

  const resolveLabel =
    options?.resolveLabel ??
    ((layerKey: string | null, rawName: string | null) =>
      resolveStageLabel(layerKey, rawName, []));

  const updatedAt = event.occurredAt;
  const snapshot: StageSnapshot = {
    selectorName: event.selectorName,
    layerKey: event.layerKey,
    rawName: event.rawName,
    displayLabel: resolveLabel(event.layerKey, event.rawName),
    status: "live",
    sequence: event.sequence,
    occurredAt: event.occurredAt,
    updatedAt,
  };

  return {
    ...snapshot,
    status: resolveConnectionStatus(snapshot, options?.now ?? getNow(), thresholds),
  };
}

function createDisconnectedSnapshot(): StageSnapshot {
  return {
    selectorName: "",
    layerKey: null,
    rawName: null,
    displayLabel: "Waiting for instrument data",
    status: "disconnected",
    sequence: 0,
    occurredAt: null,
    updatedAt: null,
  };
}
