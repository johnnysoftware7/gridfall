export interface Particle {
  gx: number;
  gy: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  max: number;
  color: string;
  size: number;
  kind: "spark" | "ring" | "text" | "square" | "skull";
  text?: string;
}

export interface Hop {
  id: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  t0: number;
  dur: number;
}

export const fx = {
  particles: [] as Particle[],
  hops: [] as Hop[],
  shake: 0,
  flash: 0,
  now: 0,
  trauma: 0,
  hitStop: 0,
  punchZoom: 0,
};

export function tickFx(dt: number): void {
  fx.trauma = Math.max(0, fx.trauma - dt * 0.0015);
  fx.hitStop = Math.max(0, fx.hitStop - dt);
  fx.punchZoom = Math.max(0, fx.punchZoom - dt * 0.0045);
  fx.shake = fx.trauma * fx.trauma;
  fx.flash = Math.max(0, fx.flash - dt * 0.004);
  fx.hops = fx.hops.filter((h) => fx.now - h.t0 < h.dur + 40);
  fx.particles = fx.particles.filter((p) => {
    p.life -= dt;
    p.x += p.vx * dt * 0.06;
    p.y += p.vy * dt * 0.06;
    p.z += p.vz * dt * 0.06;
    p.vy -= dt * 0.00018;
    return p.life > 0;
  });
}

export function addTrauma(amount: number): void {
  fx.trauma = Math.min(1, fx.trauma + amount);
}

export function hitStop(ms: number): void {
  fx.hitStop = Math.max(fx.hitStop, ms);
}

export function punchIn(): void {
  fx.punchZoom = Math.max(fx.punchZoom, 1);
}

export function burst(tx: number, ty: number, color: string, n = 48): void {
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const r = 0.06 + (i % 6) * 0.05;
    fx.particles.push({
      gx: tx,
      gy: ty,
      x: Math.cos(a) * r,
      y: 0.45 + (i % 4) * 0.08,
      z: Math.sin(a) * r,
      vx: Math.cos(a) * (0.55 + Math.random() * 0.75),
      vy: 0.4 + Math.random() * 0.65,
      vz: Math.sin(a) * (0.55 + Math.random() * 0.75),
      life: 1000 + Math.random() * 500,
      max: 1500,
      color: i % 3 === 0 ? "#ffe14a" : i % 3 === 1 ? "#ff6a3a" : color,
      size: 10 + Math.random() * 8,
      kind: "square",
    });
  }
}

/** 8–15 sparks along the impact normal ±25°. */
export function sparks(tx: number, ty: number, dx: number, dy: number, n = 12): void {
  const len = Math.hypot(dx, dy) || 1;
  const nx = dx / len;
  const ny = dy / len;
  const base = Math.atan2(ny, nx);
  for (let i = 0; i < n; i++) {
    const a = base + (Math.random() - 0.5) * 0.87;
    const spd = 0.55 + Math.random() * 0.7;
    fx.particles.push({
      gx: tx,
      gy: ty,
      x: nx * 0.08,
      y: 0.5,
      z: ny * 0.08,
      vx: Math.cos(a) * spd,
      vy: 0.25 + Math.random() * 0.35,
      vz: Math.sin(a) * spd,
      life: 280 + Math.random() * 120,
      max: 400,
      color: i % 2 === 0 ? "#ffe14a" : "#ff6a3a",
      size: 8,
      kind: "spark",
    });
  }
}

export function floatText(tx: number, ty: number, text: string, color: string): void {
  fx.particles.push({
    gx: tx,
    gy: ty,
    x: (Math.random() - 0.5) * 0.16,
    y: 1.1,
    z: (Math.random() - 0.5) * 0.16,
    vx: 0,
    vy: 0.42,
    vz: 0,
    life: 700,
    max: 700,
    color,
    size: text.includes("☠") ? 40 : 32,
    kind: text.includes("☠") ? "skull" : "text",
    text,
  });
}

export function killMark(tx: number, ty: number): void {
  floatText(tx, ty, "☠", "#ff4d3a");
  burst(tx, ty, "#ff6a3a", 36);
}

export function punch(amount = 5): void {
  addTrauma(Math.min(0.5, amount * 0.06));
  fx.flash = Math.max(fx.flash, 0.22);
}

export function startHop(id: string, x0: number, y0: number, x1: number, y1: number, dur = 260): void {
  fx.hops = fx.hops.filter((h) => h.id !== id);
  fx.hops.push({ id, x0, y0, x1, y1, t0: fx.now || (typeof performance !== "undefined" ? performance.now() : 0), dur });
}

export function hopAt(id: string): { x: number; y: number; arc: number } | null {
  const h = fx.hops.find((x) => x.id === id);
  if (!h) return null;
  const t = (fx.now - h.t0) / h.dur;
  if (t >= 1 || t < 0) return null;
  const e = 1 - (1 - t) * (1 - t);
  return {
    x: h.x0 + (h.x1 - h.x0) * e,
    y: h.y0 + (h.y1 - h.y0) * e,
    arc: Math.sin(Math.min(1, t) * Math.PI) * 12,
  };
}

export function shakeOffset(t: number): { x: number; y: number } {
  const s = fx.trauma * fx.trauma;
  if (s <= 0.001) return { x: 0, y: 0 };
  return {
    x: s * 0.11 * Math.sin(t * 0.025 * 25 + 1.7) * Math.cos(t * 0.017 * 25),
    y: s * 0.11 * Math.sin(t * 0.021 * 25 + 4.2) * Math.cos(t * 0.019 * 25 + 2),
  };
}

export function drawFx(): void {
  /* 3D path consumes particles in view.ts / overlay */
}
