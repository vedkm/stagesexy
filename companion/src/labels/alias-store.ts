import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { AliasRecord } from "../types/stage";

export const DEFAULT_STAGE_LABEL = "Waiting for instrument data";

export interface AliasStore {
  list(): Promise<AliasRecord[]>;
  setAlias(record: AliasRecord): Promise<void>;
}

export interface AliasStoreOptions {
  filePath: string;
}

export function resolveStageLabel(
  layerKey: string | null,
  rawName: string | null,
  aliases: AliasRecord[],
): string {
  if (layerKey) {
    const match = aliases.find((alias) => alias.layerKey === layerKey);

    if (match) {
      return match.stageLabel;
    }
  }

  if (rawName && rawName.trim().length > 0) {
    return rawName;
  }

  return DEFAULT_STAGE_LABEL;
}

export async function createAliasStore(
  options: AliasStoreOptions,
): Promise<AliasStore> {
  let aliases = await loadAliases(options.filePath);

  return {
    async list() {
      return [...aliases];
    },
    async setAlias(record) {
      aliases = upsertAlias(aliases, record);
      await persistAliases(options.filePath, aliases);
    },
  };
}

async function loadAliases(filePath: string): Promise<AliasRecord[]> {
  try {
    const contents = await readFile(filePath, "utf8");
    const parsed = JSON.parse(contents) as unknown;

    if (!Array.isArray(parsed)) {
      throw new TypeError(
        `Alias file must contain an array of alias records: ${filePath}`,
      );
    }

    return parsed.map(parseAliasRecord);
  } catch (error) {
    if (isMissingFileError(error)) {
      return [];
    }

    throw error;
  }
}

async function persistAliases(
  filePath: string,
  aliases: AliasRecord[],
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });

  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const payload = `${JSON.stringify(aliases, null, 2)}\n`;

  await writeFile(temporaryPath, payload, "utf8");
  await rename(temporaryPath, filePath);
}

function upsertAlias(
  aliases: AliasRecord[],
  record: AliasRecord,
): AliasRecord[] {
  const nextRecord = parseAliasRecord(record);
  const remainingAliases = aliases.filter(
    (alias) => alias.layerKey !== nextRecord.layerKey,
  );

  return [...remainingAliases, nextRecord];
}

function parseAliasRecord(value: unknown): AliasRecord {
  if (!isAliasRecord(value)) {
    throw new TypeError(
      "Alias record must include non-empty layerKey and stageLabel strings.",
    );
  }

  return {
    layerKey: value.layerKey.trim(),
    stageLabel: value.stageLabel.trim(),
  };
}

function isAliasRecord(value: unknown): value is AliasRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<AliasRecord>;

  return (
    typeof candidate.layerKey === "string" &&
    candidate.layerKey.trim().length > 0 &&
    typeof candidate.stageLabel === "string" &&
    candidate.stageLabel.trim().length > 0
  );
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
