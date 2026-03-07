import type { NormalizedInstrumentEvent, StageSnapshot } from "../types/stage";

export interface StageStore {
  applyEvent(event: NormalizedInstrumentEvent): StageSnapshot;
  getSnapshot(): StageSnapshot;
}

export function createStageStore(): StageStore {
  return {
    applyEvent() {
      throw new Error("applyEvent is not implemented yet.");
    },
    getSnapshot() {
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
    },
  };
}
