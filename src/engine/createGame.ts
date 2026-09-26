import { generateMap, revealAroundUnits } from "./mapgen";
import { playerIncome } from "./queries";
import type { GameState, NewGameOpts } from "./types";

export function createGame(opts: NewGameOpts): GameState {
  const state = generateMap(opts);
  revealAroundUnits(state);
  for (const p of state.players) {
    const inc = playerIncome(state, p.id);
    p.energy += inc;
    p.energyPeak = Math.max(p.energyPeak, p.energy);
  }
  return state;
}
