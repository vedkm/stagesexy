export type ConnectionStatus = "live" | "stale" | "disconnected";

export interface SelectorLayer {
  layerKey: string;
  rawName: string;
}

export interface StageLayer extends SelectorLayer {
  displayLabel: string;
  isActive: boolean;
}

export interface NormalizedInstrumentEvent {
  source: "bitwig";
  selectorName: string;
  layerKey: string;
  rawName: string;
  layers?: SelectorLayer[];
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
  layers: StageLayer[];
  status: ConnectionStatus;
  sequence: number;
  occurredAt: string | null;
  updatedAt: string | null;
}
