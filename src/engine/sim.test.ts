import { describe, expect, it } from "vitest";
import { runAiTurn } from "../ai/choose";
import { dispatch } from "./actions";
import { createGame } from "./createGame";
import { checkInvariants } from "./invariants";
import type { FactionId } from "./types";

const SIZES = [11, 14, 16, 18];
const FACTIONS: FactionId[] = ["helix", "meridian", "tide", "ashfall", "verdant"];

describe("20 seeded AI vs AI games", () => {
  it("completes 30 turns without crash or invariant breaks", () => {
    const problems: string[] = [];
    for (let i = 0; i < 20; i++) {
      const size = SIZES[i % SIZES.length];
      const seed = 1000 + i * 17;
      const human = FACTIONS[i % FACTIONS.length];
      const aiA = FACTIONS[(i + 1) % FACTIONS.length];
      const aiB = FACTIONS[(i + 2) % FACTIONS.length];
      let g = createGame({
        seed,
        size,
        mode: "perfection",
        humanFaction: human,
        aiCount: 2,
        difficulty: "normal",
        aiFactions: [aiA, aiB],
      });
      // human is also AI-driven
      let guard = 0;
      while (!g.over && g.turn <= 30 && guard++ < 400) {
        const before = g.turn;
        const who = g.currentPlayer;
        g = runAiTurn(g);
        while (g.pendingLevelUp) {
          g = dispatch(g, { type: "levelUp", reward: g.pendingLevelUp.options[0] });
        }
        if (g.currentPlayer === who && g.turn === before) {
          g = dispatch(g, { type: "endTurn" });
        }
        const br = checkInvariants(g);
        if (br.length) {
          problems.push(`seed ${seed} turn ${g.turn}: ${br.map((b) => b.code).join(",")}`);
          break;
        }
      }
      if (g.turn < 30 && !g.over) problems.push(`seed ${seed} stalled at turn ${g.turn}`);
    }
    expect(problems).toEqual([]);
  });
});
