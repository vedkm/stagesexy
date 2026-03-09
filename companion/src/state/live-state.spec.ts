import { describe, expect, it } from "vitest";

import { createStageStore } from "./stage-store";
import type { NormalizedInstrumentEvent } from "../types/stage";

describe("createStageStore", () => {
  it("applies the latest instrument event immediately", () => {
    const store = createStageStore();
    const event: NormalizedInstrumentEvent = {
      source: "bitwig",
      selectorName: "Main Selector",
      layerKey: "main-selector:2",
      rawName: "Raw Lead",
      layers: [
        { layerKey: "main-selector:0", rawName: "Piano Intro" },
        { layerKey: "main-selector:1", rawName: "Warm Pad" },
        { layerKey: "main-selector:2", rawName: "Raw Lead" },
      ],
      sequence: 12,
      occurredAt: "2026-03-07T12:00:00.000Z",
    };

    const snapshot = store.applyEvent(event);

    expect(snapshot).toEqual({
      selectorName: "Main Selector",
      layerKey: "main-selector:2",
      rawName: "Raw Lead",
      displayLabel: "Raw Lead",
      layers: [
        {
          layerKey: "main-selector:0",
          rawName: "Piano Intro",
          displayLabel: "Piano Intro",
          isActive: false,
        },
        {
          layerKey: "main-selector:1",
          rawName: "Warm Pad",
          displayLabel: "Warm Pad",
          isActive: false,
        },
        {
          layerKey: "main-selector:2",
          rawName: "Raw Lead",
          displayLabel: "Raw Lead",
          isActive: true,
        },
      ],
      status: "live",
      sequence: 12,
      occurredAt: "2026-03-07T12:00:00.000Z",
      updatedAt: "2026-03-07T12:00:00.000Z",
    });
  });
});
