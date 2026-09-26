import { describe, expect, it } from "vitest";
import { techCost } from "../data/techs";
import { createGame } from "./createGame";
import { dispatch } from "./actions";
import { previewUnits } from "./combat";
import { popNeeded, unitCapacity } from "./queries";
import { checkInvariants } from "./invariants";

function fresh() {
  return createGame({
    seed: 42,
    size: 11,
    mode: "perfection",
    humanFaction: "helix",
    aiCount: 1,
    difficulty: "normal",
    aiFactions: ["ashfall"],
  });
}

describe("economy and tech", () => {
  it("tech cost = tier × cities + 4", () => {
    expect(techCost(1, 1, false)).toBe(5);
    expect(techCost(2, 1, false)).toBe(6);
    expect(techCost(3, 1, false)).toBe(7);
    expect(techCost(1, 3, false)).toBe(7);
    expect(techCost(2, 3, false)).toBe(10);
    expect(techCost(3, 3, true)).toBe(9);
  });

  it("level n needs n+1 pop from previous? wiki: level n needs n pop", () => {
    expect(popNeeded(1)).toBe(2);
    expect(popNeeded(2)).toBe(3);
    expect(popNeeded(4)).toBe(5);
  });

  it("unit capacity is level + 1", () => {
    expect(unitCapacity({ level: 1 } as never)).toBe(2);
    expect(unitCapacity({ level: 4 } as never)).toBe(5);
  });

  it("human capital starts with 2 energy on turn 1", () => {
    const g = fresh();
    expect(g.players[0].energy).toBeGreaterThanOrEqual(2);
  });
});

describe("skills and capture", () => {
  it("persist keeps attacking after a kill", () => {
    const g = fresh();
    const atk = g.units.find((u) => u.owner === 0)!;
    atk.type = "lancer";
    atk.hp = 10;
    atk.maxHp = 10;
    const foe = {
      id: "foe1", type: "skimmer" as const, owner: 1, x: atk.x + 1, y: atk.y,
      hp: 10, maxHp: 10, moved: false, attacked: false, acted: false,
      kills: 0, veteran: false, veteranReady: false, cityId: null,
      startX: atk.x + 1, startY: atk.y,
    };
    g.units.push(foe);
    g.players[0].explored[foe.y * g.size + foe.x] = true;
    const prev = previewUnits(g, atk, foe);
    expect(prev.defenderDies).toBe(true);
    const n = dispatch(g, { type: "attack", unitId: atk.id, targetId: foe.id });
    const live = n.units.find((u) => u.id === atk.id)!;
    expect(n.units.find((u) => u.id === "foe1")).toBeUndefined();
    expect(live.attacked).toBe(false);
  });

  it("escape lets a skimmer move after attacking", () => {
    const g = fresh();
    const atk = g.units.find((u) => u.owner === 0)!;
    atk.type = "skimmer";
    const foe = {
      id: "foe2", type: "trooper" as const, owner: 1, x: atk.x + 1, y: atk.y,
      hp: 40, maxHp: 40, moved: false, attacked: false, acted: false,
      kills: 0, veteran: false, veteranReady: false, cityId: null,
      startX: atk.x + 1, startY: atk.y,
    };
    g.units.push(foe);
    g.players[0].explored[foe.y * g.size + foe.x] = true;
    const n = dispatch(g, { type: "attack", unitId: atk.id, targetId: foe.id });
    const live = n.units.find((u) => u.id === atk.id);
    expect(live).toBeTruthy();
    if (live) expect(live.moved).toBe(false);
  });

  it("dash is required to attack after moving", () => {
    const g = fresh();
    const atk = g.units.find((u) => u.owner === 0)!;
    atk.type = "bulwark";
    atk.moved = true;
    const foe = {
      id: "foe3", type: "trooper" as const, owner: 1, x: atk.x + 1, y: atk.y,
      hp: 10, maxHp: 10, moved: false, attacked: false, acted: false,
      kills: 0, veteran: false, veteranReady: false, cityId: null,
      startX: atk.x + 1, startY: atk.y,
    };
    g.units.push(foe);
    g.players[0].explored[foe.y * g.size + foe.x] = true;
    const n = dispatch(g, { type: "attack", unitId: atk.id, targetId: foe.id });
    expect(n.units.find((u) => u.id === "foe3")).toBeTruthy();
  });

  it("capture requires starting the turn on the tile", () => {
    const g = fresh();
    const u = g.units.find((x) => x.owner === 0)!;
    const village = g.cities.find((c) => c.owner === null);
    if (!village) return;
    u.x = village.x;
    u.y = village.y;
    u.startX = u.x + 1;
    u.startY = u.y;
    const blocked = dispatch(g, { type: "capture", unitId: u.id });
    expect(blocked.cities.find((c) => c.id === village.id)!.owner).toBeNull();
    u.startX = village.x;
    u.startY = village.y;
    const ok = dispatch(g, { type: "capture", unitId: u.id });
    expect(ok.cities.find((c) => c.id === village.id)!.owner).toBe(0);
  });

  it("new game has no invariant breaks", () => {
    const g = fresh();
    expect(checkInvariants(g)).toEqual([]);
  });
});
