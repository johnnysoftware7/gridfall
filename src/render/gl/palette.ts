import * as THREE from "three";
import type { FactionId, Terrain } from "../../engine/types";

export const TILE = 1;

export function hexColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

export function terrainLook(terrain: Terrain): {
  top: string;
  side: string;
  h: number;
  metal: number;
  rough: number;
  emit: number;
} {
  if (terrain === "deep") return { top: "#07141c", side: "#03080e", h: 0.22, metal: 0.92, rough: 0.08, emit: 0.08 };
  if (terrain === "shelf") return { top: "#0e4658", side: "#062430", h: 0.34, metal: 0.82, rough: 0.12, emit: 0.14 };
  if (terrain === "ridge") return { top: "#5a5244", side: "#241e16", h: 0.96, metal: 0.38, rough: 0.38, emit: 0 };
  if (terrain === "forest") return { top: "#1a4a26", side: "#0c1c12", h: 0.54, metal: 0.22, rough: 0.46, emit: 0.06 };
  return { top: "#2a3038", side: "#101216", h: 0.5, metal: 0.55, rough: 0.26, emit: 0 };
}

export function factionAccent(id: FactionId): string {
  if (id === "helix") return "#5ef6e8";
  if (id === "meridian") return "#ff9a4a";
  if (id === "tide") return "#5aa8ff";
  if (id === "ashfall") return "#ff5a5a";
  return "#5dff7a";
}

export function iceTint(id: FactionId): string {
  if (id === "helix") return "#8cefff";
  if (id === "meridian") return "#ffb080";
  if (id === "tide") return "#9ad4ff";
  if (id === "ashfall") return "#ff9a88";
  return "#a8ffc0";
}

export function physical(opts: {
  color: string;
  metal?: number;
  rough?: number;
  emit?: string;
  emitInt?: number;
  clearcoat?: number;
  opacity?: number;
  transmission?: number;
  thickness?: number;
}): THREE.MeshPhysicalMaterial {
  const m = new THREE.MeshPhysicalMaterial({
    color: opts.color,
    metalness: opts.metal ?? 0.65,
    roughness: opts.rough ?? 0.28,
    clearcoat: opts.clearcoat ?? 0.7,
    clearcoatRoughness: 0.12,
    emissive: opts.emit ?? "#000000",
    emissiveIntensity: opts.emitInt ?? 0,
    envMapIntensity: 1.25,
    transmission: opts.transmission ?? 0,
    thickness: opts.thickness ?? 0,
    ior: 1.45,
  });
  if (opts.opacity !== undefined && opts.opacity < 1) {
    m.transparent = true;
    m.opacity = opts.opacity;
  }
  return m;
}

export function metal(color: string, metalness = 0.86, rough = 0.2): THREE.MeshPhysicalMaterial {
  return physical({ color, metal: metalness, rough, clearcoat: 0.85 });
}

export function glow(color: string, int = 1.4): THREE.MeshPhysicalMaterial {
  return physical({ color, metal: 0.18, rough: 0.16, emit: color, emitInt: Math.min(2.1, int), clearcoat: 0.3 });
}

export function ice(color: string, accent: string, bias = 0.45): THREE.MeshPhysicalMaterial {
  return physical({
    color,
    metal: 0.42 + bias * 0.15,
    rough: 0.1,
    emit: accent,
    emitInt: 0.05 + bias * 0.04,
    clearcoat: 1,
  });
}

export function makeDarkEnv(renderer: THREE.WebGLRenderer): THREE.Texture {
  const sc = new THREE.Scene();
  sc.background = new THREE.Color("#04070f");
  sc.add(new THREE.HemisphereLight("#7ab4ff", "#140808", 0.55));
  const key = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 16, 10),
    new THREE.MeshBasicMaterial({ color: "#e8f4ff" }),
  );
  key.position.set(4, 11, 5);
  sc.add(key);
  const warm = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 12, 8),
    new THREE.MeshBasicMaterial({ color: "#ffb070" }),
  );
  warm.position.set(-7, 3, -3);
  sc.add(warm);
  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 3),
    new THREE.MeshBasicMaterial({ color: "#8fd4ff" }),
  );
  fill.position.set(0, 1, 8);
  fill.lookAt(0, 0, 0);
  sc.add(fill);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(sc, 0.06).texture;
  pmrem.dispose();
  return tex;
}
