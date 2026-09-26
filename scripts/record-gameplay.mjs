/**
 * Record a ~60–90s human-like GRIDFALL playthrough to MP4.
 * Usage: node scripts/record-gameplay.mjs
 */
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { copyFile, mkdir, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;
const VIEW = { width: 1280, height: 720 };
const RAW_DIR = path.join(ROOT, "test-results", "gameplay-raw");
const ARTIFACT = path.join(ROOT, "artifacts", "gridfall-gameplay.mp4");
const SHOT_COPY = path.join(ROOT, "tests", "e2e", "shots", "gridfall-gameplay.mp4");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function waitHttp(url, timeoutMs = 30_000) {
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

async function ensurePreview() {
  try {
    await waitHttp(BASE, 800);
    return null;
  } catch {
    const log = createWriteStream(path.join(ROOT, "test-results", "preview-record.log"));
    await mkdir(path.join(ROOT, "test-results"), { recursive: true });
    const child = spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", String(PORT)], {
      cwd: ROOT,
      stdio: ["ignore", log, log],
      detached: true,
    });
    await waitHttp(BASE, 40_000);
    return child;
  }
}

async function hold(page, ms) {
  // Keep the page painting while we wait so the video is not a freeze-frame.
  const step = 400;
  let left = ms;
  while (left > 0) {
    const slice = Math.min(step, left);
    await page.waitForTimeout(slice);
    left -= slice;
  }
}

async function dismissLevelUp(page) {
  const btn = page.locator("#modal button").first();
  if (await btn.count()) {
    try {
      await btn.click({ timeout: 400 });
      await hold(page, 400);
    } catch {
      /* ignore */
    }
  }
}

async function gameInfo(page) {
  return page.evaluate(() => {
    const api = /** @type {any} */ (window).__GRIDFALL__;
    if (!api?.state?.()) return null;
    const g = api.state();
    const p = g.players[0];
    const own = g.units.filter((u) => u.owner === 0);
    const tiles = g.tiles;
    const size = g.size;
    const tile = (x, y) => tiles[y * size + x];
    const occ = (x, y) => g.units.some((u) => u.x === x && u.y === y);
    const landOk = (t) => t && t.terrain !== "deep" && t.terrain !== "shelf" && t.terrain !== "ridge";
    const movesFor = (u) => {
      const out = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const x = u.x + dx;
          const y = u.y + dy;
          if (x < 0 || y < 0 || x >= size || y >= size) continue;
          const t = tile(x, y);
          if (!landOk(t) || occ(x, y)) continue;
          if (!p.explored[y * size + x]) continue;
          out.push({ x, y });
        }
      }
      return out;
    };
    const attacksFor = (u) =>
      g.units
        .filter((e) => e.owner !== 0 && Math.max(Math.abs(e.x - u.x), Math.abs(e.y - u.y)) === 1)
        .map((e) => ({ id: e.id, x: e.x, y: e.y }));
    const harvests = [];
    for (const t of tiles) {
      if (!p.explored[t.y * size + t.x]) continue;
      if (t.resource === "spore" && p.techs.includes("logistics") && p.energy >= 2 && !t.building) {
        harvests.push({ x: t.x, y: t.y });
      }
    }
    const cities = g.cities.filter((c) => c.owner === 0).map((c) => ({ id: c.id, x: c.x, y: c.y }));
    return {
      turn: g.turn,
      over: g.over,
      energy: p.energy,
      screen: api.screen(),
      cam: { ...api.ui.cam },
      units: own.map((u) => ({
        id: u.id,
        type: u.type,
        x: u.x,
        y: u.y,
        moved: !!u.moved,
        attacked: !!u.attacked,
        acted: !!u.acted,
        moves: movesFor(u),
        attacks: attacksFor(u),
      })),
      harvests,
      cities,
      pending: !!g.pendingLevelUp,
    };
  });
}

async function tileClient(page, x, y) {
  return page.evaluate(({ x, y }) => {
    const api = /** @type {any} */ (window).__GRIDFALL__;
    const cam = api.ui.cam;
    const canvas = document.querySelector("#board");
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const TILE_W = 88;
    const TILE_H = 44;
    const isoX = (x - y) * (TILE_W / 2);
    const isoY = (x + y) * (TILE_H / 2);
    const sx = (isoX - cam.x) * cam.zoom + rect.width / 2;
    const sy = (isoY - cam.y) * cam.zoom + rect.height / 2;
    return { x: rect.left + sx, y: rect.top + sy };
  }, { x, y });
}

async function tapTile(page, x, y) {
  const pos = await tileClient(page, x, y);
  if (!pos) return false;
  if (pos.x < 8 || pos.y < 8 || pos.x > VIEW.width - 8 || pos.y > VIEW.height - 80) return false;
  await page.mouse.click(pos.x, pos.y, { delay: 40 });
  await hold(page, 350);
  await dismissLevelUp(page);
  return true;
}

async function clickFirst(page, selector, timeout = 4000) {
  const loc = page.locator(selector).first();
  await loc.waitFor({ state: "visible", timeout });
  await loc.click();
}

async function playthrough(page) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await hold(page, 1800);

  // Faction select — linger, then pick Helix Collective.
  await page.locator(".faction-screen").waitFor({ state: "visible", timeout: 10_000 });
  await hold(page, 1600);
  await clickFirst(page, 'button[data-faction="helix"]');
  await hold(page, 1200);

  // Setup: Normal / Perfection / 11×11 / 2 AI (defaults shown, then confirm).
  await page.locator(".setup-screen").waitFor({ state: "visible" });
  await hold(page, 700);
  await clickFirst(page, '#sizes button[data-id="11"]');
  await hold(page, 500);
  await clickFirst(page, '#ais button[data-id="2"]');
  await hold(page, 450);
  await clickFirst(page, '#diffs button[data-id="normal"]');
  await hold(page, 450);
  await clickFirst(page, '#modes button[data-id="perfection"]');
  await hold(page, 900);
  await clickFirst(page, "#start");

  await page.locator("#board").waitFor({ state: "visible", timeout: 10_000 });
  await hold(page, 3200);

  // Ease zoom out a touch so fog + capital read together.
  await page.mouse.move(VIEW.width / 2, VIEW.height / 2);
  await page.mouse.wheel(0, 380);
  await hold(page, 900);

  // Early board + fog: select Trooper, hold so move markers read, then move.
  let info = await gameInfo(page);
  const trooper = info?.units.find((u) => u.type === "trooper") ?? info?.units[0];
  if (trooper) {
    await page.evaluate((id) => {
      const api = /** @type {any} */ (window).__GRIDFALL__;
      api.selectUnit(id);
    }, trooper.id);
    await tapTile(page, trooper.x, trooper.y);
    await hold(page, 2400);
    const dest = trooper.moves[0];
    if (dest) {
      await tapTile(page, dest.x, dest.y);
      await hold(page, 2000);
    }
  }

  // Tech tree (T) open / close.
  await page.keyboard.press("t");
  await hold(page, 3800);
  await page.keyboard.press("t");
  await hold(page, 1200);

  // Settings: Music / SFX toggles actually start the authored bed.
  await page.evaluate(() => {
    const api = /** @type {any} */ (window).__GRIDFALL__;
    api.goto("settings");
  });
  await hold(page, 900);
  await page.locator("#m").click();
  await hold(page, 1100);
  await page.locator("#s").click();
  await hold(page, 500);
  await page.locator("#s").click();
  await hold(page, 400);
  await page.locator("#back").click();
  await hold(page, 800);

  // Harvest fruit (Helix + Logistics) or train a Trooper if Energy allows.
  info = await gameInfo(page);
  if (info?.harvests[0] && (info.energy ?? 0) >= 2) {
    await tapTile(page, info.harvests[0].x, info.harvests[0].y);
    await hold(page, 800);
    const harvestBtn = page.locator("#sel button").filter({ hasText: /Harvest/i }).first();
    if (await harvestBtn.count()) {
      await harvestBtn.click();
      await hold(page, 1400);
    }
  } else if (info?.cities[0] && (info.energy ?? 0) >= 2) {
    await tapTile(page, info.cities[0].x, info.cities[0].y);
    await hold(page, 800);
    const trainBtn = page.locator("#sel button").filter({ hasText: /Trooper/i }).first();
    if (await trainBtn.count()) {
      await trainBtn.click();
      await hold(page, 1400);
    }
  }

  // Move or attack again if a unit still can.
  info = await gameInfo(page);
  const actor = info?.units.find((u) => u.attacks.length || u.moves.length);
  if (actor) {
    await tapTile(page, actor.x, actor.y);
    await hold(page, 1100);
    const tgt = actor.attacks[0] ?? actor.moves[1] ?? actor.moves[0];
    if (tgt) {
      await tapTile(page, tgt.x, tgt.y);
      await hold(page, 1300);
    }
  }

  // Several end turns so the board progresses; act when we can.
  for (let i = 0; i < 6; i++) {
    await dismissLevelUp(page);
    info = await gameInfo(page);
    if (!info || info.over) break;

    const u = info.units.find((x) => x.attacks.length || (!x.moved && x.moves.length));
    if (u && i % 2 === 0) {
      await page.evaluate((id) => {
        const api = /** @type {any} */ (window).__GRIDFALL__;
        api.selectUnit(id);
      }, u.id);
      await tapTile(page, u.x, u.y);
      await hold(page, 1400);
      const tgt = u.attacks[0] ?? u.moves[0];
      if (tgt) {
        await tapTile(page, tgt.x, tgt.y);
        await hold(page, 1400);
      }
    } else if (info.cities[0] && info.energy >= 2 && (i === 1 || i === 3)) {
      await tapTile(page, info.cities[0].x, info.cities[0].y);
      await hold(page, 900);
      const trainBtn = page.locator("#sel button").filter({ hasText: /Trooper/i }).first();
      if (await trainBtn.count()) {
        await trainBtn.click();
        await hold(page, 1200);
      }
    }

    await page.keyboard.press("e");
    await hold(page, 2600);
    await dismissLevelUp(page);
    await hold(page, 900);
  }

  // Fast-forward into mid-late war so navy / beacons / density read on camera.
  await page.evaluate(() => {
    const api = /** @type {any} */ (window).__GRIDFALL__;
    for (let i = 0; i < 12; i++) {
      const st = api.state();
      if (!st || st.over) break;
      const cmds = api.chooseCommands(st).filter((c) => c.type !== "endTurn");
      for (const c of cmds) api.apply(c);
      if (!api.state().over) api.apply({ type: "endTurn" });
    }
  });
  await hold(page, 2200);
  const late = await gameInfo(page);
  const navy = late?.units.find((u) => /skiff|hover|hull|levi|ghost|bomb/i.test(u.type));
  const show = navy ?? late?.units[0];
  if (show) {
    await page.evaluate((id) => {
      const api = /** @type {any} */ (window).__GRIDFALL__;
      api.selectUnit(id);
    }, show.id);
    await tapTile(page, show.x, show.y);
    await hold(page, 2200);
  }
  await hold(page, 2800);
}

async function transcode(src, dest) {
  await mkdir(path.dirname(dest), { recursive: true });
  const args = [
    "-y",
    "-i",
    src,
    "-vf",
    "scale=1280:720:flags=lanczos,fps=30",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
    dest,
  ];
  await new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", args, { stdio: "inherit" });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}`))));
  });
  let s = await stat(dest);
  if (s.size > 15_000_000) {
    const tighter = [
      "-y",
      "-i",
      src,
      "-vf",
      "scale=1280:720:flags=lanczos,fps=24",
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "26",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      dest,
    ];
    await new Promise((resolve, reject) => {
      const p = spawn("ffmpeg", tighter, { stdio: "inherit" });
      p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}`))));
    });
    s = await stat(dest);
  }
  return s.size;
}

async function probe(file) {
  return new Promise((resolve) => {
    const p = spawn("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,duration,codec_name",
      "-show_entries",
      "format=duration,size",
      "-of",
      "json",
      file,
    ]);
    let out = "";
    p.stdout.on("data", (d) => {
      out += d;
    });
    p.on("exit", () => {
      try {
        resolve(JSON.parse(out));
      } catch {
        resolve(null);
      }
    });
  });
}

async function main() {
  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(path.join(ROOT, "artifacts"), { recursive: true });
  await mkdir(path.join(ROOT, "tests", "e2e", "shots"), { recursive: true });

  const server = await ensurePreview();
  const headed = process.env.HEADED === "1" || !!process.env.DISPLAY;
  const browser = await chromium.launch({
    headless: !headed,
    args: ["--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: VIEW,
    deviceScaleFactor: 1,
    recordVideo: { dir: RAW_DIR, size: VIEW },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);

  try {
    const t0 = Date.now();
    await playthrough(page);
    const pad = 74_000 - (Date.now() - t0);
    if (pad > 400) await hold(page, pad);
    await page.screenshot({ path: path.join(ROOT, "tests", "e2e", "shots", "gameplay-final.png") });
  } finally {
    const video = page.video();
    await page.close();
    const raw = video ? await video.path() : null;
    await context.close();
    await browser.close();
    if (server && server.pid) {
      try {
        process.kill(-server.pid, "SIGTERM");
      } catch {
        /* ignore */
      }
    }
    if (!raw) throw new Error("Playwright did not produce a video file");
    const bytes = await transcode(raw, ARTIFACT);
    await copyFile(ARTIFACT, SHOT_COPY);
    const meta = await probe(ARTIFACT);
    const stream = meta?.streams?.[0] ?? {};
    const duration = Number(meta?.format?.duration ?? stream.duration ?? 0);
    console.log(
      JSON.stringify(
        {
          artifact: ARTIFACT,
          shotCopy: SHOT_COPY,
          raw,
          bytes,
          duration,
          width: stream.width,
          height: stream.height,
          codec: stream.codec_name,
        },
        null,
        2,
      ),
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
