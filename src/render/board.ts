import { FACTIONS } from "../data/factions";
import { TILE_H, TILE_W } from "../data/constants";
import { canAct } from "../engine/movement";
import { chebyshev, cityAt, tileAt } from "../engine/queries";
import type { GameState, PlayerId } from "../engine/types";
import { drawFence, drawFog, drawForest, drawResource, drawRidge, drawRoad, drawRuin, drawTile } from "./art/terrain";
import { drawSpire } from "./art/helmets";
import { drawUnit } from "./art/units";
import { drawFx, fx, hopAt } from "./fx";
import { diamond, iso, type Camera } from "./iso";

export function drawStarfield(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, skipBg = false): void {
  const t = fx.now || (typeof performance !== "undefined" ? performance.now() : 0);
  if (!skipBg) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#02040c");
    g.addColorStop(0.55, "#000");
    g.addColorStop(1, "#031018");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  for (let i = 0; i < 180; i++) {
    const x = ((seed * 17 + i * 97) % 1000) / 1000 * w;
    const y = ((seed * 31 + i * 53) % 1000) / 1000 * h;
    const tw = 0.35 + Math.sin(t * 0.002 + i) * 0.25 + ((i * 13) % 70) / 140;
    ctx.fillStyle = i % 11 === 0 ? `rgba(140,220,255,${tw})` : `rgba(255,255,255,${tw})`;
    const s = i % 9 === 0 ? 2.2 : 1;
    ctx.fillRect(x, y, s, s);
  }
}

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cam: Camera,
  view: {
    pid: PlayerId;
    selected?: string;
    moves: { x: number; y: number }[];
    attacks: { x: number; y: number }[];
    hover?: { x: number; y: number } | null;
  },
): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  drawStarfield(ctx, w, h, state.seed);
  const ox = fx.shake ? (Math.random() - 0.5) * fx.shake : 0;
  const oy = fx.shake ? (Math.random() - 0.5) * fx.shake : 0;
  ctx.save();
  ctx.translate(w / 2 - cam.x * cam.zoom + ox, h / 2 - cam.y * cam.zoom + oy);
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
    if (!p.explored[y * state.size + x]) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      diamond(ctx, x, y, "#041018", undefined);
      ctx.restore();
    }
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
      const ip = iso(x, y);
      const pulse = 0.35 + Math.sin((fx.now || 0) * 0.008 + x) * 0.2;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 230, 80, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(ip.x, ip.y + 4, 12, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      drawResource(ctx, x, y, t.resource);
    }
    if (t.building === "dock") drawDock(ctx, x, y);
    if (t.building && t.building !== "dock") {
      drawBuilding(ctx, x, y, t.building, t.owner !== null ? FACTIONS[state.players[t.owner].faction].color : "#aaa", t.templeLevel);
    }
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

  const pulse = 0.45 + Math.sin((fx.now || 0) * 0.008) * 0.2;
  for (const m of view.moves) {
    diamond(ctx, m.x, m.y, `rgba(30,120,255,${0.22 + pulse * 0.15})`, "#4da3ff");
    const ip = iso(m.x, m.y);
    ctx.save();
    ctx.strokeStyle = `rgba(50,170,255,${0.75 + pulse})`;
    ctx.lineWidth = 4;
    ctx.shadowColor = "#2d8cff";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(ip.x, ip.y + 2, 20, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#dff2ff";
    ctx.lineWidth = 1.6;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(ip.x, ip.y + 2, 13, 6.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (view.hover) {
    diamond(ctx, view.hover.x, view.hover.y, "rgba(255,255,255,0.12)", "rgba(255,255,255,0.85)");
  }

  for (const { x, y } of order) {
    if (!p.explored[y * state.size + x]) continue;
    const city = cityAt(state, x, y);
    if (city) {
      const fac = city.owner !== null ? FACTIONS[state.players[city.owner].faction] : null;
      const pt = iso(x, y);
      drawSpire(ctx, fac?.id ?? "helix", pt.x, pt.y, city.isCapital, fac?.color ?? "#bbb");
      if (city.monument) drawMonument(ctx, pt.x, pt.y, fac?.color ?? "#f5d76e", city.monument);
    }
  }

  if (view.selected) {
    const su = state.units.find((u) => u.id === view.selected);
    if (su) {
      const ip = iso(su.x, su.y);
      ctx.save();
      ctx.strokeStyle = "#7ffff6";
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(ip.x, ip.y + 6, 22, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  for (const { x, y } of order) {
    if (!p.explored[y * state.size + x]) continue;
    const u = state.units.find((un) => un.x === x && un.y === y);
    if (!u) continue;
    if (u.hidden && u.owner !== view.pid) continue;
    const fac = FACTIONS[state.players[u.owner].faction];
    const hop = hopAt(u.id);
    const dx = hop ? hop.x : u.x;
    const dy = hop ? hop.y : u.y;
    drawUnit(ctx, dx, dy, u.type, fac.color, fac.id, {
      glow: u.owner === view.pid && canAct(u),
      hp: u.hp,
      maxHp: u.maxHp,
      hidden: u.hidden && u.owner === view.pid,
      badgeScale: Math.max(1, 1.35 / Math.max(0.55, cam.zoom)),
      hopArc: hop?.arc ?? 0,
    });
  }

  for (const a of view.attacks) {
    const ip = iso(a.x, a.y);
    const bounce = Math.sin((fx.now || 0) * 0.012) * 2;
    ctx.save();
    ctx.strokeStyle = `rgba(255,40,50,${0.85})`;
    ctx.lineWidth = 4;
    ctx.shadowColor = "#ff2030";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(ip.x, ip.y + 2, 20, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#e22424";
    ctx.beginPath();
    ctx.arc(ip.x, ip.y - 40 + bounce, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("!", ip.x, ip.y - 34 + bounce);
    ctx.restore();
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

  drawFx(ctx);
  ctx.restore();
  if (fx.flash > 0) {
    ctx.fillStyle = `rgba(255,240,210,${fx.flash * 0.35})`;
    ctx.fillRect(0, 0, w, h);
  }
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
  const t = fx.now || 0;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = "#c9b48a";
  ctx.fillRect(-14, -5, 28, 10);
  ctx.fillStyle = "#8ac";
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(126, 220, 255, ${0.35 + Math.sin(t * 0.008 + x) * 0.2})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 8, 16, 5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, kind: string, color: string, level = 1): void {
  const p = iso(x, y);
  const t = fx.now || 0;
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
    const h = 22 + Math.min(5, Math.max(1, level)) * 10;
    const pulse = 0.45 + Math.sin(t * 0.006 + x * 1.7) * 0.25;
    const beam = ctx.createLinearGradient(0, -h - 40, 0, 8);
    beam.addColorStop(0, `rgba(232, 246, 255, 0)`);
    beam.addColorStop(0.35, `rgba(180, 230, 255, ${0.15 + pulse * 0.25})`);
    beam.addColorStop(1, `rgba(255, 255, 255, ${0.55 + pulse * 0.3})`);
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(-7, 8);
    ctx.lineTo(-2, -h - 36);
    ctx.lineTo(2, -h - 36);
    ctx.lineTo(7, 8);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = "#c8f4ff";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#f4fbff";
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.lineTo(0, -h);
    ctx.lineTo(8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(255,255,255,${0.35 + pulse})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, -h - 8, 10 + pulse * 6, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(-6, 4, 12, 5);
  } else {
    ctx.fillRect(-7, -8, 14, 12);
    ctx.fillStyle = "#eee";
    ctx.fillRect(-3, -12, 6, 5);
  }
  ctx.restore();
}

function drawMonument(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, id: string): void {
  const t = fx.now || 0;
  const pulse = 0.5 + Math.sin(t * 0.005) * 0.25;
  ctx.save();
  ctx.translate(x, y - 52);
  ctx.shadowColor = color;
  ctx.shadowBlur = 22;
  ctx.strokeStyle = `rgba(255, 230, 140, ${0.45 + pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 14 + pulse * 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#f5d76e";
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(5, -4);
  ctx.lineTo(-5, -4);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "9px system-ui";
  ctx.textAlign = "center";
  const label = id === "killgate" ? "KILLGATE" : id === "vaultSurplus" ? "VAULT" : id === "archiveSpire" ? "ARCHIVE" : id === "nexusMarket" ? "NEXUS" : "ARRAY";
  ctx.fillText(label, 0, 22);
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
  ctx.font = "14px system-ui, sans-serif";
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
  if (!c) return { x: 0, y: 0, zoom: 2.15 };
  const p = iso(c.x, c.y);
  return { x: p.x, y: p.y, zoom: 2.2 };
}
