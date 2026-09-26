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
    hull: lit("#8a929c"),
    dark: lit("#3e444c"),
    plate: lit(color),
    visor: lit(accent),
    ice: ice(tint, accent, 0.4),
    core: lit(accent),
    shard: lit(tint),
    glow: glow(accent, 1.7),
    rim: lit("#e8eef6"),
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

function leg(g: THREE.Group, m: M, x: number, z: number, s: number, flare: number): void {
  g.add(ball(0.032 * s, m.hull, x, 0.14 * s, z));
  const thigh = cap(0.028 * s, 0.1 * s, m.dark, x + flare * 0.04, 0.09 * s, z, 0.45, flare * 0.35);
  rim(thigh);
  g.add(thigh);
  g.add(ball(0.026 * s, m.hull, x + flare * 0.07, 0.055 * s, z + 0.02));
  g.add(cap(0.024 * s, 0.08 * s, m.dark, x + flare * 0.08, 0.035 * s, z + 0.04, 0.2, 0));
  g.add(box(0.055 * s, 0.022 * s, 0.07 * s, m.hull, x + flare * 0.08, 0.018, z + 0.06));
}

function quadruped(g: THREE.Group, m: M, scale: number): void {
  const s = scale;
  const body = facet(0.13 * s, m.hull, 0, 0.18 * s, 0.02, 1.7, 0.75, 1.25);
  rim(body);
  g.add(body);
  const head = facet(0.07 * s, m.dark, 0, 0.22 * s, 0.14 * s, 1.05, 0.75, 0.95);
  rim(head);
  g.add(head);
  g.add(box(0.1 * s, 0.04 * s, 0.05 * s, m.visor, 0, 0.22 * s, 0.2 * s));
  g.add(box(0.06 * s, 0.016 * s, 0.02 * s, m.rim, 0, 0.22 * s, 0.23 * s));
  for (const [sx, sz] of [[-1, 0.1], [1, 0.1], [-1, -0.09], [1, -0.09]] as const) {
    leg(g, m, sx * 0.12 * s, sz * s, s, sx);
  }
  g.add(octa(0.045 * s, m.core, 0, 0.28 * s, -0.06, 0.8, 1.3, 0.7));
}

function arm(g: THREE.Group, m: M, x: number, y: number, z: number, s: number, flare: number, reach = 1): void {
  g.add(ball(0.034 * s, m.hull, x, y, z));
  const upper = cap(0.026 * s, 0.11 * s * reach, m.dark, x + flare * 0.07 * reach, y - 0.02 * s, z + 0.02, 0.85, flare * 0.55);
  rim(upper);
  g.add(upper);
  g.add(ball(0.028 * s, m.hull, x + flare * 0.13 * reach, y - 0.06 * s, z + 0.05 * reach));
  g.add(box(0.05 * s, 0.03 * s, 0.08 * s, m.plate, x + flare * 0.18 * reach, y - 0.08 * s, z + 0.1 * reach));
}

function hoverDisc(g: THREE.Group, m: M): void {
  const pad = facet(0.18, m.hull, 0, 0.1, 0, 1.45, 0.32, 1.15);
  rim(pad);
  g.add(pad);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 8, 20), m.visor);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  g.add(ring);
  const cabin = facet(0.09, m.dark, 0, 0.2, 0.03, 1.15, 0.75, 0.95);
  rim(cabin);
  g.add(cabin);
  g.add(box(0.09, 0.03, 0.05, m.visor, 0, 0.21, 0.14));
  g.add(box(0.05, 0.012, 0.02, m.rim, 0, 0.21, 0.17));
  for (const sx of [-1, 1] as const) {
    arm(g, m, sx * 0.14, 0.12, 0.04, 0.95, sx, 1.15);
  }
  g.add(cap(0.02, 0.1, m.dark, 0, 0.06, -0.16, 1.1, 0));
}

function gunbed(g: THREE.Group, m: M, barrel: number): void {
  const chassis = box(0.28, 0.1, 0.2, m.hull, 0, 0.12, 0);
  rim(chassis);
  g.add(chassis);
  const turret = box(0.16, 0.08, 0.14, m.dark, 0, 0.2, -0.02);
  rim(turret);
  g.add(turret);
  const gun = cap(0.028, barrel, m.dark, 0.02, 0.2, 0.1 + barrel * 0.25, 1.2, 0);
  rim(gun);
  g.add(gun);
  g.add(box(0.05, 0.035, 0.06, m.visor, 0.02, 0.2, 0.12 + barrel * 0.45));
  g.add(box(0.1, 0.03, 0.04, m.rim, 0, 0.22, 0.08));
  for (const sx of [-1, 1] as const) {
    g.add(box(0.08, 0.055, 0.16, m.hull, sx * 0.16, 0.055, 0.02));
    g.add(ball(0.03, m.dark, sx * 0.16, 0.03, 0.1));
    g.add(ball(0.03, m.dark, sx * 0.16, 0.03, -0.06));
  }
}

function squatTank(g: THREE.Group, m: M): void {
  const hull = facet(0.17, m.hull, 0, 0.16, 0, 1.45, 0.75, 1.2);
  rim(hull);
  g.add(hull);
  const shield = box(0.06, 0.2, 0.26, m.plate, 0.18, 0.18, 0.04);
  rim(shield);
  g.add(shield);
  g.add(box(0.035, 0.1, 0.12, m.visor, 0.22, 0.18, 0.04));
  g.add(box(0.02, 0.04, 0.08, m.rim, 0.24, 0.18, 0.04));
  for (const [sx, sz] of [[-1, 0.1], [1, 0.08], [-1, -0.09], [1, -0.1]] as const) {
    leg(g, m, sx * 0.13, sz, 1.05, sx);
  }
}

function beetle(g: THREE.Group, m: M): void {
  const carapace = facet(0.16, m.hull, 0, 0.18, 0, 1.25, 0.8, 1.45);
  carapace.rotation.x = 0.28;
  rim(carapace);
  g.add(carapace);
  g.add(crystal(m.core, 0, 0.32, -0.04, 0.22, 0.06, 0.2, 0));
  g.add(crystal(m.shard, 0.07, 0.28, -0.1, 0.16, 0.045, 0.15, 0.3));
  g.add(box(0.09, 0.03, 0.05, m.visor, 0, 0.2, 0.18));
  g.add(box(0.05, 0.012, 0.02, m.rim, 0, 0.2, 0.21));
  for (const [sx, sz] of [[-1, 0.12], [1, 0.12], [-1, 0], [1, 0], [-1, -0.1], [1, -0.1]] as const) {
    leg(g, m, sx * 0.12, sz, 0.95, sx * 1.15);
  }
}

function wedge(g: THREE.Group, m: M): void {
  const body = octa(0.16, m.hull, 0, 0.16, 0.02, 0.72, 0.58, 1.7);
  rim(body);
  g.add(body);
  const lance = cap(0.02, 0.5, m.plate, 0, 0.17, 0.28, 1.15, 0);
  rim(lance);
  g.add(lance);
  g.add(octa(0.05, m.core, 0, 0.17, 0.52, 0.7, 0.9, 0.7));
  g.add(box(0.07, 0.025, 0.04, m.visor, 0, 0.2, 0.14));
  for (const sx of [-1, 1] as const) {
    leg(g, m, sx * 0.1, -0.08, 0.95, sx);
    arm(g, m, sx * 0.08, 0.18, 0.06, 0.85, sx, 0.85);
  }
}

function spider(g: THREE.Group, m: M): void {
  const abdomen = facet(0.11, m.dark, 0, 0.18, 0, 1.2, 0.75, 1.2);
  rim(abdomen);
  g.add(abdomen);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 6, 0, Math.PI), m.visor);
  dish.rotation.x = -0.9;
  dish.position.set(0, 0.28, -0.02);
  g.add(dish);
  g.add(box(0.07, 0.025, 0.04, m.rim, 0, 0.2, 0.14));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const x = Math.cos(a) * 0.14;
    const z = Math.sin(a) * 0.14;
    g.add(ball(0.028, m.hull, x * 0.7, 0.16, z * 0.7));
    const thigh = cap(0.02, 0.14, m.dark, x, 0.11, z, 0.85, Math.cos(a) * 0.55);
    rim(thigh);
    g.add(thigh);
    g.add(ball(0.022, m.hull, x * 1.15, 0.05, z * 1.15));
    g.add(box(0.05, 0.02, 0.06, m.hull, x * 1.25, 0.02, z * 1.25));
  }
}

function hulk(g: THREE.Group, m: M): void {
  const body = facet(0.22, m.hull, 0, 0.28, 0, 1.45, 0.9, 1.2);
  rim(body);
  g.add(body);
  const head = facet(0.12, m.dark, 0, 0.38, 0.12, 1.05, 0.75, 0.85);
  rim(head);
  g.add(head);
  g.add(crystal(m.core, 0, 0.52, 0, 0.26, 0.09));
  g.add(box(0.12, 0.05, 0.06, m.visor, 0, 0.4, 0.22));
  g.add(box(0.07, 0.018, 0.025, m.rim, 0, 0.4, 0.26));
  for (const [sx, sz] of [[-1, 0.12], [1, 0.12], [-1, -0.12], [1, -0.12]] as const) {
    leg(g, m, sx * 0.16, sz, 1.25, sx);
  }
  for (const sx of [-1, 1] as const) {
    arm(g, m, sx * 0.2, 0.32, 0.06, 1.2, sx, 1.25);
  }
}

function wraith(g: THREE.Group, m: M): void {
  const body = facet(0.14, m.hull, 0, 0.2, 0, 1.15, 0.95, 1.5);
  rim(body);
  g.add(body);
  g.add(box(0.1, 0.035, 0.05, m.visor, 0, 0.22, 0.18));
  for (const sx of [-1, 1] as const) {
    const wing = cap(0.022, 0.2, m.dark, sx * 0.14, 0.16, -0.08, 0.95, sx * 0.55);
    rim(wing);
    g.add(wing);
    g.add(box(0.04, 0.02, 0.1, m.plate, sx * 0.2, 0.12, -0.16));
  }
  fade(g, 0.55);
}

function scorpion(g: THREE.Group, m: M): void {
  const body = facet(0.12, m.hull, 0, 0.16, 0, 1.4, 0.7, 1.6);
  rim(body);
  g.add(body);
  g.add(box(0.08, 0.028, 0.04, m.visor, 0, 0.18, 0.18));
  for (const sx of [-1, 1] as const) {
    g.add(ball(0.03, m.hull, sx * 0.12, 0.16, 0.1));
    const claw = box(0.03, 0.16, 0.055, m.plate, sx * 0.16, 0.2, 0.16, 0, 0, sx * 0.55);
    rim(claw);
    g.add(claw);
    g.add(box(0.022, 0.1, 0.04, m.dark, sx * 0.2, 0.14, 0.22, 0, 0, sx * 0.7));
    leg(g, m, sx * 0.1, 0.06, 0.9, sx);
    leg(g, m, sx * 0.1, -0.08, 0.9, sx);
  }
  const tail = cap(0.022, 0.22, m.dark, 0, 0.28, -0.16, -0.9, 0);
  rim(tail);
  g.add(tail);
  g.add(octa(0.045, m.core, 0, 0.4, -0.22, 0.7, 1.1, 0.7));
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
  const glass = lit("#1c2832");
  const pane = lit("#2a3844");
  let y = 0.14;
  for (let i = 0; i < floors; i++) {
    const tw = w * (1 - i * 0.035);
    const storey = box(tw, fh, tw, i % 2 === 0 ? glass : pane, x, y + fh / 2, z);
    rim(storey);
    g.add(storey);
    const band = 0.055;
    const wy = y + fh * 0.58;
    g.add(box(tw * 0.72, band, 0.018, m.visor, x, wy, z + tw * 0.5));
    g.add(box(tw * 0.72, band, 0.018, m.visor, x, wy, z - tw * 0.5));
    g.add(box(0.018, band, tw * 0.72, m.visor, x + tw * 0.5, wy, z));
    g.add(box(0.018, band, tw * 0.72, m.visor, x - tw * 0.5, wy, z));
    g.add(box(tw * 0.82, 0.012, tw * 0.82, m.rim, x, y + fh - 0.006, z));
    y += fh + 0.014;
  }
  g.add(octa(w * 0.22, m.core, x, y + 0.04, z, 0.7, 1.2, 0.7));
  return y;
}

export function buildSpire(faction: FactionId, color: string, capital: boolean, level = 1): THREE.Group {
  const g = new THREE.Group();
  const m = mats(faction, color);
  const lv = Math.max(1, Math.min(8, level));

  const plaza = box(0.95, 0.06, 0.95, lit("#c8c4ba"), 0, 0.03, 0);
  rim(plaza);
  g.add(plaza);
  g.add(box(0.62, 0.05, 0.62, m.dark, 0, 0.08, 0));

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.018, 8, 24), m.visor);
  halo.rotation.x = Math.PI / 2;
  halo.position.set(0, 0.11, 0);
  g.add(halo);

  const mainFloors = (capital ? 4 : 3) + Math.min(3, lv);
  const midFloors = Math.max(2, mainFloors - 2);
  const lowFloors = Math.max(2, mainFloors - 3);
  const fh = capital ? 0.2 : 0.175;

  const mainH = glassTower(g, m, 0.02, -0.04, mainFloors, capital ? 0.26 : 0.2, fh);
  glassTower(g, m, 0.28, -0.22, midFloors, capital ? 0.16 : 0.13, fh * 0.9);
  glassTower(g, m, -0.24, 0.2, lowFloors, capital ? 0.15 : 0.12, fh * 0.88);
  if (capital) {
    glassTower(g, m, 0.26, 0.22, Math.max(2, lowFloors - 1), 0.12, fh * 0.82);
    glassTower(g, m, -0.22, -0.2, 2, 0.11, fh * 0.8);
  }

  g.add(crystal(m.core, 0.02, mainH + 0.12, -0.04, 0.2, 0.06));
  if (capital) {
    g.add(crystal(m.shard, 0.14, mainH + 0.02, -0.12, 0.14, 0.045, 0.2, 0.3));
    g.add(crystal(m.shard, -0.12, mainH + 0.02, 0.08, 0.14, 0.045, 0.2, -0.3));
  }

  const light = new THREE.PointLight(m.accent, capital ? 1.2 : 0.7, capital ? 3.4 : 2.2, 2);
  light.position.set(0, mainH * 0.55, -0.04);
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
