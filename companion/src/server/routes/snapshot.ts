import type { FastifyInstance } from "fastify";

import type { StageSnapshot } from "../../types/stage";

export interface SnapshotRouteOptions {
  getSnapshot(): Promise<StageSnapshot>;
}

export function registerSnapshotRoute(
  app: FastifyInstance,
  options: SnapshotRouteOptions,
): void {
  app.get("/snapshot", async () => options.getSnapshot());
}
