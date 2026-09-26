import * as THREE from "three";
import type { FactionId, UnitType } from "../../engine/types";
import { factionAccent, glow, ice, iceTint, metal } from "./palette";
import {
  armor,
  capsule,
  circuit,
  hexHull,
  hexPlate,
  lathe,
  roundBox,
  seamLine,
  seamLoop,
  seamMat,
  slitMat,
  taper,
  visorMat,
} from "./kit";

type Kit = {
  hull: THREE.MeshBasicMaterial;
  dark: THREE.MeshBasicMaterial;
  board: THREE.MeshBasicMaterial;
  accent: string;
  seam: THREE.MeshBasicMaterial;
  visor: THREE.MeshBasicMaterial;
  slit: THREE.MeshBasicMaterial;
};

function kit(faction: FactionId): Kit {
  const accent = factionAccent(faction);
  return {
    hull: armor(accent, false),
    dark: armor(accent, true),
    board: circuit(accent),
    accent,
    seam: seamMat(accent),
    visor: visorMat(accent),
    slit: slitMat(),
  };
}

function fade(g: THREE.Group, opacity: number): void {
  g.traverse((c) => {
    if (!(c instanceof THREE.Mesh) || !c.material) return;
    const src = Array.isArray(c.material) ? c.material[0] : c.material;
    if (!src || !("opacity" in src)) return;
    const mat = src.clone();
    mat.transparent = true;
    mat.opacity = opacity;
    c.material = mat;
  });
}

function shadow(g: THREE.Group, r = 0.2): void {
  const s = new THREE.Mesh(
    new THREE.CircleGeometry(r, 16),
    new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.45 }),
  );
  s.rotation.x = -Math.PI / 2;
  s.position.y = 0.01;
  g.add(s);
}

function pistol(g: THREE.Group, k: Kit, x: number, y: number, z: number, len: number): void {
  g.add(roundBox(len, 0.042, 0.038, 0.008, k.dark, x + len * 0.28, y, z, 0, 0, 0));
  g.add(roundBox(0.04, 0.055, 0.03, 0.006, k.hull, x + 0.02, y - 0.03, z));
  g.add(taper(0.012, 0.01, len * 0.45, k.dark, x + len * 0.55, y, z, 0, Math.PI / 2));
  g.add(seamLine(x, y + 0.02, z, x + len * 0.62, y + 0.02, z, 0.007, k.seam));
  g.add(roundBox(0.022, 0.022, 0.022, 0.004, k.visor, x + len * 0.62, y, z));
}

function rifle(g: THREE.Group, k: Kit, x: number, y: number, z: number, len: number): void {
  g.add(roundBox(len, 0.038, 0.034, 0.007, k.dark, x + len * 0.3, y, z));
  g.add(roundBox(0.05, 0.07, 0.03, 0.006, k.hull, x + 0.04, y - 0.028, z));
  g.add(taper(0.01, 0.008, len * 0.55, k.dark, x + len * 0.62, y, z, 0, Math.PI / 2));
  g.add(hexHull(0.02, 0.016, 0.05, k.hull, x + len * 0.22, y + 0.03, z));
  g.add(seamLine(x, y + 0.018, z, x + len * 0.72, y + 0.018, z, 0.007, k.seam));
}

function fist(g: THREE.Group, k: Kit, x: number, y: number, z: number): void {
  g.add(roundBox(0.058, 0.05, 0.05, 0.01, k.dark, x, y, z));
  g.add(seamLoop(0.05, 0.042, 0.006, k.seam, x, y, z + 0.026));
}

/** Charcoal hex-hull biped: gun + fist, recessed visor, faction seams. */
function warrior(g: THREE.Group, k: Kit, pose: "trooper" | "marksman" | "railgun" | "bulwark" | "titan"): void {
  const s = pose === "titan" ? 1.28 : pose === "bulwark" ? 1.14 : 1;
  const tall = pose === "marksman" || pose === "railgun" ? 1.14 : 1;
  const gunLen = pose === "railgun" ? 0.34 : pose === "marksman" ? 0.28 : 0.2;

  g.add(hexHull(0.118 * s, 0.1 * s, 0.2 * s, k.hull, 0, 0.4 * tall, 0.01));
  g.add(hexHull(0.09 * s, 0.078 * s, 0.08 * s, k.dark, 0, 0.3 * tall, 0.01));
  g.add(seamLoop(0.2 * s, 0.16 * s, 0.011, k.seam, 0, 0.4 * tall, 0.09 * s));
  g.add(seamLine(-0.02, 0.3 * tall, 0.095 * s, -0.02, 0.5 * tall, 0.095 * s, 0.009, k.seam));
  g.add(roundBox(0.12 * s, 0.07 * s, 0.03 * s, 0.008, k.dark, 0, 0.4 * tall, 0.09 * s));

  g.add(hexHull(0.072 * s, 0.062 * s, 0.1 * s, k.dark, 0, 0.54 * tall, 0.02));
  g.add(roundBox(0.09 * s, 0.028 * s, 0.02 * s, 0.004, k.slit, 0, 0.545 * tall, 0.075 * s));
  g.add(roundBox(0.08 * s, 0.01 * s, 0.012 * s, 0.002, k.visor, 0, 0.545 * tall, 0.086 * s));
  g.add(seamLine(-0.04 * s, 0.545 * tall, 0.09 * s, 0.04 * s, 0.545 * tall, 0.09 * s, 0.006, k.seam));

  for (const sx of [-1, 1] as const) {
    g.add(hexHull(0.055 * s, 0.048 * s, 0.07 * s, k.hull, sx * 0.135 * s, 0.48 * tall, 0.01));
    g.add(seamLoop(0.09 * s, 0.06 * s, 0.006, k.seam, sx * 0.135 * s, 0.48 * tall, 0.05 * s));
    g.add(capsule(0.028 * s, 0.09 * s, k.hull, sx * 0.175 * s, 0.38 * tall, 0.02, 0.15, sx * 0.35));
    if (sx < 0) {
      g.add(capsule(0.026 * s, 0.08 * s, k.dark, sx * 0.2 * s, 0.26 * tall, 0.05, 0.4, sx * 0.2));
      fist(g, k, sx * 0.22 * s, 0.2 * tall, 0.08);
      if (pose === "bulwark") {
        g.add(hexHull(0.08 * s, 0.075 * s, 0.04 * s, k.board, sx * 0.26 * s, 0.28 * tall, 0.1, Math.PI / 2));
        g.add(seamLoop(0.14 * s, 0.14 * s, 0.007, k.seam, sx * 0.26 * s, 0.28 * tall, 0.12, 0, Math.PI / 2));
      }
    } else if (pose === "railgun") {
      g.add(hexHull(0.05 * s, 0.04 * s, 0.16 * s, k.dark, sx * 0.12 * s, 0.5 * tall, 0.08, Math.PI / 2));
      g.add(taper(0.03 * s, 0.016 * s, gunLen, k.hull, sx * 0.12 * s, 0.5 * tall, 0.18));
      g.add(seamLine(sx * 0.12 * s, 0.52 * tall, 0.02, sx * 0.12 * s, 0.52 * tall, 0.22, 0.008, k.seam));
    } else if (pose === "marksman") {
      g.add(capsule(0.026 * s, 0.07 * s, k.dark, sx * 0.18 * s, 0.36 * tall, 0.07, 1.1, sx * 0.15));
      rifle(g, k, sx * 0.16 * s, 0.36 * tall, 0.12, gunLen * s);
    } else {
      g.add(capsule(0.026 * s, 0.07 * s, k.dark, sx * 0.18 * s, 0.34 * tall, 0.07, 1.05, sx * 0.1));
      pistol(g, k, sx * 0.16 * s, 0.34 * tall, 0.11, gunLen * s);
    }
    g.add(capsule(0.036 * s, 0.11 * s, k.hull, sx * 0.068 * s, 0.2 * tall, 0.01, 0.08, 0));
    g.add(capsule(0.032 * s, 0.09 * s, k.dark, sx * 0.07 * s, 0.09 * tall, 0.02, 0.05, 0));
    g.add(roundBox(0.09 * s, 0.036 * s, 0.12 * s, 0.01, k.dark, sx * 0.07 * s, 0.028, 0.04));
    g.add(seamLine(sx * 0.068 * s, 0.26 * tall, 0.04, sx * 0.07 * s, 0.04, 0.05, 0.006, k.seam));
  }
}

function leaper(g: THREE.Group, k: Kit): void {
  g.add(lathe([[0.01, 0.12], [0.09, 0.16], [0.12, 0.24], [0.1, 0.34], [0.05, 0.4], [0.01, 0.42]], k.hull, 0, 0, 0.02));
  g.add(hexHull(0.055, 0.04, 0.08, k.dark, 0, 0.3, 0.12));
  g.add(roundBox(0.07, 0.02, 0.016, 0.003, k.visor, 0, 0.3, 0.17));
  g.add(seamLoop(0.18, 0.12, 0.008, k.seam, 0, 0.28, 0.08, Math.PI / 2));
  for (const sx of [-1, 1] as const) {
    g.add(capsule(0.028, 0.14, k.hull, sx * 0.1, 0.16, -0.06, 0.9, sx * 0.15));
    g.add(roundBox(0.07, 0.03, 0.09, 0.008, k.dark, sx * 0.14, 0.04, 0.02));
    g.add(capsule(0.024, 0.1, k.dark, sx * 0.12, 0.28, 0.12, 1.15, sx * 0.2));
    fist(g, k, sx * 0.14, 0.24, 0.18);
  }
}

function beetle(g: THREE.Group, k: Kit): void {
  g.add(lathe([[0.02, 0.08], [0.12, 0.1], [0.16, 0.18], [0.14, 0.28], [0.06, 0.34], [0.01, 0.36]], k.hull, 0, 0, 0));
  g.add(seamLoop(0.22, 0.14, 0.008, k.seam, 0, 0.22, 0.1, 0.45));
  g.add(hexHull(0.05, 0.04, 0.07, k.dark, 0, 0.2, 0.14));
  g.add(roundBox(0.06, 0.018, 0.014, 0.003, k.visor, 0, 0.2, 0.185));
  for (const [sx, sz] of [[-1, 0.08], [1, 0.08], [-1, -0.06], [1, -0.06], [-1, 0.01], [1, 0.01]] as const) {
    g.add(capsule(0.018, 0.07, k.dark, sx * 0.12, 0.1, sz, 0.7, sx * 0.4));
    g.add(roundBox(0.045, 0.022, 0.05, 0.006, k.hull, sx * 0.15, 0.03, sz + 0.02));
  }
}

function spider(g: THREE.Group, k: Kit): void {
  g.add(lathe([[0.01, 0.16], [0.07, 0.18], [0.09, 0.26], [0.06, 0.32], [0.01, 0.34]], k.hull, 0, 0, 0));
  g.add(seamLoop(0.14, 0.1, 0.007, k.seam, 0, 0.24, 0.07));
  g.add(roundBox(0.055, 0.018, 0.014, 0.003, k.visor, 0, 0.26, 0.09));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.25;
    const x = Math.cos(a);
    const z = Math.sin(a);
    g.add(capsule(0.014, 0.16, k.dark, x * 0.12, 0.16, z * 0.12, 0.95, x * 0.55));
    g.add(seamLine(x * 0.05, 0.24, z * 0.05, x * 0.2, 0.08, z * 0.2, 0.005, k.seam));
    g.add(roundBox(0.04, 0.018, 0.04, 0.006, k.hull, x * 0.22, 0.024, z * 0.22));
  }
}

function horned(g: THREE.Group, k: Kit): void {
  g.add(lathe([[0.01, 0.12], [0.08, 0.16], [0.11, 0.24], [0.09, 0.32], [0.04, 0.36], [0.01, 0.38]], k.hull, 0, 0, 0.02));
  g.add(hexHull(0.05, 0.04, 0.07, k.dark, 0, 0.28, 0.12));
  g.add(roundBox(0.055, 0.016, 0.012, 0.003, k.visor, 0, 0.28, 0.165));
  g.add(taper(0.02, 0.006, 0.2, k.hull, 0, 0.3, 0.24, 1.2, 0));
  g.add(seamLine(0, 0.3, 0.14, 0, 0.3, 0.34, 0.007, k.seam));
  g.add(seamLoop(0.18, 0.1, 0.007, k.seam, 0, 0.26, 0.08, Math.PI / 2));
  for (const sx of [-1, 1] as const) {
    g.add(capsule(0.026, 0.1, k.hull, sx * 0.08, 0.16, -0.05, 0.35, 0));
    g.add(capsule(0.024, 0.09, k.dark, sx * 0.08, 0.16, 0.08, 0.2, 0));
    g.add(roundBox(0.065, 0.028, 0.08, 0.008, k.dark, sx * 0.09, 0.035, 0.02));
  }
}

function scorpion(g: THREE.Group, k: Kit): void {
  g.add(lathe([[0.01, 0.1], [0.08, 0.12], [0.1, 0.2], [0.08, 0.28], [0.03, 0.32], [0.01, 0.33]], k.hull, 0, 0, 0));
  g.add(seamLoop(0.16, 0.1, 0.007, k.seam, 0, 0.22, 0.08, Math.PI / 2));
  g.add(roundBox(0.05, 0.016, 0.012, 0.003, k.visor, 0, 0.22, 0.14));
  for (const sx of [-1, 1] as const) {
    g.add(capsule(0.022, 0.1, k.hull, sx * 0.1, 0.22, 0.1, 1.1, sx * 0.35));
    g.add(roundBox(0.03, 0.085, 0.03, 0.006, k.dark, sx * 0.17, 0.22, 0.17, 0, 0, sx * 0.45));
    g.add(capsule(0.02, 0.07, k.dark, sx * 0.07, 0.12, 0.04, 0.3, 0));
    g.add(capsule(0.02, 0.07, k.dark, sx * 0.07, 0.12, -0.05, 0.25, 0));
  }
  g.add(taper(0.018, 0.01, 0.18, k.dark, 0, 0.36, -0.1, -0.95, 0));
  g.add(hexHull(0.03, 0.018, 0.05, k.visor, 0, 0.46, -0.18));
  g.add(seamLine(0, 0.24, -0.04, 0, 0.44, -0.16, 0.006, k.seam));
}

function wraith(g: THREE.Group, k: Kit): void {
  g.add(lathe([[0.01, 0.08], [0.05, 0.16], [0.07, 0.3], [0.05, 0.46], [0.03, 0.54], [0.01, 0.58]], k.hull, 0, 0, 0));
  g.add(seamLoop(0.12, 0.2, 0.006, k.seam, 0, 0.36, 0.05));
  g.add(roundBox(0.055, 0.016, 0.012, 0.003, k.visor, 0, 0.46, 0.06));
  for (const sx of [-1, 1] as const) {
    g.add(capsule(0.02, 0.16, k.dark, sx * 0.1, 0.34, -0.03, 0.15, sx * 0.25));
    g.add(capsule(0.02, 0.1, k.hull, sx * 0.05, 0.14, 0.01, 0.05, 0));
  }
  fade(g, 0.62);
}

function naval(g: THREE.Group, type: UnitType, k: Kit): void {
  const L = type === "leviathan" ? 0.42 : type === "depthBomber" ? 0.32 : 0.26;
  const hull = lathe([[0.01, -L], [0.055, -L * 0.55], [0.075, 0], [0.05, L * 0.5], [0.016, L]], k.hull, 0, 0.1, 0, 18);
  hull.rotation.z = Math.PI / 2;
  g.add(hull);
  g.add(seamLoop(L * 1.6, 0.09, 0.007, k.seam, 0, 0.13, 0.05, Math.PI / 2));
  g.add(hexHull(0.04, 0.03, 0.055, k.visor, L * 0.28, 0.16, 0.02));
  shadow(g, 0.22);
  if (type === "hoverScout") g.add(taper(0.02, 0.01, 0.12, k.hull, 0, 0.22, 0));
  if (type === "hullRam") g.add(hexHull(0.05, 0.04, 0.08, k.dark, L * 0.38, 0.1, 0));
  if (type === "ghostSkiff") fade(g, 0.55);
}

export function buildMech(type: UnitType, faction: FactionId, _color: string): THREE.Group {
  const g = new THREE.Group();
  const k = kit(faction);
  void _color;
  if (type === "skiff" || type === "hoverScout" || type === "hullRam" || type === "depthBomber" || type === "leviathan" || type === "ghostSkiff") {
    naval(g, type, k);
    return g;
  }
  shadow(g, type === "titan" ? 0.26 : 0.2);
  if (type === "trooper") warrior(g, k, "trooper");
  else if (type === "skimmer") leaper(g, k);
  else if (type === "marksman") warrior(g, k, "marksman");
  else if (type === "railgun") warrior(g, k, "railgun");
  else if (type === "bulwark") warrior(g, k, "bulwark");
  else if (type === "vanguard") beetle(g, k);
  else if (type === "lancer") horned(g, k);
  else if (type === "netrunner") spider(g, k);
  else if (type === "titan") warrior(g, k, "titan");
  else if (type === "phantom") wraith(g, k);
  else if (type === "blade") scorpion(g, k);
  else warrior(g, k, "trooper");
  return g;
}

export function buildHero(faction: FactionId, _color: string): THREE.Group {
  const g = new THREE.Group();
  const accent = factionAccent(faction);
  const shell = ice(iceTint(faction), accent, 0.62);
  shell.color.offsetHSL(0, 0.05, 0.12);
  const dark = armor(accent, true);
  const visor = visorMat(accent);
  void _color;

  for (const sx of [-1, 1] as const) {
    g.add(taper(0.2, 0.2, 0.85, shell, sx * 0.32, 0.62, 0.04, 0.05, sx * 0.04));
    g.add(roundBox(0.5, 0.18, 0.48, 0.04, dark, sx * 0.32, 0.08, 0.08));
  }
  const torso = new THREE.Mesh(new THREE.IcosahedronGeometry(0.78, 0), shell);
  torso.scale.set(0.92, 1.18, 0.62);
  torso.position.set(0, 1.95, 0);
  torso.castShadow = true;
  g.add(torso);
  g.add(roundBox(0.88, 0.22, 0.55, 0.05, shell, 0, 1.22, 0.02));
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), visor);
  core.position.set(0, 1.95, 0.38);
  g.add(core);
  for (const sx of [-1, 1] as const) {
    g.add(taper(0.18, 0.18, 0.95, shell, sx * 0.95, 1.7, 0, 0, sx * -0.22));
    g.add(roundBox(0.5, 0.38, 0.5, 0.05, dark, sx * 1.16, 0.92, 0.1));
  }
  const helm = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 0), shell);
  helm.scale.set(0.95, 0.85, 0.8);
  helm.position.set(0, 3.05, 0.08);
  g.add(helm);
  g.add(roundBox(0.46, 0.08, 0.08, 0.02, visor, 0, 3.04, 0.34));
  return g;
}

export function buildSpire(_faction: FactionId, color: string, capital: boolean, level = 1): THREE.Group {
  const g = new THREE.Group();
  const accent = factionAccent(_faction);
  const hull = circuit(accent);
  const dark = armor(accent, true);
  const seam = seamMat(accent);
  const visor = visorMat(accent);
  const lv = Math.max(1, Math.min(8, level));
  const s = capital ? 1 : 0.78;

  g.add(hexPlate(0.48 * s, 0.07, hull, 0, 0.04, 0));
  g.add(hexPlate(0.36 * s, 0.05, dark, 0, 0.09, 0));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const x0 = Math.cos(a) * 0.1 * s;
    const z0 = Math.sin(a) * 0.1 * s;
    const x1 = Math.cos(a) * 0.42 * s;
    const z1 = Math.sin(a) * 0.42 * s;
    g.add(seamLine(x0, 0.09, z0, x1, 0.09, z1, 0.007, seam));
  }

  const shaftH = (capital ? 0.95 : 0.62) + lv * 0.06;
  g.add(hexHull(0.13 * s, 0.045 * s, shaftH, hull, 0, 0.1 + shaftH / 2, 0));
  g.add(seamLine(0.05 * s, 0.14, 0.04 * s, 0.02 * s, 0.1 + shaftH, 0.018 * s, 0.008, seam));
  g.add(seamLine(-0.05 * s, 0.14, -0.03 * s, -0.02 * s, 0.1 + shaftH, -0.015 * s, 0.008, seam));
  const floors = capital ? 6 : 4;
  for (let i = 0; i < floors; i++) {
    const y = 0.2 + (i / floors) * (shaftH - 0.12);
    const w = 0.14 * s * (1 - i * 0.08);
    g.add(roundBox(w * 0.85, 0.028, 0.012, 0.003, visor, 0, y, w * 0.55));
    g.add(roundBox(w * 0.85, 0.028, 0.012, 0.003, visor, 0, y, -w * 0.55));
  }
  const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.055 * s, 0), visor);
  tip.position.set(0, 0.14 + shaftH, 0);
  g.add(tip);

  const corners = [[0.28, 0.24], [-0.26, 0.22], [0.24, -0.24], [-0.24, -0.22]] as const;
  const n = capital ? 4 : 2;
  for (let i = 0; i < n; i++) {
    const [x, z] = corners[i];
    const h = (0.34 + (i % 2) * 0.12) * s;
    g.add(hexHull(0.05 * s, 0.032 * s, h, dark, x * s, 0.1 + h / 2, z * s));
    g.add(seamLine(x * s, 0.1, z * s, x * s, 0.1 + h, z * s, 0.006, seam));
    g.add(roundBox(0.04 * s, 0.02 * s, 0.01, 0.002, visor, x * s, 0.1 + h * 0.55, z * s + 0.035 * s));
    const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.022 * s, 0), visor);
    cap.position.set(x * s, 0.12 + h, z * s);
    g.add(cap);
  }

  const light = new THREE.PointLight(accent, capital ? 0.85 : 0.45, capital ? 2.4 : 1.6, 2);
  light.position.set(0, 0.55 * s, 0);
  g.add(light);
  void color;
  return g;
}

export function buildBeacon(color: string, level: number): THREE.Group {
  const g = new THREE.Group();
  const h = 0.85 + Math.min(5, Math.max(1, level)) * 0.24;
  g.add(hexPlate(0.16, 0.08, armor("#5ef6e8", false), 0, 0.05, 0));
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.09, h, 8), glow(color, 1.8));
  beam.position.y = h / 2 + 0.08;
  g.add(beam);
  const capMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), glow(color, 2));
  capMesh.position.y = h + 0.08;
  g.add(capMesh);
  return g;
}

export function buildForest(color: string): THREE.Group {
  const g = new THREE.Group();
  const leaf = ice(color, color, 0.35);
  const trunk = metal("#16100c", 0.2, 0.65);
  for (const [x, z, s] of [[-0.16, 0.1, 1], [0.15, -0.12, 0.78], [0.02, 0.16, 0.6]] as const) {
    g.add(taper(0.03 * s, 0.022 * s, 0.18 * s, trunk, x, 0.1 * s, z));
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.13 * s, 0), leaf);
    shard.scale.set(0.55, 1.6, 0.55);
    shard.position.set(x, 0.3 * s, z);
    g.add(shard);
  }
  return g;
}
