# Firey Station Tycoon v2.0 (prototype)

A fictional cartoon fire-station builder for phones (portrait). Static files only, so no build step and no server code.
Not affiliated with, or endorsed by, any fire service. All names, art and places are made up.

## Publish (GitHub Pages)
Copy everything below to the repo root, keeping the same folders:

    index.html                      v2 game (ES modules; must be served over http(s), so GitHub Pages works but file:// does not)
    v0.2.html                       previous single-file 2D version, kept for reference
    README.md, CREDITS.md
    js/main.js js/data.js js/state.js js/scene.js js/audio.js js/avatar.js js/minigame.js js/backend.js
    js/vendor/three.bundle.min.js   three.js r186 + RoundedBoxGeometry, bundled with esbuild (MIT)
    js/vendor/THREE-LICENSE.txt
    assets/fonts/LilitaOne-Regular.ttf
    assets/fonts/OFL.txt

screens-v2/ and screens/ hold test screenshots only and are optional.

## Code map
- data.js: all tuning (buildings, roles and skills, gear rarities, call types and crew requirements, competitions, leagues, demo shop)
- state.js: save/load (localStorage key `fst_v2_save`), v1 save migration (`fireyStationTycoon_v1` turns into bonus coins and badges), game rules and tick
- scene.js: Three.js isometric base (buildings by level, scaffolds, trucks, crew walkers, pan/pinch/tap)
- main.js: HUD, panels, sheets and modals
- minigame.js: competition mini-games on a 2D canvas
- audio.js: synthesised Web Audio SFX and music (no audio files)
- avatar.js: SVG crew portraits that change with gear rarity
- backend.js: `LocalSim` simulates rivals, the leaderboard, friend bases and mutual aid. Swap in a REST client with the same
  async methods (endpoints and JSON shapes are documented at the top of the file) to go online.

## Money features
The shop and the "ad" are DEMO ONLY. Nothing is sold, no ad network is loaded, and no payment code exists.

## v3 (3.0.0)
- Hands-on call-outs: every job is a 20-60s scene (hose with wind/heat/hotspots, ladder rescue, spreader/cutter extrication, hazmat plugs and booms, gas detector, CPR rhythm, firebreak raking, sandbags, chainsaw, rubble search, roof tarps). Crew roles and species perks change the scene. 1-3 stars set the pay. Low-tier calls you've already played can be auto-resolved.
- Disasters: bushfire, flood, cyclone, hail storm, earthquake and chemical leak. You get a warning banner, weather overlay and sound, then a town map with damaged zones. Assign crews per zone, play a mini-task, then rebuild with coins and materials. Town happiness and reputation affect pay.
- Easier competitions, with a difficulty curve by league and bigger crew-stat boosts.
- Aussie animal crew: 12 species, each with a passive perk. Gear and rarity show on the portraits.
- v2 saves migrate automatically. The old version is kept in v2/.

## v4 — build your own town
- Land grid next to the station; buy plots (Build ▸ Land ▸ Expand). 30 building types in 7 categories (homes, shops, production, services, fire, decorations, roads), each 1–10 levels with visibly changing models.
- Placement ghost: drag, tap-to-move, rotate, green/red validity, confirm/cancel. Move any building later.
- Builder huts = more concurrent builds (badges). Finish-now with badges or the DEMO ad (−30 min).
- Collect bubbles for coins/🧱 materials; services raise happiness and cut disaster damage; fire buildings add trucks, calls, water, hazmat and a water-bombing helicopter in hands-on fires.
- Calls spawn at your own buildings; failed calls and disasters damage them (smoke, rubble, tape) until repaired.
- Day/night cycle (toggle in Settings), cars and walkers on your roads. Saves migrate from v3 (v3/ keeps the old build).

## v5 — Station Raids (strategy update)
- Build a base around your Station HQ, which sets the level cap for everything. Pumps make Water and mints make Coins; vaults and tanks hold them. Badges are the premium currency.
- Defences: hydrant cannon, sprinkler tower, foam mortar, water-bomber helipad, firebreak walls (place them in runs and upgrade per segment), alarm traps.
- Army: train hose crews, ladder fireys, chainsaw cutters, hazmat specialists, tankers, aerial appliances and water-bombing helis in the barracks. The Research Lab levels up troops, and animal-crew heroes have abilities.
- Drill raids on rival stations: deploy troops around the edge. Earn stars at 50%, for the HQ and at 100%, plus loot and trophies. Leagues run Bronze to Legend.
- Defence: fire waves and arsonists raid your base. Watch the log and replay, and get a shield after a loss.
- The v3 call-outs and v4 disasters and repairs are still in. v4 saves migrate automatically (the v4 build is kept in v4/).
- Fictional game, original art and sound. Not affiliated with any fire service.

## v5.1: cartoon restyle
- Every structure is chunkier and more playful: squat bodies, flared oversized roofs, a slight lean and twist on each building, rounded and bevelled boxes everywhere, and thicker dark outlines.
- Colours are brighter flat paint with 3-step toon shading. Realistic textures are gone; only painted ones remain (hazard stripes, signs).
- A big original hose-nozzle emblem sits on the Engine Bay and the Station HQ.
- Upgrade levels are easy to read: a chunky trim, then a waving flag at level 3, gold-tipped corner spikes at level 5 and a gold dome at level 7. Walls get spikes from level 5.
- Idle squash-and-stretch on buildings, a wobble on collect, and a pop-in when a building is placed.
- Brighter grass with painted tufts, rounded road tiles, round blobby trees.
- Gameplay and saves are unchanged. The v5 build is kept in v5/.

## v5.2: station progression and fair battles
- **Station level gates everything.** Buildings, defences, troops, per-building counts and max levels (station level + 1) all unlock with station level. Tap the station shield (top-left) or the Build-panel banner to see the full unlock table. Upgrading the station needs listed prerequisites, full Station XP, coins and water, and takes time; you can speed it up with badges. Locked shop cards read "Unlocks at Station Lv X", and each level-up shows a confetti popup listing what's new.
- **First-session tutorial** (5 goals with rewards): collect from the Coin Press, raise the cannon to Lv2, train 5 hose crews, win a raid, then reach Station Lv2.
- **Fair matchmaking** (js/progress.js): a duel model compares your army's attack power (⚔️) with a base's defence score (🛡️). It searches generated bases at your station level ±1, with difficulty tunes from −4 to +4, for a ratio in the band 0.8–1.6. Trophy gains and losses scale with the mismatch. The scout card shows the rival's Station Lv, trophies and a Fair/Easy/Tough label, and "Next" is free.
- **Save migration:** v5.1 saves keep every building. Levels above the new cap are lowered, over-cap upgrades are refunded and locked troops are refunded, and a one-off note explains the changes. Veterans skip the tutorial.
- Tests: `node mm-check.mjs` checks fairness; `t10.mjs` runs a fresh-save playthrough and `t10m.mjs` a migration check (screens in screens-v52/).

## v5.2.1
- Hidden fresh start: open the game with `?fresh=1` to wipe this game's saved data (all `fst*` keys, including tutorial and unlock flags) and start a new Lv1 game. The parameter is then removed from the address bar, so refreshing doesn't wipe again. The normal link is unchanged. Test: `node t521.mjs`.

## v5.3: start from an empty block
- **New games** (including `?fresh=1`) start on an empty fenced block with a single "FIRE STATION" lot, 600 coins and 60 💧. The tutorial (6 goals) walks the build order: build the Fire Station (free, 5 s), build the Crew Barracks, build a Coin Press (both starter builds take 5 s), recruit 5 Hose Crews, win your first raid, then upgrade the Station to Lv 2.
- Until the starter builds are done, only the barracks and Coin Press can be built. Then the rest of the Lv1 table opens with a confetti "New buildings unlocked!" popup, and later levels follow the existing unlock table and level-up popups. Call-outs, rush hour and disasters wait until the station exists.
- **Existing saves** load exactly as before: the station is already built, the town is kept, and an in-progress v5.2 tutorial keeps its old goals.
- **Late-game bases (Lv7–10)** now get more defences and less random down-levelling, so full late-game armies get fair matches.
- Tests: `t53.mjs` (new-game playthrough, `?fresh=1`, old saves); screenshots in screens-v53/.
