import * as THREE from "three";
import type { FactionId, UnitType } from "../../engine/types";
import { factionAccent, glow, ice, iceTint, metal } from "./palette";

const RIM = new THREE.LineBasicMaterial({ color: "#eef6ff" });

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
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 8), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, 0, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function ball(r: number, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), mat);
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

function rim(mesh: THREE.Mesh): void {
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 18), RIM));
}

function spike(mat: THREE.Material, x: number, y: number, z: number, h: number, s = 0.12, tilt = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(s, 0), mat);
  m.scale.set(0.62, h / (s * 2), 0.62);
  m.position.set(x, y, z);
  m.rotation.z = tilt;
  m.castShadow = true;
  return m;
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
  const crystalBias = faction === "meridian" ? 0.18 : faction === "ashfall" ? 0.32 : 0.5;
  return {
    accent,
    hull: metal("#6a7380", 0.88, 0.22),
    dark: metal("#2c323a", 0.82, 0.28),
    plate: metal(color, 0.62, 0.2),
    visor: lit(accent),
    ice: ice(tint, accent, crystalBias),
    core: lit(accent),
    glow: glow(accent, 1.85),
  };
}

type M = ReturnType<typeof mats>;

export function buildMech(type: UnitType, faction: FactionId, color: string): THREE.Group {
  const g = new THREE.Group();
  const m = mats(faction, color);

  if (type === "skiff" || type === "hoverScout" || type === "hullRam" || type === "depthBomber" || type === "leviathan" || type === "ghostSkiff") {
    naval(g, type, m);
    return g;
  }

  const stocky = type === "bulwark" || type === "vanguard" || type === "titan";
  const lean = type === "skimmer" || type === "lancer" || type === "phantom" || type === "blade";
  const hover = type === "skimmer";
  const scale = type === "titan" ? 1.28 : type === "blade" ? 0.88 : stocky ? 1.1 : 1;
  g.scale.setScalar(scale);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.24, 20),
    new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.55 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  g.add(shadow);

  if (!hover) legs(g, m, stocky ? 0.15 : lean ? 0.11 : 0.13);
  else hoverPad(g, m);

  const stance = stocky ? 0.15 : lean ? 0.11 : 0.13;
  const hip = facet(0.09, m.dark, 0, hover ? 0.16 : 0.22, 0.02, 1.35, 0.7, 1.05);
  rim(hip);
  g.add(hip);

  const chest = facet(0.15, m.hull, 0, hover ? 0.32 : 0.4, 0.03, stocky ? 1.25 : lean ? 0.92 : 1.08, 1.15, 0.82);
  chest.rotation.x = 0.18;
  rim(chest);
  g.add(chest);
  const plate = facet(0.08, m.plate, 0, hover ? 0.33 : 0.41, 0.12, 1.15, 0.85, 0.45);
  g.add(plate);
  g.add(box(0.1, 0.04, 0.03, m.visor, 0, hover ? 0.34 : 0.42, 0.16));

  for (const sx of [-1, 1] as const) {
    const pad = facet(0.075, m.plate, sx * (stocky ? 0.17 : 0.14), hover ? 0.4 : 0.5, 0.0, 1.15, 0.7, 0.95);
    pad.rotation.z = sx * -0.35;
    rim(pad);
    g.add(pad);
    g.add(crystal(m.core, sx * (stocky ? 0.2 : 0.17), hover ? 0.46 : 0.56, -0.02, 0.16, 0.05, 0.2, sx * 0.4));
    const upper = cap(0.036, 0.12, m.hull, sx * (stance + 0.08), hover ? 0.3 : 0.38, 0.04, 0.25, sx * 0.45);
    const fore = cap(0.032, 0.11, m.dark, sx * (stance + 0.13), hover ? 0.2 : 0.26, 0.08, 0.35, sx * 0.2);
    const fist = ball(0.038, m.hull, sx * (stance + 0.15), hover ? 0.14 : 0.18, 0.11);
    rim(upper);
    g.add(upper, fore, fist);
  }

  const helm = facet(0.085, m.hull, 0, hover ? 0.48 : 0.58, 0.05, 0.95, 0.85, 0.9);
  rim(helm);
  g.add(helm);
  const visor = box(0.12, 0.045, 0.045, m.visor, 0, hover ? 0.475 : 0.575, 0.12);
  g.add(visor);
  g.add(box(0.08, 0.02, 0.02, lit("#f4ffff"), 0, hover ? 0.475 : 0.575, 0.145));
  g.add(crest(faction, m, hover ? 0.54 : 0.66));

  gear(g, type, m, hover);
  if (type === "phantom" || type === "blade") fade(g, type === "phantom" ? 0.46 : 0.88);
  return g;
}

function legs(g: THREE.Group, m: M, stance: number): void {
  for (const sx of [-1, 1] as const) {
    g.add(ball(0.04, m.dark, sx * stance, 0.22, 0.02));
    const thigh = cap(0.042, 0.13, m.hull, sx * stance, 0.155, 0.04, 0.22, sx * 0.12);
    const shin = cap(0.036, 0.12, m.dark, sx * (stance + 0.015), 0.07, 0.07, 0.12, 0);
    const boot = facet(0.05, m.hull, sx * (stance + 0.015), 0.03, 0.1, 1.15, 0.45, 1.35);
    rim(thigh);
    rim(shin);
    g.add(thigh, shin, boot);
  }
}

function hoverPad(g: THREE.Group, m: M): void {
  const pad = facet(0.16, m.hull, 0, 0.05, 0.02, 1.45, 0.28, 1.05);
  rim(pad);
  g.add(pad);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 8, 20), m.visor);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.04;
  g.add(ring);
  g.add(box(0.08, 0.02, 0.08, m.visor, 0, 0.07, 0.08));
}

function gear(g: THREE.Group, type: UnitType, m: M, hover: boolean): void {
  const hy = hover ? 0.28 : 0.34;
  if (type === "trooper") {
    g.add(cap(0.018, 0.22, m.dark, 0.16, hy, 0.16, 1.2, 0.15));
    g.add(box(0.03, 0.03, 0.05, m.visor, 0.16, hy, 0.3));
  }
  if (type === "marksman" || type === "railgun") {
    const L = type === "railgun" ? 0.48 : 0.34;
    const gun = cap(0.022, L, m.dark, 0.17, hy, 0.12, 1.25, 0.1);
    rim(gun);
    g.add(gun);
    g.add(box(0.035, 0.035, 0.08, m.visor, 0.17, hy, 0.12 + L * 0.42));
    if (type === "railgun") g.add(facet(0.07, m.plate, 0.14, hy + 0.08, 0.02, 1.1, 0.7, 0.8));
  }
  if (type === "lancer") {
    g.add(cap(0.016, 0.5, m.plate, 0.18, hy, 0.16, 1.05, 0.18));
    g.add(crystal(m.core, 0.2, hy + 0.02, 0.42, 0.14, 0.045));
  }
  if (type === "bulwark") {
    const shield = facet(0.12, m.ice, 0.2, hy, 0.08, 0.45, 1.15, 1.05);
    rim(shield);
    g.add(shield);
    g.add(box(0.03, 0.1, 0.08, m.visor, 0.26, hy, 0.08));
  }
  if (type === "vanguard") {
    g.add(spike(m.ice, 0, hover ? 0.58 : 0.7, -0.02, 0.2, 0.055, 0.15));
    g.add(cap(0.016, 0.2, m.plate, 0.17, hy - 0.04, 0.14, 1.2, 0.1));
  }
  if (type === "netrunner") {
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 7, 0, Math.PI), m.visor);
    dish.rotation.x = -0.75;
    dish.position.set(0, hover ? 0.56 : 0.68, -0.02);
    dish.castShadow = true;
    g.add(dish);
  }
  if (type === "titan") {
    g.add(facet(0.12, m.hull, 0, 0.72, 0.02, 1.2, 0.85, 0.9));
    g.add(crystal(m.core, 0, 0.88, 0.04, 0.28, 0.1));
    g.add(box(0.1, 0.06, 0.05, m.visor, 0, 0.86, 0.14));
  }
  if (type === "blade") {
    g.add(box(0.018, 0.18, 0.04, m.plate, 0.18, hy, 0.1));
    g.add(box(0.018, 0.18, 0.04, m.plate, -0.18, hy, 0.1));
  }
}

function crest(faction: FactionId, m: M, y: number): THREE.Object3D {
  if (faction === "meridian") return facet(0.045, m.plate, 0, y, 0.02, 1.2, 0.55, 0.9);
  if (faction === "tide") return spike(m.ice, 0, y, -0.01, 0.14, 0.045, 0);
  if (faction === "ashfall") {
    const g = new THREE.Group();
    g.add(spike(m.ice, -0.04, y, 0, 0.12, 0.04, -0.4));
    g.add(spike(m.ice, 0.04, y, 0, 0.12, 0.04, 0.4));
    return g;
  }
  if (faction === "verdant") return crystal(m.ice, 0, y, -0.01, 0.14, 0.05);
  return spike(m.ice, 0, y + 0.02, -0.01, 0.16, 0.048, 0.18);
}

function fade(g: THREE.Group, opacity: number): void {
  g.traverse((c) => {
    if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshPhysicalMaterial) {
      c.material = c.material.clone();
      c.material.transparent = true;
      c.material.opacity = opacity;
    }
  });
}

function naval(g: THREE.Group, type: UnitType, m: M): void {
  const L = type === "leviathan" ? 0.78 : type === "depthBomber" ? 0.58 : 0.5;
  const hull = facet(0.16, m.hull, 0, 0.1, 0, L * 2.1, 0.42, 0.95);
  rim(hull);
  g.add(hull);
  g.add(facet(0.09, m.plate, 0, 0.18, 0, L * 1.4, 0.35, 0.7));
  g.add(box(0.09, 0.05, 0.07, m.visor, L * 0.22, 0.2, 0.08));
  g.add(box(0.06, 0.03, 0.1, m.core, -L * 0.22, 0.08, 0));
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.24, 16),
    new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.4 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  g.add(shadow);
  if (type === "hoverScout") {
    g.add(cap(0.02, 0.16, m.plate, 0, 0.3, 0));
    g.add(box(0.06, 0.03, 0.06, m.visor, 0, 0.4, 0));
  }
  if (type === "hullRam") g.add(facet(0.08, m.dark, L * 0.28, 0.1, 0, 1.2, 0.7, 0.8));
  if (type === "depthBomber") g.add(facet(0.09, m.dark, -0.08, 0.24, 0, 1, 0.85, 1));
  if (type === "leviathan") {
    g.add(facet(0.12, m.ice, 0, 0.28, 0, 1.15, 0.8, 0.9));
    g.add(crystal(m.core, 0, 0.44, 0, 0.24, 0.1));
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
    g.add(spike(shell, sx * 0.34, 1.28, 0.02, 0.32, 0.13, sx * 0.12));
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
    g.add(spike(shell, sx * 0.92, 3.05, -0.02, 0.7, 0.18, sx * -0.38));
    g.add(spike(shell, sx * 1.1, 2.82, 0.12, 0.42, 0.13, sx * -0.6));
    g.add(crystal(shell, sx * 0.68, 2.78, -0.2, 0.4, 0.14, 0.25, sx * 0.45));
  }

  const helm = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 0), shell);
  helm.scale.set(0.95, 0.85, 0.8);
  helm.position.set(0, 3.05, 0.08);
  helm.castShadow = true;
  g.add(helm);
  g.add(box(0.46, 0.08, 0.08, m.visor, 0, 3.04, 0.34));
  g.add(spike(shell, 0.16, 3.62, -0.02, 0.82, 0.2, 0.2));
  g.add(spike(shell, -0.2, 3.42, -0.1, 0.52, 0.15, -0.42));
  g.add(crystal(shell, 0.38, 3.1, -0.08, 0.42, 0.13, 0.3, 0.55));
  g.add(crystal(shell, -0.06, 2.15, -0.32, 0.62, 0.17, -0.35, 0));
  g.add(crystal(shell, 0.2, 1.48, -0.26, 0.4, 0.13, 0.55, 0.15));

  return g;
}

export function buildSpire(faction: FactionId, color: string, capital: boolean, level = 1): THREE.Group {
  const g = new THREE.Group();
  const m = mats(faction, color);
  const lv = Math.max(1, Math.min(8, level));
  const plaza = metal("#c4c0b6", 0.5, 0.3);
  const base = box(0.86, 0.08, 0.86, plaza, 0, 0.04, 0);
  rim(base);
  g.add(base);
  g.add(box(0.58, 0.1, 0.58, m.dark, 0, 0.12, 0));

  const towerH = (capital ? 1.15 : 0.72) + lv * 0.16;
  const shaft = crystal(m.ice, 0, 0.18 + towerH * 0.45, -0.1, towerH, 0.16);
  rim(shaft);
  g.add(shaft);
  g.add(crystal(m.core, 0, 0.2 + towerH * 0.45, -0.1, towerH * 0.78, 0.08));

  for (let i = 0; i < 4; i++) {
    g.add(box(0.12, 0.035, 0.03, m.visor, 0, 0.28 + i * (towerH * 0.2), 0.02));
  }

  const n = capital ? 10 + Math.min(4, lv) : 6 + Math.min(3, lv);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.2;
    const rad = 0.18 + (i % 4) * 0.07;
    const h = (capital ? 0.95 : 0.58) + (i % 5) * 0.2 + lv * 0.07;
    const mat = i % 2 === 0 ? m.core : m.ice;
    g.add(crystal(mat, Math.cos(a) * rad, 0.2 + h * 0.42, -0.08 + Math.sin(a) * rad * 0.7, h, 0.13 + (i % 3) * 0.03, 0.2, a * 0.3));
  }

  if (capital) {
    g.add(crystal(m.core, 0, 0.28 + towerH, -0.1, 0.42, 0.09));
    for (const sx of [-1, 1] as const) {
      g.add(crystal(m.ice, sx * 0.16, 0.22 + towerH * 0.85, -0.18, 0.38, 0.07, 0.15, sx * 0.35));
    }
  }

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.022, 8, 24), m.visor);
  halo.rotation.x = Math.PI / 2;
  halo.position.set(0, 0.16, -0.04);
  g.add(halo);
  const halo2 = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 8, 20), m.core);
  halo2.rotation.x = Math.PI / 2;
  halo2.position.set(0, 0.22 + towerH * 0.55, -0.1);
  g.add(halo2);

  const light = new THREE.PointLight(m.accent, capital ? 1.35 : 0.8, capital ? 3.6 : 2.4, 2);
  light.position.set(0, 0.7 + lv * 0.1, -0.08);
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
