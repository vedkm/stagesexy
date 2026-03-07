import type { FastifyInstance } from "fastify";

import type { StageSnapshot } from "../../types/stage";

export interface EventsRouteOptions {
  getSnapshot(): Promise<StageSnapshot>;
  subscribe(listener: (snapshot: StageSnapshot) => void): () => void;
}

export function registerEventsRoute(
  app: FastifyInstance,
  options: EventsRouteOptions,
): void {
  app.get("/events", async (request, reply) => {
    const snapshot = await options.getSnapshot();

    reply.raw.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.hijack();
    reply.raw.flushHeaders?.();

    writeSnapshot(reply.raw, snapshot);

    const heartbeatId = setInterval(() => {
      reply.raw.write(": keepalive\n\n");
    }, 15_000);

    const unsubscribe = options.subscribe((nextSnapshot) => {
      writeSnapshot(reply.raw, nextSnapshot);
    });

    request.raw.on("close", () => {
      clearInterval(heartbeatId);
      unsubscribe();
    });
  });
}

function writeSnapshot(
  response: NodeJS.WritableStream,
  snapshot: StageSnapshot,
): void {
  response.write(`data: ${JSON.stringify(snapshot)}\n\n`);
}
