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
