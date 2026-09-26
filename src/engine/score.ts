import { CITY_SCORE_BASE, CITY_SCORE_PER_LEVEL, EXPLORE_SCORE, MONUMENT_SCORE, PARK_SCORE, SUPER_UNIT_SCORE, TEMPLE_SCORE_BASE, TERRITORY_SCORE, TECH_SCORE_PER_TIER, UNIT_SCORE_PER_COST } from "../data/constants";
import { unitDef } from "../data/units";
import { techDef } from "../data/techs";
import type { GameState, PlayerId } from "./types";
import { player } from "./queries";

export interface ScoreBreakdown {
  army: number;
  science: number;
  cities: number;
  territory: number;
  explore: number;
  wonders: number;
  total: number;
}

export function scoreBreakdown(state: GameState, pid: PlayerId): ScoreBreakdown {
  const p = player(state, pid);
  let army = 0;
  let science = 0;
  let cities = 0;
  let territory = 0;
  let explore = 0;
  let wonders = 0;
  for (const u of state.units) {
    if (u.owner !== pid) continue;
    const d = unitDef(u.type);
    army += d.super ? SUPER_UNIT_SCORE : d.cost * UNIT_SCORE_PER_COST;
  }
  for (const t of state.tiles) {
    if (t.owner === pid) territory += TERRITORY_SCORE;
    if (p.explored[t.y * state.size + t.x]) explore += EXPLORE_SCORE;
  }
  for (const c of state.cities) {
    if (c.owner !== pid) continue;
    cities += CITY_SCORE_BASE + CITY_SCORE_PER_LEVEL * Math.max(0, c.level - 1);
    cities += c.parks * PARK_SCORE;
    if (c.monument) wonders += MONUMENT_SCORE;
  }
  for (const t of state.tiles) {
    if (t.owner !== pid) continue;
    if (t.building === "beacon" || t.building === "forestBeacon" || t.building === "ridgeBeacon" || t.building === "shelfBeacon") {
      const lvl = Math.max(1, t.templeLevel);
      wonders += Math.min(500, TEMPLE_SCORE_BASE + TEMPLE_SCORE_BASE * (lvl - 1));
    }
  }
  for (const tech of p.techs) science += techDef(tech).tier * TECH_SCORE_PER_TIER;
  return { army, science, cities, territory, explore, wonders, total: army + science + cities + territory + explore + wonders };
}

export function computeScore(state: GameState, pid: PlayerId): number {
  return scoreBreakdown(state, pid).total;
}

export function perfectionMultiplier(opponents: number, difficulty: "easy" | "normal" | "hard" | "crazy"): number {
  const base = 1 + 0.41 * Math.log(Math.max(1, opponents));
  const extra = difficulty === "normal" ? 0.2 : difficulty === "hard" ? 0.4 : difficulty === "crazy" ? 0.8 : 0;
  return base + extra;
}

export function finalScore(state: GameState, pid: PlayerId): number {
  const raw = computeScore(state, pid);
  if (state.mode !== "perfection") return raw;
  const p = player(state, pid);
  const opp = state.players.length - 1;
  return Math.round(raw * perfectionMultiplier(opp, p.difficulty));
}
