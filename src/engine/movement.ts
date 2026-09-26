import { hasSkill, unitDef } from "../data/units";
import type { GameState, PlayerId, Tile, Unit } from "./types";
import { chebyshev, inBounds, isWater, playerHas, tileAt, unitAt } from "./queries";

export function isRough(tile: Tile): boolean {
  return tile.terrain === "forest" || tile.terrain === "ridge";
}

export function canStandOn(state: GameState, unit: Unit, tile: Tile): boolean {
  const naval = hasSkill(unit.type, "water");
  if (naval) {
    if (isWater(tile.terrain) || tile.bridge) return true;
    const city = state.cities.find((c) => c.x === tile.x && c.y === tile.y);
    if (city) return true;
    return false;
  }
  if (tile.terrain === "deep") {
    return false;
  }
  if (tile.terrain === "shelf") {
    return tile.bridge || tile.building === "dock";
  }
  if (tile.terrain === "ridge" && !playerHas(state, unit.owner, "ridgecraft")) return false;
  return true;
}

export function stepCost(state: GameState, unit: Unit, from: Tile, to: Tile): number {
  const roadOk =
    (from.road || !!state.cities.find((c) => c.x === from.x && c.y === from.y)) &&
    (to.road || to.bridge || !!state.cities.find((c) => c.x === to.x && c.y === to.y));
  const enemyRoad = to.owner !== null && to.owner !== unit.owner && !atPeace(state, unit.owner, to.owner);
  if (roadOk && !enemyRoad && to.terrain !== "ridge") return 0.5;
  return 1;
}

export function atPeace(state: GameState, a: PlayerId, b: PlayerId): boolean {
  return state.players.find((p) => p.id === a)?.peaceWith.includes(b) ?? false;
}

export function inZoc(state: GameState, unit: Unit, x: number, y: number): boolean {
  if (hasSkill(unit.type, "creep") || hasSkill(unit.type, "hide")) return false;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const u = unitAt(state, x + dx, y + dy);
      if (u && u.owner !== unit.owner && !atPeace(state, unit.owner, u.owner)) return true;
    }
  }
  return false;
}

export function fogBlocked(state: GameState, pid: PlayerId, x: number, y: number): boolean {
  const p = state.players.find((pl) => pl.id === pid);
  if (!p) return true;
  return !p.explored[y * state.size + x];
}

export interface MoveNode {
  x: number;
  y: number;
  cost: number;
}

export function legalMoves(state: GameState, unit: Unit): MoveNode[] {
  const def = unitDef(unit.type);
  if (unit.acted) return [];
  if (unit.moved) return [];
  const budget = def.movement;
  const seen = new Map<string, number>();
  const out: MoveNode[] = [];
  const q: { x: number; y: number; left: number; first: boolean }[] = [
    { x: unit.x, y: unit.y, left: budget, first: true },
  ];
  seen.set(`${unit.x},${unit.y}`, budget);

  while (q.length) {
    const cur = q.shift()!;
    if (!cur.first) {
      out.push({ x: cur.x, y: cur.y, cost: budget - cur.left });
    }
    if (cur.left <= 0 && !cur.first) continue;
    if (!cur.first && isRough(tileAt(state, cur.x, cur.y)!) && !hasRoadBoost(state, unit, cur.x, cur.y)) {
      continue;
    }
    if (!cur.first && inZoc(state, unit, cur.x, cur.y)) continue;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        if (!inBounds(state, nx, ny)) continue;
        if (fogBlocked(state, unit.owner, nx, ny) && chebyshev(unit.x, unit.y, nx, ny) > 1) {
          // can step one tile into fog from a seen tile
        }
        if (fogBlocked(state, unit.owner, nx, ny) && chebyshev(cur.x, cur.y, unit.x, unit.y) > 0 && cur.left < budget) {
          continue;
        }
        if (fogBlocked(state, unit.owner, nx, ny) && !cur.first) continue;
        const dest = tileAt(state, nx, ny);
        if (!dest) continue;
        const dockEmbark = dest.building === "dock" && dest.owner === unit.owner && !hasSkill(unit.type, "water");
        if (!canStandOn(state, unit, dest) && !dockEmbark) continue;
        const occ = unitAt(state, nx, ny);
        if (occ && occ.id !== unit.id) {
          if (occ.owner !== unit.owner && !hasSkill(unit.type, "hide")) continue;
          if (occ.owner === unit.owner) continue;
        }
        const from = tileAt(state, cur.x, cur.y)!;
        let cost = stepCost(state, unit, from, dest);
        if (hasSkill(unit.type, "creep") && dest.terrain !== "ridge") cost = 1;
        if (cur.left + 1e-9 < cost && cur.left < 0.5) continue;
        // remaining movement rounds up: 0.5 can pay 1
        if (cur.left + 1e-9 < cost && cur.left < 1 && cost >= 1) {
          if (cur.left < 0.5 - 1e-9) continue;
        }
        const left = Math.max(0, cur.left - cost);
        const key = `${nx},${ny}`;
        const prev = seen.get(key);
        if (prev !== undefined && prev >= left) continue;
        seen.set(key, left);
        q.push({ x: nx, y: ny, left, first: false });
      }
    }
  }
  return uniqueMoves(out);
}

function hasRoadBoost(state: GameState, _unit: Unit, x: number, y: number): boolean {
  const t = tileAt(state, x, y);
  if (!t) return false;
  if (t.terrain === "ridge") return false;
  return t.road || t.bridge || !!state.cities.find((c) => c.x === x && c.y === y);
}

function uniqueMoves(moves: MoveNode[]): MoveNode[] {
  const m = new Map<string, MoveNode>();
  for (const mv of moves) m.set(`${mv.x},${mv.y}`, mv);
  return [...m.values()];
}

export function canMoveTo(state: GameState, unit: Unit, x: number, y: number): boolean {
  return legalMoves(state, unit).some((m) => m.x === x && m.y === y);
}

export function legalAttacks(state: GameState, unit: Unit): Unit[] {
  if (unit.acted || unit.attacked) return [];
  if (unit.moved && !hasSkill(unit.type, "dash")) return [];
  const def = unitDef(unit.type);
  if (def.range <= 0 && !hasSkill(unit.type, "convert") && !hasSkill(unit.type, "infiltrate")) return [];
  const out: Unit[] = [];
  for (const t of state.units) {
    if (t.owner === unit.owner) continue;
    if (atPeace(state, unit.owner, t.owner)) continue;
    if (t.hidden && t.owner !== unit.owner) continue;
    const d = chebyshev(unit.x, unit.y, t.x, t.y);
    if (d === 0 || d > def.range) continue;
    if (hasSkill(unit.type, "infiltrate")) continue;
    const tIdx = t.y * state.size + t.x;
    const p = state.players.find((pl) => pl.id === unit.owner);
    if (p && !p.explored[tIdx]) continue;
    out.push(t);
  }
  return out;
}

export function canAct(unit: Unit): boolean {
  if (unit.acted) return false;
  if (!unit.moved || (hasSkill(unit.type, "escape") && unit.attacked)) {
    if (!unit.moved) return true;
  }
  if (!unit.attacked && (hasSkill(unit.type, "dash") || !unit.moved)) return true;
  if (hasSkill(unit.type, "escape") && unit.attacked && !unit.moved) return true;
  return !unit.moved || (!unit.attacked && hasSkill(unit.type, "dash"));
}
