import type { FastifyInstance } from "fastify";

import type { NormalizedInstrumentEvent, StageSnapshot } from "../../types/stage";

export interface IngestRouteOptions {
  applyEvent(event: NormalizedInstrumentEvent): Promise<StageSnapshot>;
}

interface IngestRequest {
  Body: NormalizedInstrumentEvent;
}

export function registerIngestRoute(
  app: FastifyInstance,
  options: IngestRouteOptions,
): void {
  app.options("/ingest", async (_request, reply) => {
    await reply.code(204).send();
  });

  app.post<IngestRequest>("/ingest", async (request, reply) => {
    if (!isNormalizedInstrumentEvent(request.body)) {
      reply.code(400);

      return {
        message:
          "Invalid request body for /ingest. Expected a NormalizedInstrumentEvent with source, selectorName, layerKey, rawName, sequence, and occurredAt.",
      };
    }

    return options.applyEvent(request.body);
  });
}

function isNormalizedInstrumentEvent(
  value: unknown,
): value is NormalizedInstrumentEvent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<NormalizedInstrumentEvent>;

  return (
    candidate.source === "bitwig" &&
    typeof candidate.selectorName === "string" &&
    candidate.selectorName.trim().length > 0 &&
    typeof candidate.layerKey === "string" &&
    candidate.layerKey.trim().length > 0 &&
    typeof candidate.rawName === "string" &&
    candidate.rawName.trim().length > 0 &&
    typeof candidate.sequence === "number" &&
    Number.isFinite(candidate.sequence) &&
    typeof candidate.occurredAt === "string" &&
    candidate.occurredAt.trim().length > 0
  );
}
