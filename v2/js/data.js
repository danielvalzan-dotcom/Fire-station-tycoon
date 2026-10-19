// Firey Station Tycoon v2: game data. Pure data, no DOM. Tweak balance here.
// Fictional game. Not affiliated with any fire service. Names, places and stations are made up.

export const VERSION = '2.0.0';

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
  { id:'bin',    name:'Wheelie bin fire',        icon:'🗑️', kind:'fire',   tier:1, diff:14,  time:30,  reward:40,  xp:6,
    req:{ff:1}, bonus:['driver'], skills:['firefight','pumping'], blurb:'Someone chucked hot ashes in the green bin again.' },
  { id:'car',    name:'Car fire',                icon:'🚗', kind:'fire',   tier:1, diff:22,  time:40,  reward:65,  xp:9,
    req:{ff:2}, bonus:['driver','officer'], skills:['firefight','pumping'], blurb:'Ute on fire in the servo car park. Plenty of smoke.' },
  { id:'cat',    name:'Cat up a tree',           icon:'🐈', kind:'rescue', tier:1, diff:12,  time:25,  reward:35,  xp:5,
    req:{}, min:1, bonus:['rescue'], skills:['rope','search'], blurb:'Mr Whiskers has been up there since brekkie.' },
  { id:'medical',name:'Medical assist',          icon:'🚑', kind:'medical',tier:1, diff:18,  time:35,  reward:55,  xp:8,
    req:{medic:1}, bonus:['officer'], skills:['care','cpr'], blurb:'Bloke collapsed at the footy. Assist until the ambos arrive.' },
  { id:'grass',  name:'Grass fire',              icon:'🌾', kind:'fire',   tier:2, diff:36,  time:60,  reward:110, xp:14,
    req:{ff:2,driver:1}, bonus:['officer'], skills:['firefight','pumping','driving','fitness'], blurb:'Wind is up and it is heading for the back fences.' },
  { id:'house',  name:'House fire',              icon:'🏠', kind:'fire',   tier:2, diff:48,  time:75,  reward:160, xp:20,
    req:{officer:1,ff:2}, bonus:['driver','medic'], skills:['command','firefight','search','pumping'], blurb:'Smoke from the eaves. Possible person inside.' },
  { id:'mva',    name:'Car crash, person trapped',icon:'💥', kind:'rescue', tier:2, diff:44,  time:70,  reward:150, xp:19, needs:{rescue:1},
    req:{rescue:1,medic:1}, bonus:['officer','ff'], skills:['extric','tools','care'], blurb:'Two-car prang on the highway. Driver pinned by the dash.' },
  { id:'spill',  name:'Chemical spill',          icon:'🧪', kind:'hazmat', tier:2, diff:46,  time:80,  reward:170, xp:21, needs:{hazmat:1},
    req:{hazmat:1,officer:1}, bonus:['ff'], skills:['detect','decon','contain','command'], blurb:'Drums leaking at the pool supply warehouse.' },
  { id:'gas',    name:'Gas leak',                icon:'💨', kind:'hazmat', tier:2, diff:40,  time:60,  reward:140, xp:18, needs:{hazmat:1},
    req:{hazmat:1}, bonus:['officer','ff'], skills:['detect','contain'], blurb:'Strong rotten-egg smell in the cafe strip.' },
  { id:'cliff',  name:'Cliff rescue',            icon:'🧗', kind:'rescue', tier:3, diff:80,  time:110, reward:300, xp:34, needs:{rescue:3},
    req:{rescue:2,officer:1}, bonus:['medic'], skills:['rope','tools','command','care'], blurb:'Bushwalker stuck on a ledge at the lookout.' },
  { id:'unit',   name:'Unit block fire',         icon:'🏢', kind:'fire',   tier:3, diff:95,  time:120, reward:360, xp:40, needs:{engine:3},
    req:{officer:1,ff:3,driver:1}, bonus:['medic','rescue'], skills:['command','firefight','search','pumping','driving'], blurb:'Third floor alight, people on the balconies.' },
  { id:'tanker', name:'Tanker rollover',         icon:'🛢️', kind:'hazmat', tier:3, diff:110, time:140, reward:430, xp:46, needs:{hazmat:3,rescue:1},
    req:{hazmat:2,rescue:1,officer:1}, bonus:['ff','medic'], skills:['contain','decon','extric','command'], blurb:'Fuel tanker on its side, driver trapped, leaking.' },
  { id:'factory',name:'Factory blaze',           icon:'🏭', kind:'fire',   tier:4, diff:170, time:180, reward:700, xp:70, needs:{engine:6,hazmat:2},
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
