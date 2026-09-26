import { describe, expect, it } from "vitest";
import { gameRound, previewCombat } from "./combat";

describe("combat formula", () => {
  it("Trooper -> Trooper: 5 and 5", () => {
    const r = previewCombat({ attack: 2, hp: 10, maxHp: 10 }, { defense: 2, hp: 10, maxHp: 10 }, 1);
    expect(r.attackResult).toBe(5);
    expect(r.defenseResult).toBe(5);
  });

  it("Trooper -> Marksman: 6 and 2", () => {
    const r = previewCombat({ attack: 2, hp: 10, maxHp: 10 }, { defense: 1, hp: 10, maxHp: 10 }, 1);
    expect(r.attackResult).toBe(6);
    expect(r.defenseResult).toBe(2);
  });

  it("Vanguard -> Skimmer: 10, kill, 0 back", () => {
    const r = previewCombat({ attack: 3, hp: 15, maxHp: 15 }, { defense: 1, hp: 10, maxHp: 10 }, 1);
    expect(r.attackResult).toBe(10);
    expect(r.defenderDies).toBe(true);
    expect(r.defenseResult === 0 || r.defenderDies).toBe(true);
  });

  it("defence bonus 1.5 reduces incoming vs full Trooper", () => {
    const none = previewCombat({ attack: 2, hp: 10, maxHp: 10 }, { defense: 2, hp: 10, maxHp: 10 }, 1);
    const bonus = previewCombat({ attack: 2, hp: 10, maxHp: 10 }, { defense: 2, hp: 10, maxHp: 10 }, 1.5);
    expect(bonus.attackResult).toBeLessThan(none.attackResult);
    expect(bonus.defenseResult).toBeGreaterThanOrEqual(none.defenseResult);
  });

  it("defence bonus 4 (wall) is much stronger", () => {
    const wall = previewCombat({ attack: 2, hp: 10, maxHp: 10 }, { defense: 2, hp: 10, maxHp: 10 }, 4);
    expect(wall.attackResult).toBeLessThanOrEqual(2);
    expect(wall.defenseResult).toBeGreaterThanOrEqual(7);
  });

  it("half-up rounding", () => {
    expect(gameRound(4.5)).toBe(5);
    expect(gameRound(1.5)).toBe(2);
    expect(gameRound(2.25)).toBe(2);
  });
});
