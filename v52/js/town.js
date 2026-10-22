// Firey Station Tycoon v4: town rules (placement, upgrades, production, land, damage). No DOM.
import * as TD from './towndata.js';
import * as A from './army.js';
import { S, addCoins, addStationXP } from './state.js';
const now=()=>Date.now(); const SQ=Math.SQRT1_2;
const {TB,CELL,GRID,CHUNK}=TD; const HALF=GRID*CELL/2;
let seq=1; const nid=()=>'tw'+Date.now().toString(36)+(seq++);

/* ---------- geometry ---------- */
export const cellCenter=(i,j)=>({x:-HALF+(i+.5)*CELL, z:-HALF+(j+.5)*CELL});
export const itemCenter=it=>{ const [w,h]=dims(it); return {x:-HALF+(it.i+w/2)*CELL, z:-HALF+(it.j+h/2)*CELL}; };
export const worldToCell=(x,z)=>({i:Math.floor((x+HALF)/CELL), j:Math.floor((z+HALF)/CELL)});
export const dims=it=>{ const d=TB[it.t]; return (it.r||0)%2 ? [d.h,d.w] : [d.w,d.h]; };
const toUV=(x,z)=>({u:(x-z)*SQ, v:(x+z)*SQ});
const blockCache=new Map();
export function blocked(i,j){ const k=i+','+j; if(blockCache.has(k)) return blockCache.get(k); let b=false;
  for(const [dx,dz] of [[0,0],[1,0],[0,1],[1,1],[.5,.5]]){ const x=-HALF+(i+dx)*CELL, z=-HALF+(j+dz)*CELL; const {u,v}=toUV(x,z);
    if(Math.abs(u)<7.2&&v>-14.9&&v<14.6) b='station'; else if(Math.abs(u)<2.3&&v>=14.2) b=b||'road'; }
  blockCache.set(k,b); return b; }
export const chunkOf=(i,j)=>Math.floor(i/CHUNK)+','+Math.floor(j/CHUNK);
export const owned=(i,j)=>i>=0&&j>=0&&i<GRID&&j<GRID&&S.tw.plots.includes(chunkOf(i,j));

/* ---------- state ---------- */
export function newTown(){ const tw={ v:1, plots:TD.START_PLOTS.slice(), items:[], bought:0, seq:0 }; return tw; }
export function ensureTown(){ if(!S.tw){ S.tw=newTown(); starter(); } S.tw.items.forEach(it=>{ if(!TB[it.t]) it.dead=true; }); S.tw.items=S.tw.items.filter(it=>!it.dead); }
function starter(){ // a little starter street off the main road, so the town is never empty
  const road=(i,j)=>{ if(canPlace({t:'road',r:0},i,j)===null){ S.tw.items.push({id:nid(),t:'road',i,j,r:0,l:1,last:now(),store:0}); return true; } return false; };
  const used=new Set();
  for(const [i,j] of roadSpine()){ const side=Math.sign(cellCenter(i,j).x-cellCenter(i,j).z)||1; const key=side; if(used.has(key)) continue;
    // pick the orthogonal direction pointing away from the main road
    for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){ if(blocked(i-a,j-b)!=='road') continue; let n=0; for(let k=0;k<5;k++) if(road(i+a*k,j+b*k)) n++; else break; if(n>=3){ used.add(key); break; } }
    if(used.size>=2) break; }
  const want=[['hut',1],['house',1],['house',1],['bakery',1],['timber',1],['gum',1],['gum',1],['gum',1],['lamp',1],['park',1]];
  const spots=freeSpots(); for(const [t,l] of want){ const s=spots.find(([i,j])=>canPlace({t,r:0},i,j)===null); if(!s) continue; S.tw.items.push({id:nid(),t,i:s[0],j:s[1],r:0,l,last:now(),store:t==='house'||t==='bakery'||t==='timber'?rateAt0(t)*.6:0}); } }
const rateAt0=t=>TD.rateAt(t,1)*(TB[t].res==='mats'?1:1);
function freeSpots(){ const out=[]; for(let j=0;j<GRID;j++) for(let i=0;i<GRID;i++) if(owned(i,j)&&!blocked(i,j)) out.push([i,j]);
  // closest to the engine bay first
  const eb={x:9.5,z:9.5}; out.sort((a,b)=>{ const pa=cellCenter(...a), pb=cellCenter(...b); return Math.hypot(pa.x-eb.x,pa.z-eb.z)-Math.hypot(pb.x-eb.x,pb.z-eb.z); }); return out; }
function roadSpine(){ const out=[]; for(let j=0;j<GRID;j++) for(let i=0;i<GRID;i++){ if(!owned(i,j)||blocked(i,j)) continue; const nb=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>blocked(i+a,j+b)==='road'); if(nb) out.push([i,j]); } return out; }

export const items=()=>S.tw.items;
export const byId=id=>S.tw.items.find(x=>x.id===id);
export const countOf=t=>S.tw.items.filter(x=>x.t===t).length;
export const huts=()=>countOf('hut');
export const totalBuilders=()=>(S.builders||1)+Math.max(0,huts()-1);
export const townBusy=()=>S.tw.items.filter(x=>x.up).length;
export function occupiedBy(i,j,ignore){ for(const it of S.tw.items){ if(it===ignore||it.id===ignore) continue; const [w,h]=dims(it); if(i>=it.i&&i<it.i+w&&j>=it.j&&j<it.j+h) return it; } return null; }
export function canPlace(it,i,j,ignore){ const [w,h]=dims(it); for(let a=0;a<w;a++) for(let b=0;b<h;b++){ const ci=i+a, cj=j+b;
    if(ci<0||cj<0||ci>=GRID||cj>=GRID) return 'Off the map'; if(!owned(ci,cj)) return 'Buy this land first'; if(blocked(ci,cj)) return blocked(ci,cj)==='road'?'That is the main road':'That is the station';
    if(occupiedBy(ci,cj,ignore)) return 'Something is already there'; } return null; }
export function cellsOk(it,i,j,ignore){ const [w,h]=dims(it), out=[]; for(let a=0;a<w;a++) for(let b=0;b<h;b++){ const ci=i+a,cj=j+b;
  const ok=ci>=0&&cj>=0&&ci<GRID&&cj<GRID&&owned(ci,cj)&&!blocked(ci,cj)&&!occupiedBy(ci,cj,ignore); out.push([ci,cj,ok]); } return out; }

/* ---------- build menu info ---------- */
export function buildInfo(t){ const d=TB[t], L=S.level; const n=countOf(t), max=d.count(L);
  const cost = t==='hut' ? [0,0] : TD.upCost(t,1); const badges = t==='hut' ? (d.badges[n]??null) : 0;
  let why=null; if(L<d.unlock) why=`Unlocks at Station Lv ${d.unlock}`; else if(n>=max) why=n>=d.count(99)?(d.count(99)<=1?'Built':'Maxed'):`Max ${max} at this station level · more at a higher Station Lv`; else if(t==='hut'&&badges==null) why='All huts built';
  return { t, d, n, max, cost, badges, why, time:TD.upTime(t,1) }; }
export function place(t,i,j,r){ const bi=buildInfo(t); if(bi.why) return [bi.why]; const it={t,r:r||0};
  const e=canPlace(it,i,j); if(e) return [e];
  if(S.coins<bi.cost[0]) return ['Not enough coins']; if(S.materials<bi.cost[1]) return ['Not enough 💧 water']; if(S.badges<(bi.badges||0)) return ['Not enough badges'];
  if(!TB[t].instant && busy()>=totalBuilders()) return ['All builders are busy. Build a Builder Hut or speed one up'];
  S.coins-=bi.cost[0]; S.materials-=bi.cost[1]; S.badges-=bi.badges||0;
  const n={id:nid(),t,i,j,r:r||0,l:TB[t].instant?1:0,last:now(),store:0};
  if(!TB[t].instant){ const tm=TD.upTime(t,1); n.up={start:now(),end:now()+tm*1000,total:tm}; }
  S.tw.items.push(n); return [null,n]; }
export function move(id,i,j,r){ const it=byId(id); if(!it) return 'Gone'; const test={t:it.t,r:r??it.r}; const e=canPlace(test,i,j,it); if(e) return e; it.i=i; it.j=j; it.r=test.r; return null; }
export const busy=()=>townBusy()+(S.buildings?Object.values(S.buildings).filter(b=>b.up).length:0);
export function info(id){ const it=byId(id); if(!it) return null; const d=TB[it.t]; const maxL=TD.maxLevelFor(it.t,S.level);
  const next=it.l<d.max?it.l+1:null; return { it, d, maxL, next, cost:next?TD.upCost(it.t,next):null, time:next?TD.upTime(it.t,next):0,
    rate:producing(it)?rateNow(it):0, cap:TD.capAt(it.t,Math.max(1,it.l)), up:it.up&&it.up.end>now()?it.up:null, remaining:it.up?Math.max(0,(it.up.end-now())/1000):0 }; }
export function startUp(id){ const i=info(id); if(!i) return 'Gone'; const it=i.it;
  if(it.dmg) return 'Damaged. Repair it first'; if(it.up) return 'Already building'; if(!i.next) return 'Max level';
  if(i.next>i.maxL) return `Needs Station Lv ${i.next-1} (tap the station shield to upgrade)`;
  if(TB[it.t].instant){ if(S.coins<i.cost[0]) return 'Not enough coins'; if(S.materials<i.cost[1]) return 'Not enough 💧 water'; S.coins-=i.cost[0]; S.materials-=i.cost[1]; it.l++; return null; }
  if(busy()>=totalBuilders()) return 'All builders are busy';
  if(S.coins<i.cost[0]) return 'Not enough coins'; if(S.materials<i.cost[1]) return 'Not enough 💧 water';
  collect(id); S.coins-=i.cost[0]; S.materials-=i.cost[1]; it.up={start:now(),end:now()+i.time*1000,total:i.time}; return null; }
export const speedCostT=id=>{ const it=byId(id); if(!it||!it.up) return 0; return Math.max(1,Math.ceil(Math.max(0,(it.up.end-now())/1000)/60)); };
export function speedUpT(id){ const c=speedCostT(id); if(!c) return 'Nothing to speed up'; if(S.badges<c) return 'Not enough badges'; S.badges-=c; byId(id).up.end=now(); return null; }
export function cutTimeT(id,sec){ const it=byId(id); if(it&&it.up) it.up.end-=sec*1000; }

/* ---------- production ---------- */
export const producing=it=>TB[it.t].rate&&it.l>=1&&!it.dmg&&!it.up;
export function customers(){ const pop=population(), shops=S.tw.items.filter(x=>TB[x.t].shop&&x.l>0).length; return shops?Math.max(.35,Math.min(1,pop/(shops*10))):1; }
export function rateNow(it){ let r=TD.rateAt(it.t,it.l); if(TB[it.t].shop) r*=customers(); r*=1+fx().prod; if(TB[it.t].res==='coins') r*=(.9+.2*(S.town?.happy??75)/100); return r; }
function prodTick(t){ for(const it of S.tw.items){ const dt=Math.max(0,(t-(it.last||t))/1000); it.last=t; if(!producing(it)) continue; it.store=Math.min(TD.capAt(it.t,it.l),(it.store||0)+rateNow(it)/3600*dt); } }
export const ready=it=>producing(it)||it.store>=1 ? (it.store||0)>=Math.max(1,TD.capAt(it.t,Math.max(1,it.l))*.04) : false;
export function collect(id){ const it=byId(id); if(!it) return null; let n=Math.floor(it.store||0); if(n<1) return null; const room=A.roomFor(TB[it.t].res==='mats'?'mats':'coins'); if(room<1) return {full:true}; n=Math.min(n,room); it.store-=n;
  if(TB[it.t].res==='mats'){ S.materials+=n; return {mats:n}; } addCoins(n); return {coins:n}; }
export function collectAll(){ let c=0,m=0,full=false; for(const it of S.tw.items){ if(!ready(it)) continue; const r=collect(it.id); if(r){ c+=r.coins||0; m+=r.mats||0; if(r.full) full=true; } } return {coins:c,mats:m,full}; }
export const population=()=>S.tw.items.reduce((a,it)=>a+(TB[it.t].pop&&it.l>0&&!it.dmg?TB[it.t].pop*it.l:0),0);
export function fx(){ const f={happy:0,dmg:0,xp:0,trucks:0,calls:0,water:0,heli:0,haz:0,stable:0,prod:0};
  for(const it of S.tw.items){ if(it.l<1||it.dmg) continue; const d=TB[it.t]; if(d.happy) f.happy+=d.happy*it.l*.5;
    if(d.fx) for(const [k,v] of Object.entries(d.fx)){ f[k]+= k==='heli'?1 : k==='trucks'? v*it.l : v*(1+.5*(it.l-1)); } }
  f.trucks=Math.floor(f.trucks+.01); f.calls=Math.floor(f.calls+.01); f.dmg=Math.min(.6,f.dmg); f.happy=Math.min(25,f.happy); f.heli=f.heli?1:0; return f; }

/* ---------- land ---------- */
export function buyable(){ const out=[]; const own=new Set(S.tw.plots); for(let cy=0;cy<TD.NCH;cy++) for(let cx=0;cx<TD.NCH;cx++){ const k=cx+','+cy; if(own.has(k)) continue;
  if([[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>own.has((cx+a)+','+(cy+b)))) out.push({k,cx,cy}); } return out; }
export function plotInfo(){ const n=S.tw.bought; const [c,m]=TD.plotCost(n); return {cost:c,mats:m,allowed:S.tw.plots.length<TD.plotsAllowed(S.level),n}; }
export function buyPlot(k){ if(S.tw.plots.includes(k)) return 'Already yours'; if(!buyable().some(p=>p.k===k)) return 'Must touch land you own';
  const p=plotInfo(); if(!p.allowed) return `Upgrade your station to buy more land (max ${TD.plotsAllowed(S.level)} plots)`; if(S.coins<p.cost) return 'Not enough coins'; if(S.materials<p.mats) return 'Not enough 💧 water';
  S.coins-=p.cost; S.materials-=p.mats; S.tw.plots.push(k); S.tw.bought++; return null; }

/* ---------- damage ---------- */
export const repairCost=it=>{ const c=TD.upCost(it.t,Math.max(1,it.l)); return [Math.max(20,Math.round(c[0]*.25)), Math.max(1,Math.round(c[1]*.5+1+it.l*.6))]; };
export function damage(id){ const it=byId(id); if(!it||it.l<1||TB[it.t].instant) return false; it.dmg=true; if(it.up){ delete it.up; } return true; }
export function repairT(id){ const it=byId(id); if(!it||!it.dmg) return 'Not damaged'; const [c,m]=repairCost(it); if(S.coins<c) return 'Not enough coins'; if(S.materials<m) return 'Not enough 💧 water';
  S.coins-=c; S.materials-=m; it.dmg=false; it.last=now(); return null; }
export const damagedList=()=>S.tw.items.filter(x=>x.dmg);
export function pickTargets(cats,n,exclude=[]){ const pool=S.tw.items.filter(it=>it.l>=1&&!it.dmg&&!TB[it.t].instant&&cats.includes(TB[it.t].cat)&&!exclude.includes(it.id)); const out=[];
  while(out.length<n&&pool.length){ out.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0].id); } return out; }
export function siteFor(callId){ const kinds=TD.CALL_SITES[callId]||[]; const pool=S.tw.items.filter(it=>kinds.includes(it.t)&&(it.t==='road'||it.l>=1)&&!it.dmg&&!S.calls.some(c=>c.at===it.id&&(c.state==='open'||c.state==='out'))); return pool.length?pool[Math.floor(Math.random()*pool.length)]:null; }

/* ---------- tick ---------- */
export function townTick(events){ const t=now(); prodTick(t);
  for(const it of S.tw.items){ if(it.up&&it.up.end<=t){ delete it.up; it.l++; it.last=t; addStationXP(4+it.l*3); events.push({townBuilt:it.id}); } } }
export function timeWarp(sec){ for(const it of S.tw.items){ it.last=(it.last||now())-sec*1000; } prodTick(now()); }

// v5: a barracks, pump, coin press, cannon and a short firebreak wall for every base (new or migrated)
export function starterV5(){ if(S.v5start) return; S.v5start=true; const L=S.level; const want=[['barracks',1],['pump',1],['cannon',1],['mint',1],['vault',1],['tank',1]];
  const spots=[]; for(let j=0;j<GRID;j++) for(let i=0;i<GRID;i++) if(owned(i,j)&&!blocked(i,j)) spots.push([i,j]);
  const eb=cellCenter(19,19); spots.sort((a,b)=>{ const pa=cellCenter(...a), pb=cellCenter(...b); return Math.hypot(pa.x-eb.x,pa.z-eb.z)-Math.hypot(pb.x-eb.x,pb.z-eb.z); });
  for(const [t,l] of want){ const s2=spots.find(([i,j])=>canPlace({t,r:0},i,j)===null); if(!s2) continue; S.tw.items.push({id:nid(),t,i:s2[0],j:s2[1],r:0,l,last:now(),store:TB[t].rate?TD.rateAt(t,1)*.5:0}); }
  // wall run: first free straight line of 5
  outer: for(const [i,j] of spots){ for(const [a,b] of [[1,0],[0,1]]){ let ok=true; for(let k=0;k<5;k++) if(canPlace({t:'wall',r:0},i+a*k,j+b*k)!==null){ ok=false; break; } if(ok){ for(let k=0;k<5;k++) S.tw.items.push({id:nid(),t:'wall',i:i+a*k,j:j+b*k,r:0,l:1,last:now(),store:0}); break outer; } } }
  S.materials=Math.max(S.materials,40); }
