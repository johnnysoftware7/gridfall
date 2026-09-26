# PARITY — GRIDFALL vs official screenshots

Side-by-side notes. Official shots live only in gitignored `reference/screenshots/` and are never shipped. GRIDFALL shots are produced by Playwright (`tests/e2e/shots/`).

Scoring: layout / information / readability, each 1–5. Anything under 4 is a fix-it item.

## Pair 1 — Faction select (S1)

| | Official S1 | GRIDFALL |
| --- | --- | --- |
| File | `reference/screenshots/S1.jpg` | `tests/e2e/shots/gridfall-S1-faction.png` |
| Layout | Warm gradient sky, `- PICK YOUR TRIBE -`, 4×3 helmet medallions, back arrow, low-poly hills + water | Same hierarchy: title, Regular Factions, five original medallions, back arrow, painted hills + water |
| Information | Tribe name under each helmet; lock stars on paid tribes | Faction name under each helmet; five free factions, no lock badges |
| Readability | High-contrast names on pastel sky | Same |

**Scores (pre-playwright):** layout 4 · information 4 · readability 4

## Pair 2 — Tech tree (S2)

| | Official S2 | GRIDFALL |
| --- | --- | --- |
| File | `reference/screenshots/S2.jpg` | `tests/e2e/shots/gridfall-S2-tech.png` |
| Layout | Black void, HUD top, back arrow, helmet centre, 5 branches, footer about city costs + Literacy | Same chrome and 25-node tree |
| Information | Green researched; cost on available nodes | Green / blue+cost / dark grey |
| Readability | Labels around nodes | Same |

**Scores (pre-playwright):** layout 4 · information 4 · readability 4

## Pair 3 — Board + HUD (S3)

| | Official S3 | GRIDFALL |
| --- | --- | --- |
| File | `reference/screenshots/S3.jpg` | `tests/e2e/shots/gridfall-S3-board.png` |
| Layout | Diamond board in a void, Score/Stars/Turn, four round buttons | Diamond board in a starfield, Score/Energy/Turn, Settings · Game Stats · Tech Tree · End Turn |
| Information | Rank badge on Game Stats, city labels | Same |
| Readability | White on black HUD | Same |

**Scores (pre-playwright):** layout 4 · information 4 · readability 4

## Pair 4 — Cities close (S7)

| | Official S7 | GRIDFALL |
| --- | --- | --- |
| File | `reference/screenshots/S7.jpg` | `tests/e2e/shots/gridfall-S7-cities.png` |
| Layout | City name, star income, pop pill, unit HP shield + type icon, cyan act glow | Same label stack and unit chrome |
| Information | Income and pop toward next level | Same |
| Readability | Small type under cities | Same |

**Scores (pre-playwright):** layout 4 · information 4 · readability 4

## Pair 5 — Attack selection (replay)

| | Replay | GRIDFALL |
| --- | --- | --- |
| File | `reference/frames/ai-mo-polysseum-replay/*` | `tests/e2e/shots/gridfall-attack.png` |
| Layout | Selection card bottom-left, red markers on targets | Selection card + red markers |
| Information | Hint line, HP, actions | Same |
| Readability | Dark card on the board | Same |

**Scores (pre-playwright):** layout 4 · information 4 · readability 4

Round 1 scores will be updated after Playwright captures. Official images are not copied into this file.
