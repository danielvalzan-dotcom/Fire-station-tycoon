// Disaster weather over the 3D base: a cheap 2D canvas layer (particles + tint + lightning) and a CSS shake for tremors.
import { Snd } from './audio.js';
export class Weather {
  constructor(canvas, shakeEl){ this.cv=canvas; this.g=canvas.getContext('2d'); this.el=shakeEl; this.type=null; this.p=[]; this.flash=0; this.nextBolt=3; this.t=0; this.resize(); addEventListener('resize',()=>this.resize()); }
  resize(){ const d=Math.min(1.5,devicePixelRatio||1); this.d=d; this.W=innerWidth; this.H=innerHeight; this.cv.width=this.W*d; this.cv.height=this.H*d; this.g.setTransform(d,0,0,d,0,0); }
  set(type){ if(type===this.type) return; this.type=type; this.p=[]; this.cv.style.display=type?'block':'none'; this.el.style.transform=''; Snd.weather(type); }
  spawn(){ const W=this.W, H=this.H, r=Math.random;
    switch(this.type){
      case 'rain': return {x:r()*W*1.2, y:-20, vx:-120, vy:900+r()*300, l:16+r()*10, k:'r'};
      case 'hail': return {x:r()*W, y:-10, vx:-40, vy:520+r()*200, s:2+r()*3, k:'h', bounce:0};
      case 'ash': return r()<.25 ? {x:r()*W, y:H+10, vx:20+r()*40, vy:-(60+r()*80), s:1.5+r()*2.5, k:'e', life:3} : {x:-10, y:r()*H, vx:60+r()*80, vy:10+r()*20, s:2+r()*3, k:'a'};
      case 'wind': return {x:-30, y:r()*H, vx:500+r()*400, vy:(r()-.5)*80, s:4+r()*6, k:'w', rot:r()*6};
      case 'fog': return {x:r()*W, y:r()*H, vx:12+r()*14, vy:0, s:60+r()*80, k:'f', life:6};
      case 'shake': return {x:r()*W, y:-10, vx:0, vy:80+r()*60, s:2+r()*3, k:'d'};
    } }
  update(dt){ if(!this.type) return; this.t+=dt; const g=this.g, W=this.W, H=this.H; const want={rain:180,hail:70,ash:90,wind:40,fog:14,shake:40}[this.type];
    while(this.p.length<want) this.p.push(this.spawn());
    g.clearRect(0,0,W,H); g.fillStyle={rain:'rgba(30,45,70,.28)',hail:'rgba(25,30,45,.34)',ash:'rgba(160,70,10,.22)',wind:'rgba(40,55,70,.22)',fog:'rgba(120,170,60,.18)',shake:'rgba(90,70,40,.16)'}[this.type]; g.fillRect(0,0,W,H);
    for(const q of this.p){ q.x+=q.vx*dt; q.y+=q.vy*dt; if(q.life!==undefined) q.life-=dt;
      if(q.k==='r'){ g.strokeStyle='rgba(200,220,255,.55)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(q.x,q.y); g.lineTo(q.x-q.vx*.018,q.y-q.l); g.stroke(); }
      else if(q.k==='h'){ if(q.y>H*.82&&!q.bounce){ q.bounce=1; q.vy=-q.vy*.3; } if(q.bounce) q.vy+=900*dt; g.fillStyle='rgba(240,248,255,.95)'; g.beginPath(); g.arc(q.x,q.y,q.s,0,7); g.fill(); }
      else if(q.k==='a'){ g.fillStyle='rgba(80,70,60,.55)'; g.fillRect(q.x,q.y,q.s,q.s); }
      else if(q.k==='e'){ g.fillStyle=`rgba(255,${120+Math.random()*80|0},40,${Math.max(0,q.life/3)})`; g.beginPath(); g.arc(q.x+Math.sin(this.t*5+q.y)*6,q.y,q.s,0,7); g.fill(); }
      else if(q.k==='w'){ q.rot+=dt*8; g.save(); g.translate(q.x,q.y); g.rotate(q.rot); g.fillStyle='rgba(90,130,60,.8)'; g.beginPath(); g.ellipse(0,0,q.s,q.s*.45,0,0,7); g.fill(); g.restore(); g.strokeStyle='rgba(255,255,255,.18)'; g.lineWidth=1; g.beginPath(); g.moveTo(q.x-60,q.y); g.lineTo(q.x-140,q.y); g.stroke(); }
      else if(q.k==='f'){ const gr=g.createRadialGradient(q.x,q.y,0,q.x,q.y,q.s); gr.addColorStop(0,'rgba(170,220,90,.22)'); gr.addColorStop(1,'rgba(170,220,90,0)'); g.fillStyle=gr; g.fillRect(q.x-q.s,q.y-q.s,q.s*2,q.s*2); }
      else if(q.k==='d'){ g.fillStyle='rgba(150,130,100,.6)'; g.fillRect(q.x,q.y,q.s,q.s); } }
    this.p=this.p.filter(q=>q.x>-160&&q.x<W+160&&q.y>-40&&q.y<H+40&&(q.life===undefined||q.life>0));
    if(this.type==='rain'||this.type==='hail'||this.type==='wind'){ this.nextBolt-=dt; if(this.nextBolt<=0){ this.nextBolt=5+Math.random()*7; this.flash=1; setTimeout(()=>Snd.thunder(),250+Math.random()*700); } }
    if(this.flash>0){ g.fillStyle=`rgba(255,255,255,${this.flash*.6})`; g.fillRect(0,0,W,H); this.flash-=dt*3; }
    if(this.type==='shake'){ const k=(Math.sin(this.t*.7)>.6?6:1.5); this.el.style.transform=`translate(${(Math.random()-.5)*k}px,${(Math.random()-.5)*k}px)`; if(k>3&&Math.random()<dt*2) Snd.thud(); } }
}
