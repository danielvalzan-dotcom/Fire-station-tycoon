// Hands-on call-out and disaster-zone scenes (v3). 2D canvas, touch controls, 20-60s each.
// runAction(root, opts, onDone) -> onDone({stars, score, note}). opts: {scene, title, icon, tier, diff, help, variant, people}
// help comes from state.teamHelp(): crew roles, skills and animal perks change how each scene plays.
import { Snd } from './audio.js';
import { SCENES } from './data.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), rand=(a,b)=>a+Math.random()*(b-a), dist=(a,b,c,d)=>Math.hypot(a-c,b-d);
const TOP=118, BOT=86;

export function runAction(root, o, onDone){
  const def=SCENES[o.scene]; const help=o.help||{chips:[]};
  root.innerHTML=`<canvas class="ac-cv"></canvas>
   <div class="ac-top"><div class="ac-t1"><span class="ac-ic">${o.icon||'🚒'}</span><b>${o.title||def.name}</b><span class="ac-time">0:00</span></div>
     <div class="ac-obj">${def.how}</div><div class="ac-bar"><i></i><span></span></div></div>
   <div class="ac-help">${help.chips.slice(0,4).map(c=>`<span>${c}</span>`).join('')}</div>
   <button class="ac-bail gbtn sm red">Pull out</button><div class="ac-pop"></div><div class="ac-end"></div>`;
  root.classList.add('on');
  const cv=root.querySelector('.ac-cv'), g=cv.getContext('2d'), timeEl=root.querySelector('.ac-time'), barI=root.querySelector('.ac-bar i'), barS=root.querySelector('.ac-bar span'), objEl=root.querySelector('.ac-obj');
  const dpr=Math.min(2,window.devicePixelRatio||1); let W=0,H=0;
  function size(){ const r=root.getBoundingClientRect(); W=r.width; H=r.height; cv.width=W*dpr; cv.height=H*dpr; g.setTransform(dpr,0,0,dpr,0,0); } size();
  const E={ t:0, T:40, over:false, ptr:{x:0,y:0,down:false,t0:0}, parts:[], pops:[], g, get W(){return W}, get H(){return H}, top:TOP, bot:BOT, help, o,
    obj(t){ if(objEl.textContent!==t) objEl.textContent=t; }, pop(text,x,y,col='#fff'){ E.pops.push({text,x,y,col,life:1}); },
    burst(x,y,col,n=8,sp=140){ for(let i=0;i<n;i++) E.parts.push({x,y,vx:rand(-sp,sp),vy:rand(-sp,sp*.4)-sp*.4,life:rand(.4,.8),col,r:rand(2,4)}); },
    end(stars,note){ if(E.over) return; E.over=true; stars=clamp(Math.round(stars),0,3); Snd.saw(0); Snd.setSpray(0);
      if(stars>0){ Snd.callWin(); Snd.cheer(1.2,.5); } else Snd.callFail();
      const endEl=root.querySelector('.ac-end'); endEl.innerHTML=`<div class="ac-card"><h2>${stars>0?['','Job done','Great work!','Textbook!'][stars]:'We lost this one'}</h2><div class="stars">${[1,2,3].map(i=>`<span class="${i<=stars?'on':''}">★</span>`).join('')}</div><p>${note||''}</p><button class="gbtn green wide ac-ok">${stars>0?'Back to the station':'Regroup'}</button></div>`;
      endEl.classList.add('on'); const t0=performance.now();
      endEl.querySelector('.ac-ok').addEventListener('click',()=>{ if(performance.now()-t0<450) return; cleanup(); onDone({stars,score:E.score||0,note}); }); } };
  window.__act=E;
  const S=SCENE_IMPL[o.scene](E,o,help); E.T=S.T||E.T;
  const pos=e=>{ const r=cv.getBoundingClientRect(); return {x:e.clientX-r.left, y:e.clientY-r.top}; };
  cv.addEventListener('pointerdown',e=>{ e.preventDefault(); if(E.over) return; const p=pos(e); Object.assign(E.ptr,p,{down:true,t0:E.t}); S.down&&S.down(p); },{passive:false});
  cv.addEventListener('pointermove',e=>{ e.preventDefault(); const p=pos(e); E.ptr.x=p.x; E.ptr.y=p.y; if(E.ptr.down&&!E.over) S.move&&S.move(p); },{passive:false});
  const up=e=>{ if(!E.ptr.down) return; E.ptr.down=false; if(!E.over) S.up&&S.up(pos(e)); };
  cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up); cv.addEventListener('pointerleave',up);
  root.querySelector('.ac-bail').addEventListener('click',()=>{ if(!E.over) E.end(S.bail?S.bail():0,'You pulled the crew out. Safety first.'); });
  let last=performance.now(), raf=0;
  function frame(now){ const dt=Math.min(.1,(now-last)/1000); last=now;
    if(!E.over){ E.t+=dt; S.update(dt); if(E.t>=E.T&&!E.over) E.end(S.timeout?S.timeout():0, 'Out of time.'); }
    for(const p of E.parts){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=300*dt; p.life-=dt; } E.parts=E.parts.filter(p=>p.life>0);
    for(const p of E.pops){ p.life-=dt*1.1; p.y-=30*dt; } E.pops=E.pops.filter(p=>p.life>0);
    g.clearRect(0,0,W,H); S.draw(g); if(E.heliK!=null&&E.heliK<1) heliPass(g,E,E.heliK,W);
    for(const p of E.parts){ g.globalAlpha=clamp(p.life*2,0,1); g.fillStyle=p.col; g.beginPath(); g.arc(p.x,p.y,p.r,0,7); g.fill(); } g.globalAlpha=1;
    g.textAlign='center'; g.font='22px "Lilita One", system-ui'; g.lineWidth=5; g.strokeStyle='rgba(0,0,0,.7)';
    for(const p of E.pops){ g.globalAlpha=clamp(p.life*1.5,0,1); g.strokeText(p.text,p.x,p.y); g.fillStyle=p.col; g.fillText(p.text,p.x,p.y); } g.globalAlpha=1;
    const left=Math.max(0,E.T-E.t); timeEl.textContent=`${Math.floor(left/60)}:${String(Math.floor(left%60)).padStart(2,'0')}`; timeEl.classList.toggle('low',left<8);
    const pr=clamp(S.progress(),0,1); barI.style.width=(pr*100)+'%'; barS.textContent=S.label?S.label():Math.round(pr*100)+'%';
    raf=requestAnimationFrame(frame); }
  raf=requestAnimationFrame(frame);
  function cleanup(){ cancelAnimationFrame(raf); Snd.saw(0); Snd.setSpray(0); root.classList.remove('on'); root.innerHTML=''; window.__act=null; }
  return { abort(){ cleanup(); } };
}
const starsByTime=(t,T,a=.5,b=.78)=>t<=T*a?3:t<=T*b?2:1;

/* ---------- drawing helpers ---------- */
function sky(g,W,H,top='#7cc6f2',bot='#d7f0ff'){ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,top); gr.addColorStop(1,bot); g.fillStyle=gr; g.fillRect(0,0,W,H); }
function ground(g,W,H,y,col='#6abf4b',col2='#58a63c'){ g.fillStyle=col; g.fillRect(0,y,W,H-y); g.fillStyle=col2; for(let x=0;x<W;x+=22) g.fillRect(x,y,11,4); }
function rr(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function box(g,x,y,w,h,fill,stroke='#2a1d10',r=6){ rr(g,x,y,w,h,r); g.fillStyle=fill; g.fill(); g.lineWidth=2.5; g.strokeStyle=stroke; g.stroke(); }
function house(g,x,y,w,h,wall='#f1d9b5',roof='#c0392b'){ box(g,x,y,w,h,wall); g.beginPath(); g.moveTo(x-10,y+2); g.lineTo(x+w/2,y-h*.55); g.lineTo(x+w+10,y+2); g.closePath(); g.fillStyle=roof; g.fill(); g.lineWidth=2.5; g.strokeStyle='#2a1d10'; g.stroke();
  box(g,x+w*.4,y+h*.5,w*.2,h*.5,'#8d5a3b',undefined,3); }
function win(g,x,y,w,h,lit){ box(g,x,y,w,h,lit?'#ffe28a':'#9fd3ef',undefined,3); g.strokeStyle='#fff'; g.lineWidth=2; g.beginPath(); g.moveTo(x+w/2,y+3); g.lineTo(x+w/2,y+h-3); g.stroke(); }
function person(g,x,y,s=1,shirt='#3f7fd8',wave=0){ g.save(); g.translate(x,y); g.scale(s,s); g.fillStyle=shirt; rr(g,-8,-16,16,18,6); g.fill(); g.strokeStyle='#2a1d10'; g.lineWidth=2; g.stroke();
  g.fillStyle='#f2c9a0'; g.beginPath(); g.arc(0,-24,8,0,7); g.fill(); g.stroke(); g.strokeStyle=shirt; g.lineWidth=4; g.beginPath(); g.moveTo(7,-12); g.lineTo(14,-22-Math.sin(wave)*6); g.stroke(); g.restore(); }
function firey(g,x,y,s=1,face=1){ g.save(); g.translate(x,y); g.scale(s*face,s); box(g,-11,-30,22,26,'#c9a762',undefined,7); g.fillStyle='#e8ff6a'; g.fillRect(-11,-14,22,4);
  g.fillStyle='#b9824f'; g.beginPath(); g.arc(0,-40,10,0,7); g.fill(); g.strokeStyle='#2a1d10'; g.lineWidth=2; g.stroke(); g.fillStyle='#ffd23f'; g.beginPath(); g.ellipse(0,-46,13,6,0,Math.PI,0); g.fill(); g.stroke(); g.fillRect(-15,-47,30,3);
  g.fillStyle='#333'; g.fillRect(-9,-4,7,8); g.fillRect(2,-4,7,8); g.restore(); }
function flame(g,x,y,r,t,a=1){ if(r<2) return; g.save(); g.globalAlpha=a; const f=Math.sin(t*14+x)*.12;
  const layer=(sc,col)=>{ g.fillStyle=col; g.beginPath(); g.moveTo(x-r*sc,y); g.quadraticCurveTo(x-r*sc*1.1,y-r*sc*1.2,x+f*r,y-r*sc*(2.1+f)); g.quadraticCurveTo(x+r*sc*1.1,y-r*sc*1.2,x+r*sc,y); g.quadraticCurveTo(x,y+r*sc*.35,x-r*sc,y); g.fill(); };
  layer(1,'#e8410f'); layer(.72,'#ff9a1f'); layer(.42,'#ffe45c'); g.restore(); }
function smoke(g,x,y,r,a){ g.fillStyle=`rgba(90,90,90,${a})`; g.beginPath(); g.arc(x,y,r,0,7); g.arc(x+r*.7,y-r*.3,r*.8,0,7); g.arc(x-r*.6,y-r*.2,r*.7,0,7); g.fill(); }
function meter(g,x,y,w,label,v,col){ g.fillStyle='rgba(0,0,0,.45)'; rr(g,x,y,w,16,8); g.fill(); g.fillStyle=col; rr(g,x+2,y+2,(w-4)*clamp(v,0,1),12,6); g.fill();
  g.fillStyle='#fff'; g.font='12px "Lilita One", system-ui'; g.textAlign='left'; g.fillText(label,x+6,y+12.5); }
function truck(g,x,y,s=1){ g.save(); g.translate(x,y); g.scale(s,s); box(g,0,-46,120,40,'#d32f2f'); box(g,84,-62,36,22,'#d32f2f'); win(g,90,-58,24,14); g.fillStyle='#fff'; g.fillRect(4,-30,76,5);
  for(const wx of [24,96]){ g.fillStyle='#222'; g.beginPath(); g.arc(wx,-6,11,0,7); g.fill(); g.fillStyle='#bbb'; g.beginPath(); g.arc(wx,-6,4,0,7); g.fill(); } g.restore(); }
function car(g,x,y,w,col='#2e86de',crushed=0){ const h=w*.36; box(g,x,y-h,w,h,col,undefined,10); g.beginPath(); g.moveTo(x+w*.2,y-h); g.lineTo(x+w*.32-crushed*8,y-h*1.75+crushed*10); g.lineTo(x+w*.72,y-h*1.75+crushed*14); g.lineTo(x+w*.84,y-h); g.closePath(); g.fillStyle=col; g.fill(); g.stroke();
  win(g,x+w*.34,y-h*1.62+crushed*10,w*.17,h*.5); win(g,x+w*.54,y-h*1.62+crushed*12,w*.17,h*.5);
  for(const wx of [.2,.8]){ g.fillStyle='#222'; g.beginPath(); g.arc(x+w*wx,y,h*.36,0,7); g.fill(); g.fillStyle='#999'; g.beginPath(); g.arc(x+w*wx,y,h*.14,0,7); g.fill(); } }

/* ---------- scenes ---------- */
function heliPass(g,E,k,W){ if(k<0||k>1) return; const x=-80+(W+160)*k, y=E.top+95; g.save(); g.translate(x,y); g.fillStyle='#d32f2f'; g.beginPath(); g.ellipse(0,0,34,16,0,0,7); g.fill(); g.fillRect(-70,-4,40,8); g.fillStyle='#bfe8ff'; g.beginPath(); g.ellipse(16,-3,12,9,0,0,7); g.fill();
  g.strokeStyle='#222'; g.lineWidth=4; g.beginPath(); const r=Math.sin(E.t*60)*44; g.moveTo(-r,-22); g.lineTo(r,-22); g.stroke(); g.fillStyle='#ff9800'; g.fillRect(-8,26,16,14); g.strokeStyle='#333'; g.lineWidth=1.5; g.beginPath(); g.moveTo(0,16); g.lineTo(0,26); g.stroke();
  if(k>.38&&k<.62){ g.fillStyle='rgba(180,225,255,.55)'; g.beginPath(); g.moveTo(-10,40); g.lineTo(10,40); g.lineTo(60,E.H); g.lineTo(-60,E.H); g.fill(); } g.restore(); }
const SCENE_IMPL = {
/* HOSE: aim and hold, with spread, wind, water tank, heat, hidden hotspots and people to rescue */
hose(E,o,h){ const W=()=>E.W, H=()=>E.H; const v=o.variant||'house'; const k=clamp(o.diff||1,.7,1.6);
  const T=Math.round(34+(o.tier||1)*7); const gy=()=>H()-E.bot-60; const L=E.L={flames:[],hots:[],people:[],drops:[],tank:1,heat:0,back:0,wind:rand(-1,1),wt:0,total:0,spray:false};
  const cx=()=>W()/2, tgtTop=()=>E.top+40;
  const layout={ bin:[[0,0]], car:[[-.18,0],[.05,-.05],[.2,0]], house:[[-.25,-.05],[-.05,-.28],[.18,-.08],[.0,.02],[.26,-.3]], unit:[[-.28,-.1],[.0,-.38],[.25,-.12],[-.1,-.6],[.2,-.62],[.02,-.02]], factory:[[-.32,-.1],[-.12,-.25],[.08,-.1],[.3,-.2],[-.2,-.45],[.15,-.45],[0,-.02]] }[v]||[[0,0]];
  const base=()=>({x:cx(), y:gy()-10, w:Math.min(300,W()*.8), h:(v==='unit'?H()*.45:v==='bin'?60:v==='car'?90:H()*.28)});
  layout.forEach(([fx,fy],i)=>L.flames.push({fx,fy,hp:1,max:1,r:v==='bin'?20:26,regrow:.05*k,id:i}));
  const nh=v==='bin'?0:v==='car'?1:2; for(let i=0;i<nh;i++) L.hots.push({fx:rand(-.3,.3),fy:rand(-.3,0),hp:.6,found:false});
  if(v==='house') L.people.push({fx:.24,fy:-.55,saved:0}); if(v==='unit') L.people.push({fx:-.25,fy:-.8,saved:0},{fx:.25,fy:-.4,saved:0});
  const P=f=>{ const b=base(); return {x:b.x+f.fx*b.w, y:b.y+f.fy*b.h*1.6}; };
  E.P=P; L.total=L.flames.length; const nozzle=()=>({x:W()*.18,y:gy()+30});
  E.score=0;
  return { T,
    down(p){ for(const pe of L.people){ if(pe.saved>=1) continue; const q=P(pe); if(dist(p.x,p.y,q.x,q.y)<34){ const near=L.flames.some(f=>f.hp>.25&&dist(P(f).x,P(f).y,q.x,q.y)<110);
          if(near){ E.pop('Too hot! Knock down the fire near them',q.x,q.y-30,'#ffab91'); Snd.no(); } else { pe.saved+=.34; Snd.hit(1); if(pe.saved>=1){ E.pop('RESCUED!',q.x,q.y-30,'#a5ff8a'); Snd.cheer(1,.6); E.burst(q.x,q.y,'#fff',12); } } return; } } },
    update(dt){ L.wt-=dt; if(L.wt<=0){ L.wt=rand(4,7); L.wind=clamp(L.wind+rand(-1.2,1.2),-1.4,1.4); }
      if(h.heli&&!L.heli&&E.t>4) L.heli={t:0}; if(L.heli&&L.heli.t<3.2){ L.heli.t+=dt; E.heliK=L.heli.t/3.2; Snd.setSpray(L.heli.t>1.2&&L.heli.t<2?2:0); if(!L.heli.drop&&L.heli.t>1.5){ L.heli.drop=true; L.flames.forEach(f=>{ if(f.hp>0) f.hp=Math.max(0,f.hp-.5); }); E.pop('WATER BOMBER!',W()/2,E.top+150,'#b3e5fc'); Snd.splash(); } }
      const spraying=E.ptr.down&&L.back<=0&&L.tank>0.02&&E.ptr.y<gy()+20; L.spray=spraying; Snd.setSpray(spraying?3:0);
      if(spraying){ L.tank=Math.max(0,L.tank-dt*.085/h.water); const n=nozzle(); const ang=Math.atan2(E.ptr.y-n.y,E.ptr.x-n.x); const spd=520*h.pressure;
        for(let i=0;i<4;i++){ const a=ang+rand(-.09,.09)/h.pressure; L.drops.push({x:n.x,y:n.y,vx:Math.cos(a)*spd*rand(.85,1.05),vy:Math.sin(a)*spd*rand(.85,1.05),life:1.2,tx:E.ptr.x,ty:E.ptr.y}); } }
      else L.tank=Math.min(1,L.tank+dt*.05*h.water);
      for(const d of L.drops){ d.vx+=L.wind*90*dt; d.vy+=220*dt; d.x+=d.vx*dt; d.y+=d.vy*dt; d.life-=dt;
        for(const f of L.flames){ if(f.hp<=0) continue; const q=P(f); if(dist(d.x,d.y,q.x,q.y-f.r*f.hp)<f.r*1.3+6){ f.hp-=.022*h.pressure*h.power/k; d.life=0; if(Math.random()<.3) Snd.sizzle(); if(f.hp<=0){ f.hp=0; E.pop('OUT!',q.x,q.y-20,'#b3e5fc'); E.burst(q.x,q.y,'#cfd8dc',10); Snd.splash(); } break; } }
        for(const s of L.hots){ if(s.hp<=0) continue; const q=P(s); if(dist(d.x,d.y,q.x,q.y)<22){ s.hp-=.03*h.pressure; d.life=0; if(s.hp<=0){ E.pop('Hotspot out',q.x,q.y-16,'#b3e5fc'); Snd.splash(); } } } }
      L.drops=L.drops.filter(d=>d.life>0&&d.y<H());
      // regrowth, spread and reignition from hotspots
      for(const f of L.flames){ if(f.hp>0&&f.hp<f.max&&!L.spray) f.hp=Math.min(f.max,f.hp+f.regrow*dt*.6); }
      for(const s of L.hots){ if(s.hp>0&&Math.random()<dt*.06*k){ const f=L.flames.find(f=>f.hp<=0); if(f){ f.hp=.35; f.fx=s.fx; f.fy=s.fy; E.pop('Flare-up!',P(f).x,P(f).y-30,'#ffcc80'); Snd.crackle(); } } }
      const burning=L.flames.reduce((a,f)=>a+f.hp,0); if(burning>0) Snd.crackle();
      L.heat=clamp(L.heat+dt*(burning*.045*h.heat-.05),0,1); if(L.heat>=1&&L.back<=0){ L.back=2.2; E.pop('Too hot! Crew backing off',W()/2,gy()-40,'#ff8a65'); Snd.no(); } if(L.back>0){ L.back-=dt; L.heat=Math.max(0,L.heat-dt*.35); }
      const allOut=burning<=0&&L.hots.every(s=>s.hp<=0); const ppl=L.people.every(p=>p.saved>=1);
      E.obj(burning>0?(h.hotspots?'Knock down the flames. Gold rings = hidden hotspots':'Knock down the flames. Watch for flare-ups'):!ppl?'Fire is down: tap the person to bring them out!':L.hots.some(s=>s.hp>0)?'Find the last hotspot (steam)':'');
      if(allOut&&ppl){ const st=starsByTime(E.t,E.T,.55,.8); E.score=st; E.end(st, `${L.total} flames out${L.people.length?`, ${L.people.length} rescued`:''}. Tank ${Math.round(L.tank*100)}% left.`); } },
    progress(){ const fl=1-L.flames.reduce((a,f)=>a+f.hp,0)/L.total; const pe=L.people.length?L.people.reduce((a,p)=>a+Math.min(1,p.saved),0)/L.people.length:1; const hs=L.hots.length?L.hots.filter(s=>s.hp<=0).length/L.hots.length:1; return fl*.7+pe*.2+hs*.1; },
    label(){ return `Fire knocked down ${Math.round((1-L.flames.reduce((a,f)=>a+f.hp,0)/L.total)*100)}%`; },
    timeout(){ return this.progress()>.75?1:0; }, bail(){ return 0; },
    draw(g){ sky(g,W(),H(),L.heat>.5?'#c98a5a':'#8fc9ec','#f0d9b5'); ground(g,W(),H(),gy()+18,'#7a7f86','#6b7077'); const b=base(); const t=E.t;
      // target
      if(v==='bin'){ box(g,b.x-28,b.y-60,56,64,'#2e7d32'); box(g,b.x-32,b.y-70,64,12,'#1b5e20'); }
      else if(v==='car') car(g,b.x-b.w*.35,b.y+10,b.w*.7,'#8e8e8e',.3);
      else if(v==='unit'){ box(g,b.x-b.w/2,b.y-b.h*1.55,b.w,b.h*1.6,'#e0cfb1'); for(let r=0;r<4;r++) for(let c=0;c<4;c++) win(g,b.x-b.w/2+18+c*(b.w-36)/3.6,b.y-b.h*1.45+r*b.h*.38,28,26,(r+c)%3===0); }
      else if(v==='factory'){ box(g,b.x-b.w/2,b.y-b.h*1.1,b.w,b.h*1.15,'#b0a491'); box(g,b.x+b.w*.25,b.y-b.h*1.7,26,b.h*.7,'#8d8170'); for(let c=0;c<5;c++) win(g,b.x-b.w/2+14+c*(b.w-28)/5,b.y-b.h*.8,30,24); }
      else { house(g,b.x-b.w/2,b.y-b.h,b.w,b.h+10); win(g,b.x-b.w*.38,b.y-b.h*.75,40,32,true); win(g,b.x+b.w*.18,b.y-b.h*.75,40,32); }
      for(const pe of L.people){ if(pe.saved>=1) continue; const q=P(pe); win(g,q.x-24,q.y-34,48,40); person(g,q.x,q.y,1,'#e91e63',t*6); g.fillStyle='#fff'; g.font='13px "Lilita One"'; g.textAlign='center'; g.fillText('HELP!',q.x,q.y-40); }
      for(const s of L.hots){ if(s.hp<=0) continue; const q=P(s); const a=h.hotspots?.9:.25; g.strokeStyle=`rgba(255,200,40,${a})`; g.lineWidth=3; g.beginPath(); g.arc(q.x,q.y,16+Math.sin(t*6)*3,0,7); g.stroke(); smoke(g,q.x,q.y-20-((t*30)%30),8,.25); }
      for(const f of L.flames){ if(f.hp<=0){ const q=P(f); smoke(g,q.x,q.y-24-((t*25+f.id*9)%40),10,.25); continue; } const q=P(f); smoke(g,q.x+L.wind*20,q.y-f.r*3-((t*40+f.id*13)%60),14*f.hp+6,.35); flame(g,q.x,q.y,f.r*(.5+f.hp*.7),t); }
      // stream
      g.fillStyle='rgba(190,230,255,.9)'; for(const d of L.drops){ g.beginPath(); g.arc(d.x,d.y,3.2,0,7); g.fill(); }
      truck(g,-30,gy()+40,.8); const n=nozzle(); firey(g,n.x-10,n.y+24,1.05);
      if(L.spray){ g.strokeStyle='#d32f2f'; g.lineWidth=6; g.beginPath(); g.moveTo(n.x-30,n.y+10); g.quadraticCurveTo(n.x-15,n.y+20,n.x,n.y); g.stroke(); }
      // wind sock + meters
      const wx=W()-70, wy=E.top+14; g.fillStyle='#fff'; g.font='13px "Lilita One"'; g.textAlign='left'; g.fillText('WIND',wx,wy+12); g.save(); g.translate(wx+52,wy+8); g.scale(L.wind>=0?1:-1,1); g.fillStyle='#ff7043'; g.beginPath(); g.moveTo(0,-6); g.lineTo(10+Math.abs(L.wind)*12,-3); g.lineTo(10+Math.abs(L.wind)*12,3); g.lineTo(0,6); g.fill(); g.restore();
      meter(g,10,E.top+6,120,`Water ${Math.round(L.tank*100)}%`,L.tank,'#29b6f6'); meter(g,10,E.top+26,120,L.back>0?'BACKING OFF':'Heat',L.heat,L.heat>.7?'#ff5252':'#ffa726'); } }; },

/* LADDER: drag the ladder tip to the casualty, climb with steady taps, bring them down */
ladder(E,o,h){ const W=()=>E.W, H=()=>E.H; const v=o.variant||'tree'; const n=o.people||(v==='flood'?2:1); const T=Math.round(30+(o.tier||1)*8+n*8);
  const gy=()=>H()-E.bot-40; const L=E.L={phase:'aim',tip:null,targets:[],cur:0,rung:0,rungs:10,last:0,wob:0,carry:false,sway:0,saved:0};
  const base=()=>({x:W()*.2,y:gy()-30});
  for(let i=0;i<n;i++) L.targets.push({fx:.62+i*.18, fy:v==='cliff'?.35:v==='flood'?.5:.4, done:false});
  const tgt=()=>{ const t=L.targets[Math.min(L.cur,L.targets.length-1)]; return {x:W()*t.fx+Math.sin(E.t*1.3)*L.sway, y:E.top+(gy()-E.top)*t.fy}; };
  L.sway=v==='cliff'?14:8; E.tgt=tgt; E.base=base;
  return { T,
    down(p){ if(L.phase==='aim'){ L.tip={x:p.x,y:p.y}; } else this.tap(p); },
    move(p){ if(L.phase==='aim'){ L.tip={x:p.x,y:p.y}; } },
    up(p){ if(L.phase!=='aim'||!L.tip) return; const q=tgt(); if(dist(L.tip.x,L.tip.y,q.x,q.y+26)<46){ L.phase='climb'; L.rung=0; L.rungs=Math.round(dist(base().x,base().y,q.x,q.y)/34); Snd.thud(); E.pop('Ladder locked!',q.x,q.y+40,'#a5ff8a'); }
      else { E.pop('Not quite! Line it up',L.tip.x,L.tip.y,'#ffab91'); Snd.creak(); L.tip=null; } },
    tap(){ const dtap=E.t-L.last; L.last=E.t; if(L.phase==='secure'){ L.hold=(L.hold||0)+1; Snd.hit(1); if(L.hold>=3){ L.phase='down'; L.carry=true; E.pop('Got ya!',tgt().x,tgt().y-30,'#fff'); } return; }
      if(dtap<.16){ L.wob+=.28; Snd.creak(); } else { L.wob=Math.max(0,L.wob-.1); }
      if(L.wob>=1){ L.wob=.3; L.rung=Math.max(0,L.rung-(L.phase==='climb'?3:-3)); E.pop('Wobble! Slow and steady',W()/2,gy()-60,'#ffab91'); Snd.no(); return; }
      const step=h.climb*(L.carry?.75:1); Snd.step();
      if(L.phase==='climb'){ L.rung=Math.min(L.rungs,L.rung+step); if(L.rung>=L.rungs){ L.phase='secure'; L.hold=0; E.pop('Tap to secure them',tgt().x,tgt().y-40,'#ffe082'); } }
      else if(L.phase==='down'){ L.rung=Math.max(0,L.rung-step); if(L.rung<=0){ L.saved++; L.targets[L.cur].done=true; Snd.cheer(1,.6); E.pop('SAFE!',base().x+40,gy()-40,'#a5ff8a'); E.burst(base().x+40,gy()-40,'#fff',12);
          L.carry=false; L.cur++; if(L.cur>=L.targets.length){ E.score=starsByTime(E.t,E.T,.5,.78); E.end(E.score,`${L.saved} rescued.`); } else { L.phase='aim'; L.tip=null; } } } },
    update(dt){ L.wob=Math.max(0,L.wob-dt*.35);
      E.obj({aim:'Drag the ladder tip up to the casualty, then let go',climb:'Tap steadily to climb (too fast = wobble)',secure:'Tap 3 times to clip them on',down:'Tap steadily to climb down'}[L.phase]); },
    progress(){ return (L.saved+(L.phase==='climb'?L.rung/L.rungs*.45:L.phase==='secure'?.5:L.phase==='down'?.5+(1-L.rung/L.rungs)*.5:0))/L.targets.length; },
    label(){ return `Rescued ${L.saved}/${L.targets.length}`; }, timeout(){ return L.saved>0?1:0; },
    draw(g){ sky(g,W(),H(),v==='flood'?'#6d7f8f':'#8fc9ec',v==='flood'?'#a7b7c4':'#e9f6ff'); const t=E.t;
      if(v==='flood'){ g.fillStyle='#5d7f93'; g.fillRect(0,gy()-10,W(),H()); g.fillStyle='rgba(255,255,255,.25)'; for(let x=0;x<W();x+=40) g.fillRect((x+t*30)%W(),gy()+Math.sin(x+t)*3,24,3);
        for(const tg of L.targets){ const x=W()*tg.fx, y=E.top+(gy()-E.top)*tg.fy; box(g,x-50,y+30,100,gy()-y,'#e9e1d0'); g.fillStyle='#8d6e63'; g.fillRect(x-56,y+26,112,8); } }
      else if(v==='cliff'){ ground(g,W(),H(),gy()); g.fillStyle='#9c8466'; g.beginPath(); g.moveTo(W()*.5,H()); g.lineTo(W()*.5,E.top+60); g.lineTo(W(),E.top+30); g.lineTo(W(),H()); g.fill(); g.strokeStyle='#5d4a35'; g.lineWidth=3; g.stroke();
        for(const tg of L.targets){ const x=W()*tg.fx, y=E.top+(gy()-E.top)*tg.fy; g.fillStyle='#7d6750'; g.fillRect(x-36,y+28,80,10); } }
      else { ground(g,W(),H(),gy()); g.fillStyle='#7a4b2a'; g.fillRect(W()*.66,E.top+60,26,gy()-E.top-40); g.fillStyle='#3f9d3a'; g.beginPath(); g.arc(W()*.7,E.top+80,90,0,7); g.fill(); g.fillStyle='#4caf50'; g.beginPath(); g.arc(W()*.62,E.top+120,60,0,7); g.fill(); g.fillStyle='#7a4b2a'; g.fillRect(W()*.5,E.top+(gy()-E.top)*.4+26,W()*.3,10); }
      truck(g,base().x-90,gy()+30,.9);
      L.targets.forEach((tg,i)=>{ if(tg.done) return; const x=W()*tg.fx+(i===L.cur?Math.sin(t*1.3)*L.sway:0), y=E.top+(gy()-E.top)*tg.fy; if(i===L.cur&&L.carry) return;
        if(v==='tree'){ g.fillStyle='#ff9800'; g.beginPath(); g.ellipse(x,y+16,14,10,0,0,7); g.fill(); g.beginPath(); g.arc(x+10,y+6,8,0,7); g.fill(); g.fillStyle='#000'; g.fillRect(x+8,y+4,2,2); g.fillRect(x+13,y+4,2,2); g.font='12px "Lilita One"'; g.fillStyle='#fff'; g.textAlign='center'; g.fillText('MEOW',x,y-6); }
        else person(g,x,y+26,1,'#e91e63',t*6); if(i===L.cur&&L.phase==='aim'){ g.strokeStyle='rgba(165,255,138,.9)'; g.setLineDash([6,6]); g.lineWidth=3; g.beginPath(); g.arc(x,y+26,44,0,7); g.stroke(); g.setLineDash([]); } });
      // ladder
      const b=base(); let tip=L.phase==='aim'?L.tip:{x:tgt().x,y:tgt().y+26};
      if(tip){ const len=dist(b.x,b.y,tip.x,tip.y), a=Math.atan2(tip.y-b.y,tip.x-b.x); g.save(); g.translate(b.x,b.y); g.rotate(a); const wob=Math.sin(t*30)*L.wob*4;
        g.strokeStyle='#cfd8dc'; g.lineWidth=5; g.beginPath(); g.moveTo(0,-9+wob); g.lineTo(len,-9+wob); g.moveTo(0,9+wob); g.lineTo(len,9+wob); g.stroke(); g.lineWidth=3; for(let r=14;r<len;r+=34){ g.beginPath(); g.moveTo(r,-9+wob); g.lineTo(r,9+wob); g.stroke(); }
        if(L.phase!=='aim'){ const fr=L.rung/L.rungs; g.translate(fr*len,0); g.rotate(-a); firey(g,0,8,.9); if(L.carry) person(g,14,-10,.8,'#e91e63',0); }
        g.restore(); }
      meter(g,10,E.top+6,120,'Steady',1-L.wob,L.wob>.6?'#ff5252':'#66bb6a'); } }; },

/* EXTRICATE: spreader pump-and-release timing, then cutter timing; patient stability drains */
extricate(E,o,h){ const W=()=>E.W, H=()=>E.H; const T=Math.round(36+(o.tier||1)*6); const gy=()=>H()-E.bot-90;
  const L=E.L={stage:'spread',hinges:2,done:0,gauge:0,pumping:false,jam:0,posts:2,cut:0,blade:0,bdir:1,stab:1,crush:1,leak:o.variant==='tanker'};
  const zone=()=>{ const w=.12*h.window; return [.72-w/2,.72+w/2]; };
  return { T,
    down(){ if(L.jam>0) return; if(L.stage==='spread') L.pumping=true; else if(L.stage==='cut'){ const w=.1*h.window; if(Math.abs(L.blade-.5)<w){ L.cut++; Snd.cut(); E.pop('CUT!',W()/2,gy()-120,'#fff'); E.burst(W()/2,gy()-110,'#ffeb3b',14,180); L.blade=0; if(L.cut>=L.posts){ L.stage='lift'; } }
        else { L.jam=.8; Snd.no(); E.pop('Missed the post',W()/2,gy()-120,'#ffab91'); } } else if(L.stage==='lift'){ L.liftN=(L.liftN||0)+1; Snd.thud(); if(L.liftN>=4) this.win(); } },
    up(){ if(L.stage!=='spread'||!L.pumping) return; L.pumping=false; const [a,b]=zone();
      if(L.gauge>=a&&L.gauge<=b){ L.done++; Snd.pop2(); E.pop('POP!',W()*.32,gy()-60,'#a5ff8a'); E.burst(W()*.32,gy()-60,'#bdbdbd',12); L.crush=Math.max(0,L.crush-.3); if(L.done>=L.hinges) L.stage='cut'; }
      else if(L.gauge<a){ E.pop('More pressure',W()*.32,gy()-60,'#ffe082'); } L.gauge=0; },
    win(){ const st=Math.min(starsByTime(E.t,E.T,.55,.8), L.stab>.5?3:L.stab>.25?2:1); E.score=st; E.end(st,`Driver freed. Patient ${Math.round(L.stab*100)}% stable.`); },
    update(dt){ if(L.jam>0) L.jam-=dt;
      if(L.stage==='spread'&&L.pumping){ L.gauge+=dt*.55; Snd.hydraulic(L.gauge); if(L.gauge>=1){ L.pumping=false; L.gauge=0; L.jam=1.2; Snd.no(); E.pop('Jammed! Too much',W()*.32,gy()-60,'#ff8a80'); } }
      if(L.stage==='cut'){ L.blade+=L.bdir*dt*.9; if(L.blade>1){L.blade=1;L.bdir=-1;} if(L.blade<0){L.blade=0;L.bdir=1;} }
      L.stab=Math.max(0,L.stab-dt*.012*h.stable*(L.leak?1.3:1)); if(L.stab<=0) E.end(0,'We lost the patient. It happens. Debrief and go again.');
      E.obj({spread:`Hold to pump the spreader, release in the GREEN (${L.done}/${L.hinges} hinges)`,cut:`Tap when the cutter lines up with the post (${L.cut}/${L.posts})`,lift:'Tap to lift the dash off the driver!'}[L.stage]); },
    progress(){ return (L.done+L.cut+(L.liftN||0)*.5)/(L.hinges+L.posts+2); }, label(){ return {spread:'Doors',cut:'Roof posts',lift:'Dash lift'}[L.stage]; },
    timeout(){ return 0; },
    draw(g){ sky(g,W(),H(),'#86bde0','#e6f2fb'); ground(g,W(),H(),gy()+20,'#5f6368','#55595e'); g.fillStyle='#fff'; for(let x=0;x<W();x+=60) g.fillRect(x+10,gy()+46,30,5);
      if(L.leak){ g.fillStyle='rgba(120,200,80,.5)'; g.beginPath(); g.ellipse(W()*.75,gy()+30,60,12,0,0,7); g.fill(); }
      const cw=Math.min(300,W()*.78), cx=W()/2-cw/2; car(g,cx,gy()+10,cw,'#c62828',L.crush); person(g,W()/2+6,gy()-28,.9,'#3949ab',0); g.fillStyle='#fff'; g.font='12px "Lilita One"'; g.textAlign='center'; if(L.stab<.4) g.fillText('Hurry...',W()/2+6,gy()-64);
      if(L.stage==='spread'){ // gauge
        const gx=W()*.1, gw=W()*.8, gyy=E.top+34; g.fillStyle='rgba(0,0,0,.5)'; rr(g,gx,gyy,gw,26,13); g.fill(); const [a,b]=zone(); g.fillStyle='#43a047'; g.fillRect(gx+gw*a,gyy+2,gw*(b-a),22); g.fillStyle='#ff5252'; g.fillRect(gx+gw*.95,gyy+2,gw*.05-2,22);
        g.fillStyle='#ffeb3b'; g.fillRect(gx+gw*L.gauge-3,gyy-4,6,34); g.fillStyle='#fff'; g.font='13px "Lilita One"'; g.textAlign='left'; g.fillText('SPREADER PRESSURE',gx+6,gyy-6);
        g.save(); g.translate(W()*.32,gy()-40); g.rotate(-.4); box(g,-8,-50,16,60,'#ffca28'); box(g,-14,-62,10,18,'#9e9e9e',undefined,3); box(g,4,-62,10,18,'#9e9e9e',undefined,3); g.restore(); }
      if(L.stage==='cut'){ const px=W()/2; g.strokeStyle='rgba(255,255,255,.8)'; g.setLineDash([5,5]); g.lineWidth=2; g.beginPath(); g.moveTo(px,gy()-150); g.lineTo(px,gy()-60); g.stroke(); g.setLineDash([]);
        const bx=W()*.15+W()*.7*L.blade; box(g,bx-14,gy()-140,28,40,'#1e88e5'); g.fillStyle='#cfd8dc'; g.beginPath(); g.moveTo(bx-10,gy()-100); g.lineTo(bx,gy()-80); g.lineTo(bx+10,gy()-100); g.fill(); }
      if(L.stage==='lift'){ g.fillStyle='#ffca28'; rr(g,W()/2-60,gy()-80,120,18,8); g.fill(); g.font='16px "Lilita One"'; g.fillStyle='#fff'; g.textAlign='center'; g.fillText(`LIFT ${L.liftN||0}/4`,W()/2,gy()-90); }
      meter(g,10,E.top+70,140,'Patient',L.stab,L.stab>.5?'#66bb6a':'#ff7043'); } }; },

/* HAZMAT: hold to plug leaks; drag booms onto spill edges */
hazmat(E,o,h){ const W=()=>E.W, H=()=>E.H; const T=Math.round(36+(o.tier||1)*6); const cy=()=>E.top+(H()-E.top-E.bot)*.48;
  const L=E.L={leaks:[],spawned:0,total:3+(o.tier||1),next:1,plug:null,edges:[0,0,0,0],boom:[0,0,0,0],spill:.18,drag:null,drain:.92,booms:4};
  const drums=[[-.28,-.08],[-.08,-.16],[.12,-.06],[.3,-.14],[-.18,.08],[.2,.1]];
  const dpos=i=>({x:W()/2+drums[i][0]*W(), y:cy()+drums[i][1]*W()*.9}); const sp=()=>({x:W()/2,y:cy()+20,rx:L.spill*W()*.9,ry:L.spill*W()*.45});
  const epos=i=>{ const s=sp(); return [{x:s.x,y:s.y-s.ry},{x:s.x+s.rx,y:s.y},{x:s.x,y:s.y+s.ry},{x:s.x-s.rx,y:s.y}][i]; };
  const tray=()=>({x:W()-74,y:H()-E.bot-70});
  return { T,
    down(p){ for(const lk of L.leaks){ if(lk.plugged) continue; const q=dpos(lk.d); if(dist(p.x,p.y,q.x,q.y)<36){ L.plug=lk; return; } }
      const tr=tray(); if(L.booms>0&&dist(p.x,p.y,tr.x+30,tr.y+30)<50){ L.drag={x:p.x,y:p.y}; } },
    move(p){ if(L.drag){ L.drag.x=p.x; L.drag.y=p.y; } if(L.plug){ const q=dpos(L.plug.d); if(dist(p.x,p.y,q.x,q.y)>50) L.plug=null; } },
    up(p){ L.plug=null; if(L.drag){ let best=-1,bd=70; for(let i=0;i<4;i++){ if(L.boom[i]) continue; const q=epos(i); const d=dist(p.x,p.y,q.x,q.y); if(d<bd){bd=d;best=i;} }
        if(best>=0){ L.boom[best]=1; L.booms--; Snd.thud(); E.pop('Boom down!',p.x,p.y-20,'#a5ff8a'); } else { E.pop('Drop it on a spill edge',p.x,p.y,'#ffab91'); } L.drag=null; } },
    update(dt){ L.next-=dt; if(L.spawned<L.total&&L.next<=0){ const free=drums.map((_,i)=>i).filter(i=>!L.leaks.some(l=>l.d===i&&!l.plugged)); const d=free[Math.floor(Math.random()*free.length)];
        L.leaks.push({d,p:0,plugged:false,a:rand(0,6.28)}); L.spawned++; L.next=rand(4,7); Snd.hit(0); if(h.hotspots) E.pop('Leak!',dpos(d).x,dpos(d).y-30,'#ffe082'); }
      if(L.plug){ L.plug.p+=dt/.9; Snd.hydraulic(.2); if(L.plug.p>=1){ L.plug.plugged=true; Snd.pop2(); E.pop('PLUGGED',dpos(L.plug.d).x,dpos(L.plug.d).y-30,'#a5ff8a'); L.plug=null; } }
      const open=L.leaks.filter(l=>!l.plugged).length, openEdges=4-L.boom.reduce((a,b)=>a+b,0);
      L.spill=Math.min(L.drain,L.spill+dt*open*.006*(.4+openEdges*.15)*h.slow);
      if(L.spill>=L.drain) E.end(0,'It reached the stormwater drain. The EPA will be ringing...');
      if(L.spawned>=L.total&&!open){ const st=L.spill<.4?3:L.spill<.6?2:1; E.score=st; E.end(st,`All ${L.total} leaks plugged. Spill held at ${Math.round(L.spill/L.drain*100)}% of the drain line.`); }
      E.obj(open?'Hold on a leaking drum to plug it':L.booms&&openEdges?'Drag booms from the tray onto the spill edges':'Watch for new leaks...'); },
    progress(){ return (L.leaks.filter(l=>l.plugged).length)/L.total; }, label(){ return `Leaks plugged ${L.leaks.filter(l=>l.plugged).length}/${L.total}`; },
    timeout(){ return L.spill<L.drain*.8?1:0; },
    draw(g){ g.fillStyle='#8d949b'; g.fillRect(0,0,W(),H()); g.fillStyle='#7c838a'; for(let y=0;y<H();y+=50) g.fillRect(0,y,W(),2);
      const s=sp(); const dr={x:W()/2,y:cy()+20,rx:L.drain*W()*.9,ry:L.drain*W()*.45}; g.strokeStyle='#ffeb3b'; g.setLineDash([8,8]); g.lineWidth=3; g.beginPath(); g.ellipse(dr.x,dr.y,dr.rx,dr.ry,0,0,7); g.stroke(); g.setLineDash([]);
      g.fillStyle='#333'; rr(g,W()/2-24,dr.y+dr.ry-8,48,16,4); g.fill(); g.fillStyle='#ffeb3b'; g.font='11px "Lilita One"'; g.textAlign='center'; g.fillText('DRAIN',W()/2,dr.y+dr.ry+22);
      const gr=g.createRadialGradient(s.x,s.y,4,s.x,s.y,s.rx); gr.addColorStop(0,'rgba(150,230,60,.85)'); gr.addColorStop(1,'rgba(110,190,40,.55)'); g.fillStyle=gr; g.beginPath(); g.ellipse(s.x,s.y,s.rx,s.ry,0,0,7); g.fill();
      for(let i=0;i<4;i++){ const q=epos(i); if(L.boom[i]){ g.fillStyle='#ff9800'; g.save(); g.translate(q.x,q.y); g.rotate(i%2?Math.PI/2:0); rr(g,-36,-7,72,14,7); g.fill(); g.strokeStyle='#5d3a00'; g.lineWidth=2; g.stroke(); g.restore(); } else if(L.drag){ g.strokeStyle='rgba(255,255,255,.8)'; g.lineWidth=2; g.beginPath(); g.arc(q.x,q.y,20,0,7); g.stroke(); } }
      drums.forEach((d,i)=>{ const q=dpos(i); box(g,q.x-20,q.y-30,40,52,'#1565c0'); g.fillStyle='#0d47a1'; g.fillRect(q.x-20,q.y-14,40,4); g.fillRect(q.x-20,q.y+6,40,4); g.fillStyle='#ffeb3b'; g.beginPath(); g.moveTo(q.x,q.y-24); g.lineTo(q.x+8,q.y-10); g.lineTo(q.x-8,q.y-10); g.fill(); });
      for(const lk of L.leaks){ if(lk.plugged) continue; const q=dpos(lk.d); g.strokeStyle='rgba(160,240,70,.95)'; g.lineWidth=4; for(let j=0;j<3;j++){ g.beginPath(); g.moveTo(q.x+12,q.y-4+j*5); g.quadraticCurveTo(q.x+30,q.y+j*6,q.x+40+Math.sin(E.t*20+j)*4,q.y+20+j*4); g.stroke(); }
        g.strokeStyle='#fff'; g.lineWidth=3; g.beginPath(); g.arc(q.x,q.y-4,30,-Math.PI/2,-Math.PI/2+lk.p*6.28); g.stroke(); }
      const tr=tray(); box(g,tr.x,tr.y,62,62,'#4e342e'); g.fillStyle='#ff9800'; for(let i=0;i<Math.min(3,L.booms);i++){ rr(g,tr.x+8,tr.y+10+i*14,46,10,5); g.fill(); } g.fillStyle='#fff'; g.font='12px "Lilita One"'; g.textAlign='center'; g.fillText(`BOOMS ${L.booms}`,tr.x+31,tr.y-6);
      if(L.drag){ g.fillStyle='#ff9800'; rr(g,L.drag.x-36,L.drag.y-7,72,14,7); g.fill(); }
      meter(g,10,E.top+6,140,'Spill vs drain',L.spill/L.drain,L.spill/L.drain>.7?'#ff5252':'#9ccc65'); } }; },

/* GAS: sweep a detector to find hidden leaks (beeps faster when close), hold to shut them */
gas(E,o,h){ const W=()=>E.W, H=()=>E.H; const n=(o.tier||1)>=2?2:1; const T=Math.round(30+n*14);
  const L=E.L={leaks:[],cur:0,det:null,hold:0,risk:0,beepT:0,found:0};
  const area=()=>({x:20,y:E.top+60,w:W()-40,h:H()-E.top-E.bot-90});
  for(let i=0;i<n;i++) L.leaks.push({fx:rand(.15,.85),fy:rand(.2,.85),done:false});
  const lp=lk=>{ const a=area(); return {x:a.x+lk.fx*a.w,y:a.y+lk.fy*a.h}; };
  const reading=()=>{ if(!L.det) return 0; const lk=L.leaks.find(l=>!l.done); if(!lk) return 0; const q=lp(lk); const d=dist(L.det.x,L.det.y,q.x,q.y); return clamp(1-d/(260*h.search),0,1); };
  return { T,
    down(p){ L.det={x:p.x,y:p.y}; }, move(p){ L.det={x:p.x,y:p.y}; }, up(){ L.hold=0; },
    update(dt){ const r=reading(); L.beepT-=dt; if(L.det&&L.beepT<=0){ Snd.gasBeep(); L.beepT=.9-r*.8; }
      const lk=L.leaks.find(l=>!l.done); L.risk=clamp(L.risk+dt*.012*(1+(o.tier||1)*.2),0,1); if(L.risk>=1) E.end(0,'Too much gas built up. Everyone out! Evacuated safely, but the job is lost.');
      if(lk&&E.ptr.down&&L.det){ const q=lp(lk); if(dist(L.det.x,L.det.y,q.x,q.y)<34*h.search){ L.hold+=dt; Snd.hydraulic(.1); if(L.hold>=1){ lk.done=true; L.found++; L.hold=0; L.risk=Math.max(0,L.risk-.25); Snd.pop2(); E.pop('Valve shut!',q.x,q.y-20,'#a5ff8a'); } } else L.hold=0; }
      if(L.leaks.every(l=>l.done)){ const st=Math.min(starsByTime(E.t,E.T,.5,.8),L.risk<.5?3:2); E.score=st; E.end(st,`${n} leak${n>1?'s':''} found and shut off.`); }
      E.obj(r>.8?'Right here! Hold to shut it off':'Drag the detector around. Faster beeps = closer'); },
    progress(){ return L.found/n; }, label(){ return `Leaks shut ${L.found}/${n}`; }, timeout(){ return L.found?1:0; },
    draw(g){ g.fillStyle='#d8c8a8'; g.fillRect(0,0,W(),H()); const a=area(); g.fillStyle='#bfae8c'; for(let y=a.y;y<a.y+a.h;y+=40) for(let x=a.x;x<a.x+a.w;x+=40) if(((x+y)/40)%2<1) g.fillRect(x,y,40,40);
      [[.1,.08],[.6,.12],[.15,.62],[.65,.6]].forEach(([fx,fy],i)=>{ box(g,a.x+fx*a.w,a.y+fy*a.h,a.w*.25,a.h*.18,['#ffccbc','#c5e1a5','#b3e5fc','#fff59d'][i]); g.fillStyle='#5d4037'; g.font='12px "Lilita One"'; g.textAlign='center'; g.fillText(['CAFE','BAKERY','NEWSAGENT','PIZZA'][i],a.x+fx*a.w+a.w*.125,a.y+fy*a.h+a.h*.1); });
      const r=reading(); if(h.hotspots&&L.det){ const lk=L.leaks.find(l=>!l.done); if(lk){ const q=lp(lk); g.fillStyle=`rgba(180,255,120,${.08+.15*r})`; g.beginPath(); g.arc(q.x,q.y,70,0,7); g.fill(); } }
      if(L.det){ const d=L.det; g.save(); g.translate(d.x,d.y-40); box(g,-22,-26,44,52,'#ffca28'); g.fillStyle='#263238'; rr(g,-16,-20,32,18,4); g.fill(); g.fillStyle=r>.7?'#ff5252':r>.35?'#ffeb3b':'#76ff03'; g.font='12px monospace'; g.textAlign='center'; g.fillText(Math.round(r*999)+'ppm',0,-7);
        g.fillStyle=r>.8&&Math.sin(E.t*30)>0?'#ff1744':'#555'; g.beginPath(); g.arc(0,12,6,0,7); g.fill(); g.restore(); if(L.hold>0){ g.strokeStyle='#fff'; g.lineWidth=4; g.beginPath(); g.arc(d.x,d.y,30,-1.57,-1.57+L.hold*6.28); g.stroke(); } }
      L.leaks.filter(l=>l.done).forEach(l=>{ const q=lp(l); g.fillStyle='#43a047'; g.beginPath(); g.arc(q.x,q.y,10,0,7); g.fill(); });
      meter(g,10,E.top+6,150,'Ignition risk',L.risk,L.risk>.7?'#ff5252':'#ffb74d'); } }; },

/* CPR: tap on the beat, hold for breaths */
cpr(E,o,h){ const W=()=>E.W, H=()=>E.H; const cycles=2, per=20; const T=Math.round(cycles*(per*.55+5)+10);
  const L=E.L={beat:.55, ph:0, n:0, cyc:0, mode:'comp', good:0, perfect:0, miss:0, rec:0, hold:0, breaths:0, tapped:false};
  const win=()=>.13*h.window;
  return { T,
    down(){ if(L.mode==='comp'){ const d=Math.min(L.ph,L.beat-L.ph); if(L.tapped){ return; } L.tapped=true;
        if(d<win()*.45){ L.perfect++; L.rec+=.022; Snd.hit(2); E.pop('PERFECT',W()/2,H()*.42,'#ffe082'); } else if(d<win()){ L.good++; L.rec+=.014; Snd.hit(1); E.pop('GOOD',W()/2,H()*.42,'#fff'); } else { L.miss++; Snd.hit(0); E.pop('off beat',W()/2,H()*.42,'#ff8a80'); } } },
    update(dt){ if(L.mode==='comp'){ L.ph+=dt; if(L.ph>=L.beat){ L.ph-=L.beat; if(!L.tapped&&L.n>0){ L.miss++; } L.tapped=false; L.n++; Snd.beep(false);
          if(L.n>per){ L.mode='breath'; L.breaths=0; L.hold=0; Snd.swish(); } } }
      else { if(E.ptr.down){ L.hold+=dt; if(L.hold>=.9){ L.breaths++; L.hold=0; L.rec+=.04; Snd.swish(); E.pop('Breath '+L.breaths,W()/2,H()*.42,'#b3e5fc'); E.ptr.down=false; if(L.breaths>=2){ L.cyc++; L.n=0; L.ph=0; L.mode='comp'; if(L.cyc>=cycles) this.fin(); } } } else L.hold=Math.max(0,L.hold-dt); }
      E.obj(L.mode==='comp'?`Tap on the beat: ${Math.min(L.n,per)}/${per} compressions (cycle ${L.cyc+1}/${cycles})`:'Hold to give a breath (2 breaths)'); },
    fin(){ const acc=(L.perfect+L.good*.7)/Math.max(1,L.perfect+L.good+L.miss); const st=acc>.8?3:acc>.6?2:acc>.35?1:0; E.score=st; E.end(st,`Accuracy ${Math.round(acc*100)}%. ${st?'Pulse is back. Handed over to the ambos.':'No luck this time.'}`); },
    progress(){ return (L.cyc*(per+2)+(L.mode==='comp'?Math.min(L.n,per):per+L.breaths))/(cycles*(per+2)); }, label(){ return `Perfect ${L.perfect} · Good ${L.good} · Miss ${L.miss}`; },
    timeout(){ return 0; },
    draw(g){ sky(g,W(),H(),'#7fbf6a','#a9d68f'); g.fillStyle='#5b9a4a'; g.fillRect(0,H()*.62,W(),H());
      const cx=W()/2, cy=H()*.6; g.fillStyle='#3949ab'; rr(g,cx-90,cy-20,180,44,20); g.fill(); g.fillStyle='#f2c9a0'; g.beginPath(); g.arc(cx-110,cy,22,0,7); g.fill(); g.strokeStyle='#2a1d10'; g.lineWidth=2; g.stroke();
      g.fillStyle='#222'; g.fillRect(cx+90,cy-12,50,10); g.fillRect(cx+90,cy+6,50,10); firey(g,cx+10,cy-26,1.2);
      // beat ring
      if(L.mode==='comp'){ const f=L.ph/L.beat; const r=40+70*(1-f); g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=5; g.beginPath(); g.arc(cx,H()*.36,r,0,7); g.stroke();
        g.strokeStyle='#ff5252'; g.lineWidth=7; g.beginPath(); g.arc(cx,H()*.36,40+70*win()/L.beat,0,7); g.stroke(); g.fillStyle='#ff5252'; g.beginPath(); g.arc(cx,H()*.36,34,0,7); g.fill(); g.fillStyle='#fff'; g.font='26px "Lilita One"'; g.textAlign='center'; g.fillText('❤',cx,H()*.36+9); }
      else { g.fillStyle='rgba(255,255,255,.9)'; g.beginPath(); g.arc(cx,H()*.36,50,0,7); g.fill(); g.strokeStyle='#29b6f6'; g.lineWidth=8; g.beginPath(); g.arc(cx,H()*.36,50,-1.57,-1.57+L.hold/.9*6.28); g.stroke(); g.fillStyle='#0277bd'; g.font='18px "Lilita One"'; g.textAlign='center'; g.fillText('HOLD',cx,H()*.36+6); }
      meter(g,10,E.top+6,150,'Patient recovery',L.rec,'#66bb6a'); } }; },

/* FIREBREAK: fire spreads across a grass grid with the wind; drag to rake breaks, tap to wet flames, save the houses */
firebreak(E,o,h){ const W=()=>E.W, H=()=>E.H; const T=Math.round(40+(o.tier||1)*5); const C=10, R=13;
  const G=E.L={cells:[],houses:4,lost:0,stam:1,water:Math.round(6*h.water),wind:rand(-.6,.6),spreadT:0,last:null};
  const area=()=>{ const top=E.top+40, bot=H()-E.bot-70; return {x:8,y:top,w:W()-16,h:bot-top}; };
  const cw=()=>area().w/C, ch=()=>area().h/R;
  for(let r=0;r<R;r++) for(let c=0;c<C;c++) G.cells.push({r,c,s:'grass',b:0});   // grass | break | fire | burnt | wet
  const cell=(c,r)=>(c<0||r<0||c>=C||r>=R)?null:G.cells[r*C+c];
  for(let c=0;c<C;c++) if(Math.random()<.5||c===4) cell(c,0).s='fire';
  const at=p=>{ const a=area(); const c=Math.floor((p.x-a.x)/cw()), r=Math.floor((p.y-a.y)/ch()); return cell(c,r); };
  const rake=p=>{ const k=at(p); if(!k) return; if(k.s==='fire'){ if(G.water>0){ k.s='wet'; G.water--; Snd.splash(); E.pop('Wet!',p.x,p.y,'#b3e5fc'); } else { Snd.no(); } return; }
    if(k.s==='grass'&&G.stam>.04){ k.s='break'; G.stam-=.045/h.tap; Snd.rake(); } };
  const houseX=i=>{ const a=area(); return a.x+(i+.5)*a.w/G.houses; };
  const hs=Array.from({length:G.houses},()=>({lost:false}));
  return { T,
    down(p){ rake(p); G.last=p; }, move(p){ if(G.last&&dist(p.x,p.y,G.last.x,G.last.y)>cw()*.5){ rake(p); G.last=p; } }, up(){ G.last=null; },
    update(dt){ if(h.heli&&!G.heli&&E.t>5) G.heli={t:0}; if(G.heli&&G.heli.t<3.2){ G.heli.t+=dt; E.heliK=G.heli.t/3.2; if(!G.heli.drop&&G.heli.t>1.5){ G.heli.drop=true; let n=0; G.cells.forEach(k=>{ if(k.s==='fire'&&k.c>=3&&k.c<=6){ k.s='wet'; n++; } }); E.pop(n?'WATER BOMBER!':'Bomber standing by',W()/2,E.top+150,'#b3e5fc'); Snd.splash(); } }
      G.stam=Math.min(1,G.stam+dt*.12); G.spreadT-=dt; if(Math.random()<dt*.15) G.wind=clamp(G.wind+rand(-.5,.5),-.9,.9);
      if(G.spreadT<=0){ G.spreadT=.9/(1+(o.tier||1)*.12)*h.power; const fires=G.cells.filter(k=>k.s==='fire'); Snd.crackle();
        for(const f of fires){ f.b+=1; for(const [dc,dr,w] of [[0,1,.55],[1,0,.22+G.wind*.3],[-1,0,.22-G.wind*.3],[0,-1,.08],[1,1,.12+G.wind*.15],[-1,1,.12-G.wind*.15]]){ const n=cell(f.c+dc,f.r+dr); if(n&&n.s==='grass'&&Math.random()<w) n.s='fire'; }
          if(f.b>=4) f.s='burnt'; }
        // houses sit under the bottom row
        for(let i=0;i<G.houses;i++){ if(hs[i].lost) continue; const c0=Math.floor(i*C/G.houses), c1=Math.floor((i+1)*C/G.houses); for(let c=c0;c<c1;c++) if(cell(c,R-1).s==='fire'){ hs[i].lost=true; G.lost++; Snd.thud(); E.pop('House lost!',houseX(i),H()-E.bot-50,'#ff8a80'); break; } } }
      const burning=G.cells.some(k=>k.s==='fire'); const saved=G.houses-G.lost;
      if(!burning){ const st=saved===G.houses?3:saved>=G.houses-1?2:saved>=2?1:0; E.score=st; E.end(st,`Fire contained. ${saved}/${G.houses} houses saved.`); }
      if(G.lost>=G.houses) E.end(0,'The fire got into every street. Everyone evacuated safely.');
      E.obj(`Drag to rake firebreaks · tap flames to wet them (${G.water} loads left)`); },
    progress(){ return 1-G.cells.filter(k=>k.s==='fire').length/12; }, label(){ return `Houses safe ${G.houses-G.lost}/${G.houses}`; },
    timeout(){ const saved=G.houses-G.lost; return saved>=3?2:saved>=2?1:0; },
    draw(g){ g.fillStyle='#d9c27a'; g.fillRect(0,0,W(),H()); const a=area(), w=cw(), hh=ch();
      for(const k of G.cells){ const x=a.x+k.c*w, y=a.y+k.r*hh; g.fillStyle={grass:(k.r+k.c)%2?'#c9b85a':'#bfae52',break:'#8d6e4f',fire:'#6d4c2f',burnt:'#3e3a36',wet:'#5d6b52'}[k.s]; g.fillRect(x,y,w+1,hh+1);
        if(k.s==='grass'){ g.strokeStyle='#a89a44'; g.lineWidth=1.5; g.beginPath(); g.moveTo(x+w*.3,y+hh*.8); g.lineTo(x+w*.35,y+hh*.4); g.moveTo(x+w*.7,y+hh*.8); g.lineTo(x+w*.62,y+hh*.35); g.stroke(); }
        if(k.s==='break'){ g.strokeStyle='#6d5038'; g.lineWidth=2; g.beginPath(); g.moveTo(x+3,y+hh*.5); g.lineTo(x+w-3,y+hh*.5); g.stroke(); }
        if(k.s==='fire') flame(g,x+w/2,y+hh*.9,Math.min(w,hh)*.42,E.t+k.c); }
      for(let i=0;i<G.houses;i++){ const x=houseX(i)-26, y=H()-E.bot-58; if(hs[i].lost){ g.fillStyle='#3e3a36'; g.fillRect(x,y+10,52,30); smoke(g,x+26,y-((E.t*30)%30),12,.4); } else house(g,x,y+8,52,32,'#f1d9b5',['#c0392b','#2e86de','#27ae60','#8e44ad'][i]); }
      meter(g,10,E.top+6,120,'Rake stamina',G.stam,'#ffb74d'); g.fillStyle='#fff'; g.font='13px "Lilita One"'; g.textAlign='right'; g.fillText(`WIND ${G.wind>.15?'→':G.wind<-.15?'←':'↓'}`,W()-12,E.top+19); } }; },

/* SANDBAG: river rises; drag bags onto low levee segments */
sandbag(E,o,h){ const W=()=>E.W, H=()=>E.H; const T=40; const N=7;
  const L=E.L={seg:Array.from({length:N},()=>rand(.35,.7)),level:.12,flood:0,drag:null,pile:6,refill:0,rate:1.6/h.flood};
  const lx=i=>W()*(.06+i*.88/N), segW=()=>W()*.88/N, base=()=>H()-E.bot-120, top=()=>E.top+90, segY=hgt=>base()-(base()-top())*hgt;
  const pile=()=>({x:W()-80,y:H()-E.bot-60});
  return { T,
    down(p){ const pl=pile(); if(L.pile>0&&dist(p.x,p.y,pl.x+30,pl.y+20)<60){ L.drag={x:p.x,y:p.y}; L.pile--; Snd.tap(); } },
    move(p){ if(L.drag){ L.drag.x=p.x; L.drag.y=p.y; } },
    up(p){ if(!L.drag) return; const i=Math.floor((p.x-W()*.06)/segW()); if(i>=0&&i<N&&Math.abs(p.y-segY(L.seg[i]))<70){ L.seg[i]=Math.min(1,L.seg[i]+.11); Snd.thud(); E.burst(p.x,segY(L.seg[i]),'#c8a26a',8); } else { L.pile++; } L.drag=null; },
    update(dt){ L.level=Math.min(.95,L.level+dt*(.8/T)*(o.tier>=3?1.15:1)); L.refill+=dt; if(L.refill>=L.rate){ L.refill=0; L.pile=Math.min(8,L.pile+1); }
      let over=0; L.seg.forEach(s=>{ if(L.level>s) over+=L.level-s; }); L.flood=clamp(L.flood+over*dt*.45,0,1); if(over>0&&Math.random()<dt*3) Snd.splash();
      if(L.flood>=1) E.end(0,'The levee was overtopped. Houses flooded, but everyone got out.');
      E.obj(over>0?'Water is spilling! Bag the low spot':'Drag sandbags from the pile onto the lowest part of the levee'); },
    progress(){ return E.t/E.T; }, label(){ return `Flooding ${Math.round(L.flood*100)}%`; },
    timeout(){ const st=L.flood<.15?3:L.flood<.45?2:1; E.score=st; return st; },
    draw(g){ sky(g,W(),H(),'#5f7282','#9fb0bd'); const wl=segY(L.level);
      g.fillStyle='#5d4037'; g.fillRect(0,base(),W(),H()); g.fillStyle='#4f7d9a'; g.fillRect(0,wl,W(),base()-wl+4); g.fillStyle='rgba(255,255,255,.25)'; for(let x=0;x<W();x+=36) g.fillRect((x+E.t*40)%W(),wl+4+Math.sin(x+E.t*3)*3,22,3);
      L.seg.forEach((s,i)=>{ const x=lx(i), y=segY(s); g.fillStyle=L.level>s?'#8d6e63':'#a1887f'; g.fillRect(x+1,y,segW()-2,base()-y);
        g.fillStyle='#c8a26a'; for(let yy=y;yy<base();yy+=12) for(let xx=x+2;xx<x+segW()-6;xx+=18) { rr(g,xx+((yy/12)%2)*6,yy,16,10,4); g.fill(); }
        if(L.level>s){ g.fillStyle='rgba(79,125,154,.85)'; g.fillRect(x+1,y-4,segW()-2,8); for(let j=0;j<3;j++){ g.fillRect(x+segW()*(.2+j*.3),y,4,base()-y+20); } } });
      g.fillStyle='#e9e1d0'; for(let i=0;i<3;i++) house(g,W()*(.12+i*.3),H()-E.bot-34,60,28,'#f1d9b5','#7b8d99');
      const pl=pile(); for(let i=0;i<Math.min(L.pile,6);i++){ g.fillStyle='#c8a26a'; rr(g,pl.x+(i%3)*20,pl.y+10-Math.floor(i/3)*12,22,12,5); g.fill(); g.strokeStyle='#7a5a2a'; g.lineWidth=1.5; g.stroke(); }
      g.fillStyle='#fff'; g.font='12px "Lilita One"'; g.textAlign='center'; g.fillText(`BAGS ${L.pile}`,pl.x+30,pl.y-12);
      if(L.drag){ g.fillStyle='#c8a26a'; rr(g,L.drag.x-14,L.drag.y-8,28,16,6); g.fill(); }
      meter(g,10,E.top+6,150,'Flooding',L.flood,L.flood>.5?'#ff5252':'#4fc3f7'); } }; },

/* CHAINSAW: hold on each cut mark; release before the saw binds */
chainsaw(E,o,h){ const W=()=>E.W, H=()=>E.H; const T=32; const L=E.L={cuts:[0,0,0],cur:0,bind:0,stuck:0,cutting:false,off:[0,0,0,0]};
  const ly=()=>H()*.55, cx=i=>W()*(.25+i*.25);
  return { T,
    down(p){ if(L.stuck>0){ Snd.no(); return; } if(Math.abs(p.x-cx(L.cur))<46&&Math.abs(p.y-ly())<70) L.cutting=true; else E.pop('Cut on the mark',p.x,p.y,'#ffe082'); },
    up(){ L.cutting=false; },
    update(dt){ if(L.stuck>0){ L.stuck-=dt; Snd.saw(0); } else if(L.cutting&&E.ptr.down){ L.cuts[L.cur]+=dt*.45*h.tap; L.bind+=dt*(.55-.1*(h.tap-1)); Snd.saw(L.bind>.7?2:1); if(Math.random()<dt*20) E.burst(cx(L.cur),ly()+10,'#d7b48a',2,90);
        if(L.bind>=1){ L.stuck=1.1; L.bind=.6; L.cutting=false; Snd.saw(0); Snd.no(); E.pop('Saw bound up! Let it go',W()/2,ly()-70,'#ff8a80'); }
        if(L.cuts[L.cur]>=1){ L.cuts[L.cur]=1; L.cutting=false; Snd.saw(0); Snd.thud(); E.pop('CUT!',cx(L.cur),ly()-50,'#a5ff8a'); L.cur++; if(L.cur>=3){ const st=starsByTime(E.t,E.T,.45,.75); E.score=st; E.end(st,'Road cleared. Traffic is moving again.'); } } }
      else { L.bind=Math.max(0,L.bind-dt*.9); Snd.saw(0); }
      for(let i=0;i<4;i++) if(i<=L.cur&&i>0) L.off[i]=Math.min(1,L.off[i]+dt*1.5);
      E.obj(L.stuck>0?'Wait for the saw to free up...':'Hold on the glowing mark to saw. Let go when the bar goes red'); },
    progress(){ return (L.cuts.reduce((a,b)=>a+b,0))/3; }, label(){ return `Cuts ${L.cur}/3`; }, timeout(){ return L.cur>=2?1:0; },
    draw(g){ sky(g,W(),H(),'#62707d','#a5b3bf'); ground(g,W(),H(),ly()+40,'#5f6368','#55595e'); g.fillStyle='#fff'; for(let x=0;x<W();x+=60) g.fillRect(x+10,ly()+80,30,5);
      car(g,W()*.6,ly()+60,W()*.36,'#1e88e5',.2);
      for(let i=0;i<4;i++){ const x0=i===0?-20:cx(i-1), x1=i===3?W()+20:cx(i); const dy=L.off[i]*60, dx=L.off[i]*(i%2?20:-20); g.fillStyle='#8d5a3b'; rr(g,x0+dx,ly()-26+dy,x1-x0-2,52,18); g.fill(); g.strokeStyle='#4e2f1a'; g.lineWidth=3; g.stroke();
        g.strokeStyle='#a87650'; g.lineWidth=2; for(let k=0;k<3;k++){ g.beginPath(); g.moveTo(x0+dx+8,ly()-14+k*12+dy); g.lineTo(x1-10+dx,ly()-12+k*12+dy); g.stroke(); } }
      g.fillStyle='#2e7d32'; g.beginPath(); g.arc(W()+10,ly()-40,70,0,7); g.fill();
      if(L.cur<3){ const x=cx(L.cur); g.strokeStyle=`rgba(255,235,59,${.6+.4*Math.sin(E.t*8)})`; g.lineWidth=4; g.setLineDash([6,5]); g.beginPath(); g.moveTo(x,ly()-36); g.lineTo(x,ly()+36); g.stroke(); g.setLineDash([]);
        g.fillStyle='#fff'; g.font='12px "Lilita One"'; g.textAlign='center'; g.fillText(`${Math.round(L.cuts[L.cur]*100)}%`,x,ly()-44);
        if(L.cutting){ g.save(); g.translate(x+20,ly()-60); box(g,-10,-14,44,26,'#ff6f00'); g.fillStyle='#cfd8dc'; g.fillRect(-30,8,40,8); g.restore(); } }
      meter(g,10,E.top+6,140,L.stuck>0?'BOUND UP':'Saw strain',L.bind,L.bind>.7?'#ff5252':'#ffb74d'); } }; },

/* RUBBLE: tap blocks to clear, avoid cracked posts, sniffer marks show where people are */
rubble(E,o,h){ const W=()=>E.W, H=()=>E.H; const T=45; const C=5, R=5; const L=E.L={b:[],people:[],found:0,penalty:0};
  const area=()=>({x:W()*.08,y:E.top+70,w:W()*.84,h:H()-E.top-E.bot-130}); const bw=()=>area().w/C, bh=()=>area().h/R;
  for(let r=0;r<R;r++) for(let c=0;c<C;c++) L.b.push({c,r,hp:Math.random()<.3?3:1,post:false,gone:false});
  for(let i=0;i<3;i++){ const k=L.b[Math.floor(rand(0,L.b.length))]; k.post=true; k.hp=99; }
  const spots=L.b.filter(k=>!k.post&&k.r>=2); for(let i=0;i<Math.min(2+((o.tier||1)>2?1:0),spots.length);i++){ const k=spots.splice(Math.floor(rand(0,spots.length)),1)[0]; L.people.push({c:k.c,r:k.r,out:false}); }
  const blk=(c,r)=>L.b.find(k=>k.c===c&&k.r===r);
  const covered=pe=>{ for(let r=0;r<=pe.r;r++){ const k=blk(pe.c,r); if(k&&!k.gone&&!k.post) return true; } return false; };
  return { T,
    down(p){ const a=area(); const c=Math.floor((p.x-a.x)/bw()), r=Math.floor((p.y-a.y)/bh());
      const pe=L.people.find(q=>!q.out&&q.c===c&&q.r===r); const k=blk(c,r);
      if(pe&&(!k||k.gone)&&!covered(pe)){ pe.out=true; L.found++; Snd.cheer(1,.6); E.pop('FOUND!',p.x,p.y-20,'#a5ff8a'); E.burst(p.x,p.y,'#fff',12); if(L.found>=L.people.length){ const st=Math.max(1,starsByTime(E.t+L.penalty,E.T,.5,.78)); E.score=st; E.end(st,`Everyone found alive. ${L.penalty?`(${L.penalty}s lost to shifting rubble)`:''}`); } return; }
      if(!k||k.gone) return; if(k.post){ L.penalty+=4; Snd.creak(); Snd.thud(); E.pop('Careful! It shifted (+4s)',p.x,p.y,'#ff8a80'); E.t+=4; for(const q of L.b) if(q.gone&&!q.post&&Math.abs(q.c-k.c)<=1&&q.r>k.r&&Math.random()<.5){ q.gone=false; q.hp=1; } return; }
      k.hp-=1*(h.power>1.3?1.5:1); Snd.thud(); E.burst(p.x,p.y,'#9e9e9e',6); if(k.hp<=0){ k.gone=true; } },
    update(){ E.obj(L.found<L.people.length?'Tap rubble to lift it. Avoid cracked posts. Dog marks = people below':''); },
    progress(){ return L.found/L.people.length; }, label(){ return `Found ${L.found}/${L.people.length}`; }, timeout(){ return L.found?1:0; },
    draw(g){ sky(g,W(),H(),'#9e9e9e','#d6d6d6'); ground(g,W(),H(),H()-E.bot-50,'#8d8273','#7c7264'); const a=area();
      for(const pe of L.people){ if(pe.out) continue; const x=a.x+pe.c*bw()+bw()/2, y=a.y+pe.r*bh()+bh()*.75; person(g,x,y,.8,'#e91e63',E.t*5);
        const sig=h.search>1.15?.85:.3; g.fillStyle=`rgba(255,82,82,${sig*(.6+.4*Math.sin(E.t*5))})`; g.beginPath(); g.arc(x,a.y-14,7,0,7); g.fill(); g.font='12px "Lilita One"'; g.textAlign='center'; g.fillStyle=`rgba(255,255,255,${sig})`; g.fillText('🐕',x,a.y-26); }
      for(const k of L.b){ if(k.gone) continue; const x=a.x+k.c*bw(), y=a.y+k.r*bh();
        if(k.post){ box(g,x+bw()*.35,y,bw()*.3,bh(),'#bcaaa4','#5d4037',3); g.strokeStyle='#d32f2f'; g.lineWidth=2; g.beginPath(); g.moveTo(x+bw()*.4,y+8); g.lineTo(x+bw()*.55,y+bh()*.4); g.lineTo(x+bw()*.45,y+bh()*.7); g.stroke(); }
        else { box(g,x+2,y+2,bw()-4,bh()-4,k.hp>1?'#8d8d8d':'#b0a497','#4e4e4e',5); if(k.hp>1){ g.fillStyle='#fff'; g.font='12px "Lilita One"'; g.textAlign='center'; g.fillText('×'+Math.ceil(k.hp),x+bw()/2,y+bh()/2+4); } } } } }; },

/* TARP: drag tarps onto roof holes before the rain does damage */
tarp(E,o,h){ const W=()=>E.W, H=()=>E.H; const T=36; const L=E.L={holes:[],next:.5,dmg:0,drag:null,stack:5,refill:0,made:0,max:6+(o.tier||1)};
  const roofY=()=>H()*.42; const houses=3; const hx=i=>W()*(.06+i*.31), hw=()=>W()*.27;
  const stack=()=>({x:W()/2-36,y:H()-E.bot-62});
  return { T,
    down(p){ const s=stack(); if(L.stack>0&&dist(p.x,p.y,s.x+36,s.y+20)<60){ L.drag={x:p.x,y:p.y}; L.stack--; Snd.swish(); } },
    move(p){ if(L.drag){ L.drag.x=p.x; L.drag.y=p.y; } },
    up(p){ if(!L.drag) return; const hit=L.holes.find(q=>!q.cov&&dist(p.x,p.y,q.x,q.y)<44); if(hit){ hit.cov=true; Snd.thud(); E.pop('Covered!',hit.x,hit.y-24,'#a5ff8a'); } else L.stack++; L.drag=null; },
    update(dt){ L.next-=dt; L.refill+=dt; if(L.refill>2.4){ L.refill=0; L.stack=Math.min(6,L.stack+1); }
      if(L.made<L.max&&L.next<=0){ const i=Math.floor(rand(0,houses)); L.holes.push({x:hx(i)+rand(.2,.8)*hw(),y:roofY()+rand(-.25,.05)*hw(),cov:false}); L.made++; L.next=rand(2.5,4.5); Snd.crackle(); Snd.thud(); }
      const open=L.holes.filter(q=>!q.cov).length; L.dmg=clamp(L.dmg+dt*open*.018,0,1); if(L.dmg>=1) E.end(0,'Too much water got in. Ceilings came down, but nobody was hurt.');
      if(L.made>=L.max&&!open){ const st=L.dmg<.2?3:L.dmg<.45?2:1; E.score=st; E.end(st,`All ${L.max} holes tarped. Damage ${Math.round(L.dmg*100)}%.`); }
      E.obj(open?'Drag a tarp from the pile onto each hole':'Watch for more damage...'); },
    progress(){ return L.holes.filter(q=>q.cov).length/L.max; }, label(){ return `Tarped ${L.holes.filter(q=>q.cov).length}/${L.max}`; },
    timeout(){ return L.dmg<.5?1:0; },
    draw(g){ sky(g,W(),H(),'#4f5b66','#8796a3'); ground(g,W(),H(),roofY()+hw()*.7,'#6c8a5c','#5f7d50');
      for(let i=0;i<houses;i++) house(g,hx(i),roofY()+6,hw(),hw()*.62,'#efe2c9',['#b5651d','#7b8d99','#8e5a5a'][i]);
      for(const q of L.holes){ if(q.cov){ g.fillStyle='#1e88e5'; g.save(); g.translate(q.x,q.y); g.rotate(-.2); rr(g,-26,-18,52,36,4); g.fill(); g.strokeStyle='#0d47a1'; g.lineWidth=2; g.stroke(); g.restore(); }
        else { g.fillStyle='#2b2b2b'; g.beginPath(); g.ellipse(q.x,q.y,16,10,0,0,7); g.fill(); g.fillStyle='rgba(120,170,220,.8)'; for(let j=0;j<3;j++) g.fillRect(q.x-6+j*6,q.y+8+((E.t*90+j*20)%40),2,8); } }
      const s=stack(); for(let i=0;i<Math.min(L.stack,5);i++){ g.fillStyle='#1e88e5'; rr(g,s.x,s.y+20-i*6,72,14,4); g.fill(); g.strokeStyle='#0d47a1'; g.stroke(); }
      g.fillStyle='#fff'; g.font='12px "Lilita One"'; g.textAlign='center'; g.fillText(`TARPS ${L.stack}`,s.x+36,s.y-4);
      if(L.drag){ g.fillStyle='#1e88e5'; rr(g,L.drag.x-26,L.drag.y-18,52,36,4); g.fill(); }
      meter(g,10,E.top+6,140,'Water damage',L.dmg,L.dmg>.5?'#ff5252':'#4fc3f7'); } }; },
};
