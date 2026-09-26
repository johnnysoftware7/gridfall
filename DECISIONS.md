# DECISIONS

Sources win. When the prompt and the 2026-09-26 wiki / screenshots / replays disagree, the sources are implemented and listed here.

## Rules

1. **Naval system is Path of the Ocean, not Boat/Ship/Battleship.** `Boat.wiki`, `Ship.wiki`, `Battleship.wiki` are marked removed. Current: land unit + Dock Ring → Skiff; upgrade in territory to Hover Scout (Drift Control, 5⚡), Hull Ram (Hull Breach, 5⚡), or Depth Bomber (Starfix, 15⚡). Titan + dock → Leviathan. Phantom + dock → Ghost Skiff.
2. **Port / Dock Ring costs 7⚡, +1 pop, unlocked by Aquaculture (Fishing).** Port infobox still says Sailing; `Fishing.wiki` and the Port body text say Fishing. Body + Fishing page win.
3. **Roads / Maglev cost 3⚡** (was 2 before Path of the Ocean). Bridges / Alloy Spans cost 5⚡.
4. **Unit capacity = city level + 1**, not level. `City.wiki`.
5. **Vanguard (Swordsman) has no fortify** — no city / wall defence bonus.
6. **Capital income is the wiki difficulty table**, not a blanket “+1 human capital” on every city. Easy bot capital produces 1 at L1; human and Normal produce 2; Hard 3; Crazy 5.
7. **Tech cost** is `(tier × cities) + 4`, Literacy `ceil(cost * 2/3)`. Confirmed.
8. **Combat rounding** is half-up (`Math.round` on positives). Fixtures: Trooper→Trooper 5/5, Trooper→Marksman 6/2, Vanguard→Skimmer 10 and kill.
9. **Splash** follows `Combat.wiki` (`attackResult / 2`, no extra round). Bomber page says “rounded down”; Combat page is the formula source.
10. **Explorer / Probe Drone moves 12 times** (wiki Explorer, 2026-02-16; was 15).
11. **Market, not Customs House.** Income: 1⚡ per level of each adjacent Spore Mill / Condenser / Smelter, cap 8 (`Market.wiki`). Trade page’s older “2 per adjacent building” is stale.
12. **Temple / Beacon costs:** field/ridge/shelf 20, bioforest 15 (`Spiritualism.wiki`).
13. **Drift Crystal (starfish) harvest = +10⚡.** No dedicated Starfish wikitext (redirect stub). Treated as the ruin-style resource grant. Logged because the value is inferred.
14. **Verdant Pact forest rate is 1.5×, 0 grain**, not the wiki’s raw `Bardur 0.8× forest`. Sequential modifiers plus observed Bardur maps (S6, replay) are forest-dense. 0.8× would make them *less* forested than base.
15. **Map default is Continents-like** (~45–55% water), player-picked size. Wiki Perfection is always 16×16; the prompt lets the player choose 11/14/16/18 — player choice wins as a GRIDFALL setup option.
16. **Polysseum spectator chrome** (turn timeline, Exit-as-X) is not single-player. HUD follows S3/S6/S7 (End Turn = checkmark).
17. **Network task (Nexus Market):** awarded when at least two colonies are connected to the Command Spire by maglev / dock chain.
18. **Ceasefire (peace):** implemented. Player may offer; AI accepts if its army+cities utility is clearly behind. Breaking freezes the breaker and disbands their units inside the other borders this turn.
19. **Phantom infiltrate** is implemented (consume, 2 dmg to occupant, spawn Blades up to city level max 5, steal that city’s income). Ghost Skiff is the water form.
20. **Auto-heal:** a unit that ends the turn having done nothing heals if damaged (`Units.wiki`).
21. **Starting Energy:** income is applied when turn 1 begins, so a human L1 Command Spire starts the first turn with 2⚡.
22. **Bardur wiki 0.8× forest** — see #14.
23. **Kickoo 2.0× water replace is documented as bugged** on the wiki. Tidebreakers get a wetter capital biome (more shelf around the spire) without a post-pass that floods 40% of the map.

## Skin / UX

24. **No Polytopia names, art, fonts, or audio in the build.** Inter / system-ui only.
25. **View layer is Three.js WebGL (2026-09-26 art pass).** Canvas 2D could not hit the Futuretopia bar (beveled glossy cubes, metal mechs, point lights, real thickness). `src/engine/` stays deterministic and renderer-agnostic. Board + trailer heroes render with MeshPhysicalMaterial, ACES tonemap, a dark custom PMREM, and soft shadows. UnrealBloom was tried and removed — it blew tiles and the hero into a white blob on the live board. Overlay canvas still draws HP / city names / damage floats. Old `src/render/art/` 2D paths are leftover and unused by the live board.
26. **Tech toast copy** follows the replay: “\<faction\> discovered the secret of \<tech\>.”
27. **When unsure about a mid-game panel not in S1–S8,** match the replay, then the wiki, then the prompt.

## Scope stubs (visible in-game, listed in README)

- Audio: Settings Music / SFX toggles drive an authored WebAudio SFX set (select, move, attack, harvest, research, victory, …) and a light original pad bed. No Polytopia samples.
- Lighthouse / corner beacons: drawn as map-edge markers (S8) but are cosmetic.
- Multiplayer “Waiting for…” bar: not used (single-player).
- Special-tribe units (Amphibian, Mooni, Hexapod, …) are out of scope — GRIDFALL only ships the five regular-faction mirrors.
- Temple level-up over calendar time is implemented as +1 temple level every 3 turns (wiki is “over time”; exact cadence is not on the pulled pages).
