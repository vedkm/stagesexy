import { useEffect, useState } from "react";

import type { StageLayer, StageSnapshot } from "../types/stage";

const COMPANION_ORIGIN =
  import.meta.env.VITE_COMPANION_ORIGIN ?? "http://127.0.0.1:3197";
const SNAPSHOT_URL = `${COMPANION_ORIGIN}/snapshot`;
const EVENTS_URL = `${COMPANION_ORIGIN}/events`;
const DEFAULT_STAGE_LABEL = "Waiting for instrument data";

const DISCONNECTED_SNAPSHOT: StageSnapshot = {
  selectorName: "",
  layerKey: null,
  rawName: null,
  displayLabel: DEFAULT_STAGE_LABEL,
  layers: [],
  status: "disconnected",
  sequence: 0,
  occurredAt: null,
  updatedAt: null,
};

export interface StageStreamState {
  snapshot: StageSnapshot;
}

export function useStageStream(): StageStreamState {
  const [snapshot, setSnapshot] = useState<StageSnapshot>(DISCONNECTED_SNAPSHOT);

  useEffect(() => {
    let isActive = true;

    const applySnapshot = (candidate: unknown) => {
      const parsedSnapshot = parseStageSnapshot(candidate);

      if (parsedSnapshot && isActive) {
        setSnapshot(parsedSnapshot);
      }
    };

    const eventSource = new EventSource(EVENTS_URL);

    eventSource.onopen = () => {
      void loadInitialSnapshot(applySnapshot, () => {
        if (isActive) {
          setSnapshot(DISCONNECTED_SNAPSHOT);
        }
      });
    };

    eventSource.onmessage = (event) => {
      try {
        applySnapshot(JSON.parse(event.data) as unknown);
      } catch {
        return;
      }
    };

    eventSource.onerror = () => {
      if (isActive) {
        setSnapshot(DISCONNECTED_SNAPSHOT);
      }
    };

    void loadInitialSnapshot(applySnapshot, () => {
      if (isActive) {
        setSnapshot(DISCONNECTED_SNAPSHOT);
      }
    });

    return () => {
      isActive = false;
      eventSource.close();
    };
  }, []);

  return { snapshot };
}

async function loadInitialSnapshot(
  onSnapshot: (snapshot: unknown) => void,
  onFailure: () => void,
): Promise<void> {
  try {
    const response = await fetch(SNAPSHOT_URL);

    if (!response.ok) {
      onFailure();
      return;
    }

    onSnapshot((await response.json()) as unknown);
  } catch {
    onFailure();
  }
}

function parseStageSnapshot(value: unknown): StageSnapshot | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Partial<StageSnapshot>;

  if (
    typeof candidate.selectorName !== "string" ||
    typeof candidate.displayLabel !== "string" ||
    typeof candidate.sequence !== "number" ||
    !isConnectionStatus(candidate.status) ||
    !isStageLayers(candidate.layers)
  ) {
    return null;
  }

  if (
    candidate.layerKey !== null &&
    typeof candidate.layerKey !== "string"
  ) {
    return null;
  }

  if (
    candidate.rawName !== null &&
    typeof candidate.rawName !== "string"
  ) {
    return null;
  }

  if (
    candidate.occurredAt !== null &&
    typeof candidate.occurredAt !== "string"
  ) {
    return null;
  }

  if (
    candidate.updatedAt !== null &&
    typeof candidate.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    selectorName: candidate.selectorName,
    layerKey: candidate.layerKey ?? null,
    rawName: candidate.rawName ?? null,
    displayLabel: candidate.displayLabel,
    layers: candidate.layers,
    status: candidate.status,
    sequence: candidate.sequence,
    occurredAt: candidate.occurredAt ?? null,
    updatedAt: candidate.updatedAt ?? null,
  };
}

function isStageLayers(value: StageSnapshot["layers"] | undefined): value is StageLayer[] {
  return (
    Array.isArray(value) &&
    value.every(
      (layer) =>
        typeof layer.layerKey === "string" &&
        typeof layer.rawName === "string" &&
        typeof layer.displayLabel === "string" &&
        typeof layer.isActive === "boolean",
    )
  );
}

function isConnectionStatus(
  value: StageSnapshot["status"] | undefined,
): value is StageSnapshot["status"] {
  return value === "live" || value === "stale" || value === "disconnected";
}
