import * as THREE from "three";

/** Authored extruded armor plates + emissive seam tubes. Not box/sphere kits. */

export function armorMat(color = "#2a3038"): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.84,
    roughness: 0.26,
    emissive: "#1a1e24",
    emissiveIntensity: 0.45,
    envMapIntensity: 1.15,
  });
}

export function seamMat(accent: string): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color: accent });
}

export function visorMat(accent: string): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color: accent });
}

function roundedRect(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  const rr = Math.min(r, w * 0.45, h * 0.45);
  s.moveTo(x + rr, y);
  s.lineTo(x + w - rr, y);
  s.quadraticCurveTo(x + w, y, x + w, y + rr);
  s.lineTo(x + w, y + h - rr);
  s.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  s.lineTo(x + rr, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - rr);
  s.lineTo(x, y + rr);
  s.quadraticCurveTo(x, y, x + rr, y);
  return s;
}

export function plate(
  w: number,
  h: number,
  thick: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
): THREE.Mesh {
  const geo = new THREE.ExtrudeGeometry(roundedRect(w, h, Math.min(w, h) * 0.16), {
    depth: thick,
    bevelEnabled: true,
    bevelThickness: thick * 0.22,
    bevelSize: Math.min(w, h) * 0.07,
    bevelSegments: 2,
    curveSegments: 6,
  });
  geo.center();
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function hexPlate(
  r: number,
  thick: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
): THREE.Mesh {
  const s = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) s.moveTo(px, py);
    else s.lineTo(px, py);
  }
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: thick,
    bevelEnabled: true,
    bevelThickness: thick * 0.2,
    bevelSize: r * 0.06,
    bevelSegments: 2,
  });
  geo.center();
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.x = -Math.PI / 2;
  m.castShadow = true;
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
  const steps = 20;
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
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, radius, 5, true), mat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, 0);
  return mesh;
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
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 4, radius, 5, false), mat);
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
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, 8), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, 0, rz);
  m.castShadow = true;
  return m;
}
