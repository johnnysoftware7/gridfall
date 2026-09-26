import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/** Vertex-lit MeshBasic so charcoal + seams photograph on SwiftShader. */

const KEY = new THREE.Vector3(0.46, 0.84, 0.3).normalize();
const maps = new Map<string, THREE.CanvasTexture>();
const mats = new Map<string, THREE.MeshBasicMaterial>();

export function lightGeo(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  geo.computeVertexNormals();
  const nrm = geo.attributes.normal;
  const colors = new Float32Array(nrm.count * 3);
  for (let i = 0; i < nrm.count; i++) {
    const nd = nrm.getX(i) * KEY.x + nrm.getY(i) * KEY.y + nrm.getZ(i) * KEY.z;
    const w = 0.4 + Math.max(0, nd) * 0.78;
    colors[i * 3] = w;
    colors[i * 3 + 1] = w;
    colors[i * 3 + 2] = w;
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return geo;
}

function hexPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function armorMap(accent: string, dark: boolean): THREE.CanvasTexture {
  const key = `a:${accent}:${dark ? "d" : "l"}`;
  const hit = maps.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = dark ? "#3c444e" : "#6a7380";
  ctx.fillRect(0, 0, 256, 256);
  const R = 30;
  for (let row = -1; row < 12; row++) {
    for (let col = -1; col < 12; col++) {
      const x = col * R * 1.74 + (row % 2) * R * 0.87;
      const y = row * R * 1.5;
      hexPath(ctx, x, y, R * 0.78);
      ctx.fillStyle = dark ? "#2c333c" : "#565e6a";
      ctx.globalAlpha = 0.55;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3.2;
      ctx.stroke();
    }
  }
  ctx.fillStyle = accent;
  for (let i = 0; i < 48; i++) {
    ctx.beginPath();
    ctx.arc((i * 53) % 256, (i * 97) % 256, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  maps.set(key, tex);
  return tex;
}

function circuitMap(accent: string): THREE.CanvasTexture {
  const key = `c:${accent}`;
  const hit = maps.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#2a313a";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.4;
  ctx.globalAlpha = 0.95;
  for (let i = 0; i < 8; i++) {
    const y = 18 + i * 30;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(40 + i * 8, y);
    ctx.lineTo(56 + i * 8, y + ((i % 2) * 2 - 1) * 16);
    ctx.lineTo(256, y + ((i % 2) * 2 - 1) * 16);
    ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const x = 28 + i * 40;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 80 + i * 10);
    ctx.lineTo(x + 18, 98 + i * 10);
    ctx.lineTo(x + 18, 256);
    ctx.stroke();
  }
  ctx.fillStyle = accent;
  for (let i = 0; i < 18; i++) {
    ctx.fillRect((i * 41) % 240 + 6, (i * 73) % 240 + 6, 7, 7);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  maps.set(key, tex);
  return tex;
}

export function armor(accent: string, dark = false): THREE.MeshBasicMaterial {
  const key = `m:${accent}:${dark ? "d" : "l"}`;
  const hit = mats.get(key);
  if (hit) return hit;
  const m = new THREE.MeshBasicMaterial({ map: armorMap(accent, dark), vertexColors: true });
  mats.set(key, m);
  return m;
}

export function circuit(accent: string): THREE.MeshBasicMaterial {
  const key = `mc:${accent}`;
  const hit = mats.get(key);
  if (hit) return hit;
  const m = new THREE.MeshBasicMaterial({ map: circuitMap(accent), vertexColors: true });
  mats.set(key, m);
  return m;
}

export function seamMat(accent: string): THREE.MeshBasicMaterial {
  const key = `s:${accent}`;
  const hit = mats.get(key);
  if (hit) return hit;
  const m = new THREE.MeshBasicMaterial({ color: accent });
  mats.set(key, m);
  return m;
}

export function visorMat(accent: string): THREE.MeshBasicMaterial {
  const key = `v:${accent}`;
  const hit = mats.get(key);
  if (hit) return hit;
  const m = new THREE.MeshBasicMaterial({ color: accent });
  mats.set(key, m);
  return m;
}

export function slitMat(): THREE.MeshBasicMaterial {
  const key = "slit";
  const hit = mats.get(key);
  if (hit) return hit;
  const m = new THREE.MeshBasicMaterial({ color: "#0a0d12" });
  mats.set(key, m);
  return m;
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): THREE.Mesh {
  const m = new THREE.Mesh(lightGeo(geo), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Hex armor volume — warrior torso language. */
export function hexHull(
  r0: number,
  r1: number,
  h: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  ry = 0,
): THREE.Mesh {
  return mesh(new THREE.CylinderGeometry(r1, r0, h, 6, 3), mat, x, y, z, 0, ry, 0);
}

export function capsule(
  r: number,
  len: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  rx = 0,
  rz = 0,
): THREE.Mesh {
  return mesh(new THREE.CapsuleGeometry(r, len, 6, 10), mat, x, y, z, rx, 0, rz);
}

export function roundBox(
  w: number,
  h: number,
  d: number,
  r: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
): THREE.Mesh {
  return mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, x, y, z, rx, ry, rz);
}

export function lathe(pts: [number, number][], mat: THREE.Material, x: number, y: number, z: number, segs = 16): THREE.Mesh {
  const v = pts.map(([px, py]) => new THREE.Vector2(px, py));
  return mesh(new THREE.LatheGeometry(v, segs), mat, x, y, z);
}

export function hexPlate(r: number, thick: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = mesh(new THREE.CylinderGeometry(r, r, thick, 6), mat, x, y, z, 0, Math.PI / 6, 0);
  return m;
}

export function seamLoop(
  w: number,
  h: number,
  radius: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
): THREE.Mesh {
  const pts: THREE.Vector3[] = [];
  const steps = 24;
  const rw = w * 0.42;
  const rh = h * 0.42;
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const cx = Math.cos(t);
    const sy = Math.sin(t);
    const k = 1 / Math.max(Math.abs(cx), Math.abs(sy));
    pts.push(new THREE.Vector3(cx * rw * k, sy * rh * k, 0));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, radius, 6, true), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, 0);
  return m;
}

export function seamLine(
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  radius: number,
  mat: THREE.Material,
): THREE.Mesh {
  const curve = new THREE.LineCurve3(new THREE.Vector3(ax, ay, az), new THREE.Vector3(bx, by, bz));
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 4, radius, 6, false), mat);
}

export function taper(
  r0: number,
  r1: number,
  h: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  rx = 0,
  rz = 0,
): THREE.Mesh {
  return mesh(new THREE.CylinderGeometry(r1, r0, h, 8, 2), mat, x, y, z, rx, 0, rz);
}
