// Firey Station Tycoon v4: town-building data. World-aligned diamond grid (Clash style) around the station.
export const CELL = 2;            // world units per tile
export const GRID = 28;           // tiles per side, centred on the station
export const CHUNK = 4;           // land plots are 4x4 tiles
export const NCH = Math.ceil(GRID/CHUNK);   // 7 x 7 plots
export const START_PLOTS = ['5,4','6,4','6,5','4,5','4,6','5,6','5,5','6,6','3,6'];

export const CATS = [
  ['def','🛡️','Defences'], ['army','⛺','Army'], ['res','💧','Resources'], ['home','🏠','Homes'], ['shop','🛍️','Shops'], ['prod','🏭','Production'], ['service','🏥','Services'],
  ['fire','🚒','Fire'], ['deco','🌳','Decor'], ['road','🛣️','Roads'], ['land','🗺️','Land'] ];

// rate: coins or mats per hour at level 1 (grows x1.32 per level). cap: hours of storage.
// fx per level: happy, dmg (disaster damage reduction), xp, trucks, calls, water, heli, haz, stable, prod
// unlock: station level needed. max: top level. count: how many you can own at station level L.
export const TB = {
  house:   { cat:'home', name:'Queenslander House', icon:'🏡', w:1,h:1, max:8, unlock:1, cost:[150,0], g:1.55, t0:15, tg:1.75, rate:40, res:'coins', cap:3, pop:4, count:L=>2+L*2,
             desc:'Raised timber home on stumps. Adds residents and pays rates.' },
  units:   { cat:'home', name:'Unit Block', icon:'🏢', w:2,h:2, max:10, unlock:3, cost:[900,4], g:1.5, t0:60, tg:1.7, rate:130, res:'coins', cap:3, pop:14, count:L=>Math.max(0,L-2),
             desc:'Every floor is more rent. Big call-outs if it catches alight.' },
  bakery:  { cat:'shop', name:'Hot Bake Bakery', icon:'🥧', w:1,h:1, max:8, unlock:1, cost:[300,0], g:1.55, t0:20, tg:1.75, rate:70, res:'coins', cap:4, shop:1, count:L=>1+Math.floor(L/3), sign:'BAKERY', desc:'Pies, sausage rolls and lamingtons.' },
  cafe:    { cat:'shop', name:'Flat White Cafe', icon:'☕', w:1,h:1, max:8, unlock:2, cost:[420,0], g:1.55, t0:25, tg:1.75, rate:85, res:'coins', cap:4, shop:1, count:L=>1+Math.floor(L/4), sign:'CAFE', desc:'Smashed avo and strong coffee.' },
  surf:    { cat:'shop', name:'Surf Shack', icon:'🏄', w:1,h:1, max:8, unlock:3, cost:[600,2], g:1.55, t0:30, tg:1.75, rate:100, res:'coins', cap:4, shop:1, count:L=>1, sign:'SURF', desc:'Boards, wax and boardies.' },
  servo:   { cat:'shop', name:'Servo', icon:'⛽', w:2,h:1, max:9, unlock:2, cost:[700,3], g:1.55, t0:40, tg:1.75, rate:120, res:'coins', cap:4, shop:1, count:L=>1, sign:'SERVO', desc:'Fuel, pies and ice. Car fires love it.' },
  pub:     { cat:'shop', name:'Royal Wombat Hotel', icon:'🍺', w:2,h:2, max:10, unlock:4, cost:[1500,6], g:1.5, t0:90, tg:1.7, rate:190, res:'coins', cap:4, shop:1, happy:2, count:L=>1, sign:'HOTEL', desc:'Two-storey corner pub with a wrap-around verandah.' },
  timber:  { cat:'prod', name:'Timber Yard', icon:'🪵', w:2,h:2, max:10, unlock:1, cost:[400,0], g:1.5, t0:30, tg:1.7, rate:4, res:'mats', cap:4, count:L=>1+Math.floor(L/4), desc:'Makes 💧 materials for repairs and rebuilds.' },
  quarry:  { cat:'prod', name:'Quarry', icon:'⛏️', w:2,h:2, max:10, unlock:3, cost:[1100,0], g:1.5, t0:60, tg:1.7, rate:6, res:'mats', cap:4, count:L=>1, desc:'Rock and gravel. Lots of 💧 materials.' },
  farm:    { cat:'prod', name:'Cane Farm', icon:'🌾', w:3,h:2, max:8, unlock:2, cost:[650,0], g:1.5, t0:45, tg:1.7, rate:90, res:'coins', cap:5, happy:1, count:L=>1+Math.floor(L/5), desc:'Sugar cane and a windmill. Grass fires happen here.' },
  hospital:{ cat:'service', name:'District Hospital', icon:'🏥', w:2,h:2, max:8, unlock:4, cost:[2200,8], g:1.5, t0:120, tg:1.7, fx:{happy:4,dmg:.05,stable:.08}, count:L=>1, desc:'Happier town, fewer disaster losses, steadier patients.' },
  police:  { cat:'service', name:'Police Station', icon:'🚓', w:2,h:2, max:8, unlock:2, cost:[900,3], g:1.5, t0:60, tg:1.7, fx:{happy:3,dmg:.03}, count:L=>1, sign:'POLICE', desc:'Keeps traffic moving and the town calm.' },
  school:  { cat:'service', name:'State School', icon:'🏫', w:3,h:2, max:8, unlock:2, cost:[1000,3], g:1.5, t0:70, tg:1.7, fx:{happy:3,xp:.04}, count:L=>1, sign:'SCHOOL', desc:'Raises happiness. Fire safety visits give crew XP.' },
  water:   { cat:'service', name:'Water Tower', icon:'🗼', w:1,h:1, max:8, unlock:2, cost:[700,2], g:1.5, t0:50, tg:1.7, fx:{happy:1,water:.06,dmg:.02}, count:L=>1+Math.floor(L/5), desc:'Bigger hose tanks on call-outs. Less fire damage.' },
  power:   { cat:'service', name:'Power Station', icon:'⚡', w:2,h:2, max:8, unlock:5, cost:[2600,10], g:1.5, t0:150, tg:1.7, fx:{happy:2,prod:.05}, count:L=>1, desc:'Powers the town. Boosts all production.' },
  station2:{ cat:'fire', name:'Satellite Station', icon:'🚒', w:2,h:2, max:6, unlock:3, cost:[1800,6], g:1.6, t0:120, tg:1.75, fx:{trucks:.34,happy:1}, count:L=>Math.min(2,Math.floor((L-1)/2)), sign:'STATION 2', desc:'A second truck bay: +1 truck at level 1, 3 and 6.' },
  training:{ cat:'fire', name:'Training Ground', icon:'🎯', w:2,h:2, max:8, unlock:2, cost:[800,2], g:1.5, t0:60, tg:1.7, fx:{xp:.06}, count:L=>1, desc:'Burn prop and drill yard. More crew XP.' },
  hazdepot:{ cat:'fire', name:'Hazmat Depot', icon:'☣️', w:2,h:2, max:8, unlock:4, cost:[1600,6], g:1.5, t0:100, tg:1.7, fx:{haz:.06,dmg:.02}, count:L=>1, desc:'Spills spread slower on call-outs and in disasters.' },
  rescuebase:{cat:'fire', name:'Rescue Base', icon:'🛠️', w:2,h:2, max:8, unlock:4, cost:[1600,6], g:1.5, t0:100, tg:1.7, fx:{stable:.06,dmg:.02}, count:L=>1, desc:'Longer timing windows and steadier patients on rescues.' },
  helipad: { cat:'fire', name:'Helipad', icon:'🚁', w:2,h:2, max:6, unlock:5, cost:[3000,10], g:1.6, t0:150, tg:1.75, fx:{heli:1,dmg:.03}, count:L=>1, desc:'Water-bombing chopper joins fire scenes and bushfires.' },
  comms:   { cat:'fire', name:'Comms Tower', icon:'📡', w:1,h:1, max:8, unlock:3, cost:[1000,3], g:1.5, t0:70, tg:1.7, fx:{calls:.25}, count:L=>1, desc:'More jobs on the pager at once.' },
  park:    { cat:'deco', name:'Park', icon:'⛲', w:2,h:2, max:5, unlock:1, cost:[250,0], g:1.7, t0:10, tg:2, fx:{happy:1.5}, count:L=>1+Math.floor(L/2), desc:'Fountain, paths and benches.' },
  bbq:     { cat:'deco', name:'BBQ Area', icon:'🍖', w:1,h:1, max:5, unlock:1, cost:[180,0], g:1.7, t0:10, tg:2, fx:{happy:1}, count:L=>1+Math.floor(L/2), desc:'Free public barbie and a picnic shelter.' },
  banana:  { cat:'deco', name:'The Giant Banana', icon:'🍌', w:2,h:2, max:5, unlock:3, cost:[1200,0], g:1.7, t0:30, tg:2, fx:{happy:3}, rate:30, res:'coins', cap:4, count:L=>1, desc:'A roadside landmark. Tourists pay to see it.' },
  pineapple:{cat:'deco', name:'The Giant Pineapple', icon:'🍍', w:2,h:2, max:5, unlock:4, cost:[1500,0], g:1.7, t0:30, tg:2, fx:{happy:3}, rate:35, res:'coins', cap:4, count:L=>1, desc:'Another big thing for the road trip photo album.' },
  beach:   { cat:'deco', name:'Beach', icon:'🏖️', w:2,h:2, max:5, unlock:2, cost:[500,0], g:1.7, t0:15, tg:2, fx:{happy:2}, count:L=>1+Math.floor(L/4), desc:'Sand, surf and flags. Cliff rescues happen here.' },
  gum:     { cat:'deco', name:'Gum Tree', icon:'🌳', w:1,h:1, max:1, unlock:1, cost:[30,0], g:1, t0:0, tg:1, fx:{happy:.25}, count:L=>20+L*4, instant:true, desc:'Ghost gum. Koalas approve.' },
  lamp:    { cat:'deco', name:'Street Lamp', icon:'💡', w:1,h:1, max:1, unlock:1, cost:[20,0], g:1, t0:0, tg:1, fx:{happy:.1}, count:L=>20+L*4, instant:true, desc:'Lights up at night.' },
  hut:     { cat:'deco', name:'Builder Hut', icon:'👷', w:1,h:1, max:1, unlock:1, cost:[0,0], badges:[0,60,120,250,500], g:1, t0:0, tg:1, count:L=>5, instant:true, desc:'Each extra hut adds a builder so you can upgrade more at once.' },
  // ---- v5: Clash-style base pieces ----
  pump:    { cat:'res', name:'Hydrant Pump', icon:'🚰', w:2,h:2, max:10, unlock:1, cost:[200,0], g:1.5, t0:20, tg:1.7, rate:10, res:'mats', cap:4, count:L=>1+Math.floor(L/2), desc:'Pumps 💧 water for training crews and repairs.' },
  mint:    { cat:'res', name:'Coin Press', icon:'🪙', w:2,h:2, max:10, unlock:1, cost:[0,6], g:1.5, t0:20, tg:1.7, rate:120, res:'coins', cap:4, count:L=>1+Math.floor(L/2), desc:'Stamps out coins all day.' },
  vault:   { cat:'res', name:'Coin Vault', icon:'🏦', w:2,h:2, max:10, unlock:1, cost:[300,0], g:1.55, t0:25, tg:1.7, store:{coins:1500}, count:L=>1+Math.floor(L/3), desc:'Raises your coin limit. Raiders go for it.' },
  tank:    { cat:'res', name:'Water Tank', icon:'🛢️', w:2,h:2, max:10, unlock:1, cost:[350,0], g:1.55, t0:25, tg:1.7, store:{mats:80}, count:L=>1+Math.floor(L/3), desc:'Raises your 💧 water limit.' },
  cannon:  { cat:'def', name:'Hydrant Cannon', icon:'🔫', w:2,h:2, max:10, unlock:1, cost:[250,0], g:1.55, t0:20, tg:1.7, count:L=>1+Math.ceil(L/2), desc:'Hard-hitting water jet. Ground targets only.' },
  sprinkler:{cat:'def', name:'Sprinkler Tower', icon:'🌧️', w:2,h:2, max:10, unlock:2, cost:[500,2], g:1.55, t0:30, tg:1.7, count:L=>Math.ceil(L/2), desc:'Fast spray that hits ground and air.' },
  mortar:  { cat:'def', name:'Foam Mortar', icon:'🫧', w:2,h:2, max:8, unlock:3, cost:[900,4], g:1.55, t0:45, tg:1.7, count:L=>Math.max(0,Math.floor((L-1)/2)), desc:'Lobs foam bombs that splash crowds. Cannot hit close up.' },
  bomber:  { cat:'def', name:'Bomber Pad', icon:'🛩️', w:2,h:2, max:8, unlock:4, cost:[1400,6], g:1.55, t0:60, tg:1.7, count:L=>Math.max(0,Math.floor((L-2)/2)), desc:'Water-bomber drones that knock flyers out of the sky.' },
  wall:    { cat:'def', name:'Firebreak Wall', icon:'🧱', w:1,h:1, max:8, unlock:1, cost:[40,0], g:1.9, t0:0, tg:1, count:L=>L*15-5, instant:true, run:true, desc:'Place in runs. Ground crews must cut through.' },
  trap:    { cat:'def', name:'Alarm Trap', icon:'⚠️', w:1,h:1, max:5, unlock:2, cost:[120,0], g:1.7, t0:0, tg:1, count:L=>L, instant:true, desc:'Hidden. Bursts when ground troops step on it.' },
  barracks:{ cat:'army', name:'Crew Barracks', icon:'⛺', w:2,h:2, max:8, unlock:1, cost:[200,0], g:1.6, t0:20, tg:1.75, count:L=>1, desc:'Trains drill crews. Each level unlocks a troop and adds space.' },
  lab:     { cat:'army', name:'Research Lab', icon:'🧪', w:2,h:2, max:8, unlock:2, cost:[700,4], g:1.6, t0:40, tg:1.75, count:L=>1, desc:'Research better troops.' },
  hq:      { cat:'hidden', name:'Station HQ', icon:'🚒', w:4,h:4, max:10, unlock:99, cost:[0,0], g:1, t0:0, tg:1, count:L=>0, desc:'Rival HQ.' },
  road:    { cat:'road', name:'Road', icon:'🛣️', w:1,h:1, max:1, unlock:1, cost:[10,0], g:1, t0:0, tg:1, count:L=>200, instant:true, desc:'Cars and walkers use roads. Drag the ghost to place.' },
};
export const TB_ORDER = Object.keys(TB);
export const upCost = (t,l) => { const d=TB[t]; const f=Math.pow(d.g,l-1); return [Math.round(d.cost[0]*f), Math.round(d.cost[1]*Math.max(1,f*.8))]; };  // cost to reach level l (l=1 is the first build)
export const upTime = (t,l) => { const d=TB[t]; if(d.instant) return 0; return Math.round(d.t0*Math.pow(d.tg,l-1)); };
export const rateAt = (t,l) => { const d=TB[t]; return d.rate? d.rate*Math.pow(1.32,l-1) : 0; };
export const capAt = (t,l) => rateAt(t,l)*(TB[t].cap||3);
export const maxLevelFor = (t,stationL) => Math.min(TB[t].max, stationL+1);
export const plotCost = n => [Math.round(400*Math.pow(1.55,n)), Math.round(n*2)];
export const plotsAllowed = L => 6 + L*2;
// which buildings a call type can happen at
export const CALL_SITES = { bin:['house','bakery','cafe','units','surf'], car:['servo','road'], cat:['gum','park','house'], medical:['house','units','school','beach','pub','cafe'],
  grass:['farm','park','gum'], house:['house'], mva:['servo','road'], spill:['servo','power','quarry'], gas:['cafe','bakery','pub','units'], cliff:['quarry','beach'],
  unit:['units'], tanker:['servo','power'], factory:['timber','quarry','power'] };
export const SITE_VARIANT = { house:'house', units:'unit', timber:'factory', quarry:'factory', power:'factory', servo:'car', bakery:'house', cafe:'house', pub:'house', surf:'house', school:'house' };
// disaster zones damage placed buildings of these categories
export const ZONE_CATS = { houses:['home'], school:['service'], park:['deco'], bridge:['shop','prod'], shops:['shop'], plant:['prod','service'] };
