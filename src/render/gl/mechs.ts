import * as THREE from "three";
import type { FactionId, UnitType } from "../../engine/types";
import { factionAccent, glow, ice, iceTint, metal } from "./palette";
import { armorMat, hexPlate, plate, seamLine, seamLoop, seamMat, taper, visorMat } from "./kit";

type Kit = {
  hull: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  accent: string;
  seam: THREE.MeshBasicMaterial;
  visor: THREE.MeshBasicMaterial;
};

function kit(faction: FactionId): Kit {
  const accent = factionAccent(faction);
  return {
    hull: armorMat("#2c323a"),
    dark: armorMat("#1a1e24"),
    accent,
    seam: seamMat(accent),
    visor: visorMat(accent),
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

function gun(g: THREE.Group, k: Kit, x: number, y: number, z: number, len: number): void {
  const body = plate(len, 0.045, 0.04, k.dark, x + len * 0.28, y, z, 0, Math.PI / 2, 0);
  g.add(body);
  g.add(plate(0.05, 0.04, 0.03, k.hull, x + len * 0.08, y, z, 0, Math.PI / 2, 0));
  g.add(seamLine(x, y + 0.012, z, x + len * 0.55, y + 0.012, z, 0.006, k.seam));
  g.add(plate(0.03, 0.03, 0.02, k.visor, x + len * 0.52, y, z, 0, Math.PI / 2, 0));
}

function fist(g: THREE.Group, k: Kit, x: number, y: number, z: number): void {
  g.add(plate(0.055, 0.05, 0.045, k.dark, x, y, z));
}

function limbSeg(g: THREE.Group, k: Kit, x: number, y: number, z: number, w: number, h: number, seamed: boolean): void {
  g.add(plate(w, h, w * 0.7, k.hull, x, y, z));
  if (seamed) g.add(seamLoop(w * 0.9, h * 0.9, 0.006, k.seam, x, y, z + w * 0.38));
}

/** Warrior: charcoal biped, cyan seams, gun+fist, recessed visor. */
function warrior(g: THREE.Group, k: Kit, pose: "trooper" | "marksman" | "railgun" | "bulwark" | "titan"): void {
  const s = pose === "titan" ? 1.25 : pose === "bulwark" ? 1.12 : 1;
  const tall = pose === "marksman" || pose === "railgun" ? 1.12 : 1;
  const gunLen = pose === "railgun" ? 0.32 : pose === "marksman" ? 0.26 : 0.2;

  g.add(plate(0.2 * s, 0.16 * s, 0.12 * s, k.hull, 0, 0.4 * tall, 0.01));
  g.add(seamLoop(0.18 * s, 0.14 * s, 0.007, k.seam, 0, 0.4 * tall, 0.07 * s));
  g.add(seamLine(-0.02, 0.32 * tall, 0.07 * s, -0.02, 0.48 * tall, 0.07 * s, 0.006, k.seam));
  g.add(plate(0.14 * s, 0.1 * s, 0.05 * s, k.dark, 0, 0.4 * tall, 0.07 * s));

  g.add(plate(0.1 * s, 0.08 * s, 0.08 * s, k.dark, 0, 0.54 * tall, 0.02));
  g.add(plate(0.07 * s, 0.03 * s, 0.02 * s, k.visor, 0, 0.54 * tall, 0.07 * s));
  g.add(seamLine(-0.03 * s, 0.54 * tall, 0.075 * s, 0.03 * s, 0.54 * tall, 0.075 * s, 0.005, k.seam));

  for (const sx of [-1, 1] as const) {
    g.add(plate(0.1 * s, 0.07 * s, 0.08 * s, k.hull, sx * 0.14 * s, 0.48 * tall, 0.01));
    g.add(seamLoop(0.08 * s, 0.055 * s, 0.006, k.seam, sx * 0.14 * s, 0.48 * tall, 0.05 * s));
    limbSeg(g, k, sx * 0.18 * s, 0.36 * tall, 0.02, 0.055 * s, 0.1 * s, true);
    if (sx < 0) {
      limbSeg(g, k, sx * 0.2 * s, 0.26 * tall, 0.04, 0.05 * s, 0.09 * s, false);
      fist(g, k, sx * 0.22 * s, 0.2 * tall, 0.06);
    } else {
      limbSeg(g, k, sx * 0.18 * s, 0.34 * tall, 0.06, 0.05 * s, 0.08 * s, false);
      gun(g, k, sx * 0.16 * s, 0.34 * tall, 0.1, gunLen * s);
    }
    limbSeg(g, k, sx * 0.07 * s, 0.22 * tall, 0.01, 0.07 * s, 0.12 * s, true);
    limbSeg(g, k, sx * 0.07 * s, 0.1 * tall, 0.02, 0.065 * s, 0.11 * s, false);
    g.add(plate(0.08 * s, 0.04 * s, 0.1 * s, k.dark, sx * 0.07 * s, 0.03, 0.04));
  }
}

function leaper(g: THREE.Group, k: Kit): void {
  g.add(plate(0.22, 0.1, 0.12, k.hull, 0, 0.28, 0.02, Math.PI / 2, 0, 0));
  g.add(seamLoop(0.18, 0.09, 0.006, k.seam, 0, 0.28, 0.08, Math.PI / 2));
  g.add(plate(0.09, 0.07, 0.07, k.dark, 0, 0.32, 0.12));
  g.add(plate(0.06, 0.025, 0.02, k.visor, 0, 0.32, 0.16));
  for (const sx of [-1, 1] as const) {
    limbSeg(g, k, sx * 0.1, 0.18, -0.04, 0.05, 0.12, true);
    g.add(plate(0.06, 0.035, 0.08, k.dark, sx * 0.12, 0.05, 0.02));
    limbSeg(g, k, sx * 0.12, 0.26, 0.1, 0.045, 0.1, true);
    fist(g, k, sx * 0.14, 0.22, 0.16);
  }
}

function beetle(g: THREE.Group, k: Kit): void {
  g.add(plate(0.2, 0.16, 0.1, k.hull, 0, 0.22, 0.02, 0.4, 0, 0));
  g.add(seamLoop(0.16, 0.12, 0.006, k.seam, 0, 0.26, 0.08, 0.4));
  g.add(plate(0.08, 0.06, 0.06, k.dark, 0, 0.22, 0.14));
  g.add(plate(0.055, 0.02, 0.018, k.visor, 0, 0.22, 0.18));
  for (const [sx, sz] of [[-1, 0.08], [1, 0.08], [-1, -0.06], [1, -0.06], [-1, 0.01], [1, 0.01]] as const) {
    limbSeg(g, k, sx * 0.1, 0.1, sz, 0.04, 0.08, false);
    g.add(plate(0.045, 0.025, 0.05, k.dark, sx * 0.12, 0.03, sz + 0.03));
  }
}

function spider(g: THREE.Group, k: Kit): void {
  g.add(plate(0.12, 0.1, 0.1, k.hull, 0, 0.24, 0));
  g.add(seamLoop(0.1, 0.08, 0.006, k.seam, 0, 0.24, 0.06));
  g.add(plate(0.05, 0.02, 0.016, k.visor, 0, 0.24, 0.08));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.2;
    const x = Math.cos(a) * 0.08;
    const z = Math.sin(a) * 0.08;
    g.add(taper(0.016, 0.012, 0.16, k.dark, x * 1.6, 0.14, z * 1.6, 0.9, Math.cos(a) * 0.45));
    g.add(seamLine(x, 0.22, z, x * 2.1, 0.08, z * 2.1, 0.004, k.seam));
    g.add(plate(0.04, 0.02, 0.04, k.hull, x * 2.2, 0.025, z * 2.2));
  }
}

function horned(g: THREE.Group, k: Kit): void {
  g.add(plate(0.18, 0.1, 0.11, k.hull, 0, 0.28, 0.02, Math.PI / 2, 0, 0));
  g.add(seamLoop(0.15, 0.08, 0.006, k.seam, 0, 0.28, 0.08, Math.PI / 2));
  g.add(plate(0.08, 0.06, 0.06, k.dark, 0, 0.3, 0.12));
  g.add(plate(0.05, 0.02, 0.016, k.visor, 0, 0.3, 0.16));
  g.add(taper(0.018, 0.008, 0.18, k.hull, 0, 0.3, 0.22, 1.15, 0));
  g.add(seamLine(0, 0.31, 0.14, 0, 0.31, 0.3, 0.005, k.seam));
  for (const sx of [-1, 1] as const) {
    limbSeg(g, k, sx * 0.08, 0.16, -0.04, 0.05, 0.1, true);
    limbSeg(g, k, sx * 0.08, 0.16, 0.08, 0.045, 0.09, false);
    g.add(plate(0.06, 0.03, 0.07, k.dark, sx * 0.09, 0.04, 0.02));
  }
}

function scorpion(g: THREE.Group, k: Kit): void {
  g.add(plate(0.16, 0.09, 0.1, k.hull, 0, 0.22, 0.02, Math.PI / 2, 0, 0));
  g.add(seamLoop(0.13, 0.07, 0.006, k.seam, 0, 0.22, 0.07, Math.PI / 2));
  g.add(plate(0.045, 0.018, 0.014, k.visor, 0, 0.24, 0.14));
  for (const sx of [-1, 1] as const) {
    limbSeg(g, k, sx * 0.1, 0.22, 0.1, 0.04, 0.1, true);
    g.add(plate(0.03, 0.08, 0.03, k.dark, sx * 0.16, 0.22, 0.16, 0, 0, sx * 0.5));
    limbSeg(g, k, sx * 0.07, 0.12, 0.04, 0.04, 0.08, false);
    limbSeg(g, k, sx * 0.07, 0.12, -0.05, 0.04, 0.08, false);
  }
  g.add(taper(0.016, 0.01, 0.16, k.dark, 0, 0.34, -0.1, -0.95, 0));
  g.add(seamLine(0, 0.24, -0.04, 0, 0.42, -0.16, 0.005, k.seam));
}

function wraith(g: THREE.Group, k: Kit): void {
  g.add(plate(0.12, 0.18, 0.07, k.hull, 0, 0.34, 0));
  g.add(seamLoop(0.1, 0.15, 0.005, k.seam, 0, 0.34, 0.04));
  g.add(plate(0.05, 0.02, 0.014, k.visor, 0, 0.42, 0.05));
  for (const sx of [-1, 1] as const) {
    limbSeg(g, k, sx * 0.1, 0.32, -0.04, 0.04, 0.14, true);
    limbSeg(g, k, sx * 0.05, 0.14, 0.01, 0.04, 0.1, false);
  }
  fade(g, 0.62);
}

function naval(g: THREE.Group, type: UnitType, k: Kit): void {
  const L = type === "leviathan" ? 0.42 : type === "depthBomber" ? 0.32 : 0.26;
  g.add(plate(L * 2.2, 0.1, 0.12, k.hull, 0, 0.1, 0, Math.PI / 2, 0, 0));
  g.add(seamLoop(L * 1.8, 0.08, 0.006, k.seam, 0, 0.12, 0.06, Math.PI / 2));
  g.add(plate(0.08, 0.04, 0.05, k.visor, L * 0.35, 0.16, 0.04));
  shadow(g, 0.22);
  if (type === "hoverScout") g.add(taper(0.02, 0.012, 0.12, k.hull, 0, 0.22, 0));
  if (type === "hullRam") g.add(plate(0.1, 0.08, 0.08, k.dark, L * 0.4, 0.1, 0));
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
  const dark = armorMat("#1a1e24");
  const visor = visorMat(accent);

  for (const sx of [-1, 1] as const) {
    g.add(taper(0.2, 0.2, 0.85, shell, sx * 0.32, 0.62, 0.04, 0.05, sx * 0.04));
    g.add(plate(0.5, 0.18, 0.48, dark, sx * 0.32, 0.08, 0.08));
  }
  const torso = new THREE.Mesh(new THREE.IcosahedronGeometry(0.78, 0), shell);
  torso.scale.set(0.92, 1.18, 0.62);
  torso.position.set(0, 1.95, 0);
  torso.castShadow = true;
  g.add(torso);
  g.add(plate(0.88, 0.22, 0.55, shell, 0, 1.22, 0.02));
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), visor);
  core.position.set(0, 1.95, 0.38);
  g.add(core);
  for (const sx of [-1, 1] as const) {
    g.add(taper(0.18, 0.18, 0.95, shell, sx * 0.95, 1.7, 0, 0, sx * -0.22));
    g.add(plate(0.5, 0.38, 0.5, dark, sx * 1.16, 0.92, 0.1));
  }
  const helm = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 0), shell);
  helm.scale.set(0.95, 0.85, 0.8);
  helm.position.set(0, 3.05, 0.08);
  g.add(helm);
  g.add(plate(0.46, 0.08, 0.08, visor, 0, 3.04, 0.34));
  return g;
}

export function buildSpire(_faction: FactionId, color: string, capital: boolean, level = 1): THREE.Group {
  const g = new THREE.Group();
  const accent = factionAccent(_faction);
  const hull = armorMat("#1c222a");
  const dark = armorMat("#101418");
  const seam = seamMat(accent);
  const visor = visorMat(accent);
  const lv = Math.max(1, Math.min(8, level));
  const s = capital ? 1 : 0.78;

  g.add(hexPlate(0.42 * s, 0.05, hull, 0, 0.03, 0));
  g.add(hexPlate(0.3 * s, 0.03, dark, 0, 0.06, 0));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x0 = Math.cos(a) * 0.16 * s;
    const z0 = Math.sin(a) * 0.16 * s;
    const x1 = Math.cos(a) * 0.36 * s;
    const z1 = Math.sin(a) * 0.36 * s;
    g.add(seamLine(x0, 0.07, z0, x1, 0.07, z1, 0.006, seam));
  }

  const floors = (capital ? 5 : 3) + Math.min(2, lv);
  const main = taper(0.11 * s, 0.045 * s, 0.22 * floors, hull, 0, 0.12 + (0.22 * floors) / 2, 0);
  g.add(main);
  g.add(seamLine(0.04 * s, 0.14, 0.04 * s, 0.02 * s, 0.14 + 0.22 * floors, 0.02 * s, 0.007, seam));
  g.add(seamLine(-0.04 * s, 0.14, -0.03 * s, -0.018 * s, 0.14 + 0.22 * floors, -0.015 * s, 0.007, seam));
  for (let i = 0; i < floors; i++) {
    const y = 0.18 + i * 0.2;
    const w = 0.16 * s * (1 - i * 0.06);
    g.add(plate(w * 0.7, 0.03, 0.012, visor, 0, y, w * 0.42));
    g.add(plate(w * 0.7, 0.03, 0.012, visor, 0, y, -w * 0.42));
  }
  const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.045 * s, 0), visor);
  tip.position.set(0, 0.16 + 0.22 * floors, 0);
  g.add(tip);

  const corners = [[0.26, 0.22], [-0.24, 0.2], [0.22, -0.22], [-0.22, -0.2]] as const;
  const n = capital ? 4 : 2;
  for (let i = 0; i < n; i++) {
    const [x, z] = corners[i];
    const h = (0.28 + (i % 2) * 0.1) * s;
    g.add(taper(0.045 * s, 0.028 * s, h, dark, x * s, 0.08 + h / 2, z * s));
    g.add(seamLine(x * s, 0.1, z * s, x * s, 0.08 + h, z * s, 0.005, seam));
    g.add(plate(0.04 * s, 0.02 * s, 0.01, visor, x * s, 0.08 + h * 0.55, z * s + 0.03 * s));
  }

  const light = new THREE.PointLight(accent, capital ? 0.9 : 0.5, capital ? 2.6 : 1.8, 2);
  light.position.set(0, 0.5 * s, 0);
  g.add(light);
  void color;
  return g;
}

export function buildBeacon(color: string, level: number): THREE.Group {
  const g = new THREE.Group();
  const h = 0.85 + Math.min(5, Math.max(1, level)) * 0.24;
  g.add(plate(0.24, 0.08, 0.24, metal("#e8eef4"), 0, 0.05, 0));
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
    g.add(plate(0.05 * s, 0.16 * s, 0.05 * s, trunk, x, 0.08 * s, z));
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.13 * s, 0), leaf);
    shard.scale.set(0.55, 1.6, 0.55);
    shard.position.set(x, 0.3 * s, z);
    g.add(shard);
  }
  return g;
}
