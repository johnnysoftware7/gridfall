import type { Terrain } from "../../engine/types";
import { TILE_H, TILE_W } from "../../data/constants";
import { diamond, iso, thickness } from "../iso";

export const TERRAIN_FILL: Record<Terrain, string> = {
  plain: "#7cb86a",
  forest: "#2f6b3a",
  ridge: "#8b8f99",
  shelf: "#3ec6e0",
  deep: "#1b6f9c",
};

export function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  terrain: Terrain,
  edge: boolean,
): void {
  if (edge) {
    if (terrain === "shelf" || terrain === "deep") {
      thickness(ctx, x, y, "#0b3a58", "#0e4a6e", 14);
    } else {
      thickness(ctx, x, y, "#4a3420", "#6a4a28", 16);
    }
  }
  let fill = TERRAIN_FILL[terrain];
  if (terrain === "plain") fill = shade(x, y, "#6db05c", "#88c46f");
  if (terrain === "forest") fill = shade(x, y, "#245a30", "#357544");
  if (terrain === "ridge") fill = shade(x, y, "#7d828c", "#9aa0aa");
  if (terrain === "shelf") fill = shade(x, y, "#2eb8d4", "#5ad4ea");
  if (terrain === "deep") fill = shade(x, y, "#155e88", "#1f7aa8");
  diamond(ctx, x, y, fill, "rgba(0,0,0,0.08)");
  if (terrain === "shelf") {
    const p = iso(x, y);
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(p.x - 16, p.y);
    ctx.lineTo(p.x, p.y - 8);
    ctx.stroke();
  }
}

function shade(x: number, y: number, a: string, b: string): string {
  return (x + y) % 2 === 0 ? a : b;
}

export function drawFog(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const p = iso(x, y);
  ctx.save();
  ctx.translate(p.x, p.y - 8);
  // raised white holographic block (scanlines, slight cyan)
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "#eef6ff";
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(22, -6);
  ctx.lineTo(0, 6);
  ctx.lineTo(-22, -6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#c5d4e4";
  ctx.beginPath();
  ctx.moveTo(-22, -6);
  ctx.lineTo(0, 6);
  ctx.lineTo(0, 16);
  ctx.lineTo(-22, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#d8e4f0";
  ctx.beginPath();
  ctx.moveTo(22, -6);
  ctx.lineTo(0, 6);
  ctx.lineTo(0, 16);
  ctx.lineTo(22, 4);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#7fd7ff";
  for (let i = -14; i < 8; i += 3) {
    ctx.fillRect(-18, i, 36, 1.2);
  }
  ctx.restore();
}

export function drawResource(ctx: CanvasRenderingContext2D, x: number, y: number, kind: string): void {
  const p = iso(x, y);
  ctx.save();
  ctx.translate(p.x, p.y - 6);
  if (kind === "spore") {
    ctx.fillStyle = "#c6ff4a";
    blob(ctx, -4, 0, 5);
    blob(ctx, 5, -3, 4);
    ctx.fillStyle = "#7cffd2";
    blob(ctx, 1, 4, 3);
  } else if (kind === "grain") {
    ctx.fillStyle = "#e8d24a";
    ctx.fillRect(-8, -2, 16, 5);
    ctx.fillStyle = "#f4e88a";
    ctx.fillRect(-6, -5, 12, 3);
  } else if (kind === "fauna") {
    ctx.fillStyle = "#d9c4a0";
    ctx.beginPath();
    ctx.ellipse(0, 2, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(7, -2, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "ore") {
    ctx.fillStyle = "#ff8a3d";
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(7, 4);
    ctx.lineTo(-7, 4);
    ctx.closePath();
    ctx.fill();
  } else if (kind === "plankton") {
    ctx.fillStyle = "#7cffea";
    blob(ctx, -3, 2, 4);
    blob(ctx, 4, 0, 3);
  } else if (kind === "starfish") {
    ctx.fillStyle = "#ffe14a";
    star(ctx, 0, 0, 7, 5);
  }
  ctx.restore();
}

function blob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, n: number): void {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const ang = (i * Math.PI) / n - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(ang) * rad;
    const py = y + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

export function drawRidge(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const p = iso(x, y);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = "#b8c0d0";
  ctx.beginPath();
  ctx.moveTo(-10, 6);
  ctx.lineTo(0, -22);
  ctx.lineTo(12, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#9ad8ff";
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(6, -6);
  ctx.lineTo(0, -4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawForest(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  const p = iso(x, y);
  ctx.save();
  ctx.translate(p.x, p.y);
  for (const [dx, dy, h, w] of [[-8, 4, 16, 5], [4, 6, 20, 6], [10, 2, 12, 4]] as const) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(dx, dy);
    ctx.lineTo(dx + w / 2, dy - h);
    ctx.lineTo(dx + w, dy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(80,255,200,0.45)";
    ctx.fillRect(dx + w / 2 - 1, dy - h, 2, 5);
  }
  ctx.restore();
}

export function drawRoad(ctx: CanvasRenderingContext2D, x: number, y: number, links: { x: number; y: number }[]): void {
  const p = iso(x, y);
  ctx.save();
  ctx.strokeStyle = "#7cf0ff";
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 4]);
  ctx.shadowColor = "#3cf";
  ctx.shadowBlur = 6;
  for (const l of links) {
    if (l.x + l.y * 100 <= x + y * 100) continue;
    const q = iso(l.x, l.y);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawFence(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, edges: boolean[]): void {
  const p = iso(x, y);
  const pts = [
    { x: p.x, y: p.y - TILE_H / 2 },
    { x: p.x + TILE_W / 2, y: p.y },
    { x: p.x, y: p.y + TILE_H / 2 },
    { x: p.x - TILE_W / 2, y: p.y },
  ];
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([5, 4]);
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 4; i++) {
    if (!edges[i]) continue;
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawRuin(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const p = iso(x, y);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = "#6a7080";
  ctx.fillRect(-7, -4, 8, 10);
  ctx.fillRect(1, -8, 6, 14);
  ctx.fillStyle = "#9ad";
  ctx.globalAlpha = 0.5;
  ctx.fillRect(-2, -12, 3, 6);
  ctx.restore();
}
