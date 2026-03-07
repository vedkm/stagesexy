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
      sequence: 12,
      occurredAt: "2026-03-07T12:00:00.000Z",
    };

    const snapshot = store.applyEvent(event);

    expect(snapshot).toEqual({
      selectorName: "Main Selector",
      layerKey: "main-selector:2",
      rawName: "Raw Lead",
      displayLabel: "Raw Lead",
      status: "live",
      sequence: 12,
      occurredAt: "2026-03-07T12:00:00.000Z",
      updatedAt: "2026-03-07T12:00:00.000Z",
    });
  });
});
