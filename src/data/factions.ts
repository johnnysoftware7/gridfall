import type { FactionDef, FactionId } from "../engine/types";

export const FACTIONS: Record<FactionId, FactionDef> = {
  helix: {
    id: "helix",
    name: "Helix Collective",
    short: "Helix",
    color: "#2ec4b6",
    colorDark: "#0e6b62",
    startTech: "logistics",
    startUnit: "trooper",
    spawn: { forest: 1, ridge: 1, fruit: 2, fauna: 0.5, crop: 1, fish: 1, water: 1 },
    helmet: "helix",
    cityNames: [
      "Novagrid", "Circlet", "Meridian Gate", "Apex Loop", "Lumenhold",
      "Vector Bay", "Helix Reach", "Ion Terrace", "Prism Dock", "Sigma Reef",
    ],
  },
  meridian: {
    id: "meridian",
    name: "Iron Meridian",
    short: "Meridian",
    color: "#e07a3d",
    colorDark: "#8a3d14",
    startTech: "ridgecraft",
    startUnit: "trooper",
    spawn: { forest: 1, ridge: 1.5, fruit: 1, fauna: 1, crop: 1, fish: 1, water: 0.85, metal: 1.5 },
    helmet: "meridian",
    cityNames: [
      "Cinder Spire", "Rustvault", "Orehaven", "Slagwatch", "Basalt Rim",
      "Forgecliff", "Ironwake", "Embercut", "Ridgekiln", "Ashbrace",
    ],
  },
  tide: {
    id: "tide",
    name: "Tidebreakers",
    short: "Tide",
    color: "#3d7ee0",
    colorDark: "#1a3f80",
    startTech: "aquaculture",
    startUnit: "trooper",
    spawn: { forest: 1, ridge: 0.5, fruit: 1, fauna: 1, crop: 1, fish: 1.5, water: 1.15 },
    helmet: "tide",
    cityNames: [
      "Brinehold", "Shelfward", "Sprayline", "Kelpson", "Driftwake",
      "Azure Dock", "Foamreach", "Tideglass", "Nacre Point", "Breakwater",
    ],
  },
  ashfall: {
    id: "ashfall",
    name: "Ashfall Nomads",
    short: "Ashfall",
    color: "#e03d3d",
    colorDark: "#7a1515",
    startTech: "gravMobility",
    startUnit: "skimmer",
    spawn: { forest: 0.2, ridge: 0.5, fruit: 1, fauna: 0.2, crop: 1, fish: 1, water: 0.9 },
    helmet: "ashfall",
    cityNames: [
      "Ember Drift", "Cinder Road", "Red Dune", "Sootreach", "Flare Camp",
      "Dustspire", "Scorchline", "Nomad Kiln", "Glasswind", "Pyre Step",
    ],
  },
  verdant: {
    id: "verdant",
    name: "Verdant Pact",
    short: "Verdant",
    color: "#3db85a",
    colorDark: "#1a5c2a",
    startTech: "tracking",
    startUnit: "trooper",
    spawn: { forest: 1.5, ridge: 1, fruit: 1, fauna: 1.2, crop: 0, fish: 1, water: 0.95 },
    helmet: "verdant",
    cityNames: [
      "Mycospire", "Canopy", "Sporefall", "Rootglass", "Glowfen",
      "Hyphal", "Mossvault", "Pactgrove", "Lichenreach", "Verdance",
    ],
  },
};

export const FACTION_ORDER: FactionId[] = ["helix", "meridian", "tide", "ashfall", "verdant"];

export function factionById(id: FactionId): FactionDef {
  return FACTIONS[id];
}
