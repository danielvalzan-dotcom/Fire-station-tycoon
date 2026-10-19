// Firey Station Tycoon v2: game state and rules. No DOM in here, so it can be unit-tested or moved server-side later.
import * as D from './data.js';
const KEY='fst_v2_save', OLD_KEY='fireyStationTycoon_v1';
export let S=null;
const now=()=>Date.now();
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
let uid=1; const newId=p=>p+'_'+Date.now().toString(36)+'_'+(uid++)+Math.random().toString(36).slice(2,5);

export function newState(){
  const s={ v:2, created:now(), lastSeen:now(), playerId:newId('p'), stationName:'Snag Flats Station',
    coins:400, badges:30, level:1, xp:0,
    buildings:{ engine:{l:1}, tower:{l:1}, gym:{l:0}, hazmat:{l:0}, rescue:{l:0}, quarters:{l:1}, comms:{l:1} },
    builders:1, crew:[], calls:[], nextCallAt:now()+4000, callSeq:0,
    sizzle:{stored:0,last:now()}, trophies:0, comp:{played:0,wins:0,best:{}}, crates:0,
    quests:{idx:0, claimed:[]}, rush:{active:false,next:now()+5*60e3,until:0,ids:[],done:0},
    stats:{calls:0,success:0,fail:0,earned:0,hazmat:0,gearUps:0},
    prefs:{sfx:true,music:true}, xmas:false, tut:0, firstCallsDone:0, migratedFrom:null };
  S=s; for(const r of ['officer','ff','ff','driver']) s.crew.push(makeCrew(r)); return s; }

export function load(){
  let raw=null; try{ raw=localStorage.getItem(KEY); }catch(e){}
  if(raw){ try{ const d=JSON.parse(raw); if(d&&d.v===2){ S=d; repair(); return {fresh:false}; } }catch(e){ console.warn('v2 save unreadable, starting fresh', e); } }
  newState(); let migrated=null;
  try{ const old=JSON.parse(localStorage.getItem(OLD_KEY)||'null');
    if(old&&typeof old==='object'){ const earned=+old.stats?.earned||+old.coins||0;
      migrated={ coins:Math.min(6000,Math.round(250+Math.sqrt(Math.max(0,earned))*25)), badges:Math.min(150,25+(old.stations||1)*10+(old.stats?.rushWins||0)*5), fromLevel:old.level||1 };
      S.coins+=migrated.coins; S.badges+=migrated.badges; S.migratedFrom='v1'; S.prefs.sfx=old.sfx!==false; S.prefs.music=old.music!==false; } }catch(e){}
  save(); return {fresh:true, migrated}; }
function repair(){ const def=defaults();
  for(const k of Object.keys(def)) if(S[k]===undefined) S[k]=def[k];
  for(const id of D.BUILD_ORDER) if(!S.buildings[id]) S.buildings[id]={l:0};
  S.crew.forEach(c=>{ c.gear=Object.assign({helmet:0,coat:0,boots:0,ba:0},c.gear); for(const [k] of D.ROLES[c.role].skills) if(!c.sk[k]) c.sk[k]=1; });
  // anything that was mid-flight when the app closed is resolved by tick()
}
function defaults(){ const keep=S; const d=newState(); S=keep; return d; }
export function save(){ if(!S) return; S.lastSeen=now(); try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
export function resetAll(){ try{ localStorage.removeItem(KEY); }catch(e){} newState(); save(); }

/* ---------- station level ---------- */
export const stationXpNeed = L => Math.round(40*Math.pow(1.45,L-1));
export function addStationXP(n){ S.xp+=n; const ups=[]; while(S.xp>=stationXpNeed(S.level)){ S.xp-=stationXpNeed(S.level); S.level++; S.badges+=5; ups.push(S.level); } return ups; }
export const payMult = () => 1 + 0.05*(S.level-1);

/* ---------- buildings ---------- */
export const bl = id => S.buildings[id].l;
export function bInfo(id){ const b=S.buildings[id], def=D.BUILDINGS[id]; const up=b.up&&b.up.end>now()?b.up:null;
  const locked = b.l===0 && def.unlock && S.level<def.unlock;
  const maxByStation = Math.min(def.max, S.level+1);
  return { id, def, l:b.l, up, remaining: up?(up.end-now())/1000:0, total: up?up.total:0, locked, unlockAt:def.unlock||1,
    maxed:b.l>=def.max, capped:b.l>=maxByStation&&b.l<def.max, cost:b.l<def.max?D.buildCost(id,b.l):null, time:b.l<def.max?D.buildTime(id,b.l):null }; }
export const buildersBusy = () => D.BUILD_ORDER.filter(id=>S.buildings[id].up).length;
export function startUpgrade(id){ const i=bInfo(id);
  if(i.up) return 'Already upgrading'; if(i.maxed) return 'Max level'; if(i.locked) return `Unlocks at station level ${i.unlockAt}`;
  if(i.capped) return `Reach station level ${i.l} first`; if(buildersBusy()>=S.builders) return 'Your builder is busy';
  if(S.coins<i.cost) return 'Not enough coins';
  S.coins-=i.cost; S.buildings[id].up={start:now(),end:now()+i.time*1000,total:i.time}; return null; }
export const speedCost = id => { const i=bInfo(id); return i.up?D.badgeSpeedCost(i.remaining):0; };
export function speedUp(id){ const c=speedCost(id); if(!c) return 'Nothing to speed up'; if(S.badges<c) return 'Not enough badges'; S.badges-=c; S.buildings[id].up.end=now(); return null; }
export function cutTime(id,sec){ const u=S.buildings[id].up; if(u) u.end-=sec*1000; }
function finishBuildings(){ const done=[]; for(const id of D.BUILD_ORDER){ const b=S.buildings[id]; if(b.up&&b.up.end<=now()){ b.l++; delete b.up; done.push(id); addStationXP(5+b.l*4); } } return done; }

/* ---------- quarters sizzle (idle coins) ---------- */
export function sizzleTick(){ const l=bl('quarters'); const t=now(); const dt=(t-S.sizzle.last)/1000; S.sizzle.last=t; if(l<1) return;
  S.sizzle.stored=Math.min(D.sizzleCap(l), S.sizzle.stored + D.sizzleRate(l)/3600*dt); }
export function collectSizzle(){ const n=Math.floor(S.sizzle.stored); if(n<1) return 0; S.sizzle.stored-=n; addCoins(n); return n; }
export function addCoins(n){ S.coins+=n; S.stats.earned+=n; }

/* ---------- crew ---------- */
export function makeCrew(role){ const taken=new Set(S?S.crew.map(c=>c.name):[]); let name=pick(D.CREW_NAMES.filter(n=>!taken.has(n))) || pick(D.CREW_NAMES)+' '+(Math.random()*9|0);
  const sk={}; for(const [k] of D.ROLES[role].skills) sk[k]=1;
  return { id:newId('c'), name, role, lvl:1, xp:0, sp:1, sk, gear:{helmet:0,coat:0,boots:0,ba:0},
    look:{ skin:Math.floor(Math.random()*D.SKIN_TONES.length), hair:Math.floor(Math.random()*D.HAIR.length), stache:Math.random()<.3, hairStyle:Math.floor(Math.random()*3) }, busy:null }; }
export const crewBeds = () => D.crewBeds(bl('quarters'));
export const nextRecruitCost = () => D.recruitCost(S.crew.length);
export function recruit(role){ if(S.crew.length>=crewBeds()) return ['Quarters are full. Upgrade Quarters & Kitchen for more beds']; const c=nextRecruitCost();
  if(S.coins<c) return ['Not enough coins']; S.coins-=c; const m=makeCrew(role); S.crew.push(m); return [null,m]; }
export const gearBonus = c => D.GEAR_SLOTS.reduce((a,[k])=>a+D.RARITY[c.gear[k]].bonus,0);
export const bestRarity = c => Math.max(...D.GEAR_SLOTS.map(([k])=>c.gear[k]));
export const crewCap = () => D.crewCap(bl('tower'));
export function memberPower(c, skills){ let p=c.lvl*2; for(const k of skills) if(c.sk[k]) p+=c.sk[k]*5; return p*(1+gearBonus(c)/100); }
export function overallPower(c){ return Math.round(memberPower(c, D.ROLES[c.role].skills.map(s=>s[0]))); }
export function addCrewXP(c,n){ const ups=[]; if(c.lvl>=crewCap()) { c.xp=Math.min(c.xp+n, D.xpNeed(c.lvl)-1); return ups; }
  c.xp+=n; while(c.xp>=D.xpNeed(c.lvl) && c.lvl<crewCap()){ c.xp-=D.xpNeed(c.lvl); c.lvl++; c.sp++; ups.push(c.lvl); } return ups; }
export const trainCostFor = c => D.trainCost(c.lvl, bl('tower'));
export function train(c){ if(c.busy) return ['They are out on a job']; if(c.lvl>=crewCap()) return [`Level cap ${crewCap()}. Upgrade the Training Tower`];
  const cost=trainCostFor(c); if(S.coins<cost) return ['Not enough coins']; S.coins-=cost; return [null, addCrewXP(c, Math.ceil(D.xpNeed(c.lvl)*0.55))]; }
export const skillCost = (c,k) => 20*c.sk[k];
export function upSkill(c,k){ if(c.sk[k]>=D.SKILL_MAX) return 'Skill maxed'; if(c.sp<1) return 'No skill points. Level up first';
  const cost=skillCost(c,k); if(S.coins<cost) return 'Not enough coins'; S.coins-=cost; c.sp--; c.sk[k]++; return null; }
export function upGear(c,slot){ const t=c.gear[slot]; const cost=D.gearCost(t); if(!cost) return 'Already Legendary';
  if(S.coins<cost[0]) return 'Not enough coins'; if(S.badges<cost[1]) return 'Not enough badges';
  S.coins-=cost[0]; S.badges-=cost[1]; c.gear[slot]++; S.stats.gearUps++; return null; }
export function openCrate(){ const opts=[]; for(const c of S.crew) for(const [k] of D.GEAR_SLOTS) if(c.gear[k]<4) opts.push([c,k]);
  if(!opts.length){ S.badges+=20; return {badges:20}; } const [c,k]=pick(opts); const from=c.gear[k];
  const jump = Math.random()<.18 && from<3 ? 2 : 1; c.gear[k]=Math.min(4,from+jump); return {crew:c, slot:k, from, to:c.gear[k]}; }

/* ---------- calls ---------- */
export const maxTier = () => Math.min(4, 1+Math.floor(bl('comms')/2));
export const freeAppliances = () => D.appliances(bl('engine')) - S.calls.filter(c=>c.state==='out').length;
function callAllowed(t){ if(t.tier>maxTier()) return false; if(t.needs) for(const [b,l] of Object.entries(t.needs)) if(bl(b)<l) return false; return true; }
export function spawnCall(forceId, rush=false){ const open=S.calls.filter(c=>c.state==='open'&&!c.rush).length;
  if(!forceId && open>=D.maxCalls(bl('comms'))) return null;
  let type=forceId ? D.CALLS.find(c=>c.id===forceId) : null;
  if(!type){ const pool=D.CALLS.filter(callAllowed); const w=pool.map(t=>1/(1+(maxTier()-t.tier)*.4)*(t.tier===maxTier()?1.4:1)); let r=Math.random()*w.reduce((a,b)=>a+b,0);
    type=pool[pool.length-1]; for(let i=0;i<pool.length;i++){ r-=w[i]; if(r<=0){ type=pool[i]; break; } } }
  const c={ id:'call'+(++S.callSeq), type:type.id, born:now(), expires:now()+(rush?240e3:300e3), state:'open', team:[], rush };
  S.calls.push(c); return c; }
export const callType = c => D.CALLS.find(t=>t.id===c.type);
export function evalTeam(call, ids){
  const t=callType(call), team=ids.map(id=>S.crew.find(c=>c.id===id)).filter(Boolean);
  const counts={}; team.forEach(m=>counts[m.role]=(counts[m.role]||0)+1);
  const missing=[]; for(const [r,n] of Object.entries(t.req)) if((counts[r]||0)<n) missing.push([r,n-(counts[r]||0)]);
  const minPeople=Math.max(t.min||0, Object.values(t.req).reduce((a,b)=>a+b,0));
  let power=team.reduce((a,m)=>a+memberPower(m,t.skills),0);
  const off=team.filter(m=>m.role==='officer').sort((a,b)=>b.sk.command-a.sk.command)[0];
  if(off) power*=1+0.03*off.sk.command;
  if(t.kind==='hazmat') power*=1+0.05*bl('hazmat'); if(t.kind==='rescue') power*=1+0.05*bl('rescue');
  const bonusN=t.bonus.filter(r=>counts[r]).length;
  const chance=Math.max(.05,Math.min(.97,.2+.75*power/t.diff+bonusN*.06));
  const drv=team.filter(m=>m.role==='driver').reduce((a,m)=>Math.max(a,m.sk.driving+m.sk.nav),0);
  const speed=Math.min(.45, drv*.012 + (off?off.sk.sizeup*.015:0) + bl('gym')*.02 + team.reduce((a,m)=>a+(m.sk.tools||0)*.008+(m.sk.contain||0)*.008,0));
  const time=Math.round(t.time*(1-speed));
  const reward=Math.round(t.reward*payMult()*(call.rush?2:1));
  return { ok:!missing.length && team.length>=Math.max(1,minPeople) && team.length<=D.seats(bl('engine')), missing, chance, time, reward, power:Math.round(power), minPeople, seats:D.seats(bl('engine')) };
}
export function autoTeam(call){ const t=callType(call); const free=S.crew.filter(c=>!c.busy); const team=[]; const seats=D.seats(bl('engine'));
  for(const [r,n] of Object.entries(t.req)){ const cands=free.filter(c=>c.role===r&&!team.includes(c)).sort((a,b)=>memberPower(b,t.skills)-memberPower(a,t.skills)); team.push(...cands.slice(0,n)); }
  for(const r of t.bonus){ if(team.length>=seats) break; const c=free.filter(c=>c.role===r&&!team.includes(c)).sort((a,b)=>memberPower(b,t.skills)-memberPower(a,t.skills))[0]; if(c) team.push(c); }
  const rest=free.filter(c=>!team.includes(c)).sort((a,b)=>memberPower(b,t.skills)-memberPower(a,t.skills));
  while(team.length<Math.max(t.min||1, Math.min(seats, Object.values(t.req).reduce((a,b)=>a+b,0)+1)) && rest.length) team.push(rest.shift());
  return team.slice(0,seats).map(c=>c.id); }
export function dispatch(callId, ids){ const call=S.calls.find(c=>c.id===callId); if(!call||call.state!=='open') return 'That call is gone';
  if(freeAppliances()<1) return 'No free trucks. Upgrade the Engine Bay for more appliances';
  if(ids.some(id=>S.crew.find(c=>c.id===id)?.busy)) return 'Someone in that team is busy';
  const e=evalTeam(call,ids); if(!e.ok) return e.missing.length?'Missing crew: '+e.missing.map(([r,n])=>`${n}× ${D.ROLES[r].short}`).join(', '):'Pick a team';
  call.state='out'; call.team=ids; call.start=now(); call.end=now()+e.time*1000; call.chance=e.chance; call.reward=e.reward;
  ids.forEach(id=>{ S.crew.find(c=>c.id===id).busy=call.id; }); S.firstCallsDone++; return null; }
export function callSpeedCost(call){ return call.state==='out'?D.badgeSpeedCost((call.end-now())/1000):0; }
export function speedCall(call){ const c=callSpeedCost(call); if(S.badges<c) return 'Not enough badges'; S.badges-=c; call.end=now(); return null; }
function resolveCalls(){ const out=[]; const t=now();
  for(const call of S.calls){ if(call.state==='out'&&call.end<=t){ const ty=callType(call); const ok=Math.random()<call.chance;
      const coins=ok?call.reward:Math.round(call.reward*.3); addCoins(coins);
      const team=call.team.map(id=>S.crew.find(c=>c.id===id)).filter(Boolean);
      const morale=Math.max(0,...team.filter(m=>m.role==='officer').map(m=>m.sk.morale));
      const xp=Math.round(ty.xp*(ok?1:.5)*(1+morale*.05)); const ups=[];
      team.forEach(m=>{ m.busy=null; const u=addCrewXP(m,xp); if(u.length) ups.push([m,u[u.length-1]]); });
      const badges = ok && (ty.tier>=3 || call.rush) ? (call.rush?2:1) : 0; S.badges+=badges;
      const st=addStationXP(Math.round(ty.xp*(ok?1:.4)));
      S.stats.calls++; ok?S.stats.success++:S.stats.fail++; if(ok&&ty.kind==='hazmat') S.stats.hazmat++;
      if(call.rush&&ok) S.rush.done++;
      call.state='done'; out.push({call,type:ty,ok,coins,xp,badges,ups,stationUps:st}); }
    else if(call.state==='open'&&call.expires<=t) call.state='expired'; }
  S.calls=S.calls.filter(c=>c.state==='open'||c.state==='out'); return out; }

/* ---------- rush hour ---------- */
function rushTick(events){ const r=S.rush, t=now();
  if(!r.active){ if(S.quests.idx>=2 && t>=r.next && freeAppliances()>0){ r.active=true; r.until=t+240e3; r.done=0; r.ids=[];
      for(let i=0;i<3;i++){ const c=spawnCall(null,true); if(c) r.ids.push(c.id); } events.push({rushStart:true}); } return; }
  if(r.done>=3){ r.active=false; r.next=t+rnd(5,8)*60e3; S.badges+=10; events.push({rushWin:true}); }
  else if(t>=r.until){ r.active=false; r.next=t+rnd(5,8)*60e3; events.push({rushLose:true,done:r.done}); S.calls=S.calls.filter(c=>!(c.rush&&c.state==='open')); } }

/* ---------- competitions ---------- */
export const league = () => D.leagueOf(S.trophies);
export function compTeam(comp){ return S.crew.filter(c=>!c.busy).sort((a,b)=>memberPower(b,comp.skills)-memberPower(a,comp.skills)).slice(0,3); }
export function crewNorm(comp, team){ const p=team.reduce((a,m)=>a+memberPower(m,comp.skills),0)*(1+bl('gym')*.04); return p/(p+90); }
export function applyComp(comp, place, team){ const L=D.LEAGUES[league()]; const dT=[30,12,-6,-12][place]; const before=league();
  S.trophies=Math.max(0,S.trophies+dT); S.comp.played++; if(place===0) S.comp.wins++; if(place<=1) S.comp.top2=true;
  const coins=Math.round(L.reward[0]*[1,.5,.25,.15][place]); const badges=place===0?L.reward[1]:place===1?1:0; addCoins(coins); S.badges+=badges;
  const ups=[]; team.forEach(m=>{ const u=addCrewXP(m,[14,10,7,5][place]); if(u.length) ups.push([m,u[u.length-1]]); });
  let crate=null; if(place===0) crate=openCrate();
  const st=addStationXP([12,8,4,3][place]);
  return { dT, coins, badges, crate, ups, promoted: league()>before, demoted: league()<before, stationUps:st }; }

/* ---------- quests (earn premium badges) ---------- */
export const QUESTS = [
  { text:'Send a crew to a call-out',            reward:10, done:()=>S.firstCallsDone>=1 },
  { text:'Upgrade the Engine Bay to level 2',    reward:10, done:()=>bl('engine')>=2 },
  { text:'Recruit a First Aid crew member',      reward:10, done:()=>S.crew.some(c=>c.role==='medic') },
  { text:'Place top 2 in a competition',         reward:15, done:()=>S.comp.played>0&&(S.comp.wins>0||S.comp.top2) },
  { text:'Build the Station Gym',                reward:10, done:()=>bl('gym')>=1 },
  { text:'Upgrade a piece of crew gear',         reward:10, done:()=>S.stats.gearUps>=1 },
  { text:'Build the Rescue Workshop',            reward:15, done:()=>bl('rescue')>=1 },
  { text:'Recruit a Tech Rescue Specialist',     reward:15, done:()=>S.crew.some(c=>c.role==='rescue') },
  { text:'Reach station level 4',                reward:20, done:()=>S.level>=4 },
  { text:'Build the Hazmat Store',               reward:20, done:()=>bl('hazmat')>=1 },
  { text:'Succeed at a hazmat call-out',         reward:20, done:()=>S.stats.hazmat>=1 },
  { text:'Reach Silver league',                  reward:25, done:()=>S.trophies>=150 },
  { text:'Get the Engine Bay to level 5',        reward:30, done:()=>bl('engine')>=5 },
];
export const currentQuest = () => QUESTS[S.quests.idx] || null;
export function claimQuest(){ const q=currentQuest(); if(!q||!q.done()) return 0; S.badges+=q.reward; S.quests.idx++; return q.reward; }

/* ---------- main tick: call every frame or so; returns events for the UI ---------- */
export function tick(){ const events=[]; sizzleTick();
  const built=finishBuildings(); built.forEach(id=>events.push({built:id}));
  resolveCalls().forEach(r=>events.push({result:r}));
  if(now()>=S.nextCallAt){ const first=S.firstCallsDone===0&&!S.calls.some(c=>c.type==='bin');
    const c=spawnCall(first?'bin':null); S.nextCallAt=now()+D.callEvery(bl('comms'))*1000*rnd(.8,1.2); if(c) events.push({newCall:c}); }
  rushTick(events); return events; }
