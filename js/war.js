// Firey Station Tycoon v5: deterministic drill-raid simulation. No DOM, no THREE: same seed + same inputs = same battle,
// so defence replays are just the battle re-run. Coordinates are in tiles (x = i + .5 is the middle of column i).
import { TB, GRID } from './towndata.js';
import * as W from './wardata.js';
export const N = GRID;
export function rng(seed){ let a=seed>>>0||1; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
export const hash = s => { let h=2166136261; for(const c of String(s)){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; };
const isDef = t => W.DEF_TYPES.includes(t);

/* ---------- layouts ---------- */
// a rival base for a drill raid, generated from a seed and an HQ level
export function genBase(level, seed, name, tune=0){ const L=Math.max(1,Math.min(10,level|0)), r=rng(seed); const items=[]; const occ=new Set();
  const free=(i,j,w,h,pad=0)=>{ for(let a=-pad;a<w+pad;a++) for(let b=-pad;b<h+pad;b++){ const ci=i+a,cj=j+b; if(ci<1||cj<1||ci>=N-1||cj>=N-1) return false; if(occ.has(ci+','+cj)) return false; } return true; };
  const put=(t,i,j,lv)=>{ const d=TB[t]; for(let a=0;a<d.w;a++) for(let b=0;b<d.h;b++) occ.add((i+a)+','+(j+b)); items.push({t,i,j,lv:Math.max(1,Math.min(TB[t].max,lv))}); return true; };
  const lvl=()=>Math.max(1,Math.min(L+1,L-(r()<(L>=7?.2:.5)?1:0)-(r()<(L>=7?.08:.25)?1:0)+tune)); // tune -1/0/+1 nudges difficulty within a level (matchmaking)
  const c=12; put('hq',c,c,L);
  // inner ring of 2x2s around the HQ
  const inner=[[c-2,c-2],[c+4,c-2],[c-2,c+4],[c+4,c+4],[c+1,c-2],[c+1,c+4],[c-2,c+1],[c+4,c+1]];
  const defs=['cannon']; for(let k=1;k<1+Math.ceil(L/2);k++) defs.push('cannon'); for(let k=0;k<Math.ceil(L/2);k++) defs.push('sprinkler'); for(let k=0;k<Math.max(0,Math.floor((L-1)/2));k++) defs.push('mortar'); for(let k=0;k<Math.max(0,Math.floor((L-2)/2));k++) defs.push('bomber');
  if(L>=7) for(let k=0;k<L-5;k++) defs.push('cannon','mortar','sprinkler',L>=8?'bomber':'cannon'); // v5.3: late-game bases were too weak for a full army
  if(tune<=-3) defs.splice(1,Math.min(defs.length-1,-tune-2+Math.floor(defs.length/3))); // matchmaking: a thinner base for a small army
  if(tune>=3) for(let k=0;k<tune-2;k++) defs.push(L>=4?'bomber':'sprinkler','sprinkler'); // matchmaking: more anti-air for a big army
  const stores=['vault','tank']; if(L>=3) stores.push('vault','tank');
  const innerWant=[...stores.slice(0,2),...defs.slice(0,Math.min(defs.length,L>=3?4:2))]; let pool=[...inner].sort(()=>r()-.5);
  for(const t of innerWant){ const s=pool.find(([i,j])=>free(i,j,2,2)); if(!s) break; put(t,s[0],s[1],lvl()); pool=pool.filter(x=>x!==s); }
  // walls: a ring around the core (and an outer ring from level 4)
  const wl=Math.max(1,Math.min(L+1,Math.ceil(L*.7)+tune)); const ring=(a,b)=>{ for(let i=a;i<=b;i++) for(const j of [a,b]){ if(free(i,j,1,1)) put('wall',i,j,wl); if(free(j,i,1,1)) put('wall',j,i,wl); } };
  ring(c-3,c+6); if(L>=4) ring(c-7,c+10);
  // everything else scattered outside, keeping a 1-tile gap
  const rest=[...defs.slice(innerWant.length-2>0?Math.min(defs.length,L>=3?4:2):Math.min(defs.length,L>=3?4:2)),...stores.slice(2),'barracks','pump','pump','mint','mint',...(L>=3?['pump','mint','lab']:[]),'house','house','house',...(L>=5?['units','units']:[])];
  for(const t of rest){ const d=TB[t]; for(let tries=0;tries<200;tries++){ const ang=r()*Math.PI*2, rad=(isDef(t)?4.5:6.5)+r()*(isDef(t)?3:5); const i=Math.round(c+1.5+Math.cos(ang)*rad), j=Math.round(c+1.5+Math.sin(ang)*rad); if(free(i,j,d.w,d.h,1)){ put(t,i,j,lvl()); break; } } }
  for(let k=0;k<Math.min(6,Math.max(0,L-1));k++){ for(let tries=0;tries<80;tries++){ const i=4+Math.floor(r()*20), j=4+Math.floor(r()*20); if(free(i,j,1,1,0)&&!items.some(x=>x.t==='wall'&&Math.abs(x.i-i)+Math.abs(x.j-j)<1)){ put('trap',i,j,Math.ceil(L/2)); break; } } }
  const loot={ coins:Math.round(180*Math.pow(L,1.45)*(0.8+r()*.5)), mats:Math.round(14*Math.pow(L,1.3)*(0.8+r()*.5)) };
  return { name:name||'Rival Station', level:L, items, loot }; }
// your own base, from the v4/v5 town plus the station block as the HQ
export function fromTown(S, blockedFn){ const items=[]; for(const it of S.tw.items){ const d=TB[it.t]; if(!d||it.l<1||it.dmg||d.cat==='deco'||d.cat==='road'||d.cat==='hidden') continue; const r=(it.r||0)%2; items.push({t:it.t,i:it.i,j:it.j,lv:it.l,w:r?d.h:d.w,h:r?d.w:d.h,id:it.id}); }
  const cells=[]; for(let j=0;j<N;j++) for(let i=0;i<N;i++) if(blockedFn(i,j)==='station') cells.push([i,j]);
  items.push({t:'hq',lv:S.level,cells,id:'station'});
  const coinsAt=Math.max(0,S.coins), mats=Math.max(0,S.materials); return { name:S.stationName, level:S.level, items, loot:{ coins:Math.round(coinsAt*.2), mats:Math.round(mats*.2) } }; }

/* ---------- the battle ---------- */
export function createBattle({ layout, army={}, heroes=[], research={}, seed=1, mode='attack', plan=null, timeLimit=180 }){
  const B={ N, t:0, mode, seed, r:rng(seed), units:[], projs:[], ev:[], b:[], grid:new Int16Array(N*N).fill(-1), wallsV:0, fields:new Map(), timeLimit,
    deployLeft:{...army}, heroesLeft:heroes.map(h=>({...h})), research, taken:{coins:0,mats:0}, loot:{...layout.loot}, stars:0, pct:0, hqDead:false, over:false, uid:1, plan:plan?plan.slice():null, deployed:0 };
  layout.items.forEach((it,k)=>{ const d=TB[it.t]; const w=it.w||d.w, h=it.h||d.h; const cells=it.cells||(()=>{ const o=[]; for(let a=0;a<w;a++) for(let b=0;b<h;b++) o.push([it.i+a,it.j+b]); return o; })();
    let sx=0,sy=0; cells.forEach(([i,j])=>{ sx+=i+.5; sy+=j+.5; }); const hp=W.hpOf(it.t,it.lv);
    const o={ k, id:it.id||('b'+k), t:it.t, lv:it.lv, cells, cx:sx/cells.length, cy:sy/cells.length, rect:it.cells?null:{x0:it.i,y0:it.j,x1:it.i+w,y1:it.j+h}, hp, max:hp, alive:true, wall:it.t==='wall', trap:it.t==='trap', def:W.defStat(it.t,it.lv), cool:0, tgt:null, jam:0, share:{coins:0,mats:0} };
    if(!o.trap) cells.forEach(([i,j])=>{ if(i>=0&&j>=0&&i<N&&j<N) B.grid[j*N+i]=k; }); B.b.push(o); });
  // loot shares
  const W8={ vault:{coins:.6}, mint:{coins:.25}, tank:{mats:.6}, pump:{mats:.25}, hq:{coins:.15,mats:.15} };
  for(const res of ['coins','mats']){ const owners=B.b.filter(o=>W8[o.t]?.[res]); const tot=owners.reduce((a,o)=>a+W8[o.t][res],0); owners.forEach(o=>o.share[res]=tot?B.loot[res]*W8[o.t][res]/tot:0); }
  B.scored=B.b.filter(o=>!o.wall&&!o.trap); return B; }

const distRect=(o,x,y)=>{ if(o.rect){ const R=o.rect; const dx=Math.max(R.x0-x,0,x-R.x1), dy=Math.max(R.y0-y,0,y-R.y1); return Math.hypot(dx,dy); } let m=1e9; for(const [i,j] of o.cells){ const dx=Math.max(i-x,0,x-(i+1)), dy=Math.max(j-y,0,y-(j+1)); const d=Math.hypot(dx,dy); if(d<m) m=d; } return m; };
export const forbidden=(B,i,j)=>{ if(i<0||j<0||i>=N||j>=N) return true; for(let a=-1;a<=1;a++) for(let b=-1;b<=1;b++){ const ci=i+a,cj=j+b; if(ci<0||cj<0||ci>=N||cj>=N) continue; const k=B.grid[cj*N+ci]; if(k>=0&&B.b[k].alive) return true; } return false; };

/* path field: Dijkstra out from the target's cells. Walls cost extra (troops would rather walk round), other buildings block. */
function field(B,o){ const key=o.k+'|'+B.wallsV; let f=B.fields.get(key); if(f) return f; f=new Float64Array(N*N).fill(1e9); const heap=[];
  const push=(c,d)=>{ heap.push([d,c]); let i=heap.length-1; while(i>0){ const p=(i-1)>>1; if(heap[p][0]<=heap[i][0]) break; [heap[p],heap[i]]=[heap[i],heap[p]]; i=p; } };
  const pop=()=>{ const top=heap[0], last=heap.pop(); if(heap.length){ heap[0]=last; let i=0; for(;;){ const l=i*2+1, r=l+1; let m=i; if(l<heap.length&&heap[l][0]<heap[m][0]) m=l; if(r<heap.length&&heap[r][0]<heap[m][0]) m=r; if(m===i) break; [heap[m],heap[i]]=[heap[i],heap[m]]; i=m; } } return top; };
  for(const [i,j] of o.cells) if(i>=0&&j>=0&&i<N&&j<N){ f[j*N+i]=0; push(j*N+i,0); }
  while(heap.length){ const [d,c]=pop(); if(d>f[c]) continue; const ci=c%N, cj=(c/N)|0;
    for(const [a,b,w] of [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.41],[1,-1,1.41],[-1,1,1.41],[-1,-1,1.41]]){ const ni=ci+a, nj=cj+b; if(ni<0||nj<0||ni>=N||nj>=N) continue; const n=nj*N+ni;
      const k=B.grid[n]; let cost=w; if(k>=0&&B.b[k].alive&&k!==o.k){ if(B.b[k].wall) cost+=7; else continue; }
      if(a&&b){ const k1=B.grid[cj*N+ni], k2=B.grid[nj*N+ci]; if((k1>=0&&B.b[k1].alive&&k1!==o.k)||(k2>=0&&B.b[k2].alive&&k2!==o.k)) continue; }
      const nd=d+cost; if(nd<f[n]){ f[n]=nd; push(n,nd); } } }
  B.fields.set(key,f); return f; }

function pickTarget(B,u){ const live=B.b.filter(o=>o.alive&&!o.trap); let pool=[];
  if(u.prefer==='def') pool=live.filter(o=>isDef(o.t)); else if(u.prefer==='res') pool=live.filter(o=>W.RES_TYPES.includes(o.t)&&o.t!=='hq'); else if(u.prefer==='wall') pool=live.filter(o=>o.wall);
  if(!pool.length) pool=live.filter(o=>!o.wall); if(!pool.length) return null;
  let best=null, bd=1e9; for(const o of pool){ const d=distRect(o,u.x,u.y); if(d<bd){ bd=d; best=o; } } return best; }

export function deploy(B,type,x,y,opt={}){ const i=Math.floor(x), j=Math.floor(y); if(!opt.force&&forbidden(B,i,j)) return 'red';
  const hero=opt.hero; if(hero){ const h=B.heroesLeft.find(h=>h.id===hero); if(!h) return 'none'; B.heroesLeft=B.heroesLeft.filter(x=>x!==h); const st=W.heroStat(h.lvl||1);
    const u=mk(B,{ type:'hero', hero:h, sp:h.species, name:h.name, hp:st.hp, dps:st.dps, range:st.range, speed:st.speed, prefer:'any', x, y }); u.ability=W.heroFor(h.species); B.ev.push({e:'spawn',u}); return u; }
  if(!opt.enemy){ if(!(B.deployLeft[type]>0)) return 'none'; B.deployLeft[type]--; }
  const d=opt.enemy?W.ENEMIES[type]:W.troopStat(type,B.research[type]||1);
  const u=mk(B,{ type, enemy:!!opt.enemy, hp:d.hp, dps:d.dps, range:d.range, speed:d.speed, prefer:d.prefer, air:!!d.air, splash:d.splash||0, jump:!!d.jump, wallX:d.wallX||1, big:!!d.big, x, y }); B.ev.push({e:'spawn',u}); B.deployed++; return u; }
function mk(B,o){ const u={ id:B.uid++, max:o.hp, cd:.3+B.r()*.4, tgt:null, wallT:null, buff:0, stun:0, dead:false, px:o.x, py:o.y, face:0, atkT:0, ...o }; B.units.push(u); return u; }

export function useAbility(B,u){ if(!u||u.dead||u.used) return false; u.used=true; const near=(r)=>B.units.filter(x=>!x.dead&&x!==u&&Math.hypot(x.x-u.x,x.y-u.y)<r);
  const kind=u.ability; B.ev.push({e:'ability',u,kind});
  if(kind==='roo'){ const o=u.tgt&&u.tgt.alive?u.tgt:pickTarget(B,u); if(o){ u.x=o.cx+(u.x>o.cx?1:-1)*.8; u.y=o.cy+(u.y>o.cy?1:-1)*.8; for(const b of B.b) if(b.alive&&!b.trap&&distRect(b,u.x,u.y)<2.2) hit(B,b,u.dps*6,u); } }
  else if(kind==='koala'){ u.heal=3; }
  else if(kind==='wombat'){ for(const b of B.b) if(b.alive&&b.wall&&distRect(b,u.x,u.y)<2.6) hit(B,b,99999,u); for(const b of B.b) if(b.def&&distRect(b,u.x,u.y)<4) b.jam=3; }
  else if(kind==='platypus'){ for(const b of B.b){ if(b.alive&&b.trap&&distRect(b,u.x,u.y)<5){ b.alive=false; B.ev.push({e:'disarm',b}); } if(b.def&&distRect(b,u.x,u.y)<4.5) b.jam=5; } }
  else { u.buff=6; near(4).forEach(x=>x.buff=6); }
  return true; }

function hit(B,o,d,u){ if(!o.alive) return; const dd=Math.min(o.hp,d); o.hp-=d; for(const res of ['coins','mats']){ const g=o.share[res]*dd/o.max; B.taken[res]+=g; }
  B.ev.push({e:'dmg',b:o,d:Math.round(dd),u}); if(o.hp<=0){ o.alive=false; o.hp=0; if(o.wall) B.wallsV++; else B.wallsV++; B.ev.push({e:'destroy',b:o}); if(o.t==='hq') B.hqDead=true; score(B); } }
function score(B){ const dead=B.scored.filter(o=>!o.alive).length; B.pct=Math.round(dead/B.scored.length*100); B.stars=(B.pct>=50?1:0)+(B.hqDead?1:0)+(B.pct>=100?1:0); }
function hurt(B,u,d){ if(u.dead) return; u.hp-=d; B.ev.push({e:'uhit',u,d:Math.round(d)}); if(u.hp<=0){ u.dead=true; B.ev.push({e:'down',u}); } }

export function step(B,dt=.05){ if(B.over) return; B.t+=dt;
  // scripted deploys (defence raids)
  if(B.plan){ while(B.plan.length&&B.plan[0].at<=B.t){ const p=B.plan.shift(); deploy(B,p.type,p.x,p.y,{force:true,enemy:true}); } }
  for(const u of B.units){ if(u.dead) continue; u.px=u.x; u.py=u.y; if(u.stun>0){ u.stun-=dt; continue; } const sp=u.buff>0?1.4:1; if(u.buff>0) u.buff-=dt;
    if(u.heal>0){ u.heal-=dt; B.units.forEach(x=>{ if(!x.dead&&Math.hypot(x.x-u.x,x.y-u.y)<3.5) x.hp=Math.min(x.max,x.hp+x.max*.14*dt); }); }
    if(!u.tgt||!u.tgt.alive){ u.tgt=pickTarget(B,u); u.wallT=null; if(!u.tgt){ continue; } }
    const tg=u.wallT&&u.wallT.alive?u.wallT:u.tgt; const d=distRect(tg,u.x,u.y);
    if(d<=u.range){ u.atkT=.25; u.cd-=dt*sp; u.face=Math.atan2(tg.cx-u.x,tg.cy-u.y); if(u.cd<=0){ u.cd=1; let dmg=u.dps*(tg.wall?(u.wallX||1):1);
        if(u.splash){ for(const b of B.b) if(b.alive&&!b.trap&&distRect(b,tg.cx,tg.cy)<u.splash+.01) hit(B,b,dmg*(b===tg?1:.6),u); } else hit(B,tg,dmg,u); B.ev.push({e:'atk',u,b:tg}); }
      continue; }
    u.wallT=null; u.atkT=Math.max(0,u.atkT-dt); let vx,vy;
    if(u.air||u.jump&&false){ vx=tg.cx-u.x; vy=tg.cy-u.y; }
    else { const f=field(B,u.tgt); const ci=Math.max(0,Math.min(N-1,Math.floor(u.x))), cj=Math.max(0,Math.min(N-1,Math.floor(u.y))); let best=-1, bd=f[cj*N+ci];
      for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){ const ni=ci+a, nj=cj+b; if(ni<0||nj<0||ni>=N||nj>=N) continue; const n=nj*N+ni; if(f[n]<bd-.01){ bd=f[n]; best=n; } }
      if(best<0){ vx=tg.cx-u.x; vy=tg.cy-u.y; }
      else { const k=B.grid[best]; if(k>=0&&B.b[k].alive&&B.b[k].wall&&B.b[k]!==u.tgt){ if(u.jump){ /* ladder: hop the wall */ } else { u.wallT=B.b[k]; continue; } } vx=(best%N)+.5-u.x; vy=((best/N)|0)+.5-u.y; } }
    const L=Math.hypot(vx,vy)||1, s=Math.min(L,u.speed*sp*dt); u.x+=vx/L*s; u.y+=vy/L*s; u.face=Math.atan2(vx,vy);
    if(!u.air) for(const b of B.b){ if(b.trap&&b.alive&&Math.hypot(b.cx-u.x,b.cy-u.y)<b.def.trig){ b.alive=false; B.ev.push({e:'trap',b}); B.units.forEach(x=>{ if(!x.dead&&!x.air&&Math.hypot(x.x-b.cx,x.y-b.cy)<b.def.splash) hurt(B,x,b.def.dmg); }); } } }
  // defences
  for(const o of B.b){ if(!o.alive||!o.def||o.trap) continue; if(o.jam>0){ o.jam-=dt; continue; } o.cool-=dt; const D=o.def;
    const ok=u=>!u.dead&&(u.air?D.air:D.ground)&&(()=>{ const d=Math.hypot(u.x-o.cx,u.y-o.cy); return d<=D.range+1&&d>=(D.min||0); })();
    if(!o.tgt||!ok(o.tgt)){ o.tgt=null; let bd=1e9; for(const u of B.units){ if(!ok(u)) continue; const d=Math.hypot(u.x-o.cx,u.y-o.cy); if(d<bd){ bd=d; o.tgt=u; } } }
    if(o.tgt&&o.cool<=0){ o.cool=D.rate; const u=o.tgt; const p={ from:o, x:o.cx, y:o.cy, tx:u.x, ty:u.y, u:D.proj==='foam'?null:u, dmg:D.dps*D.rate, splash:D.splash||0, sp:D.proj==='foam'?4.5:D.proj==='spray'?12:10, kind:D.proj, t:0, air:D.air&&!D.ground };
      p.dist=Math.hypot(p.tx-p.x,p.ty-p.y); B.projs.push(p); B.ev.push({e:'fire',b:o,p}); } }
  for(const p of B.projs){ if(p.done) continue; if(p.u&&!p.u.dead){ p.tx=p.u.x; p.ty=p.u.y; } const vx=p.tx-p.x, vy=p.ty-p.y, L=Math.hypot(vx,vy), s=p.sp*dt; p.t+=dt;
    if(L<=s){ p.x=p.tx; p.y=p.ty; p.done=true; if(p.splash){ B.units.forEach(x=>{ if(!x.dead&&(x.air?p.kind!=='foam':true)&&Math.hypot(x.x-p.x,x.y-p.y)<p.splash) hurt(B,x,p.dmg); }); } else if(p.u&&!p.u.dead) hurt(B,p.u,p.dmg); B.ev.push({e:'phit',p}); }
    else { p.x+=vx/L*s; p.y+=vy/L*s; } }
  B.projs=B.projs.filter(p=>!p.done);
  // ending
  const alive=B.units.some(u=>!u.dead); const left=Object.values(B.deployLeft).reduce((a,b)=>a+b,0)+B.heroesLeft.length+(B.plan?B.plan.length:0);
  if(B.pct>=100||B.t>=B.timeLimit||(!alive&&(left===0||(B.mode!=='attack'&&!B.plan?.length))&&B.deployed>0)) end(B); }
export function end(B){ if(B.over) return; B.over=true; score(B); B.taken.coins=Math.floor(B.taken.coins); B.taken.mats=Math.floor(B.taken.mats); B.ev.push({e:'over'}); }
// run a whole battle with no rendering (offline defence raids)
export function simulate(B,maxT=200){ while(!B.over&&B.t<maxT) step(B,.05); if(!B.over) end(B); return B; }

/* ---------- enemy fire-wave plan for raids on your base ---------- */
export function raidPlan(level, seed, kind){ const r=rng(seed), out=[]; const L=Math.max(1,level); const n=3+L*2; const side=Math.floor(r()*4);
  const edge=()=>{ const s=(side+(r()<.3?1:0))%4, k=3+r()*(N-6); return s===0?[k,.6]:s===1?[N-.6,k]:s===2?[k,N-.6]:[.6,k]; };
  const pool=kind==='arson'?['firebug','firebug','ember','blaze']:L>=4?['ember','ember','blaze','firebug','smoke']:['ember','ember','ember','blaze','firebug'];
  for(let k=0;k<n;k++){ const [x,y]=edge(); out.push({ at:1+Math.floor(k/4)*3+r()*1.5, type:pool[Math.floor(r()*pool.length)], x, y }); }
  return out.sort((a,b)=>a.at-b.at); }
