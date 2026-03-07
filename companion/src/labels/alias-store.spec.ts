import { describe, expect, it } from "vitest";

import { resolveStageLabel } from "./alias-store";
import type { AliasRecord } from "../types/stage";

describe("resolveStageLabel", () => {
  const aliases: AliasRecord[] = [
    {
      layerKey: "main-selector:1",
      stageLabel: "Piano Intro",
    },
  ];

  it("returns the configured alias for a matching layer key", () => {
    expect(resolveStageLabel("main-selector:1", "Concert Grand", aliases)).toBe(
      "Piano Intro",
    );
  });

  it("falls back to the raw name when no alias exists", () => {
    expect(resolveStageLabel("main-selector:3", "Air Vox", aliases)).toBe(
      "Air Vox",
    );
  });
});
