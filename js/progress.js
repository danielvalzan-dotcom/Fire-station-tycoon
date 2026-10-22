// Firey Station Tycoon v5.2: station-level progression (unlock table, station upgrade with prerequisites,
// save capping), a short first-session tutorial, and fair raid matchmaking. No DOM.
import { TB, TB_ORDER, upCost } from './towndata.js';
import * as W from './wardata.js';
import * as War from './war.js';

export const MAX_STATION = 10;
// buildings and defences can be upgraded to at most station level + 1 (see towndata.maxLevelFor)
export const maxLv = (t,L) => Math.min(TB[t].max, L+1);
// troops: the station level gates which troop types exist; the barracks level still gates training
export const troopSt = t => W.TROOPS[t].st;
export const heroSlotsAt = L => L>=5?2:L>=2?1:0;

/* ---------- unlock table ---------- */
const NAMEABLE = t => TB[t].cat!=='hidden' && TB[t].cat!=='road';
export function unlocksAt(L){ // what is NEW when you reach station level L
  const b=TB_ORDER.filter(t=>NAMEABLE(t)&&TB[t].unlock===L).map(t=>({kind:'build',t,icon:TB[t].icon,name:TB[t].name,cat:TB[t].cat}));
  const tr=W.TROOP_ORDER.filter(t=>troopSt(t)===L).map(t=>({kind:'troop',t,icon:W.TROOPS[t].icon,name:W.TROOPS[t].name}));
  const more=L>1?TB_ORDER.filter(t=>NAMEABLE(t)&&TB[t].unlock<L&&!TB[t].instant&&TB[t].count(L)>TB[t].count(L-1)).map(t=>({kind:'count',t,icon:TB[t].icon,name:TB[t].name,n:TB[t].count(L)})):[];
  const extra=[]; if(heroSlotsAt(L)>heroSlotsAt(L-1)) extra.push({kind:'hero',icon:'🦘',name:`Hero slot ${heroSlotsAt(L)}`});
  if(L>1) extra.push({kind:'cap',icon:'⬆️',name:`Max upgrade level ${L+1}`});
  return [...b,...tr,...extra,...more]; }
export const UNLOCK_TABLE = Array.from({length:MAX_STATION},(_,k)=>({ L:k+1, items:unlocksAt(k+1) }));

/* ---------- station upgrade: XP + prerequisites + cost + timer ---------- */
export const stationCost = L => [Math.round(600*Math.pow(1.9,L-1)), Math.round(20*Math.pow(1.7,L-1))]; // to go L -> L+1
export const stationTime = L => [30,90,300,900,1800,3600,7200,14400,28800][L-1]||28800;
export function stationReqs(L){ // prerequisites to start the upgrade from L to L+1: [type, how many, min level]
  if(L===1) return [['cannon',1,2],['barracks',1,1],['pump',1,1]];
  if(L===2) return [['cannon',2,2],['sprinkler',1,1],['barracks',1,2],['vault',1,2]];
  if(L===3) return [['cannon',2,3],['mortar',1,1],['lab',1,1],['barracks',1,3]];
  return [['cannon',2,L],['sprinkler',1,L-1],['barracks',1,Math.min(8,L)],['vault',1,L],['wall',10,L-1]]; }
export function stationStatus(S, xpNeed){ const L=S.level; if(L>=MAX_STATION) return { max:true, L };
  const have=(t,lv)=>S.tw.items.filter(x=>x.t===t&&x.l>=lv&&!x.dmg).length;
  const reqs=stationReqs(L).map(([t,n,lv])=>({ t, n, lv, have:Math.min(n,have(t,lv)), done:have(t,lv)>=n, text:`${n>1?n+'× ':''}${TB[t].name}${lv>1?' Lv '+lv:''}` }));
  const xpOk=S.xp>=xpNeed; reqs.unshift({ t:'xp', done:xpOk, text:`Station XP ${Math.floor(Math.min(S.xp,xpNeed))}/${xpNeed}`, hint:'Earn XP from call-outs, raids, upgrades and comps' });
  const cost=stationCost(L), time=stationTime(L); const up=S.stUp&&S.stUp.end>Date.now()?S.stUp:null;
  return { L, reqs, ok:reqs.every(r=>r.done), cost, time, up, left:up?Math.max(0,(up.end-Date.now())/1000):0, next:unlocksAt(L+1) }; }
export function startStationUp(S, xpNeed){ const st=stationStatus(S,xpNeed); if(st.max) return 'Station is at max level'; if(S.stUp) return 'Already upgrading';
  const miss=st.reqs.find(r=>!r.done); if(miss) return 'Needs: '+miss.text; if(S.coins<st.cost[0]) return 'Not enough coins'; if(S.materials<st.cost[1]) return 'Not enough 💧 water';
  S.coins-=st.cost[0]; S.materials-=st.cost[1]; S.stUp={ end:Date.now()+st.time*1000, dur:st.time, to:S.level+1 }; return null; }
export const stationSpeedCost = S => S.stUp?Math.max(1,Math.ceil((S.stUp.end-Date.now())/60000)):0;
export function speedStation(S){ if(!S.stUp) return 'Nothing to speed up'; const c=stationSpeedCost(S); if(S.badges<c) return 'Not enough badges'; S.badges-=c; S.stUp.end=Date.now(); return null; }
export function stationTick(S, events){ if(S.stUp&&S.stUp.end<=Date.now()){ S.level=Math.min(MAX_STATION,S.stUp.to); S.xp=0; S.stUp=null; S.badges+=5; events&&events.push({ stationUp:S.level, unlocks:unlocksAt(S.level) }); } }

/* ---------- old saves: keep what they built, cap anything above their level ---------- */
export function capSave(S, xpNeed){ const out={ levels:0, troops:0, refund:0 }; S.level=Math.max(1,Math.min(MAX_STATION,S.level|0)); const L=S.level;
  for(const it of S.tw.items){ const d=TB[it.t]; if(!d||d.cat==='hidden') continue; const m=maxLv(it.t,L); if(it.l>m){ it.l=m; out.levels++; } if(it.up&&it.l+1>m){ const c=upCost(it.t,it.l+1); S.coins+=c[0]; S.materials+=c[1]; delete it.up; out.levels++; } }
  if(S.army){ for(const t of W.TROOP_ORDER){ const n=S.army.troops[t]||0; if(n&&troopSt(t)>L){ out.troops+=n; out.refund+=n*W.TROOPS[t].cost; S.materials+=n*W.TROOPS[t].cost; S.army.troops[t]=0; } }
    S.army.queue=(S.army.queue||[]).filter(q=>{ if(troopSt(q.t)<=L) return true; S.materials+=W.TROOPS[q.t].cost; return false; }); }
  S.xp=Math.min(S.xp||0,xpNeed); return out; }

/* ---------- first-session tutorial ---------- */
export const TUTORIAL = [
  { id:'collect', text:'Collect coins from your Coin Press',       hint:'Tap the 🪙 bubble over the Coin Press', reward:{coins:150},           done:S=>(S.stats.tcollect||0)>=1 },
  { id:'cannon',  text:'Upgrade your Hydrant Cannon to Lv 2',       hint:'Tap the cannon, then Upgrade',          reward:{badges:5,mats:20},     done:S=>S.tw.items.some(x=>x.t==='cannon'&&x.l>=2) },
  { id:'train',   text:'Train 5 Hose Crews',                        hint:'Army ▸ Train',                          reward:{coins:200},           done:S=>(S.army.troops.hose||0)+(S.raidStats.raids?5:0)>=5 },
  { id:'raid',    text:'Win a drill raid (1★ or better)',           hint:'Attack! ▸ Find a base',                 reward:{badges:10},           done:S=>S.raidStats.stars>=1 },
  { id:'station', text:'Upgrade the Station to Lv 2',               hint:'Tap the station level shield',          reward:{coins:300,badges:15}, done:S=>S.level>=2 },
];
// v5.3: new games start on empty land and the tutorial walks the build order (old saves keep TUTORIAL above)
export const STARTER = ['barracks','mint']; // buildable before the rest of the Lv1 table opens
export const TUTORIAL53 = [
  { id:'station', text:'Build your Fire Station',   hint:'Tap the empty lot or Build ▸ Build your Fire Station', reward:{coins:100},          done:S=>S.stb==='done' },
  { id:'barracks',text:'Build the Crew Barracks',   hint:'Build ▸ Army ▸ Crew Barracks, then place it',   reward:{coins:100},           done:S=>S.tw.items.some(x=>x.t==='barracks'&&x.l>=1) },
  { id:'mint',    text:'Build a Coin Press',        hint:'Build ▸ Resources ▸ Coin Press',               reward:{coins:150,mats:20},  done:S=>S.tw.items.some(x=>x.t==='mint'&&x.l>=1) },
  { id:'train',   text:'Recruit 5 Hose Crews',      hint:'Army ▸ Train',                                  reward:{coins:200},           done:S=>(S.army.troops.hose||0)+(S.raidStats.raids?5:0)>=5 },
  { id:'raid',    text:'Win your first raid (1★ or better)', hint:'Attack! ▸ Find a fair match',          reward:{badges:10},           done:S=>S.raidStats.stars>=1 },
  { id:'stlv2',   text:'Upgrade the Station to Lv 2', hint:'Tap the station level shield',                reward:{coins:300,badges:15}, done:S=>S.level>=2 },
];
export const tutList = S => S.v53 ? TUTORIAL53 : TUTORIAL;
export const starterPhase = S => !!(S.v53 && S.tg && !S.tg.done && S.tg.i<3);
export const tutStep = S => S.tg&&!S.tg.done ? tutList(S)[S.tg.i]||null : null;
export function tutClaim(S){ const q=tutStep(S); if(!q||!q.done(S)) return null; const r=q.reward; S.coins+=r.coins||0; S.badges+=r.badges||0; S.materials+=r.mats||0; const was=starterPhase(S); S.tg.i++; if(S.tg.i>=tutList(S).length) S.tg.done=true; return was&&!starterPhase(S)?{...r,opened:true}:r; }

/* ---------- fair matchmaking ---------- */
// Duel model. The army has to chew through the base's HP (time = baseHP / armyDPS) while the defences chew through the
// army (time = groundHP / anti-ground DPS + airHP / anti-air DPS). ratio = sqrt(timeToDie / timeToWin) x K: 1 = even fight.
export function armyStats(army, research={}, heroes=[]){ let hpG=0, hpA=0, dps=0; for(const t of W.TROOP_ORDER){ const n=army[t]||0; if(!n) continue; const s=W.troopStat(t,research[t]||1);
    if(s.air) hpA+=n*s.hp; else hpG+=n*s.hp; dps+=n*s.dps*(s.splash?1.25:1)*(s.jump||s.wallX?1.1:1)*(s.range>=4?1.6:s.range>=3?1.15:1); }
  for(const h of heroes){ const s=W.heroStat(h.lvl||1); hpG+=s.hp; dps+=s.dps; } return { hpG, hpA, dps }; }
export function baseStats(base){ let hp=0, dG=0, dA=0; for(const it of base.items){ const h=W.hpOf(it.t,it.lv), ds=W.defStat(it.t,it.lv);
    if(it.t==='wall') hp+=h*.25; else if(it.t==='trap') dG+=ds.dmg/25; else { hp+=h; if(ds){ const v=ds.dps*Math.min(1.6,ds.range/4)*(ds.splash?1.3:1); if(ds.ground) dG+=v; if(ds.air) dA+=v; } } }
  return { hp, dG, dA }; }
export const attackPower = (army,research,heroes) => { const a=armyStats(army,research,heroes); return Math.round(Math.sqrt((a.hpG+a.hpA)*a.dps)); };
export const defenceScore = base => { const b=baseStats(base); return Math.round(Math.sqrt(b.hp*(b.dG+b.dA*.5))); };
// per rival-level correction learned from simulated battles (mm-check.mjs): the duel model under/over-rates some levels
export const KLV = [1, 1.0, 1.0, .8, .9, .8, .95, 1.3, 1.5, 1.6, 1.6];
export function matchRatio(a, b, lv=1){ if(!a.dps) return 0; const tDie=a.hpG/Math.max(1,b.dG)+a.hpA/Math.max(2,b.dA), tWin=b.hp/a.dps; return Math.sqrt(tDie/tWin)*KR*KLV[Math.max(1,Math.min(10,lv))]; }
export const KR = 1.1; // calibrated in /workspace/games/mm-check.mjs so 1.0 is roughly a coin-flip for one star
export const BAND = [0.8, 1.6]; // accepted attack/defence ratio
export const leagueLevel = tro => tro<150?1:tro<400?2:tro<800?3:tro<1400?4:tro<2000?5:6;
// choose an opponent near the player's station level, trophies and army strength
export function matchmake({ level, trophies, army, seed, bronze }){ const as=army; const ap=Math.round(Math.sqrt((as.hpG+as.hpA)*as.dps)); const L=level; const lo=Math.max(1,L-1), hi=Math.min(MAX_STATION,L+1);
  const want=Math.max(lo,Math.min(hi, Math.round((L*2+Math.min(L,leagueLevel(trophies)))/3)));
  const tries=[]; const r=War.rng(seed);
  // search every (level, tune) pair: tune shifts the rival's building levels -2..+2 inside its station level
  for(let lv=lo;lv<=hi;lv++) for(const tune of [-4,-3,-2,-1,0,1,2,3,4]){ const s=(seed+lv*7919+(tune+4)*104729)>>>0; const base=War.genBase(lv,s,'',tune); if(bronze) base.items=base.items.filter(x=>x.t!=='mortar'&&x.t!=='bomber');
    const ds=defenceScore(base); const ratio=matchRatio(as,baseStats(base),lv); tries.push({ lv, seed:s, tune, ds, ratio, score:Math.abs(Math.log(Math.max(.01,ratio)/1.2))+Math.abs(lv-want)*.12+Math.abs(tune)*.04 }); }
  const inB=tries.filter(t=>t.ratio>=BAND[0]&&t.ratio<=BAND[1]); const pool=(inB.length?inB:tries).sort((a,b)=>a.score-b.score); const pick=pool[Math.floor(r()*Math.min(2,pool.length))];
  const f=Math.max(.5,Math.min(2,1/Math.max(.01,pick.ratio))); const base=W.trophyWin(pick.lv);
  const win=Math.max(4,Math.round(base*Math.pow(f,.8))), lose=Math.max(2,Math.round(base*.6/Math.pow(f,.8)));
  const oppTrophies=Math.max(0,Math.round(trophies+(f-1)*60+(r()-.5)*50));
  return { ...pick, fair:inB.length>0, win, lose, oppTrophies, ap, label:pick.ratio>1.45?'Easy':pick.ratio<0.95?'Tough':'Fair' }; }
