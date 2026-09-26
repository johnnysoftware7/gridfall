import { expect, test } from "@playwright/test";

/**
 * Human-like GRIDFALL playthrough with Playwright recordVideo.
 * Run: RECORD_GAMEPLAY=1 npx playwright test tests/e2e/record-gameplay.spec.ts
 * Prefer `node scripts/record-gameplay.mjs` to also transcode to artifacts/gridfall-gameplay.mp4.
 */
test.skip(!process.env.RECORD_GAMEPLAY, "set RECORD_GAMEPLAY=1 to record the playthrough video");

test.use({
  viewport: { width: 1280, height: 720 },
  recordVideo: {
    dir: "test-results/gameplay-raw",
    size: { width: 1280, height: 720 },
  },
});

test("record ~60–90s human playthrough", async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });
  await page.goto("/");
  await page.locator(".faction-screen").waitFor({ state: "visible" });
  await page.waitForTimeout(1500);
  await page.locator('button[data-faction="helix"]').click();
  await page.locator(".setup-screen").waitFor({ state: "visible" });
  await page.waitForTimeout(400);
  await page.locator('#sizes button[data-id="11"]').click();
  await page.locator('#ais button[data-id="2"]').click();
  await page.locator('#diffs button[data-id="normal"]').click();
  await page.locator('#modes button[data-id="perfection"]').click();
  await page.waitForTimeout(600);
  await page.locator("#start").click();
  await page.locator("#board").waitFor({ state: "visible" });
  await page.waitForTimeout(2000);

  const unit = await page.evaluate(() => {
    const api = (window as unknown as { __GRIDFALL__: { state: () => { units: { owner: number; type: string; x: number; y: number }[] } } }).__GRIDFALL__;
    return api.state().units.find((u) => u.owner === 0);
  });
  expect(unit).toBeTruthy();

  await page.keyboard.press("t");
  await page.waitForTimeout(2500);
  await page.keyboard.press("t");
  await page.waitForTimeout(600);
  await page.keyboard.press("e");
  await page.waitForTimeout(2000);
  await page.keyboard.press("e");
  await page.waitForTimeout(2000);

  const turn = await page.evaluate(() => {
    const api = (window as unknown as { __GRIDFALL__: { state: () => { turn: number } } }).__GRIDFALL__;
    return api.state().turn;
  });
  expect(turn).toBeGreaterThan(1);
});
