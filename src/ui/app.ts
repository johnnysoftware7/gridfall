import { FACTIONS, FACTION_ORDER } from "../data/factions";
import { TECH_LIST, canResearch, techCost, techDef } from "../data/techs";
import { UNITS, unitDef } from "../data/units";
import { chooseCommands, runAiTurn } from "../ai/choose";
import { SAVE_KEY } from "../data/constants";
import { createGame } from "../engine/createGame";
import { dispatch, legalTileActions } from "../engine/actions";
import { canAct, legalAttacks, legalMoves } from "../engine/movement";
import { cityAt, cityCount, cityIncome, current, playerIncome, tileAt, unitAt } from "../engine/queries";
import { computeScore, finalScore } from "../engine/score";
import type { Command, Difficulty, FactionId, GameMode, GameState, LevelUpReward, PlayerId, TechId, Unit } from "../engine/types";
import { drawHelmetMedallion } from "../render/art/helmets";
import { drawBoard, focusCapital } from "../render/board";
import { pickTile, type Camera } from "../render/iso";

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
  sfx: false,
};

let appEl: HTMLElement;
let dragging = false;
let last = { x: 0, y: 0 };
let pinch = 0;

export function mount(el: HTMLElement): void {
  appEl = el;
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as { game: GameState; ui: Partial<UiState> };
      if (parsed.game && !parsed.game.over) {
        ui.game = parsed.game;
        ui.screen = "game";
        ui.cam = focusCapital(parsed.game, 0);
      }
    } catch { /* ignore */ }
  }
  render();
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", () => {
    if (ui.screen === "game" || ui.screen === "tech") paint();
  });
  expose();
}

function render(): void {
  if (ui.screen === "faction") renderFaction();
  else if (ui.screen === "setup") renderSetup();
  else if (ui.screen === "end") renderEnd();
  else renderGameShell();
}

function renderFaction(): void {
  appEl.innerHTML = `
    <div class="faction-screen" data-screen="faction">
      <button class="back-arrow" data-act="noop">‹</button>
      <h1>- PICK YOUR FACTION -</h1>
      <div class="sub">Regular Factions</div>
      <div class="medals"></div>
      <canvas class="landscape"></canvas>
    </div>`;
  const medals = appEl.querySelector(".medals")!;
  for (const id of FACTION_ORDER) {
    const f = FACTIONS[id];
    const b = document.createElement("button");
    b.className = "medal";
    b.dataset.faction = id;
    b.innerHTML = `<canvas width="140" height="140"></canvas><div class="nm">${f.name}</div>`;
    medals.appendChild(b);
    const c = b.querySelector("canvas")!;
    const ctx = c.getContext("2d")!;
    drawHelmetMedallion(ctx, id, 70, 62, 48, f.color);
    b.onclick = () => { ui.faction = id; ui.screen = "setup"; render(); };
  }
  paintLandscape(appEl.querySelector(".landscape") as HTMLCanvasElement);
}

function paintLandscape(c: HTMLCanvasElement): void {
  const r = c.getBoundingClientRect();
  c.width = r.width * devicePixelRatio;
  c.height = r.height * devicePixelRatio;
  const ctx = c.getContext("2d")!;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  const h = r.height;
  const w = r.width;
  ctx.fillStyle = "#6b8a4e";
  mountain(ctx, w * 0.08, h * 0.72, w * 0.22, h * 0.38);
  ctx.fillStyle = "#5a7a42";
  mountain(ctx, w * 0.28, h * 0.78, w * 0.2, h * 0.32);
  ctx.fillStyle = "#7a9a55";
  mountain(ctx, w * 0.52, h * 0.7, w * 0.28, h * 0.48);
  ctx.fillStyle = "#4e6e38";
  mountain(ctx, w * 0.82, h * 0.74, w * 0.24, h * 0.36);
  ctx.fillStyle = "#3a7ca5";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.72);
  ctx.quadraticCurveTo(w * 0.4, h * 0.66, w, h * 0.7);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();
  ctx.fillStyle = "#2a5a80";
  ctx.beginPath();
  ctx.moveTo(w * 0.78, h * 0.78);
  ctx.lineTo(w * 0.9, h * 0.62);
  ctx.lineTo(w * 0.98, h * 0.8);
  ctx.closePath();
  ctx.fill();
}

function mountain(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w * 0.35, y - h);
  ctx.lineTo(x + w * 0.55, y - h * 0.55);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fill();
}

function renderSetup(): void {
  appEl.innerHTML = `
    <div class="setup-screen" data-screen="setup">
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
  ui.selected = null;
  ui.screen = "game";
  save();
  render();
}

function renderGameShell(): void {
  appEl.innerHTML = `
    <canvas id="board"></canvas>
    <div class="title-mark">GRIDFALL</div>
    <div class="hud-top" id="hud"></div>
    <div class="hud-br" id="br"></div>
    <div id="sel"></div>
    <div class="toast-stack" id="toasts"></div>
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
    if (!dragging) return;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) {
      ui.cam.x -= dx / ui.cam.zoom;
      ui.cam.y -= dy / ui.cam.zoom;
      last = { x: e.clientX, y: e.clientY };
      paint();
    }
  });
  c.addEventListener("pointerup", (e) => {
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    dragging = false;
    if (Math.abs(dx) + Math.abs(dy) < 6) onTap(e.clientX, e.clientY);
  });
  c.addEventListener("wheel", (e) => {
    e.preventDefault();
    ui.cam.zoom = Math.min(2.2, Math.max(0.45, ui.cam.zoom * (e.deltaY > 0 ? 0.92 : 1.08)));
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
      if (pinch) ui.cam.zoom = Math.min(2.2, Math.max(0.45, ui.cam.zoom * (d / pinch)));
      pinch = d;
      paint();
    }
  });
}

function onTap(cx: number, cy: number): void {
  if (!ui.game || ui.screen !== "game") return;
  const c = appEl.querySelector("#board") as HTMLCanvasElement;
  const rect = c.getBoundingClientRect();
  const tile = pickTile(cx - rect.left, cy - rect.top, ui.cam, rect.width, rect.height, ui.game.size);
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
  } else {
    ui.selected = null;
    ui.selectedTile = { x: tile.x, y: tile.y };
  }
  paint();
}

function apply(cmd: Command): void {
  if (!ui.game) return;
  ui.game = dispatch(ui.game, cmd);
  if (ui.game.pendingLevelUp && ui.game.currentPlayer === 0) {
    paint();
    return;
  }
  while (ui.game.pendingLevelUp && ui.game.currentPlayer !== 0) {
    ui.game = dispatch(ui.game, { type: "levelUp", reward: ui.game.pendingLevelUp.options[0] });
  }
  if (cmd.type === "endTurn") {
    runAis();
    save();
  }
  if (ui.game.over) ui.screen = "end";
  paint();
  if (ui.screen === "end") render();
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
  if (!ui.game) return;
  const c = appEl.querySelector("#board") as HTMLCanvasElement | null;
  if (!c) return;
  const r = appEl.getBoundingClientRect();
  c.width = r.width * devicePixelRatio;
  c.height = r.height * devicePixelRatio;
  const ctx = c.getContext("2d")!;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  const sel = ui.selected ? ui.game.units.find((u) => u.id === ui.selected) : undefined;
  const moves = sel && sel.owner === 0 ? legalMoves(ui.game, sel) : [];
  const attacks = sel && sel.owner === 0 ? legalAttacks(ui.game, sel).map((t) => ({ x: t.x, y: t.y })) : [];
  drawBoard(ctx, ui.game, ui.cam, { pid: 0, selected: ui.selected ?? undefined, moves, attacks });
  paintHud();
  paintSelect(sel);
  paintToasts();
  paintOverlay();
  paintModal();
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
      <button class="round-btn" data-go="settings"><div class="disc">☰</div><div class="cap">Settings</div></button>
      <button class="round-btn" data-go="stats"><div class="disc dark">◉<span class="rank-badge">${rank}</span></div><div class="cap">Game Stats</div></button>
      <button class="round-btn" data-go="tech"><div class="disc">⚗</div><div class="cap">Tech Tree</div></button>
      <button class="round-btn" id="endturn"><div class="disc">✓</div><div class="cap">End Turn</div></button>`;
    br.querySelectorAll("[data-go]").forEach((b) => {
      b.addEventListener("click", () => { ui.screen = b.getAttribute("data-go") as UiState["screen"]; paint(); });
    });
    br.querySelector("#endturn")!.addEventListener("click", () => apply({ type: "endTurn" }));
  }
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
    const hint = sel.owner === 0
      ? (legalAttacks(ui.game, sel).length ? "Pick a red marker to attack." : canAct(sel) ? "Pick a light tile to move." : "This unit has acted.")
      : `${d.name}`;
    const acts = sel.owner === 0 ? unitButtons(sel) : "";
    box.innerHTML = `
      <div class="sel-card" data-unit="${sel.id}">
        <div style="height:54px"></div>
        <div class="namebar" style="background:${fac.color}">${d.name}<span>${Math.ceil(sel.hp)}/${sel.maxHp}</span></div>
        <div class="hpbar"><i style="width:${(sel.hp / sel.maxHp) * 100}%"></i></div>
        <div class="hint">${hint}</div>
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
  el.innerHTML = ui.game.toasts.slice(-3).map((t) => `<div class="toast"><b>${t.title}</b><span>${t.body}</span></div>`).join("");
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
    el.innerHTML = `<div class="overlay" data-screen="stats"><button class="back-arrow" id="back">‹</button><div class="panel"><h3>Game Stats</h3>
      ${g.players.map((p) => `<div class="row"><span>${FACTIONS[p.faction].name}</span><span>${computeScore(g, p.id)}</span></div>`).join("")}
    </div></div>`;
    el.querySelector("#back")!.addEventListener("click", () => { ui.screen = "game"; paint(); });
    return;
  }
  if (ui.screen === "settings") {
    el.innerHTML = `<div class="overlay" data-screen="settings"><button class="back-arrow" id="back">‹</button><div class="panel"><h3>Settings</h3>
      <div class="row">Music <button class="chip ${ui.music ? "on" : ""}" id="m">stub</button></div>
      <div class="row">SFX <button class="chip ${ui.sfx ? "on" : ""}" id="s">stub</button></div>
      <button class="play-btn" id="resign">Resign</button>
    </div></div>`;
    el.querySelector("#back")!.addEventListener("click", () => { ui.screen = "game"; paint(); });
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
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, r.width, r.height);
  const cx = r.width / 2;
  const cy = r.height / 2 + 10;
  const cities = cityCount(g, 0);
  const literacy = p.techs.includes("cognition");
  const pos = techLayout(cx, cy);
  ctx.strokeStyle = "#3a3a3a";
  ctx.lineWidth = 2;
  for (const id of TECH_LIST) {
    const t = techDef(id);
    if (!t.parent) continue;
    const a = pos[t.parent];
    const b = pos[id];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  drawHelmetMedallion(ctx, p.faction, cx, cy, 28, FACTIONS[p.faction].color);
  for (const id of TECH_LIST) {
    const t = techDef(id);
    const { x, y } = pos[id];
    const have = p.techs.includes(id);
    const open = canResearch(p.techs, id);
    const cost = techCost(t.tier, cities, literacy);
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fillStyle = have ? "#3db85a" : open ? "#3d8cff" : "#2a2a2a";
    ctx.fill();
    if (open && !have) {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(String(cost), x, y + 4);
    }
    ctx.fillStyle = "#fff";
    ctx.font = "12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(t.name, x, y + 34);
    const hit = document.createElement("div");
    void hit;
  }
  c.onclick = (e) => {
    const rect = c.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (const id of TECH_LIST) {
      const pnt = pos[id];
      if ((x - pnt.x) ** 2 + (y - pnt.y) ** 2 < 22 ** 2) {
        if (canResearch(p.techs, id)) apply({ type: "research", tech: id });
      }
    }
  };
}

function techLayout(cx: number, cy: number): Record<TechId, { x: number; y: number }> {
  const roots: TechId[] = ["tracking", "gravMobility", "logistics", "ridgecraft", "aquaculture"];
  const angles = [-Math.PI * 0.72, -Math.PI * 0.28, Math.PI * 0.12, Math.PI * 0.55, Math.PI * 0.95];
  const out = {} as Record<TechId, { x: number; y: number }>;
  roots.forEach((id, i) => {
    const a = angles[i];
    placeBranch(out, id, cx, cy, a, 100);
  });
  return out;
}

function placeBranch(out: Record<TechId, { x: number; y: number }>, root: TechId, cx: number, cy: number, ang: number, dist: number): void {
  out[root] = { x: cx + Math.cos(ang) * dist, y: cy + Math.sin(ang) * dist };
  const kids = TECH_LIST.filter((id) => techDef(id).parent === root);
  kids.forEach((id, i) => {
    const spread = kids.length === 1 ? 0 : (i === 0 ? -0.28 : 0.28);
    const a2 = ang + spread;
    out[id] = { x: cx + Math.cos(a2) * (dist + 96), y: cy + Math.sin(a2) * (dist + 96) };
    const grand = TECH_LIST.filter((g) => techDef(g).parent === id);
    grand.forEach((g) => {
      out[g] = { x: cx + Math.cos(a2) * (dist + 192), y: cy + Math.sin(a2) * (dist + 192) };
    });
  });
}

function paintModal(): void {
  const el = appEl.querySelector("#modal");
  if (!el || !ui.game) return;
  if (ui.game.pendingLevelUp && ui.game.currentPlayer === 0) {
    const city = ui.game.cities.find((c) => c.id === ui.game!.pendingLevelUp!.cityId);
    el.innerHTML = `<div class="modal" data-screen="levelup"><div class="box">
      <h3>${city?.name ?? "Colony"} leveled up</h3>
      ${ui.game.pendingLevelUp.options.map((o) => `<button data-r="${o}">${o}</button>`).join("")}
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
  appEl.innerHTML = `<div class="end-screen" data-screen="end"><h2 style="text-align:center;margin-top:80px">GRIDFALL</h2>
    <div class="panel" style="max-width:480px;margin:24px auto;padding:20px">
      ${g.players.map((p) => `<div class="row"><span>${FACTIONS[p.faction].name}</span><span>${finalScore(g, p.id)}</span></div>`).join("")}
      <button class="play-btn" id="again">Again</button>
    </div></div>`;
  appEl.querySelector("#again")!.addEventListener("click", () => {
    localStorage.removeItem(SAVE_KEY);
    ui.game = null;
    ui.screen = "faction";
    render();
  });
}

function onKey(e: KeyboardEvent): void {
  if (e.key === "e" || e.key === "E") {
    if (ui.screen === "game") apply({ type: "endTurn" });
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
  };
}

