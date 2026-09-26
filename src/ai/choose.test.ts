import { describe, expect, it } from "vitest";
import { aggression } from "./choose";
import { createGame } from "../engine/createGame";

describe("mid-late aggression", () => {
  it("scales up after turn 8 and 15", () => {
    const g = createGame({
      seed: 3100,
      size: 14,
      mode: "perfection",
      humanFaction: "helix",
      aiCount: 1,
      difficulty: "normal",
    });
    g.currentPlayer = 1;
    g.turn = 1;
    const early = aggression(g);
    g.turn = 9;
    const mid = aggression(g);
    g.turn = 16;
    const late = aggression(g);
    expect(mid).toBeGreaterThan(early);
    expect(late).toBeGreaterThan(mid);
  });
});
