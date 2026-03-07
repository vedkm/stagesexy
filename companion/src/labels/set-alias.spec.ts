import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runSetAliasCommand } from "./set-alias";

let activeDirectory: string | null = null;

afterEach(async () => {
  if (activeDirectory) {
    await rm(activeDirectory, { recursive: true, force: true });
    activeDirectory = null;
  }
});

describe("runSetAliasCommand", () => {
  it("persists a non-empty layer key and stage label through the alias store", async () => {
    const aliasFilePath = await createAliasFilePath();

    await runSetAliasCommand(
      ["--layer-key", "main-selector:1", "--stage-label", "Piano Intro"],
      {
        COMPANION_ALIAS_FILE_PATH: aliasFilePath,
      },
    );

    await expect(readFile(aliasFilePath, "utf8")).resolves.toContain(
      "\"stageLabel\": \"Piano Intro\"",
    );
  });

  it("fails fast when required arguments are blank or missing", async () => {
    const aliasFilePath = await createAliasFilePath();

    await expect(
      runSetAliasCommand(["--layer-key", "", "--stage-label", "Lead"], {
        COMPANION_ALIAS_FILE_PATH: aliasFilePath,
      }),
    ).rejects.toThrow("--layer-key must be a non-empty string.");

    await expect(
      runSetAliasCommand(["--layer-key", "main-selector:1"], {
        COMPANION_ALIAS_FILE_PATH: aliasFilePath,
      }),
    ).rejects.toThrow("--stage-label must be provided.");
  });

  it("replaces the existing alias for the same layer key instead of duplicating it", async () => {
    const aliasFilePath = await createAliasFilePath();

    await runSetAliasCommand(
      ["--layer-key", "main-selector:1", "--stage-label", "Piano Intro"],
      {
        COMPANION_ALIAS_FILE_PATH: aliasFilePath,
      },
    );

    await runSetAliasCommand(
      ["--layer-key", "main-selector:1", "--stage-label", "Big Piano"],
      {
        COMPANION_ALIAS_FILE_PATH: aliasFilePath,
      },
    );

    await expect(readFile(aliasFilePath, "utf8")).resolves.toBe(
      [
        "[",
        "  {",
        '    "layerKey": "main-selector:1",',
        '    "stageLabel": "Big Piano"',
        "  }",
        "]",
        "",
      ].join("\n"),
    );
  });
});

async function createAliasFilePath(): Promise<string> {
  activeDirectory = await mkdtemp(join(tmpdir(), "stage-display-set-alias-"));

  return join(activeDirectory, "aliases.json");
}
