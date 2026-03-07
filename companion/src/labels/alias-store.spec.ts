import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createAliasStore, resolveStageLabel } from "./alias-store";
import type { AliasRecord } from "../types/stage";

let activeDirectory: string | null = null;

afterEach(async () => {
  if (activeDirectory) {
    await rm(activeDirectory, { recursive: true, force: true });
    activeDirectory = null;
  }
});

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

  it("persists aliases with an atomic file write", async () => {
    activeDirectory = await mkdtemp(join(tmpdir(), "stage-aliases-"));

    const aliasFilePath = join(activeDirectory, "aliases.json");
    const store = await createAliasStore({ filePath: aliasFilePath });

    await store.setAlias({
      layerKey: "main-selector:2",
      stageLabel: "Lead Stack",
    });

    await expect(store.list()).resolves.toEqual([
      {
        layerKey: "main-selector:2",
        stageLabel: "Lead Stack",
      },
    ]);

    await expect(readFile(aliasFilePath, "utf8")).resolves.toContain(
      "\"Lead Stack\"",
    );
  });
});
