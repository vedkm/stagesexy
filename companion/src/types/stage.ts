export type ConnectionStatus = "live" | "stale" | "disconnected";

export interface NormalizedInstrumentEvent {
  source: "bitwig";
  selectorName: string;
  layerKey: string;
  rawName: string;
  sequence: number;
  occurredAt: string;
}

export interface AliasRecord {
  layerKey: string;
  stageLabel: string;
}

export interface StageSnapshot {
  selectorName: string;
  layerKey: string | null;
  rawName: string | null;
  displayLabel: string;
  status: ConnectionStatus;
  sequence: number;
  occurredAt: string | null;
  updatedAt: string | null;
}
