import { fx } from "../fx";

export function drawStarfield(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, skipBg = false): void {
  const t = fx.now || (typeof performance !== "undefined" ? performance.now() : 0);
  if (!skipBg) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#02040c");
    g.addColorStop(0.55, "#000");
    g.addColorStop(1, "#031018");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  for (let i = 0; i < 180; i++) {
    const x = ((seed * 17 + i * 97) % 1000) / 1000 * w;
    const y = ((seed * 31 + i * 53) % 1000) / 1000 * h;
    const tw = 0.35 + Math.sin(t * 0.002 + i) * 0.25 + ((i * 13) % 70) / 140;
    ctx.fillStyle = i % 11 === 0 ? `rgba(140,220,255,${tw})` : `rgba(255,255,255,${tw})`;
    const s = i % 9 === 0 ? 2.2 : 1;
    ctx.fillRect(x, y, s, s);
  }
}
