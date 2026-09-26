import * as THREE from "three";
import { FACTIONS } from "../../data/factions";
import type { FactionId } from "../../engine/types";
import { buildHero } from "./mechs";
import { factionAccent, makeDarkEnv, metal } from "./palette";

interface Hero {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  hero: THREE.Group;
  canvas: HTMLCanvasElement;
  faction: FactionId;
  mood: string;
}

const heroes = new Map<HTMLCanvasElement, Hero>();

export function paintHeroScene(canvas: HTMLCanvasElement, faction: FactionId, mood: "select" | "win" | "lose"): void {
  const fac = FACTIONS[faction];
  const accent = factionAccent(faction);
  let h = heroes.get(canvas);
  const r = canvas.getBoundingClientRect();
  const w = Math.max(1, r.width);
  const ht = Math.max(1, r.height);

  if (!h || h.canvas !== canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    scene.environment = makeDarkEnv(renderer);
    scene.environmentIntensity = 0.85;
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 80);
    h = { renderer, scene, camera, hero: new THREE.Group(), canvas, faction, mood: "" };
    heroes.set(canvas, h);
  }

  h.renderer.setSize(w, ht, false);
  h.camera.aspect = w / ht;
  h.camera.updateProjectionMatrix();
  h.camera.position.set(3.4, 2.35, 7.6);
  h.camera.lookAt(0, 1.7, 0);

  if (h.faction !== faction || h.mood !== mood) {
    h.scene.clear();
    const bg = mood === "win" ? "#180806" : mood === "lose" ? "#07040a" : "#03060c";
    h.scene.background = new THREE.Color(bg);
    h.scene.fog = new THREE.FogExp2(bg, 0.038);
    h.scene.add(new THREE.HemisphereLight(mood === "win" ? "#ffb070" : "#9ad4ff", "#08060a", 0.5));
    const key = new THREE.DirectionalLight("#fff6ea", 2.8);
    key.position.set(4, 8, 4);
    key.castShadow = true;
    h.scene.add(key);
    const fill = new THREE.DirectionalLight("#c8e8ff", 1.1);
    fill.position.set(-2, 5, 6);
    h.scene.add(fill);
    const rim = new THREE.DirectionalLight(accent, 1.35);
    rim.position.set(-6, 3.2, -2);
    h.scene.add(rim);
    hexFloor(h.scene, mood === "win" ? "#2a120e" : "#0c2030", accent);
    const mech = buildHero(faction, fac.color);
    mech.scale.setScalar(1.12);
    mech.position.set(0.05, 0.02, -0.15);
    h.scene.add(mech);
    h.hero = mech;
    h.faction = faction;
    h.mood = mood;
  }
  h.hero.rotation.y = (typeof performance !== "undefined" ? performance.now() : 0) * 0.00038;
  h.renderer.render(h.scene, h.camera);
}

function hexFloor(scene: THREE.Scene, color: string, accent: string): void {
  const mat = metal(color, 0.88, 0.16);
  const edge = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.85 });
  const hex = new THREE.CylinderGeometry(0.6, 0.6, 0.1, 6);
  hex.rotateY(Math.PI / 6);
  const edges = new THREE.EdgesGeometry(hex);
  const R = 1.08;
  for (let q = -7; q <= 7; q++) {
    for (let r = -5; r <= 3; r++) {
      const x = R * (q + r * 0.5);
      const z = R * (r * 0.866);
      const tile = new THREE.Mesh(hex, mat);
      tile.position.set(x, -0.16, z);
      tile.receiveShadow = true;
      scene.add(tile);
      const line = new THREE.LineSegments(edges, edge);
      line.position.copy(tile.position);
      scene.add(line);
    }
  }
}

export function paintMedal(canvas: HTMLCanvasElement, faction: FactionId): void {
  const fac = FACTIONS[faction];
  const accent = factionAccent(faction);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w * 0.3, h * 0.28, 4, w * 0.5, h * 0.5, w * 0.48);
  g.addColorStop(0, "#f7fbff");
  g.addColorStop(0.28, fac.color);
  g.addColorStop(0.72, "#141820");
  g.addColorStop(1, "#05070c");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 16;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#0a0d12";
  ctx.beginPath();
  ctx.moveTo(w * 0.36, h * 0.62);
  ctx.lineTo(w * 0.3, h * 0.38);
  ctx.lineTo(w * 0.42, h * 0.3);
  ctx.lineTo(w * 0.5, h * 0.26);
  ctx.lineTo(w * 0.58, h * 0.3);
  ctx.lineTo(w * 0.7, h * 0.38);
  ctx.lineTo(w * 0.64, h * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.fillRect(w * 0.4, h * 0.4, w * 0.2, 6);
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.18);
  ctx.lineTo(w * 0.56, h * 0.32);
  ctx.lineTo(w * 0.44, h * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = fac.color;
  ctx.fillRect(w * 0.34, h * 0.62, 12, 16);
  ctx.fillRect(w * 0.54, h * 0.62, 12, 16);
}
