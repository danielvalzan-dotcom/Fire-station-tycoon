// Firey Station Tycoon v4: game state and rules. No DOM in here, so it can be unit-tested or moved server-side later.
import * as D from './data.js';
import * as T from './town.js';
import * as A from './army.js';
import * as P from './progress.js';
export { A };
import { TB, ZONE_CATS as TD_ZONE } from './towndata.js';
const TDB=t=>TB[t];
export { T };
const KEY='fst_v5_save', V4_KEY='fst_v4_save', V3_KEY='fst_v3_save', V2_KEY='fst_v2_save', OLD_KEY='fireyStationTycoon_v1';
export let S=null;
const now=()=>Date.now();
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
let uid=1; const newId=p=>p+'_'+Date.now().toString(36)+'_'+(uid++)+Math.random().toString(36).slice(2,5);

export function newState(){
  const s={ v:5, created:now(), lastSeen:now(), playerId:newId('p'), stationName:'Snag Flats Station',
    coins:400, badges:30, level:1, xp:0,
    buildings:{ engine:{l:1}, tower:{l:1}, gym:{l:0}, hazmat:{l:0}, rescue:{l:0}, quarters:{l:1}, comms:{l:1} },
    builders:1, crew:[], calls:[], nextCallAt:now()+4000, callSeq:0,
    sizzle:{stored:0,last:now()}, trophies:0, comp:{played:0,wins:0,best:{}}, crates:0,
    quests:{idx:0, claimed:[]}, rush:{active:false,next:now()+5*60e3,until:0,ids:[],done:0},
    stats:{calls:0,success:0,fail:0,earned:0,hazmat:0,gearUps:0},
    prefs:{sfx:true,music:true}, xmas:false, tut:0, tg:{i:0,done:false}, p52:1, stUp:null, firstCallsDone:0, migratedFrom:null,
    materials:10, town:{happy:75, rep:0, damaged:{}}, played:{}, stars:{}, dis:{next:now()+6*60e3, active:null, count:0, seen:{}} };
  S=s; const sp=['roo','wombat','koala','platypus']; ['officer','ff','ff','driver'].forEach((r,i)=>s.crew.push(makeCrew(r,sp[i]))); return s; }

export function load(){
  let raw=null; try{ raw=localStorage.getItem(KEY); }catch(e){}
  if(raw){ try{ const d=JSON.parse(raw); if(d&&d.v===5){ S=d; repair(); return {fresh:false}; } }catch(e){ console.warn('v4 save unreadable, starting fresh', e); } }
  // v4 -> v5: keep everything, add the army and a starter barracks, pump, cannon and wall run
  try{ const v4=JSON.parse(localStorage.getItem(V4_KEY)||'null');
    if(v4&&v4.v===4&&Array.isArray(v4.crew)){ S=v4; S.v=5; S.migratedFrom='v4'; repair(); T.starterV5&&T.starterV5(); save(); return {fresh:true, migrated:{fromV4:true, crew:S.crew.length}}; } }catch(e){ console.warn('v4 save unreadable', e); }
  // v3 -> v4: keep everything, add a starter town around the station
  try{ const v3=JSON.parse(localStorage.getItem(V3_KEY)||'null');
    if(v3&&v3.v===3&&Array.isArray(v3.crew)){ S=v3; S.v=5; S.migratedFrom='v3'; repair(); save(); return {fresh:true, migrated:{fromV3:true, crew:S.crew.length}}; } }catch(e){ console.warn('v3 save unreadable', e); }
  // v2 -> v3: keep everything, give each crew member an animal species
  try{ const v2=JSON.parse(localStorage.getItem(V2_KEY)||'null');
    if(v2&&v2.v===2&&Array.isArray(v2.crew)){ S=v2; S.v=5; S.migratedFrom='v2'; repair(); save(); return {fresh:true, migrated:{fromV2:true, crew:S.crew.length}}; } }catch(e){ console.warn('v2 save unreadable', e); }
  newState(); T.ensureTown(); A.ensureArmy(); T.starterV5&&T.starterV5(); let migrated=null;
  try{ const old=JSON.parse(localStorage.getItem(OLD_KEY)||'null');
    if(old&&typeof old==='object'){ const earned=+old.stats?.earned||+old.coins||0;
      migrated={ coins:Math.min(6000,Math.round(250+Math.sqrt(Math.max(0,earned))*25)), badges:Math.min(150,25+(old.stations||1)*10+(old.stats?.rushWins||0)*5), fromLevel:old.level||1 };
      S.coins+=migrated.coins; S.badges+=migrated.badges; S.migratedFrom='v1'; S.prefs.sfx=old.sfx!==false; S.prefs.music=old.music!==false; } }catch(e){}
  save(); return {fresh:true, migrated}; }
function repair(){ const pre52=S.p52===undefined; const def=defaults();
  for(const k of Object.keys(def)) if(S[k]===undefined) S[k]=def[k];
  for(const id of D.BUILD_ORDER) if(!S.buildings[id]) S.buildings[id]={l:0};
  S.crew.forEach((c,i)=>{ c.gear=Object.assign({helmet:0,coat:0,boots:0,ba:0},c.gear); for(const [k] of D.ROLES[c.role].skills) if(!c.sk[k]) c.sk[k]=1;
    if(!D.SPECIES[c.species]) c.species=D.SPECIES_ORDER[(i*5+3)%D.SPECIES_ORDER.length]; });
  S.town=Object.assign({happy:75,rep:0,damaged:{}},S.town||{}); S.dis=Object.assign({next:now()+6*60e3,active:null,count:0,seen:{}},S.dis||{});
  // an action scene that was open when the app closed resolves on the timer instead
  S.calls.forEach(c=>{ if(c.state==='out'&&c.action){ c.action=false; c.end=now()+5000; } });
  T.ensureTown(); A.ensureArmy(); T.starterV5();
  if(pre52){ // v5.2: keep what an old save built, cap anything above its station level; veterans skip the tutorial
    const c=P.capSave(S,stationXpNeed(S.level)); const vet=S.level>=2||(S.stats.tcollect||0)>0||(S.raidStats?.raids||0)>0; S.tg={i:0,done:vet}; S.p52=1; S.capNote={...c,vet,level:S.level}; }
  // anything that was mid-flight when the app closed is resolved by tick()
}
function defaults(){ const keep=S; const d=newState(); S=keep; delete d.tw; return d; }
export function save(){ if(!S) return; S.lastSeen=now(); try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
export function resetAll(){ try{ localStorage.removeItem(KEY); }catch(e){} newState(); save(); }

/* ---------- station level ---------- */
export const stationXpNeed = L => Math.round(40*Math.pow(1.45,L-1));
// v5.2: XP no longer levels the station by itself. A full XP bar is one prerequisite of the Station upgrade (see progress.js).
export function addStationXP(n){ S.xp=Math.min((S.xp||0)+n, stationXpNeed(S.level)); return []; }
export const happyNow = () => Math.max(0,Math.min(100,(S.town?.happy??75)+(S.tw?T.fx().happy:0)));
export const payMult = () => (1 + 0.05*(S.level-1)) * (0.9 + 0.2*happyNow()/100);

/* ---------- buildings ---------- */
export const bl = id => { const b=S.buildings[id]; return b.dmg?Math.max(0,b.l-1):b.l; };
export const damaged = id => !!S.buildings[id].dmg;
export function bInfo(id){ const b=S.buildings[id], def=D.BUILDINGS[id]; const up=b.up&&b.up.end>now()?b.up:null;
  const locked = b.l===0 && def.unlock && S.level<def.unlock; const dmg=!!b.dmg;
  const maxByStation = Math.min(def.max, S.level+1);
  return { id, def, l:b.l, up, dmg, remaining: up?(up.end-now())/1000:0, total: up?up.total:0, locked, unlockAt:def.unlock||1,
    maxed:b.l>=def.max, capped:b.l>=maxByStation&&b.l<def.max, cost:b.l<def.max?D.buildCost(id,b.l):null, time:b.l<def.max?D.buildTime(id,b.l):null }; }
export const buildersBusy = () => T.busy();
export const totalBuilders = () => T.totalBuilders();
export function startUpgrade(id){ const i=bInfo(id);
  if(i.dmg) return 'Damaged in the disaster. Repair it first'; if(i.up) return 'Already upgrading'; if(i.maxed) return 'Max level'; if(i.locked) return `Unlocks at station level ${i.unlockAt}`;
  if(i.capped) return `Reach station level ${i.l} first`; if(buildersBusy()>=totalBuilders()) return 'All builders are busy';
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
export function makeCrew(role, species){ const taken=new Set(S?S.crew.map(c=>c.name):[]); let name=pick(D.CREW_NAMES.filter(n=>!taken.has(n))) || pick(D.CREW_NAMES)+' '+(Math.random()*9|0);
  const sk={}; for(const [k] of D.ROLES[role].skills) sk[k]=1;
  return { id:newId('c'), name, role, species:species||pick(D.SPECIES_ORDER), lvl:1, xp:0, sp:1, sk, gear:{helmet:0,coat:0,boots:0,ba:0},
    look:{ skin:Math.floor(Math.random()*D.SKIN_TONES.length), hair:Math.floor(Math.random()*D.HAIR.length), stache:Math.random()<.3, hairStyle:Math.floor(Math.random()*3) }, busy:null }; }
export const crewBeds = () => D.crewBeds(bl('quarters'));
export const nextRecruitCost = () => D.recruitCost(S.crew.length);
export function recruit(role, species){ if(S.crew.length>=crewBeds()) return ['Quarters are full. Upgrade Quarters & Kitchen for more beds']; const c=nextRecruitCost();
  if(S.coins<c) return ['Not enough coins']; S.coins-=c; const m=makeCrew(role, species); S.crew.push(m); return [null,m]; }
export const gearBonus = c => D.GEAR_SLOTS.reduce((a,[k])=>a+D.RARITY[c.gear[k]].bonus,0);
export const bestRarity = c => Math.max(...D.GEAR_SLOTS.map(([k])=>c.gear[k]));
export const crewCap = () => D.crewCap(bl('tower'));
export const fx = c => (D.SPECIES[c.species]||D.SPECIES.roo).fx;
export function memberPower(c, skills, kind){ let p=c.lvl*2; for(const k of skills) if(c.sk[k]) p+=c.sk[k]*5; const pw=kind?(fx(c).power?.[kind]||0):0; return p*(1+gearBonus(c)/100)*(1+pw); }
const teamFx = (team,k) => team.reduce((a,m)=>a+(fx(m)[k]||0),0);
export function overallPower(c){ return Math.round(memberPower(c, D.ROLES[c.role].skills.map(s=>s[0]))); }
export function addCrewXP(c,n){ n=Math.round(n*(1+(S.tw?T.fx().xp:0))); const ups=[]; if(c.lvl>=crewCap()) { c.xp=Math.min(c.xp+n, D.xpNeed(c.lvl)-1); return ups; }
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
export const trucksTotal = () => D.appliances(bl('engine')) + (S.tw?T.fx().trucks:0);
export const freeAppliances = () => trucksTotal() - S.calls.filter(c=>c.state==='out').length;
function callAllowed(t){ if(t.tier>maxTier()) return false; if(t.needs) for(const [b,l] of Object.entries(t.needs)) if(bl(b)<l) return false; return true; }
export function spawnCall(forceId, rush=false){ const open=S.calls.filter(c=>c.state==='open'&&!c.rush).length;
  if(!forceId && open>=D.maxCalls(bl('comms'))+T.fx().calls) return null;
  let type=forceId ? D.CALLS.find(c=>c.id===forceId) : null;
  if(!type){ const pool=D.CALLS.filter(callAllowed); const w=pool.map(t=>1/(1+(maxTier()-t.tier)*.4)*(t.tier===maxTier()?1.4:1)); let r=Math.random()*w.reduce((a,b)=>a+b,0);
    type=pool[pool.length-1]; for(let i=0;i<pool.length;i++){ r-=w[i]; if(r<=0){ type=pool[i]; break; } } }
  const c={ id:'call'+(++S.callSeq), type:type.id, born:now(), expires:now()+(rush?240e3:300e3), state:'open', team:[], rush };
  const site=T.siteFor(type.id); if(site) c.at=site.id;
  S.calls.push(c); return c; }
export const callType = c => D.CALLS.find(t=>t.id===c.type);
export function evalTeam(call, ids){
  const t=callType(call), team=ids.map(id=>S.crew.find(c=>c.id===id)).filter(Boolean);
  const counts={}; team.forEach(m=>counts[m.role]=(counts[m.role]||0)+1);
  const missing=[]; for(const [r,n] of Object.entries(t.req)) if((counts[r]||0)<n) missing.push([r,n-(counts[r]||0)]);
  const minPeople=Math.max(t.min||0, Object.values(t.req).reduce((a,b)=>a+b,0));
  const pk=t.id==='grass'?'bush':t.kind; let power=team.reduce((a,m)=>a+memberPower(m,t.skills,pk),0);
  const off=team.filter(m=>m.role==='officer').sort((a,b)=>b.sk.command-a.sk.command)[0];
  if(off) power*=1+0.03*off.sk.command;
  if(t.kind==='hazmat') power*=1+0.05*bl('hazmat'); if(t.kind==='rescue') power*=1+0.05*bl('rescue');
  const bonusN=t.bonus.filter(r=>counts[r]).length;
  const chance=Math.max(.05,Math.min(.97,.2+.75*power/t.diff+bonusN*.06));
  const drv=team.filter(m=>m.role==='driver').reduce((a,m)=>Math.max(a,m.sk.driving+m.sk.nav),0);
  const speed=Math.min(.45, drv*.012 + (off?off.sk.sizeup*.015:0) + bl('gym')*.02 + team.reduce((a,m)=>a+(m.sk.tools||0)*.008+(m.sk.contain||0)*.008,0));
  const time=Math.round(t.time*(1-Math.min(.55,speed+teamFx(team,'speed'))));
  const reward=Math.round(t.reward*payMult()*(call.rush?2:1)*(1+teamFx(team,'pay')));
  return { ok:!missing.length && team.length>=Math.max(1,minPeople) && team.length<=D.seats(bl('engine')), missing, chance, time, reward, power:Math.round(power), minPeople, seats:D.seats(bl('engine')) };
}
export function autoTeam(call){ const t=callType(call); const free=S.crew.filter(c=>!c.busy); const team=[]; const seats=D.seats(bl('engine'));
  for(const [r,n] of Object.entries(t.req)){ const cands=free.filter(c=>c.role===r&&!team.includes(c)).sort((a,b)=>memberPower(b,t.skills)-memberPower(a,t.skills)); team.push(...cands.slice(0,n)); }
  for(const r of t.bonus){ if(team.length>=seats) break; const c=free.filter(c=>c.role===r&&!team.includes(c)).sort((a,b)=>memberPower(b,t.skills)-memberPower(a,t.skills))[0]; if(c) team.push(c); }
  const rest=free.filter(c=>!team.includes(c)).sort((a,b)=>memberPower(b,t.skills)-memberPower(a,t.skills));
  while(team.length<Math.max(t.min||1, Math.min(seats, Object.values(t.req).reduce((a,b)=>a+b,0)+1)) && rest.length) team.push(rest.shift());
  return team.slice(0,seats).map(c=>c.id); }
export function dispatch(callId, ids, auto=true){ const call=S.calls.find(c=>c.id===callId); if(!call||call.state!=='open') return 'That call is gone';
  if(freeAppliances()<1) return 'No free trucks. Upgrade the Engine Bay for more appliances';
  if(ids.some(id=>S.crew.find(c=>c.id===id)?.busy)) return 'Someone in that team is busy';
  const e=evalTeam(call,ids); if(!e.ok) return e.missing.length?'Missing crew: '+e.missing.map(([r,n])=>`${n}× ${D.ROLES[r].short}`).join(', '):'Pick a team';
  call.state='out'; call.team=ids; call.start=now(); call.end=auto?now()+e.time*1000:now()+36e5; call.action=!auto; call.chance=e.chance; call.reward=e.reward; call.power=e.power;
  ids.forEach(id=>{ S.crew.find(c=>c.id===id).busy=call.id; }); S.firstCallsDone++; return null; }
export function callSpeedCost(call){ return call.state==='out'&&!call.action?D.badgeSpeedCost((call.end-now())/1000):0; }
export function speedCall(call){ const c=callSpeedCost(call); if(S.badges<c) return 'Not enough badges'; S.badges-=c; call.end=now(); return null; }
function resolveCalls(){ const out=[]; const t=now();
  for(const call of S.calls){ if(call.state==='out'&&!call.action&&call.end<=t){ out.push(resolveOne(call, Math.random()<call.chance?(Math.random()<.5?2:1):0, true)); }
    else if(call.state==='open'&&call.expires<=t) call.state='expired'; }
  S.calls=S.calls.filter(c=>c.state==='open'||c.state==='out'); return out; }
function resolveOne(call, stars, auto){ const ty=callType(call); const ok=stars>0;
      const coins=Math.round(call.reward*D.starPay(stars)); addCoins(coins);
      const team=call.team.map(id=>S.crew.find(c=>c.id===id)).filter(Boolean);
      const morale=Math.max(0,...team.filter(m=>m.role==='officer').map(m=>m.sk.morale));
      const xp=Math.round(ty.xp*(ok?1:.5)*(1+morale*.05)*(1+teamFx(team,'xp'))*(auto?1:1.25)); const ups=[];
      team.forEach(m=>{ m.busy=null; const u=addCrewXP(m,xp); if(u.length) ups.push([m,u[u.length-1]]); });
      const badges = (ok && (ty.tier>=3 || call.rush) ? (call.rush?2:1) : 0) + (stars===3&&!auto?1:0); S.badges+=badges;
      const mats = stars>=2 ? 1+(ty.tier>=2?1:0) : 0; S.materials+=mats;
      const happy = ok ? 1.5*(1+teamFx(team,'happy')) : -2; S.town.happy=Math.max(0,Math.min(100,S.town.happy+happy));
      if(!auto){ S.played[ty.id]=true; S.stars[ty.id]=Math.max(S.stars[ty.id]||0,stars); }
      const st=addStationXP(Math.round(ty.xp*(ok?1:.4)));
      S.stats.calls++; ok?S.stats.success++:S.stats.fail++; if(ok&&ty.kind==='hazmat') S.stats.hazmat++;
      if(call.rush&&ok) S.rush.done++;
      let lost=null; if(call.at){ const it=T.byId(call.at); if(it&&!ok&&T.damage(it.id)) lost=it.id; }
      call.state='done'; return {call,type:ty,ok,stars,auto,coins,xp,badges,mats,ups,stationUps:st,lost}; }
// the player finished (or bailed on) the hands-on scene
export function finishAction(callId, stars){ const call=S.calls.find(c=>c.id===callId); if(!call||call.state!=='out') return null;
  call.action=false; const r=resolveOne(call, stars, false); S.calls=S.calls.filter(c=>c.state==='open'||c.state==='out'); return r; }
export const canAuto = call => { const t=callType(call); return t.tier<=D.AUTO_TIER && !!S.played[t.id]; };
export const teamOf = ids => ids.map(id=>S.crew.find(c=>c.id===id)).filter(Boolean);
// what the crew brings to a hands-on scene
export function teamHelp(team, kind){ const has=r=>team.filter(m=>m.role===r); const top=(r,k)=>Math.max(0,...has(r).map(m=>m.sk[k]||0));
  const lv=team.reduce((a,m)=>a+m.lvl,0)/Math.max(1,team.length), gear=team.reduce((a,m)=>a+gearBonus(m),0)/Math.max(1,team.length)/100;
  const h={ chips:[], hotspots:has('officer').length>0||teamFx(team,'spot')>0, pressure:1+top('driver','pumping')*.05+teamFx(team,'water')+(has('driver').length?.1:0),
    water:1+top('driver','pumping')*.06, heat:Math.max(.25,1-teamFx(team,'heat')-gear*.4), slow:1-Math.min(.5,top('hazmat','contain')*.05+(has('hazmat').length?.15:0)),
    window:1+top('rescue','extric')*.04+top('medic','cpr')*.05+teamFx(team,'calm')+(has('medic').length?.1:0), tap:1+teamFx(team,'tap')+top('ff','fitness')*.03+lv*.02,
    search:1+teamFx(team,'search')+top('ff','search')*.04+top('hazmat','detect')*.05, climb:1+teamFx(team,'climb')+top('rescue','rope')*.05, stable:1-Math.min(.5,top('medic','care')*.05+(has('medic').length?.15:0)),
    power:1+lv*.03+gear, flood:1+teamFx(team,'flood')+team.reduce((a,m)=>a+(fx(m).power?.flood||0),0) };
  if(h.hotspots) h.chips.push(has('officer').length?'⭐ Officer marks hotspots':'🦜 Lookout spots hotspots');
  if(has('driver').length) h.chips.push(`🚚 Driver: +${Math.round((h.pressure-1)*100)}% pressure`);
  if(has('hazmat').length) h.chips.push(`☣️ Hazmat: spill ${Math.round((1-h.slow)*100)}% slower`);
  if(has('medic').length) h.chips.push('➕ First Aid steadies the patient');
  if(has('rescue').length) h.chips.push('🛠️ Tech Rescue: wider tool windows');
  for(const m of team){ const sp=D.SPECIES[m.species]; if(sp) h.chips.push(`${m.name} the ${sp.name}: ${sp.perk}`); }
  const tf=T.fx(); if(tf.water){ h.water*=1+tf.water; h.chips.push(`🗼 Water tower: +${Math.round(tf.water*100)}% tank`); }
  if(tf.haz){ h.slow*=1-Math.min(.3,tf.haz); } if(tf.stable){ h.stable*=1-Math.min(.3,tf.stable); h.window*=1+Math.min(.3,tf.stable); }
  if(tf.heli&&(kind==='fire'||kind==='bush')){ h.heli=true; h.chips.unshift('🚁 Water bomber on the way'); }
  return h; }

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
export const compPerk = (comp, team) => team.reduce((a,m)=>a+(fx(m).comp?.[comp.game]||0),0);
// rival strength: league sets the base, nudged towards your own crew so early rivals are beatable
export const leagueDiff = () => 0.68 + 0.15*league();
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
  { text:'Earn 2 stars on a hands-on call-out',  reward:10, done:()=>Object.values(S.stars||{}).some(v=>v>=2) },
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
  { text:'Get the town through a disaster',     reward:25, done:()=>S.dis.count>=1 },
  { text:'Reach Silver league',                  reward:25, done:()=>S.trophies>=150 },
  { text:'Get the Engine Bay to level 5',        reward:30, done:()=>bl('engine')>=5 },
];
export const currentQuest = () => QUESTS[S.quests.idx] || null;
export function claimQuest(){ const q=currentQuest(); if(!q||!q.done()) return 0; S.badges+=q.reward; S.quests.idx++; return q.reward; }


/* ---------- disasters (v3) ---------- */
export const dis = () => S.dis.active;
export function startDisaster(type, warnSec=25){ if(S.dis.active) return null;
  const order=D.DISASTER_ORDER; type=type||order.find(t=>!S.dis.seen[t])||pick(order); const def=D.DISASTERS[type];
  S.dis.active={ type, phase:'warn', warnEnd:now()+warnSec*1000, start:now(), shifts:{},
    zones:def.zones.map(z=>({id:z.id, state:'open', stars:0})), town:[], base:[], rewards:{coins:0,mats:0,rep:0} };
  S.dis.seen[type]=true; return S.dis.active; }
function disasterHit(){ const a=S.dis.active, def=D.DISASTERS[a.type]; a.phase='active';
  for(const z of def.zones){ if(z.town&&!a.town.includes(z.town)) a.town.push(z.town); if(z.base) for(const id of z.base) if(S.buildings[id].l>=1&&!a.base.includes(id)) a.base.push(id); }
  // v4: zones hit the buildings the player actually placed; abstract town damage only if they have none of that kind
  const red=T.fx().dmg, n=Math.max(1,Math.round((2+Math.min(2,S.dis.count*.5))*(1-red))); a.items={}; const hitIds=[];
  for(const z of def.zones){ if(!z.town) continue; const ids=T.pickTargets(TD_ZONE[z.town]||['home'],n,hitIds); if(ids.length){ a.items[z.id]=ids; hitIds.push(...ids); ids.forEach(id=>T.damage(id)); a.town=a.town.filter(k=>k!==z.town||def.zones.some(o=>o!==z&&o.town===k&&!a.items[o.id])); } }
  a.town.forEach(k=>S.town.damaged[k]=true); a.base.forEach(id=>{ S.buildings[id].dmg=true; delete S.buildings[id].up; });
  S.town.happy=Math.max(0,S.town.happy-10); }
export const zoneDef = id => D.DISASTERS[S.dis.active.type].zones.find(z=>z.id===id);
export const zoneState = id => S.dis.active.zones.find(z=>z.id===id);
export const shiftsLeft = c => 2-(S.dis.active?.shifts[c.id]||0);
export function zoneTeamOk(zoneId, ids){ const z=zoneDef(zoneId), team=teamOf(ids);
  if(!team.length) return 'Pick a crew'; if(team.length>4) return 'Max 4 crew per zone';
  if(!team.some(m=>m.role===z.lead)) return `This zone needs a ${D.ROLES[z.lead].short} to lead`;
  if(team.some(m=>shiftsLeft(m)<1)) return 'Someone in that team is exhausted (2 zones max per disaster)'; return null; }
export function autoZoneTeam(zoneId){ const z=zoneDef(zoneId); const free=S.crew.filter(m=>!m.busy&&shiftsLeft(m)>0);
  const kindSkills={fire:['firefight','pumping'],bush:['firefight','fitness'],flood:['fitness','driving','rope'],rescue:['tools','rope','extric'],collapse:['extric','tools','search'],hazmat:['contain','detect','decon'],medical:['care','cpr']}[z.kind]||[];
  const sc=m=>memberPower(m,kindSkills,z.kind); const lead=free.filter(m=>m.role===z.lead).sort((a,b)=>sc(b)-sc(a))[0]; const team=lead?[lead]:[];
  free.filter(m=>m!==lead).sort((a,b)=>sc(b)-sc(a)).slice(0,2).forEach(m=>team.push(m)); return team.map(m=>m.id); }
export function beginZone(zoneId, ids){ const e=zoneTeamOk(zoneId,ids); if(e) return e; ids.forEach(id=>S.dis.active.shifts[id]=(S.dis.active.shifts[id]||0)+1); return null; }
export function finishZone(zoneId, stars, ids){ const a=S.dis.active, z=zoneDef(zoneId), st=zoneState(zoneId); st.state=stars>0?'done':'failed'; st.stars=stars;
  const team=teamOf(ids||[]); const coins=Math.round((120+60*stars)*payMult()), mats=3+stars*3, rep=stars*5+(stars>0?2:0);
  addCoins(coins); S.materials+=mats; S.town.rep+=rep; a.rewards.coins+=coins; a.rewards.mats+=mats; a.rewards.rep+=rep;
  team.forEach(m=>addCrewXP(m,10+stars*6)); addStationXP(6+stars*4);
  // a great job saves the structure outright
  let saved=null; if(stars===3&&a.items&&a.items[z.id]){ a.items[z.id].forEach(id=>{ const it=T.byId(id); if(it&&it.dmg){ it.dmg=false; saved=(saved?saved+', ':'')+TDB(it.t).name; } }); }
  if(stars===3){ if(z.town&&S.town.damaged[z.town]&&!D.DISASTERS[a.type].zones.some(o=>o.id!==z.id&&o.town===z.town&&zoneState(o.id).state==='open')){ delete S.town.damaged[z.town]; a.town=a.town.filter(k=>k!==z.town); saved=D.TOWN[z.town].name; }
    if(z.base){ const id=z.base.find(b=>S.buildings[b].dmg); if(id){ delete S.buildings[id].dmg; a.base=a.base.filter(b=>b!==id); saved=D.BUILDINGS[id].name; } } }
  S.town.happy=Math.max(0,Math.min(100,S.town.happy+(stars-1)*3*(1+teamFx(team,'happy'))));
  if(a.zones.every(q=>q.state!=='open')) toRebuild();
  return {coins,mats,rep,saved}; }
export function standDown(){ const a=S.dis.active; a.zones.forEach(z=>{ if(z.state==='open'){ z.state='failed'; S.town.happy=Math.max(0,S.town.happy-6); } }); toRebuild(); }
function toRebuild(){ const a=S.dis.active; a.phase='rebuild'; a.rebuildStart=now(); }
export function rebuildList(){ const out=[]; for(const k of Object.keys(S.town.damaged)) out.push({kind:'town',id:k,name:D.TOWN[k].name,icon:D.TOWN[k].icon,cost:D.TOWN[k].cost});
  for(const id of D.BUILD_ORDER) if(S.buildings[id].dmg) out.push({kind:'base',id,name:D.BUILDINGS[id].name,icon:D.BUILDINGS[id].icon,cost:D.baseRepairCost(id,S.buildings[id].l)});
  for(const it of T.damagedList()) out.push({kind:'tw',id:it.id,name:TDB(it.t).name+' Lv'+it.l,icon:TDB(it.t).icon,cost:T.repairCost(it)}); return out; }
export function repairItem(kind,id){ const it=rebuildList().find(x=>x.kind===kind&&x.id===id); if(!it) return ['Nothing to fix'];
  if(S.coins<it.cost[0]) return ['Not enough coins']; if(S.materials<it.cost[1]) return ['Not enough materials. Earn them on disaster zones and 2-star call-outs'];
  if(kind==='tw'){ const e=T.repairT(id); if(e) return [e]; } else { S.coins-=it.cost[0]; S.materials-=it.cost[1]; } if(kind==='town') delete S.town.damaged[id]; else if(kind==='base') delete S.buildings[id].dmg;
  S.town.happy=Math.min(100,S.town.happy+(kind==='town'?8:3)); S.town.rep+=5; let done=null;
  if(S.dis.active&&S.dis.active.phase==='rebuild'&&!rebuildList().length) done=endDisaster(); return [null,done]; }
export function finishDisaster(){ const a=S.dis.active; if(!a||a.phase!=='rebuild'||rebuildList().length) return null; return endDisaster(); }
function endDisaster(){ const a=S.dis.active; const good=a.zones.filter(z=>z.stars>0).length, stars=a.zones.reduce((x,z)=>x+z.stars,0);
  const badges=8+stars*2; S.badges+=badges; S.town.rep+=10; S.dis.count++; S.dis.active=null; S.dis.next=now()+D.disasterGap();
  S.nextCallAt=now()+8000; return {badges, stars, good, total:a.zones.length, rewards:a.rewards, type:a.type}; }
function disasterTick(events){ const t=now(), a=S.dis.active;
  if(!a){ if(S.level>=D.DISASTER_UNLOCK && S.stats.calls>=3 && t>=S.dis.next){ const d=startDisaster(); if(d) events.push({disWarn:d}); } return; }
  if(a.phase==='warn'&&t>=a.warnEnd){ disasterHit(); events.push({disHit:a}); }
  if(a.phase!=='rebuild') S.nextCallAt=Math.max(S.nextCallAt,t+20000);   // the pager goes quiet during a disaster
}
/* ---------- main tick: call every frame or so; returns events for the UI ---------- */
export function tick(){ const events=[]; sizzleTick(); T.townTick(events); A.armyTick(events); P.stationTick(S,events);
  const built=finishBuildings(); built.forEach(id=>events.push({built:id}));
  resolveCalls().forEach(r=>events.push({result:r}));
  if(now()>=S.nextCallAt){ const first=S.firstCallsDone===0&&!S.calls.some(c=>c.type==='bin');
    const c=spawnCall(first?'bin':null); S.nextCallAt=now()+D.callEvery(bl('comms'))*1000*rnd(.8,1.2); if(c) events.push({newCall:c}); }
  if(!S.dis.active) rushTick(events); disasterTick(events); return events; }
