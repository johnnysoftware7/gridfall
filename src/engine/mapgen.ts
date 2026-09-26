import { FACTIONS } from "../data/factions";
import type { City, FactionId, GameState, NewGameOpts, Player, Resource, Terrain, Tile, Unit } from "./types";
import { nextRng, rngInt, rngPick } from "./rng";
import { chebyshev, idx, neighbors } from "./queries";

const RUINS: Record<number, number> = { 11: 4, 14: 5, 16: 7, 18: 9 };

function noise2(seed: number, x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 0.001) * 43758.5453;
  return n - Math.floor(n);
}

export function generateMap(opts: NewGameOpts): GameState {
  const size = opts.size;
  let rng = opts.seed >>> 0 || 1;
  const tiles: Tile[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      tiles.push({
        x, y, terrain: "plain", resource: null, building: null, buildingLevel: 0,
        road: false, bridge: false, owner: null, cityId: null, ruin: false, templeLevel: 0,
      });
    }
  }

  const factions = pickFactions(opts, rng);
  rng = factions.rng;

  const players: Player[] = [];
  for (let i = 0; i < factions.list.length; i++) {
    const explored = new Array(size * size).fill(false);
    players.push({
      id: i,
      faction: factions.list[i],
      isHuman: i === 0,
      difficulty: opts.difficulty,
      energy: 0,
      techs: [FACTIONS[factions.list[i]].startTech],
      alive: true,
      kills: 0,
      energyPeak: 0,
      pacifistTurns: 0,
      monuments: [],
      peaceWith: [],
      explored,
      seenCapitals: [i],
    });
  }

  const capitals = placeCapitals(size, players.length, rng);
  rng = capitals.rng;

  const cities: City[] = [];
  const units: Unit[] = [];
  let nextId = 1;

  for (let i = 0; i < players.length; i++) {
    const { x, y } = capitals.spots[i];
    const fac = FACTIONS[players[i].faction];
    const name = fac.cityNames[0];
    const id = `c${nextId++}`;
    cities.push({
      id, name, x, y, owner: i, isCapital: true, originalOwner: i,
      level: 1, progress: 0, workshop: false, parks: 0, wall: false, border: 1, connected: true,
    });
    paintCityTiles(tiles, size, cities[cities.length - 1]);
    biasLand(tiles, size, x, y, fac.id, fac.spawn.water);
  }

  // land/water via value noise
  for (const t of tiles) {
    if (cities.some((c) => c.x === t.x && c.y === t.y)) continue;
    const n =
      noise2(opts.seed, t.x * 0.35, t.y * 0.35) * 0.55 +
      noise2(opts.seed + 9, t.x * 0.12, t.y * 0.12) * 0.45;
    const wet = 0.48;
    if (n < wet * 0.55) t.terrain = "deep";
    else if (n < wet) t.terrain = "shelf";
    else t.terrain = "plain";
  }

  // force land under and around capitals
  for (const c of cities) {
    const t = tiles[c.y * size + c.x];
    t.terrain = "plain";
    for (const nb of neighbors(c.x, c.y)) {
      if (nb.x < 0 || nb.y < 0 || nb.x >= size || nb.y >= size) continue;
      const nt = tiles[nb.y * size + nb.x];
      const fac = FACTIONS[players[c.owner!].faction];
      if (fac.spawn.water > 1.05 && noise2(opts.seed, nb.x, nb.y) > 0.55) {
        nt.terrain = "shelf";
      } else if (nt.terrain === "deep") {
        nt.terrain = "shelf";
      }
    }
  }

  // convert isolated water neighbors of land to shelf
  for (const t of tiles) {
    if (t.terrain !== "deep") continue;
    const nearLand = neighbors(t.x, t.y).some((nb) => {
      if (nb.x < 0 || nb.y < 0 || nb.x >= size || nb.y >= size) return false;
      const nt = tiles[nb.y * size + nb.x];
      return nt.terrain === "plain" || nt.terrain === "forest" || nt.terrain === "ridge";
    });
    if (nearLand) t.terrain = "shelf";
  }

  rng = placeVillages(tiles, size, cities, rng, nextId);
  nextId = cities.length + 10;

  // terrain types per nearest city biome
  for (const t of tiles) {
    if (t.terrain !== "plain") continue;
    if (cities.some((c) => c.x === t.x && c.y === t.y)) continue;
    const nearest = nearestCity(cities, t.x, t.y);
    const fac = nearest && nearest.owner !== null ? FACTIONS[players[nearest.owner].faction] : FACTIONS.helix;
    const inner = nearest ? chebyshev(t.x, t.y, nearest.x, nearest.y) <= 1 : false;
    const roll = nextRng(rng);
    rng = roll.state;
    const ridgeShare = 0.14 * fac.spawn.ridge;
    const forestShare = 0.38 * fac.spawn.forest;
    if (roll.value < ridgeShare) t.terrain = "ridge";
    else if (roll.value < ridgeShare + forestShare) t.terrain = "forest";
    else t.terrain = "plain";
    void inner;
  }

  // resources within 2 of cities
  for (const t of tiles) {
    const near = cities.filter((c) => chebyshev(c.x, c.y, t.x, t.y) <= 2 && chebyshev(c.x, c.y, t.x, t.y) > 0);
    if (!near.length) continue;
    const nearest = nearestCity(cities, t.x, t.y);
    const fac = nearest && nearest.owner !== null ? FACTIONS[players[nearest.owner].faction] : FACTIONS.helix;
    const inner = nearest ? chebyshev(t.x, t.y, nearest.x, nearest.y) === 1 : false;
    const r = nextRng(rng);
    rng = r.state;
    t.resource = pickResource(t.terrain, fac.id, inner, r.value, fac.spawn);
  }

  rng = placeRuins(tiles, size, cities, rng, RUINS[size] ?? 5);

  // starfish ~ 1 per 25 water
  const water = tiles.filter((t) => t.terrain === "shelf" || t.terrain === "deep");
  const starN = Math.max(0, Math.floor(water.length / 25));
  for (let i = 0; i < starN; i++) {
    const pick = rngPick(rng, water);
    rng = pick.state;
    if (pick.value.resource || pick.value.ruin) continue;
    if (cities.some((c) => chebyshev(c.x, c.y, pick.value.x, pick.value.y) < 2)) continue;
    pick.value.resource = "starfish";
  }

  // starting units
  for (const c of cities) {
    if (c.owner === null) continue;
    const fac = FACTIONS[players[c.owner].faction];
    const id = `u${nextId++}`;
    units.push({
      id,
      type: fac.startUnit,
      owner: c.owner,
      x: c.x,
      y: c.y,
      hp: fac.startUnit === "skimmer" ? 10 : 10,
      maxHp: 10,
      moved: false,
      attacked: false,
      acted: false,
      kills: 0,
      veteran: false,
      veteranReady: false,
      cityId: c.id,
      startX: c.x,
      startY: c.y,
    });
  }

  const state: GameState = {
    seed: opts.seed,
    rng,
    turn: 1,
    currentPlayer: 0,
    mode: opts.mode,
    size,
    tiles,
    cities,
    units,
    players,
    toasts: [],
    pendingLevelUp: null,
    winner: null,
    over: false,
    nextId,
  };

  revealAroundUnits(state);
  paintAllCityTiles(state);
  return state;
}

function pickFactions(opts: NewGameOpts, rng: number): { rng: number; list: FactionId[] } {
  const all: FactionId[] = ["helix", "meridian", "tide", "ashfall", "verdant"];
  const used = new Set<FactionId>([opts.humanFaction]);
  const list: FactionId[] = [opts.humanFaction];
  if (opts.aiFactions) {
    for (const f of opts.aiFactions) {
      if (list.length >= 1 + opts.aiCount) break;
      list.push(f);
      used.add(f);
    }
  }
  const pool = all.filter((f) => !used.has(f));
  while (list.length < 1 + opts.aiCount && pool.length) {
    const p = rngInt(rng, pool.length);
    rng = p.state;
    list.push(pool[p.value]);
    pool.splice(p.value, 1);
  }
  return { rng, list };
}

function placeCapitals(size: number, n: number, rng: number): { rng: number; spots: { x: number; y: number }[] } {
  const spots: { x: number; y: number }[] = [];
  const quads = [
    { x0: 1, y0: 1, x1: Math.floor(size / 2) - 1, y1: Math.floor(size / 2) - 1 },
    { x0: Math.ceil(size / 2), y0: 1, x1: size - 2, y1: Math.floor(size / 2) - 1 },
    { x0: 1, y0: Math.ceil(size / 2), x1: Math.floor(size / 2) - 1, y1: size - 2 },
    { x0: Math.ceil(size / 2), y0: Math.ceil(size / 2), x1: size - 2, y1: size - 2 },
  ];
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const r = rngInt(rng, i + 1);
    rng = r.state;
    [order[i], order[r.value]] = [order[r.value], order[i]];
  }
  for (let i = 0; i < n; i++) {
    const q = quads[order[i % 4]];
    // jitter inside the quadrant
    const jx = rngInt(rng, Math.max(1, q.x1 - q.x0));
    rng = jx.state;
    const jy = rngInt(rng, Math.max(1, q.y1 - q.y0));
    rng = jy.state;
    spots.push({
      x: Math.min(q.x1, Math.max(q.x0, q.x0 + jx.value)),
      y: Math.min(q.y1, Math.max(q.y0, q.y0 + jy.value)),
    });
  }
  return { rng, spots };
}

function placeVillages(tiles: Tile[], size: number, cities: City[], rng: number, startId: number): number {
  let nextId = startId;
  const target = Math.max(cities.length * 2, Math.floor((size / 3) * (size / 3) * 0.45));
  let tries = 0;
  while (cities.length < target && tries < 800) {
    tries++;
    const rx = rngInt(rng, size);
    rng = rx.state;
    const ry = rngInt(rng, size);
    rng = ry.state;
    const x = rx.value;
    const y = ry.value;
    if (x < 2 || y < 2 || x > size - 3 || y > size - 3) continue;
    if (cities.some((c) => chebyshev(c.x, c.y, x, y) < 3)) continue;
    const t = tiles[y * size + x];
    if (t.terrain === "deep") t.terrain = "plain";
    if (t.terrain === "shelf") t.terrain = "plain";
    const id = `c${100 + nextId++}`;
    cities.push({
      id,
      name: "Outpost",
      x, y,
      owner: null,
      isCapital: false,
      originalOwner: null,
      level: 1,
      progress: 0,
      workshop: false,
      parks: 0,
      wall: false,
      border: 1,
      connected: false,
    });
    t.terrain = "plain";
  }
  return rng;
}

function placeRuins(tiles: Tile[], size: number, cities: City[], rng: number, count: number): number {
  let placed = 0;
  let tries = 0;
  while (placed < count && tries < 600) {
    tries++;
    const rx = rngInt(rng, size);
    rng = rx.state;
    const ry = rngInt(rng, size);
    rng = ry.state;
    const t = tiles[ry.value * size + rx.value];
    if (t.terrain === "shelf") continue;
    if (t.ruin) continue;
    if (cities.some((c) => chebyshev(c.x, c.y, t.x, t.y) < 2)) continue;
    if (tiles.some((o) => o.ruin && chebyshev(o.x, o.y, t.x, t.y) < 2)) continue;
    t.ruin = true;
    placed++;
  }
  return rng;
}

function pickResource(
  terrain: Terrain,
  _faction: FactionId,
  inner: boolean,
  roll: number,
  spawn: (typeof FACTIONS)["helix"]["spawn"],
): Resource | null {
  if (terrain === "plain") {
    const fruit = (inner ? 0.18 : 0.06) * spawn.fruit;
    const crop = (inner ? 0.18 : 0.06) * spawn.crop;
    if (roll < fruit) return "spore";
    if (roll < fruit + crop) return "grain";
    return null;
  }
  if (terrain === "forest") {
    const fauna = (inner ? 0.19 : 0.06) * spawn.fauna;
    if (roll < fauna) return "fauna";
    return null;
  }
  if (terrain === "ridge") {
    const metal = (inner ? 0.11 : 0.03) * (spawn.metal ?? 1);
    if (roll < metal) return "ore";
    return null;
  }
  if (terrain === "shelf") {
    if (roll < 0.5 * spawn.fish) return "plankton";
  }
  return null;
}

function nearestCity(cities: City[], x: number, y: number): City | null {
  let best: City | null = null;
  let d = 99;
  for (const c of cities) {
    const cd = chebyshev(c.x, c.y, x, y);
    if (cd < d) {
      d = cd;
      best = c;
    }
  }
  return best;
}

function paintCityTiles(tiles: Tile[], size: number, city: City): void {
  for (let y = city.y - city.border; y <= city.y + city.border; y++) {
    for (let x = city.x - city.border; x <= city.x + city.border; x++) {
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const t = tiles[y * size + x];
      if (t.owner !== null && t.cityId && t.cityId !== city.id) continue;
      t.owner = city.owner;
      t.cityId = city.id;
    }
  }
}

function paintAllCityTiles(state: GameState): void {
  for (const t of state.tiles) {
    if (!state.cities.some((c) => c.id === t.cityId)) {
      t.owner = null;
      t.cityId = null;
    }
  }
  const sorted = [...state.cities].sort((a, b) => a.level - b.level);
  for (const c of sorted) {
    if (c.owner === null) continue;
    paintCityTiles(state.tiles, state.size, c);
  }
}

function biasLand(tiles: Tile[], size: number, x: number, y: number, _fid: FactionId, _water: number): void {
  const t = tiles[y * size + x];
  t.terrain = "plain";
}

export function revealAroundUnits(state: GameState): void {
  for (const u of state.units) {
    revealAround(state, u.owner, u.x, u.y, u.type === "hoverScout" || u.type === "phantom" || u.type === "ghostSkiff" ? 2 : (state.tiles[idx(state, u.x, u.y)]?.terrain === "ridge" ? 2 : 1));
  }
  for (const c of state.cities) {
    if (c.owner === null) continue;
    revealAround(state, c.owner, c.x, c.y, 1);
  }
}

export function revealAround(state: GameState, pid: number, x: number, y: number, range: number): void {
  const p = state.players.find((pl) => pl.id === pid);
  if (!p) return;
  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= state.size || ny >= state.size) continue;
      p.explored[ny * state.size + nx] = true;
    }
  }
}

export function applyTerritory(state: GameState): void {
  paintAllCityTiles(state);
}

export { paintCityTiles, nearestCity };
