// Firey Station Tycoon v5: army, research, storage limits, drill raids and offline fire-wave defence. No DOM.
import { S, addCoins } from './state.js';
import * as T from './town.js';
import { TB, capAt } from './towndata.js';
import * as W from './wardata.js';
import * as War from './war.js';
import { Backend } from './backend.js';
import * as P from './progress.js';
const now=()=>Date.now();

export function ensureArmy(){ S.army=Object.assign({ troops:{}, queue:[], research:{}, lab:null, heroes:null }, S.army||{});
  S.def=Object.assign({ log:[], shield:0, next:now()+25*60e3, raids:0, wins:0 }, S.def||{}); S.raidStats=Object.assign({ raids:0, stars:0, three:0, best:0 }, S.raidStats||{});
  for(const t of W.TROOP_ORDER) if(!S.army.research[t]) S.army.research[t]=1; }

/* ---------- storage limits (HQ holds a base amount, vaults and tanks add more) ---------- */
const lvOf=t=>S.tw.items.filter(x=>x.t===t&&x.l>0&&!x.dmg);
export const coinCap=()=>2000+S.level*1000+lvOf('vault').reduce((a,x)=>a+Math.round(TB.vault.store.coins*Math.pow(1.6,x.l-1)),0);
export const waterCap=()=>60+S.level*20+lvOf('tank').reduce((a,x)=>a+Math.round(TB.tank.store.mats*Math.pow(1.6,x.l-1)),0);
export const roomFor=res=>res==='mats'?Math.max(0,waterCap()-S.materials):Math.max(0,coinCap()-S.coins);
export const barracksL=()=>Math.max(0,...S.tw.items.filter(x=>x.t==='barracks'&&!x.dmg).map(x=>x.l));
export const labL=()=>Math.max(0,...S.tw.items.filter(x=>x.t==='lab'&&!x.dmg).map(x=>x.l));
export const campCap=()=>W.campCap(barracksL());
export const housed=()=>W.TROOP_ORDER.reduce((a,t)=>a+(S.army.troops[t]||0)*W.TROOPS[t].house,0);
export const queued=()=>S.army.queue.reduce((a,q)=>a+W.TROOPS[q.t].house,0);
export const unlocked=t=>barracksL()>=W.TROOPS[t].unlock&&S.level>=W.TROOPS[t].st;

/* ---------- training: one queue, troops pop out one at a time ---------- */
export function train(t){ const d=W.TROOPS[t]; if(!d) return 'Unknown troop'; if(barracksL()<1) return 'Build a Crew Barracks first'; if(S.level<d.st) return `Unlocks at Station Lv ${d.st}`; if(!unlocked(t)) return `Barracks level ${d.unlock} needed`;
  if(housed()+queued()+d.house>campCap()) return 'Barracks are full'; if(S.materials<d.cost) return 'Not enough 💧 water';
  S.materials-=d.cost; const last=S.army.queue.length?S.army.queue[S.army.queue.length-1].end:now(); S.army.queue.push({t,end:Math.max(last,now())+d.time*1000,dur:d.time}); return null; }
export function untrain(idx){ const q=S.army.queue[idx]; if(!q) return; S.materials+=W.TROOPS[q.t].cost; const d=q.dur*1000; S.army.queue.splice(idx,1); S.army.queue.forEach((x,i)=>{ if(i>=idx) x.end-=d; }); }
export const trainLeft=()=>S.army.queue.length?Math.max(0,(S.army.queue[S.army.queue.length-1].end-now())/1000):0;
export const trainSpeedCost=()=>Math.max(1,Math.ceil(trainLeft()/60));
export function trainFinish(){ const c=trainSpeedCost(); if(!S.army.queue.length) return 'Nothing training'; if(S.badges<c) return 'Not enough badges'; S.badges-=c; S.army.queue.forEach(q=>q.end=now()); return null; }
/* ---------- research ---------- */
export function research(t){ if(labL()<1) return 'Build a Research Lab first'; if(S.army.lab) return 'The lab is busy'; const lv=S.army.research[t]; if(lv>=W.maxResearch(labL())) return 'Upgrade the lab for more levels';
  if(!unlocked(t)) return 'Unlock it in the barracks first'; const [c,m]=W.researchCost(t,lv); if(S.coins<c) return 'Not enough coins'; if(S.materials<m) return 'Not enough 💧 water';
  S.coins-=c; S.materials-=m; S.army.lab={t,end:now()+W.researchTime(t,lv)*1000}; return null; }
export const labSpeedCost=()=>S.army.lab?Math.max(1,Math.ceil((S.army.lab.end-now())/60000)):0;
export function labFinish(){ const c=labSpeedCost(); if(!S.army.lab) return 'Nothing researching'; if(S.badges<c) return 'Not enough badges'; S.badges-=c; S.army.lab.end=now(); return null; }

/* ---------- heroes: animal crew members ---------- */
export const heroSlots=()=>P.heroSlotsAt(S.level);
export function heroes(){ const slots=heroSlots(); if(!slots) return []; let ids=S.army.heroes; if(!ids){ ids=[...S.crew].sort((a,b)=>(b.lvl||1)-(a.lvl||1)).slice(0,slots).map(c=>c.id); }
  return ids.map(id=>S.crew.find(c=>c.id===id)).filter(Boolean).slice(0,slots); }
export function toggleHero(id){ const cur=heroes().map(c=>c.id); let n=cur.includes(id)?cur.filter(x=>x!==id):[...cur,id]; if(n.length>heroSlots()) n=n.slice(-heroSlots()); S.army.heroes=n; }

export function armyTick(events){ const t=now();
  while(S.army.queue.length&&S.army.queue[0].end<=t){ const q=S.army.queue.shift(); S.army.troops[q.t]=(S.army.troops[q.t]||0)+1; events&&events.push({trained:q.t}); }
  if(S.army.lab&&S.army.lab.end<=t){ const k=S.army.lab.t; S.army.research[k]++; S.army.lab=null; events&&events.push({researched:k,lv:S.army.research[k]}); }
  if(!S.raid&&t>=S.def.next){ S.def.next=t+(30+Math.random()*30)*60e3; if(t>S.def.shield&&S.tw.items.some(x=>W.DEF_TYPES.includes(x.t))){ const r=defendRaid(); if(r) events&&events.push({raided:r.id}); } } }

/* ---------- drill raids (you attack) ---------- */
export async function findRaid(pay=true){ const cost=nextCost(); if(pay){ if(S.coins<cost) return {err:'Not enough coins'}; S.coins-=cost; }
  const [r]=await Backend.getRivals({trophies:S.trophies,n:1}); const bronze=S.trophies<150;
  // v5.2 fair matchmaking: near your station level, trophies and army strength (progress.matchmake)
  const m=P.matchmake({ level:S.level, trophies:S.trophies, army:P.armyStats(S.army.troops,S.army.research,heroes().map(c=>({lvl:c.lvl||1}))), seed:War.hash(r.id+'|'+now()), bronze });
  const base=War.genBase(m.lv,m.seed,r.name,m.tune); if(bronze) base.items=base.items.filter(x=>x.t!=='mortar'&&x.t!=='bomber');
  S.raidOpp={ name:r.name, trophies:m.oppTrophies, league:r.league, level:m.lv, seed:m.seed, tune:m.tune, loot:base.loot, win:m.win, lose:m.lose, ap:m.ap, ds:m.ds, ratio:+m.ratio.toFixed(2), label:m.label }; return { opp:S.raidOpp, base }; }
export const nextCost=()=>0; // v5.2: Next is free
export const oppBase=()=>{ const o=S.raidOpp; if(!o) return null; const b=War.genBase(o.level,o.seed,o.name,o.tune||0); if(S.trophies<150) b.items=b.items.filter(x=>x.t!=='mortar'&&x.t!=='bomber'); return b; };
export function startRaid(){ const o=S.raidOpp; if(!o) return {err:'Find a base first'}; if(housed()<1&&!heroes().length) return {err:'Train some troops first'};
  const army={...S.army.troops}; const hs=heroes().map(c=>({id:c.id,name:c.name,species:c.species,lvl:c.lvl||1}));
  const B=War.createBattle({ layout:oppBase(), army, heroes:hs, research:{...S.army.research}, seed:o.seed^0x5a5a, mode:'attack' }); S.shieldBroken=S.def.shield>now(); S.def.shield=0; S.raid={ opp:o, started:now() }; return { B }; }
export function finishRaid(B){ const o=S.raid?.opp||S.raidOpp; const used={}; for(const [t,n] of Object.entries(S.army.troops)){ const left=B.deployLeft[t]||0; used[t]=n-left; S.army.troops[t]=left; }
  const stars=B.stars; const loot={ coins:Math.min(B.taken.coins,roomFor('coins')), mats:Math.min(B.taken.mats,roomFor('mats')) }; addCoins(loot.coins); S.materials+=loot.mats;
  const dT=stars>0?Math.round(o.win*stars/3)+1:-o.lose; S.trophies=Math.max(0,S.trophies+dT); S.raidStats.raids++; S.raidStats.stars+=stars; if(stars===3) S.raidStats.three++; S.raidStats.best=Math.max(S.raidStats.best,B.pct);
  const res={ stars, pct:B.pct, loot, wasted:{coins:B.taken.coins-loot.coins,mats:B.taken.mats-loot.mats}, dT, used, opp:o, xp:5+stars*5 };
  S.raid=null; S.raidOpp=null; S.lastRaid=res; return res; }

/* ---------- fire waves (they attack you) ---------- */
export function defendRaid(kind){ kind=kind||(Math.random()<.35?'arson':'wave'); const seed=(Math.random()*2**31)|0; const layout=War.fromTown(S,T.blocked);
  const plan=War.raidPlan(S.level,seed,kind); const B=War.simulate(War.createBattle({ layout, seed, mode:'defend', plan }));
  const lost={ coins:Math.min(S.coins,B.taken.coins), mats:Math.min(S.materials,B.taken.mats) }; S.coins-=lost.coins; S.materials-=lost.mats;
  const dT=B.stars>0?-(3+B.stars*3):+4; S.trophies=Math.max(0,S.trophies+dT); const sh=[0,4,8,12][B.stars]*3600e3; if(sh) S.def.shield=Math.max(S.def.shield,now()+sh);
  const entry={ id:'d'+now().toString(36), at:now(), seed, kind, level:S.level, plan, layout:layout.items.map(x=>({...x, cells:x.cells?undefined:undefined})), hqCells:true, loot:layout.loot, stars:B.stars, pct:B.pct, lost, dT, seen:false, name:kind==='arson'?'Firebug gang':'Fire wave' };
  S.def.log.unshift(entry); S.def.log=S.def.log.slice(0,8); S.def.raids++; if(!B.stars) S.def.wins++; return entry; }
// rebuild the exact battle for a replay
export function replayBattle(entry){ const items=entry.layout.map(x=>x.t==='hq'?{...x,cells:War.fromTown(S,T.blocked).items.find(y=>y.t==='hq').cells}:x);
  return War.createBattle({ layout:{ name:S.stationName, level:entry.level, items, loot:entry.loot }, seed:entry.seed, mode:'defend', plan:entry.plan }); }
// offline catch-up: one raid per 2 hours away (max 2), only after 20 minutes away and with no shield
export function offlineRaids(awayMs){ const out=[]; if(awayMs<20*60e3) return out; if(!S.tw.items.some(x=>W.DEF_TYPES.includes(x.t))) return out;
  const n=Math.min(2,1+Math.floor(awayMs/(2*3600e3))); for(let k=0;k<n;k++){ if(now()<S.def.shield) break; out.push(defendRaid()); } return out; }
export const shieldLeft=()=>Math.max(0,S.def.shield-now());
