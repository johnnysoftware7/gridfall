# PARITY — REBOOT vs official screenshots

Official Polytopia shots stay in gitignored `reference/screenshots/` and are never shipped. REBOOT shots: `tests/e2e/shots/`. Scoring is layout / information / readability, 1–5. Under 4 was fixed and recaptured (two rounds).

## Pair 1 — Faction select (S1)

| | Official | REBOOT |
| --- | --- | --- |
| File | `reference/screenshots/S1.jpg` | `tests/e2e/shots/gridfall-S1-faction.png` |
| Layout | Warm pink→blue sky, `- PICK YOUR TRIBE -`, back arrow, helmet medallions, low-poly hills and water | Same stack: `- PICK YOUR FACTION -`, Regular Factions, five original medallions, back arrow, painted hills + water |
| Information | Name under each helmet | Helix Collective, Iron Meridian, Tidebreakers, Ashfall Nomads, Verdant Pact |
| Readability | High-contrast names on pastel | Same. Helmets are distinct silhouettes (cube crest, horns, visor, spike, canopy). |

**Round 2:** layout **4** · information **4** · readability **4**

We ship five factions, not a 4×3 paid-tribe grid. No lock-star badges.

## Pair 2 — Tech tree (S2)

| | Official | REBOOT |
| --- | --- | --- |
| File | `reference/screenshots/S2.jpg` | `tests/e2e/shots/gridfall-S2-tech.png` |
| Layout | Black void, HUD still up, back arrow, helmet centre, five branches, cost footer | Same chrome. HUD Score / Energy / Turn remains. 25 nodes on five roots. |
| Information | Green researched, cost on available, dark locked. Literacy 33% note. | Logistics green; T1 blue with 5; T2/T3 dark grey. Footer matches. |
| Readability | Labels around nodes | Readable. Some outer labels sit close; colours carry the state. |

**Round 2:** layout **4** · information **5** · readability **4**

## Pair 3 — Board + HUD (S3)

| | Official | REBOOT |
| --- | --- | --- |
| File | `reference/screenshots/S3.jpg` | `tests/e2e/shots/gridfall-S3-board.png` |
| Layout | Diamond in a void, Score / Stars(+n) / Turn, four round buttons | Diamond in a starfield, Score / Energy(+n) / Turn, Settings · Game Stats (rank) · Tech Tree · End Turn ✓ |
| Information | City labels, fog, terrain | Command Spire + Trooper in the revealed pocket; white holographic fog blocks on the rest |
| Readability | Clear land vs water vs cloud | Fog is white raised blocks (not a cyan wash). Thickness on the south-east edge. |

**Round 2:** layout **5** · information **4** · readability **4**

Turn-1 reveal is a small island of vision, as in early replay frames.

## Pair 4 — Cities close (S7)

| | Official | REBOOT |
| --- | --- | --- |
| File | `reference/screenshots/S7.jpg` | `tests/e2e/shots/gridfall-S7-cities.png` |
| Layout | City name, star income, pop pill; unit HP + type; selection card when picked | Novagrid label, ⚡ income, pop dots; Trooper card bottom-left with colour name bar and HP |
| Information | Income and pop toward next level | Same |
| Readability | Small type under cities | Card is high-contrast; board type is smaller at full-map zoom |

**Round 2:** layout **4** · information **4** · readability **4**

## Pair 5 — Attack selection (replay)

| | Replay | REBOOT |
| --- | --- | --- |
| File | `reference/frames/*` | `tests/e2e/shots/gridfall-attack.png` |
| Layout | Card bottom-left, red markers on targets | Card + “Pick a red marker to attack.” Adjacent enemy shown. |
| Information | Hint, HP, actions | Same |
| Readability | Dark card | Same |

**Round 2:** layout **4** · information **4** · readability **4**

## Round log

1. First capture: tech nodes looked locked (blue only when affordable), fog was a cyan wash, helmets read as mushroom caps, HUD hidden on the tech screen. All under 4 on at least one axis.
2. Recolour nodes (blue = researchable), HUD z-index on tech, white holographic fog blocks, unique helmets, larger units, attack hint. All pairs **≥ 4**. No third round.
