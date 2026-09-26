export type FactionId = "helix" | "meridian" | "tide" | "ashfall" | "verdant";
export type PlayerId = number;
export type Difficulty = "easy" | "normal" | "hard" | "crazy";
export type GameMode = "perfection" | "domination";
export type Terrain = "plain" | "forest" | "ridge" | "shelf" | "deep";
export type Resource = "spore" | "grain" | "fauna" | "ore" | "plankton" | "starfish";

export type BuildingKind =
  | "hydroponics"
  | "extractor"
  | "spireTap"
  | "sporeMill"
  | "condenser"
  | "smelter"
  | "dock"
  | "exchangeHub"
  | "beacon"
  | "forestBeacon"
  | "ridgeBeacon"
  | "shelfBeacon"
  | "monument";

export type UnitType =
  | "trooper"
  | "skimmer"
  | "marksman"
  | "bulwark"
  | "vanguard"
  | "railgun"
  | "lancer"
  | "netrunner"
  | "titan"
  | "phantom"
  | "blade"
  | "skiff"
  | "hoverScout"
  | "hullRam"
  | "depthBomber"
  | "leviathan"
  | "ghostSkiff";

export type Skill =
  | "dash"
  | "escape"
  | "fortify"
  | "persist"
  | "stiff"
  | "heal"
  | "convert"
  | "scout"
  | "splash"
  | "hide"
  | "infiltrate"
  | "creep"
  | "surprise"
  | "independent"
  | "static"
  | "water"
  | "carry"
  | "stomp";

export type TechId =
  | "tracking" | "ballistics" | "mycoweave" | "canopyWorks" | "orbitalMath"
  | "gravMobility" | "maglev" | "exchange" | "openCircuit" | "chargeProtocol"
  | "logistics" | "cultivation" | "fabrication" | "doctrine" | "envoys"
  | "ridgecraft" | "extraction" | "alloyworks" | "signalSilence" | "cognition"
  | "aquaculture" | "driftControl" | "starfix" | "hullBreach" | "depthward";

export type MonumentId = "quietArray" | "archiveSpire" | "vaultSurplus" | "nexusMarket" | "killgate";

export type LevelUpReward = "workshop" | "explorer" | "wall" | "stars" | "pop" | "border" | "park" | "titan";

export type NavalClass = "skiff" | "hoverScout" | "hullRam" | "depthBomber" | "leviathan" | "ghostSkiff";

export interface FactionDef {
  id: FactionId;
  name: string;
  short: string;
  color: string;
  colorDark: string;
  startTech: TechId;
  startUnit: UnitType;
  spawn: {
    forest: number;
    ridge: number;
    fruit: number;
    fauna: number;
    crop: number;
    fish: number;
    water: number;
    metal?: number;
  };
  helmet: FactionId;
  cityNames: string[];
}

export interface Tile {
  x: number;
  y: number;
  terrain: Terrain;
  resource: Resource | null;
  building: BuildingKind | null;
  buildingLevel: number;
  road: boolean;
  bridge: boolean;
  owner: PlayerId | null;
  cityId: string | null;
  ruin: boolean;
  templeLevel: number;
}

export interface City {
  id: string;
  name: string;
  x: number;
  y: number;
  owner: PlayerId | null;
  isCapital: boolean;
  originalOwner: PlayerId | null;
  level: number;
  progress: number;
  workshop: boolean;
  parks: number;
  wall: boolean;
  border: number;
  connected: boolean;
  monument?: MonumentId;
}

export interface Unit {
  id: string;
  type: UnitType;
  owner: PlayerId;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  moved: boolean;
  attacked: boolean;
  acted: boolean;
  kills: number;
  veteran: boolean;
  veteranReady: boolean;
  cityId: string | null;
  startX: number;
  startY: number;
  cargoType?: UnitType;
  cargoHp?: number;
  cargoMaxHp?: number;
  cargoVeteran?: boolean;
  hidden?: boolean;
  lastDir?: { dx: number; dy: number };
}

export interface Player {
  id: PlayerId;
  faction: FactionId;
  isHuman: boolean;
  difficulty: Difficulty;
  energy: number;
  techs: TechId[];
  alive: boolean;
  kills: number;
  energyPeak: number;
  pacifistTurns: number;
  monuments: MonumentId[];
  peaceWith: PlayerId[];
  explored: boolean[];
  seenCapitals: PlayerId[];
}

export interface Toast {
  id: string;
  kind: "tech" | "level" | "info";
  title: string;
  body: string;
  icon?: string;
  color?: string;
}

export interface PendingLevelUp {
  cityId: string;
  options: LevelUpReward[];
}

export interface GameState {
  seed: number;
  rng: number;
  turn: number;
  currentPlayer: PlayerId;
  mode: GameMode;
  size: number;
  tiles: Tile[];
  cities: City[];
  units: Unit[];
  players: Player[];
  toasts: Toast[];
  pendingLevelUp: PendingLevelUp | null;
  winner: PlayerId | null;
  over: boolean;
  nextId: number;
  lastTech?: { player: PlayerId; tech: TechId };
}

export type Command =
  | { type: "move"; unitId: string; x: number; y: number }
  | { type: "attack"; unitId: string; targetId: string }
  | { type: "heal"; unitId: string }
  | { type: "healOthers"; unitId: string }
  | { type: "convert"; unitId: string; targetId: string }
  | { type: "capture"; unitId: string }
  | { type: "examine"; unitId: string }
  | { type: "harvest"; x: number; y: number }
  | { type: "build"; x: number; y: number; kind: BuildingKind | "road" | "bridge" }
  | { type: "clearForest"; x: number; y: number }
  | { type: "growForest"; x: number; y: number }
  | { type: "burnForest"; x: number; y: number }
  | { type: "destroy"; x: number; y: number }
  | { type: "train"; cityId: string; unit: UnitType }
  | { type: "research"; tech: TechId }
  | { type: "promote"; unitId: string }
  | { type: "disband"; unitId: string }
  | { type: "upgradeNaval"; unitId: string; into: NavalClass }
  | { type: "levelUp"; reward: LevelUpReward }
  | { type: "infiltrate"; unitId: string; cityId: string }
  | { type: "offerPeace"; target: PlayerId }
  | { type: "breakPeace"; target: PlayerId }
  | { type: "endTurn" }
  | { type: "harvestStarfish"; x: number; y: number };

export interface NewGameOpts {
  seed: number;
  size: number;
  mode: GameMode;
  humanFaction: FactionId;
  aiCount: number;
  difficulty: Difficulty;
  aiFactions?: FactionId[];
}
