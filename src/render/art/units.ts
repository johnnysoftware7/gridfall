import type { FactionId, UnitType } from "../../engine/types";
import { iso } from "../iso";
import { drawHelmet } from "./helmets";

export function drawUnit(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: UnitType,
  color: string,
  faction: FactionId,
  opts: { glow?: boolean; hp?: number; maxHp?: number; hidden?: boolean },
): void {
  const p = iso(x, y);
  ctx.save();
  ctx.translate(p.x, p.y - 14);
  ctx.scale(1.25, 1.25);
  if (opts.hidden) ctx.globalAlpha = 0.35;
  if (opts.glow) {
    ctx.shadowColor = "#5ef6ff";
    ctx.shadowBlur = 14;
    ctx.strokeStyle = "#5ef6ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 10, 16, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  if (type === "skiff" || type === "hoverScout" || type === "hullRam" || type === "depthBomber" || type === "leviathan" || type === "ghostSkiff") {
    drawNaval(ctx, type, color);
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-11, 12);
    ctx.lineTo(-8, -2);
    ctx.lineTo(8, -2);
    ctx.lineTo(11, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shade(color, 0.75);
    ctx.fillRect(-7, 2, 14, 6);
    drawHelmet(ctx, faction, 0, -10, 1);
    if (type === "marksman") {
      ctx.fillStyle = "#222";
      ctx.fillRect(8, -6, 10, 2);
    }
    if (type === "railgun") {
      ctx.fillStyle = "#333";
      ctx.fillRect(-16, 4, 14, 4);
    }
    if (type === "lancer") {
      ctx.fillStyle = shade(color, 0.6);
      ctx.fillRect(-14, 8, 28, 6);
      ctx.fillStyle = "#ddd";
      ctx.fillRect(8, -14, 3, 18);
    }
    if (type === "titan") {
      ctx.fillStyle = color;
      ctx.fillRect(-14, -8, 28, 22);
      ctx.fillStyle = shade(color, 1.2);
      ctx.fillRect(-6, -18, 12, 10);
    }
    if (type === "bulwark") {
      ctx.fillStyle = "#cfd6e0";
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(0, -6);
      ctx.lineTo(12, 0);
      ctx.lineTo(0, 8);
      ctx.closePath();
      ctx.fill();
    }
    if (type === "netrunner") {
      ctx.strokeStyle = "#9cf";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -4, 10, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  if (opts.hp !== undefined && opts.maxHp !== undefined) {
    drawHp(ctx, -18, -28, opts.hp, opts.maxHp);
    drawTypeIcon(ctx, 14, -28, type);
  }
  ctx.restore();
}

function drawNaval(ctx: CanvasRenderingContext2D, type: UnitType, color: string): void {
  ctx.fillStyle = shade(color, 0.7);
  ctx.beginPath();
  ctx.ellipse(0, 10, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(-8, -4, 16, 12);
  if (type === "hoverScout") {
    ctx.fillStyle = "#e8f6ff";
    ctx.fillRect(-2, -14, 4, 12);
  }
  if (type === "hullRam") {
    ctx.fillStyle = "#ccc";
    ctx.beginPath();
    ctx.moveTo(8, 4);
    ctx.lineTo(22, 8);
    ctx.lineTo(8, 12);
    ctx.fill();
  }
  if (type === "depthBomber") {
    ctx.fillStyle = "#333";
    ctx.fillRect(-12, -8, 8, 8);
  }
  if (type === "leviathan") {
    ctx.fillStyle = color;
    ctx.fillRect(-16, -8, 32, 18);
  }
}

function drawHp(ctx: CanvasRenderingContext2D, x: number, y: number, hp: number, max: number): void {
  ctx.fillStyle = "#f4f4f4";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 12, y + 3);
  ctx.lineTo(x + 12, y + 14);
  ctx.lineTo(x, y + 17);
  ctx.lineTo(x - 4, y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.font = "bold 9px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(Math.max(0, Math.ceil(hp))), x + 5, y + 12);
  void max;
}

function drawTypeIcon(ctx: CanvasRenderingContext2D, x: number, y: number, type: UnitType): void {
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(x, y + 8, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "9px system-ui";
  ctx.textAlign = "center";
  const glyph: Record<string, string> = {
    trooper: "T", skimmer: "S", marksman: "M", bulwark: "B", vanguard: "V",
    railgun: "R", lancer: "L", netrunner: "N", titan: "Ω", phantom: "P",
    blade: "k", skiff: "~", hoverScout: "h", hullRam: "H", depthBomber: "D",
    leviathan: "Ξ", ghostSkiff: "g",
  };
  ctx.fillText(glyph[type] ?? "?", x, y + 11);
}

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
  const b = Math.min(255, Math.round((n & 255) * f));
  return `rgb(${r},${g},${b})`;
}
