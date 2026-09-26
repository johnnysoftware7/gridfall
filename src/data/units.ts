import type { Skill, UnitType } from "../engine/types";

export interface UnitDef {
  id: UnitType;
  name: string;
  cost: number;
  hp: number;
  attack: number;
  defense: number;
  movement: number;
  range: number;
  skills: Skill[];
  land: boolean;
  trainable: boolean;
  tech?: string;
  super?: boolean;
  naval?: boolean;
  static?: boolean;
}

export const UNITS: Record<UnitType, UnitDef> = {
  trooper: {
    id: "trooper", name: "Trooper", cost: 2, hp: 10, attack: 2, defense: 2,
    movement: 1, range: 1, skills: ["dash", "fortify"], land: true, trainable: true,
  },
  skimmer: {
    id: "skimmer", name: "Skimmer", cost: 3, hp: 10, attack: 2, defense: 1,
    movement: 2, range: 1, skills: ["dash", "escape", "fortify"], land: true, trainable: true, tech: "gravMobility",
  },
  marksman: {
    id: "marksman", name: "Marksman", cost: 3, hp: 10, attack: 2, defense: 1,
    movement: 1, range: 2, skills: ["dash", "fortify"], land: true, trainable: true, tech: "ballistics",
  },
  bulwark: {
    id: "bulwark", name: "Bulwark", cost: 3, hp: 15, attack: 1, defense: 3,
    movement: 1, range: 1, skills: ["fortify"], land: true, trainable: true, tech: "doctrine",
  },
  vanguard: {
    id: "vanguard", name: "Vanguard", cost: 5, hp: 15, attack: 3, defense: 3,
    movement: 1, range: 1, skills: ["dash"], land: true, trainable: true, tech: "alloyworks",
  },
  railgun: {
    id: "railgun", name: "Railgun", cost: 8, hp: 10, attack: 4, defense: 0,
    movement: 1, range: 3, skills: ["stiff"], land: true, trainable: true, tech: "orbitalMath",
  },
  lancer: {
    id: "lancer", name: "Lancer Mech", cost: 8, hp: 10, attack: 3.5, defense: 1,
    movement: 3, range: 1, skills: ["dash", "persist", "fortify"], land: true, trainable: true, tech: "chargeProtocol",
  },
  netrunner: {
    id: "netrunner", name: "Netrunner", cost: 5, hp: 10, attack: 0, defense: 1,
    movement: 1, range: 1, skills: ["heal", "convert", "stiff"], land: true, trainable: true, tech: "cognition",
  },
  titan: {
    id: "titan", name: "Titan", cost: 10, hp: 40, attack: 5, defense: 4,
    movement: 1, range: 1, skills: ["static"], land: true, trainable: false, super: true, static: true,
  },
  phantom: {
    id: "phantom", name: "Phantom", cost: 8, hp: 5, attack: 2, defense: 0.5,
    movement: 2, range: 1, skills: ["hide", "infiltrate", "dash", "scout", "creep", "stiff", "static"],
    land: true, trainable: true, tech: "envoys", static: true,
  },
  blade: {
    id: "blade", name: "Blade", cost: 2, hp: 10, attack: 2, defense: 2,
    movement: 1, range: 1, skills: ["surprise", "independent", "static"], land: true, trainable: false, static: true,
  },
  skiff: {
    id: "skiff", name: "Skiff", cost: 0, hp: 10, attack: 0, defense: 1,
    movement: 2, range: 0, skills: ["water", "carry", "stiff", "static"], land: false, trainable: false, naval: true, static: true,
  },
  hoverScout: {
    id: "hoverScout", name: "Hover Scout", cost: 5, hp: 10, attack: 2, defense: 1,
    movement: 3, range: 2, skills: ["water", "dash", "carry", "scout", "static"], land: false, trainable: false, naval: true, static: true, tech: "driftControl",
  },
  hullRam: {
    id: "hullRam", name: "Hull Ram", cost: 5, hp: 10, attack: 3, defense: 3,
    movement: 3, range: 1, skills: ["water", "dash", "carry", "static"], land: false, trainable: false, naval: true, static: true, tech: "hullBreach",
  },
  depthBomber: {
    id: "depthBomber", name: "Depth Bomber", cost: 15, hp: 10, attack: 3, defense: 2,
    movement: 2, range: 3, skills: ["water", "carry", "splash", "stiff", "static"], land: false, trainable: false, naval: true, static: true, tech: "starfix",
  },
  leviathan: {
    id: "leviathan", name: "Leviathan", cost: 10, hp: 40, attack: 4, defense: 4,
    movement: 2, range: 1, skills: ["water", "carry", "stiff", "stomp", "static"], land: false, trainable: false, naval: true, static: true, super: true,
  },
  ghostSkiff: {
    id: "ghostSkiff", name: "Ghost Skiff", cost: 8, hp: 5, attack: 2, defense: 0.5,
    movement: 2, range: 1, skills: ["water", "hide", "infiltrate", "dash", "scout", "stiff", "static"],
    land: false, trainable: false, naval: true, static: true,
  },
};

export function unitDef(t: UnitType): UnitDef {
  return UNITS[t];
}

export function hasSkill(t: UnitType, s: Skill): boolean {
  return UNITS[t].skills.includes(s);
}
