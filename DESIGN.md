# DESIGN — Polytopia concept → REBOOT name

Setting: year 3100, a terraformed ocean world. Factions arrived by drop pod. Same rules and numbers as the current wiki (see REFERENCE.md). Skin only.

## Meta

| Polytopia | REBOOT |
| --- | --- |
| The Battle of Polytopia | REBOOT |
| Stars | Energy (⚡) |
| Tribe | Faction |
| Village | Settler Outpost |
| City | Colony |
| Capital | Command Spire |
| Ruin | Crashed Probe |
| Cloud / fog | Holographic static |
| Road | Maglev |
| Bridge | Alloy Span |
| City wall | City Shield |
| Workshop | Fabricator |
| Park | Hab Dome |
| Explorer | Probe Drone |

## Terrain & resources

| Polytopia | REBOOT |
| --- | --- |
| Field | Regolith Plain |
| Forest | Bioforest |
| Mountain | Ridge |
| Shallow water | Shelf |
| Ocean | Deep |
| Fruit | Spore Pods |
| Crop | Grain Plot |
| Wild animal | Fauna |
| Metal | Ore Vein |
| Fish | Plankton Bloom |
| Starfish | Drift Crystal |

## Factions (base-tribe mirrors)

| Base tribe | REBOOT | Colour | Start tech | Start unit | Spawn bias |
| --- | --- | --- | --- | --- | --- |
| Imperius | Helix Collective | teal `#2ec4b6` | Logistics | Trooper | 2× spore, 0.5× fauna |
| Xin-xi | Iron Meridian | orange `#e07a3d` | Ridgecraft | Trooper | 1.5× ridge, 1.5× ore |
| Kickoo | Tidebreakers | blue `#3d7ee0` | Aquaculture | Trooper | 0.5× ridge, 1.5× plankton, wetter |
| Oumaji | Ashfall Nomads | red `#e03d3d` | Grav Mobility | Skimmer | 0.2× bioforest, 0.2× fauna, 0.5× ridge |
| Bardur | Verdant Pact | green `#3db85a` | Tracking | Trooper | 1.5× bioforest, 0 crop (see DECISIONS) |

Each faction has a unique helmet silhouette and Command Spire drawn in `src/render/art/`.

## Units

| Polytopia | REBOOT | Cost | HP | A | D | M | R | Skills |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Warrior | Trooper | 2 | 10 | 2 | 2 | 1 | 1 | dash, fortify |
| Rider | Skimmer | 3 | 10 | 2 | 1 | 2 | 1 | dash, escape, fortify |
| Archer | Marksman | 3 | 10 | 2 | 1 | 1 | 2 | dash, fortify |
| Defender | Bulwark | 3 | 15 | 1 | 3 | 1 | 1 | fortify |
| Swordsman | Vanguard | 5 | 15 | 3 | 3 | 1 | 1 | dash |
| Catapult | Railgun | 8 | 10 | 4 | 0 | 1 | 3 | stiff |
| Knight | Lancer Mech | 8 | 10 | 3.5 | 1 | 3 | 1 | dash, persist, fortify |
| Mind Bender | Netrunner | 5 | 10 | 0 | 1 | 1 | 1 | heal, convert, stiff |
| Giant | Titan | — | 40 | 5 | 4 | 1 | 1 | static |
| Cloak | Phantom | 8 | 5 | 2 | 0.5 | 2 | 1 | hide, infiltrate, dash, scout, creep, stiff, static |
| Dagger | Blade | — | 10 | 2 | 2 | 1 | 1 | surprise, independent, static |
| Raft | Skiff | — | cargo | 0 | 1 | 2 | 0 | water, carry, stiff, static |
| Scout (naval) | Hover Scout | 5 | cargo | 2 | 1 | 3 | 2 | water, dash, carry, scout, static |
| Rammer | Hull Ram | 5 | cargo | 3 | 3 | 3 | 1 | water, dash, carry, static |
| Bomber | Depth Bomber | 15 | cargo | 3 | 2 | 2 | 3 | water, carry, splash, stiff, static |
| Juggernaut | Leviathan | — | 40 | 4 | 4 | 2 | 1 | water, carry, stiff, stomp, static |
| Dinghy | Ghost Skiff | — | cargo | 2 | 0.5 | 2 | 1 | water, hide, infiltrate, dash, scout, stiff, static |

## Tech tree (25)

```
Tracking ── Ballistics ── Mycoweave
          └─ Canopy Works ── Orbital Math

Grav Mobility ── Maglev ── Exchange
              └─ Open Circuit ── Charge Protocol

Logistics ── Cultivation ── Fabrication
          └─ Doctrine ── Envoys

Ridgecraft ── Extraction ── Alloyworks
           └─ Signal Silence ── Cognition

Aquaculture ── Drift Control ── Starfix
            └─ Hull Breach ── Depthward
```

| Polytopia | REBOOT | Unlocks |
| --- | --- | --- |
| Hunting | Tracking | Hunt fauna |
| Archery | Ballistics | Marksman; bioforest defence |
| Spiritualism | Mycoweave | Grow Bioforest; Bioforest Beacon |
| Forestry | Canopy Works | Spire Tap; Clear Bioforest |
| Mathematics | Orbital Math | Railgun; Spore Mill |
| Riding | Grav Mobility | Skimmer |
| Roads | Maglev | Maglev, Alloy Span; Network task |
| Trade | Exchange | Exchange Hub; Wealth task |
| Free Spirit | Open Circuit | Beacon; Disband |
| Chivalry | Charge Protocol | Lancer Mech; Scrap |
| Organization | Logistics | Harvest spore pods; reveal grain |
| Farming | Cultivation | Hydroponics |
| Construction | Fabrication | Condenser; Burn Bioforest |
| Strategy | Doctrine | Bulwark; Ceasefire |
| Diplomacy | Envoys | Phantom; Relay; Spire Vision |
| Climbing | Ridgecraft | Move/defence on ridges; see ore |
| Mining | Extraction | Extractor |
| Smithery | Alloyworks | Smelter; Vanguard |
| Meditation | Signal Silence | Ridge Beacon; Pacifist task |
| Philosophy | Cognition | Netrunner; Literacy; Genius task |
| Fishing | Aquaculture | Fish; Dock Ring; Skiff; shelf move |
| Sailing | Drift Control | Hover Scout; deep move |
| Navigation | Starfix | Depth Bomber; harvest Drift Crystal |
| Ramming | Hull Breach | Hull Ram |
| Aquatism | Depthward | Shelf Beacon; water defence |

## Buildings

| Polytopia | REBOOT |
| --- | --- |
| Farm | Hydroponics |
| Mine | Extractor |
| Lumber Hut | Spire Tap |
| Sawmill | Spore Mill |
| Windmill | Condenser |
| Forge | Smelter |
| Port | Dock Ring |
| Market | Exchange Hub |
| Temple | Beacon (plain / bioforest / ridge / shelf) |
| Embassy | Relay |
| Customs House | *(removed in current wiki — not used)* |

## Monuments

| Polytopia | REBOOT task name |
| --- | --- |
| Altar of Peace | Quiet Array (Pacifist) |
| Tower of Wisdom | Archive Spire (Genius) |
| Emperor’s Tomb | Vault of Surplus (Wealth) |
| Grand Bazaar | Nexus Market (Network) |
| Gate of Power | Killgate (Killer) |

## Modes & setup

Same as the real game: Perfection (30 turns, wiki scoring + difficulty bonus) and Domination (last faction with a colony). Setup: faction, map 11/14/16/18, 1–3 AIs, Easy/Normal/Hard/Crazy (capital income per wiki), mode, seed.
