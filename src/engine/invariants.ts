import { unitDef } from "../data/units";
import type { GameState } from "./types";
import { inBounds, tileAt, unitCapacity, unitsOfCity } from "./queries";

export interface InvariantBreak {
  code: string;
  detail: string;
}

export function checkInvariants(state: GameState): InvariantBreak[] {
  const breaks: InvariantBreak[] = [];
  for (const p of state.players) {
    if (p.energy < 0) breaks.push({ code: "neg-energy", detail: `player ${p.id} energy ${p.energy}` });
  }
  const occ = new Map<string, string>();
  for (const u of state.units) {
    if (!inBounds(state, u.x, u.y)) breaks.push({ code: "oob", detail: `${u.id} at ${u.x},${u.y}` });
    if (u.hp > u.maxHp + 1e-9) breaks.push({ code: "hp-max", detail: `${u.id} ${u.hp}/${u.maxHp}` });
    if (u.hp <= 0) breaks.push({ code: "hp-dead", detail: `${u.id} still listed at ${u.hp}` });
    const key = `${u.x},${u.y}`;
    if (occ.has(key)) breaks.push({ code: "stack", detail: `${u.id} stacked with ${occ.get(key)}` });
    occ.set(key, u.id);
    const t = tileAt(state, u.x, u.y);
    if (t) {
      const naval = unitDef(u.type).naval;
      if (!naval && t.terrain === "deep") breaks.push({ code: "land-on-deep", detail: u.id });
      if (!naval && t.terrain === "shelf" && !t.bridge && t.building !== "dock") {
        breaks.push({ code: "land-on-water", detail: u.id });
      }
    }
  }
  for (const c of state.cities) {
    if (c.owner === null) continue;
    const used = unitsOfCity(state, c.id).filter((u) => u.type !== "blade").length;
    if (used > unitCapacity(c) + 2) {
      breaks.push({ code: "over-cap", detail: `${c.name} ${used}/${unitCapacity(c)}` });
    }
    if (c.level < 1) breaks.push({ code: "city-level", detail: c.id });
  }
  return breaks;
}
