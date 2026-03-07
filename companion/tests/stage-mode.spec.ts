import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";
import type { NormalizedInstrumentEvent } from "../src/types/stage";

const COMPANION_ORIGIN = "http://127.0.0.1:3197";
const COMPANION_ROOT = fileURLToPath(new URL("..", import.meta.url));
const NPM_COMMAND = process.platform === "win32" ? "npm.cmd" : "npm";

test("renders live alias updates and truthful freshness transitions", async ({
  page,
  request,
}) => {
  test.setTimeout(60_000);

  const tempDirectory = await mkdtemp(join(tmpdir(), "stage-display-e2e-"));
  const aliasFilePath = join(tempDirectory, "aliases.json");
  let runtimeProcess: ChildProcessWithoutNullStreams | null = null;

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
    runtimeProcess = await startCompanionRuntime(aliasFilePath);

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

    await request.post(`${COMPANION_ORIGIN}/ingest`, {
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

    await request.post(`${COMPANION_ORIGIN}/ingest`, {
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

    if (runtimeProcess) {
      await stopCompanionRuntime(runtimeProcess);
    }

    await rm(tempDirectory, { recursive: true, force: true });
  }
});

async function startCompanionRuntime(
  aliasFilePath: string,
): Promise<ChildProcessWithoutNullStreams> {
  const runtimeProcess = spawn(NPM_COMMAND, ["run", "start:server"], {
    cwd: COMPANION_ROOT,
    env: {
      ...process.env,
      COMPANION_ALIAS_FILE_PATH: aliasFilePath,
      COMPANION_STATUS_CHECK_MS: "25",
      COMPANION_STALE_AFTER_MS: "1000",
      COMPANION_DISCONNECTED_AFTER_MS: "2200",
    },
    stdio: "pipe",
  });
  let runtimeOutput = "";

  runtimeProcess.stdout.setEncoding("utf8");
  runtimeProcess.stderr.setEncoding("utf8");
  runtimeProcess.stdout.on("data", (chunk: string) => {
    runtimeOutput += chunk;
  });
  runtimeProcess.stderr.on("data", (chunk: string) => {
    runtimeOutput += chunk;
  });

  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (runtimeProcess.exitCode !== null) {
      throw new Error(
        `Companion runtime exited before becoming ready.\n${runtimeOutput}`,
      );
    }

    try {
      const response = await fetch(`${COMPANION_ORIGIN}/snapshot`);

      if (response.ok) {
        return runtimeProcess;
      }
    } catch {
      // The runtime is still starting up.
    }

    await delay(250);
  }

  await stopCompanionRuntime(runtimeProcess);
  throw new Error(
    `Companion runtime did not become ready at ${COMPANION_ORIGIN}.\n${runtimeOutput}`,
  );
}

async function stopCompanionRuntime(
  runtimeProcess: ChildProcessWithoutNullStreams,
): Promise<void> {
  if (runtimeProcess.exitCode !== null) {
    return;
  }

  runtimeProcess.kill("SIGTERM");

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (runtimeProcess.exitCode !== null) {
      return;
    }

    await delay(100);
  }

  runtimeProcess.kill("SIGKILL");
}
