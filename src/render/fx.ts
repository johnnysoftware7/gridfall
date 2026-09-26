import { iso } from "./iso";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  kind: "spark" | "ring" | "text";
  text?: string;
}

export const fx = {
  particles: [] as Particle[],
  shake: 0,
  flash: 0,
  now: 0,
};

export function tickFx(dt: number): void {
  fx.shake = Math.max(0, fx.shake - dt * 0.012);
  fx.flash = Math.max(0, fx.flash - dt * 0.004);
  fx.particles = fx.particles.filter((p) => {
    p.life -= dt;
    p.x += p.vx * dt * 0.06;
    p.y += p.vy * dt * 0.06;
    p.vy -= dt * 0.00025;
    return p.life > 0;
  });
}

export function burst(tx: number, ty: number, color: string, n = 10): void {
  const p = iso(tx, ty);
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random();
    fx.particles.push({
      x: p.x,
      y: p.y - 10,
      vx: Math.cos(a) * (0.6 + Math.random()),
      vy: Math.sin(a) * (0.6 + Math.random()) - 0.4,
      life: 420 + Math.random() * 280,
      max: 700,
      color,
      size: 2 + Math.random() * 2.5,
      kind: "spark",
    });
  }
  fx.particles.push({
    x: p.x, y: p.y - 8, vx: 0, vy: 0, life: 380, max: 380, color, size: 16, kind: "ring",
  });
}

export function floatText(tx: number, ty: number, text: string, color: string): void {
  const p = iso(tx, ty);
  fx.particles.push({
    x: p.x, y: p.y - 28, vx: 0, vy: -0.55, life: 900, max: 900, color, size: 14, kind: "text", text,
  });
}

export function punch(amount = 5): void {
  fx.shake = Math.max(fx.shake, amount);
  fx.flash = Math.max(fx.flash, 0.28);
}

export function drawFx(ctx: CanvasRenderingContext2D): void {
  for (const p of fx.particles) {
    const a = Math.max(0, p.life / p.max);
    ctx.save();
    ctx.globalAlpha = a;
    if (p.kind === "spark") {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "ring") {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1.2 - a), 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === "text" && p.text) {
      ctx.font = "bold 16px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,0.65)";
      ctx.lineWidth = 4;
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.restore();
  }
}
