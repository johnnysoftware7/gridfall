import { FACTIONS, FACTION_ORDER } from "../data/factions";
import { TECH_LIST, canResearch, techCost, techDef } from "../data/techs";
import { UNITS, unitDef } from "../data/units";
import { chooseCommands, runAiTurn } from "../ai/choose";
import { playSfx, setMusic, setSfx } from "../audio/sfx";
import { SAVE_KEY } from "../data/constants";
import { createGame } from "../engine/createGame";
import { dispatch, legalTileActions } from "../engine/actions";
import { previewUnits } from "../engine/combat";
import { canAct, legalAttacks, legalMoves } from "../engine/movement";
import { cityAt, cityCount, cityIncome, current, playerIncome, tileAt, unitAt } from "../engine/queries";
import { computeScore, finalScore, scoreBreakdown } from "../engine/score";
import type { Command, Difficulty, FactionId, GameMode, GameState, LevelUpReward, PlayerId, TechId, Unit } from "../engine/types";
import { drawBoard, drawStarfield, focusCapital, pickBoard, projectTile } from "../render/board";
import { paintHeroScene, paintMedal } from "../render/gl/hero";
import { burst, floatText, fx, killMark, punch, startHop, tickFx } from "../render/fx";
import { iso, type Camera } from "../render/iso";

export interface UiState {
  screen: "faction" | "setup" | "game" | "tech" | "stats" | "settings" | "end";
  faction: FactionId;
  size: number;
  aiCount: number;
  difficulty: Difficulty;
  mode: GameMode;
  seed: number;
  game: GameState | null;
  cam: Camera;
  selected: string | null;
  selectedTile: { x: number; y: number } | null;
  music: boolean;
  sfx: boolean;
  moreOpen: boolean;
  hover: { x: number; y: number } | null;
  coached: boolean;
  banner: string;
}

const ui: UiState = {
  screen: "faction",
  faction: "helix",
  size: 14,
  aiCount: 2,
  difficulty: "normal",
  mode: "perfection",
  seed: 3100,
  game: null,
  cam: { x: 0, y: 0, zoom: 1 },
  selected: null,
  selectedTile: null,
  music: false,
  sfx: true,
  moreOpen: false,
  hover: null,
  coached: false,
  banner: "",
};

let appEl: HTMLElement;
let dragging = false;
let last = { x: 0, y: 0 };
let pinch = 0;
const camGoal: Camera = { x: 0, y: 0, zoom: 2.2 };

export function mount(el: HTMLElement): void {
  appEl = el;
  render();
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", () => {
    if (ui.screen === "game" || ui.screen === "tech") paintBoard();
  });
  window.addEventListener("pointerdown", (e) => {
    if (!ui.moreOpen) return;
    const br = appEl?.querySelector("#br");
    if (br && br.contains(e.target as Node)) return;
    ui.moreOpen = false;
    if (ui.screen === "game") paintHud();
  });
  requestAnimationFrame(tick);
  expose();
}

function tick(now: number): void {
  if ((window as unknown as { __GRIDFALL_FREEZE?: boolean }).__GRIDFALL_FREEZE) {
    requestAnimationFrame(tick);
    return;
  }
  fx.now = now;
  tickFx(16);
  if (!dragging) {
    ui.cam.x += (camGoal.x - ui.cam.x) * 0.14;
    ui.cam.y += (camGoal.y - ui.cam.y) * 0.14;
    ui.cam.zoom += (camGoal.zoom - ui.cam.zoom) * 0.1;
  } else {
    camGoal.x = ui.cam.x;
    camGoal.y = ui.cam.y;
    camGoal.zoom = ui.cam.zoom;
  }
  if (ui.screen === "game" || ui.screen === "tech") paintBoard();
  if (ui.screen === "faction" || ui.screen === "setup") paintFactionHero();
  if (ui.screen === "end") paintEndHero();
  requestAnimationFrame(tick);
}

function render(): void {
  if (ui.screen === "faction") renderFaction();
  else if (ui.screen === "setup") renderSetup();
  else if (ui.screen === "end") renderEnd();
  else renderGameShell();
}

function renderFaction(): void {
  appEl.innerHTML = `
    <div class="faction-screen trailer" data-screen="faction">
      <canvas class="hero-bg" id="hero"></canvas>
      <div class="trailer-copy">
        <h1>GRIDFALL</h1>
        <p>AN ORIGINAL YEAR-3100 4X</p>
      </div>
      <div class="medals"></div>
      <div id="resume-slot"></div>
    </div>`;
  const medals = appEl.querySelector(".medals")!;
  for (const id of FACTION_ORDER) {
    const f = FACTIONS[id];
    const b = document.createElement("button");
    b.className = "medal";
    b.dataset.faction = id;
    b.innerHTML = `<canvas width="160" height="160"></canvas><div class="nm">${f.name}</div>`;
    medals.appendChild(b);
    const c = b.querySelector("canvas")!;
    paintMedal(c, id);
    b.onclick = () => { ui.faction = id; ui.screen = "setup"; render(); };
  }
  paintFactionHero();
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { game: GameState };
      if (parsed.game && !parsed.game.over) {
        const slot = appEl.querySelector("#resume-slot")!;
        slot.innerHTML = `<button class="play-btn" id="resume" style="position:absolute;left:50%;bottom:168px;transform:translateX(-50%);z-index:3">Resume drop</button>`;
        slot.querySelector("#resume")!.addEventListener("click", () => {
          ui.game = parsed.game;
          ui.screen = "game";
          ui.cam = focusCapital(parsed.game, 0);
          setSfx(ui.sfx);
          setMusic(ui.music);
          playSfx("ui");
          render();
        });
      }
    } catch { /* ignore */ }
  }
}

function paintFactionHero(): void {
  const c = appEl?.querySelector("#hero") as HTMLCanvasElement | null;
  if (!c) return;
  paintHeroScene(c, ui.faction, "select");
}

function paintEndHero(): void {
  const c = appEl?.querySelector("#end-hero") as HTMLCanvasElement | null;
  if (!c || !ui.game) return;
  const ranked = ui.game.players.slice().sort((a, b) => (ui.game!.winner === a.id ? -1 : ui.game!.winner === b.id ? 1 : 0));
  const lead = ui.game.players.find((p) => p.id === (ui.game!.winner ?? ranked[0].id)) ?? ui.game.players[0];
  paintHeroScene(c, lead.faction, ui.game.winner === 0 ? "win" : "lose");
}

function renderSetup(): void {
  appEl.innerHTML = `
    <div class="setup-screen trailer-setup" data-screen="setup">
      <canvas class="hero-bg" id="hero"></canvas>
      <button class="back-arrow" id="back">‹</button>
      <h2>BRIEFING</h2>
      <div>${FACTIONS[ui.faction].name}</div>
      <div class="setup-row" id="sizes"></div>
      <div class="setup-row" id="ais"></div>
      <div class="setup-row" id="diffs"></div>
      <div class="setup-row" id="modes"></div>
      <label>Seed <input class="seed" id="seed" value="${ui.seed}" /></label>
      <button class="play-btn" id="start">Drop in</button>
    </div>`;
  chips("sizes", [11, 14, 16, 18].map((n) => ({ id: String(n), label: `${n}×${n}` })), String(ui.size), (v) => { ui.size = Number(v); });
  chips("ais", [1, 2, 3].map((n) => ({ id: String(n), label: `${n} AI` })), String(ui.aiCount), (v) => { ui.aiCount = Number(v); });
  chips("diffs", ["easy", "normal", "hard", "crazy"].map((d) => ({ id: d, label: d })), ui.difficulty, (v) => { ui.difficulty = v as Difficulty; });
  chips("modes", [{ id: "perfection", label: "Perfection (30)" }, { id: "domination", label: "Domination" }], ui.mode, (v) => { ui.mode = v as GameMode; });
  appEl.querySelector("#back")!.addEventListener("click", () => { ui.screen = "faction"; render(); });
  appEl.querySelector("#start")!.addEventListener("click", () => {
    ui.seed = Number((appEl.querySelector("#seed") as HTMLInputElement).value) || 3100;
    startGame();
  });
  paintFactionHero();
}

function chips(id: string, items: { id: string; label: string }[], on: string, set: (v: string) => void): void {
  const el = appEl.querySelector("#" + id)!;
  const paint = (): void => {
    el.innerHTML = items.map((i) => `<button class="chip ${i.id === on ? "on" : ""}" data-id="${i.id}">${i.label}</button>`).join("");
    el.querySelectorAll("button").forEach((b) => {
      b.addEventListener("click", () => { set(b.getAttribute("data-id")!); on = b.getAttribute("data-id")!; paint(); });
    });
  };
  paint();
}

function startGame(): void {
  ui.game = createGame({
    seed: ui.seed,
    size: ui.size,
    mode: ui.mode,
    humanFaction: ui.faction,
    aiCount: ui.aiCount,
    difficulty: ui.difficulty,
  });
  ui.cam = focusCapital(ui.game, 0);
  Object.assign(camGoal, ui.cam);
  const startU = ui.game.units.find((u) => u.owner === 0);
  ui.selected = startU?.id ?? null;
  ui.coached = false;
  ui.screen = "game";
  setSfx(ui.sfx);
  setMusic(ui.music);
  save();
  render();
  showBanner("GRIDFALL", FACTIONS[ui.faction].name, 1200);
}

function renderGameShell(): void {
  appEl.innerHTML = `
    <canvas id="board"></canvas>
    <canvas id="board-ui" class="board-ui"></canvas>
    <div class="title-mark">GRIDFALL</div>
    <div class="hud-top" id="hud"></div>
    <div class="hud-br" id="br"></div>
    <div id="sel"></div>
    <div class="toast-stack" id="toasts"></div>
    <div class="helper" id="helper"></div>
    <div class="coach" id="coach" hidden></div>
    <div class="turn-banner" id="tbanner"></div>
    <div id="overlay"></div>
    <div id="modal"></div>`;
  bindCanvas();
  paint();
}

function bindCanvas(): void {
  const c = appEl.querySelector("#board") as HTMLCanvasElement;
  c.addEventListener("pointerdown", (e) => {
    dragging = true;
    last = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  });
  c.addEventListener("pointermove", (e) => {
    if (dragging) {
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) {
        ui.cam.x -= dx / ui.cam.zoom;
        ui.cam.y -= dy / ui.cam.zoom;
        last = { x: e.clientX, y: e.clientY };
      }
      return;
    }
    if (!ui.game) return;
    const rect = c.getBoundingClientRect();
    ui.hover = pickBoard(c, e.clientX - rect.left, e.clientY - rect.top, ui.game.size);
  });
  c.addEventListener("pointerup", (e) => {
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    dragging = false;
    if (Math.abs(dx) + Math.abs(dy) < 6) onTap(e.clientX, e.clientY);
  });
  c.addEventListener("wheel", (e) => {
    e.preventDefault();
    const z = Math.min(2.85, Math.max(0.7, ui.cam.zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
    ui.cam.zoom = z;
    camGoal.zoom = z;
    paint();
  }, { passive: false });
  c.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }
  });
  c.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (pinch) {
        const z = Math.min(2.85, Math.max(0.7, ui.cam.zoom * (d / pinch)));
        ui.cam.zoom = z;
        camGoal.zoom = z;
      }
      pinch = d;
      paint();
    }
  });
}

function onTap(cx: number, cy: number): void {
  if (!ui.game || ui.screen !== "game") return;
  const c = appEl.querySelector("#board") as HTMLCanvasElement;
  const rect = c.getBoundingClientRect();
  const tile = pickBoard(c, cx - rect.left, cy - rect.top, ui.game.size);
  if (!tile) { ui.selected = null; ui.selectedTile = null; paint(); return; }
  const g = ui.game;
  const unit = unitAt(g, tile.x, tile.y);
  if (ui.selected) {
    const sel = g.units.find((u) => u.id === ui.selected);
    if (sel && sel.owner === 0) {
      const mv = legalMoves(g, sel).find((m) => m.x === tile.x && m.y === tile.y);
      if (mv) { apply({ type: "move", unitId: sel.id, x: tile.x, y: tile.y }); return; }
      const atk = legalAttacks(g, sel).find((t) => t.x === tile.x && t.y === tile.y);
      if (atk) { apply({ type: "attack", unitId: sel.id, targetId: atk.id }); return; }
      const city = cityAt(g, sel.x, sel.y);
      if (city && city.owner !== 0 && sel.x === tile.x && sel.y === tile.y) {
        apply({ type: "capture", unitId: sel.id });
        return;
      }
    }
  }
  if (unit && (!unit.hidden || unit.owner === 0)) {
    ui.selected = unit.id;
    ui.selectedTile = { x: tile.x, y: tile.y };
    playSfx("select");
  } else {
    ui.selected = null;
    ui.selectedTile = { x: tile.x, y: tile.y };
  }
  paintChrome();
}

function apply(cmd: Command): void {
  if (!ui.game) return;
  const before = ui.game;
  const exploredBefore = before.players[0].explored.slice();
  const scoreBefore = computeScore(before, 0);
  juice(cmd, before);
  ui.game = dispatch(ui.game, cmd);
  flashExplored(exploredBefore, ui.game);
  const scoreAfter = computeScore(ui.game, 0);
  if (scoreAfter > scoreBefore) {
    const u = ui.game.units.find((unit) => unit.owner === 0);
    if (u) floatText(u.x, u.y, `+${scoreAfter - scoreBefore}`, "#ffe14a");
  }
  for (const c of ui.game.cities) {
    const prev = before.cities.find((x) => x.id === c.id);
    if (prev && c.owner === 0 && c.progress > prev.progress) {
      floatText(c.x, c.y, `+XP`, "#7ecbff");
    }
    if (c.owner === 0 && c.monument && prev && !prev.monument) {
      playSfx("wonder");
      burst(c.x, c.y, "#f5d76e", 20);
      floatText(c.x, c.y, "WONDER", "#f5d76e");
      punch(7);
    }
  }
  if (cmd.type === "move" || cmd.type === "harvest" || cmd.type === "train") ui.coached = true;
  if (ui.game.pendingLevelUp && ui.game.currentPlayer === 0) {
    paint();
    return;
  }
  while (ui.game.pendingLevelUp && ui.game.currentPlayer !== 0) {
    ui.game = dispatch(ui.game, { type: "levelUp", reward: ui.game.pendingLevelUp.options[0] });
  }
  if (cmd.type === "endTurn") {
    showBanner(`TURN ${ui.game.turn}`, "Rivals moving…");
    runAis();
    save();
    if (!ui.game.over) showBanner(`TURN ${ui.game.turn}`, FACTIONS[ui.game.players[0].faction].name, 1400);
  }
  if (ui.game.over) ui.screen = "end";
  paint();
  if (ui.screen === "end") render();
}

function flashExplored(before: boolean[], after: GameState): void {
  const exp = after.players[0].explored;
  const size = after.size;
  let n = 0;
  for (let i = 0; i < exp.length && n < 12; i++) {
    if (exp[i] && !before[i]) {
      const x = i % size;
      const y = Math.floor(i / size);
      burst(x, y, "#7ffff6", 5);
      n++;
    }
  }
  if (n > 0) {
    const u = after.units.find((unit) => unit.owner === 0);
    if (u) floatText(u.x, u.y, `SCOUT +${n}`, "#7ffff6");
  }
}

function juice(cmd: Command, g: GameState): void {
  if (cmd.type === "move") {
    const mover = g.units.find((u) => u.id === cmd.unitId);
    playSfx("move");
    if (mover) startHop(mover.id, mover.x, mover.y, cmd.x, cmd.y, 260);
    burst(cmd.x, cmd.y, "#3d9fff", 8);
    ui.coached = true;
    const dest = iso(cmd.x, cmd.y);
    camGoal.x = dest.x;
    camGoal.y = dest.y;
  } else if (cmd.type === "attack" || cmd.type === "convert") {
    playSfx("attack");
    const t = g.units.find((u) => u.id === cmd.targetId);
    if (t) {
      const a = g.units.find((u) => u.id === cmd.unitId);
      if (a) {
        const pv = previewUnits(g, a, t);
        if (pv.defenderDies) killMark(t.x, t.y);
        floatText(t.x, t.y, `-${pv.attackResult}`, "#ff6b3a");
        const city = cityAt(g, a.x, a.y);
        if (city && city.owner === 0) floatText(city.x, city.y, "+XP", "#7ecbff");
      }
      burst(t.x, t.y, "#ff4d4d", 22);
    }
    punch(5);
  } else if (cmd.type === "harvest" || cmd.type === "harvestStarfish") {
    playSfx("harvest");
    burst(cmd.x, cmd.y, "#c6ff4a", 10);
    floatText(cmd.x, cmd.y, "+HARVEST", "#c6ff4a");
  } else if (cmd.type === "train") {
    playSfx("train");
    const city = g.cities.find((c) => c.id === cmd.cityId);
    if (city) burst(city.x, city.y, "#ffe14a", 10);
  } else if (cmd.type === "research") {
    playSfx("research");
  } else if (cmd.type === "capture") {
    playSfx("capture");
    const u = g.units.find((x) => x.id === cmd.unitId);
    if (u) {
      burst(u.x, u.y, "#ffe14a", 16);
      floatText(u.x, u.y, "CLAIMED", "#ffe14a");
    }
    punch(6);
  } else if (cmd.type === "endTurn") {
    playSfx("end");
  } else if (cmd.type === "build") {
    const kind = String(cmd.kind);
    if (kind === "beacon" || kind.endsWith("Beacon")) {
      playSfx("wonder");
      burst(cmd.x, cmd.y, "#e8f6ff", 18);
      floatText(cmd.x, cmd.y, "BEACON", "#e8f6ff");
    } else if (kind === "dock") {
      playSfx("train");
      burst(cmd.x, cmd.y, "#7ecbff", 10);
    }
  } else if (cmd.type === "upgradeNaval") {
    playSfx("train");
    const u = g.units.find((x) => x.id === cmd.unitId);
    if (u) {
      burst(u.x, u.y, "#7ffff6", 12);
      floatText(u.x, u.y, "HULL UP", "#7ffff6");
    }
  }
}

function showBanner(title: string, sub = "", ms = 900): void {
  ui.banner = title;
  const el = appEl.querySelector("#tbanner");
  if (!el) return;
  el.className = "turn-banner on";
  el.innerHTML = `${title}${sub ? `<small>${sub}</small>` : ""}`;
  window.setTimeout(() => {
    el.classList.remove("on");
  }, ms);
}

function runAis(): void {
  if (!ui.game) return;
  let guard = 0;
  while (ui.game.currentPlayer !== 0 && !ui.game.over && guard++ < 8) {
    ui.game = runAiTurn(ui.game);
    while (ui.game.pendingLevelUp) {
      ui.game = dispatch(ui.game, { type: "levelUp", reward: pickAiReward(ui.game.pendingLevelUp.options) });
    }
  }
}

function pickAiReward(opts: LevelUpReward[]): LevelUpReward {
  if (opts.includes("workshop")) return "workshop";
  if (opts.includes("wall")) return "wall";
  if (opts.includes("pop")) return "pop";
  if (opts.includes("titan")) return "titan";
  return opts[0];
}

function paint(): void {
  paintBoard();
  paintChrome();
}

function paintBoard(): void {
  if (!ui.game) return;
  const c = appEl.querySelector("#board") as HTMLCanvasElement | null;
  if (!c) return;
  const uiC = appEl.querySelector("#board-ui") as HTMLCanvasElement | null;
  const r = appEl.getBoundingClientRect();
  if (uiC) {
    const w = Math.max(1, Math.floor(r.width * devicePixelRatio));
    const h = Math.max(1, Math.floor(r.height * devicePixelRatio));
    if (uiC.width !== w || uiC.height !== h) {
      uiC.width = w;
      uiC.height = h;
    }
    const octx = uiC.getContext("2d")!;
    octx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    const sel = ui.selected ? ui.game.units.find((u) => u.id === ui.selected) : undefined;
    const moves = sel && sel.owner === 0 ? legalMoves(ui.game, sel) : [];
    const attacks = sel && sel.owner === 0 ? legalAttacks(ui.game, sel).map((t) => ({ x: t.x, y: t.y })) : [];
    drawBoard(c, octx, ui.game, ui.cam, {
      pid: 0,
      selected: ui.selected ?? undefined,
      moves,
      attacks,
      hover: ui.hover,
    });
    return;
  }
  const sel = ui.selected ? ui.game.units.find((u) => u.id === ui.selected) : undefined;
  const moves = sel && sel.owner === 0 ? legalMoves(ui.game, sel) : [];
  const attacks = sel && sel.owner === 0 ? legalAttacks(ui.game, sel).map((t) => ({ x: t.x, y: t.y })) : [];
  drawBoard(c, null, ui.game, ui.cam, {
    pid: 0,
    selected: ui.selected ?? undefined,
    moves,
    attacks,
    hover: ui.hover,
  });
}

function paintChrome(): void {
  if (!ui.game) return;
  const sel = ui.selected ? ui.game.units.find((u) => u.id === ui.selected) : undefined;
  paintHud();
  paintSelect(sel);
  paintToasts();
  paintOverlay();
  paintModal();
  paintCoach();
}

function paintHud(): void {
  const g = ui.game!;
  const p = g.players[0];
  const inc = playerIncome(g, 0);
  const hud = appEl.querySelector("#hud");
  if (hud) {
    hud.innerHTML = `
      <div class="hud-col"><div class="lbl">Score</div><div class="num">${computeScore(g, 0).toLocaleString()}</div></div>
      <div class="hud-col"><div class="lbl">Energy (+${inc})</div><div class="num">⚡${p.energy}</div></div>
      <div class="hud-col"><div class="lbl">Turn</div><div class="num">${g.turn}</div></div>`;
  }
  const rank = rankOf(g, 0);
  const br = appEl.querySelector("#br");
  if (br) {
    br.innerHTML = `
      <button class="round-btn" data-go="settings"><div class="disc">☰</div><div class="cap"><span class="full">Settings</span><span class="short">Set</span></div></button>
      <button class="round-btn" data-go="stats"><div class="disc dark">◉<span class="rank-badge">${rank}</span></div><div class="cap"><span class="full">Game Stats</span><span class="short">Stats</span></div></button>
      <button class="round-btn" data-go="tech"><div class="disc">⚗</div><div class="cap"><span class="full">Tech Tree</span><span class="short">Tech</span></div></button>
      <button class="round-btn" id="more"><div class="disc">···</div><div class="cap">More</div></button>
      <button class="round-btn primary" id="nextunit"><div class="disc">⟳</div><div class="cap"><span class="full">Next Unit</span><span class="short">Next</span></div></button>
      <button class="round-btn primary ${idleReady() ? "ready" : ""}" id="endturn"><div class="disc">✓</div><div class="cap"><span class="full">End Turn</span><span class="short">End</span></div></button>
      <div class="more-pop ${ui.moreOpen ? "open" : ""}" id="morepop">
        <button data-go="settings">☰ Settings</button>
        <button data-go="stats">◉ Game Stats</button>
      </div>`;
    br.querySelectorAll("[data-go]").forEach((b) => {
      b.addEventListener("click", () => {
        ui.moreOpen = false;
        ui.screen = b.getAttribute("data-go") as UiState["screen"];
        paint();
      });
    });
    br.querySelector("#more")!.addEventListener("click", (e) => {
      e.stopPropagation();
      ui.moreOpen = !ui.moreOpen;
      paintHud();
    });
    br.querySelector("#nextunit")!.addEventListener("click", () => cycleIdleUnit());
    br.querySelector("#endturn")!.addEventListener("click", () => apply({ type: "endTurn" }));
  }
  paintHelper();
}

function idleUnits(): Unit[] {
  if (!ui.game) return [];
  return ui.game.units.filter((u) => u.owner === 0 && canAct(u));
}

function idleReady(): boolean {
  if (!ui.game || ui.game.currentPlayer !== 0) return false;
  if (idleUnits().length) return false;
  const p = ui.game.players[0];
  if (p.energy >= 2) {
    for (const t of ui.game.tiles) {
      if (legalTileActions(ui.game, t.x, t.y).some((a) => a.type === "harvest")) return false;
    }
  }
  return true;
}

function cycleIdleUnit(): void {
  if (!ui.game) return;
  const list = idleUnits();
  if (!list.length) {
    playSfx("ui");
    return;
  }
  const idx = list.findIndex((u) => u.id === ui.selected);
  const next = list[(idx + 1 + list.length) % list.length];
  ui.selected = next.id;
  ui.selectedTile = { x: next.x, y: next.y };
  const p = iso(next.x, next.y);
  camGoal.x = p.x;
  camGoal.y = p.y;
  playSfx("select");
  paintChrome();
}

function paintHelper(): void {
  const el = appEl.querySelector("#helper");
  if (!el || !ui.game || ui.screen !== "game") {
    if (el) el.innerHTML = "";
    return;
  }
  const sel = ui.selected ? ui.game.units.find((u) => u.id === ui.selected) : undefined;
  if (!sel || sel.owner !== 0) {
    const n = idleUnits().length;
    el.innerHTML = n ? `${n} unit${n === 1 ? "" : "s"} can still act — Next Unit or tap one.` : idleReady() ? "No high-value actions left — End Turn." : "";
    return;
  }
  const atks = legalAttacks(ui.game, sel);
  const canMove = legalMoves(ui.game, sel).length > 0;
  el.innerHTML = atks.length
    ? "Select a red mark to attack"
    : canMove
      ? "Select a blue mark to move"
      : "This unit has acted";
}

function paintCoach(): void {
  const el = appEl.querySelector("#coach") as HTMLElement | null;
  if (!el || !ui.game) return;
  if (ui.coached || ui.game.turn > 1 || ui.screen !== "game") {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  el.innerHTML = `<b>First drop.</b> Select a blue mark to move · <b>N</b> next unit · <b>E</b> end turn.`;
}

function rankOf(g: GameState, pid: PlayerId): string {
  const scores = g.players.map((p) => ({ id: p.id, s: computeScore(g, p.id) })).sort((a, b) => b.s - a.s);
  const i = scores.findIndex((x) => x.id === pid);
  return ["1st", "2nd", "3rd", "4th"][i] ?? `${i + 1}th`;
}

function paintSelect(sel?: Unit): void {
  const box = appEl.querySelector("#sel");
  if (!box || !ui.game) return;
  if (sel) {
    const d = unitDef(sel.type);
    const fac = FACTIONS[ui.game.players[sel.owner].faction];
    const atks = sel.owner === 0 ? legalAttacks(ui.game, sel) : [];
    const canMove = sel.owner === 0 && legalMoves(ui.game, sel).length > 0;
    const hint = sel.owner === 0
      ? (atks.length ? "Select a red mark to attack" : canMove ? "Select a blue mark to move" : "Acted — End Turn when ready.")
      : `${d.name}`;
    const preview = atks.slice(0, 2).map((t) => {
      const pv = previewUnits(ui.game!, sel, t);
      const td = unitDef(t.type);
      return `<div class="battle-preview"><strong>${td.name}</strong> · deal ${pv.attackResult} · take ${pv.defenseResult}${pv.defenderDies ? " · KO" : ""}</div>`;
    }).join("");
    const acts = sel.owner === 0 ? unitButtons(sel) : "";
    box.innerHTML = `
      <div class="sel-card" data-unit="${sel.id}">
        <div style="height:54px"></div>
        <div class="namebar" style="background:${fac.color}">${d.name}<span>${Math.ceil(sel.hp)}/${sel.maxHp}</span></div>
        <div class="hpbar"><i style="width:${(sel.hp / sel.maxHp) * 100}%"></i></div>
        <div class="hint">${hint}</div>
        ${preview}
        <div class="sel-actions">${acts}</div>
      </div>`;
    box.querySelectorAll("[data-cmd]").forEach((b) => {
      b.addEventListener("click", () => runSel(sel, b.getAttribute("data-cmd")!));
    });
    return;
  }
  if (ui.selectedTile) {
    const { x, y } = ui.selectedTile;
    const acts = current(ui.game).id === 0 ? legalTileActions(ui.game, x, y) : [];
    const city = cityAt(ui.game, x, y);
    const t = tileAt(ui.game, x, y);
    const name = city ? city.name : t ? terrainName(t.terrain) : "Void";
    const train = city && city.owner === 0 ? trainButtons(city.id) : "";
    box.innerHTML = `
      <div class="sel-card">
        <div class="namebar" style="background:#333">${name}</div>
        <div class="hint">${city && city.owner === 0 ? `Colony L${city.level} · ⚡${cityIncome(ui.game, city)}` : "Tile actions"}</div>
        <div class="sel-actions">
          ${acts.map((a) => `<button data-json='${JSON.stringify(a)}'><div class="disc">▸</div>${labelCmd(a)}</button>`).join("")}
          ${train}
        </div>
      </div>`;
    box.querySelectorAll("[data-json]").forEach((b) => {
      b.addEventListener("click", () => apply(JSON.parse(b.getAttribute("data-json")!) as Command));
    });
    box.querySelectorAll("[data-train]").forEach((b) => {
      b.addEventListener("click", () => apply({ type: "train", cityId: city!.id, unit: b.getAttribute("data-train") as Unit["type"] }));
    });
    return;
  }
  box.innerHTML = "";
}

function terrainName(t: string): string {
  return ({ plain: "Regolith Plain", forest: "Bioforest", ridge: "Ridge", shelf: "Shelf", deep: "Deep" } as Record<string, string>)[t] ?? t;
}

function labelCmd(c: Command): string {
  if (c.type === "harvest") return "Harvest";
  if (c.type === "build") return String(c.kind);
  if (c.type === "clearForest") return "Clear";
  if (c.type === "growForest") return "Grow";
  if (c.type === "burnForest") return "Burn";
  if (c.type === "destroy") return "Scrap";
  if (c.type === "harvestStarfish") return "Crystal";
  return c.type;
}

function unitButtons(u: Unit): string {
  const g = ui.game!;
  const bits: string[] = [];
  if (u.hp < u.maxHp && !u.moved && !u.attacked) bits.push(btn("heal", "Heal"));
  if (u.veteranReady) bits.push(btn("promote", "Vet"));
  const city = cityAt(g, u.x, u.y);
  if (city && city.owner !== 0 && u.startX === u.x && u.startY === u.y) bits.push(btn("capture", "Claim"));
  const t = tileAt(g, u.x, u.y);
  if (t?.ruin && u.startX === u.x && u.startY === u.y) bits.push(btn("examine", "Probe"));
  if (g.players[0].techs.includes("openCircuit")) bits.push(btn("disband", "Disband"));
  if (u.type === "skiff") {
    if (g.players[0].techs.includes("driftControl")) bits.push(btn("up-hoverScout", "Hover"));
    if (g.players[0].techs.includes("hullBreach")) bits.push(btn("up-hullRam", "Ram"));
    if (g.players[0].techs.includes("starfix")) bits.push(btn("up-depthBomber", "Bomb"));
  }
  if (unitDef(u.type).skills.includes("heal")) bits.push(btn("healOthers", "Patch"));
  return bits.join("");
}

function btn(cmd: string, label: string): string {
  return `<button data-cmd="${cmd}"><div class="disc">●</div>${label}</button>`;
}

function trainButtons(_cityId: string): string {
  return (Object.keys(UNITS) as (keyof typeof UNITS)[])
    .filter((k) => UNITS[k].trainable)
    .filter((k) => !UNITS[k].tech || ui.game!.players[0].techs.includes(UNITS[k].tech as TechId))
    .map((k) => `<button data-train="${k}"><div class="disc">${UNITS[k].cost}</div>${UNITS[k].name}</button>`)
    .join("");
}

function runSel(u: Unit, cmd: string): void {
  if (cmd === "heal") apply({ type: "heal", unitId: u.id });
  else if (cmd === "healOthers") apply({ type: "healOthers", unitId: u.id });
  else if (cmd === "promote") apply({ type: "promote", unitId: u.id });
  else if (cmd === "capture") apply({ type: "capture", unitId: u.id });
  else if (cmd === "examine") apply({ type: "examine", unitId: u.id });
  else if (cmd === "disband") apply({ type: "disband", unitId: u.id });
  else if (cmd.startsWith("up-")) apply({ type: "upgradeNaval", unitId: u.id, into: cmd.slice(3) as "hoverScout" });
}

function paintToasts(): void {
  const el = appEl.querySelector("#toasts");
  if (!el || !ui.game) return;
  el.innerHTML = ui.game.toasts.slice(-2).map((t) => `<div class="toast"><b>${t.title}</b><span>${t.body}</span></div>`).join("");
}

function paintOverlay(): void {
  const el = appEl.querySelector("#overlay");
  if (!el || !ui.game) return;
  if (ui.screen === "tech") {
    el.innerHTML = `<div class="tech-screen" data-screen="tech"><button class="back-arrow" id="back">‹</button><canvas id="techc"></canvas><div class="tech-note">Tech costs increase for each city in your empire.<br/>Literacy reduces the price of all technologies by 33%!</div></div>`;
    el.querySelector("#back")!.addEventListener("click", () => { ui.screen = "game"; paint(); });
    paintTechTree(el.querySelector("#techc") as HTMLCanvasElement);
    return;
  }
  if (ui.screen === "stats") {
    const g = ui.game;
    const you = scoreBreakdown(g, 0);
    el.innerHTML = `<div class="overlay" data-screen="stats"><button class="back-arrow" id="back">‹</button><div class="panel"><h3>Game Stats</h3>
      ${g.players.map((p) => `<div class="row"><span>${FACTIONS[p.faction].name}</span><span>${computeScore(g, p.id)}</span></div>`).join("")}
      <h3 style="margin-top:16px;font-weight:500">You</h3>
      <div class="row"><span>Army</span><span>${you.army}</span></div>
      <div class="row"><span>Science</span><span>${you.science}</span></div>
      <div class="row"><span>Cities</span><span>${you.cities}</span></div>
      <div class="row"><span>Territory</span><span>${you.territory}</span></div>
      <div class="row"><span>Explore</span><span>${you.explore}</span></div>
      <div class="row"><span>Wonders</span><span>${you.wonders}</span></div>
    </div></div>`;
    el.querySelector("#back")!.addEventListener("click", () => { ui.screen = "game"; paint(); });
    return;
  }
  if (ui.screen === "settings") {
    el.innerHTML = `<div class="overlay" data-screen="settings"><button class="back-arrow" id="back">‹</button><div class="panel"><h3>Settings</h3>
      <div class="row">Music <button class="chip ${ui.music ? "on" : ""}" id="m">${ui.music ? "on" : "off"}</button></div>
      <div class="row">SFX <button class="chip ${ui.sfx ? "on" : ""}" id="s">${ui.sfx ? "on" : "off"}</button></div>
      <p class="level-sub">Original WebAudio bed — select, move, attack, harvest, research, victory. Light tide pad when Music is on.</p>
      <button class="play-btn" id="resign">Resign</button>
    </div></div>`;
    el.querySelector("#back")!.addEventListener("click", () => { ui.screen = "game"; paint(); });
    el.querySelector("#m")!.addEventListener("click", () => {
      ui.music = !ui.music;
      setMusic(ui.music);
      if (ui.music) playSfx("ui");
      paintChrome();
    });
    el.querySelector("#s")!.addEventListener("click", () => {
      ui.sfx = !ui.sfx;
      setSfx(ui.sfx);
      if (ui.sfx) playSfx("ui");
      paintChrome();
    });
    el.querySelector("#resign")!.addEventListener("click", () => { localStorage.removeItem(SAVE_KEY); ui.game = null; ui.screen = "faction"; render(); });
    return;
  }
  el.innerHTML = "";
}

function paintTechTree(c: HTMLCanvasElement): void {
  const g = ui.game!;
  const p = g.players[0];
  const r = appEl.getBoundingClientRect();
  c.width = r.width * devicePixelRatio;
  c.height = r.height * devicePixelRatio;
  const ctx = c.getContext("2d")!;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  const bg = ctx.createRadialGradient(r.width / 2, r.height * 0.2, 40, r.width / 2, r.height / 2, r.width * 0.7);
  bg.addColorStop(0, "#0a2030");
  bg.addColorStop(1, "#02060c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, r.width, r.height);
  ctx.strokeStyle = "rgba(70,200,255,0.16)";
  ctx.lineWidth = 1;
  const step = 36;
  for (let x = -40; x < r.width + 80; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + r.height * 0.58, r.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - r.height * 0.58, r.height); ctx.stroke();
  }
  drawStarfield(ctx, r.width, r.height, g.seed + 9, true);
  const cities = cityCount(g, 0);
  const literacy = p.techs.includes("cognition");
  const pos = techColumns(r.width, r.height);
  ctx.strokeStyle = "rgba(90,200,255,0.35)";
  ctx.lineWidth = 2;
  for (const id of TECH_LIST) {
    const t = techDef(id);
    if (!t.parent) continue;
    const a = pos[t.parent];
    const b = pos[id];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y + 18);
    ctx.lineTo(b.x, b.y - 18);
    ctx.stroke();
  }
  const branches = [
    { name: "Hunt", x: pos.tracking.x },
    { name: "Grav", x: pos.gravMobility.x },
    { name: "Supply", x: pos.logistics.x },
    { name: "Ridge", x: pos.ridgecraft.x },
    { name: "Tide", x: pos.aquaculture.x },
  ];
  ctx.textAlign = "center";
  ctx.font = "bold 13px system-ui";
  ctx.fillStyle = "#7ffff6";
  for (const b of branches) ctx.fillText(b.name.toUpperCase(), b.x, 58);
  for (const id of TECH_LIST) {
    const t = techDef(id);
    const { x, y } = pos[id];
    const have = p.techs.includes(id);
    const open = canResearch(p.techs, id);
    const cost = techCost(t.tier, cities, literacy);
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fillStyle = have ? "#2f9e55" : open ? "#2d8cff" : "#1b2430";
    if (open && !have) { ctx.shadowColor = "#2d8cff"; ctx.shadowBlur = 14; }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = have ? "#7dff9a" : open ? "#9fd4ff" : "#3a4654";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (open && !have) {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px system-ui";
      ctx.fillText(String(cost), x, y + 4);
    } else if (have) {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px system-ui";
      ctx.fillText("✓", x, y + 4);
    }
    ctx.fillStyle = "#fff";
    ctx.font = "12px system-ui";
    ctx.fillText(t.name, x, y + 34);
    ctx.fillStyle = "rgba(190,220,230,0.75)";
    ctx.font = "10px system-ui";
    ctx.fillText(t.unlocks.split("·")[0].trim(), x, y + 46);
  }
  c.onclick = (e) => {
    const rect = c.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (const id of TECH_LIST) {
      const pnt = pos[id];
      if ((x - pnt.x) ** 2 + (y - pnt.y) ** 2 < 28 ** 2) {
        if (canResearch(p.techs, id)) apply({ type: "research", tech: id });
      }
    }
  };
}

function techColumns(w: number, h: number): Record<TechId, { x: number; y: number }> {
  const roots: TechId[] = ["tracking", "gravMobility", "logistics", "ridgecraft", "aquaculture"];
  const out = {} as Record<TechId, { x: number; y: number }>;
  const top = 110;
  const mid = top + Math.min(150, h * 0.22);
  const leaf = mid + Math.min(150, h * 0.22);
  roots.forEach((root, i) => {
    const x = w * (0.12 + i * 0.19);
    out[root] = { x, y: top };
    const kids = TECH_LIST.filter((id) => techDef(id).parent === root);
    kids.forEach((id, k) => {
      const kx = x + (k === 0 ? -42 : 42);
      out[id] = { x: kx, y: mid };
      const grand = TECH_LIST.filter((g) => techDef(g).parent === id);
      grand.forEach((g) => {
        out[g] = { x: kx, y: leaf };
      });
    });
  });
  return out;
}

function levelLabel(o: LevelUpReward): string {
  const map: Record<LevelUpReward, string> = {
    workshop: "Workshop (+1⚡)",
    explorer: "Explorer burst",
    wall: "Walls (×4 defence)",
    stars: "+5 Energy",
    pop: "Population +3",
    border: "Expand border",
    park: "Park (+score)",
    titan: "Deploy Titan",
  };
  return map[o] ?? o;
}

function paintModal(): void {
  const el = appEl.querySelector("#modal");
  if (!el || !ui.game) return;
  if (ui.game.pendingLevelUp && ui.game.currentPlayer === 0) {
    const city = ui.game.cities.find((c) => c.id === ui.game!.pendingLevelUp!.cityId);
    const opts = ui.game.pendingLevelUp.options;
    el.innerHTML = `<div class="modal" data-screen="levelup"><div class="box level-box">
      <h3>${city?.name ?? "Colony"} leveled up</h3>
      <p class="level-sub">Turn paused — pick a reward</p>
      <div class="level-grid">
        ${opts.map((o, i) => `<button class="level-card" data-r="${o}"><span class="pick">${i === 0 ? "A" : i === 1 ? "B" : String.fromCharCode(65 + i)}</span>${levelLabel(o)}</button>`).join("")}
      </div>
    </div></div>`;
    el.querySelectorAll("button").forEach((b) => {
      b.addEventListener("click", () => apply({ type: "levelUp", reward: b.getAttribute("data-r") as LevelUpReward }));
    });
    return;
  }
  el.innerHTML = "";
}

function renderEnd(): void {
  const g = ui.game!;
  const ranked = g.players.map((p) => ({ p, s: finalScore(g, p.id), b: scoreBreakdown(g, p.id) })).sort((a, b) => b.s - a.s);
  const win = ranked[0];
  const youWin = win.p.id === 0;
  const you = ranked.find((r) => r.p.id === 0)!;
  appEl.innerHTML = `<div class="end-screen trailer-end" data-screen="end">
    <canvas class="hero-bg" id="end-hero"></canvas>
    <div class="victory-card">
    <h2>${youWin ? "VICTORY" : "DEFEAT"}</h2>
    <div class="rule"></div>
    <div class="end-hero">${youWin ? "ORBIT SECURED" : "SIGNAL LOST"} · ${FACTIONS[win.p.faction].name}</div>
    <div class="panel">
      ${ranked.map((r, i) => `<div class="row"><span>${i + 1}. ${FACTIONS[r.p.faction].name}${r.p.id === 0 ? " (you)" : ""}</span><span>${r.s}</span></div>`).join("")}
      <h3 style="margin:18px 0 8px;font-weight:500">Your breakdown</h3>
      <div class="row"><span>Army</span><span>${you.b.army}</span></div>
      <div class="row"><span>Science</span><span>${you.b.science}</span></div>
      <div class="row"><span>Cities</span><span>${you.b.cities}</span></div>
      <div class="row"><span>Territory</span><span>${you.b.territory}</span></div>
      <div class="row"><span>Explore</span><span>${you.b.explore}</span></div>
      <div class="row"><span>Wonders</span><span>${you.b.wonders}</span></div>
      <div class="end-actions">
        <button class="play-btn ghost" id="again">Rematch</button>
        <button class="play-btn ghost" id="menu">Main Menu</button>
      </div>
    </div></div></div>`;
  if (youWin) playSfx("victory");
  else playSfx("end");
  paintEndHero();
  const reset = (): void => {
    localStorage.removeItem(SAVE_KEY);
    ui.game = null;
    ui.screen = "faction";
    render();
  };
  appEl.querySelector("#again")!.addEventListener("click", () => {
    localStorage.removeItem(SAVE_KEY);
    startGame();
  });
  appEl.querySelector("#menu")!.addEventListener("click", reset);
}

function onKey(e: KeyboardEvent): void {
  if (e.key === "e" || e.key === "E") {
    if (ui.screen === "game") apply({ type: "endTurn" });
  }
  if (e.key === "n" || e.key === "N") {
    if (ui.screen === "game") cycleIdleUnit();
  }
  if (e.key === "t" || e.key === "T") {
    if (ui.screen === "game") { ui.screen = "tech"; paint(); }
    else if (ui.screen === "tech") { ui.screen = "game"; paint(); }
  }
}

function save(): void {
  if (!ui.game) return;
  localStorage.setItem(SAVE_KEY, JSON.stringify({ game: ui.game, ui: { faction: ui.faction, size: ui.size } }));
}

function expose(): void {
  setSfx(ui.sfx);
  setMusic(ui.music);
  (window as unknown as { __GRIDFALL__: unknown }).__GRIDFALL__ = {
    ui,
    start: (opts?: Partial<typeof ui>) => {
      Object.assign(ui, opts);
      startGame();
    },
    apply,
    dispatchHuman: (cmds: Command[]) => {
      for (const c of cmds) apply(c);
    },
    state: () => ui.game,
    screen: () => ui.screen,
    chooseCommands,
    runAis,
    selectUnit: (id: string) => { ui.selected = id; paint(); },
    goto: (s: UiState["screen"]) => { ui.screen = s; if (s === "faction" || s === "setup" || s === "end") render(); else paint(); },
    worldToScreen: (x: number, y: number) => projectTile(x, y, 0.4),
    aim: (x: number, y: number, zoom: number) => {
      ui.cam.x = x;
      ui.cam.y = y;
      ui.cam.zoom = zoom;
      camGoal.x = x;
      camGoal.y = y;
      camGoal.zoom = zoom;
    },
    fx,
    paint: () => paint(),
  };
}

