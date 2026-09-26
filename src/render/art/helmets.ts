import type { FactionId } from "../../engine/types";

export function drawHelmet(ctx: CanvasRenderingContext2D, id: FactionId, x: number, y: number, s: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = "#f3d7b0";
  ctx.beginPath();
  ctx.arc(0, 4, 5, 0, Math.PI * 2);
  ctx.fill();
  if (id === "helix") {
    ctx.fillStyle = "#2ec4b6";
    ctx.beginPath();
    ctx.arc(0, -2, 8, Math.PI, 0);
    ctx.lineTo(7, 4);
    ctx.lineTo(-7, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#1a8c82";
    ctx.fillRect(-2, -10, 4, 6);
  } else if (id === "meridian") {
    ctx.fillStyle = "#e07a3d";
    ctx.beginPath();
    ctx.moveTo(-8, 4);
    ctx.lineTo(-6, -8);
    ctx.lineTo(0, -4);
    ctx.lineTo(6, -8);
    ctx.lineTo(8, 4);
    ctx.closePath();
    ctx.fill();
  } else if (id === "tide") {
    ctx.fillStyle = "#3d7ee0";
    ctx.beginPath();
    ctx.arc(0, 0, 8, Math.PI, 0);
    ctx.lineTo(8, 5);
    ctx.lineTo(-8, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#0b1e40";
    ctx.fillRect(-8, -1, 16, 3);
  } else if (id === "ashfall") {
    ctx.fillStyle = "#e03d3d";
    ctx.beginPath();
    ctx.moveTo(-9, 5);
    ctx.lineTo(-4, -6);
    ctx.lineTo(0, -2);
    ctx.lineTo(4, -10);
    ctx.lineTo(9, 5);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = "#3db85a";
    ctx.beginPath();
    ctx.arc(0, 0, 8, Math.PI * 1.1, -0.1);
    ctx.lineTo(7, 5);
    ctx.lineTo(-7, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#1a5c2a";
    ctx.beginPath();
    ctx.ellipse(0, -8, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawHelmetMedallion(ctx: CanvasRenderingContext2D, id: FactionId, x: number, y: number, r: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#f7f7f7";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#4aa3ff";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 8, r * 0.72, Math.PI, 0);
  ctx.fill();
  drawHelmet(ctx, id, 0, -4, r / 18);
  ctx.restore();
}

export function drawSpire(ctx: CanvasRenderingContext2D, faction: FactionId, x: number, y: number, capital: boolean, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#d8d2c8";
  ctx.beginPath();
  ctx.moveTo(-14, 10);
  ctx.lineTo(-8, -6);
  ctx.lineTo(8, -6);
  ctx.lineTo(14, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-6, -6);
  ctx.lineTo(0, capital ? -34 : -22);
  ctx.lineTo(6, -6);
  ctx.closePath();
  ctx.fill();
  if (capital) {
    ctx.fillStyle = "#f5d76e";
    ctx.beginPath();
    ctx.moveTo(0, -38);
    ctx.lineTo(4, -32);
    ctx.lineTo(-4, -32);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#eee";
  ctx.fillRect(-3, -4, 6, 8);
  void faction;
  ctx.restore();
}
