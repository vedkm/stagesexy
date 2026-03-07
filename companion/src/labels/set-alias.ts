import { createAliasStore } from "./alias-store";
import type { AliasRecord } from "../types/stage";

const DEFAULT_ALIAS_FILE_PATH = ".stage-display/aliases.json";
const USAGE =
  "Usage: npm --prefix companion run alias:set -- --layer-key <value> --stage-label <value>";

export async function runSetAliasCommand(
  argv: string[] = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env,
): Promise<AliasRecord> {
  const record = parseSetAliasArguments(argv);
  const aliasStore = await createAliasStore({
    filePath: resolveAliasFilePath(env),
  });

  await aliasStore.setAlias(record);

  return record;
}

function parseSetAliasArguments(argv: string[]): AliasRecord {
  const values = new Map<string, string>();

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];

    if (flag !== "--layer-key" && flag !== "--stage-label") {
      throw new Error(`Unexpected argument: ${flag}. ${USAGE}`);
    }

    const value = argv[index + 1];

    if (value === undefined) {
      throw new Error(
        `${flag} must be provided. ${USAGE}`,
      );
    }

    values.set(flag, value);
    index += 1;
  }

  const layerKey = values.get("--layer-key");

  if (layerKey === undefined) {
    throw new Error(`--layer-key must be provided. ${USAGE}`);
  }

  if (layerKey.trim() === "") {
    throw new Error("--layer-key must be a non-empty string.");
  }

  const stageLabel = values.get("--stage-label");

  if (stageLabel === undefined) {
    throw new Error(`--stage-label must be provided. ${USAGE}`);
  }

  if (stageLabel.trim() === "") {
    throw new Error("--stage-label must be a non-empty string.");
  }

  return {
    layerKey: layerKey.trim(),
    stageLabel: stageLabel.trim(),
  };
}

function resolveAliasFilePath(env: NodeJS.ProcessEnv): string {
  return env.COMPANION_ALIAS_FILE_PATH?.trim() || DEFAULT_ALIAS_FILE_PATH;
}

async function main(): Promise<void> {
  const record = await runSetAliasCommand();

  process.stdout.write(
    `Saved stage label \"${record.stageLabel}\" for layer key \"${record.layerKey}\".\n`,
  );
}

if (import.meta.main) {
  await main();
}
