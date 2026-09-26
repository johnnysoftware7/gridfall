import { TILE_H, TILE_W } from "../data/constants";

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export function iso(x: number, y: number): { x: number; y: number } {
  return {
    x: (x - y) * (TILE_W / 2),
    y: (x + y) * (TILE_H / 2),
  };
}

export function screenToIso(sx: number, sy: number, cam: Camera, w: number, h: number): { x: number; y: number } {
  const px = (sx - w / 2) / cam.zoom + cam.x;
  const py = (sy - h / 2) / cam.zoom + cam.y;
  const gx = px / (TILE_W / 2);
  const gy = py / (TILE_H / 2);
  return {
    x: (gy + gx) / 2,
    y: (gy - gx) / 2,
  };
}

export function pickTile(sx: number, sy: number, cam: Camera, w: number, h: number, size: number): { x: number; y: number } | null {
  const p = screenToIso(sx, sy, cam, w, h);
  const x = Math.floor(p.x + 0.5);
  const y = Math.floor(p.y + 0.5);
  if (x < 0 || y < 0 || x >= size || y >= size) return null;
  return { x, y };
}

export function diamond(ctx: CanvasRenderingContext2D, x: number, y: number, fill: string, stroke?: string): void {
  const p = iso(x, y);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - TILE_H / 2);
  ctx.lineTo(p.x + TILE_W / 2, p.y);
  ctx.lineTo(p.x, p.y + TILE_H / 2);
  ctx.lineTo(p.x - TILE_W / 2, p.y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export function thickness(ctx: CanvasRenderingContext2D, x: number, y: number, left: string, right: string, depth = 12): void {
  const p = iso(x, y);
  ctx.fillStyle = left;
  ctx.beginPath();
  ctx.moveTo(p.x - TILE_W / 2, p.y);
  ctx.lineTo(p.x, p.y + TILE_H / 2);
  ctx.lineTo(p.x, p.y + TILE_H / 2 + depth);
  ctx.lineTo(p.x - TILE_W / 2, p.y + depth);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = right;
  ctx.beginPath();
  ctx.moveTo(p.x + TILE_W / 2, p.y);
  ctx.lineTo(p.x, p.y + TILE_H / 2);
  ctx.lineTo(p.x, p.y + TILE_H / 2 + depth);
  ctx.lineTo(p.x + TILE_W / 2, p.y + depth);
  ctx.closePath();
  ctx.fill();
}
