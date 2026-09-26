import { EXPLORER_STEPS, HEAL_OTHERS, KILLER_THRESHOLD, PACIFIST_TURNS, PORT_LINK_RANGE, RUIN_STARS, STARFISH_STARS, TEMPLE_GROW_TURNS, TEMPLE_MAX_LEVEL, VETERAN_HP, VETERAN_KILLS, WEALTH_THRESHOLD } from "../data/constants";
import { FACTIONS } from "../data/factions";
import { canResearch, techDef } from "../data/techs";
import { hasSkill, unitDef } from "../data/units";
import { canRetaliate, healAmount, previewUnits } from "./combat";
import { revealAround } from "./mapgen";
import { canMoveTo, legalAttacks } from "./movement";
import {
  chebyshev,
  cityAt,
  cityIncome,
  current,
  inBounds,
  isWater,
  neighbors,
  nextEntityId,
  player,
  playerHas,
  playerIncome,
  popNeeded,
  researchCost,
  tileAt,
  unitAt,
  unitsOfCity,
} from "./queries";
import { rngPick } from "./rng";
import { computeScore } from "./score";
import type {
  BuildingKind,
  City,
  Command,
  GameState,
  LevelUpReward,
  NavalClass,
  PlayerId,
  TechId,
  Unit,
  UnitType,
} from "./types";

export function dispatch(state: GameState, cmd: Command): GameState {
  if (state.over && cmd.type !== "endTurn") return state;
  if (state.pendingLevelUp && cmd.type !== "levelUp") return state;
  switch (cmd.type) {
    case "move":
      return doMove(state, cmd.unitId, cmd.x, cmd.y);
    case "attack":
      return doAttack(state, cmd.unitId, cmd.targetId);
    case "heal":
      return doHeal(state, cmd.unitId);
    case "healOthers":
      return doHealOthers(state, cmd.unitId);
    case "convert":
      return doConvert(state, cmd.unitId, cmd.targetId);
    case "capture":
      return doCapture(state, cmd.unitId);
    case "examine":
      return doExamine(state, cmd.unitId);
    case "harvest":
      return doHarvest(state, cmd.x, cmd.y);
    case "build":
      return doBuild(state, cmd.x, cmd.y, cmd.kind);
    case "clearForest":
      return doClear(state, cmd.x, cmd.y);
    case "growForest":
      return doGrow(state, cmd.x, cmd.y);
    case "burnForest":
      return doBurn(state, cmd.x, cmd.y);
    case "destroy":
      return doDestroy(state, cmd.x, cmd.y);
    case "train":
      return doTrain(state, cmd.cityId, cmd.unit);
    case "research":
      return doResearch(state, cmd.tech);
    case "promote":
      return doPromote(state, cmd.unitId);
    case "disband":
      return doDisband(state, cmd.unitId);
    case "upgradeNaval":
      return doUpgradeNaval(state, cmd.unitId, cmd.into);
    case "levelUp":
      return doLevelUp(state, cmd.reward);
    case "infiltrate":
      return doInfiltrate(state, cmd.unitId, cmd.cityId);
    case "offerPeace":
      return doOfferPeace(state, cmd.target);
    case "breakPeace":
      return doBreakPeace(state, cmd.target);
    case "harvestStarfish":
      return doStarfish(state, cmd.x, cmd.y);
    case "endTurn":
      return doEndTurn(state);
  }
}

function ownUnit(state: GameState, id: string): Unit | null {
  const u = state.units.find((x) => x.id === id);
  if (!u || u.owner !== state.currentPlayer) return null;
  return u;
}

function spend(state: GameState, n: number): boolean {
  const p = current(state);
  if (p.energy < n) return false;
  p.energy -= n;
  return true;
}

function addPop(state: GameState, city: City, n: number): void {
  city.progress += n;
  while (city.progress >= popNeeded(city.level) && !state.pendingLevelUp) {
    city.progress -= popNeeded(city.level);
    city.level += 1;
    const opts = rewardsFor(city.level);
    state.pendingLevelUp = { cityId: city.id, options: opts };
  }
}

function rewardsFor(level: number): LevelUpReward[] {
  if (level === 2) return ["workshop", "explorer"];
  if (level === 3) return ["wall", "stars"];
  if (level === 4) return ["pop", "border"];
  return ["park", "titan"];
}

function cityOfTile(state: GameState, x: number, y: number): City | undefined {
  const t = tileAt(state, x, y);
  if (!t?.cityId) return undefined;
  return state.cities.find((c) => c.id === t.cityId);
}

function toast(state: GameState, kind: "tech" | "level" | "info", title: string, body: string, color?: string): void {
  state.toasts.push({ id: nextEntityId(state), kind, title, body, color });
  if (state.toasts.length > 8) state.toasts.shift();
}

function markActed(u: Unit): void {
  u.acted = true;
  u.moved = true;
  u.attacked = true;
}

function revealUnit(state: GameState, u: Unit): void {
  const range = hasSkill(u.type, "scout") || tileAt(state, u.x, u.y)?.terrain === "ridge" ? 2 : 1;
  revealAround(state, u.owner, u.x, u.y, range);
}

function doMove(state: GameState, unitId: string, x: number, y: number): GameState {
  const u = ownUnit(state, unitId);
  if (!u) return state;
  if (!canMoveTo(state, u, x, y)) return state;
  const dest = tileAt(state, x, y);
  if (!dest) return state;
  const occ = unitAt(state, x, y);
  if (occ && occ.id !== u.id) return state;

  const dx = Math.sign(x - u.x);
  const dy = Math.sign(y - u.y);
  u.lastDir = { dx, dy };
  u.x = x;
  u.y = y;
  u.moved = true;
  if (hasSkill(u.type, "hide")) u.hidden = true;
  revealUnit(state, u);

  if (dest.building === "dock" && dest.owner === u.owner && !hasSkill(u.type, "water")) {
    embark(state, u);
    markActed(u);
  }
  if (hasSkill(u.type, "water") && !isWater(dest.terrain) && !dest.bridge && dest.building !== "dock") {
    disembark(state, u);
    markActed(u);
  }
  if (hasSkill(u.type, "stomp")) stomp(state, u);
  return state;
}

function embark(_state: GameState, u: Unit): void {
  if (u.type === "titan") {
    u.cargoType = "titan";
    u.cargoHp = u.hp;
    u.cargoMaxHp = u.maxHp;
    u.type = "leviathan";
    u.maxHp = 40;
    return;
  }
  if (u.type === "phantom") {
    u.cargoType = "phantom";
    u.cargoHp = u.hp;
    u.cargoMaxHp = u.maxHp;
    u.type = "ghostSkiff";
    return;
  }
  u.cargoType = u.type;
  u.cargoHp = u.hp;
  u.cargoMaxHp = u.maxHp;
  u.cargoVeteran = u.veteran;
  u.type = "skiff";
  const d = unitDef("skiff");
  u.maxHp = u.cargoMaxHp ?? d.hp;
}

function disembark(_state: GameState, u: Unit): void {
  const cargo = u.cargoType ?? "trooper";
  const hp = u.cargoHp ?? u.hp;
  const max = u.cargoMaxHp ?? unitDef(cargo).hp;
  u.type = cargo;
  u.hp = Math.min(hp, max);
  u.maxHp = max;
  u.veteran = !!u.cargoVeteran;
  u.cargoType = undefined;
  u.cargoHp = undefined;
  u.cargoMaxHp = undefined;
}

function stomp(state: GameState, u: Unit): void {
  const preview = { attack: unitDef(u.type).attack, hp: u.hp, maxHp: u.maxHp };
  for (const n of neighbors(u.x, u.y)) {
    const t = unitAt(state, n.x, n.y);
    if (!t || t.owner === u.owner) continue;
    const dmg = Math.max(1, Math.floor(preview.attack));
    t.hp -= dmg;
    if (t.hp <= 0) killUnit(state, t, u);
  }
}

function doAttack(state: GameState, unitId: string, targetId: string): GameState {
  const u = ownUnit(state, unitId);
  if (!u) return state;
  const targets = legalAttacks(state, u);
  const t = targets.find((x) => x.id === targetId);
  if (!t) return state;
  if (hasSkill(u.type, "convert")) return doConvert(state, unitId, targetId);

  const prev = previewUnits(state, u, t);
  t.hp -= prev.attackResult;
  const killed = t.hp <= 0;
  if (hasSkill(u.type, "splash")) {
    for (const n of neighbors(t.x, t.y)) {
      const o = unitAt(state, n.x, n.y);
      if (!o || o.owner === u.owner || o.id === t.id) continue;
      o.hp -= prev.splash;
      if (o.hp <= 0) killUnit(state, o, u);
    }
  }
  if (killed) {
    const tx = t.x;
    const ty = t.y;
    killUnit(state, t, u);
    const melee = unitDef(u.type).range <= 1;
    const dest = tileAt(state, tx, ty);
    if (melee && dest && (hasSkill(u.type, "water") || dest.terrain === "plain" || dest.terrain === "forest" || dest.terrain === "ridge" || dest.bridge || dest.building === "dock")) {
      if (!(dest.terrain === "ridge" && !playerHas(state, u.owner, "ridgecraft"))) {
        u.x = tx;
        u.y = ty;
        revealUnit(state, u);
        if (dest.building === "dock" && dest.owner === u.owner && !hasSkill(u.type, "water")) {
          embark(state, u);
        }
      }
    }
    u.kills += 1;
    if (!hasSkill(u.type, "static") && !u.veteran && u.kills >= VETERAN_KILLS) u.veteranReady = true;
    current(state).kills += 1;
    checkKiller(state, current(state).id);
    if (hasSkill(u.type, "persist")) {
      u.attacked = false;
    } else {
      u.attacked = true;
      if (hasSkill(u.type, "escape")) u.moved = false;
    }
  } else {
    if (canRetaliate(state, u, t, false)) {
      u.hp -= prev.defenseResult;
      if (u.hp <= 0) {
        killUnit(state, u, t);
        t.kills += 1;
        if (!hasSkill(t.type, "static") && !t.veteran && t.kills >= VETERAN_KILLS) t.veteranReady = true;
        return state;
      }
    }
    u.attacked = true;
    if (hasSkill(u.type, "escape")) u.moved = false;
  }
  current(state).pacifistTurns = 0;
  if (u.hp > 0 && hasSkill(u.type, "hide")) u.hidden = false;
  return state;
}

function killUnit(state: GameState, u: Unit, _by?: Unit): void {
  state.units = state.units.filter((x) => x.id !== u.id);
}

function doHeal(state: GameState, unitId: string): GameState {
  const u = ownUnit(state, unitId);
  if (!u || u.acted || u.moved || u.attacked) return state;
  if (u.hp >= u.maxHp) return state;
  u.hp = Math.min(u.maxHp, u.hp + healAmount(state, u));
  markActed(u);
  return state;
}

function doHealOthers(state: GameState, unitId: string): GameState {
  const u = ownUnit(state, unitId);
  if (!u || !hasSkill(u.type, "heal") || u.acted || u.moved || u.attacked) return state;
  let any = false;
  for (const n of neighbors(u.x, u.y)) {
    const o = unitAt(state, n.x, n.y);
    if (!o || o.owner !== u.owner || o.hp >= o.maxHp) continue;
    o.hp = Math.min(o.maxHp, o.hp + HEAL_OTHERS);
    any = true;
  }
  if (!any) return state;
  markActed(u);
  return state;
}

function doConvert(state: GameState, unitId: string, targetId: string): GameState {
  const u = ownUnit(state, unitId);
  if (!u || !hasSkill(u.type, "convert")) return state;
  if (u.acted || u.attacked || (u.moved && !hasSkill(u.type, "dash"))) return state;
  const t = state.units.find((x) => x.id === targetId);
  if (!t || t.owner === u.owner) return state;
  if (chebyshev(u.x, u.y, t.x, t.y) > 1) return state;
  const cap = state.cities.find((c) => c.owner === u.owner && c.isCapital && c.originalOwner === u.owner)
    ?? state.cities.find((c) => c.owner === u.owner);
  t.owner = u.owner;
  t.cityId = cap?.id ?? null;
  t.hidden = false;
  markActed(u);
  current(state).pacifistTurns = 0;
  return state;
}

function doCapture(state: GameState, unitId: string): GameState {
  const u = ownUnit(state, unitId);
  if (!u || u.acted || u.moved || u.attacked) return state;
  const city = cityAt(state, u.x, u.y);
  if (!city) return state;
  if (city.owner === u.owner) return state;
  if (u.startX !== city.x || u.startY !== city.y) return state;
  const prev = city.owner;
  const wasVillage = city.owner === null;
  city.owner = u.owner;
  u.cityId = city.id;
  if (wasVillage) {
    const fac = FACTIONS[player(state, u.owner).faction];
    const names = fac.cityNames;
    city.name = names[(state.cities.filter((c) => c.owner === u.owner).length) % names.length];
    city.level = 1;
    city.progress = 0;
    city.border = 1;
  }
  paintBorders(state, city);
  updateConnections(state, u.owner);
  markActed(u);
  if (prev !== null) checkElim(state, prev);
  toast(state, "info", city.name, wasVillage ? "Outpost claimed." : "Colony captured.");
  return state;
}

function doExamine(state: GameState, unitId: string): GameState {
  const u = ownUnit(state, unitId);
  if (!u || u.acted || u.moved || u.attacked) return state;
  const t = tileAt(state, u.x, u.y);
  if (!t?.ruin) return state;
  if (u.startX !== t.x || u.startY !== t.y) return state;
  t.ruin = false;
  const p = current(state);
  const options: Array<() => void> = [
    () => { p.energy += RUIN_STARS; p.energyPeak = Math.max(p.energyPeak, p.energy); toast(state, "info", "Probe cache", `+${RUIN_STARS} Energy`); },
  ];
  const researchable = (["tracking","gravMobility","logistics","ridgecraft","aquaculture","ballistics","canopyWorks","maglev","openCircuit","cultivation","doctrine","extraction","signalSilence","driftControl","hullBreach","mycoweave","orbitalMath","exchange","chargeProtocol","fabrication","envoys","alloyworks","cognition","starfix","depthward"] as TechId[])
    .filter((id) => canResearch(p.techs, id));
  if (researchable.length) {
    options.push(() => {
      const pick = rngPick(state.rng, researchable);
      state.rng = pick.state;
      p.techs.push(pick.value);
      toastTech(state, p.id, pick.value);
    });
  }
  const cap = state.cities.find((c) => c.owner === p.id && c.isCapital);
  if (cap) options.push(() => { addPop(state, cap, 3); toast(state, "info", "Colonists", "+3 population at the Command Spire"); });
  const fogNear = neighbors(t.x, t.y).some((n) => inBounds(state, n.x, n.y) && !p.explored[n.y * state.size + n.x]);
  if (fogNear && t.terrain !== "ridge") {
    options.push(() => runExplorer(state, p.id, t.x, t.y));
  }
  if (!isWater(t.terrain)) {
    options.push(() => spawnRewardUnit(state, "vanguard", u, true));
  } else {
    options.push(() => spawnNavalReward(state, u));
  }
  const pick = rngPick(state.rng, options);
  state.rng = pick.state;
  pick.value();
  markActed(u);
  return state;
}

function spawnRewardUnit(state: GameState, type: UnitType, nextTo: Unit, veteran: boolean): void {
  const spot = findPushTile(state, nextTo.x, nextTo.y);
  if (!spot) return;
  const d = unitDef(type);
  const u: Unit = {
    id: nextEntityId(state), type, owner: nextTo.owner, x: spot.x, y: spot.y,
    hp: veteran ? d.hp + VETERAN_HP : d.hp, maxHp: veteran ? d.hp + VETERAN_HP : d.hp,
    moved: true, attacked: true, acted: true, kills: 0, veteran, veteranReady: false,
    cityId: state.cities.find((c) => c.owner === nextTo.owner && c.isCapital)?.id ?? null,
    startX: spot.x, startY: spot.y,
  };
  state.units.push(u);
  revealUnit(state, u);
  toast(state, "info", d.name, veteran ? "Veteran reinforcement." : "Reinforcement.");
}

function spawnNavalReward(state: GameState, nextTo: Unit): void {
  const spot = findPushTile(state, nextTo.x, nextTo.y);
  if (!spot) return;
  const u: Unit = {
    id: nextEntityId(state), type: "hullRam", owner: nextTo.owner, x: spot.x, y: spot.y,
    hp: 15, maxHp: 15, moved: true, attacked: true, acted: true, kills: 0, veteran: true, veteranReady: false,
    cityId: state.cities.find((c) => c.owner === nextTo.owner && c.isCapital)?.id ?? null,
    startX: spot.x, startY: spot.y, cargoType: "trooper", cargoHp: 10, cargoMaxHp: 10,
  };
  state.units.push(u);
  toast(state, "info", "Hull Ram", "Veteran hull ram recovered from the probe.");
}

function findPushTile(state: GameState, x: number, y: number): { x: number; y: number } | null {
  if (!unitAt(state, x, y)) {
    const here = tileAt(state, x, y);
    if (here && !isWater(here.terrain)) return { x, y };
  }
  const ring = neighbors(x, y);
  for (const n of ring) {
    if (!inBounds(state, n.x, n.y)) continue;
    const t = tileAt(state, n.x, n.y)!;
    if (unitAt(state, n.x, n.y)) continue;
    if (isWater(t.terrain) && !t.bridge && t.building !== "dock") continue;
    return n;
  }
  return null;
}

function doHarvest(state: GameState, x: number, y: number): GameState {
  const p = current(state);
  const t = tileAt(state, x, y);
  if (!t || t.owner !== p.id) return state;
  const city = cityOfTile(state, x, y);
  if (!city || city.owner !== p.id) return state;
  if (t.resource === "spore" && playerHas(state, p.id, "logistics")) {
    if (!spend(state, 2)) return state;
    t.resource = null;
    addPop(state, city, 1);
    return state;
  }
  if (t.resource === "fauna" && playerHas(state, p.id, "tracking")) {
    if (!spend(state, 2)) return state;
    t.resource = null;
    addPop(state, city, 1);
    return state;
  }
  if (t.resource === "plankton" && playerHas(state, p.id, "aquaculture")) {
    if (!spend(state, 2)) return state;
    t.resource = null;
    addPop(state, city, 1);
    return state;
  }
  return state;
}

function doStarfish(state: GameState, x: number, y: number): GameState {
  const p = current(state);
  if (!playerHas(state, p.id, "starfix")) return state;
  const t = tileAt(state, x, y);
  if (!t || t.resource !== "starfish") return state;
  const u = unitAt(state, x, y);
  if (!u || u.owner !== p.id) return state;
  t.resource = null;
  p.energy += STARFISH_STARS;
  p.energyPeak = Math.max(p.energyPeak, p.energy);
  return state;
}

function doBuild(state: GameState, x: number, y: number, kind: BuildingKind | "road" | "bridge"): GameState {
  const p = current(state);
  const t = tileAt(state, x, y);
  if (!t) return state;
  if (kind === "road") {
    if (!playerHas(state, p.id, "maglev")) return state;
    if (t.terrain === "ridge" || isWater(t.terrain) || t.road) return state;
    if (t.owner !== p.id && t.owner !== null) return state;
    if (!spend(state, 3)) return state;
    t.road = true;
    updateConnections(state, p.id);
    return state;
  }
  if (kind === "bridge") {
    if (!playerHas(state, p.id, "maglev")) return state;
    if (!isWater(t.terrain) || t.bridge) return state;
    const hor = inBounds(state, x - 1, y) && inBounds(state, x + 1, y) &&
      !isWater(tileAt(state, x - 1, y)!.terrain) && !isWater(tileAt(state, x + 1, y)!.terrain);
    const ver = inBounds(state, x, y - 1) && inBounds(state, x, y + 1) &&
      !isWater(tileAt(state, x, y - 1)!.terrain) && !isWater(tileAt(state, x, y + 1)!.terrain);
    if (!hor && !ver) return state;
    if (!spend(state, 5)) return state;
    t.bridge = true;
    t.road = true;
    updateConnections(state, p.id);
    return state;
  }
  if (t.owner !== p.id) return state;
  const city = cityOfTile(state, x, y);
  if (!city) return state;
  if (t.building) return state;
  if (t.ruin) return state;

  const plan = buildPlan(kind);
  if (!plan) return state;
  if (plan.tech && !playerHas(state, p.id, plan.tech)) return state;
  if (!plan.ok(state, t, city)) return state;
  if (!spend(state, plan.cost)) return state;
  t.building = kind;
  t.buildingLevel = 1;
  if (plan.pop) addPop(state, city, plan.pop);
  if (kind === "sporeMill" || kind === "condenser" || kind === "smelter") {
    refreshBoosters(state, city);
  }
  if (kind === "dock") updateConnections(state, p.id);
  if (kind.endsWith("Beacon") || kind === "beacon" || kind === "forestBeacon" || kind === "ridgeBeacon" || kind === "shelfBeacon") {
    t.templeLevel = 1;
  }
  return state;
}

function buildPlan(kind: BuildingKind): { cost: number; tech?: string; pop: number; ok: (s: GameState, t: NonNullable<ReturnType<typeof tileAt>>, c: City) => boolean } | null {
  switch (kind) {
    case "hydroponics":
      return { cost: 5, tech: "cultivation", pop: 2, ok: (_s, t) => t.terrain === "plain" && t.resource === "grain" };
    case "extractor":
      return { cost: 5, tech: "extraction", pop: 2, ok: (_s, t) => t.terrain === "ridge" && t.resource === "ore" };
    case "spireTap":
      return { cost: 3, tech: "canopyWorks", pop: 1, ok: (_s, t) => t.terrain === "forest" };
    case "sporeMill":
      return { cost: 5, tech: "orbitalMath", pop: 0, ok: (s, t, c) => t.terrain === "plain" && !cityHasBuilding(s, c.id, "sporeMill") };
    case "condenser":
      return { cost: 5, tech: "fabrication", pop: 0, ok: (s, t, c) => t.terrain === "plain" && !cityHasBuilding(s, c.id, "condenser") };
    case "smelter":
      return { cost: 5, tech: "alloyworks", pop: 0, ok: (s, t, c) => (t.terrain === "plain" || t.terrain === "forest") && !cityHasBuilding(s, c.id, "smelter") };
    case "dock":
      return { cost: 7, tech: "aquaculture", pop: 1, ok: (_s, t) => t.terrain === "shelf" };
    case "exchangeHub":
      return { cost: 5, tech: "exchange", pop: 0, ok: (s, t) => neighbors(t.x, t.y).some((n) => {
        const nt = tileAt(s, n.x, n.y);
        return nt && (nt.building === "sporeMill" || nt.building === "condenser" || nt.building === "smelter");
      }) };
    case "beacon":
      return { cost: 20, tech: "openCircuit", pop: 0, ok: (_s, t) => t.terrain === "plain" && !t.resource };
    case "forestBeacon":
      return { cost: 15, tech: "mycoweave", pop: 0, ok: (_s, t) => t.terrain === "forest" };
    case "ridgeBeacon":
      return { cost: 20, tech: "signalSilence", pop: 0, ok: (_s, t) => t.terrain === "ridge" };
    case "shelfBeacon":
      return { cost: 20, tech: "depthward", pop: 0, ok: (_s, t) => isWater(t.terrain) };
    default:
      return null;
  }
}

function cityHasBuilding(state: GameState, cityId: string, k: BuildingKind): boolean {
  return state.tiles.some((t) => t.cityId === cityId && t.building === k);
}

function refreshBoosters(state: GameState, city: City): void {
  let extra = 0;
  for (const t of state.tiles) {
    if (t.cityId !== city.id) continue;
    if (t.building === "sporeMill") {
      const n = neighbors(t.x, t.y).filter((n) => tileAt(state, n.x, n.y)?.building === "spireTap").length;
      extra += n;
      t.buildingLevel = n;
    }
    if (t.building === "condenser") {
      const n = neighbors(t.x, t.y).filter((n) => tileAt(state, n.x, n.y)?.building === "hydroponics").length;
      extra += n;
      t.buildingLevel = n;
    }
    if (t.building === "smelter") {
      const n = neighbors(t.x, t.y).filter((n) => tileAt(state, n.x, n.y)?.building === "extractor").length;
      extra += n * 2;
      t.buildingLevel = n;
    }
  }
  if (extra > 0) addPop(state, city, extra);
}

function doClear(state: GameState, x: number, y: number): GameState {
  const p = current(state);
  if (!playerHas(state, p.id, "canopyWorks")) return state;
  const t = tileAt(state, x, y);
  if (!t || t.owner !== p.id || t.terrain !== "forest" || t.ruin) return state;
  t.terrain = "plain";
  if (t.building === "spireTap") t.building = null;
  p.energy += 1;
  return state;
}

function doGrow(state: GameState, x: number, y: number): GameState {
  const p = current(state);
  if (!playerHas(state, p.id, "mycoweave")) return state;
  const t = tileAt(state, x, y);
  if (!t || t.owner !== p.id || t.terrain !== "plain" || t.resource || t.building) return state;
  if (!spend(state, 5)) return state;
  t.terrain = "forest";
  return state;
}

function doBurn(state: GameState, x: number, y: number): GameState {
  const p = current(state);
  if (!playerHas(state, p.id, "fabrication")) return state;
  const t = tileAt(state, x, y);
  if (!t || t.owner !== p.id || t.terrain !== "forest" || t.building || t.ruin) return state;
  if (!spend(state, 5)) return state;
  t.terrain = "plain";
  t.resource = "grain";
  return state;
}

function doDestroy(state: GameState, x: number, y: number): GameState {
  const p = current(state);
  if (!playerHas(state, p.id, "chargeProtocol")) return state;
  const t = tileAt(state, x, y);
  if (!t || t.owner !== p.id || !t.building) return state;
  t.building = null;
  t.buildingLevel = 0;
  return state;
}

function doTrain(state: GameState, cityId: string, type: UnitType): GameState {
  const city = state.cities.find((c) => c.id === cityId);
  if (!city || city.owner !== state.currentPlayer) return state;
  if (unitAt(state, city.x, city.y)) return state;
  const def = unitDef(type);
  if (!def.trainable) return state;
  if (def.tech && !playerHas(state, city.owner, def.tech)) return state;
  if (unitsOfCity(state, city.id).filter((u) => !hasSkill(u.type, "independent")).length >= city.level + 1) return state;
  if (!spend(state, def.cost)) return state;
  const u: Unit = {
    id: nextEntityId(state), type, owner: city.owner, x: city.x, y: city.y,
    hp: def.hp, maxHp: def.hp, moved: false, attacked: false, acted: false,
    kills: 0, veteran: false, veteranReady: false, cityId: city.id, startX: city.x, startY: city.y,
  };
  if (hasSkill(type, "hide")) u.hidden = false;
  state.units.push(u);
  revealUnit(state, u);
  return state;
}

function doResearch(state: GameState, tech: TechId): GameState {
  const p = current(state);
  if (!canResearch(p.techs, tech)) return state;
  const cost = researchCost(state, p.id, techDef(tech).tier);
  if (!spend(state, cost)) return state;
  p.techs.push(tech);
  toastTech(state, p.id, tech);
  if (p.techs.length >= 25) grantMonument(state, p.id, "archiveSpire");
  return state;
}

function toastTech(state: GameState, pid: PlayerId, tech: TechId): void {
  const fac = FACTIONS[player(state, pid).faction];
  toast(state, "tech", techDef(tech).name, `${fac.name} discovered the secret of ${techDef(tech).name}`, fac.color);
  state.lastTech = { player: pid, tech };
}

function doPromote(state: GameState, unitId: string): GameState {
  const u = ownUnit(state, unitId);
  if (!u || !u.veteranReady || u.veteran) return state;
  u.veteran = true;
  u.veteranReady = false;
  u.maxHp += VETERAN_HP;
  u.hp = u.maxHp;
  return state;
}

function doDisband(state: GameState, unitId: string): GameState {
  const u = ownUnit(state, unitId);
  if (!u || !playerHas(state, u.owner, "openCircuit")) return state;
  if (u.acted || u.moved || u.attacked) return state;
  const refund = Math.floor(unitDef(u.type).cost / 2);
  current(state).energy += refund;
  state.units = state.units.filter((x) => x.id !== u.id);
  return state;
}

function doUpgradeNaval(state: GameState, unitId: string, into: NavalClass): GameState {
  const u = ownUnit(state, unitId);
  if (!u || u.type !== "skiff") return state;
  const t = tileAt(state, u.x, u.y);
  if (!t || t.owner !== u.owner) return state;
  const map: Record<NavalClass, { tech: TechId; cost: number } | null> = {
    hoverScout: { tech: "driftControl", cost: 5 },
    hullRam: { tech: "hullBreach", cost: 5 },
    depthBomber: { tech: "starfix", cost: 15 },
    skiff: null,
    leviathan: null,
    ghostSkiff: null,
  };
  const plan = map[into];
  if (!plan || !playerHas(state, u.owner, plan.tech)) return state;
  if (!spend(state, plan.cost)) return state;
  u.type = into;
  return state;
}

function doLevelUp(state: GameState, reward: LevelUpReward): GameState {
  const pending = state.pendingLevelUp;
  if (!pending || !pending.options.includes(reward)) return state;
  const city = state.cities.find((c) => c.id === pending.cityId);
  state.pendingLevelUp = null;
  if (!city) return state;
  const fac = city.owner !== null ? FACTIONS[player(state, city.owner).faction] : null;
  if (reward === "workshop") city.workshop = true;
  if (reward === "explorer") runExplorer(state, city.owner ?? 0, city.x, city.y);
  if (reward === "wall") city.wall = true;
  if (reward === "stars" && city.owner !== null) {
    player(state, city.owner).energy += 5;
  }
  if (reward === "pop") addPop(state, city, 3);
  if (reward === "border") {
    city.border = 2;
    paintBorders(state, city);
  }
  if (reward === "park") city.parks += 1;
  if (reward === "titan") spawnTitan(state, city);
  toast(state, "level", `${city.name} leveled up!`, `${fac?.short ?? "Commander"} picked ${rewardLabel(reward)}.`);
  if (state.pendingLevelUp) {
    // chained level-up from +3 pop — leave it
  }
  return state;
}

function rewardLabel(r: LevelUpReward): string {
  const m: Record<LevelUpReward, string> = {
    workshop: "Fabricator", explorer: "Probe Drone", wall: "City Shield", stars: "+5 Energy",
    pop: "Population growth", border: "Border growth", park: "Hab Dome", titan: "Titan",
  };
  return m[r];
}

function spawnTitan(state: GameState, city: City): void {
  if (city.owner === null) return;
  const occ = unitAt(state, city.x, city.y);
  if (occ) {
    const dest = findPushTile(state, city.x + (occ.lastDir?.dx ?? 0), city.y + (occ.lastDir?.dy ?? 1));
    if (dest && occ.owner !== city.owner) {
      occ.x = dest.x;
      occ.y = dest.y;
    } else if (dest) {
      occ.x = dest.x;
      occ.y = dest.y;
    }
  }
  const d = unitDef("titan");
  state.units.push({
    id: nextEntityId(state), type: "titan", owner: city.owner, x: city.x, y: city.y,
    hp: d.hp, maxHp: d.hp, moved: false, attacked: false, acted: false,
    kills: 0, veteran: false, veteranReady: false, cityId: city.id, startX: city.x, startY: city.y,
  });
}

function runExplorer(state: GameState, pid: PlayerId, x: number, y: number): void {
  let cx = x;
  let cy = y;
  const p = player(state, pid);
  for (let step = 0; step < EXPLORER_STEPS; step++) {
    revealAround(state, pid, cx, cy, 1);
    let best: { x: number; y: number; score: number } | null = null;
    for (const n of neighbors(cx, cy)) {
      if (!inBounds(state, n.x, n.y)) continue;
      const tile = tileAt(state, n.x, n.y)!;
      if (tile.terrain === "ridge" && !p.techs.includes("ridgecraft")) continue;
      if (tile.terrain === "shelf" && !p.techs.includes("aquaculture")) continue;
      if (tile.terrain === "deep" && !p.techs.includes("driftControl")) continue;
      let fog = 0;
      for (const nn of neighbors(n.x, n.y)) {
        if (inBounds(state, nn.x, nn.y) && !p.explored[nn.y * state.size + nn.x]) fog++;
      }
      if (!p.explored[n.y * state.size + n.x]) fog += 2;
      if (fog <= 0) continue;
      const score = -fog * 10 - chebyshev(n.x, n.y, x, y);
      if (!best || score < best.score) best = { x: n.x, y: n.y, score };
    }
    if (!best) break;
    cx = best.x;
    cy = best.y;
  }
  revealAround(state, pid, cx, cy, 1);
}

function doInfiltrate(state: GameState, unitId: string, cityId: string): GameState {
  const u = ownUnit(state, unitId);
  if (!u || !hasSkill(u.type, "infiltrate")) return state;
  const city = state.cities.find((c) => c.id === cityId);
  if (!city || city.owner === null || city.owner === u.owner) return state;
  if (chebyshev(u.x, u.y, city.x, city.y) > 1) return state;
  if (u.moved && !hasSkill(u.type, "dash")) return state;
  const occ = unitAt(state, city.x, city.y);
  if (occ && occ.owner === city.owner) occ.hp -= 2;
  if (occ && occ.hp <= 0) killUnit(state, occ, u);
  const n = Math.min(5, city.level);
  for (let i = 0; i < n; i++) {
    const spot = findPushTile(state, city.x, city.y) ?? { x: city.x, y: city.y };
    if (unitAt(state, spot.x, spot.y) && !(spot.x === city.x && spot.y === city.y && !unitAt(state, city.x, city.y))) {
      const around = neighbors(city.x, city.y).find((nb) => inBounds(state, nb.x, nb.y) && !unitAt(state, nb.x, nb.y));
      if (!around) break;
      spawnBlade(state, u.owner, around.x, around.y);
    } else {
      spawnBlade(state, u.owner, spot.x, spot.y);
    }
  }
  const p = current(state);
  p.energy += cityIncome(state, city);
  state.units = state.units.filter((x) => x.id !== u.id);
  current(state).pacifistTurns = 0;
  return state;
}

function spawnBlade(state: GameState, owner: PlayerId, x: number, y: number): void {
  if (unitAt(state, x, y)) return;
  const d = unitDef("blade");
  state.units.push({
    id: nextEntityId(state), type: "blade", owner, x, y, hp: d.hp, maxHp: d.hp,
    moved: true, attacked: true, acted: true, kills: 0, veteran: false, veteranReady: false,
    cityId: null, startX: x, startY: y,
  });
}

function doOfferPeace(state: GameState, target: PlayerId): GameState {
  const p = current(state);
  if (!playerHas(state, p.id, "doctrine")) return state;
  if (p.peaceWith.includes(target)) return state;
  const other = player(state, target);
  const myScore = computeScore(state, p.id);
  const theirScore = computeScore(state, target);
  const accept = !other.isHuman && theirScore < myScore * 0.85;
  if (accept) {
    p.peaceWith.push(target);
    other.peaceWith.push(p.id);
    toast(state, "info", "Ceasefire", `${FACTIONS[other.faction].name} accepted.`);
  } else {
    toast(state, "info", "Ceasefire", "Offer refused.");
  }
  return state;
}

function doBreakPeace(state: GameState, target: PlayerId): GameState {
  const p = current(state);
  p.peaceWith = p.peaceWith.filter((id) => id !== target);
  const other = player(state, target);
  other.peaceWith = other.peaceWith.filter((id) => id !== p.id);
  for (const u of [...state.units]) {
    if (u.owner !== p.id) continue;
    const t = tileAt(state, u.x, u.y);
    if (t?.owner === target) {
      state.units = state.units.filter((x) => x.id !== u.id);
    } else {
      u.acted = true;
      u.moved = true;
      u.attacked = true;
    }
  }
  return state;
}

function paintBorders(state: GameState, city: City): void {
  if (city.owner === null) return;
  for (let y = city.y - city.border; y <= city.y + city.border; y++) {
    for (let x = city.x - city.border; x <= city.x + city.border; x++) {
      if (!inBounds(state, x, y)) continue;
      const t = tileAt(state, x, y)!;
      if (t.cityId && t.cityId !== city.id) {
        const other = state.cities.find((c) => c.id === t.cityId);
        if (other && other.owner !== null && chebyshev(other.x, other.y, x, y) < chebyshev(city.x, city.y, x, y)) continue;
      }
      t.owner = city.owner;
      t.cityId = city.id;
    }
  }
}

function updateConnections(state: GameState, pid: PlayerId): void {
  const owned = state.cities.filter((c) => c.owner === pid);
  const cap = owned.find((c) => c.isCapital && c.originalOwner === pid) ?? owned.find((c) => c.isCapital);
  if (!cap) return;
  const reach = new Set<string>([`${cap.x},${cap.y}`]);
  const q = [{ x: cap.x, y: cap.y }];
  while (q.length) {
    const c = q.shift()!;
    for (const n of neighbors(c.x, c.y)) {
      if (!inBounds(state, n.x, n.y)) continue;
      const t = tileAt(state, n.x, n.y)!;
      const key = `${n.x},${n.y}`;
      if (reach.has(key)) continue;
      const cityHere = cityAt(state, n.x, n.y);
      const walk = t.road || t.bridge || !!cityHere || (t.building === "dock");
      if (!walk) {
        if (isWater(t.terrain) && dockLinked(state, c.x, c.y, n.x, n.y)) {
          // handled below
        } else continue;
      }
      if (t.owner !== pid && !cityHere) continue;
      reach.add(key);
      q.push(n);
    }
    // port hops
    const from = tileAt(state, c.x, c.y);
    if (from?.building === "dock" || cityAt(state, c.x, c.y)) {
      for (const t of state.tiles) {
        if (t.building !== "dock" && !cityAt(state, t.x, t.y)) continue;
        if (t.owner !== pid) continue;
        const d = chebyshev(c.x, c.y, t.x, t.y);
        if (d > 0 && d <= PORT_LINK_RANGE && waterPath(state, c.x, c.y, t.x, t.y, PORT_LINK_RANGE)) {
          const key = `${t.x},${t.y}`;
          if (!reach.has(key)) {
            reach.add(key);
            q.push({ x: t.x, y: t.y });
          }
        }
      }
    }
  }
  let newly = 0;
  for (const city of owned) {
    const on = reach.has(`${city.x},${city.y}`);
    if (on && !city.connected && city.id !== cap.id) {
      city.connected = true;
      addPop(state, city, 1);
      addPop(state, cap, 1);
      newly += 1;
    }
    if (city.id !== cap.id) city.connected = on;
  }
  cap.connected = true;
  if (owned.filter((c) => c.connected).length >= 2) grantMonument(state, pid, "nexusMarket");
  void newly;
}

function dockLinked(_state: GameState, _ax: number, _ay: number, _bx: number, _by: number): boolean {
  return false;
}

function waterPath(state: GameState, ax: number, ay: number, bx: number, by: number, max: number): boolean {
  const q = [{ x: ax, y: ay, d: 0 }];
  const seen = new Set<string>([`${ax},${ay}`]);
  while (q.length) {
    const c = q.shift()!;
    if (c.x === bx && c.y === by) return true;
    if (c.d >= max) continue;
    for (const n of neighbors(c.x, c.y)) {
      if (!inBounds(state, n.x, n.y)) continue;
      const key = `${n.x},${n.y}`;
      if (seen.has(key)) continue;
      const t = tileAt(state, n.x, n.y)!;
      if (!isWater(t.terrain) && !(n.x === bx && n.y === by)) continue;
      seen.add(key);
      q.push({ x: n.x, y: n.y, d: c.d + 1 });
    }
  }
  return false;
}

function grantMonument(state: GameState, pid: PlayerId, id: City["monument"]): void {
  const p = player(state, pid);
  if (!id || p.monuments.includes(id)) return;
  if (id === "quietArray" && !p.techs.includes("signalSilence")) return;
  if (id === "archiveSpire" && !p.techs.includes("cognition")) return;
  if (id === "vaultSurplus" && !p.techs.includes("exchange")) return;
  if (id === "nexusMarket" && !p.techs.includes("maglev")) return;
  p.monuments.push(id);
  const cap = state.cities.find((c) => c.owner === pid && c.isCapital);
  if (cap && !cap.monument) {
    cap.monument = id;
    addPop(state, cap, 3);
  }
  toast(state, "info", "Monument", `Raised the ${id}.`);
}

function checkKiller(state: GameState, pid: PlayerId): void {
  if (player(state, pid).kills >= KILLER_THRESHOLD) grantMonument(state, pid, "killgate");
}

function checkElim(state: GameState, pid: PlayerId): void {
  if (state.cities.some((c) => c.owner === pid)) return;
  const p = player(state, pid);
  p.alive = false;
  state.units = state.units.filter((u) => u.owner !== pid);
  const alive = state.players.filter((x) => x.alive);
  if (state.mode === "domination" && alive.length <= 1) {
    state.over = true;
    state.winner = alive[0]?.id ?? null;
  }
}

export function applyIncome(state: GameState, pid: PlayerId): void {
  const p = player(state, pid);
  const inc = playerIncome(state, pid);
  p.energy += inc;
  p.energyPeak = Math.max(p.energyPeak, p.energy);
  if (p.energyPeak >= WEALTH_THRESHOLD) grantMonument(state, pid, "vaultSurplus");
}

function growTemples(state: GameState, pid: PlayerId): void {
  if (state.turn % TEMPLE_GROW_TURNS !== 0) return;
  for (const t of state.tiles) {
    if (t.owner !== pid) continue;
    if (!t.building) continue;
    if (t.building === "beacon" || t.building === "forestBeacon" || t.building === "ridgeBeacon" || t.building === "shelfBeacon") {
      t.templeLevel = Math.min(TEMPLE_MAX_LEVEL, t.templeLevel + 1);
    }
  }
}

function resetUnits(state: GameState, pid: PlayerId): void {
  for (const u of state.units) {
    if (u.owner !== pid) continue;
    if (!u.moved && !u.attacked && !u.acted && u.hp < u.maxHp) {
      u.hp = Math.min(u.maxHp, u.hp + healAmount(state, u));
    }
    u.moved = false;
    u.attacked = false;
    u.acted = false;
    u.startX = u.x;
    u.startY = u.y;
  }
}

function doEndTurn(state: GameState): GameState {
  const p = current(state);
  p.pacifistTurns += 1;
  if (p.pacifistTurns >= PACIFIST_TURNS) grantMonument(state, p.id, "quietArray");
  growTemples(state, p.id);

  let guard = 0;
  do {
    guard++;
    const next = nextAlive(state, state.currentPlayer);
    if (next === state.currentPlayer && guard > 1) break;
    if (next <= state.currentPlayer) {
      state.turn += 1;
      if (state.mode === "perfection" && state.turn > 30) {
        state.over = true;
        let best = 0;
        let bestId = 0;
        for (const pl of state.players) {
          const s = computeScore(state, pl.id);
          if (s > best) {
            best = s;
            bestId = pl.id;
          }
        }
        state.winner = bestId;
        return state;
      }
    }
    state.currentPlayer = next;
    if (!player(state, next).alive) continue;
    resetUnits(state, next);
    applyIncome(state, next);
    return state;
  } while (guard < 8);
  return state;
}

function nextAlive(state: GameState, from: PlayerId): PlayerId {
  const n = state.players.length;
  for (let i = 1; i <= n; i++) {
    const id = (from + i) % n;
    if (state.players[id].alive) return id;
  }
  return from;
}

export function legalTileActions(state: GameState, x: number, y: number): Command[] {
  const p = current(state);
  const t = tileAt(state, x, y);
  if (!t) return [];
  const cmds: Command[] = [];
  if (t.owner === p.id) {
    if (t.resource === "spore" && playerHas(state, p.id, "logistics") && p.energy >= 2) cmds.push({ type: "harvest", x, y });
    if (t.resource === "fauna" && playerHas(state, p.id, "tracking") && p.energy >= 2) cmds.push({ type: "harvest", x, y });
    if (t.resource === "plankton" && playerHas(state, p.id, "aquaculture") && p.energy >= 2) cmds.push({ type: "harvest", x, y });
    if (t.resource === "grain" && playerHas(state, p.id, "cultivation") && p.energy >= 5) cmds.push({ type: "build", x, y, kind: "hydroponics" });
    if (t.resource === "ore" && playerHas(state, p.id, "extraction") && p.energy >= 5) cmds.push({ type: "build", x, y, kind: "extractor" });
    if (t.terrain === "forest" && playerHas(state, p.id, "canopyWorks") && p.energy >= 3 && !t.building) cmds.push({ type: "build", x, y, kind: "spireTap" });
    if (t.terrain === "shelf" && playerHas(state, p.id, "aquaculture") && p.energy >= 7 && !t.building) cmds.push({ type: "build", x, y, kind: "dock" });
    if (playerHas(state, p.id, "maglev") && p.energy >= 3 && !t.road && t.terrain !== "ridge" && !isWater(t.terrain)) cmds.push({ type: "build", x, y, kind: "road" });
    if (playerHas(state, p.id, "canopyWorks") && t.terrain === "forest") cmds.push({ type: "clearForest", x, y });
    if (playerHas(state, p.id, "mycoweave") && t.terrain === "plain" && !t.resource && !t.building && p.energy >= 5) cmds.push({ type: "growForest", x, y });
    if (playerHas(state, p.id, "fabrication") && t.terrain === "forest" && !t.building && p.energy >= 5) cmds.push({ type: "burnForest", x, y });
    if (playerHas(state, p.id, "chargeProtocol") && t.building) cmds.push({ type: "destroy", x, y });
    if (playerHas(state, p.id, "orbitalMath") && t.terrain === "plain" && !t.building && p.energy >= 5) cmds.push({ type: "build", x, y, kind: "sporeMill" });
    if (playerHas(state, p.id, "fabrication") && t.terrain === "plain" && !t.building && p.energy >= 5) cmds.push({ type: "build", x, y, kind: "condenser" });
    if (playerHas(state, p.id, "alloyworks") && (t.terrain === "plain" || t.terrain === "forest") && !t.building && p.energy >= 5) cmds.push({ type: "build", x, y, kind: "smelter" });
    if (playerHas(state, p.id, "exchange") && !t.building && p.energy >= 5) cmds.push({ type: "build", x, y, kind: "exchangeHub" });
    if (playerHas(state, p.id, "openCircuit") && t.terrain === "plain" && !t.resource && !t.building && p.energy >= 20) cmds.push({ type: "build", x, y, kind: "beacon" });
    if (playerHas(state, p.id, "mycoweave") && t.terrain === "forest" && !t.building && p.energy >= 15) cmds.push({ type: "build", x, y, kind: "forestBeacon" });
    if (playerHas(state, p.id, "signalSilence") && t.terrain === "ridge" && !t.building && p.energy >= 20) cmds.push({ type: "build", x, y, kind: "ridgeBeacon" });
    if (playerHas(state, p.id, "depthward") && isWater(t.terrain) && !t.building && p.energy >= 20) cmds.push({ type: "build", x, y, kind: "shelfBeacon" });
  }
  if (playerHas(state, p.id, "maglev") && isWater(t.terrain) && !t.bridge && p.energy >= 5) {
    cmds.push({ type: "build", x, y, kind: "bridge" });
  }
  if (t.resource === "starfish" && playerHas(state, p.id, "starfix") && unitAt(state, x, y)?.owner === p.id) {
    cmds.push({ type: "harvestStarfish", x, y });
  }
  return cmds;
}

export { toast, paintBorders, updateConnections, addPop };
