import { hasSkill, unitDef } from "../data/units";
import type { GameState, Tile, Unit } from "./types";
import { tileAt, isFriendlyTerritory } from "./queries";

export function gameRound(n: number): number {
  return Math.round(n);
}

export function defenseBonusFor(state: GameState, defender: Unit): number {
  const tile = tileAt(state, defender.x, defender.y);
  if (!tile) return 1;
  const owner = state.players.find((p) => p.id === defender.owner);
  const techs = owner?.techs ?? [];
  const city = state.cities.find((c) => c.x === defender.x && c.y === defender.y && c.owner === defender.owner);
  if (city && hasSkill(defender.type, "fortify")) {
    return city.wall ? 4 : 1.5;
  }
  if (tile.terrain === "forest" && techs.includes("ballistics")) return 1.5;
  if (tile.terrain === "ridge" && techs.includes("ridgecraft")) return 1.5;
  if ((tile.terrain === "shelf" || tile.terrain === "deep") && techs.includes("depthward")) return 1.5;
  return 1;
}

export interface CombatPreview {
  attackResult: number;
  defenseResult: number;
  attackerDies: boolean;
  defenderDies: boolean;
  splash: number;
}

export function previewCombat(
  attacker: { attack: number; hp: number; maxHp: number; type?: Unit["type"] },
  defender: { defense: number; hp: number; maxHp: number },
  defenseBonus = 1,
): CombatPreview {
  const attackForce = attacker.attack * (attacker.hp / attacker.maxHp);
  const defenseForce = defender.defense * (defender.hp / defender.maxHp) * defenseBonus;
  const total = attackForce + defenseForce;
  if (total <= 0) {
    return { attackResult: 0, defenseResult: 0, attackerDies: false, defenderDies: false, splash: 0 };
  }
  const attackResult = gameRound((attackForce / total) * attacker.attack * 4.5);
  const defenseResult = gameRound((defenseForce / total) * defender.defense * 4.5);
  const splash = attackResult / 2;
  const defenderDies = attackResult >= defender.hp;
  const attackerDies = !defenderDies && defenseResult >= attacker.hp;
  return { attackResult, defenseResult, attackerDies, defenderDies, splash };
}

export function previewUnits(state: GameState, attacker: Unit, defender: Unit): CombatPreview {
  const aDef = unitDef(attacker.type);
  const dDef = unitDef(defender.type);
  return previewCombat(
    { attack: aDef.attack, hp: attacker.hp, maxHp: attacker.maxHp, type: attacker.type },
    { defense: dDef.defense, hp: defender.hp, maxHp: defender.maxHp },
    defenseBonusFor(state, defender),
  );
}

export function canRetaliate(state: GameState, attacker: Unit, defender: Unit, killed: boolean): boolean {
  if (killed) return false;
  if (hasSkill(defender.type, "stiff")) return false;
  if (hasSkill(attacker.type, "surprise")) return false;
  const dDef = unitDef(defender.type);
  if (dDef.attack <= 0 && dDef.defense <= 0) return false;
  const dist = Math.max(Math.abs(attacker.x - defender.x), Math.abs(attacker.y - defender.y));
  if (dist > dDef.range) return false;
  const tile = tileAt(state, attacker.x, attacker.y);
  if (!tile) return false;
  const idx = attacker.y * state.size + attacker.x;
  const defPlayer = state.players.find((p) => p.id === defender.owner);
  if (defPlayer && !defPlayer.explored[idx]) return false;
  return true;
}

export function healAmount(state: GameState, unit: Unit): number {
  return isFriendlyTerritory(state, unit.x, unit.y, unit.owner) ? 4 : 2;
}

export type { Tile };
