# REBOOT — Reference notes from the real game

Sources win over the build prompt. This file records every rule number, every observed screen, and every contradiction.

Reference assets live in `./reference/` (gitignored). They are never imported, traced, or shipped.

## A. Official screenshots (Steam app 874390)

Downloaded live 2026-09-26 from Steam CDN.

| ID | File | What it shows |
| --- | --- | --- |
| S1 | `reference/screenshots/S1.jpg` | Tribe select. Warm pink→blue sky, low-poly mountains and water, sailing ship. Title `- PICK YOUR TRIBE -`. Section `Regular Tribes`. 4×3 grid of round blue-ring medallions with unique low-poly helmets and names. Locked tribes carry a white 4-point star badge at the medallion’s upper-right. Back arrow (white circle, black chevron) top-left. |
| S2 | `reference/screenshots/S2.jpg` | Full tech tree, every node researched (all green). Pure black void, faint stars. HUD still visible at top: Score / Stars(+income) / Turn. Back arrow top-left. Player helmet in the centre. Five branches, tier 1 inner, tier 3 outer. Thin grey lines connect parent→child. Footer: “Tech costs increase for each city in your empire. Literacy reduces the price of all technologies by 33%!” |
| S3 | `reference/screenshots/S3.jpg` | Mid-game board + HUD. Diamond isometric map floating in black. White snow/ice biome, cyan shallows, darker ocean, brown land-edge thickness, blue water-edge thickness. City labels under cities. Top HUD centred. Bottom-right four round buttons: Settings (hamburger), Game Stats (portrait + “2nd” rank badge), Tech Tree (flask), End Turn (checkmark). |
| S4 | `reference/screenshots/S4.jpg` | Same tribe-select layout as S1, different helmet set (same 12 regular tribes, alternate skins). Confirms medallion size, spacing, star-lock badge, landscape. |
| S5 | `reference/screenshots/S5.jpg` | Terrain close-up. Dark forest biome, pale fields, cyan shallows. Gold dotted roads across tiles. Dashed colour fence around territory. City as a cluster of low-poly blocks. Cyan glow on a unit that can still act. Fruit / crop / animal / metal / fish as small coloured markers. Mountains as grey triangular prisms. |
| S6 | `reference/screenshots/S6.jpg` | Mid-game, mixed biomes (snow, grass, dark forest). Same HUD and four buttons. City labels with star+income and population pills. Fog (white low-poly cloud blocks) covering unexplored corners. |
| S7 | `reference/screenshots/S7.jpg` | Cities close-up, water-heavy map. City label anatomy: name, star icon + income number, segmented pill (filled blue dots = current pop toward next level; empty slots = remaining). Capital has a crown / taller central spire. Units: chunky low-poly body in faction colour + helmet; shield HP badge top-left; round type icon top-right. Cyan outline on units that can still act. Roads as dotted gold; bridges as wood/gold spans. Territory dashed fences. |
| S8 | `reference/screenshots/S8.jpg` | Archipelago. Isolated islands in a diamond of water. Colour-coded dashed fences around each island/city. Lighthouses / edge markers at map corners. Pure black void. Shallows brighter cyan along coasts; deep ocean darker. |

## B. Gameplay video

Steam `appdetails` top-level key was `2350830` (not `874390`). Four movies:

| Name | Frames (1/4 fps, 960px) | Use |
| --- | --- | --- |
| Ai-Mo Polysseum Replay | `reference/frames/ai-mo-polysseum-replay/` (63) | Full competitive game, turn 1 → end |
| Vengir Polysseum Replay | `reference/frames/vengir-polysseum-replay/` (65) | Full competitive game, dark-forest biome |
| Launch Trailer | `reference/frames/launch-trailer/` (33) | UI close-ups, late-game navy |
| Release Date Trailer | `reference/frames/release-date-trailer/` | Extra UI |

Backup YouTube (English auto-subs via yt-dlp) requested:

- https://www.youtube.com/watch?v=G7zMMEKFb0g
- https://www.youtube.com/watch?v=9kDe1OSTEvM
- https://www.youtube.com/watch?v=0Q4zOWzrttU

Subs saved under `reference/youtube/` when the download succeeds. Steam replays were the primary motion reference.

### Frames opened (40+)

Turn-1 → endgame spread: Ai-Mo `001,002,003,008,012,016,020,025,030,035,040,045,050,055,060,063`; Vengir `001,002,010,020,030,040,050,060,065`; Launch `005` plus several neighbours; plus S1–S8.

Key observations that S1–S8 do not show:

- **Research toast** (`ai-mo-…/001.jpg`): dark rounded rectangle, tech icon left, title = tech name, body = “\<faction\> discovered the secret of \<tech\>”.
- **Level-up toast** (`vengir-…/020.jpg`): “\<city\> leveled up! \<player\> picked \<reward\>.”
- **Fog**: white low-poly cloud blocks sitting on the board, removed tile-by-tile. Early replay frames are mostly cloud.
- **Tech tree mid-game** (`ai-mo-…/045.jpg`): green = researched; blue circle with a cost number = affordable now; dark/empty circle = locked (prerequisite missing). HUD remains. Back arrow top-left.
- **Polysseum spectator chrome** (turn timeline, pause, Exit as X): spectator-only. Single-player uses the S3/S6/S7 four-button strip (End Turn = checkmark), not the spectator Exit.
- **Waiting bar** (Launch `005`): “Waiting for \<player\> to play…” during multiplayer. Not used in single-player.
- **City pop pill** fills left-to-right in blue; empty slots are hollow.
- **Road connections** appear as a small road glyph next to a connected city’s name (wiki City + S7).

## C. Screen / panel / button inventory

| Element | Where seen | Notes for REBOOT skin |
| --- | --- | --- |
| Back arrow (white circle, black chevron) | S1, S2, S4, replay tech tree | Top-left on overlays |
| Title “- PICK YOUR TRIBE -” | S1, S4 | Become “- PICK YOUR FACTION -” |
| Regular-tribes section header | S1, S4 | “Regular Factions” |
| Helmet medallions | S1, S4 | Unique silhouette per faction |
| Star lock badge | S1, S4 | Unused in REBOOT (five free factions) |
| Sky + landscape backdrop | S1, S4 | Keep warm gradient; no Polytopia helmets |
| Top HUD: Score / Stars(+n) / Turn | S2, S3, S6, S7, replay | Stars → Energy ⚡, same layout |
| Settings button (☰) | S3, S6, S7 | Bottom-right cluster, labelled |
| Game Stats (portrait + rank “2nd”) | S3, S6, S7 | Same |
| Tech Tree (flask / beaker) | S3, S6, S7 | Same |
| End Turn (✓) | S3, S6, S7 | Same |
| Selection card (portrait, colour name bar, HP bar, hint, round action buttons) | Replay + prompt | Bottom-left when something is selected |
| Red attack markers | Replay / wiki Combat | On attackable enemies |
| Light move markers | Replay | On legal destinations |
| Battle preview (hover/hold) | wiki Combat | Sweat = kill; red/black ring = you die |
| City label (emblem, name, ⭐ income, pop pill) | S3, S6, S7 | Capital: crown + underlined name |
| Dashed territory fence | S5, S7, S8 | Owner colour |
| Dotted gold roads / bridges | S5, S7 | Become maglev / alloy spans |
| Unit HP shield + type icon | S7 | Top-left / top-right |
| Cyan action glow | S5, S7 | Units that can still act |
| Fog clouds | S6, early replay | Become holographic static |
| Research toast | `ai-mo-…/001` | Dark, icon + copy |
| Level-up toast | `vengir-…/020` | Dark, city + choice |
| Tech tree rings | S2, `ai-mo-…/045` | 5 roots, 25 techs |
| Tech cost footer | S2, replay | City-count + Literacy 33% |
| Game-over / score breakdown | wiki Score | Army, territory, cities, monuments/temples, science |
| Settings overlay | inferred from button | Music/sfx stubs, resign, continue |
| Game Stats overlay | inferred | Rank, cities, army, techs |
| Level-up choice modal | wiki City | Two buttons |
| Peace-treaty prompt | wiki Strategy | Offer / accept / break |

## D. Camera, animation, timing

- Board is a **square grid drawn isometric** at roughly **2:1** (tile width : height). The whole map is one diamond in a void (S3, S8).
- Land sits slightly above water. Land edges show an earth-brown side face; water edges a deeper blue face (S3, S8).
- Camera: drag-pan, wheel zoom. Replay camera is a slow orbit / zoom on the diamond; single-player is player-controlled.
- Fog lifts **per tile** when a unit sees it (vision 1, or 2 from mountains / scout skill).
- Units that can act have a **steady cyan outline**, not a pulse (S5, S7).
- Toasts linger ~2.5–3.5 s then fade (replay).
- Melee killer **steps into** the vacated tile; ranged stays (wiki Combat).
- No undo. End Turn is explicit (E key in REBOOT; button in both).
- Explorer is a translucent walker that auto-moves ~12 steps (wiki Explorer, 2026-02-16 change from 15).

## E. Rule numbers (wiki, current)

Wiki pulled 2026-09-26 via `polytopia.fandom.com/api.php?action=parse`. Raw HTML was 403; wikitext API succeeded. Pages live in `reference/wiki/*.wiki`.

### Combat — `Combat.wiki`

```
attackForce   = attacker.attack  * (attacker.hp / attacker.maxHp)
defenseForce  = defender.defense * (defender.hp / defender.maxHp) * defenseBonus
total         = attackForce + defenseForce
attackResult  = round(attackForce  / total * attacker.attack  * 4.5)
defenseResult = round(defenseForce / total * defender.defense * 4.5)
```

- Rounding: nearest whole number. Community calculators and the required fixtures need **half-up** (`4.5 → 5`, `1.5 → 2`). JS `Math.round` on positives.
- `defenseBonus`: 1 none; **1.5** forest (needs Archery), mountain (Climbing), shallow/ocean (Aquatism), or city (fortify units only); **4** city wall (fortify only). Poisoned: 0.5 / 0.7 / 2.
- No retaliation if defender dies, cannot see/reach attacker, deals 0, has Stiff, or attacker has Surprise.
- Melee killer advances; ranged stays.
- Splash = `attackResult / 2` **without rounding** (half-HP is a known wiki bug).
- Heal: +4 friendly territory, +2 elsewhere. Mind Bender Heal Others: +4 adjacent.
- Veteran: 3 kills → +5 max HP and full heal. Naval, super units, Cloak, and other Static units cannot promote.

Verified fixtures (full HP, bonus 1):

| Fight | Dealt | Back |
| --- | --- | --- |
| Warrior 2/2 vs Warrior 2/2 | `round(4.5)=5` | 5 |
| Warrior 2/2 vs Archer 2/1 | `round(6)=6` | `round(1.5)=2` |
| Swordsman 3/3 vs Rider 2/1 | `round(10.125)=10` (kill) | 0 |

### Units — individual unit pages + `Units.wiki`

| Unit | Cost | HP | A | D | M | R | Skills |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Warrior | 2 | 10 | 2 | 2 | 1 | 1 | dash, fortify |
| Rider | 3 | 10 | 2 | 1 | 2 | 1 | dash, escape, fortify |
| Archer | 3 | 10 | 2 | 1 | 1 | 2 | dash, fortify |
| Defender | 3 | 15 | 1 | 3 | 1 | 1 | fortify |
| Swordsman | 5 | 15 | 3 | 3 | 1 | 1 | dash (**no fortify**) |
| Catapult | 8 | 10 | 4 | 0 | 1 | 3 | stiff |
| Knight | 8 | 10 | 3.5 | 1 | 3 | 1 | dash, persist, fortify |
| Mind Bender | 5 | 10 | 0 | 1 | 1 | 1 | heal, convert, stiff |
| Giant | — | 40 | 5 | 4 | 1 | 1 | static (super unit) |
| Cloak | 8 | 5 | 2 | 0.5 | 2 | 1 | hide, infiltrate, dash, scout, creep, stiff, static |
| Raft | — | cargo | 0 | 1 | 2 | 0 | water, carry, stiff, static |
| Scout (naval) | 5 from raft | cargo | 2 | 1 | 3 | 2 | water, dash, carry, scout, static |
| Rammer | 5 from raft | cargo | 3 | 3 | 3 | 1 | water, dash, carry, static |
| Bomber | 15 from raft | cargo | 3 | 2 | 2 | 3 | water, carry, splash, stiff, static |
| Juggernaut | Giant+port | 40 | 4 | 4 | 2 | 1 | water, carry, stiff, stomp, static |

Disband (Free Spirit): refund `floor(cost/2)`.

Auto-heal: if a unit takes no action, it heals if it can (`Units.wiki`).

### Movement — `Movement.wiki`

- Chebyshev distance. Base step cost 1. Road↔road or road↔city: 0.5. Remaining movement is **rounded up**, so 0.5 left can still enter a cost-1 tile.
- Forest and mountain **end movement** (can enter, cannot continue) unless a road is on the forest. Roads cannot be placed on mountains.
- Cannot enter fog. Cannot stack. Cannot pass through enemies.
- Zone of control: stepping adjacent to an enemy ends movement (roads do not override). Starting in ZOC can step out then back.
- Land unit entering a friendly Port becomes a Raft (Giant → Juggernaut, Cloak → Dinghy) and **loses remaining actions**.
- Disembark: carry unit moving onto land adjacent to water releases cargo and ends the turn. Upgrade is lost.
- Vision: 1 tile; 2 from mountains; 2 with scout skill.

### City / economy — `City.wiki` + building pages

- Income = **level** +1 Workshop +1 Park + **capital bonus**. Besieged (enemy unit on the city) → **0**.
- Capital bonus: human and Normal bot **+1** (level-1 capital produces 2); Easy bot **0** (produces 1); Hard **+2** (produces 3); Crazy **+4** (produces 5).
- Level *n* from *n−1* needs **n** population. Each level: +1 income, +1 unit capacity, +50 score.
- Unit capacity = **level + 1** (number of pop-bar slots).
- Level-up rewards:
  - L2: Workshop **or** Explorer
  - L3: City Wall **or** +5 stars
  - L4: +3 pop **or** Border Growth
  - L5+: Park (+1 income, +250 score) **or** Super Unit
- Capture: unit **starts its turn** on a village or enemy city, then captures; ends the turn. Capturing unit is re-supported by the new city.
- Connection (road / port chain to capital): **+1 pop to both**.
- Player is eliminated when they have **zero cities**.

Harvest / build (inside borders, costs Energy, add pop):

| Action | Tech | Cost | Pop | Tile |
| --- | --- | --- | --- | --- |
| Harvest fruit | Organization | 2 | +1 | field + fruit |
| Hunt animal | Hunting | 2 | +1 | forest + animal |
| Fish | Fishing | 2 | +1 | shallow + fish |
| Farm | Farming | 5 | +2 | field + crop |
| Mine | Mining | 5 | +2 | mountain + metal |
| Lumber Hut | Forestry | 3 | +1 | forest |
| Sawmill | Mathematics | 5 | +1 per adj. lumber hut | field; one per city |
| Windmill | Construction | 5 | +1 per adj. farm | field; one per city |
| Forge | Smithery | 5 | +2 per adj. mine | field or forest; one per city |
| Port | Fishing | 7 | +1 | shallow; connects over ≤4 water |
| Road | Roads | 3 | 0 | land except mountain |
| Bridge | Roads | 5 | 0 | water with land N–S or E–W |
| Market | Trade | 5 | 0 (income) | next to sawmill/windmill/forge; 1★ × levels, cap 8 |
| Temple (field) | Free Spirit | 20 | 0 (score) | empty field |
| Forest Temple | Spiritualism | 15 | 0 (score) | forest |
| Mountain Temple | Meditation | 20 | 0 (score) | mountain |
| Water Temple | Aquatism | 20 | 0 (score) | water |
| Embassy | Diplomacy | 5 | 0 | foreign owned capital while at peace; +2★ each (+4 if treaty) |

Other actions:

| Action | Tech | Cost | Effect |
| --- | --- | --- | --- |
| Clear Forest | Forestry | 0 (gain 1) | forest → field, +1 star |
| Grow Forest | Spiritualism | 5 | empty field → forest |
| Burn Forest | Construction | 5 | empty forest → field + crop |
| Destroy | Chivalry | 0 | remove a building |
| Harvest starfish | Navigation | 0 | +10 stars (value not on a dedicated page; treated as ruin-style resource grant — see DECISIONS) |
| Disband | Free Spirit | 0 | unit gone, `floor(cost/2)` refund |

Temples: 100 score + 100 per level above 1, max 500 at level 5 (`Score.wiki`). Forest Temple is 5 cheaper (`Spiritualism.wiki`).

Monuments (once each): 3 pop, 400 score.

| Monument | Task | Unlock |
| --- | --- | --- |
| Altar of Peace | 5 turns with no attacks | Meditation |
| Tower of Wisdom | research every tech | Philosophy |
| Emperor’s Tomb | hold 100 stars at once | Trade |
| Grand Bazaar | connect cities (Network) | Roads |
| Gate of Power | 10 kills | first kill |

### Technology — `Technology.wiki`

Cost = `(tier × cityCount) + 4`. Literacy (Philosophy): **ceil(cost × 2/3)**.

25 techs, 5 roots. Current tree (Whaling and Engineering **removed**; Ramming is the T2 water-combat node):

```
Hunting ── Archery ── Spiritualism
        └─ Forestry ── Mathematics

Riding ─── Roads ──── Trade
        └─ Free Spirit ── Chivalry

Organization ── Farming ── Construction
             └─ Strategy ── Diplomacy

Climbing ── Mining ── Smithery
         └─ Meditation ── Philosophy

Fishing ── Sailing ── Navigation
        └─ Ramming ── Aquatism
```

Starting techs of the five regular tribes we mirror:

| Tribe | Start | Spawn bias (wiki) |
| --- | --- | --- |
| Imperius | Organization | 0.5× animal, 2.0× fruit |
| Xin-xi | Climbing | 1.5× mountain, 1.5× metal |
| Kickoo | Fishing | 0.5× mountain, 1.5× fish, 2.0× water (water replace is listed as bugged) |
| Oumaji | Riding | 0.2× forest, 0.2× animal, 0.5× mountain; starts with a Rider |
| Bardur | Hunting | wiki lists 0.8× forest, 0× crop — see contradictions |

### Map generation — `Map_Generation.wiki`

Sizes: 11×11, 14×14, 16×16, 18×18 (plus 20 and 30, out of REBOOT scope).

Village rules: not on the edge; no two villages in any 3×3 (i.e. Chebyshev ≥ 2). Post-terrain villages also avoid the second ring from the edge.

Ruins by size: 11→4, 14→5, 16→7, 18→9. Not adjacent to a village or another ruin. Not on shallow water. Land or deep ocean.

Resources only within 2 tiles of a city/village. Inner-city vs outer-city rates (base / Luxidoor):

| | Inner | Outer |
| --- | --- | --- |
| Field 48% (fruit 18/6, crop 18/6, empty 12/36) | | |
| Forest 38% (animal 19/6, empty 19/32) | | |
| Mountain 14% (metal 11/3, empty 3/11) | | |
| Fish 50% of shallows | | |

Capitals: 1–4 players → 4 quadrants. Continents/Pangea convert far-apart coastal villages into capitals.

### Score — `Score.wiki`

- Units: 5 × star-cost. Super unit = 50.
- Territory: 20 / owned tile. Exploration: 5 / explored tile.
- Cities: 100 + 50 per level above 1. Park +250.
- Monuments 400. Temples 100 + 100/level above 1 (max 500).
- Tech: 100 × tier.
- Perfection: 30 turns. Difficulty bonus = 100% + 41% × ln(opponents), plus +20/40/80% for Normal/Hard/Crazy.

### Ruins — `Ruin.wiki`

Start turn on ruin, spend the action. Equal weight among legal rewards:

1. +10 stars
2. Free researchable tech (not behind an unresearched parent), if tree incomplete
3. +3 pop on capital
4. Explorer, if any tile in 5×5 is fog
5. Veteran Swordsman (land)
6. Veteran Rammer carrying a Warrior (water)

### Diplomacy extras

- Peace: Strategy to offer. While at peace: no attacks, shared roads, embassy income doubled. Breaking freezes the breaker this turn and disbands their units inside the other borders.
- Capital Vision (Diplomacy): see discovered capitals.
- Cloak infiltrate: consume cloak, damage occupant by 2, spawn up to 5 Daggers (city level), steal that city’s income this cycle.

## F. Prompt vs sources (sources win)

| Prompt | Source | REBOOT does |
| --- | --- | --- |
| Naval: Boat → Ship → Battleship | Those units are **removed**. Current: Port → Raft, upgrade to Scout / Rammer / Bomber (`Raft.wiki`, `Technology.wiki`) | Current wiki naval. Renames: Skiff / Hover Scout / Hull Ram / Depth Bomber. |
| Port cost implied older | Port is **7**, +1 pop, unlocked by **Fishing** (`Port.wiki` body; Fishing page). Infobox on Port still says Sailing — body + Fishing page win. | 7, Fishing/Aquaculture. |
| Roads “gold dots”, cost unstated | Roads cost **3** (was 2 before Path of the Ocean). Bridges **5**. | 3 / 5. |
| Tech cost `tier × cities + 4` | Confirmed. Literacy ceil 33% off. | Same. |
| Swordsman “dash” only | Confirmed; **no fortify** (`Swordsman.wiki`). | No city defence bonus for Vanguard. |
| Knight 8⚡ HP10 A3.5 | Confirmed (2.1 reverted the 10-cost / 15-HP experiment). | Same. |
| City income “+1 human capital” | Capital bonus is difficulty-scaled, not a generic +1 for every human city. Humans and Normal bots: level-1 capital produces **2**. | Wiki capital table. |
| Unit capacity = level | Wiki: capacity = **level + 1** (pop-bar count). | level + 1. |
| 5 roots include “Aquaculture” as Fishing | Current root is **Fishing**; “Aquaculture” is a leftover name for the T2 node now called **Ramming**. | Root rename Fishing → Aquaculture as the prompt’s *skin* name. T2 Ramming → Hull Breach. |
| Bardur  forest-heavy | Wiki modifier `0.8× forest, 0× crop`. Observed Bardur maps are forest/snow dense. Sequential modifiers may not match the raw 0.8. | Verdant Pact: 1.5× forest, 0 crop. Logged in DECISIONS. |
| Explorer unspecified | 12 steps (2026-02-16; was 15). | 12. |
| Market / Customs House | Customs House **replaced** by Market. | Market. |
| Splash rounding | Combat page: `/2` no extra round. Bomber page: “rounded down”. | Combat page (`.5` HP allowed). |
| Perfection map always 16×16 | Wiki: Perfection uses Normal (16). Prompt lets the player pick 11/14/16/18. | Player picks size (setup). |

## G. What REBOOT must look like

Reproduce layout, hierarchy, colour logic, and interaction flow of S1–S8 and the replay. Change only the skin: starfield void, alloy/bedrock edges, holographic fog, maglev roads, neon fences, Energy ⚡, original Canvas 2D art, original names.
