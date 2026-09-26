import * as THREE from "three";
import type { FactionId, UnitType } from "../../engine/types";
import { factionAccent, glow, ice, iceTint, metal } from "./palette";

const RIM = new THREE.LineBasicMaterial({ color: "#e8f0f8" });

function lit(color: string): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color });
}

function box(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cap(r: number, len: number, mat: THREE.Material, x: number, y: number, z: number, rx = 0, rz = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 3, 7), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, 0, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function ball(r: number, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 5), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

function facet(r: number, mat: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function octa(r: number, mat: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(r, 0), mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

function rim(mesh: THREE.Mesh): void {
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 22), RIM));
}

function crystal(mat: THREE.Material, x: number, y: number, z: number, h: number, s = 0.16, rx = 0, rz = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(s, 0), mat);
  m.scale.set(0.55, h / (s * 2), 0.55);
  m.position.set(x, y, z);
  m.rotation.set(rx, 0, rz);
  m.castShadow = true;
  return m;
}

function mats(faction: FactionId, color: string) {
  const accent = factionAccent(faction);
  const tint = iceTint(faction);
  return {
    accent,
    hull: lit("#2e343c"),
    dark: lit("#14181c"),
    plate: lit(color),
    visor: lit(accent),
    ice: ice(tint, accent, 0.4),
    core: lit(accent),
    shard: lit(tint),
    glow: glow(accent, 1.7),
    rim: lit("#e8f0f8"),
  };
}

type M = ReturnType<typeof mats>;

function shadow(g: THREE.Group, r = 0.22): void {
  const s = new THREE.Mesh(
    new THREE.CircleGeometry(r, 16),
    new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.5 }),
  );
  s.rotation.x = -Math.PI / 2;
  s.position.y = 0.01;
  g.add(s);
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

export function buildMech(type: UnitType, faction: FactionId, color: string): THREE.Group {
  const g = new THREE.Group();
  const m = mats(faction, color);
  if (type === "skiff" || type === "hoverScout" || type === "hullRam" || type === "depthBomber" || type === "leviathan" || type === "ghostSkiff") {
    naval(g, type, m);
    return g;
  }
  shadow(g, type === "titan" ? 0.3 : 0.22);
  if (type === "trooper") quadruped(g, m, 0.9);
  else if (type === "skimmer") hoverDisc(g, m);
  else if (type === "marksman") gunbed(g, m, 0.42);
  else if (type === "railgun") gunbed(g, m, 0.62);
  else if (type === "bulwark") squatTank(g, m);
  else if (type === "vanguard") beetle(g, m);
  else if (type === "lancer") wedge(g, m);
  else if (type === "netrunner") spider(g, m);
  else if (type === "titan") hulk(g, m);
  else if (type === "phantom") wraith(g, m);
  else if (type === "blade") scorpion(g, m);
  else quadruped(g, m, 1);
  return g;
}

function beastLeg(g: THREE.Group, m: M, x: number, z: number, s: number, side: number, thick = 1): void {
  const t = s * thick;
  g.add(ball(0.032 * t, m.hull, x, 0.24 * s, z));
  const thigh = cap(0.026 * t, 0.11 * s, m.dark, x + side * 0.07 * s, 0.16 * s, z + 0.02, 0.75, side * 0.5);
  rim(thigh);
  g.add(thigh);
  g.add(ball(0.022 * t, m.rim, x + side * 0.11 * s, 0.09 * s, z + 0.04));
  g.add(cap(0.02 * t, 0.09 * s, m.dark, x + side * 0.12 * s, 0.045 * s, z + 0.055, 0.2, 0));
  g.add(ball(0.024 * t, m.hull, x + side * 0.12 * s, 0.016, z + 0.07));
}

function pincer(g: THREE.Group, m: M, x: number, y: number, z: number, s: number, side: number, reach = 1): void {
  g.add(ball(0.028 * s, m.hull, x, y, z));
  const upper = cap(0.022 * s, 0.1 * s * reach, m.dark, x + side * 0.08 * reach, y - 0.01 * s, z + 0.04 * reach, 0.95, side * 0.55);
  rim(upper);
  g.add(upper);
  g.add(ball(0.02 * s, m.rim, x + side * 0.14 * reach, y - 0.04 * s, z + 0.08 * reach));
  g.add(cap(0.016 * s, 0.07 * s * reach, m.hull, x + side * 0.17 * reach, y - 0.05 * s, z + 0.12 * reach, 1.05, side * 0.2));
}

function eyes(g: THREE.Group, m: M, x: number, y: number, z: number, s: number): void {
  g.add(box(0.08 * s, 0.028 * s, 0.03 * s, m.visor, x, y, z));
  g.add(box(0.04 * s, 0.012 * s, 0.014 * s, m.rim, x, y, z + 0.02 * s));
}

function quadruped(g: THREE.Group, m: M, scale: number): void {
  const s = scale;
  const body = cap(0.055 * s, 0.14 * s, m.hull, 0, 0.28 * s, 0.01, Math.PI / 2, 0);
  rim(body);
  g.add(body);
  g.add(ball(0.05 * s, m.dark, 0, 0.3 * s, 0.12 * s));
  eyes(g, m, 0, 0.3 * s, 0.17 * s, s);
  for (const [sx, sz] of [[-1, 0.08], [1, 0.08], [-1, -0.07], [1, -0.07]] as const) {
    beastLeg(g, m, sx * 0.07 * s, sz * s, s, sx);
  }
  g.add(octa(0.03 * s, m.core, 0, 0.36 * s, -0.04 * s, 0.7, 1.1, 0.7));
}

function hoverDisc(g: THREE.Group, m: M): void {
  const body = cap(0.05, 0.12, m.hull, 0, 0.26, 0.02, Math.PI / 2, 0);
  rim(body);
  g.add(body);
  g.add(ball(0.045, m.dark, 0, 0.3, 0.12));
  eyes(g, m, 0, 0.3, 0.16, 1);
  for (const sx of [-1, 1] as const) {
    beastLeg(g, m, sx * 0.06, -0.06, 1.05, sx, 0.9);
    pincer(g, m, sx * 0.07, 0.28, 0.06, 1, sx, 1.05);
  }
}

function gunbed(g: THREE.Group, m: M, barrel: number): void {
  const torso = cap(0.048, 0.16, m.hull, 0, 0.34, 0);
  rim(torso);
  g.add(torso);
  g.add(ball(0.048, m.dark, 0, 0.46, 0.02));
  eyes(g, m, 0, 0.46, 0.06, 1);
  const gun = cap(0.02, barrel, m.dark, 0.06, 0.36, 0.08 + barrel * 0.2, 1.15, 0);
  rim(gun);
  g.add(gun);
  g.add(box(0.03, 0.025, 0.03, m.visor, 0.06, 0.36, 0.12 + barrel * 0.42));
  for (const sx of [-1, 1] as const) {
    beastLeg(g, m, sx * 0.045, 0.02, 1.15, sx, 0.85);
    if (sx < 0) pincer(g, m, sx * 0.07, 0.36, 0.02, 0.95, sx, 0.85);
  }
}

function squatTank(g: THREE.Group, m: M): void {
  const torso = cap(0.07, 0.12, m.hull, 0, 0.3, 0);
  rim(torso);
  g.add(torso);
  g.add(ball(0.055, m.dark, 0, 0.4, 0.04));
  eyes(g, m, 0, 0.4, 0.09, 1.1);
  for (const sx of [-1, 1] as const) {
    beastLeg(g, m, sx * 0.06, 0.02, 1.1, sx, 1.15);
    pincer(g, m, sx * 0.08, 0.32, 0.04, 1.1, sx, 0.9);
  }
  const shield = cap(0.03, 0.14, m.plate, 0.12, 0.3, 0.04, 0, 0.9);
  rim(shield);
  g.add(shield);
}

function beetle(g: THREE.Group, m: M): void {
  const body = cap(0.06, 0.16, m.hull, 0, 0.22, 0.01, Math.PI / 2, 0.15);
  rim(body);
  g.add(body);
  g.add(ball(0.04, m.dark, 0, 0.22, 0.14));
  eyes(g, m, 0, 0.22, 0.18, 0.9);
  g.add(octa(0.035, m.core, 0, 0.3, -0.02, 0.7, 1.2, 0.7));
  for (const [sx, sz] of [[-1, 0.08], [1, 0.08], [-1, 0], [1, 0], [-1, -0.08], [1, -0.08]] as const) {
    beastLeg(g, m, sx * 0.06, sz, 0.85, sx, 0.8);
  }
}

function wedge(g: THREE.Group, m: M): void {
  const body = cap(0.05, 0.16, m.hull, 0, 0.26, 0.02, Math.PI / 2, 0);
  rim(body);
  g.add(body);
  g.add(ball(0.042, m.dark, 0, 0.28, 0.14));
  eyes(g, m, 0, 0.28, 0.18, 0.95);
  const horn = cap(0.016, 0.2, m.plate, 0, 0.28, 0.24, 1.15, 0);
  rim(horn);
  g.add(horn);
  for (const sx of [-1, 1] as const) {
    beastLeg(g, m, sx * 0.055, -0.05, 1, sx);
    beastLeg(g, m, sx * 0.055, 0.07, 0.95, sx, 0.9);
  }
}

function spider(g: THREE.Group, m: M): void {
  g.add(ball(0.07, m.hull, 0, 0.22, 0));
  g.add(ball(0.045, m.dark, 0, 0.24, 0.08));
  eyes(g, m, 0, 0.24, 0.12, 0.85);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.25;
    const x = Math.cos(a) * 0.07;
    const z = Math.sin(a) * 0.07;
    g.add(ball(0.02, m.hull, x, 0.2, z));
    const thigh = cap(0.016, 0.12, m.dark, x * 1.7, 0.13, z * 1.7, 0.85, Math.cos(a) * 0.5);
    rim(thigh);
    g.add(thigh);
    g.add(ball(0.016, m.rim, x * 2.2, 0.06, z * 2.2));
    g.add(ball(0.018, m.hull, x * 2.4, 0.016, z * 2.4));
  }
}

function hulk(g: THREE.Group, m: M): void {
  const torso = cap(0.08, 0.18, m.hull, 0, 0.4, 0);
  rim(torso);
  g.add(torso);
  g.add(ball(0.065, m.dark, 0, 0.54, 0.03));
  eyes(g, m, 0, 0.54, 0.08, 1.2);
  g.add(octa(0.04, m.core, 0, 0.48, -0.04, 0.7, 1.1, 0.7));
  for (const sx of [-1, 1] as const) {
    beastLeg(g, m, sx * 0.07, 0.02, 1.35, sx, 1.2);
    pincer(g, m, sx * 0.1, 0.42, 0.04, 1.25, sx, 1.15);
  }
}

function wraith(g: THREE.Group, m: M): void {
  const torso = cap(0.04, 0.18, m.hull, 0, 0.32, 0);
  rim(torso);
  g.add(torso);
  g.add(ball(0.04, m.dark, 0, 0.44, 0.02));
  eyes(g, m, 0, 0.44, 0.06, 0.9);
  for (const sx of [-1, 1] as const) {
    const wing = cap(0.018, 0.16, m.dark, sx * 0.1, 0.3, -0.04, 0.9, sx * 0.6);
    rim(wing);
    g.add(wing);
    beastLeg(g, m, sx * 0.04, 0.02, 1.05, sx, 0.75);
  }
  fade(g, 0.6);
}

function scorpion(g: THREE.Group, m: M): void {
  const body = cap(0.045, 0.14, m.hull, 0, 0.22, 0.01, Math.PI / 2, 0);
  rim(body);
  g.add(body);
  g.add(ball(0.04, m.dark, 0, 0.24, 0.12));
  eyes(g, m, 0, 0.24, 0.16, 0.9);
  for (const sx of [-1, 1] as const) {
    pincer(g, m, sx * 0.06, 0.24, 0.08, 1, sx, 1.1);
    beastLeg(g, m, sx * 0.05, 0.04, 0.9, sx, 0.85);
    beastLeg(g, m, sx * 0.05, -0.06, 0.9, sx, 0.85);
  }
  const tail = cap(0.018, 0.16, m.dark, 0, 0.34, -0.1, -0.95, 0);
  rim(tail);
  g.add(tail);
  g.add(octa(0.03, m.core, 0, 0.44, -0.16, 0.7, 1.1, 0.7));
}

function naval(g: THREE.Group, type: UnitType, m: M): void {
  const L = type === "leviathan" ? 0.78 : type === "depthBomber" ? 0.58 : 0.5;
  const hull = facet(0.15, m.hull, 0, 0.09, 0, L * 2.2, 0.38, 0.95);
  rim(hull);
  g.add(hull);
  g.add(facet(0.08, m.plate, 0, 0.16, 0, L * 1.3, 0.32, 0.7));
  g.add(box(0.08, 0.04, 0.06, m.visor, L * 0.2, 0.18, 0.08));
  shadow(g, 0.24);
  if (type === "hoverScout") {
    g.add(cap(0.018, 0.14, m.plate, 0, 0.28, 0));
    g.add(box(0.05, 0.025, 0.05, m.visor, 0, 0.38, 0));
  }
  if (type === "hullRam") g.add(facet(0.07, m.dark, L * 0.28, 0.09, 0, 1.2, 0.65, 0.8));
  if (type === "depthBomber") g.add(facet(0.08, m.dark, -0.08, 0.22, 0, 1, 0.8, 1));
  if (type === "leviathan") {
    g.add(facet(0.11, m.ice, 0, 0.26, 0, 1.1, 0.75, 0.85));
    g.add(crystal(m.core, 0, 0.4, 0, 0.22, 0.09));
  }
  if (type === "ghostSkiff") fade(g, 0.5);
}

export function buildHero(faction: FactionId, color: string): THREE.Group {
  const g = new THREE.Group();
  const m = mats(faction, color);
  const shell = ice(iceTint(faction), factionAccent(faction), 0.62);
  shell.color.offsetHSL(0, 0.05, 0.12);

  for (const sx of [-1, 1] as const) {
    g.add(cap(0.2, 0.85, shell, sx * 0.32, 0.62, 0.04, 0.05, sx * 0.04));
    g.add(box(0.5, 0.18, 0.48, m.dark, sx * 0.32, 0.08, 0.08));
    g.add(crystal(shell, sx * 0.34, 1.28, 0.02, 0.32, 0.13, 0, sx * 0.12));
  }

  const torso = new THREE.Mesh(new THREE.IcosahedronGeometry(0.78, 0), shell);
  torso.scale.set(0.92, 1.18, 0.62);
  torso.position.set(0, 1.95, 0);
  torso.castShadow = true;
  g.add(torso);
  g.add(box(0.88, 0.22, 0.55, shell, 0, 1.22, 0.02));
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), m.core);
  core.position.set(0, 1.95, 0.38);
  g.add(core);

  for (const sx of [-1, 1] as const) {
    g.add(cap(0.18, 0.95, shell, sx * 0.95, 1.7, 0, 0, sx * -0.22));
    g.add(box(0.5, 0.38, 0.5, m.dark, sx * 1.16, 0.92, 0.1));
    const pad = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 0), shell);
    pad.scale.set(1.1, 0.7, 0.85);
    pad.position.set(sx * 0.82, 2.58, 0.04);
    pad.castShadow = true;
    g.add(pad);
    g.add(crystal(shell, sx * 0.92, 3.05, -0.02, 0.7, 0.18, 0, sx * -0.38));
    g.add(crystal(shell, sx * 1.1, 2.82, 0.12, 0.42, 0.13, 0, sx * -0.6));
  }

  const helm = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 0), shell);
  helm.scale.set(0.95, 0.85, 0.8);
  helm.position.set(0, 3.05, 0.08);
  helm.castShadow = true;
  g.add(helm);
  g.add(box(0.46, 0.08, 0.08, m.visor, 0, 3.04, 0.34));
  g.add(crystal(shell, 0.16, 3.62, -0.02, 0.82, 0.2, 0, 0.2));
  g.add(crystal(shell, -0.2, 3.42, -0.1, 0.52, 0.15, 0, -0.42));
  return g;
}

function glassTower(
  g: THREE.Group,
  m: M,
  x: number,
  z: number,
  floors: number,
  w: number,
  fh: number,
): number {
  const glass = lit("#0a0e12");
  const trim = lit("#12161c");
  let y = 0.12;
  for (let i = 0; i < floors; i++) {
    const tw = w * (1 - i * 0.03);
    g.add(box(tw, fh, tw, glass, x, y + fh / 2, z));
    const band = fh * 0.28;
    const wy = y + fh * 0.52;
    g.add(box(tw * 0.62, band, 0.028, m.visor, x, wy, z + tw * 0.5));
    g.add(box(tw * 0.62, band, 0.028, m.visor, x, wy, z - tw * 0.5));
    g.add(box(0.028, band, tw * 0.62, m.visor, x + tw * 0.5, wy, z));
    g.add(box(0.028, band, tw * 0.62, m.visor, x - tw * 0.5, wy, z));
    g.add(box(tw * 1.02, 0.018, tw * 1.02, trim, x, y + fh - 0.006, z));
    y += fh + 0.01;
  }
  g.add(octa(w * 0.18, m.core, x, y + 0.03, z, 0.7, 1.15, 0.7));
  return y;
}

export function buildSpire(faction: FactionId, color: string, capital: boolean, level = 1): THREE.Group {
  const g = new THREE.Group();
  const m = mats(faction, color);
  const lv = Math.max(1, Math.min(8, level));

  g.add(box(0.5, 0.045, 0.5, lit("#12161c"), 0, 0.022, 0));
  g.add(box(0.34, 0.035, 0.34, m.dark, 0, 0.055, 0));

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.014, 8, 20), m.visor);
  halo.rotation.x = Math.PI / 2;
  halo.position.set(0, 0.09, 0);
  g.add(halo);

  const mainFloors = (capital ? 4 : 3) + Math.min(3, lv);
  const midFloors = Math.max(2, mainFloors - 2);
  const lowFloors = Math.max(2, mainFloors - 3);
  const fh = capital ? 0.2 : 0.175;

  const mainH = glassTower(g, m, 0.03, -0.02, mainFloors, capital ? 0.26 : 0.2, fh);
  glassTower(g, m, 0.32, -0.24, midFloors, capital ? 0.14 : 0.11, fh * 0.9);
  glassTower(g, m, -0.28, 0.22, lowFloors, capital ? 0.13 : 0.1, fh * 0.88);
  if (capital) {
    glassTower(g, m, 0.3, 0.26, Math.max(2, lowFloors - 1), 0.1, fh * 0.82);
    glassTower(g, m, -0.26, -0.22, 2, 0.09, fh * 0.8);
  }

  g.add(crystal(m.core, 0.03, mainH + 0.1, -0.02, 0.16, 0.05));
  const light = new THREE.PointLight(m.accent, capital ? 0.9 : 0.5, capital ? 2.8 : 1.8, 2);
  light.position.set(0, mainH * 0.5, -0.02);
  g.add(light);
  return g;
}

export function buildBeacon(color: string, level: number): THREE.Group {
  const g = new THREE.Group();
  const h = 0.85 + Math.min(5, Math.max(1, level)) * 0.24;
  g.add(box(0.24, 0.08, 0.24, metal("#e8eef4"), 0, 0.05, 0));
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.09, h, 8), glow(color, 1.8));
  beam.position.y = h / 2 + 0.08;
  g.add(beam);
  const capMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), glow(color, 2));
  capMesh.position.y = h + 0.08;
  g.add(capMesh);
  const light = new THREE.PointLight(color, 1.2, 3.4, 2);
  light.position.y = h;
  g.add(light);
  return g;
}

export function buildForest(color: string): THREE.Group {
  const g = new THREE.Group();
  const leaf = ice(color, color, 0.35);
  const trunk = metal("#16100c", 0.2, 0.65);
  for (const [x, z, s] of [[-0.16, 0.1, 1], [0.15, -0.12, 0.78], [0.02, 0.16, 0.6]] as const) {
    g.add(box(0.05 * s, 0.16 * s, 0.05 * s, trunk, x, 0.08 * s, z));
    g.add(crystal(leaf, x, 0.3 * s, z, 0.42 * s, 0.13 * s));
  }
  return g;
}
