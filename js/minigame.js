// Competition mini-games, drawn on a 2D canvas. Crew stats (norm 0..1) make the player more effective.
import { Snd } from './audio.js';
const COLORS=['#e53935','#1e88e5','#43a047','#8e24aa'];
export function runMinigame(root, comp, { norm, rivals, you='You' }, onDone){
  root.innerHTML=`<div class="mg-top"><div class="mg-title">${comp.icon} ${comp.name}</div><div class="mg-how">${comp.how}</div></div>
    <canvas class="mg-cv"></canvas><div class="mg-count"></div>
    ${comp.game==='rhythm'?'<div class="mg-lr"><div class="mg-l">LEFT</div><div class="mg-r">RIGHT</div></div>':''}
    <div class="mg-tapzone"></div>`;
  root.classList.add('on');
  const cv=root.querySelector('.mg-cv'), g=cv.getContext('2d'), countEl=root.querySelector('.mg-count'), zone=root.querySelector('.mg-tapzone');
  const dpr=Math.min(2,window.devicePixelRatio||1); let W=0,H=0;
  function size(){ const r=cv.getBoundingClientRect(); W=r.width; H=r.height; cv.width=W*dpr; cv.height=H*dpr; g.setTransform(dpr,0,0,dpr,0,0); } size();
  const mul=.75+.5*norm;
  const lanes=[{name:you,you:true,col:'#ffca28',p:0,done:null},...rivals.map((r,i)=>({name:r.name,r:r.rating,col:COLORS[i+1],p:0,done:null,jit:.92+Math.random()*.16}))];
  let state='count', t=0, cd=3.2, last=performance.now(), raf=0, flash=[], ended=false;
  // game-specific
  const G={ mash:{goal:100}, timing:{goal:12, x:0, dir:1, zc:.5, zw:.16+.16*norm, lock:0, sp:1.5}, rhythm:{goal:30,lastSide:null,stun:0}, catch:{n:10, i:0, x:0, T:1.05, pts:0, tapped:false, res:[]} }[comp.game];
  if(comp.game==='timing') G.zc=.25+Math.random()*.5;
  const aiRate = r => ({ mash:(9+9*r), timing:12/(12*(.42+(1-r)*.5)), rhythm:(3+3*r) })[comp.game];
  function input(e){ e.preventDefault(); if(state!=='go') return; const me=lanes[0];
    if(comp.game==='mash'){ me.p+=2.4*mul; Snd.step(); burst(W/2, H*.7,'#ffffff',3); }
    else if(comp.game==='timing'){ if(G.lock>0) return; const d=Math.abs(G.x-G.zc);
      if(d<=G.zw/2){ me.p+=1; const perfect=d<G.zw/6; Snd.hit(perfect?2:1); pop(perfect?'PERFECT!':'NICE!', perfect?'#ffd54f':'#ffffff'); G.zc=.2+Math.random()*.6; G.sp=1.5+me.p*.06; }
      else { Snd.hit(0); pop('SLIP!','#ff8a80'); G.lock=.5; } }
    else if(comp.game==='rhythm'){ if(G.stun>0) return; const r=root.getBoundingClientRect(); const side=(e.clientX-r.left)<r.width/2?'L':'R';
      root.querySelector(side==='L'?'.mg-l':'.mg-r').classList.add('hit'); setTimeout(()=>root.querySelector(side==='L'?'.mg-l':'.mg-r')?.classList.remove('hit'),90);
      if(side===G.lastSide){ G.stun=.35; Snd.hit(0); pop('STUMBLE!','#ff8a80'); } else { me.p+=.7*mul; Snd.step(); } G.lastSide=side; }
    else if(comp.game==='catch'){ if(G.tapped) return; G.tapped=true; const d=Math.abs(G.x-.5);
      const q = d<.05?2 : d<.12+.06*norm?1 : 0; G.pts+=[0,6,10][q]; G.res.push(q); Snd.hit(q); if(q) Snd.splash(); pop(['MISS','GOOD','PERFECT!'][q],['#ff8a80','#ffffff','#ffd54f'][q]); }
  }
  zone.addEventListener('pointerdown',input,{passive:false});
  function pop(text,col){ flash.push({text,col,life:.7}); }
  const parts=[]; function burst(x,y,col,n){ for(let i=0;i<n;i++) parts.push({x,y,vx:(Math.random()-.5)*160,vy:-Math.random()*160,life:.5,col}); }
  function finishOrder(){ const key=comp.game==='catch'?'score':'time'; const rows=lanes.map(l=>({name:l.name,you:!!l.you,col:l.col,
      value: comp.game==='catch' ? l.score : l.done ?? 99 }));
    rows.sort((a,b)=>comp.game==='catch'?b.value-a.value:a.value-b.value); return rows; }
  function end(){ if(ended) return; ended=true; state='end'; if(comp.game==='catch'){ lanes[0].score=G.pts; lanes.slice(1).forEach(l=>{ l.score=Math.round(45+50*l.r*l.jit+(Math.random()*16-8)); }); }
    const rows=finishOrder(); const place=rows.findIndex(r=>r.you); Snd.cheer(1.8,place===0?1:.5);
    setTimeout(()=>{ cancelAnimationFrame(raf); root.classList.remove('on'); root.innerHTML=''; onDone({place,rows,perf:comp.game==='catch'?G.pts/100:null}); },1400); }
  function step(now){ const dt=Math.min(.1,(now-last)/1000); last=now; t+=dt;
    if(state==='count'){ const prev=Math.ceil(cd); cd-=dt; const c=Math.ceil(cd); if(c!==prev&&c>0){ countEl.textContent=c; countEl.classList.remove('pulse'); void countEl.offsetWidth; countEl.classList.add('pulse'); Snd.beep(false); }
      if(cd<=0){ state='go'; t=0; countEl.textContent='GO!'; countEl.classList.add('pulse'); Snd.beep(true); setTimeout(()=>countEl.textContent='',600); } }
    else if(state==='go'){
      if(comp.game==='catch'){ G.x+=dt/G.T; if(G.x>=1){ if(!G.tapped){ G.res.push(0); pop('MISS','#ff8a80'); } G.i++; G.x=0; G.tapped=false; G.T=Math.max(.62,G.T*.95); if(G.i>=G.n) end(); }
        lanes.slice(1).forEach(l=>l.p=(G.i+G.x)/G.n*(.45+.5*l.r)); lanes[0].p=G.pts/100; }
      else { const goal=G.goal; for(const l of lanes.slice(1)) if(!l.done){ l.p+=aiRate(l.r)*l.jit*dt; if(l.p>=goal){ l.p=goal; l.done=t; } }
        const me=lanes[0]; if(!me.done&&me.p>=goal){ me.p=goal; me.done=t; Snd.cheer(1,.6); }
        if(comp.game==='timing'){ G.lock=Math.max(0,G.lock-dt); G.x+=G.dir*dt*G.sp*.9; if(G.x>1){G.x=1;G.dir=-1;} if(G.x<0){G.x=0;G.dir=1;} }
        if(comp.game==='rhythm') G.stun=Math.max(0,G.stun-dt);
        if(me.done || t>25){ if(!me.done) me.done=99; for(const l of lanes) if(!l.done) l.done=t+ (G.goal-l.p)/aiRate(l.r||.5); end(); } } }
    draw(); raf=requestAnimationFrame(step); }
  function draw(){ g.clearRect(0,0,W,H);
    // sky + field
    const sky=g.createLinearGradient(0,0,0,H); sky.addColorStop(0,'#7fd0ff'); sky.addColorStop(.42,'#c9efff'); sky.addColorStop(.42,'#6cc04a'); sky.addColorStop(1,'#3f8f2f'); g.fillStyle=sky; g.fillRect(0,0,W,H);
    // crowd stand
    g.fillStyle='#8d6e63'; g.fillRect(0,H*.3,W,H*.12); for(let i=0;i<40;i++){ g.fillStyle=['#ef5350','#42a5f5','#ffee58','#66bb6a','#ab47bc'][i%5]; const bob=Math.sin(t*8+i)*2; g.beginPath(); g.arc(8+i*(W/40),H*.33+bob+(i%2)*10,5,0,7); g.fill(); }
    // rival progress bars
    const goal = comp.game==='catch'?1:G.goal; const bw=W-110;
    lanes.forEach((l,i)=>{ const y=10+i*26; g.fillStyle='rgba(0,0,0,.35)'; rr(100,y,bw,18,9); g.fill(); g.fillStyle=l.col; rr(100,y,Math.max(18,bw*Math.min(1,l.p/goal)),18,9); g.fill();
      g.fillStyle='#fff'; g.font='bold 12px -apple-system,system-ui,sans-serif'; g.textAlign='left'; g.textBaseline='middle'; g.fillText(trunc(l.name,14),6,y+9.5,88); if(l.done&&comp.game!=='catch'){ g.textAlign='left'; g.fillText('✓',104,y+9.5);} });
    const cx=W/2, base=H*.78;
    if(comp.game==='mash'||comp.game==='rhythm'){ // runner dragging hose / dummy
      const me=lanes[0], k=me.p/G.goal; const x=30+(W-90)*k; g.strokeStyle='#ffffff'; g.lineWidth=2; g.setLineDash([6,6]); g.beginPath(); g.moveTo(W-40,base-70); g.lineTo(W-40,base+30); g.stroke(); g.setLineDash([]);
      g.fillStyle='#fff'; g.font='bold 13px -apple-system,system-ui,sans-serif'; g.textAlign='center'; g.fillText('FINISH',W-40,base-80);
      if(comp.game==='mash'){ g.strokeStyle='#e53935'; g.lineWidth=7; g.beginPath(); g.moveTo(10,base+18); g.quadraticCurveTo(x*.5,base+30,x-8,base+4); g.stroke(); }
      else { g.fillStyle='#ff9800'; rr(x-52,base-2,36,16,7); g.fill(); g.fillStyle='#ffcc80'; g.beginPath(); g.arc(x-56,base+6,7,0,7); g.fill(); }
      runner(x,base,t*(me.p>0?14:0)+me.p*2); }
    else if(comp.game==='timing'){ // ladder
      const lx=cx-40, top=H*.46, bot=H*.86, me=lanes[0]; g.fillStyle='#ffca28'; g.fillRect(lx-30,top,8,bot-top); g.fillRect(lx+30,top,8,bot-top);
      for(let i=0;i<=G.goal;i++){ const y=bot-(bot-top)*i/G.goal; g.fillRect(lx-30,y-3,68,6); }
      const y=bot-(bot-top)*me.p/G.goal; runner(lx+4,y,0,true);
      // timing bar
      const bx=cx+20, by=H*.5, bh=H*.3; g.fillStyle='rgba(0,0,0,.4)'; rr(bx,by,46,bh,12); g.fill();
      g.fillStyle='#43a047'; rr(bx+4,by+bh*(1-G.zc-G.zw/2),38,bh*G.zw,8); g.fill(); g.fillStyle='#a5d6a7'; rr(bx+4,by+bh*(1-G.zc-G.zw/6),38,bh*G.zw/3,6); g.fill();
      g.fillStyle=G.lock>0?'#ff5252':'#ffffff'; rr(bx-6,by+bh*(1-G.x)-5,58,10,5); g.fill(); }
    else if(comp.game==='catch'){ // bucket line
      const y=H*.66; for(let i=0;i<5;i++) runner(30+i*(W-60)/4,y+40,0);
      g.fillStyle='rgba(255,255,255,.25)'; rr(cx-W*.12,y-30,W*.24,60,14); g.fill(); g.strokeStyle='#fff'; g.lineWidth=2; g.strokeRect(cx-W*.05,y-30,W*.1,60);
      const bx=20+(W-40)*G.x; g.fillStyle='#90a4ae'; g.beginPath(); g.moveTo(bx-14,y-14); g.lineTo(bx+14,y-14); g.lineTo(bx+10,y+14); g.lineTo(bx-10,y+14); g.fill(); g.fillStyle='#4fc3f7'; g.fillRect(bx-12,y-12,24,6);
      g.fillStyle='#fff'; g.font='bold 18px -apple-system,system-ui,sans-serif'; g.textAlign='center'; g.fillText(`Bucket ${Math.min(G.i+1,G.n)}/${G.n}   ·   ${G.pts} pts`,cx,H*.5);
      G.res.forEach((q,i)=>{ g.fillStyle=['#ff5252','#ffffff','#ffd54f'][q]; g.beginPath(); g.arc(cx-(G.n-1)*9+i*18,H*.55,6,0,7); g.fill(); }); }
    // floating words
    for(const f of flash){ f.life-=1/60; g.globalAlpha=Math.max(0,f.life/.7); g.font='bold 30px "Lilita One",-apple-system,sans-serif'; g.textAlign='center'; g.lineWidth=6; g.strokeStyle='rgba(0,0,0,.5)';
      const y=H*.44-(.7-f.life)*60; g.strokeText(f.text,cx,y); g.fillStyle=f.col; g.fillText(f.text,cx,y); g.globalAlpha=1; }
    flash=flash.filter(f=>f.life>0);
    for(const p of parts){ p.life-=1/60; p.x+=p.vx/60; p.y+=p.vy/60; p.vy+=6; g.globalAlpha=Math.max(0,p.life*2); g.fillStyle=p.col; g.fillRect(p.x,p.y,4,4); g.globalAlpha=1; }
    for(let i=parts.length-1;i>=0;i--) if(parts[i].life<=0) parts.splice(i,1);
  }
  function runner(x,y,ph,climb){ const sw=Math.sin(ph)*8; g.save(); g.translate(x,y);
    g.strokeStyle='#2b2b2b'; g.lineWidth=7; g.lineCap='round'; g.beginPath(); g.moveTo(0,0); g.lineTo(-6+sw*(climb?0:1),22); g.moveTo(0,0); g.lineTo(6-sw*(climb?0:1),22); g.stroke();
    g.fillStyle='#c9a24e'; rr(-13,-30,26,32,10); g.fill(); g.fillStyle='#e8ff6a'; g.fillRect(-13,-12,26,4);
    g.fillStyle='#f2c9a0'; g.beginPath(); g.arc(0,-40,10,0,7); g.fill(); g.fillStyle='#ffca28'; g.beginPath(); g.arc(0,-44,11,Math.PI,0); g.fill(); g.fillRect(-15,-45,30,4);
    g.restore(); }
  function rr(x,y,w,h,r){ g.beginPath(); g.roundRect(x,y,w,h,Math.min(r,h/2,w/2)); }
  const trunc=(s,n)=>s.length>n?s.slice(0,n-1)+'…':s;
  raf=requestAnimationFrame(step);
  return { size };
}
