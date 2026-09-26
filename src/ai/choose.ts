import { FACTIONS } from "../data/factions";
import { TECH_LIST, canResearch, techDef } from "../data/techs";
import { UNITS, hasSkill, unitDef } from "../data/units";
import { dispatch, legalTileActions } from "../engine/actions";
import { previewUnits } from "../engine/combat";
import { canAct, legalAttacks, legalMoves } from "../engine/movement";
import { cityAt, cityCount, cloneState, current, playerHas, researchCost, tileAt, unitAt } from "../engine/queries";
import type { Command, GameState, TechId, Unit, UnitType } from "../engine/types";

export function aggression(state: GameState): number {
  const d = current(state).difficulty;
  if (d === "easy") return 0.7;
  if (d === "hard") return 1.15;
  if (d === "crazy") return 1.35;
  return 1;
}

export function chooseCommands(state: GameState): Command[] {
  const cmds: Command[] = [];
  const pid = state.currentPlayer;
  let s = cloneState(state);
  const agg = aggression(s);

  // research
  const tech = bestTech(s);
  if (tech) {
    const cost = researchCost(s, pid, techDef(tech).tier);
    if (current(s).energy >= cost) {
      cmds.push({ type: "research", tech });
      s = dispatch(s, { type: "research", tech });
    }
  }

  // capture / examine
  for (const u of s.units.filter((u) => u.owner === pid)) {
    const city = cityAt(s, u.x, u.y);
    if (city && city.owner !== pid && u.startX === u.x && u.startY === u.y && !u.moved) {
      cmds.push({ type: "capture", unitId: u.id });
      s = dispatch(s, { type: "capture", unitId: u.id });
    }
    const t = tileAt(s, u.x, u.y);
    if (t?.ruin && u.startX === u.x && u.startY === u.y && !u.moved) {
      cmds.push({ type: "examine", unitId: u.id });
      s = dispatch(s, { type: "examine", unitId: u.id });
    }
  }

  // harvest / cheap builds
  for (const t of s.tiles) {
    if (t.owner !== pid) continue;
    const acts = legalTileActions(s, t.x, t.y);
    const harvest = acts.find((a) => a.type === "harvest");
    if (harvest && current(s).energy >= 2) {
      cmds.push(harvest);
      s = dispatch(s, harvest);
      continue;
    }
    const farm = acts.find((a) => a.type === "build" && (a.kind === "hydroponics" || a.kind === "extractor" || a.kind === "spireTap" || a.kind === "dock"));
    if (farm && current(s).energy >= 5) {
      cmds.push(farm);
      s = dispatch(s, farm);
    }
  }

  // units: attack then move
  for (const u of [...s.units.filter((x) => x.owner === pid)]) {
    if (!canAct(u) && u.moved && u.attacked) continue;
    const live = s.units.find((x) => x.id === u.id);
    if (!live) continue;
    const atk = pickAttack(s, live, agg);
    if (atk) {
      cmds.push(atk);
      s = dispatch(s, atk);
    }
    const moved = s.units.find((x) => x.id === u.id);
    if (!moved) continue;
    const mv = pickMove(s, moved);
    if (mv) {
      cmds.push(mv);
      s = dispatch(s, mv);
      const after = s.units.find((x) => x.id === u.id);
      if (after) {
        const atk2 = pickAttack(s, after, agg);
        if (atk2) {
          cmds.push(atk2);
          s = dispatch(s, atk2);
        }
      }
    }
  }

  // train
  for (const c of s.cities.filter((c) => c.owner === pid)) {
    if (unitAt(s, c.x, c.y)) continue;
    const type = bestTrain(s, c.id);
    if (type && current(s).energy >= unitDef(type).cost) {
      const cmd: Command = { type: "train", cityId: c.id, unit: type };
      cmds.push(cmd);
      s = dispatch(s, cmd);
    }
  }

  // pending level-ups (human-style auto if any slipped)
  while (s.pendingLevelUp) {
    const opt = s.pendingLevelUp.options.includes("workshop")
      ? "workshop"
      : s.pendingLevelUp.options.includes("wall")
        ? "wall"
        : s.pendingLevelUp.options.includes("pop")
          ? "pop"
          : s.pendingLevelUp.options.includes("park") && cityCount(s, pid) < 4
            ? "park"
            : s.pendingLevelUp.options[s.pendingLevelUp.options.length - 1];
    const cmd: Command = { type: "levelUp", reward: opt };
    cmds.push(cmd);
    s = dispatch(s, cmd);
  }

  cmds.push({ type: "endTurn" });
  return cmds;
}

function bestTech(state: GameState): TechId | null {
  const p = current(state);
  const cities = cityCount(state, p.id);
  const scored: { id: TechId; s: number }[] = [];
  for (const id of TECH_LIST) {
    if (!canResearch(p.techs, id)) continue;
    const t = techDef(id);
    const cost = researchCost(state, p.id, t.tier);
    if (cost > p.energy) continue;
    let s = 20 - t.tier * 2 - cost * 0.3;
    if (id === "tracking" || id === "logistics" || id === "aquaculture") s += 12;
    if (id === "ridgecraft") s += 6;
    if (id === "gravMobility") s += 8;
    if (id === "cultivation" || id === "canopyWorks" || id === "extraction") s += 8;
    if (cities >= 3 && (id === "doctrine" || id === "ballistics")) s += 6;
    if (p.energy > 20 && t.tier === 3) s += 4;
    scored.push({ id, s });
  }
  scored.sort((a, b) => b.s - a.s);
  return scored[0]?.id ?? null;
}

function pickAttack(state: GameState, u: Unit, agg: number): Command | null {
  const targets = legalAttacks(state, u);
  let best: { id: string; s: number } | null = null;
  for (const t of targets) {
    const pv = previewUnits(state, u, t);
    let s = pv.attackResult * 3 - (pv.defenderDies ? 0 : pv.defenseResult * 2);
    if (pv.defenderDies) s += 12 * agg;
    if (pv.attackerDies) s -= 40;
    const city = cityAt(state, t.x, t.y);
    if (city) s += 15;
    if (s > (best?.s ?? -99)) best = { id: t.id, s };
  }
  if (best && best.s > 2) {
    if (hasSkill(u.type, "convert")) return { type: "convert", unitId: u.id, targetId: best.id };
    return { type: "attack", unitId: u.id, targetId: best.id };
  }
  return null;
}

function pickMove(state: GameState, u: Unit): Command | null {
  const moves = legalMoves(state, u);
  if (!moves.length) return null;
  let best: { x: number; y: number; s: number } | null = null;
  for (const m of moves) {
    let s = 0;
    const city = cityAt(state, m.x, m.y);
    if (city && city.owner !== u.owner) s += 40;
    const tile = tileAt(state, m.x, m.y);
    if (tile?.ruin) s += 18;
    for (const e of state.units) {
      if (e.owner === u.owner) continue;
      const p = state.players.find((pl) => pl.id === u.owner);
      if (p && !p.explored[e.y * state.size + e.x]) continue;
      const d = Math.max(Math.abs(e.x - m.x), Math.abs(e.y - m.y));
      if (d <= unitDef(u.type).range) s += 6;
      if (cityAt(state, e.x, e.y)?.owner === u.owner) s += 8 / Math.max(1, d);
    }
    for (const c of state.cities) {
      if (c.owner !== null) continue;
      const d = Math.max(Math.abs(c.x - m.x), Math.abs(c.y - m.y));
      s += 16 / (d + 1);
    }
    // explore
    const p = state.players.find((pl) => pl.id === u.owner)!;
    let fog = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = m.x + dx;
        const ny = m.y + dy;
        if (nx < 0 || ny < 0 || nx >= state.size || ny >= state.size) continue;
        if (!p.explored[ny * state.size + nx]) fog++;
      }
    }
    s += fog * 4.5;
    if (tile?.terrain === "ridge") s += 1;
    if (!best || s > best.s) best = { x: m.x, y: m.y, s };
  }
  if (best && (best.x !== u.x || best.y !== u.y)) return { type: "move", unitId: u.id, x: best.x, y: best.y };
  return null;
}

function bestTrain(state: GameState, _cityId: string): UnitType | null {
  const p = current(state);
  const threatened = state.cities.some((c) => {
    if (c.owner !== p.id) return false;
    return state.units.some((u) => u.owner !== p.id && Math.max(Math.abs(u.x - c.x), Math.abs(u.y - c.y)) <= 2);
  });
  const options: UnitType[] = (Object.keys(UNITS) as UnitType[]).filter((t) => UNITS[t].trainable);
  let best: { t: UnitType; s: number } | null = null;
  for (const t of options) {
    const d = UNITS[t];
    if (d.tech && !playerHas(state, p.id, d.tech)) continue;
    if (p.energy < d.cost) continue;
    let s = d.attack * 2 + d.movement + (threatened ? d.defense * 2 : 0) - d.cost;
    if (t === "trooper") s += cityCount(state, p.id) <= 2 ? 6 : 3;
    if (t === "skimmer") s += 5;
    if (t === "marksman") s += 2;
    if (best === null || s > best.s) best = { t, s };
  }
  return best?.t ?? null;
}

export function runAiTurn(state: GameState): GameState {
  const cmds = chooseCommands(state);
  let s = state;
  for (const c of cmds) {
    s = dispatch(s, c);
    if (c.type === "endTurn") break;
    if (s.pendingLevelUp) {
      const opt = s.pendingLevelUp.options[0];
      s = dispatch(s, { type: "levelUp", reward: opt });
    }
  }
  return s;
}

export function factionName(state: GameState, pid: number): string {
  return FACTIONS[state.players[pid].faction].name;
}
