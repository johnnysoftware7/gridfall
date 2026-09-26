import type { TechId } from "../engine/types";

export interface TechDef {
  id: TechId;
  name: string;
  tier: 1 | 2 | 3;
  parent: TechId | null;
  branch: 0 | 1 | 2 | 3 | 4;
  unlocks: string;
}

export const TECHS: Record<TechId, TechDef> = {
  tracking: { id: "tracking", name: "Tracking", tier: 1, parent: null, branch: 0, unlocks: "Hunt fauna" },
  ballistics: { id: "ballistics", name: "Ballistics", tier: 2, parent: "tracking", branch: 0, unlocks: "Marksman · bioforest defence" },
  mycoweave: { id: "mycoweave", name: "Mycoweave", tier: 3, parent: "ballistics", branch: 0, unlocks: "Grow Bioforest · Bioforest Beacon" },
  canopyWorks: { id: "canopyWorks", name: "Canopy Works", tier: 2, parent: "tracking", branch: 0, unlocks: "Spire Tap · Clear Bioforest" },
  orbitalMath: { id: "orbitalMath", name: "Orbital Math", tier: 3, parent: "canopyWorks", branch: 0, unlocks: "Railgun · Spore Mill" },

  gravMobility: { id: "gravMobility", name: "Grav Mobility", tier: 1, parent: null, branch: 1, unlocks: "Skimmer" },
  maglev: { id: "maglev", name: "Maglev", tier: 2, parent: "gravMobility", branch: 1, unlocks: "Maglev · Alloy Span" },
  exchange: { id: "exchange", name: "Exchange", tier: 3, parent: "maglev", branch: 1, unlocks: "Exchange Hub · Wealth" },
  openCircuit: { id: "openCircuit", name: "Open Circuit", tier: 2, parent: "gravMobility", branch: 1, unlocks: "Beacon · Disband" },
  chargeProtocol: { id: "chargeProtocol", name: "Charge Protocol", tier: 3, parent: "openCircuit", branch: 1, unlocks: "Lancer Mech · Scrap" },

  logistics: { id: "logistics", name: "Logistics", tier: 1, parent: null, branch: 2, unlocks: "Harvest spore pods · see grain" },
  cultivation: { id: "cultivation", name: "Cultivation", tier: 2, parent: "logistics", branch: 2, unlocks: "Hydroponics" },
  fabrication: { id: "fabrication", name: "Fabrication", tier: 3, parent: "cultivation", branch: 2, unlocks: "Condenser · Burn Bioforest" },
  doctrine: { id: "doctrine", name: "Doctrine", tier: 2, parent: "logistics", branch: 2, unlocks: "Bulwark · Ceasefire" },
  envoys: { id: "envoys", name: "Envoys", tier: 3, parent: "doctrine", branch: 2, unlocks: "Phantom · Relay · Spire Vision" },

  ridgecraft: { id: "ridgecraft", name: "Ridgecraft", tier: 1, parent: null, branch: 3, unlocks: "Ridges · defence · see ore" },
  extraction: { id: "extraction", name: "Extraction", tier: 2, parent: "ridgecraft", branch: 3, unlocks: "Extractor" },
  alloyworks: { id: "alloyworks", name: "Alloyworks", tier: 3, parent: "extraction", branch: 3, unlocks: "Smelter · Vanguard" },
  signalSilence: { id: "signalSilence", name: "Signal Silence", tier: 2, parent: "ridgecraft", branch: 3, unlocks: "Ridge Beacon · Pacifist" },
  cognition: { id: "cognition", name: "Cognition", tier: 3, parent: "signalSilence", branch: 3, unlocks: "Netrunner · Literacy" },

  aquaculture: { id: "aquaculture", name: "Aquaculture", tier: 1, parent: null, branch: 4, unlocks: "Plankton · Dock Ring · Skiff" },
  driftControl: { id: "driftControl", name: "Drift Control", tier: 2, parent: "aquaculture", branch: 4, unlocks: "Hover Scout · Deep" },
  starfix: { id: "starfix", name: "Starfix", tier: 3, parent: "driftControl", branch: 4, unlocks: "Depth Bomber · Drift Crystal" },
  hullBreach: { id: "hullBreach", name: "Hull Breach", tier: 2, parent: "aquaculture", branch: 4, unlocks: "Hull Ram" },
  depthward: { id: "depthward", name: "Depthward", tier: 3, parent: "hullBreach", branch: 4, unlocks: "Shelf Beacon · water defence" },
};

export const TECH_LIST: TechId[] = Object.keys(TECHS) as TechId[];

export function techDef(id: TechId): TechDef {
  return TECHS[id];
}

export function techCost(tier: 1 | 2 | 3, cities: number, literacy: boolean): number {
  const raw = tier * cities + 4;
  if (!literacy) return raw;
  return Math.ceil(raw * (2 / 3));
}

export function canResearch(have: TechId[], id: TechId): boolean {
  if (have.includes(id)) return false;
  const t = TECHS[id];
  return t.parent === null || have.includes(t.parent);
}
