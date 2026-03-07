import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import { buildCompanionApp } from "./app";
import type { NormalizedInstrumentEvent } from "../types/stage";

const BASE_EVENT: NormalizedInstrumentEvent = {
  source: "bitwig",
  selectorName: "Main Selector",
  layerKey: "main-selector:1",
  rawName: "Concert Grand",
  sequence: 7,
  occurredAt: "2026-03-07T12:00:00.000Z",
};

let activeDirectory: string | null = null;

afterEach(async () => {
  if (activeDirectory) {
    await rm(activeDirectory, { recursive: true, force: true });
    activeDirectory = null;
  }
});

describe("buildCompanionApp", () => {
  it("serves alias-resolved snapshots after ingest", async () => {
    const aliasFilePath = await createAliasFile([
      {
        layerKey: "main-selector:1",
        stageLabel: "Piano Intro",
      },
    ]);
    const app = await buildCompanionApp({
      aliasFilePath,
      now: () => new Date("2026-03-07T12:00:00.000Z"),
    });

    try {
      const ingestResponse = await app.inject({
        method: "POST",
        url: "/ingest",
        payload: BASE_EVENT,
      });
      const snapshotResponse = await app.inject({
        method: "GET",
        url: "/snapshot",
      });

      expect(ingestResponse.statusCode).toBe(200);
      expect(snapshotResponse.json()).toEqual({
        selectorName: "Main Selector",
        layerKey: "main-selector:1",
        rawName: "Concert Grand",
        displayLabel: "Piano Intro",
        status: "live",
        sequence: 7,
        occurredAt: "2026-03-07T12:00:00.000Z",
        updatedAt: "2026-03-07T12:00:00.000Z",
      });
    } finally {
      await app.close();
    }
  });

  it("degrades the published snapshot from live to stale to disconnected", async () => {
    let now = new Date("2026-03-07T12:00:00.000Z");
    const aliasFilePath = await createAliasFile([]);
    const app = await buildCompanionApp({
      aliasFilePath,
      now: () => now,
      thresholds: {
        staleAfterMs: 1_500,
        disconnectedAfterMs: 5_000,
      },
    });

    try {
      await app.inject({
        method: "POST",
        url: "/ingest",
        payload: BASE_EVENT,
      });

      now = new Date("2026-03-07T12:00:02.000Z");
      expect(
        (await app.inject({ method: "GET", url: "/snapshot" })).json().status,
      ).toBe("stale");

      now = new Date("2026-03-07T12:00:06.000Z");
      expect(
        (await app.inject({ method: "GET", url: "/snapshot" })).json().status,
      ).toBe("disconnected");
    } finally {
      await app.close();
    }
  });

  it("streams the current snapshot over the events endpoint", async () => {
    const aliasFilePath = await createAliasFile([]);
    const app = await buildCompanionApp({
      aliasFilePath,
      now: () => new Date("2026-03-07T12:00:00.000Z"),
    });

    try {
      await app.inject({
        method: "POST",
        url: "/ingest",
        payload: BASE_EVENT,
      });

      await app.listen({ host: "127.0.0.1", port: 0 });

      const address = app.server.address();

      if (!address || typeof address === "string") {
        throw new Error("Expected the companion app to expose a TCP address.");
      }

      const response = await fetch(
        `http://127.0.0.1:${(address as AddressInfo).port}/events`,
      );

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error("Expected the events endpoint to provide a readable body.");
      }

      const firstChunk = await reader.read();
      const payload = new TextDecoder().decode(firstChunk.value);

      expect(response.headers.get("content-type")).toContain("text/event-stream");
      expect(payload).toContain("\"displayLabel\":\"Concert Grand\"");

      await reader.cancel();
    } finally {
      await app.close();
    }
  });
});

async function createAliasFile(records: unknown[]): Promise<string> {
  activeDirectory = await mkdtemp(join(tmpdir(), "stage-display-"));

  const aliasFilePath = join(activeDirectory, "aliases.json");

  await writeFile(aliasFilePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");

  return aliasFilePath;
}
