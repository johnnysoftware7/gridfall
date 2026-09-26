import * as THREE from "three";
import type { FactionId, UnitType } from "../../engine/types";
import { factionAccent, glow, ice, iceTint, lambert, metal } from "./palette";

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
    hull: lambert("#6a727c", "#1a2028", 0.08),
    dark: lambert("#3a4048", "#0c1014", 0.05),
    plate: lambert(color, accent, 0.1),
    visor: lit(accent),
    ice: ice(tint, accent, 0.4),
    core: lit(accent),
    shard: lit(tint),
    glow: glow(accent, 1.7),
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
    if (c instanceof THREE.Mesh && (c.material instanceof THREE.MeshPhysicalMaterial || c.material instanceof THREE.MeshLambertMaterial)) {
      c.material = c.material.clone();
      c.material.transparent = true;
      c.material.opacity = opacity;
    }
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

function quadruped(g: THREE.Group, m: M, scale: number): void {
  const body = facet(0.11 * scale, m.hull, 0, 0.16 * scale, 0.02, 1.55, 0.7, 1.15);
  rim(body);
  g.add(body);
  g.add(facet(0.07 * scale, m.dark, 0, 0.18 * scale, 0.1, 1.1, 0.65, 0.8));
  g.add(box(0.08 * scale, 0.03 * scale, 0.04 * scale, m.visor, 0, 0.19 * scale, 0.16 * scale));
  for (const [sx, sz] of [[-1, 0.08], [1, 0.08], [-1, -0.08], [1, -0.08]] as const) {
    const leg = cap(0.028 * scale, 0.1 * scale, m.dark, sx * 0.1 * scale, 0.08 * scale, sz * scale, 0.35, sx * 0.25);
    g.add(leg);
    g.add(ball(0.03 * scale, m.hull, sx * 0.12 * scale, 0.03, sz * scale + 0.04));
  }
  g.add(octa(0.04 * scale, m.core, 0, 0.24 * scale, -0.04, 0.8, 1.2, 0.7));
}

function hoverDisc(g: THREE.Group, m: M): void {
  const pad = facet(0.16, m.hull, 0, 0.06, 0, 1.35, 0.28, 1.05);
  rim(pad);
  g.add(pad);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.016, 8, 18), m.visor);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  g.add(ring);
  g.add(facet(0.08, m.dark, 0, 0.14, 0.02, 1.1, 0.7, 0.9));
  g.add(box(0.07, 0.025, 0.04, m.visor, 0, 0.15, 0.1));
}

function gunbed(g: THREE.Group, m: M, barrel: number): void {
  const chassis = box(0.22, 0.08, 0.16, m.hull, 0, 0.1, 0);
  rim(chassis);
  g.add(chassis);
  g.add(box(0.14, 0.06, 0.12, m.dark, 0, 0.16, -0.02));
  const gun = cap(0.02, barrel, m.dark, 0.02, 0.16, 0.08 + barrel * 0.25, 1.2, 0);
  rim(gun);
  g.add(gun);
  g.add(box(0.04, 0.03, 0.05, m.visor, 0.02, 0.16, 0.1 + barrel * 0.45));
  for (const sx of [-1, 1] as const) {
    g.add(box(0.06, 0.04, 0.1, m.hull, sx * 0.12, 0.05, 0.02));
  }
}

function squatTank(g: THREE.Group, m: M): void {
  const hull = facet(0.14, m.hull, 0, 0.14, 0, 1.35, 0.7, 1.15);
  rim(hull);
  g.add(hull);
  const shield = box(0.05, 0.16, 0.2, m.plate, 0.14, 0.16, 0.04);
  rim(shield);
  g.add(shield);
  g.add(box(0.03, 0.08, 0.1, m.visor, 0.18, 0.16, 0.04));
  for (const sx of [-1, 1] as const) {
    g.add(cap(0.03, 0.08, m.dark, sx * 0.12, 0.07, 0.06, 0.4, sx * 0.2));
    g.add(cap(0.03, 0.08, m.dark, sx * 0.12, 0.07, -0.06, 0.4, sx * 0.2));
  }
}

function beetle(g: THREE.Group, m: M): void {
  const carapace = facet(0.13, m.hull, 0, 0.14, 0, 1.2, 0.75, 1.35);
  carapace.rotation.x = 0.25;
  rim(carapace);
  g.add(carapace);
  g.add(crystal(m.core, 0, 0.26, -0.04, 0.18, 0.05, 0.2, 0));
  g.add(crystal(m.shard, 0.05, 0.24, -0.08, 0.14, 0.04, 0.15, 0.3));
  g.add(box(0.07, 0.025, 0.04, m.visor, 0, 0.16, 0.14));
  for (const [sx, sz] of [[-1, 0.08], [1, 0.08], [-1, -0.07], [1, -0.07]] as const) {
    g.add(cap(0.025, 0.09, m.dark, sx * 0.1, 0.07, sz, 0.45, sx * 0.3));
  }
}

function wedge(g: THREE.Group, m: M): void {
  const body = octa(0.14, m.hull, 0, 0.12, 0.02, 0.7, 0.55, 1.6);
  rim(body);
  g.add(body);
  g.add(cap(0.016, 0.42, m.plate, 0, 0.14, 0.22, 1.15, 0));
  g.add(octa(0.04, m.core, 0, 0.14, 0.42, 0.7, 0.9, 0.7));
  g.add(box(0.06, 0.02, 0.03, m.visor, 0, 0.16, 0.12));
  for (const sx of [-1, 1] as const) {
    g.add(cap(0.024, 0.08, m.dark, sx * 0.08, 0.06, -0.06, 0.3, sx * 0.2));
  }
}

function spider(g: THREE.Group, m: M): void {
  g.add(facet(0.09, m.dark, 0, 0.14, 0, 1.1, 0.7, 1.1));
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 6, 0, Math.PI), m.visor);
  dish.rotation.x = -0.9;
  dish.position.set(0, 0.22, -0.02);
  g.add(dish);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(cap(0.016, 0.14, m.hull, Math.cos(a) * 0.12, 0.08, Math.sin(a) * 0.12, 0.7, Math.cos(a) * 0.4));
  }
}

function hulk(g: THREE.Group, m: M): void {
  const body = facet(0.18, m.hull, 0, 0.22, 0, 1.4, 0.85, 1.15);
  rim(body);
  g.add(body);
  g.add(facet(0.1, m.dark, 0, 0.28, 0.1, 1.05, 0.7, 0.8));
  g.add(crystal(m.core, 0, 0.4, 0, 0.22, 0.08));
  g.add(box(0.1, 0.04, 0.05, m.visor, 0, 0.3, 0.18));
  for (const [sx, sz] of [[-1, 0.1], [1, 0.1], [-1, -0.1], [1, -0.1]] as const) {
    g.add(cap(0.04, 0.14, m.dark, sx * 0.14, 0.1, sz, 0.25, sx * 0.15));
    g.add(ball(0.045, m.hull, sx * 0.16, 0.04, sz + 0.04));
  }
}

function wraith(g: THREE.Group, m: M): void {
  const body = facet(0.12, m.hull, 0, 0.16, 0, 1.1, 0.9, 1.4);
  g.add(body);
  g.add(box(0.08, 0.03, 0.04, m.visor, 0, 0.18, 0.14));
  for (const sx of [-1, 1] as const) {
    g.add(cap(0.02, 0.16, m.dark, sx * 0.1, 0.1, -0.08, 0.8, sx * 0.4));
  }
  fade(g, 0.45);
}

function scorpion(g: THREE.Group, m: M): void {
  const body = facet(0.09, m.hull, 0, 0.12, 0, 1.3, 0.65, 1.5);
  rim(body);
  g.add(body);
  g.add(box(0.06, 0.02, 0.03, m.visor, 0, 0.14, 0.14));
  g.add(box(0.018, 0.14, 0.04, m.plate, 0.12, 0.16, 0.1, 0, 0, 0.5));
  g.add(box(0.018, 0.14, 0.04, m.plate, -0.12, 0.16, 0.1, 0, 0, -0.5));
  for (const sx of [-1, 1] as const) {
    g.add(cap(0.02, 0.1, m.dark, sx * 0.08, 0.06, 0.06, 0.4, sx * 0.25));
    g.add(cap(0.02, 0.1, m.dark, sx * 0.08, 0.06, -0.06, 0.4, sx * 0.25));
  }
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

export function buildSpire(faction: FactionId, color: string, capital: boolean, level = 1): THREE.Group {
  const g = new THREE.Group();
  const m = mats(faction, color);
  const lv = Math.max(1, Math.min(8, level));
  const floors = (capital ? 3 : 2) + Math.min(4, lv);
  const w = capital ? 0.28 : 0.22;

  const plaza = box(0.82, 0.07, 0.82, lambert("#c8c4ba"), 0, 0.035, 0);
  rim(plaza);
  g.add(plaza);
  g.add(box(0.52, 0.06, 0.52, m.dark, 0, 0.09, 0));

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.02, 8, 24), m.visor);
  halo.rotation.x = Math.PI / 2;
  halo.position.set(0, 0.12, 0);
  g.add(halo);

  let y = 0.12;
  for (let i = 0; i < floors; i++) {
    const fw = w * (1 - i * 0.05);
    const fh = capital ? 0.26 : 0.22;
    const storey = box(fw, fh, fw, lambert("#1e262e", m.accent, 0.12), 0, y + fh / 2, -0.06);
    rim(storey);
    g.add(storey);
    g.add(box(fw * 0.78, 0.045, 0.035, m.visor, 0, y + fh * 0.55, fw * 0.48 - 0.06));
    g.add(box(fw * 0.78, 0.045, 0.035, m.visor, 0, y + fh * 0.55, -fw * 0.48 - 0.06));
    g.add(box(0.035, 0.045, fw * 0.78, m.visor, fw * 0.48, y + fh * 0.55, -0.06));
    y += fh + 0.01;
  }

  g.add(crystal(m.core, 0, y + 0.1, -0.06, 0.22, 0.07));
  if (capital) {
    g.add(crystal(m.shard, 0.1, y + 0.04, -0.12, 0.16, 0.05, 0.2, 0.3));
    g.add(crystal(m.shard, -0.1, y + 0.04, -0.12, 0.16, 0.05, 0.2, -0.3));
  }
  for (const [x, z] of [[0.28, 0.2], [-0.26, 0.18]] as const) {
    g.add(crystal(m.shard, x, 0.2, z, 0.2, 0.05));
  }

  const light = new THREE.PointLight(m.accent, capital ? 1.2 : 0.7, capital ? 3.4 : 2.2, 2);
  light.position.set(0, y * 0.6, -0.04);
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
