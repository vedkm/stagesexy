import Fastify, { type FastifyInstance } from "fastify";

import {
  createAliasStore,
  resolveStageLabel,
  type AliasStore,
} from "../labels/alias-store";
import {
  DEFAULT_FRESHNESS_THRESHOLDS,
  type FreshnessThresholds,
} from "../state/connection-status";
import { createStageStore, type StageStore } from "../state/stage-store";
import type { NormalizedInstrumentEvent, StageSnapshot } from "../types/stage";
import { registerEventsRoute } from "./routes/events";
import { registerIngestRoute } from "./routes/ingest";
import { registerSnapshotRoute } from "./routes/snapshot";

const DEFAULT_ALIAS_FILE_PATH = ".stage-display/aliases.json";
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 3197;
const DEFAULT_STATUS_POLL_MS = 250;

export interface CompanionAppOptions {
  aliasFilePath?: string;
  now?: () => Date;
  statusCheckMs?: number;
  thresholds?: FreshnessThresholds;
}

export interface CompanionListenOptions extends CompanionAppOptions {
  host?: string;
  port?: number;
}

export async function buildCompanionApp(
  options: CompanionAppOptions = {},
): Promise<FastifyInstance> {
  const getNow = options.now ?? (() => new Date());
  const aliasStore = await createAliasStore({
    filePath: options.aliasFilePath ?? DEFAULT_ALIAS_FILE_PATH,
  });
  const stageStore = createStageStore({
    now: getNow,
    thresholds: options.thresholds ?? DEFAULT_FRESHNESS_THRESHOLDS,
  });
  const listeners = new Set<(snapshot: StageSnapshot) => void>();
  let lastPublishedStatus = stageStore.getSnapshot({ now: getNow() }).status;

  const app = Fastify({
    forceCloseConnections: true,
    logger: false,
  });

  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type");

    return payload;
  });

  const getSnapshot = async (): Promise<StageSnapshot> => {
    return serializeSnapshot(stageStore, aliasStore, getNow());
  };

  const publishSnapshot = async (
    event: NormalizedInstrumentEvent,
  ): Promise<StageSnapshot> => {
    stageStore.applyEvent(event, { now: getNow() });
    const snapshot = await getSnapshot();
    lastPublishedStatus = snapshot.status;
    notifyListeners(listeners, snapshot);

    return snapshot;
  };

  registerIngestRoute(app, { applyEvent: publishSnapshot });
  registerSnapshotRoute(app, { getSnapshot });
  registerEventsRoute(app, {
    getSnapshot,
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  });

  const statusIntervalId = setInterval(async () => {
    const snapshot = await getSnapshot();

    if (snapshot.status !== lastPublishedStatus) {
      lastPublishedStatus = snapshot.status;
      notifyListeners(listeners, snapshot);
    }
  }, options.statusCheckMs ?? DEFAULT_STATUS_POLL_MS);

  app.addHook("onClose", async () => {
    clearInterval(statusIntervalId);
  });

  return app;
}

export async function startCompanionServer(
  options: CompanionListenOptions = {},
): Promise<FastifyInstance> {
  const app = await buildCompanionApp(options);

  await app.listen({
    host: options.host ?? DEFAULT_HOST,
    port: options.port ?? DEFAULT_PORT,
  });

  return app;
}

async function serializeSnapshot(
  stageStore: StageStore,
  aliasStore: AliasStore,
  now: Date,
): Promise<StageSnapshot> {
  const aliases = await aliasStore.list();

  return stageStore.getSnapshot({
    now,
    resolveLabel(layerKey, rawName) {
      return resolveStageLabel(layerKey, rawName, aliases);
    },
  });
}

function notifyListeners(
  listeners: Set<(snapshot: StageSnapshot) => void>,
  snapshot: StageSnapshot,
): void {
  for (const listener of listeners) {
    listener(snapshot);
  }
}
