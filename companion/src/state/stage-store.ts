import { resolveStageLabel } from "../labels/alias-store";
import {
  DEFAULT_FRESHNESS_THRESHOLDS,
  type FreshnessThresholds,
  resolveConnectionStatus,
} from "./connection-status";
import type {
  NormalizedInstrumentEvent,
  SelectorLayer,
  StageLayer,
  StageSnapshot,
} from "../types/stage";

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
  const layers = buildStageLayers(event, resolveLabel);
  const snapshot: StageSnapshot = {
    selectorName: event.selectorName,
    layerKey: event.layerKey,
    rawName: event.rawName,
    displayLabel: resolveLabel(event.layerKey, event.rawName),
    layers,
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
    layers: [],
    status: "disconnected",
    sequence: 0,
    occurredAt: null,
    updatedAt: null,
  };
}

function buildStageLayers(
  event: NormalizedInstrumentEvent,
  resolveLabel: (layerKey: string | null, rawName: string | null) => string,
): StageLayer[] {
  return normalizeEventLayers(event).map((layer) => ({
    ...layer,
    displayLabel: resolveLabel(layer.layerKey, layer.rawName),
    isActive: layer.layerKey === event.layerKey,
  }));
}

function normalizeEventLayers(event: NormalizedInstrumentEvent): SelectorLayer[] {
  const candidateLayers =
    event.layers && event.layers.length > 0
      ? event.layers
      : [{ layerKey: event.layerKey, rawName: event.rawName }];

  const uniqueLayers = new Map<string, SelectorLayer>();

  for (const layer of candidateLayers) {
    if (
      typeof layer.layerKey !== "string" ||
      layer.layerKey.trim().length === 0 ||
      typeof layer.rawName !== "string" ||
      layer.rawName.trim().length === 0
    ) {
      continue;
    }

    uniqueLayers.set(layer.layerKey.trim(), {
      layerKey: layer.layerKey.trim(),
      rawName: layer.rawName.trim(),
    });
  }

  if (!uniqueLayers.has(event.layerKey)) {
    uniqueLayers.set(event.layerKey, {
      layerKey: event.layerKey,
      rawName: event.rawName,
    });
  }

  return [...uniqueLayers.values()];
}
