# REBOOT visual bar (source of truth)

Brand: **REBOOT** (repo may still say gridfall). Rules stay Polytopia-faithful. Art must match John's `futuretopia-art` showcase, not geometric toys.

## Locked reference images (attached / on disk)

Showcase (2026-06-02):
- `1_menu_3d_hero.png` — 3D mech hero, studio lighting, cyan edge glow
- `2_setup_faction_hero.png` — faction select with hero presence
- `3_match_developed.png` — developed board: glossy dark tiles, lavender move highlights, readable units, floating damage
- `4_combat_juice.png` / `4b_combat_closeup.png` — combat: directional particles, big floating damage, skull death mark, hit weight
- `5_city_closeup.png` — cities as architecture with glow, not washed-out spires
- `7_victory_hero.png` — victory hero composition

Concepts / roster:
- `06_warrior_concept.png` — bipedal mech: charcoal armor, cyan emissive seam lines, asymmetric gun+fist, recessed visor
- `05_capital_concept.png` — capital as designed architecture
- `01_roster_magnified.png` — every unit needs a distinct silhouette + material family (not box+sphere menagerie)
- `03_ingame_units_closeup.png` / `04_ingame_board.png` — in-game scale readability

## Non-negotiable look

1. **Units are designed mechs/creatures**, not primitive assemblies. Distinct silhouettes per unit type. Charcoal/metal body + faction-colored emissive seams (cyan/orange/purple/etc).
2. **Tiles** are thick glossy dark cubes with specular highlights; move/attack range = soft lavender fill from within/below — never flat pastel overlays.
3. **Cities** have vertical readable architecture, emissive windows/spires that stay sharp in captures (no washed bloom washout).
4. **Combat juice** (from game-juice recipes): hit-stop 50–80ms medium / 80–120ms heavy; trauma shake; 8–15 directional sparks; floating damage that scale-pops and fades; death skull; anticipation + follow-through.
5. **Lighting**: strong key + rim so silhouettes read at isometric distance; environment reflection on tiles; bloom only on emissives, not the whole board.
6. **Materials**: MeshStandard/Physical — metalness/roughness variation; emissive maps for seams; clearcoat on tile tops OK.
7. **Camera**: slight punch-in on heavy hits; never locked security-camera deadness.
8. **Score honesty**: if units still look like toys vs `06_warrior_concept.png`, Graphics ≤ 6. Do not soft-score.

## Rejected look

- Box/sphere/cylinder "mech kits"
- Flat Canvas sprites pretending to be 3D
- Bloom fog instead of authored detail
- Soft-scoring Graphics 8.x while silhouettes fail the warrior concept

## Pass definition

Side-by-side stills: REBOOT board / city / combat / unit closeup vs matching showcase frames. Units must pass a 5-second silhouette test against the roster sheet. Then record gameplay video. Keep looping until Graphics clear this bar (target ≥ 9 vs Polytopia + matching futuretopia).
