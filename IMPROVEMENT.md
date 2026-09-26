# GRIDFALL improvement log

Polytopia-reference impression used as the bar (not a pixel copy):
- Graphics ~7.5 — readable chunky tiles, iconic fog, units that pop
- Playability ~8 — obvious first action, combat preview, tight camera
- Fun ~7.5 — move/attack juice, explore dopamine, contested mid-game

Target: all three ≥ 8 and above that reference on futuristic polish.

---

## Cycle 1 — 2026-09-26

**Play notes (scripted human session + prior 77s recording):**
- Opening board is a white 11×11 waffle; ocean-world identity is lost.
- Move markers were near-invisible white-on-white.
- Game was silent. End Turn had no drama. No battle numbers.
- First turn had no coach. Autosave skipped faction select with no Resume.
- AI games complete, but early turns feel empty.

| Axis | Score | Evidence |
|---|---|---|
| Graphics | 6.0 | Neon move rings, water shimmer, bigger units, translucent fog *code* landed; live preview of old dist still showed the waffle. Camera still frames the whole map. |
| Playability | 6.5 | Coach, Resume, battle-preview card, End Turn pulse, clearer hints. Tile clicks still easy to miss at wide zoom. |
| Fun | 6.0 | WebAudio SFX, particles, damage floats, turn banner, capture punch. Still no explore-pop or tight-start thrill. |

**Shipped:**
- Translucent holographic fog, water shimmer, bioforest glow, neon fences
- Pulsing cyan move ellipses, bouncing attack `!`, starfield twinkle
- Unit scale 1.42 + ground shadow
- WebAudio SFX (move/attack/harvest/train/research/capture/end)
- Particles, damage numbers, screen punch, turn banner
- First-turn coach, battle preview on selected attacker, End Turn ready-pulse
- Resume drop instead of silent autosave hijack
- Settings SFX toggle actually works
- Tech node unlock captions
- Victory/defeat copy (ORBIT SECURED / SIGNAL LOST)
- AI values villages and fog more (rules/numbers unchanged)

**Residual:** camera too wide (fog dominates composition); fog still reads as white architecture if any fill remains; first unit not pre-selected; no reveal flash.

---

## Cycle 2 — 2026-09-26

**Play notes:** Rebuilt dist and played. Tight 2.2× camera on Novagrid. Dark sea instead of white waffle. Trooper pre-selected, cyan move ellipse, first-turn coach. Tech still a black starfield with labels.

| Axis | Score | Evidence |
|---|---|---|
| Graphics | 7.3 | Ocean-world readable; fog is dark glass over terrain. Island composition works. Units still simple cubes. |
| Playability | 7.4 | First action is obvious. Turn banner briefly covered the capital (fixed next). |
| Fun | 6.9 | Start finally feels like a drop-in. Explore still quiet. |

**Shipped:** default zoom 2.2 (max 2.85), glass/dark fog, auto-select starting Trooper, explore-tile bursts, resource glints, capital spire glow, human level-up labels, Resume kept.

---

## Cycle 3 — 2026-09-26

**Play notes:** Moved Trooper, watched camera ease, opened tech, ended turn. Chunky tile sides visible. Banner no longer eats the city. HUD wordmark tucked to the corner.

| Axis | Score | Evidence |
|---|---|---|
| Graphics | 7.6 | Thickness on every tile, harvest gold rings, follow-cam. Tech still too empty. |
| Playability | 7.6 | Coach shorter next pass. Post-move hint still said "move" after dash (fixed next). |
| Fun | 7.3 | Camera follow + particles on step. Need scout callouts and score pops. |

**Shipped:** land/water thickness on all tiles, banner moved up, title-mark cornered, camera lerp on move, tech nebula attempt, resource pulse rings.

---

## Cycle 4 — 2026-09-26

**Play notes:** Combined session after hint/tech/unit silhouette/score-pop pass. First drop is readable in one glance: coach, selected Trooper, cyan rings, dark sea.

| Axis | Score | Evidence |
|---|---|---|
| Graphics | 8.0 | Futuristic night-ocean + neon island is more striking than Polytopia's pastoral map; chunky sides, glow fences, starfield, unit cape/helmet. Tech nebula + unlock captions. |
| Playability | 8.0 | Pre-selected unit, cyan rings, battle preview, Resume, End Turn pulse, short coach, acted-hint, bigger tech hit targets. |
| Fun | 8.0 | SFX, punch, damage/SCOUT/score floats, camera ease, turn banners, hungrier AI village rush. Mid-game still leaner than a 30-turn Polytopia war, but the loop now rewards each step. |

**Shipped:** post-move hint fix, short coach, tech nebula + larger nodes, unit cape silhouette, SCOUT +N and score-delta floats.

**Residual gaps:** tech tree still denser in Polytopia; late-game spectacle (navy battles, wonders) is thinner; click-to-iso can still miss on phone-sized viewports; no authored music bed.

---
