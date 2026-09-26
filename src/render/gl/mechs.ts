import * as THREE from "three";
import type { FactionId, UnitType } from "../../engine/types";
import { factionAccent, glow, ice, iceTint, metal } from "./palette";

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

function spike(mat: THREE.Material, x: number, y: number, z: number, h: number, s = 0.12, tilt = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(s, 0), mat);
  m.scale.set(0.7, h / (s * 2), 0.7);
  m.position.set(x, y, z);
  m.rotation.z = tilt;
  m.castShadow = true;
  return m;
}

function crystal(mat: THREE.Material, x: number, y: number, z: number, h: number, s = 0.16, rx = 0, rz = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), mat);
  m.scale.set(0.62, h / (s * 2), 0.62);
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
    hull: metal("#2a313c", 0.88, 0.2),
    dark: metal("#16181e", 0.8, 0.3),
    plate: metal(color, 0.74, 0.2),
    visor: glow(accent, 1.6),
    ice: ice(tint, accent, crystalBias),
    core: glow(accent, 1.8),
  };
}

export function buildMech(type: UnitType, faction: FactionId, color: string): THREE.Group {
  const g = new THREE.Group();
  const m = mats(faction, color);

  if (type === "skiff" || type === "hoverScout" || type === "hullRam" || type === "depthBomber" || type === "leviathan" || type === "ghostSkiff") {
    naval(g, type, m);
    return g;
  }

  const scale = type === "titan" ? 1.28 : type === "bulwark" || type === "vanguard" ? 1.12 : 1;
  g.scale.setScalar(scale);

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.28, 20), new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.45 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  g.add(shadow);
  g.add(box(0.13, 0.26, 0.14, m.dark, -0.12, 0.14, 0.04));
  g.add(box(0.13, 0.26, 0.14, m.dark, 0.12, 0.14, 0.04));
  g.add(box(0.15, 0.07, 0.18, m.hull, -0.12, 0.04, 0.06));
  g.add(box(0.15, 0.07, 0.18, m.hull, 0.12, 0.04, 0.06));
  g.add(box(0.28, 0.1, 0.18, m.plate, 0, 0.26, 0.01));
  g.add(box(0.36, 0.3, 0.24, m.hull, 0, 0.44, 0));
  g.add(box(0.28, 0.16, 0.08, m.ice, 0, 0.46, 0.12));
  g.add(box(0.2, 0.06, 0.04, m.visor, 0, 0.48, 0.17));
  g.add(box(0.2, 0.12, 0.18, m.plate, -0.26, 0.54, 0));
  g.add(box(0.2, 0.12, 0.18, m.plate, 0.26, 0.54, 0));
  g.add(spike(m.ice, -0.3, 0.68, -0.02, 0.22, 0.08, -0.35));
  g.add(spike(m.ice, 0.3, 0.68, -0.02, 0.22, 0.08, 0.35));
  g.add(box(0.1, 0.26, 0.1, m.dark, -0.28, 0.36, 0.03));
  g.add(box(0.1, 0.26, 0.1, m.dark, 0.28, 0.36, 0.03));
  g.add(box(0.12, 0.1, 0.12, m.hull, -0.3, 0.22, 0.06));
  g.add(box(0.12, 0.1, 0.12, m.hull, 0.3, 0.22, 0.06));
  g.add(box(0.2, 0.16, 0.18, m.hull, 0, 0.64, 0.02));
  g.add(box(0.16, 0.1, 0.14, m.ice, 0, 0.72, 0.04));
  g.add(box(0.14, 0.045, 0.05, m.visor, 0, 0.71, 0.12));
  g.add(crest(faction, m));

  if (type === "marksman" || type === "railgun") {
    g.add(box(0.07, 0.07, 0.4, m.dark, 0.22, 0.38, 0.2));
    g.add(box(0.045, 0.045, 0.12, m.visor, 0.22, 0.38, 0.42));
  }
  if (type === "lancer") g.add(box(0.045, 0.045, 0.5, m.plate, 0.2, 0.36, 0.22));
  if (type === "bulwark") g.add(box(0.24, 0.32, 0.07, m.ice, 0.2, 0.4, 0.14));
  if (type === "netrunner") {
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI), m.visor);
    dish.rotation.x = -0.55;
    dish.position.set(0, 0.78, 0.02);
    dish.castShadow = true;
    g.add(dish);
  }
  if (type === "skimmer") g.add(box(0.4, 0.06, 0.3, m.hull, 0, 0.08, 0));
  if (type === "titan") {
    g.add(box(0.44, 0.3, 0.3, m.hull, 0, 0.78, 0));
    g.add(crystal(m.ice, 0, 1.02, 0, 0.36, 0.14));
    g.add(box(0.12, 0.16, 0.12, m.visor, 0, 1.08, 0.06));
  }
  if (type === "phantom" || type === "blade") {
    g.traverse((c) => {
      if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshPhysicalMaterial) {
        c.material = c.material.clone();
        c.material.transparent = true;
        c.material.opacity = type === "phantom" ? 0.5 : 0.9;
      }
    });
  }
  return g;
}

function crest(faction: FactionId, m: ReturnType<typeof mats>): THREE.Object3D {
  if (faction === "meridian") return box(0.18, 0.08, 0.16, m.plate, 0, 0.82, 0.02);
  if (faction === "tide") return spike(m.ice, 0, 0.86, -0.02, 0.2, 0.07, 0);
  if (faction === "ashfall") {
    const g = new THREE.Group();
    g.add(spike(m.ice, -0.06, 0.84, 0, 0.18, 0.06, -0.4));
    g.add(spike(m.ice, 0.06, 0.84, 0, 0.18, 0.06, 0.4));
    return g;
  }
  if (faction === "verdant") return crystal(m.ice, 0, 0.86, -0.02, 0.22, 0.08);
  return spike(m.ice, 0, 0.88, -0.02, 0.24, 0.08, 0.15);
}

function naval(g: THREE.Group, type: UnitType, m: ReturnType<typeof mats>): void {
  const L = type === "leviathan" ? 0.78 : type === "depthBomber" ? 0.62 : 0.54;
  g.add(box(L, 0.1, 0.24, m.hull, 0, 0.1, 0));
  g.add(box(L * 0.72, 0.1, 0.18, m.plate, 0, 0.18, 0));
  g.add(box(L * 0.4, 0.06, 0.2, m.ice, 0, 0.22, 0));
  g.add(box(0.09, 0.09, 0.09, m.visor, L * 0.3, 0.18, 0));
  g.add(box(0.06, 0.04, 0.16, m.core, -L * 0.28, 0.08, 0));
  if (type === "hoverScout") {
    g.add(box(0.045, 0.26, 0.045, m.plate, 0, 0.34, 0));
    g.add(box(0.08, 0.04, 0.08, m.visor, 0, 0.48, 0));
  }
  if (type === "hullRam") g.add(box(0.2, 0.1, 0.12, m.dark, L * 0.44, 0.1, 0));
  if (type === "depthBomber") g.add(box(0.16, 0.12, 0.16, m.dark, -0.1, 0.28, 0));
  if (type === "leviathan") {
    g.add(box(0.24, 0.18, 0.22, m.ice, 0, 0.32, 0));
    g.add(crystal(m.ice, 0, 0.5, 0, 0.28, 0.12));
  }
}

export function buildHero(faction: FactionId, color: string): THREE.Group {
  const g = new THREE.Group();
  const m = mats(faction, color);
  const shell = ice(iceTint(faction), factionAccent(faction), 0.62);
  shell.color.offsetHSL(0, 0.05, 0.12);
  const joint = m.dark;

  for (const sx of [-1, 1] as const) {
    g.add(box(0.5, 1.2, 0.46, shell, sx * 0.32, 0.62, 0.04));
    g.add(box(0.56, 0.2, 0.52, joint, sx * 0.32, 0.08, 0.08));
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
    g.add(box(0.4, 1.32, 0.4, shell, sx * 0.95, 1.7, 0, 0, 0, sx * -0.22));
    g.add(box(0.5, 0.38, 0.5, joint, sx * 1.16, 0.92, 0.1));
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

export function buildSpire(faction: FactionId, color: string, capital: boolean): THREE.Group {
  const g = new THREE.Group();
  const m = mats(faction, color);
  const base = metal("#c8c4bc", 0.62, 0.22);
  g.add(box(0.82, 0.1, 0.82, base, 0, 0.05, 0));
  g.add(box(0.58, 0.16, 0.58, m.plate, 0, 0.16, 0));
  g.add(box(0.36, 0.1, 0.36, m.hull, 0, 0.26, 0));
  const shards = capital
    ? [
        [0, 1.35, 0, 1.7, 0.22],
        [0.2, 0.82, 0.12, 0.85, 0.14],
        [-0.18, 0.76, -0.14, 0.78, 0.13],
        [0.06, 0.68, 0.22, 0.58, 0.12],
        [-0.22, 0.58, 0.1, 0.48, 0.11],
        [0.16, 0.55, -0.18, 0.46, 0.11],
      ]
    : [
        [0, 0.82, 0, 0.95, 0.16],
        [0.16, 0.52, 0.12, 0.5, 0.11],
        [-0.14, 0.5, -0.1, 0.46, 0.1],
      ];
  const glass = glow(m.accent, 1.35);
  for (const [x, y, z, h, s] of shards) {
    g.add(crystal(glass, x, y, z, h, s));
  }
  if (capital) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.028, 8, 24), m.core);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.78;
    g.add(ring);
    const light = new THREE.PointLight(m.accent, 1.4, 5, 1.6);
    light.position.y = 1.25;
    g.add(light);
  } else {
    const light = new THREE.PointLight(m.accent, 1.4, 3.5, 2);
    light.position.y = 0.7;
    g.add(light);
  }
  return g;
}

export function buildBeacon(color: string, level: number): THREE.Group {
  const g = new THREE.Group();
  const h = 0.85 + Math.min(5, Math.max(1, level)) * 0.24;
  g.add(box(0.24, 0.08, 0.24, metal("#e8eef4"), 0, 0.05, 0));
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.09, h, 8), glow(color, 2.8));
  beam.position.y = h / 2 + 0.08;
  g.add(beam);
  const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), glow(color, 3));
  cap.position.y = h + 0.08;
  g.add(cap);
  const light = new THREE.PointLight(color, 2.1, 4.5, 2);
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
    g.add(crystal(leaf, x, 0.28 * s, z, 0.34 * s, 0.11 * s));
  }
  return g;
}
