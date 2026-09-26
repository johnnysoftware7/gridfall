import type { GameState, PlayerId } from "../engine/types";
import { iso, type Camera } from "./iso";
import { drawBoardGL, drawWorldUi, pickBoard, projectTile } from "./gl/view";

export { drawStarfield } from "./gl/starfield";
export { pickBoard, projectTile };

export function drawBoard(
  canvas: HTMLCanvasElement,
  overlay: CanvasRenderingContext2D | null,
  state: GameState,
  cam: Camera,
  view: {
    pid: PlayerId;
    selected?: string;
    moves: { x: number; y: number }[];
    attacks: { x: number; y: number }[];
    hover?: { x: number; y: number } | null;
  },
): void {
  drawBoardGL(canvas, state, cam, view);
  if (overlay) {
    const r = canvas.getBoundingClientRect();
    drawWorldUi(overlay, state, view.pid, r.width, r.height);
  }
}

export function focusCapital(state: GameState, pid: PlayerId): Camera {
  const c = state.cities.find((x) => x.owner === pid && x.isCapital) ?? state.cities.find((x) => x.owner === pid);
  if (!c) return { x: 0, y: 0, zoom: 1.55 };
  const p = iso(c.x, c.y);
  return { x: p.x, y: p.y, zoom: 1.6 };
}
