/** Unused by the live WebGL board (`src/render/gl/`). Kept as a 2D fallback kit. */
import type { FactionId } from "../../engine/types";

/** Unique low-poly helmets. Face is a peach cube; hat is faction-coloured. */
export function drawHelmet(ctx: CanvasRenderingContext2D, id: FactionId, x: number, y: number, s: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // neck / face cube
  isoBox(ctx, -5, 2, 10, 8, 7, "#f0c8a0", "#d7a57a", "#e8b88c");
  ctx.fillStyle = "#2a1c14";
  ctx.fillRect(-2.2, 5, 1.6, 1.6);
  ctx.fillRect(0.8, 5, 1.6, 1.6);

  if (id === "helix") {
    isoBox(ctx, -8, -8, 16, 10, 10, "#2ec4b6", "#1a8c82", "#3fe0d0");
    ctx.fillStyle = "#1a8c82";
    ctx.beginPath();
    ctx.moveTo(-1, -14);
    ctx.lineTo(3, -8);
    ctx.lineTo(-3, -8);
    ctx.fill();
  } else if (id === "meridian") {
    ctx.fillStyle = "#e07a3d";
    ctx.beginPath();
    ctx.moveTo(-9, 2);
    ctx.lineTo(-7, -12);
    ctx.lineTo(0, -6);
    ctx.lineTo(7, -14);
    ctx.lineTo(9, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#8a3d14";
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(7, -14);
    ctx.lineTo(9, 2);
    ctx.lineTo(2, 2);
    ctx.fill();
  } else if (id === "tide") {
    isoBox(ctx, -8, -7, 16, 9, 9, "#3d7ee0", "#1a3f80", "#6aa0ff");
    ctx.fillStyle = "#0b1e40";
    ctx.fillRect(-9, -1, 18, 3);
    ctx.fillStyle = "#fff";
    ctx.fillRect(-8, -1, 16, 1);
  } else if (id === "ashfall") {
    ctx.fillStyle = "#e03d3d";
    ctx.beginPath();
    ctx.moveTo(-10, 3);
    ctx.lineTo(-5, -8);
    ctx.lineTo(0, -3);
    ctx.lineTo(4, -13);
    ctx.lineTo(10, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#7a1515";
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(4, -13);
    ctx.lineTo(10, 3);
    ctx.fill();
  } else {
    isoBox(ctx, -8, -6, 16, 10, 8, "#3db85a", "#1a5c2a", "#62d47a");
    ctx.fillStyle = "#1a5c2a";
    ctx.beginPath();
    ctx.ellipse(0, -10, 7, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7cff9a";
    ctx.beginPath();
    ctx.ellipse(-2, -11, 2, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function isoBox(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, d: number,
  top: string, left: string, right: string,
): void {
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w, y + d / 2);
  ctx.lineTo(x + w / 2, y + d);
  ctx.lineTo(x, y + d / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = left;
  ctx.beginPath();
  ctx.moveTo(x, y + d / 2);
  ctx.lineTo(x + w / 2, y + d);
  ctx.lineTo(x + w / 2, y + d + h);
  ctx.lineTo(x, y + d / 2 + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = right;
  ctx.beginPath();
  ctx.moveTo(x + w, y + d / 2);
  ctx.lineTo(x + w / 2, y + d);
  ctx.lineTo(x + w / 2, y + d + h);
  ctx.lineTo(x + w, y + d / 2 + h);
  ctx.closePath();
  ctx.fill();
}

export function drawHelmetMedallion(ctx: CanvasRenderingContext2D, id: FactionId, x: number, y: number, r: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#f7f7f7";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#4aa3ff";
  ctx.lineWidth = Math.max(4, r * 0.1);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, r * 0.22, r * 0.78, 0.15, Math.PI - 0.15);
  ctx.fill();
  drawHelmet(ctx, id, 0, -r * 0.18, r / 16);
  ctx.restore();
}

export function drawSpire(ctx: CanvasRenderingContext2D, faction: FactionId, x: number, y: number, capital: boolean, color: string): void {
  ctx.save();
  ctx.translate(x, y);
  isoBox(ctx, -16, -4, 32, 14, 16, "#ddd6cc", "#b4aaa0", "#cfc6ba");
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-8, -6);
  ctx.lineTo(0, capital ? -40 : -26);
  ctx.lineTo(8, -6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(color, 0.7);
  ctx.beginPath();
  ctx.moveTo(0, capital ? -40 : -26);
  ctx.lineTo(8, -6);
  ctx.lineTo(4, -4);
  ctx.closePath();
  ctx.fill();
  if (capital) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#f5d76e";
    ctx.beginPath();
    ctx.moveTo(0, -46);
    ctx.lineTo(5, -38);
    ctx.lineTo(-5, -38);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  void faction;
  ctx.restore();
}

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
  const b = Math.min(255, Math.round((n & 255) * f));
  return `rgb(${r},${g},${b})`;
}
