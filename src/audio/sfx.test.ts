import { describe, expect, it } from "vitest";
import { musicEnabled, playSfx, setMusic, setSfx, sfxEnabled } from "./sfx";

describe("authored audio bed", () => {
  it("toggles SFX and Music without throwing", () => {
    setSfx(false);
    expect(sfxEnabled()).toBe(false);
    playSfx("select");
    playSfx("move");
    playSfx("attack");
    playSfx("harvest");
    playSfx("research");
    playSfx("victory");
    setSfx(true);
    expect(sfxEnabled()).toBe(true);
    setMusic(true);
    expect(musicEnabled()).toBe(true);
    setMusic(false);
    expect(musicEnabled()).toBe(false);
  });
});
