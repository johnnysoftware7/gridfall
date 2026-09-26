import { expect, test } from "@playwright/test";
import { mkdirSync } from "fs";

mkdirSync("tests/e2e/shots", { recursive: true });

test("parity screenshots S1 S2 S3 S7 attack", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("[data-screen=faction]")).toBeVisible();
  await page.screenshot({ path: "tests/e2e/shots/gridfall-S1-faction.png" });

  await page.evaluate(() => {
    const g = (window as unknown as { __GRIDFALL__: { start: (o: object) => void } }).__GRIDFALL__;
    g.start({ faction: "helix", size: 14, aiCount: 2, difficulty: "normal", mode: "perfection", seed: 8743 });
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: "tests/e2e/shots/gridfall-S3-board.png" });

  await page.evaluate(() => {
    const g = (window as unknown as { __GRIDFALL__: { goto: (s: string) => void } }).__GRIDFALL__;
    g.goto("tech");
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: "tests/e2e/shots/gridfall-S2-tech.png" });

  await page.evaluate(() => {
    const api = window as unknown as {
      __GRIDFALL__: {
        goto: (s: string) => void;
        state: () => { units: { id: string; owner: number }[] };
        selectUnit: (id: string) => void;
      };
    };
    api.__GRIDFALL__.goto("game");
    const u = api.__GRIDFALL__.state().units.find((x) => x.owner === 0);
    if (u) api.__GRIDFALL__.selectUnit(u.id);
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: "tests/e2e/shots/gridfall-S7-cities.png" });

  await page.evaluate(() => {
    const api = window as unknown as {
      __GRIDFALL__: {
        selectUnit: (id: string) => void;
        state: () => {
          units: { id: string; owner: number; x: number; y: number }[];
          size: number;
          players: { explored: boolean[] }[];
        };
      };
    };
    const st = api.__GRIDFALL__.state();
    const me = st.units.find((u) => u.owner === 0);
    const foe = st.units.find((u) => u.owner !== 0);
    if (me && foe) {
      foe.x = Math.min(st.size - 1, me.x + 1);
      foe.y = me.y;
      st.players[0].explored[foe.y * st.size + foe.x] = true;
      api.__GRIDFALL__.selectUnit(me.id);
    }
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: "tests/e2e/shots/gridfall-attack.png" });
});
