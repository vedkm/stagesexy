import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "@playwright/test";
import type { FastifyInstance } from "fastify";

import { buildCompanionApp } from "../src/server/app";
import type { NormalizedInstrumentEvent } from "../src/types/stage";

test("renders live alias updates and truthful freshness transitions", async ({
  page,
  request,
}) => {
  test.setTimeout(60_000);

  const tempDirectory = await mkdtemp(join(tmpdir(), "stage-display-e2e-"));
  const aliasFilePath = join(tempDirectory, "aliases.json");
  let companionApp: FastifyInstance | null = null;

  await writeFile(
    aliasFilePath,
    `${JSON.stringify(
      [
        {
          layerKey: "main-selector:1",
          stageLabel: "Piano Intro",
        },
      ],
      null,
      2,
    )}\n`,
    "utf8",
  );

  try {
    companionApp = await buildCompanionApp({
      aliasFilePath,
      thresholds: {
        staleAfterMs: 1_000,
        disconnectedAfterMs: 2_200,
      },
      statusCheckMs: 25,
    });

    await companionApp.listen({
      host: "127.0.0.1",
      port: 3197,
    });

    await page.goto("/stage");

    await expect(
      page.getByRole("heading", { name: "Waiting for instrument data" }),
    ).toBeVisible();

    const instrumentEvent: NormalizedInstrumentEvent = {
      source: "bitwig",
      selectorName: "Main Selector",
      layerKey: "main-selector:1",
      rawName: "Concert Grand",
      sequence: 21,
      occurredAt: new Date().toISOString(),
    };

    await request.post("http://127.0.0.1:3197/ingest", {
      data: instrumentEvent,
    });

    await expect(page.getByRole("heading", { name: "Piano Intro" })).toBeVisible();
    await expect
      .poll(async () => page.locator(".stage-display").getAttribute("data-status"))
      .toBe("live");

    await page.getByRole("button", { name: "Enter Stage Mode" }).click();

    await expect
      .poll(() => page.evaluate(() => Boolean(document.fullscreenElement)))
      .toBe(true);

    await page.getByRole("button", { name: "Exit Stage Mode" }).click();

    await expect
      .poll(() => page.evaluate(() => document.fullscreenElement === null))
      .toBe(true);

    await request.post("http://127.0.0.1:3197/ingest", {
      data: {
        ...instrumentEvent,
        sequence: 22,
        occurredAt: new Date().toISOString(),
      } satisfies NormalizedInstrumentEvent,
    });

    await expect
      .poll(async () => page.locator(".stage-display").getAttribute("data-status"))
      .toBe("live");
    await expect
      .poll(async () => page.locator(".stage-display").getAttribute("data-status"))
      .toBe("stale");
    await expect
      .poll(async () => page.locator(".stage-display").getAttribute("data-status"))
      .toBe("disconnected");
  } finally {
    await page.goto("about:blank");

    if (companionApp) {
      await companionApp.close();
    }

    await rm(tempDirectory, { recursive: true, force: true });
  }
});
