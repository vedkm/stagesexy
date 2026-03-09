import { describe, expect, it } from "vitest";

import {
  DEFAULT_FRESHNESS_THRESHOLDS,
  resolveConnectionStatus,
} from "./connection-status";
import type { StageSnapshot } from "../types/stage";

const baseSnapshot: StageSnapshot = {
  selectorName: "Main Selector",
  layerKey: "main-selector:1",
  rawName: "Warm Pad",
  displayLabel: "Warm Pad",
  layers: [
    {
      layerKey: "main-selector:1",
      rawName: "Warm Pad",
      displayLabel: "Warm Pad",
      isActive: true,
    },
  ],
  status: "live",
  sequence: 9,
  occurredAt: "2026-03-07T12:00:00.000Z",
  updatedAt: "2026-03-07T12:00:00.000Z",
};

describe("resolveConnectionStatus", () => {
  it("keeps recent stage data live", () => {
    const status = resolveConnectionStatus(
      baseSnapshot,
      new Date("2026-03-07T12:00:00.500Z"),
      DEFAULT_FRESHNESS_THRESHOLDS,
    );

    expect(status).toBe("live");
  });

  it("marks stage data stale after the freshness threshold", () => {
    const status = resolveConnectionStatus(
      baseSnapshot,
      new Date("2026-03-07T12:00:02.000Z"),
      DEFAULT_FRESHNESS_THRESHOLDS,
    );

    expect(status).toBe("stale");
  });

  it("marks stage data disconnected after the disconnect threshold", () => {
    const status = resolveConnectionStatus(
      baseSnapshot,
      new Date("2026-03-07T12:00:06.000Z"),
      DEFAULT_FRESHNESS_THRESHOLDS,
    );

    expect(status).toBe("disconnected");
  });
});
