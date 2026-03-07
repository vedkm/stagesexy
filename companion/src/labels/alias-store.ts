import type { AliasRecord } from "../types/stage";

export function resolveStageLabel(
  _layerKey: string | null,
  _rawName: string | null,
  _aliases: AliasRecord[],
): string {
  throw new Error("resolveStageLabel is not implemented yet.");
}
