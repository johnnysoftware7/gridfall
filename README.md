# REBOOT

A single-player 4X in the browser. The rules, numbers, pacing, and screen layout follow *The Battle of Polytopia*; the setting is year 3100 on a terraformed ocean world. The board and trailer heroes render in WebGL (Three.js); HUD chrome stays HTML/CSS. No Polytopia art, names, fonts, or audio ship in this build.

## Play

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

- **Faction** → briefing (map size, 1–3 AIs, Easy/Normal/Hard/Crazy, Perfection or Domination, seed) → drop in.
- Drag to pan. Wheel or pinch to zoom.
- Tap a unit, then a light tile to move or a red marker to attack.
- **E** ends the turn. **T** opens the tech tree.
- Autosave writes to `localStorage` at the end of each turn.

```bash
npm run build    # static site in dist/ (Vercel-ready)
npm test         # Vitest: combat fixtures, skills, 20 AI-vs-AI sims
npx playwright install chromium
npm run test:e2e # layout shots + 30-turn playthrough
```

## How a turn works

Move every unit, spend Energy on harvest / build / train / research, then End Turn. There is no undo. Cities make Energy equal to their level, plus Fabricator and Hab Dome, plus the Command Spire bonus. A colony with an enemy on it makes nothing. Tech costs `tier × cities + 4` (Literacy from Cognition knocks 33% off, rounded up).

Perfection lasts 30 turns and scores the wiki way. Domination ends when only one faction still holds a colony.

Read **DESIGN.md** for the name map, **REFERENCE.md** for the sourced rules, **DECISIONS.md** for prompt vs wiki, **PARITY.md** for layout scores.

## Stubs (visible in Settings / README, not silent)

- Music and SFX are original WebAudio beds (no licensed or Polytopia samples). Settings toggles start/stop them.
- Corner beacons on the map rim are cosmetic.
- Special-tribe units from the real game (Amphibian, Mooni, …) are out of scope.
