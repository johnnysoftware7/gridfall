import { FACTIONS } from "../data/factions";
import { TILE_H, TILE_W } from "../data/constants";
import { canAct } from "../engine/movement";
import { chebyshev, cityAt, tileAt } from "../engine/queries";
import type { GameState, PlayerId } from "../engine/types";
import { drawFence, drawFog, drawForest, drawResource, drawRidge, drawRoad, drawRuin, drawTile } from "./art/terrain";
import { drawSpire } from "./art/helmets";
import { drawUnit } from "./art/units";
import { diamond, iso, type Camera } from "./iso";

export function drawStarfield(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number): void {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 120; i++) {
    const x = ((seed * 17 + i * 97) % 1000) / 1000 * w;
    const y = ((seed * 31 + i * 53) % 1000) / 1000 * h;
    const a = 0.25 + ((i * 13) % 70) / 100;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x, y, i % 9 === 0 ? 2 : 1, i % 9 === 0 ? 2 : 1);
  }
}

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cam: Camera,
  view: { pid: PlayerId; selected?: string; moves: { x: number; y: number }[]; attacks: { x: number; y: number }[] },
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  drawStarfield(ctx, w, h, state.seed);
  ctx.save();
  ctx.translate(w / 2 - cam.x * cam.zoom, h / 2 - cam.y * cam.zoom);
  ctx.scale(cam.zoom, cam.zoom);

  const p = state.players.find((pl) => pl.id === view.pid)!;
  const order: { x: number; y: number }[] = [];
  for (let s = 0; s < state.size * 2; s++) {
    for (let x = 0; x < state.size; x++) {
      const y = s - x;
      if (y >= 0 && y < state.size) order.push({ x, y });
    }
  }

  for (const { x, y } of order) {
    const t = tileAt(state, x, y)!;
    const last = x === state.size - 1 || y === state.size - 1;
    drawTile(ctx, x, y, t.terrain, last);
  }

  for (const { x, y } of order) {
    const t = tileAt(state, x, y)!;
    if (!p.explored[y * state.size + x]) continue;
    if (t.terrain === "ridge") drawRidge(ctx, x, y);
    if (t.terrain === "forest") {
      const col = t.owner !== null ? FACTIONS[state.players[t.owner].faction].colorDark : "#1e4a28";
      drawForest(ctx, x, y, col);
    }
    if (t.ruin) drawRuin(ctx, x, y);
    if (t.resource && (resourceVisible(state, view.pid, t.resource))) {
      drawResource(ctx, x, y, t.resource);
    }
    if (t.building === "dock") drawDock(ctx, x, y);
    if (t.building && t.building !== "dock") drawBuilding(ctx, x, y, t.building, t.owner !== null ? FACTIONS[state.players[t.owner].faction].color : "#aaa");
    if (t.road || t.bridge) {
      const links = [];
      for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        const nt = tileAt(state, nx, ny);
        if (nt && (nt.road || nt.bridge || cityAt(state, nx, ny))) links.push({ x: nx, y: ny });
      }
      drawRoad(ctx, x, y, links);
    }
  }

  for (const { x, y } of order) {
    const t = tileAt(state, x, y)!;
    if (t.owner === null) continue;
    if (!p.explored[y * state.size + x]) continue;
    const col = FACTIONS[state.players[t.owner].faction].color;
    const edges = [
      !sameOwner(state, x, y - 1, t.owner),
      !sameOwner(state, x + 1, y, t.owner),
      !sameOwner(state, x, y + 1, t.owner),
      !sameOwner(state, x - 1, y, t.owner),
    ];
    drawFence(ctx, x, y, col, edges);
  }

  for (const m of view.moves) {
    diamond(ctx, m.x, m.y, "rgba(255,255,255,0.28)", "rgba(255,255,255,0.7)");
  }
  for (const a of view.attacks) {
    const ip = iso(a.x, a.y);
    ctx.fillStyle = "#e23";
    ctx.beginPath();
    ctx.arc(ip.x, ip.y, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const { x, y } of order) {
    if (!p.explored[y * state.size + x]) continue;
    const city = cityAt(state, x, y);
    if (city) {
      const fac = city.owner !== null ? FACTIONS[state.players[city.owner].faction] : null;
      const pt = iso(x, y);
      drawSpire(ctx, fac?.id ?? "helix", pt.x, pt.y, city.isCapital, fac?.color ?? "#bbb");
    }
  }

  for (const { x, y } of order) {
    if (!p.explored[y * state.size + x]) continue;
    const u = state.units.find((un) => un.x === x && un.y === y);
    if (!u) continue;
    if (u.hidden && u.owner !== view.pid) continue;
    const fac = FACTIONS[state.players[u.owner].faction];
    drawUnit(ctx, x, y, u.type, fac.color, fac.id, {
      glow: u.owner === view.pid && canAct(u),
      hp: u.hp,
      maxHp: u.maxHp,
      hidden: u.hidden && u.owner === view.pid,
    });
  }

  for (const { x, y } of order) {
    if (!p.explored[y * state.size + x]) {
      drawFog(ctx, x, y);
    }
  }

  for (const c of state.cities) {
    if (c.owner === null) {
      if (!p.explored[c.y * state.size + c.x]) continue;
      drawOutpostLabel(ctx, c.x, c.y);
      continue;
    }
    if (!p.explored[c.y * state.size + c.x] && !state.players[view.pid].techs.includes("envoys")) continue;
    drawCityLabel(ctx, state, c.id, view.pid);
  }

  ctx.restore();
  void TILE_W;
  void TILE_H;
  void chebyshev;
}

function resourceVisible(state: GameState, pid: PlayerId, res: string): boolean {
  const techs = state.players[pid].techs;
  if (res === "grain") return techs.includes("logistics") || techs.includes("cultivation");
  if (res === "ore") return techs.includes("ridgecraft");
  if (res === "starfish") return techs.includes("starfix") || techs.includes("aquaculture");
  return true;
}

function sameOwner(state: GameState, x: number, y: number, owner: PlayerId): boolean {
  const t = tileAt(state, x, y);
  return !!t && t.owner === owner;
}

function drawDock(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const p = iso(x, y);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = "#c9b48a";
  ctx.fillRect(-10, -4, 20, 8);
  ctx.fillStyle = "#8ac";
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, kind: string, color: string): void {
  const p = iso(x, y);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = color;
  if (kind === "hydroponics") {
    ctx.fillStyle = "#c8e86a";
    ctx.fillRect(-10, -2, 20, 6);
  } else if (kind === "extractor") {
    ctx.fillStyle = "#c86";
    ctx.fillRect(-6, -10, 12, 14);
  } else if (kind === "spireTap") {
    ctx.fillStyle = "#6a4";
    ctx.fillRect(-4, -12, 8, 14);
  } else if (kind.includes("Beacon") || kind === "beacon") {
    ctx.fillStyle = "#eee";
    ctx.beginPath();
    ctx.moveTo(-6, 6);
    ctx.lineTo(0, -16);
    ctx.lineTo(6, 6);
    ctx.fill();
  } else {
    ctx.fillRect(-7, -8, 14, 12);
    ctx.fillStyle = "#eee";
    ctx.fillRect(-3, -12, 6, 5);
  }
  ctx.restore();
}

function drawCityLabel(ctx: CanvasRenderingContext2D, state: GameState, cityId: string, _pid: PlayerId): void {
  const city = state.cities.find((c) => c.id === cityId);
  if (!city || city.owner === null) return;
  const fac = FACTIONS[state.players[city.owner].faction];
  const p = iso(city.x, city.y);
  const inc = city.level + (city.workshop ? 1 : 0) + city.parks + (city.isCapital ? 1 : 0);
  ctx.save();
  ctx.translate(p.x, p.y + 28);
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = 3;
  const label = `${city.isCapital ? "♛ " : ""}${city.name}`;
  ctx.strokeText(label, 0, 0);
  ctx.fillText(label, 0, 0);
  if (city.isCapital) {
    ctx.fillStyle = fac.color;
    ctx.fillRect(-ctx.measureText(city.name).width / 2, 2, ctx.measureText(city.name).width, 1.5);
  }
  ctx.font = "11px system-ui";
  ctx.fillStyle = "#ffe14a";
  ctx.fillText(`⚡${inc}`, 0, 14);
  const need = city.level + 1;
  const slots = need;
  const filled = Math.min(city.progress, slots);
  const w = slots * 8;
  ctx.translate(-w / 2, 20);
  for (let i = 0; i < slots; i++) {
    ctx.beginPath();
    ctx.arc(i * 8 + 3, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = i < filled ? "#3d8cff" : "rgba(255,255,255,0.25)";
    ctx.fill();
    if (i >= filled) {
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawOutpostLabel(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const p = iso(x, y);
  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.font = "11px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("Outpost", p.x, p.y + 26);
  ctx.restore();
}

export function focusCapital(state: GameState, pid: PlayerId): Camera {
  const c = state.cities.find((x) => x.owner === pid && x.isCapital) ?? state.cities.find((x) => x.owner === pid);
  if (!c) return { x: 0, y: 0, zoom: 1 };
  const p = iso(c.x, c.y);
  return { x: p.x, y: p.y, zoom: 1.05 };
}
