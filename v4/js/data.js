// Firey Station Tycoon v3: game data. Pure data, no DOM. Tweak balance here.
// Fictional game. Not affiliated with any fire service. Names, places and stations are made up.

export const VERSION = '3.0.0';

export const BUILDINGS = {
  engine:   { name:'Engine Bay',        icon:'🚒', max:10, base:120,  g:1.75, t0:20,  tg:1.75,
              desc:'Fire trucks live here. More bays mean more call-outs running at once.',
              effect:l=>`${appliances(l)} appliance${appliances(l)>1?'s':''} · ${seats(l)} seats each` },
  tower:    { name:'Training Tower',    icon:'🗼', max:10, base:150,  g:1.8,  t0:30,  tg:1.75,
              desc:'Drills and training. Sets the highest level your crew can reach.',
              effect:l=>`Crew level cap ${crewCap(l)} · training −${l*4}% cost` },
  gym:      { name:'Station Gym',       icon:'🏋️', max:10, base:110,  g:1.8,  t0:25,  tg:1.75,
              desc:'Fitter Fireys. Boosts competition scores and call speed.',
              effect:l=>`+${l*4}% comp score · +${l*2}% job speed` },
  hazmat:   { name:'Hazmat Store',      icon:'☣️', max:10, base:260,  g:1.85, t0:40,  tg:1.8, unlock:3,
              desc:'Chemical suits and detectors. Unlocks hazmat call-outs.',
              effect:l=>l?`Hazmat calls up to tier ${Math.ceil(l/2)} · +${l*5}% hazmat skill`:'Build to unlock hazmat call-outs' },
  rescue:   { name:'Rescue Workshop',   icon:'🛠️', max:10, base:240,  g:1.85, t0:40,  tg:1.8, unlock:2,
              desc:'Cutters, spreaders and rope kits. Unlocks tech rescue call-outs.',
              effect:l=>l?`Rescue calls up to tier ${Math.ceil(l/2)} · +${l*5}% rescue skill`:'Build to unlock rescue call-outs' },
  quarters: { name:'Quarters & Kitchen',icon:'🍳', max:10, base:90,   g:1.7,  t0:15,  tg:1.7,
              desc:'Beds, a big fridge and a sausage sizzle stand that earns coins all day.',
              effect:l=>`Crew beds ${crewBeds(l)} · sizzle earns ${fmt(sizzleRate(l))}/hr (holds ${fmt(sizzleCap(l))})` },
  comms:    { name:'Comms Room',        icon:'📡', max:10, base:140,  g:1.8,  t0:25,  tg:1.75,
              desc:'Radios and the pager system. More call-outs, bigger jobs.',
              effect:l=>`${maxCalls(l)} calls on the board · new call every ${callEvery(l)}s` },
};
export const BUILD_ORDER = ['engine','tower','gym','hazmat','rescue','quarters','comms'];
export const appliances = l => 1 + Math.floor(l/3);
export const seats = l => Math.min(6, 3 + Math.floor((l+1)/3));
export const crewCap = l => 2 + l*3;
export const crewBeds = l => 3 + l*2;
export const sizzleRate = l => Math.round(60*Math.pow(1.55,l-1));      // coins per hour
export const sizzleCap = l => sizzleRate(l)*3;
export const maxCalls = l => 2 + Math.ceil(l/2);
export const callEvery = l => Math.max(12, 40 - l*3);
export function buildCost(id,l){ const b=BUILDINGS[id]; return Math.round(b.base*Math.pow(b.g,l)); } // cost to go l -> l+1
export function buildTime(id,l){ const b=BUILDINGS[id]; return l===0&&!b.unlock?10:Math.round(b.t0*Math.pow(b.tg,l)); } // seconds
export const badgeSpeedCost = sec => Math.max(1, Math.ceil(sec/60));

export const ROLES = {
  officer: { name:'Station Officer', short:'Officer', icon:'⭐', color:'#e53935',
             skills:[['command','Command','Team success bonus'],['sizeup','Size-up','Faster jobs'],['morale','Morale','More XP for the team']] },
  ff:      { name:'Firefighter', short:'Firefighter', icon:'🔥', color:'#fb8c00',
             skills:[['firefight','Firefighting','Fire attack power'],['search','Search & Rescue','Finds people faster'],['fitness','Fitness','Competition power']] },
  rescue:  { name:'Tech Rescue Specialist', short:'Tech Rescue', icon:'🛠️', color:'#1e88e5',
             skills:[['extric','Extrication','Car crash entrapments'],['rope','Rope Rescue','Heights and cliffs'],['tools','Cutting Tools','Speed on rescues']] },
  hazmat:  { name:'Hazmat Specialist', short:'Hazmat', icon:'☣️', color:'#c0ca33',
             skills:[['detect','Detection','Find the leak'],['decon','Decon','Safety and success'],['contain','Containment','Speed on spills']] },
  driver:  { name:'Driver / Pump Operator', short:'Driver', icon:'🚚', color:'#8e24aa',
             skills:[['driving','Driving','Faster travel'],['pumping','Pumping','Water on target'],['nav','Navigation','Shorter call-outs']] },
  medic:   { name:'First Aid', short:'First Aid', icon:'➕', color:'#43a047',
             skills:[['care','Patient Care','Medical success'],['cpr','CPR','Critical saves'],['triage','Triage','Big incidents']] },
};
export const ROLE_ORDER = ['officer','ff','driver','rescue','hazmat','medic'];
export const recruitCost = n => Math.round(80*Math.pow(1.55, Math.max(0,n-2)));
export const xpNeed = lvl => Math.round(20*Math.pow(1.35,lvl-1));
export const trainCost = (lvl,towerLvl) => Math.round(25*Math.pow(1.45,lvl-1)*(1-towerLvl*0.04));
export const SKILL_MAX = 10;

export const GEAR_SLOTS = [['helmet','Helmet','⛑️'],['coat','Turnout Coat','🧥'],['boots','Boots','🥾'],['ba','BA Set','🫧']];
// tier 0 = issue kit
export const RARITY = [
  { name:'Issue',     color:'#b0a89a', glow:'#8d8578', bonus:0 },
  { name:'Common',    color:'#e8e2d4', glow:'#bdb5a3', bonus:4 },
  { name:'Rare',      color:'#42a5f5', glow:'#1565c0', bonus:9 },
  { name:'Epic',      color:'#ab47bc', glow:'#6a1b9a', bonus:16 },
  { name:'Legendary', color:'#ffca28', glow:'#ff8f00', bonus:26 },
];
// cost to upgrade a slot from tier t to t+1: [coins, badges]
export const gearCost = t => [[60,0],[220,0],[700,8],[2200,30]][t] || null;

// Call-outs. req = must-have roles, bonus = nice-to-have (adds success), power = which skills count
export const CALLS = [
  { id:'bin',    scene:'hose', name:'Wheelie bin fire',        icon:'🗑️', kind:'fire',   tier:1, diff:14,  time:30,  reward:40,  xp:6,
    req:{ff:1}, bonus:['driver'], skills:['firefight','pumping'], blurb:'Someone chucked hot ashes in the green bin again.' },
  { id:'car',    scene:'hose', name:'Car fire',                icon:'🚗', kind:'fire',   tier:1, diff:22,  time:40,  reward:65,  xp:9,
    req:{ff:2}, bonus:['driver','officer'], skills:['firefight','pumping'], blurb:'Ute on fire in the servo car park. Plenty of smoke.' },
  { id:'cat',    scene:'ladder', name:'Cat up a tree',           icon:'🐈', kind:'rescue', tier:1, diff:12,  time:25,  reward:35,  xp:5,
    req:{}, min:1, bonus:['rescue'], skills:['rope','search'], blurb:'Mr Whiskers has been up there since brekkie.' },
  { id:'medical',scene:'cpr', name:'Medical assist',          icon:'🚑', kind:'medical',tier:1, diff:18,  time:35,  reward:55,  xp:8,
    req:{medic:1}, bonus:['officer'], skills:['care','cpr'], blurb:'Bloke collapsed at the footy. Assist until the ambos arrive.' },
  { id:'grass',  scene:'firebreak', name:'Grass fire',              icon:'🌾', kind:'fire',   tier:2, diff:36,  time:60,  reward:110, xp:14,
    req:{ff:2,driver:1}, bonus:['officer'], skills:['firefight','pumping','driving','fitness'], blurb:'Wind is up and it is heading for the back fences.' },
  { id:'house',  scene:'hose', name:'House fire',              icon:'🏠', kind:'fire',   tier:2, diff:48,  time:75,  reward:160, xp:20,
    req:{officer:1,ff:2}, bonus:['driver','medic'], skills:['command','firefight','search','pumping'], blurb:'Smoke from the eaves. Possible person inside.' },
  { id:'mva',    scene:'extricate', name:'Car crash, person trapped',icon:'💥', kind:'rescue', tier:2, diff:44,  time:70,  reward:150, xp:19, needs:{rescue:1},
    req:{rescue:1,medic:1}, bonus:['officer','ff'], skills:['extric','tools','care'], blurb:'Two-car prang on the highway. Driver pinned by the dash.' },
  { id:'spill',  scene:'hazmat', name:'Chemical spill',          icon:'🧪', kind:'hazmat', tier:2, diff:46,  time:80,  reward:170, xp:21, needs:{hazmat:1},
    req:{hazmat:1,officer:1}, bonus:['ff'], skills:['detect','decon','contain','command'], blurb:'Drums leaking at the pool supply warehouse.' },
  { id:'gas',    scene:'gas', name:'Gas leak',                icon:'💨', kind:'hazmat', tier:2, diff:40,  time:60,  reward:140, xp:18, needs:{hazmat:1},
    req:{hazmat:1}, bonus:['officer','ff'], skills:['detect','contain'], blurb:'Strong rotten-egg smell in the cafe strip.' },
  { id:'cliff',  scene:'ladder', name:'Cliff rescue',            icon:'🧗', kind:'rescue', tier:3, diff:80,  time:110, reward:300, xp:34, needs:{rescue:3},
    req:{rescue:2,officer:1}, bonus:['medic'], skills:['rope','tools','command','care'], blurb:'Bushwalker stuck on a ledge at the lookout.' },
  { id:'unit',   scene:'hose', name:'Unit block fire',         icon:'🏢', kind:'fire',   tier:3, diff:95,  time:120, reward:360, xp:40, needs:{engine:3},
    req:{officer:1,ff:3,driver:1}, bonus:['medic','rescue'], skills:['command','firefight','search','pumping','driving'], blurb:'Third floor alight, people on the balconies.' },
  { id:'tanker', scene:'extricate', name:'Tanker rollover',         icon:'🛢️', kind:'hazmat', tier:3, diff:110, time:140, reward:430, xp:46, needs:{hazmat:3,rescue:1},
    req:{hazmat:2,rescue:1,officer:1}, bonus:['ff','medic'], skills:['contain','decon','extric','command'], blurb:'Fuel tanker on its side, driver trapped, leaking.' },
  { id:'factory',scene:'hose', name:'Factory blaze',           icon:'🏭', kind:'fire',   tier:4, diff:170, time:180, reward:700, xp:70, needs:{engine:6,hazmat:2},
    req:{officer:1,ff:3,driver:1,hazmat:1}, bonus:['medic','rescue'], skills:['command','firefight','pumping','detect','triage'], blurb:'Huge fire at the paint factory. All hands.' },
];

export const COMPS = [
  { id:'hose',   name:'Hose Drag Relay', icon:'🧯', game:'mash',   skills:['fitness','pumping','driving'],
    how:'Tap as fast as you can to drag the hose to the line!' },
  { id:'ladder', name:'Ladder Climb',    icon:'🪜', game:'timing', skills:['rope','fitness','command'],
    how:'Tap when the marker is in the green zone to climb each rung.' },
  { id:'dummy',  name:'Dummy Drag',      icon:'🧍', game:'rhythm', skills:['fitness','search','care'],
    how:'Tap LEFT, RIGHT, LEFT, RIGHT in time to haul the dummy.' },
  { id:'bucket', name:'Bucket Brigade',  icon:'🪣', game:'catch',  skills:['pumping','fitness','contain'],
    how:'Tap when the bucket reaches the middle to pass it on. Perfect timing scores big.' },
];
export const LEAGUES = [
  { name:'Bronze',   min:0,    color:'#cd7f32', reward:[80,2]   },
  { name:'Silver',   min:150,  color:'#cfd8dc', reward:[160,3]  },
  { name:'Gold',     min:400,  color:'#ffca28', reward:[300,4]  },
  { name:'Platinum', min:800,  color:'#80deea', reward:[550,6]  },
  { name:'Diamond',  min:1300, color:'#b388ff', reward:[900,8]  },
  { name:'Champion', min:2000, color:'#ff5252', reward:[1500,12]},
];
export const leagueOf = tr => { let i=0; LEAGUES.forEach((l,j)=>{ if(tr>=l.min) i=j; }); return i; };

export const RIVAL_NAMES = ['Wombat Creek Fireys','Bogong Ridge Station','Kookaburra Hill Crew','Brolga Bay Station','Platypus Point Fireys',
  'Billabong Flats Crew','Echidna Gully Station','Dingo Downs Fireys','Galah Gardens Crew','Possum Park Station','Quokka Cove Fireys','Emu Plains Crew'];
export const CREW_NAMES = ['Davo','Shazza','Macca','Tommo','Robbo','Kez','Jonno','Bec','Mel','Gazza','Bazza','Steph','Jacko','Lozza','Nat','Sully',
  'Hendo','Tash','Mick','Jess','Smithy','Rach','Woody','Bluey','Coops','Fitzy','Gem','Harps','Ange','Dazza','Kirsty','Rob','Tez','Wilko','Sam','Pip'];
export const SKIN_TONES = ['#f6d3b3','#e9b98f','#c98e63','#9a6440','#6b4329','#f1c7a1'];
export const HAIR = ['#2b1d14','#5a3a22','#a0522d','#d9b26f','#1a1a1a','#8d8d8d'];

export const SHOP = [
  { id:'badges1', icon:'badge', name:'Pouch of 80 badges',  price:'A$1.99', desc:'Speed up upgrades and buy Epic gear.' },
  { id:'badges2', icon:'badge', name:'Crate of 500 badges', price:'A$7.99', desc:'Best value. Popular choice.' },
  { id:'starter', icon:'🎁', name:'Starter pack', price:'A$2.99', desc:'2,000 coins, 100 badges and a Rare helmet for everyone.' },
  { id:'builder', icon:'👷', name:'Second builder', price:'A$4.99', desc:'Upgrade two buildings at once.' },
  { id:'noads',   icon:'🚫', name:'Remove ads', price:'A$4.99', desc:'No ads ever. Free speed-ups stay.' },
  { id:'xmas',    icon:'🎄', name:'Christmas station', price:'A$2.99', desc:'Tinsel, lights and a Santa hat on the tower.' },
];

export function fmt(n){ n=Math.floor(n); if(n<1000) return String(n);
  const u=['k','M','B','T']; let i=-1, x=n; while(x>=1000&&i<u.length-1){ x/=1000; i++; }
  return (x<10?x.toFixed(2):x<100?x.toFixed(1):Math.floor(x))+u[i]; }
export function fmtTime(s){ s=Math.max(0,Math.ceil(s)); const h=Math.floor(s/3600), m=Math.floor(s%3600/60), ss=s%60;
  return h?`${h}h ${m}m`:m?`${m}m ${String(ss).padStart(2,'0')}s`:`${ss}s`; }

/* ---------- v3: Aussie animal crew ---------- */
// perk fields: pay/xp (+fraction), speed (job time cut), power:{kind:+fraction}, heat (heat damage cut), water, tap (tap power in
// mash/cutting), calm (timing windows), search (find people/leaks), spot (shows hotspots), happy (town happiness bonus)
export const SPECIES = {
  roo:        { name:'Kangaroo',          perk:'Big Hops',          desc:'Gets there faster: jobs take 10% less time, +15% climb speed.', fx:{speed:.10, climb:.15} },
  koala:      { name:'Koala',             perk:'Chill Under Pressure', desc:'Timing windows 20% wider in CPR, spreaders and ladders.', fx:{calm:.20} },
  wombat:     { name:'Wombat',            perk:'Built Like a Brick',  desc:'+15% power on rescues and collapses. Shrugs off heat.', fx:{power:{rescue:.15,collapse:.15}, heat:.2} },
  emu:        { name:'Emu',               perk:'Long Legs',         desc:'+20% speed in hose drags and dummy drags.', fx:{comp:{mash:.12,rhythm:.2}} },
  cockatoo:   { name:'Cockatoo',          perk:'Lookout',           desc:'Screeches when it spots hotspots and leaks. +10% XP for the team.', fx:{spot:1, xp:.10} },
  platypus:   { name:'Platypus',          perk:'Water Wizard',      desc:'+30% on floods and water rescues, +10% hose pressure.', fx:{power:{flood:.30}, water:.10} },
  echidna:    { name:'Echidna',           perk:'Spiky Shield',      desc:'Fire-resistant: heat builds 40% slower in fire scenes.', fx:{heat:.40, power:{fire:.05}} },
  quokka:     { name:'Quokka',            perk:'Happy Vibes',       desc:'Town happiness +50% from jobs. +10% XP.', fx:{happy:.5, xp:.10} },
  dingo:      { name:'Dingo',             perk:'Sniffer',           desc:'Finds trapped people and gas leaks 25% faster.', fx:{search:.25} },
  lizard:     { name:'Frill-necked Lizard', perk:'Heat Lover',      desc:'+20% firefighting power on grass and bush fires.', fx:{power:{bush:.20}, heat:.15} },
  kookaburra: { name:'Kookaburra',        perk:'Early Bird',        desc:'+10% coins from every job. Laughs at danger.', fx:{pay:.10} },
  devil:      { name:'Tassie Devil',      perk:'Whirlwind',         desc:'+25% tap power in cutting, digging and hose drags.', fx:{tap:.25, comp:{mash:.08}} },
};
export const SPECIES_ORDER = ['roo','koala','wombat','emu','cockatoo','platypus','echidna','quokka','dingo','lizard','kookaburra','devil'];
// portrait look for the SVG fallback (and in-world head tokens)
export const SPECIES_LOOK = {
  roo:{fur:'#b9824f',fur2:'#e8c79a',ear:'tall',snout:'long',nose:'#3b2418',eye:'#4a2c17'},
  koala:{fur:'#9aa0a6',fur2:'#e6e7e8',ear:'fluffy',snout:'koala',nose:'#2f3236',eye:'#3a2a1c'},
  wombat:{fur:'#8a6a4a',fur2:'#b9976f',ear:'small',snout:'wide',nose:'#3a2a20',eye:'#2a1a10'},
  emu:{fur:'#5b4a3c',fur2:'#8d7b6b',ear:'none',snout:'beak',nose:'#3a3a3a',eye:'#d9711c',neck:1},
  cockatoo:{fur:'#f4f4f0',fur2:'#ffffff',ear:'crest',snout:'hook',nose:'#2e2e2e',eye:'#3a2a1c'},
  platypus:{fur:'#6b4a33',fur2:'#8b6a4f',ear:'none',snout:'bill',nose:'#5a4a40',eye:'#2a1a10'},
  echidna:{fur:'#a87b52',fur2:'#d4ad83',ear:'spines',snout:'needle',nose:'#2a1a10',eye:'#2a1a10'},
  quokka:{fur:'#a5764b',fur2:'#d9b48c',ear:'round',snout:'short',nose:'#3a2418',eye:'#2a1a10',smile:1},
  dingo:{fur:'#d08a3c',fur2:'#f3dfbf',ear:'pointy',snout:'long',nose:'#2a1a10',eye:'#5a3415'},
  lizard:{fur:'#7c9a3d',fur2:'#c5d38a',ear:'frill',snout:'lizard',nose:'#3d4d1e',eye:'#e3b11f'},
  kookaburra:{fur:'#f1e6d6',fur2:'#ffffff',ear:'none',snout:'beak',nose:'#4a4a4a',eye:'#5a3415',mask:'#6b4a2f'},
  devil:{fur:'#262626',fur2:'#e8b9a8',ear:'pink',snout:'short',nose:'#1a1a1a',eye:'#5a3415',teeth:1},
};

/* ---------- v3: action call-out scenes ---------- */
export const SCENES = {
  hose:{ name:'Knock it down', how:'Touch and hold to aim the hose. Watch the wind and your water tank.' },
  ladder:{ name:'Ladder rescue', how:'Drag the ladder tip to the casualty, then tap to climb and bring them down.' },
  extricate:{ name:'Free the driver', how:'Hold to pump the spreader, release in the green. Then time the cutter on each post.' },
  hazmat:{ name:'Contain the spill', how:'Hold on leaks to plug them. Drag booms onto the spill edges to stop the spread.' },
  gas:{ name:'Find the leak', how:'Drag the detector around. Faster beeps mean closer. Hold on the leak to shut it.' },
  cpr:{ name:'CPR', how:'Tap on each beat (about 2 a second). Hold for the breaths when asked.' },
  firebreak:{ name:'Firebreak', how:'Drag across the grass to rake a firebreak. Tap flames to wet them down. Save the houses!' },
  sandbag:{ name:'Sandbag the levee', how:'Drag sandbags from the pile onto the lowest part of the levee before the river spills.' },
  chainsaw:{ name:'Clear the tree', how:'Hold on each cut mark to saw. Let go when the saw starts to bind (red), then keep going.' },
  rubble:{ name:'Search the rubble', how:'Tap rubble to lift it. Avoid the cracked support posts. Find everyone trapped.' },
  tarp:{ name:'Tarp the roofs', how:'Drag tarps onto the holes in the roofs before the rain gets in.' },
};
// which calls can be auto-resolved once played manually (low-level ones)
export const AUTO_TIER = 2;
export const starPay = s => [0.35,1,1.25,1.6][s];

/* ---------- v3: disasters ---------- */
// zones: task scene, role that must lead, kind used for species perks, structures damaged if the zone is left or done badly
export const DISASTERS = {
  bushfire:{ name:'Bushfire front', icon:'🔥', wx:'ash', warn:'Bushfire front approaching from the west. Hot, dry and windy.',
    zones:[ {id:'ridge',name:'Ridge Road houses',task:'firebreak',lead:'ff',kind:'bush',town:'houses'},
            {id:'school',name:'Primary school',task:'hose',lead:'officer',kind:'fire',town:'school'},
            {id:'base',name:'Your station',task:'hose',lead:'driver',kind:'fire',base:['quarters','gym']} ] },
  flood:{ name:'Flash flood', icon:'🌊', wx:'rain', warn:'Heavy rain upstream. The creek is rising fast.',
    zones:[ {id:'levee',name:'Creek levee',task:'sandbag',lead:'ff',kind:'flood',town:'houses'},
            {id:'caravan',name:'Caravan park',task:'ladder',lead:'rescue',kind:'flood',town:'park'},
            {id:'base',name:'Your station',task:'sandbag',lead:'driver',kind:'flood',base:['engine','comms']} ] },
  cyclone:{ name:'Cyclone', icon:'🌀', wx:'wind', warn:'Cyclone crossing the coast tonight. Destructive winds.',
    zones:[ {id:'highway',name:'Highway blocked',task:'chainsaw',lead:'rescue',kind:'rescue',town:'bridge'},
            {id:'shops',name:'Main Street shops',task:'tarp',lead:'ff',kind:'rescue',town:'shops'},
            {id:'units',name:'Collapsed carport',task:'rubble',lead:'rescue',kind:'collapse',town:'houses'},
            {id:'base',name:'Your station',task:'tarp',lead:'officer',kind:'rescue',base:['tower','quarters']} ] },
  hail:{ name:'Supercell hailstorm', icon:'🌩️', wx:'hail', warn:'Severe storm with giant hail heading our way.',
    zones:[ {id:'roofs',name:'Wattle Street roofs',task:'tarp',lead:'ff',kind:'rescue',town:'houses'},
            {id:'tree',name:'Tree on a car',task:'chainsaw',lead:'rescue',kind:'rescue',town:'park'},
            {id:'base',name:'Your station',task:'tarp',lead:'driver',kind:'rescue',base:['gym','comms']} ] },
  quake:{ name:'Earth tremor', icon:'🏚️', wx:'shake', warn:'Rare earth tremor! Old buildings may collapse.',
    zones:[ {id:'pub',name:'Old pub collapse',task:'rubble',lead:'rescue',kind:'collapse',town:'shops'},
            {id:'gasmain',name:'Gas main cracked',task:'gas',lead:'hazmat',kind:'hazmat',town:'houses'},
            {id:'injured',name:'Injured at the bowls club',task:'cpr',lead:'medic',kind:'medical',town:'park'},
            {id:'base',name:'Your station',task:'rubble',lead:'officer',kind:'collapse',base:['tower','engine']} ] },
  chem:{ name:'Chemical plant leak', icon:'☣️', wx:'fog', warn:'Toxic cloud from the pool chemical plant. Shelter in place!',
    zones:[ {id:'plant',name:'Leaking tank farm',task:'hazmat',lead:'hazmat',kind:'hazmat',town:'plant'},
            {id:'valve',name:'Gas valve room',task:'gas',lead:'hazmat',kind:'hazmat',town:'plant'},
            {id:'workers',name:'Overcome workers',task:'cpr',lead:'medic',kind:'medical',town:'shops'},
            {id:'base',name:'Your station',task:'hazmat',lead:'officer',kind:'hazmat',base:['hazmat','quarters']} ] },
};
export const DISASTER_ORDER = ['bushfire','flood','hail','cyclone','chem','quake'];
export const DISASTER_UNLOCK = 2;            // station level for the first disaster
export const disasterGap = () => (18+Math.random()*12)*60e3;   // ms between disasters
export const TOWN = {
  houses:{ name:'Ridge Road houses', icon:'🏘️', cost:[260,6] },
  school:{ name:'Primary school', icon:'🏫', cost:[420,10] },
  park:{ name:'Park & caravan park', icon:'🏕️', cost:[200,5] },
  bridge:{ name:'Creek bridge', icon:'🌉', cost:[380,9] },
  shops:{ name:'Main Street shops', icon:'🏪', cost:[340,8] },
  plant:{ name:'Pool chemical plant', icon:'🏭', cost:[460,12] },
};
export const baseRepairCost = (id,l) => [Math.round(60+buildCost(id,Math.max(0,l-1))*.35), 3+l*2];
