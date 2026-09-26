import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { FACTIONS } from "../../data/factions";
import { TILE_H, TILE_W } from "../../data/constants";
import { canAct } from "../../engine/movement";
import { cityAt, tileAt } from "../../engine/queries";
import type { GameState, PlayerId } from "../../engine/types";
import type { Camera } from "../iso";
import { fx, hopAt } from "../fx";
import { buildBeacon, buildForest, buildMech, buildSpire } from "./mechs";
import { factionAccent, glow, makeDarkEnv, metal, physical, terrainLook } from "./palette";

export interface BoardView {
  pid: PlayerId;
  selected?: string;
  moves: { x: number; y: number }[];
  attacks: { x: number; y: number }[];
  hover?: { x: number; y: number } | null;
}

interface Handle {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  dir: THREE.DirectionalLight;
  tiles: THREE.Group;
  props: THREE.Group;
  actors: THREE.Group;
  marks: THREE.Group;
  fxg: THREE.Group;
  tileMesh: THREE.Mesh[];
  units: Map<string, THREE.Group>;
  size: number;
  seed: number;
  propKey: string;
}

let handle: Handle | null = null;
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const look = new THREE.Vector3();

export function attachBoard(canvas: HTMLCanvasElement): Handle {
  if (handle && handle.renderer.domElement === canvas) return handle;
  disposeBoard();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#02040a");
  scene.fog = new THREE.FogExp2("#03050c", 0.014);
  scene.environment = makeDarkEnv(renderer);
  scene.environmentIntensity = 0.75;

  const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, 0.1, 80);
  scene.add(new THREE.HemisphereLight("#6a9cff", "#100808", 0.38));
  const dir = new THREE.DirectionalLight("#fff1d6", 1.85);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.left = -18;
  dir.shadow.camera.right = 18;
  dir.shadow.camera.top = 18;
  dir.shadow.camera.bottom = -18;
  dir.shadow.camera.near = 1;
  dir.shadow.camera.far = 50;
  scene.add(dir);
  const rim = new THREE.DirectionalLight("#3d7dff", 0.7);
  rim.position.set(-8, 6, 4);
  scene.add(rim);

  const tiles = new THREE.Group();
  const props = new THREE.Group();
  const actors = new THREE.Group();
  const marks = new THREE.Group();
  const fxg = new THREE.Group();
  scene.add(tiles, props, actors, marks, fxg);
  stars(scene);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), metal("#05070c", 0.7, 0.4));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  scene.add(floor);

  handle = {
    renderer, scene, camera, dir, tiles, props, actors, marks, fxg,
    tileMesh: [], units: new Map(), size: 0, seed: -1, propKey: "",
  };
  return handle;
}

export function disposeBoard(): void {
  if (!handle) return;
  handle.renderer.dispose();
  handle = null;
}

export function drawBoardGL(canvas: HTMLCanvasElement, state: GameState, cam: Camera, view: BoardView): void {
  const h = attachBoard(canvas);
  const r = canvas.getBoundingClientRect();
  const w = Math.max(1, r.width);
  const ht = Math.max(1, r.height);
  h.renderer.setSize(w, ht, false);
  syncTiles(h, state, view.pid);
  syncProps(h, state, view.pid);
  syncUnits(h, state, view);
  syncMarks(h, view);
  syncFx(h);
  aimCamera(h, cam, w / ht, state.size);
  h.dir.position.set(look.x + 10, 14, look.z + 6);
  h.dir.target.position.copy(look);
  h.dir.target.updateMatrixWorld();
  h.renderer.render(h.scene, h.camera);
}

export function pickBoard(canvas: HTMLCanvasElement, sx: number, sy: number, size: number): { x: number; y: number } | null {
  if (!handle) return null;
  const r = canvas.getBoundingClientRect();
  ndc.x = (sx / r.width) * 2 - 1;
  ndc.y = -(sy / r.height) * 2 + 1;
  ray.setFromCamera(ndc, handle.camera);
  const hits = ray.intersectObjects(handle.tileMesh, false);
  const hit = hits[0];
  if (!hit) return null;
  const x = Math.round(hit.object.userData.tx);
  const y = Math.round(hit.object.userData.ty);
  if (x < 0 || y < 0 || x >= size || y >= size) return null;
  return { x, y };
}

export function projectTile(gx: number, gy: number, lift = 0.5): { x: number; y: number } | null {
  if (!handle) return null;
  const v = new THREE.Vector3(gx, lift, gy);
  v.project(handle.camera);
  const r = handle.renderer.domElement.getBoundingClientRect();
  return { x: (v.x * 0.5 + 0.5) * r.width, y: (-v.y * 0.5 + 0.5) * r.height };
}

function isoToGrid(cam: Camera): { x: number; y: number } {
  const gx = cam.x / (TILE_W / 2);
  const gy = cam.y / (TILE_H / 2);
  return { x: (gy + gx) / 2, y: (gy - gx) / 2 };
}

function aimCamera(h: Handle, cam: Camera, aspect: number, size: number): void {
  const g = isoToGrid(cam);
  look.set(g.x, 0, g.y);
  const dist = 11 / Math.max(0.7, cam.zoom);
  h.camera.position.set(look.x + dist, dist * 1.18, look.z + dist);
  h.camera.lookAt(look);
  const vh = (size < 13 ? 7.2 : 8.4) / Math.max(0.7, cam.zoom);
  h.camera.left = -vh * aspect * 0.5;
  h.camera.right = vh * aspect * 0.5;
  h.camera.top = vh * 0.5;
  h.camera.bottom = -vh * 0.5;
  h.camera.updateProjectionMatrix();
}

function syncTiles(h: Handle, state: GameState, pid: PlayerId): void {
  if (h.size !== state.size || h.seed !== state.seed) {
    h.tiles.clear();
    h.tileMesh = [];
    h.size = state.size;
    h.seed = state.seed;
    h.propKey = "";
    for (let y = 0; y < state.size; y++) {
      for (let x = 0; x < state.size; x++) {
        const geo = new RoundedBoxGeometry(0.94, 1, 0.94, 2, 0.07);
        const mat = physical({ color: "#222", metal: 0.6, rough: 0.3, clearcoat: 0.9 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        mesh.userData = { tx: x, ty: y };
        const cap = new THREE.Mesh(
          new RoundedBoxGeometry(0.88, 0.05, 0.88, 2, 0.06),
          physical({ color: "#333", metal: 0.82, rough: 0.1, clearcoat: 1 }),
        );
        cap.receiveShadow = true;
        mesh.add(cap);
        const fogBox = new THREE.Mesh(
          new THREE.BoxGeometry(0.96, 0.62, 0.96),
          physical({ color: "#1a1e28", metal: 0.28, rough: 0.55, opacity: 0.96, emit: "#0c1824", emitInt: 0.06 }),
        );
        fogBox.position.y = 0.55;
        fogBox.visible = false;
        mesh.add(fogBox);
        h.tiles.add(mesh);
        h.tileMesh.push(mesh);
      }
    }
  }
  const p = state.players[pid];
  const tnow = fx.now || 0;
  for (const mesh of h.tileMesh) {
    const x = mesh.userData.tx as number;
    const y = mesh.userData.ty as number;
    const t = tileAt(state, x, y)!;
    const lookT = terrainLook(t.terrain);
    const explored = p.explored[y * state.size + x];
    let top = lookT.top;
    let metalness = lookT.metal;
    let rough = lookT.rough;
    if (t.owner !== null && explored) {
      const fac = FACTIONS[state.players[t.owner].faction];
      top = mixHex("#8c90a0", fac.color, 0.18);
      metalness = 0.7;
      rough = 0.2;
    }
    const mat = mesh.material as THREE.MeshPhysicalMaterial;
    mat.color.set(explored ? top : "#2a3140");
    mat.metalness = explored ? metalness : 0.35;
    mat.roughness = explored ? rough : 0.48;
    mat.emissive.set(explored && (t.terrain === "shelf" || t.terrain === "deep") ? "#0a3040" : "#000");
    mat.emissiveIntensity = explored && (t.terrain === "shelf" || t.terrain === "deep")
      ? 0.1 + Math.sin(tnow * 0.003 + x + y) * 0.03
      : lookT.emit;
    const hgt = explored ? lookT.h : 0.62;
    mesh.scale.y = hgt;
    mesh.position.set(x, hgt / 2, y);
    const cap = mesh.children[0] as THREE.Mesh;
    const capMat = cap.material as THREE.MeshPhysicalMaterial;
    capMat.color.set(explored ? mixHex(top, "#e8eef8", 0.28) : "#080a10");
    cap.position.y = 0.5;
    cap.visible = explored;
    const fogBox = mesh.children[1] as THREE.Mesh;
    fogBox.visible = !explored;
    fogBox.position.y = 0.62;
    mesh.visible = true;
  }
}

function syncProps(h: Handle, state: GameState, pid: PlayerId): void {
  const key = propSig(state, pid);
  if (h.propKey === key) return;
  h.propKey = key;
  h.props.clear();
  const p = state.players[pid];
  for (const t of state.tiles) {
    if (!p.explored[t.y * state.size + t.x]) continue;
    const lift = terrainLook(t.terrain).h;
    if (t.terrain === "forest") {
      const col = t.owner !== null ? FACTIONS[state.players[t.owner].faction].colorDark : "#1e4a28";
      const f = buildForest(col);
      f.position.set(t.x, lift, t.y);
      h.props.add(f);
    }
    if (t.building === "dock") {
      const dock = new THREE.Mesh(new RoundedBoxGeometry(0.72, 0.08, 0.3, 1, 0.03), metal("#c9b48a", 0.45, 0.35));
      dock.position.set(t.x, lift + 0.06, t.y);
      h.props.add(dock);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 8, 16), glow("#7ecbff", 1.5));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(t.x, lift + 0.1, t.y);
      h.props.add(ring);
    } else if (t.building && (t.building === "beacon" || t.building.endsWith("Beacon"))) {
      const b = buildBeacon(t.owner !== null ? FACTIONS[state.players[t.owner].faction].color : "#e8f6ff", t.templeLevel);
      b.position.set(t.x, lift, t.y);
      h.props.add(b);
    } else if (t.building) {
      const box = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.22, 0.3, 1, 0.03), metal("#8aa", 0.55, 0.3));
      box.position.set(t.x, lift + 0.14, t.y);
      h.props.add(box);
    }
    if (t.resource && resourceSeen(state, pid, t.resource)) {
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), glow("#ffe14a", 1.8));
      gem.position.set(t.x, lift + 0.2, t.y);
      h.props.add(gem);
    }
    if (t.road || t.bridge) {
      for (const [dx, dy] of [[1, 0], [0, 1]] as const) {
        const n = tileAt(state, t.x + dx, t.y + dy);
        if (!n || !(n.road || n.bridge)) continue;
        const strip = new THREE.Mesh(new THREE.BoxGeometry(dx ? 1 : 0.14, 0.025, dy ? 1 : 0.14), glow("#6cf", 0.9));
        strip.position.set(t.x + dx * 0.5, lift + 0.02, t.y + dy * 0.5);
        h.props.add(strip);
      }
    }
    const city = cityAt(state, t.x, t.y);
    if (city) {
      const fac = city.owner !== null ? FACTIONS[state.players[city.owner].faction] : null;
      const sp = buildSpire(fac?.id ?? "helix", fac?.color ?? "#bbb", !!city.isCapital);
      sp.scale.setScalar(city.isCapital ? 1.85 : 1.4);
      sp.position.set(t.x, lift, t.y);
      h.props.add(sp);
      if (city.monument) {
        const halo = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.03, 8, 22), glow("#f5d76e", 2.2));
        halo.rotation.x = Math.PI / 2;
        halo.position.set(t.x, lift + 1.05, t.y);
        h.props.add(halo);
      }
    }
    if (t.owner !== null) {
      const fac = FACTIONS[state.players[t.owner].faction];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const n = tileAt(state, t.x + dx, t.y + dy);
        if (!n || n.owner === t.owner) continue;
        const wall = new THREE.Mesh(
          new THREE.BoxGeometry(dx === 0 ? 0.9 : 0.045, 0.11, dy === 0 ? 0.9 : 0.045),
          glow(fac.color, 1.15),
        );
        wall.position.set(t.x + dx * 0.46, lift + 0.07, t.y + dy * 0.46);
        h.props.add(wall);
      }
    }
  }
}

function propSig(state: GameState, pid: PlayerId): string {
  const p = state.players[pid];
  let s = `${state.turn}:${pid}:`;
  for (const t of state.tiles) {
    s += `${t.owner ?? "n"}${t.building ?? ""}${t.resource ?? ""}${t.road ? "r" : ""}${t.bridge ? "b" : ""}${p.explored[t.y * state.size + t.x] ? "e" : ""}`;
  }
  for (const c of state.cities) s += `${c.owner}${c.level}${c.monument ? "m" : ""}${c.wall ? "w" : ""}`;
  return s;
}

function syncUnits(h: Handle, state: GameState, view: BoardView): void {
  const live = new Set<string>();
  const p = state.players[view.pid];
  for (const u of state.units) {
    if (u.hidden && u.owner !== view.pid) continue;
    if (!p.explored[u.y * state.size + u.x]) continue;
    live.add(u.id);
    const fac = FACTIONS[state.players[u.owner].faction];
    let g = h.units.get(u.id);
    if (!g || g.userData.type !== u.type || g.userData.fac !== fac.id) {
      if (g) h.actors.remove(g);
      g = buildMech(u.type, fac.id, fac.color);
      g.userData = { type: u.type, fac: fac.id };
      h.units.set(u.id, g);
      h.actors.add(g);
    }
    const hop = hopAt(u.id);
    const x = hop ? hop.x : u.x;
    const y = hop ? hop.y : u.y;
    const tile = tileAt(state, Math.round(u.x), Math.round(u.y));
    const lift = tile ? terrainLook(tile.terrain).h : 0.36;
    g.scale.setScalar(u.type === "titan" || u.type === "leviathan" ? 2.7 : 2.45);
    g.position.set(x, lift + 0.02 + (hop ? hop.arc * 0.04 : 0), y);
    const idle = u.owner === view.pid && canAct(u);
    g.position.y += idle ? Math.sin((fx.now || 0) * 0.006 + u.x) * 0.03 : 0;
    g.visible = true;
  }
  for (const [id, g] of h.units) {
    if (!live.has(id)) {
      h.actors.remove(g);
      h.units.delete(id);
    }
  }
}

function syncMarks(h: Handle, view: BoardView): void {
  h.marks.clear();
  const pulse = 0.55 + Math.sin((fx.now || 0) * 0.008) * 0.25;
  for (const m of view.moves) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.05, 8, 24), glow("#4da3ff", 0.9 + pulse * 0.35));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(m.x, 0.44, m.y);
    h.marks.add(ring);
  }
  for (const a of view.attacks) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.055, 8, 24), glow("#ff3040", 2));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(a.x, 0.64, a.y);
    h.marks.add(ring);
    const bang = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), glow("#ff6a3a", 2.4));
    bang.position.set(a.x, 0.92, a.y);
    h.marks.add(bang);
  }
  if (view.hover) {
    const hov = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.02, 8, 20), metal("#fff", 0.25, 0.18));
    hov.rotation.x = Math.PI / 2;
    hov.position.set(view.hover.x, 0.42, view.hover.y);
    h.marks.add(hov);
  }
}

function syncFx(h: Handle): void {
  h.fxg.clear();
  for (const p of fx.particles) {
    const a = Math.max(0, p.life / p.max);
    if (p.kind === "text") continue;
    if (p.kind === "skull") {
      const skull = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), glow(p.color, 2.2 * a));
      skull.position.set(p.gx + p.x, Math.max(0.4, p.y + 0.4), p.gy + p.z);
      skull.scale.setScalar(1.1 + (1 - a) * 0.6);
      h.fxg.add(skull);
      continue;
    }
    const mat = glow(p.color, 1.6 * a);
    const mesh = p.kind === "square"
      ? new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), mat)
      : new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), mat);
    mesh.position.set(p.gx + p.x, Math.max(0.2, p.y), p.gy + p.z);
    mesh.scale.setScalar(0.85 + a);
    h.fxg.add(mesh);
  }
}

export function drawWorldUi(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  pid: PlayerId,
  w: number,
  h: number,
): void {
  ctx.clearRect(0, 0, w, h);
  ctx.textAlign = "center";
  for (const c of state.cities) {
    if (c.owner === null) continue;
    if (!state.players[pid].explored[c.y * state.size + c.x]) continue;
    const p = projectTile(c.x, c.y, 1.25);
    if (!p) continue;
    ctx.font = "600 13px system-ui";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.65)";
    ctx.fillStyle = "#fff";
    const label = `${c.isCapital ? "♛ " : ""}${c.name}`;
    ctx.strokeText(label, p.x, p.y);
    ctx.fillText(label, p.x, p.y);
  }
  for (const u of state.units) {
    if (u.hidden && u.owner !== pid) continue;
    if (!state.players[pid].explored[u.y * state.size + u.x]) continue;
    const hop = hopAt(u.id);
    const p = projectTile(hop ? hop.x : u.x, hop ? hop.y : u.y, 1.05);
    if (!p) continue;
    ctx.fillStyle = "#f4f4f4";
    roundRect(ctx, p.x - 22, p.y - 40, 18, 16, 3);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.font = "bold 11px system-ui";
    ctx.fillText(String(Math.max(0, Math.ceil(u.hp))), p.x - 13, p.y - 28);
  }
  for (const part of fx.particles) {
    if (part.kind !== "text" && part.kind !== "skull") continue;
    const p = projectTile(part.gx + part.x, part.gy + part.z, part.y + 0.35);
    if (!p || !part.text) continue;
    const a = Math.max(0, part.life / part.max);
    ctx.globalAlpha = a;
    const dmg = /^-?\d+$/.test(part.text);
    ctx.font = part.kind === "skull" ? "bold 56px system-ui" : dmg ? "800 48px system-ui" : "bold 26px system-ui";
    ctx.strokeStyle = "rgba(0,0,0,0.75)";
    ctx.lineWidth = dmg || part.kind === "skull" ? 7 : 5;
    ctx.strokeText(part.text, p.x, p.y);
    ctx.fillStyle = dmg ? "#ff5a3a" : part.color;
    ctx.fillText(part.text, p.x, p.y);
    ctx.globalAlpha = 1;
  }
  if (fx.flash > 0) {
    ctx.fillStyle = `rgba(255,230,200,${fx.flash * 0.28})`;
    ctx.fillRect(0, 0, w, h);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function resourceSeen(state: GameState, pid: PlayerId, res: string): boolean {
  const techs = state.players[pid].techs;
  if (res === "grain") return techs.includes("logistics") || techs.includes("cultivation");
  if (res === "ore") return techs.includes("ridgecraft");
  if (res === "starfish") return techs.includes("starfix") || techs.includes("aquaculture");
  return true;
}

function stars(scene: THREE.Scene): void {
  const geo = new THREE.BufferGeometry();
  const n = 520;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 90;
    pos[i * 3 + 1] = 10 + Math.random() * 36;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 90;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: "#d6eeff", size: 0.07 })));
}

function mixHex(a: string, b: string, t: number): string {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return `#${ca.lerp(cb, t).getHexString()}`;
}

void factionAccent;
