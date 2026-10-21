// Firey Station Tycoon v5: drill-raid data. Troops, defences, heroes, enemy fire waves. All original names.
// Units are in tiles (1 tile = one grid cell). dps = damage per second, range in tiles, speed in tiles/s.
export const TROOPS = {
  hose:    { name:'Hose Crew',          icon:'🧑‍🚒', hp:110, dps:16, range:2.6, speed:1.5, house:1, prefer:'def',  cost:4,  time:8,  unlock:1, col:'#e53935', desc:'Sprays down defences first.' },
  ladder:  { name:'Ladder Firey',       icon:'🪜', hp:190, dps:12, range:.7,  speed:1.6, house:2, prefer:'any',  cost:7,  time:12, unlock:1, col:'#fb8c00', jump:true, desc:'Climbs straight over walls.' },
  chainsaw:{ name:'Chainsaw Cutter',    icon:'🪚', hp:95,  dps:14, range:.6,  speed:2.1, house:1, prefer:'wall', cost:5,  time:10, unlock:2, col:'#43a047', wallX:4, desc:'Cuts through firebreak walls fast.' },
  hazmat:  { name:'Hazmat Specialist',  icon:'☣️', hp:160, dps:15, range:3.2, speed:1.2, house:3, prefer:'any',  cost:12, time:18, unlock:3, col:'#fdd835', splash:1.3, desc:'Foam blasts that hit a whole area.' },
  tanker:  { name:'Tanker Truck',       icon:'🚛', hp:700, dps:18, range:.9,  speed:1.0, house:5, prefer:'res',  cost:20, time:30, unlock:4, col:'#8e24aa', big:true, desc:'Tough as. Goes for pumps and storages.' },
  aerial:  { name:'Aerial Appliance',   icon:'🚒', hp:420, dps:34, range:4.8, speed:1.0, house:6, prefer:'any',  cost:28, time:40, unlock:5, col:'#d32f2f', big:true, desc:'Long-reach monitor on a turntable ladder.' },
  heli:    { name:'Water-bomber Heli',  icon:'🚁', hp:480, dps:30, range:1.6, speed:1.4, house:8, prefer:'any',  cost:40, time:55, unlock:6, col:'#ff7043', air:true, splash:1.6, desc:'Flies over walls and dumps water on targets.' },
};
export const TROOP_ORDER = Object.keys(TROOPS);
export const troopStat = (t,lv) => { const d=TROOPS[t], k=1+.2*(lv-1); return { ...d, hp:Math.round(d.hp*k), dps:d.dps*k }; };
export const researchCost = (t,lv) => [Math.round(400*Math.pow(1.9,lv-1)*(1+TROOP_ORDER.indexOf(t)*.25)), Math.round(4*Math.pow(1.7,lv-1))]; // [coins, water] to reach lv+1
export const researchTime = (t,lv) => Math.round(45*Math.pow(1.9,lv-1));
export const maxResearch = labL => Math.min(8, 1+labL);
export const campCap = barracksL => barracksL<1?0: 15+barracksL*5;

// enemy "fire wave" units that raid your base while you are offline
export const ENEMIES = {
  ember:   { name:'Ember Imp',   icon:'🔥', hp:70,  dps:12, range:.6, speed:2.0, prefer:'any', col:'#ff9800' },
  blaze:   { name:'Blaze Brute', icon:'🌋', hp:420, dps:22, range:.8, speed:1.0, prefer:'def', col:'#e64a19', big:true },
  firebug: { name:'Firebug',     icon:'🪲', hp:120, dps:16, range:.7, speed:1.7, prefer:'res', col:'#6d4c41' },
  smoke:   { name:'Smoke Wraith',icon:'💨', hp:260, dps:20, range:1.4, speed:1.3, prefer:'any', col:'#616161', air:true, splash:1.2 },
};

// defence stats. rate = seconds between shots
export const DEF = {
  cannon:   { range:5.2, dps:24, ground:true,  air:false, rate:1.0, proj:'jet' },
  sprinkler:{ range:3.8, dps:15, ground:true,  air:true,  rate:.35, proj:'spray', splash:.7 },
  mortar:   { range:7.5, min:2.2, dps:20, ground:true, air:false, rate:4.0, proj:'foam', splash:1.6 },
  bomber:   { range:6.5, dps:46, ground:false, air:true,  rate:1.2, proj:'bomb' },
  trap:     { trig:.9, dmg:140, splash:1.6 },
};
export const defStat = (t,lv) => { const d=DEF[t]; if(!d) return null; const k=1+.24*(lv-1); return { ...d, dps:(d.dps||0)*k, dmg:(d.dmg||0)*k }; };
const HP = { hq:2600, cannon:560, sprinkler:500, mortar:600, bomber:620, wall:320, vault:760, tank:760, pump:420, mint:420, barracks:520, lab:540, house:300, units:520, trap:1 };
export const hpOf = (t,lv) => t==='wall'? Math.round(320*Math.pow(1.55,lv-1)) : Math.round((HP[t]||380)*(1+.24*(lv-1)));
export const RES_TYPES = ['vault','tank','pump','mint','hq'];
export const DEF_TYPES = ['cannon','sprinkler','mortar','bomber'];

// heroes: an Aussie animal crew member joins the raid. Ability fires once per raid from the hero button.
export const HEROES = {
  roo:      { ability:'Big Leap',      icon:'🦘', desc:'Bounds onto the target and slams everything around it.' },
  koala:    { ability:'Gum Leaf Heal', icon:'🌿', desc:'Heals nearby troops over 3 seconds.' },
  wombat:   { ability:'Bulldoze',      icon:'💥', desc:'Flattens nearby walls and stuns defences.' },
  platypus: { ability:'Electro Sense', icon:'⚡', desc:'Disarms traps and jams defences nearby for 5 s.' },
  _:        { ability:'Rally Cry',     icon:'📣', desc:'Nearby troops move and spray 40% faster for 6 s.' },
};
export const heroFor = sp => HEROES[sp] ? sp : '_';
export const heroStat = lvl => ({ hp:Math.round(900*(1+.12*(lvl-1))), dps:28*(1+.12*(lvl-1)), range:1.2, speed:1.6 });

// leagues for raid trophies (shared with v3 Station Cup trophies)
export const trophyWin = L => 10+L*2;
