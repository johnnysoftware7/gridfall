import { mkdir } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "http://127.0.0.1:4173";
const OUT = path.join(ROOT, "artifacts", "art-pass");
const VIEW = { width: 1280, height: 720 };

function waitHttp(url, timeoutMs = 20_000) {
  const t0 = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if ((res.statusCode ?? 500) < 500) resolve();
        else retry();
      });
      req.on("error", retry);
    };
    const retry = () => {
      if (Date.now() - t0 > timeoutMs) reject(new Error(`timeout waiting for ${url}`));
      else setTimeout(tick, 250);
    };
    tick();
  });
}

async function shot(page, name) {
  await page.evaluate(() => {
    window.__GRIDFALL_FREEZE = true;
    const api = /** @type {any} */ (window).__GRIDFALL__;
    if (api?.paint) api.paint();
  });
  await page.waitForTimeout(120);
  const session = await page.context().newCDPSession(page);
  const { data } = await session.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  await session.detach();
  const { writeFile } = await import("node:fs/promises");
  await writeFile(path.join(OUT, name), Buffer.from(data, "base64"));
  await page.evaluate(() => { window.__GRIDFALL_FREEZE = false; });
  console.log("wrote", name);
}

async function boot() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--ignore-gpu-blocklist"],
  });
  const page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: 1 });
  await page.addInitScript(() => { try { localStorage.clear(); } catch { /* ignore */ } });
  await page.goto(BASE + "/?art=" + Date.now(), { waitUntil: "domcontentloaded" });
  return { browser, page };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await waitHttp(BASE);

  {
    const { browser, page } = await boot();
    await page.waitForSelector(".faction-screen", { timeout: 15_000 });
    await page.waitForTimeout(1800);
    await shot(page, "01-faction-select.png");
    await browser.close();
  }

  {
    const { browser, page } = await boot();
    await page.waitForSelector(".faction-screen", { timeout: 15_000 });
    await page.click('button[data-faction="helix"]');
    await page.waitForSelector(".setup-screen");
    await page.click('#sizes button[data-id="11"]');
    await page.click("#start");
    await page.waitForSelector("#board", { timeout: 15_000 });
    await page.waitForTimeout(2200);
    await page.evaluate(() => {
      const api = /** @type {any} */ (window).__GRIDFALL__;
      const g = api.state();
      const c = g.cities.find((x) => x.owner === 0 && x.isCapital) ?? g.cities[0];
      const types = ["trooper", "skimmer", "marksman", "bulwark", "netrunner", "lancer"];
      const spots = [
        [2, 0], [0, 2], [2, 2], [-2, 1], [1, -2], [3, 1],
      ];
      let n = 0;
      for (const [dx, dy] of spots) {
        const x = c.x + dx;
        const y = c.y + dy;
        if (x < 0 || y < 0 || x >= g.size || y >= g.size) continue;
        const occ = g.units.some((u) => u.x === x && u.y === y);
        const city = g.cities.some((ci) => ci.x === x && ci.y === y);
        if (occ || city) continue;
        const type = types[n % types.length];
        g.units.push({
          id: `art-${n}`,
          type,
          owner: n % 5 === 0 ? 1 : 0,
          x, y,
          hp: 10, maxHp: 10,
          moved: false, attacked: false, acted: false,
          kills: 0, veteran: false, veteranReady: false,
          cityId: null, startX: x, startY: y,
        });
        n += 1;
      }
      for (const t of g.tiles) {
        const dx = Math.abs(t.x - c.x);
        const dy = Math.abs(t.y - c.y);
        if (dx + dy <= 4) {
          for (const p of g.players) p.explored[t.y * g.size + t.x] = true;
        }
      }
      const TILE_W = 88;
      const TILE_H = 44;
      api.aim((c.x - c.y) * (TILE_W / 2), (c.x + c.y) * (TILE_H / 2), 0.95);
      const pick = g.units.find((u) => u.owner === 0 && u.type === "trooper") ?? g.units.find((u) => u.owner === 0);
      if (pick) api.selectUnit(pick.id);
      api.paint();
    });
    await page.waitForTimeout(700);
    await shot(page, "02-early-board.png");

    await page.evaluate(() => {
      const api = /** @type {any} */ (window).__GRIDFALL__;
      const g = api.state();
      const c = g.cities.find((x) => x.owner === 0 && x.isCapital) ?? g.cities[0];
      const TILE_W = 88;
      const TILE_H = 44;
      api.aim((c.x - c.y) * (TILE_W / 2), (c.x + c.y) * (TILE_H / 2), 1.7);
    });
    await page.waitForTimeout(700);
    await shot(page, "03-city-closeup.png");

    await page.evaluate(() => {
      const api = /** @type {any} */ (window).__GRIDFALL__;
      const g = api.state();
      const u = g.units.find((x) => x.type === "trooper") ?? g.units[0];
      const TILE_W = 88;
      const TILE_H = 44;
      api.aim((u.x - u.y) * (TILE_W / 2), (u.x + u.y) * (TILE_H / 2), 2.15);
    });
    await page.waitForTimeout(500);
    await shot(page, "06-unit-closeup.png");

    await page.evaluate(() => {
      const api = /** @type {any} */ (window).__GRIDFALL__;
      const g = api.state();
      const me = g.units.find((u) => u.owner === 0 && !g.cities.some((ci) => ci.x === u.x && ci.y === u.y))
        ?? g.units.find((u) => u.owner === 0);
      const x = me?.x ?? 0;
      const y = me?.y ?? 0;
      api.fx.particles.length = 0;
      const floats = [
        { x: 0.15, y: 1.7, z: 0.05, text: "-6", color: "#ff4d3a" },
        { x: -0.35, y: 1.35, z: 0.2, text: "-3", color: "#ff6a3a" },
        { x: 0.45, y: 1.15, z: -0.15, text: "-8", color: "#ff5a3a" },
        { x: -0.1, y: 1.05, z: 0.25, text: "☠", color: "#ff4d3a" },
        { x: 0.55, y: 0.95, z: 0.3, text: "-2", color: "#e88a60" },
      ];
      for (const f of floats) {
        api.fx.particles.push({
          gx: x, gy: y, x: f.x, y: f.y, z: f.z, vx: 0, vy: 0, vz: 0,
          life: 20000, max: 20000, color: f.color, size: 40,
          kind: f.text === "☠" ? "skull" : "text", text: f.text,
        });
      }
      for (let i = 0; i < 14; i++) {
        const a = 0.4 + (i / 14) * 0.87 - 0.43;
        api.fx.particles.push({
          gx: x, gy: y,
          x: Math.cos(a) * 0.12,
          y: 0.55 + (i % 4) * 0.06,
          z: Math.sin(a) * 0.12,
          vx: 0, vy: 0, vz: 0,
          life: 20000, max: 20000,
          color: i % 2 === 0 ? "#ffe14a" : "#ff6a3a",
          size: 8, kind: "spark",
        });
      }
    });
    await shot(page, "04-combat.png");

    await page.evaluate(() => {
      const api = /** @type {any} */ (window).__GRIDFALL__;
      api.goto("tech");
    });
    await page.waitForTimeout(700);
    await shot(page, "05-tech-tree.png");
    await browser.close();
  }

  console.log("ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
