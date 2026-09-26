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
};

export function tickFx(dt: number): void {
  fx.shake = Math.max(0, fx.shake - dt * 0.012);
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

export function burst(tx: number, ty: number, color: string, n = 14): void {
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random();
    fx.particles.push({
      gx: tx,
      gy: ty,
      x: 0,
      y: 0.55,
      z: 0,
      vx: Math.cos(a) * (0.4 + Math.random() * 0.55),
      vy: 0.4 + Math.random() * 0.5,
      vz: Math.sin(a) * (0.4 + Math.random() * 0.55),
      life: 780 + Math.random() * 360,
      max: 1100,
      color: i % 3 === 0 ? "#ffe14a" : color,
      size: 6 + Math.random() * 5,
      kind: "square",
    });
  }
}

export function floatText(tx: number, ty: number, text: string, color: string): void {
  const skull = /^-?\d+$/.test(text) || text.includes("☠");
  fx.particles.push({
    gx: tx,
    gy: ty,
    x: 0,
    y: 1.1,
    z: 0,
    vx: 0,
    vy: 0.42,
    vz: 0,
    life: 1300,
    max: 1300,
    color,
    size: skull ? 40 : 32,
    kind: text.includes("☠") ? "skull" : "text",
    text,
  });
}

export function killMark(tx: number, ty: number): void {
  floatText(tx, ty, "☠", "#ff4d3a");
  burst(tx, ty, "#ff6a3a", 22);
}

export function punch(amount = 5): void {
  fx.shake = Math.max(fx.shake, amount);
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

export function drawFx(): void {
  /* 3D path consumes particles in view.ts / overlay */
}
