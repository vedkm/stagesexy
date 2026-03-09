import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StageDisplay } from "./StageDisplay";
import type { StageSnapshot } from "../types/stage";

describe("StageDisplay", () => {
  it("renders the dominant stage label and live status", () => {
    const snapshot: StageSnapshot = {
      selectorName: "Main Selector",
      layerKey: "main-selector:1",
      rawName: "Concert Grand",
      displayLabel: "Piano Intro",
      layers: [
        {
          layerKey: "main-selector:0",
          rawName: "Warm Pad",
          displayLabel: "Warm Pad",
          isActive: false,
        },
        {
          layerKey: "main-selector:1",
          rawName: "Concert Grand",
          displayLabel: "Piano Intro",
          isActive: true,
        },
        {
          layerKey: "main-selector:2",
          rawName: "Noise Lead",
          displayLabel: "Noise Lead",
          isActive: false,
        },
      ],
      status: "live",
      sequence: 14,
      occurredAt: "2026-03-07T12:00:00.000Z",
      updatedAt: "2026-03-07T12:00:00.000Z",
    };

    render(<StageDisplay snapshot={snapshot} />);

    expect(
      screen.getByRole("heading", { name: "Piano Intro" }),
    ).toBeInTheDocument();
    expect(screen.getByText("live")).toBeInTheDocument();
    expect(screen.getAllByText("Keys").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Selector stack")).toBeInTheDocument();
    expect(screen.getByText("Warm Pad")).toBeInTheDocument();
    expect(screen.getAllByText("Piano Intro").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("Concert Grand")).not.toBeInTheDocument();
  });

  it("renders stale status without implying the data is live", () => {
    const snapshot: StageSnapshot = {
      selectorName: "Main Selector",
      layerKey: "main-selector:2",
      rawName: "Noise Lead",
      displayLabel: "Noise Lead",
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
          rawName: "Noise Lead",
          displayLabel: "Noise Lead",
          isActive: true,
        },
      ],
      status: "stale",
      sequence: 15,
      occurredAt: "2026-03-07T12:00:00.000Z",
      updatedAt: "2026-03-07T12:00:03.000Z",
    };

    render(<StageDisplay snapshot={snapshot} />);

    expect(screen.getByText("stale")).toBeInTheDocument();
    expect(screen.getAllByText("Lead Synth").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("live")).not.toBeInTheDocument();
  });
});
