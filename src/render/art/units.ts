/** Unused by the live WebGL board (`src/render/gl/`). Kept as a 2D fallback kit. */
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
  opts: { glow?: boolean; hp?: number; maxHp?: number; hidden?: boolean; badgeScale?: number; hopArc?: number },
): void {
  const p = iso(x, y);
  const badge = opts.badgeScale ?? 1;
  ctx.save();
  ctx.translate(p.x, p.y - 16 - (opts.hopArc ?? 0));
  ctx.scale(1.42, 1.42);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(0, 16, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (opts.hidden) ctx.globalAlpha = 0.35;
  if (opts.glow) {
    const pulse = 0.55 + Math.sin((typeof performance !== "undefined" ? performance.now() : 0) * 0.01) * 0.25;
    ctx.shadowColor = "#3df6ff";
    ctx.shadowBlur = 22;
    ctx.strokeStyle = `rgba(80, 240, 255, ${pulse})`;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.ellipse(0, 13, 20, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#b8ffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 13, 14, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  if (type === "skiff" || type === "hoverScout" || type === "hullRam" || type === "depthBomber" || type === "leviathan" || type === "ghostSkiff") {
    drawNaval(ctx, type, color);
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-12, 13);
    ctx.lineTo(-9, -3);
    ctx.lineTo(9, -3);
    ctx.lineTo(12, 13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shade(color, 0.55);
    ctx.beginPath();
    ctx.moveTo(-6, 13);
    ctx.lineTo(0, 2);
    ctx.lineTo(6, 13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shade(color, 0.75);
    ctx.fillRect(-7, 2, 14, 6);
    drawHelmet(ctx, faction, 0, -11, 1.08);
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
    ctx.save();
    ctx.scale(badge, badge);
    drawHp(ctx, -18, -28, opts.hp, opts.maxHp);
    drawTypeIcon(ctx, 14, -28, type);
    ctx.restore();
  }
  ctx.restore();
}

function drawNaval(ctx: CanvasRenderingContext2D, type: UnitType, color: string): void {
  const t = typeof performance !== "undefined" ? performance.now() : 0;
  const wake = 0.35 + Math.sin(t * 0.008) * 0.2;
  ctx.save();
  ctx.globalAlpha = 0.35 + wake;
  ctx.strokeStyle = "#9ee8ff";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 16, 22 + wake * 6, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 18, 14, 3.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = shade(color, 0.45);
  ctx.beginPath();
  ctx.moveTo(-20, 10);
  ctx.quadraticCurveTo(0, 18, 22, 10);
  ctx.quadraticCurveTo(0, 6, -20, 10);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-16, 8);
  ctx.lineTo(-10, -2);
  ctx.lineTo(12, -2);
  ctx.lineTo(20, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(color, 1.15);
  ctx.fillRect(-8, -6, 16, 6);
  ctx.fillStyle = shade(color, 0.7);
  ctx.fillRect(-6, 2, 12, 4);

  ctx.shadowColor = "#7ffff6";
  ctx.shadowBlur = 10 + Math.sin(t * 0.01) * 4;
  ctx.fillStyle = `rgba(140,255,255,${0.45 + wake})`;
  ctx.beginPath();
  ctx.arc(-12, 8, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  if (type === "hoverScout") {
    ctx.fillStyle = "#e8f6ff";
    ctx.fillRect(-2, -20, 3, 16);
    ctx.beginPath();
    ctx.moveTo(1, -20);
    ctx.lineTo(14, -8);
    ctx.lineTo(1, -6);
    ctx.closePath();
    ctx.fill();
  }
  if (type === "hullRam") {
    ctx.fillStyle = "#d8dde4";
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(28, 8);
    ctx.lineTo(16, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shade(color, 0.8);
    ctx.fillRect(-4, -10, 10, 6);
  }
  if (type === "depthBomber") {
    ctx.fillStyle = "#222";
    ctx.fillRect(-14, -12, 10, 10);
    ctx.fillStyle = "#f6d76e";
    ctx.beginPath();
    ctx.arc(-9, -7, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(color, 0.6);
    ctx.fillRect(4, -8, 10, 5);
  }
  if (type === "leviathan") {
    ctx.fillStyle = color;
    ctx.fillRect(-20, -10, 40, 20);
    ctx.fillStyle = shade(color, 1.2);
    ctx.fillRect(-8, -18, 16, 10);
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#f5d76e";
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(5, -16);
    ctx.lineTo(-5, -16);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  if (type === "ghostSkiff") {
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "#c8f6ff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 4, 18, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
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
