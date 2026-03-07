import { spawn } from "node:child_process";
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
  it("resolves the snapshot label from an alias written through the public command", async () => {
    const aliasFilePath = await createAliasFile([]);

    await expect(
      runAliasSetCommand({
        aliasFilePath,
        layerKey: "main-selector:1",
        stageLabel: "Piano Intro",
      }),
    ).resolves.toContain("Saved stage label");

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

      const snapshotResponse = await app.inject({
        method: "GET",
        url: "/snapshot",
      });

      expect(snapshotResponse.json()).toMatchObject({
        displayLabel: "Piano Intro",
        rawName: "Concert Grand",
      });
    } finally {
      await app.close();
    }
  });

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

async function runAliasSetCommand(options: {
  aliasFilePath: string;
  layerKey: string;
  stageLabel: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "npm",
      [
        "run",
        "alias:set",
        "--",
        "--layer-key",
        options.layerKey,
        "--stage-label",
        options.stageLabel,
      ],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          COMPANION_ALIAS_FILE_PATH: options.aliasFilePath,
        },
      },
    );
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(
        new Error(
          `alias:set command failed with exit code ${code}: ${stderr || stdout}`,
        ),
      );
    });
  });
}
