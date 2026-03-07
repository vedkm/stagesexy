import { expect, test } from "@playwright/test";

import type { StageSnapshot } from "../src/types/stage";

const placeholderSnapshot: StageSnapshot = {
  selectorName: "Main Selector",
  layerKey: "main-selector:1",
  rawName: "Concert Grand",
  displayLabel: "Piano Intro",
  status: "live",
  sequence: 21,
  occurredAt: "2026-03-07T12:00:00.000Z",
  updatedAt: "2026-03-07T12:00:00.000Z",
};

test("enters and exits dedicated fullscreen stage mode", async ({ page }) => {
  await page.route("**/snapshot", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: placeholderSnapshot,
    });
  });

  await page.goto("/stage");

  await expect(
    page.getByRole("heading", { name: placeholderSnapshot.displayLabel }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Enter Stage Mode" }).click();

  await expect
    .poll(() => page.evaluate(() => Boolean(document.fullscreenElement)))
    .toBe(true);

  await page.keyboard.press("Escape");

  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement === null))
    .toBe(true);
});
