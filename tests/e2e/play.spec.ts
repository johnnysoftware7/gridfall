import { expect, test } from "@playwright/test";

test("30-turn Normal game is playable and offers choices", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const g = (window as unknown as { __GRIDFALL__: { start: (o: object) => void } }).__GRIDFALL__;
    g.start({ faction: "helix", size: 14, aiCount: 1, difficulty: "normal", mode: "perfection", seed: 2026 });
  });
  await page.waitForTimeout(300);

  const choiceTurns: number[] = [];
  for (let i = 0; i < 30; i++) {
    const info = await page.evaluate(() => {
      const api = window as unknown as {
        __GRIDFALL__: {
          state: () => {
            turn: number;
            over: boolean;
            currentPlayer: number;
            units: { id: string; owner: number; moved: boolean }[];
            players: { energy: number }[];
            cities: { owner: number | null }[];
          };
          apply: (c: object) => void;
          chooseCommands: (s: unknown) => object[];
        };
      };
      const st = api.__GRIDFALL__.state();
      const cmds = api.__GRIDFALL__.chooseCommands(st).filter((c: { type?: string }) => c.type !== "endTurn");
      for (const c of cmds) api.__GRIDFALL__.apply(c);
      if (!api.__GRIDFALL__.state().over) api.__GRIDFALL__.apply({ type: "endTurn" });
      const after = api.__GRIDFALL__.state();
      return {
        turn: after.turn,
        over: after.over,
        energy: after.players[0].energy,
        cities: after.cities.filter((c) => c.owner === 0).length,
        choices: cmds.length,
      };
    });
    if (info.choices > 0) choiceTurns.push(info.turn);
    if (info.over) break;
  }
  const st = await page.evaluate(() => {
    const api = window as unknown as { __GRIDFALL__: { state: () => { turn: number; over: boolean; players: { energy: number }[]; cities: { owner: number | null }[] } } };
    const s = api.__GRIDFALL__.state();
    return { turn: s.turn, over: s.over, cities: s.cities.filter((c) => c.owner === 0).length, energy: s.players[0].energy };
  });
  expect(st.cities).toBeGreaterThan(0);
  expect(st.energy).toBeGreaterThanOrEqual(0);
  expect(choiceTurns.length).toBeGreaterThan(15);
  expect(st.turn === 31 || st.over || st.turn >= 30).toBeTruthy();
});
