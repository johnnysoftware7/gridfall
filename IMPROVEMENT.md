# REBOOT improvement log

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

## Polytopia recording targets (2026-09-26)

Hard targets from John’s ~25 min phone playthrough. IP: original names/art only.

### Must MATCH

| Target | Status | Notes |
|---|---|---|
| Bright blue move rings + bright red attack rings | **done** | Saturated blue ellipses on legal steps; red ring + `!` on strike tiles |
| Helper text “Select a blue mark to move” / “Select a red mark to attack” | **done** | Center helper + selection-card copy; first-drop coach uses the same verb |
| Instant combat (~0.5s): hop/flash/floats/particles, no laser drama | **done** | 260ms tile hop, punch flash, −HP / +XP / harvest floats |
| HUD: Score / Energy(+inc) / Turn top-center; Settings / Stats / Tech / End Turn bottom-right; sel+actions bottom ~20% | **done** | Next Unit added beside End Turn; card stays bottom-left thumb reach |
| Glance readability at zoom-out (colors, HP, borders, resources, fog) | **done** | HP/type badges scale with 1/zoom; faction fences pulse; fog is dark glass |

### Must BEAT

| Target | Status | Notes |
|---|---|---|
| Tech tree: 5 roots / 25 techs / same costs, clearer than constellation | **done** | Hunt / Grav / Supply / Ridge / Tide columns + unlock captions |
| Ambient juice: neon fences/maglev, fog static, living board | **done** | Dash-offset fences, water shimmer, resource glints, star twinkle |
| Idle-unit glow + cycle control; End Turn pulses when no high-value actions | **done** | Double cyan glow; Next Unit button + `N`; End Turn pulses when no act/harvest |

### Also from the recording

| Target | Status | Notes |
|---|---|---|
| City level-up A/B overlay that pauses the turn | **done** | Modal A/B cards; reducer already blocks other cmds while pending |
| Snappy unit hop | **done** | 260ms ease-out hop with arc |
| Floating +XP / −HP / harvest particles | **done** | City +XP, combat −HP, +HARVEST |
| Opponent turns resolve fast | **done** | Instant AI resolve + short “Rivals moving” banner |
| Victory score breakdown (Army / Science / Cities …) | **done** | Army, Science, Cities, Territory, Explore, Wonders |

### Cycle 5 scores (after this pass)

| Axis | Score | Evidence |
|---|---|---|
| Graphics | 8.3 | Blue/red marks read at a glance; column tech; living fences; hop |
| Playability | 8.4 | Exact helper verbs, Next Unit, A/B level-up, End Turn ready-state |
| Fun | 8.2 | Hop + instant fights + floats; victory breakdown. Late-game navy still thin. |

---

## Cycle 6 — 2026-09-26

**Play notes (scripted human session + 25-min residual list):**
- Five bottom-right discs still collided on a phone thumb arc.
- Settings Music was a dead chip; SFX were thin beeps.
- Late board was empty water: docks never built (AI spent-check was 5 vs dock 7), beacons were tiny triangles, navy was a box, AI rarely embarked or upgraded.

| Axis | Score | Evidence |
|---|---|---|
| Graphics | 8.8 | Authored hulls + wakes, dock wash, beacon sky-beams that grow with temple level, monument rings/labels over capitals. |
| Playability | 8.8 | Phone 2×2 thumb cluster (Tech / More / Next / End) with overflow Settings+Stats; desktop two-row grid with larger Next/End. Settings Music/SFX both drive audio. |
| Fun | 8.7 | Distinct SFX for select/move/attack/harvest/research/victory + tide pad; AI turn-scaled aggression, docks/beacons/naval upgrades, extra mid-late trains. |

**Shipped:**
- Bottom-right HUD: two-row desktop; phone overflow More menu; primary Next/End discs enlarged
- Authored WebAudio SFX bed + light original music pad wired to Settings
- Naval hulls, engine glow, wakes; dock shimmer; beacon columns; wonder crowns
- AI: dock spend fix, aquaculture/navy/beacon preference, embark-to-dock, skiff upgrades, leftover trains, later-turn fight floor
- Wonder/beacon juice + victory sting
- README/DECISIONS stub updated (toggles no longer silent)

**Residual:** 60–90s recording still compresses a 25-min war; phone More is one extra tap versus Polytopia’s four-disc strip.

---

## Cycle 7 — 2026-09-26 (art pass)

John: artwork is the #1 gap; Codex/Claude peers destroy the old 2D look. Bar = attached Futuretopia stills (beveled glossy cubes, metal mechs, crystalline cities, trailer menus).

**Choice:** Three.js WebGL for the board + trailer heroes. Canvas 2D could not fake point lights, clearcoat, or real tile thickness. Engine stays pure. Logged in DECISIONS.md #25.

**Play notes (after rewrite):**
- Board now reads as a dark sci-fi cube world: rounded glossy tiles, owned plates go satin-white with faction tint, water/forest/ridge have height.
- Troopers are dark metal mechs with faction visors, not blob helmets. Still boxier than the attached close-ups.
- Command Spires are crystal clusters + point lights.
- Combat floats are large; kills spawn a skull + square bursts.
- Faction/victory sit on a 3D hero + hex floor. The hero is a low-poly metal golem, not yet the ice sculpture in the reference still.

| Axis | Score | Evidence |
|---|---|---|
| Graphics | 8.7 | Honest vs the attached bar. Tiles/lighting/owned plates are in the same sport. Menu hero and unit sculpt still lose a side-by-side with those stills — 9.0 would be a lie. |
| Playability | 8.8 | HUD hierarchy, blue/red marks, helpers, Next/End unchanged. Raycast pick on the 3D grid. |
| Fun | 8.5 | 3D presence + bigger combat juice. Not the focus of this run. |

**Shipped:** `src/render/gl/` (view, mechs, hero, palette), overlay labels, RoomEnvironment + ACES, before/after in `artifacts/art-pass/`.

**Residual vs the bar:** hero still too mannequin; units need more limb/silhouette variety; fog blocks are just tall dark cubes; no per-pixel bloom.

---

## Cycle 8 — 2026-09-26 (art pass, second sculpt)

John's Futuretopia stills remain the bar. Cycle 7 stills were studio-lit cube people — that 8.7 was still generous.

**Shipped this cycle:**
- Ice-crystal trailer hero (faceted torso, shoulder/helmet shards) on a hex floor; title over the chest; medals on a frosted bottom bar
- Dark custom PMREM + ACES (bloom was tried and pulled — it blew the board into a white blob)
- Units: dark hull, faction visor, pauldrons, crests; cities scaled as crystal clusters
- Fog blocks, faction fence glow, connected maglev strips
- Combat overlay: large orange floats, ☠ + square bursts
- Victory card: Rematch / Main Menu

| Axis | Score | Evidence |
|---|---|---|
| Graphics | 7.8 | Honest vs the attached Futuretopia stills. Menu is in the same sport (ice figure, hex floor, trailer title). Board tiles are glossy cubes with thickness. Units and Command Spires still lose a side-by-side — they read small against the plates, not as metal mechs / glowing crystal cities. 8.3 and 8.7 from earlier cycles were too generous. 9.0 would be a lie. |
| Playability | 8.8 | HUD / marks / helpers unchanged. Raycast pick. |
| Fun | 8.4 | Combat numbers and skulls are louder when they land. Not the focus of this run. |

**Residual vs the bar:** hero still simpler than the reference ice sculpture; board units need more readable silhouette at play zoom; cities need more interior glow; combat juice is easy to miss on the overlay.

---

## Cycle 9 — 2026-09-26 (units + cities)

Close the gap named in Cycle 8. Spec flavor (glass towers / neon rim) is cosmetic only; rules unchanged. Headless SwiftShader cannot light MeshPhysicalMaterial, so hulls and cities now use Lambert + MeshBasicMaterial emissives.

**Play notes (art-pass stills 01–05, same cameras as last pass):** Starting Trooper is a faceted grey biped with capsule limbs, pauldrons, a cyan visor, and a white edge — not a box. Command Spire is a cyan shard cluster sitting behind the unit. Combat still shows −6 and ☠. Menu hero is unchanged ice-golem.

| Axis | Score | Evidence |
|---|---|---|
| Graphics | 8.3 | Honest vs the attached Futuretopia stills. The 7.8 hole (box units, missing cities) is smaller: mechs have stance/visor/edge, cities have shard mass. 9.0 would be a lie — freeze-frames still look like a flat isometric toy next to `4b_combat_closeup` / `5_city_closeup`. |
| Playability | 8.8 | HUD / marks / helpers unchanged. Raycast pick. |
| Fun | 8.5 | −6 / ☠ now survive a freeze-frame. Overlay still quieter than `4_combat_juice`. |

**Shipped:** icosahedron hulls + capsule limbs + always-lit visor; Lambert materials so SwiftShader shows form; crystal Command Spires with MeshBasicMaterial cores (no bloom); dark tile bodies + glossy caps; WebGL combat sprites; units offset off the spire.

**Remaining vs the bar (why this is not 9.0):** Side-by-side, Futuretopia stills are dark metal creatures on thick glossy black/white cubes with a field of orange numbers. Ours still read as a small pale island: the Trooper is a cute faceted biped, not the animal/mech variety in `4b`/`5`; the spire is a cyan shard burst, not a glass tower with night rim and level-readable volumes; tile sides barely show in the headless capture, so the board never becomes that checkerboard of beveled cubes; combat juice is a pair of floats at the top of the frame, not a thick particle field.

---
