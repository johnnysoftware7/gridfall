import { hasSkill, unitDef } from "../data/units";
import { techCost } from "../data/techs";
import type { BuildingKind, City, GameState, Player, PlayerId, Terrain, Tile, Unit, UnitType } from "./types";

export function idx(state: GameState, x: number, y: number): number {
  return y * state.size + x;
}

export function inBounds(state: GameState, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < state.size && y < state.size;
}

export function tileAt(state: GameState, x: number, y: number): Tile | null {
  if (!inBounds(state, x, y)) return null;
  return state.tiles[idx(state, x, y)];
}

export function unitAt(state: GameState, x: number, y: number): Unit | undefined {
  return state.units.find((u) => u.x === x && u.y === y);
}

export function cityAt(state: GameState, x: number, y: number): City | undefined {
  return state.cities.find((c) => c.x === x && c.y === y);
}

export function player(state: GameState, id: PlayerId): Player {
  const p = state.players.find((x) => x.id === id);
  if (!p) throw new Error(`missing player ${id}`);
  return p;
}

export function current(state: GameState): Player {
  return player(state, state.currentPlayer);
}

export function chebyshev(ax: number, ay: number, bx: number, by: number): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

export function neighbors(x: number, y: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      out.push({ x: x + dx, y: y + dy });
    }
  }
  return out;
}

export function isWater(t: Terrain): boolean {
  return t === "shelf" || t === "deep";
}

export function isLand(t: Terrain): boolean {
  return t === "plain" || t === "forest" || t === "ridge";
}

export function isFriendlyTerritory(state: GameState, x: number, y: number, pid: PlayerId): boolean {
  const t = tileAt(state, x, y);
  return !!t && t.owner === pid;
}

export function cityCount(state: GameState, pid: PlayerId): number {
  return state.cities.filter((c) => c.owner === pid).length;
}

export function playerHas(state: GameState, pid: PlayerId, tech: string): boolean {
  return player(state, pid).techs.includes(tech as Player["techs"][number]);
}

export function researchCost(state: GameState, pid: PlayerId, techTier: 1 | 2 | 3): number {
  const p = player(state, pid);
  return techCost(techTier, cityCount(state, pid), p.techs.includes("cognition"));
}

export function popNeeded(level: number): number {
  return level + 1;
}

export function unitCapacity(city: City): number {
  return city.level + 1;
}

export function unitsOfCity(state: GameState, cityId: string): Unit[] {
  return state.units.filter((u) => u.cityId === cityId);
}

export function cityIncome(state: GameState, city: City): number {
  if (!city.owner && city.owner !== 0) {
    if (city.owner === null) return 0;
  }
  if (city.owner === null) return 0;
  const siege = state.units.find((u) => u.x === city.x && u.y === city.y && u.owner !== city.owner);
  if (siege) return 0;
  const p = player(state, city.owner);
  let inc = city.level + (city.workshop ? 1 : 0) + city.parks;
  if (city.isCapital) {
    const bonus = capitalBonus(p);
    inc += bonus;
  }
  for (const t of state.tiles) {
    if (t.cityId === city.id && t.building === "exchangeHub") {
      inc += exchangeIncome(state, t.x, t.y);
    }
  }
  for (const other of state.cities) {
    if (other.isCapital && other.originalOwner === city.owner && other.owner === city.owner) {
      // relays hosted here pay the host
    }
  }
  return inc;
}

export function capitalBonus(p: Player): number {
  if (!p.isHuman) {
    if (p.difficulty === "easy") return 0;
    if (p.difficulty === "hard") return 2;
    if (p.difficulty === "crazy") return 4;
  }
  return 1;
}

export function exchangeIncome(state: GameState, x: number, y: number): number {
  let n = 0;
  for (const nb of neighbors(x, y)) {
    const t = tileAt(state, x, y) && tileAt(state, nb.x, nb.y);
    if (!t) continue;
    if (t.building === "sporeMill" || t.building === "condenser" || t.building === "smelter") {
      n += Math.max(1, t.buildingLevel);
    }
  }
  return Math.min(8, n);
}

export function playerIncome(state: GameState, pid: PlayerId): number {
  let sum = 0;
  for (const c of state.cities) {
    if (c.owner === pid) sum += cityIncome(state, c);
  }
  return sum;
}

export function visibleTo(state: GameState, pid: PlayerId, x: number, y: number): boolean {
  const p = player(state, pid);
  return !!p.explored[idx(state, x, y)];
}

export function visionRange(state: GameState, unit: Unit): number {
  if (hasSkill(unit.type, "scout")) return 2;
  const t = tileAt(state, unit.x, unit.y);
  if (t?.terrain === "ridge") return 2;
  return 1;
}

export function canTrain(state: GameState, city: City, type: UnitType): boolean {
  if (city.owner === null) return false;
  if (city.owner !== state.currentPlayer) return false;
  if (unitAt(state, city.x, city.y)) return false;
  const def = unitDef(type);
  if (!def.trainable) return false;
  if (def.tech && !playerHas(state, city.owner, def.tech)) return false;
  if (unitsOfCity(state, city.id).length >= unitCapacity(city)) return false;
  const p = player(state, city.owner);
  return p.energy >= def.cost;
}

export function buildingName(k: BuildingKind | "road" | "bridge"): string {
  const map: Record<string, string> = {
    hydroponics: "Hydroponics",
    extractor: "Extractor",
    spireTap: "Spire Tap",
    sporeMill: "Spore Mill",
    condenser: "Condenser",
    smelter: "Smelter",
    dock: "Dock Ring",
    exchangeHub: "Exchange Hub",
    beacon: "Beacon",
    forestBeacon: "Bioforest Beacon",
    ridgeBeacon: "Ridge Beacon",
    shelfBeacon: "Shelf Beacon",
    monument: "Monument",
    road: "Maglev",
    bridge: "Alloy Span",
  };
  return map[k] ?? k;
}

export function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

export function nextEntityId(state: GameState): string {
  state.nextId += 1;
  return `e${state.nextId}`;
}
