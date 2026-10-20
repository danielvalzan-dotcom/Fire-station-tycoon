// Firey Station Tycoon v4: the town around the station. Parametric low-poly models, merged per material
// (few draw calls), instanced bush, placement ghost, cars/walkers on roads, day/night, damage overlays.
import { THREE, M, bake, OUTLINE, rbox, box, cyl, sph, textTex, stripeTex, hazardTex, windowRow, mulberry } from './scene.js';
import { mergeGeometries } from './vendor/three.bundle.min.js';
import * as TD from './towndata.js';
const { TB, CELL, GRID, CHUNK, NCH } = TD; const HALF=GRID*CELL/2; const GY=-0.5; const SQ=Math.SQRT1_2;
const P=(o,x,y,z)=>{ o.position.set(x,y,z); return o; };
const texCache=new Map(); const TT=(k,f)=>{ if(!texCache.has(k)) texCache.set(k,f()); return texCache.get(k); };
const signMat=(text,o={})=>TT('s|'+text+JSON.stringify(o),()=>new THREE.MeshBasicMaterial({map:textTex(text,o)}));
const texMat=(k,f,o={})=>TT('t|'+k,()=>new THREE.MeshPhongMaterial({map:f(),shininess:o.shine??20,color:o.color||'#ffffff'}));
const WIN=()=>M('#7fd3ff',{em:0x1d5a7a,ei:.5,shine:90,spec:0xffffff});
const LAMP=()=>M('#fff3c4',{em:0xffd98a,ei:.3});
const band=lv=>lv<=2?{wall:'#c99a62',base:'#a0784e',roof:'#7a4f2c',trim:'#e8d5a8'}:lv<=4?{wall:'#c4573e',base:'#9e9e9e',roof:'#5d4037',trim:'#f5f5f5'}:lv<=6?{wall:'#90a4ae',base:'#78909c',roof:'#37474f',trim:'#e0f2f1'}:{wall:'#546e7a',base:'#455a64',roof:'#263238',trim:'#ffcf33'};
export const wallMask=(set,i,j)=>(set.has((i+1)+','+j)?1:0)|(set.has((i-1)+','+j)?2:0)|(set.has(i+','+(j+1))?4:0)|(set.has(i+','+(j-1))?8:0);
const trimFor=lv=>lv>=7?'#ffcf33':lv>=4?'#ffe8a3':'#ffffff';

/* ---------- small parts ---------- */
function hipRoof(w,d,h,mat){ const m=new THREE.Mesh(new THREE.CylinderGeometry(0,SQ,h,4,1),mat); m.rotation.y=Math.PI/4; m.scale.set(w,1,d); m.castShadow=true; return m; }
function gable(w,d,h,mat){ const sh=new THREE.Shape(); sh.moveTo(-d/2,0); sh.lineTo(d/2,0); sh.lineTo(0,h); sh.closePath(); const geo=new THREE.ExtrudeGeometry(sh,{depth:w,bevelEnabled:false}); geo.translate(0,0,-w/2); const m=new THREE.Mesh(geo,mat); m.rotation.y=Math.PI/2; m.castShadow=true; return m; }
function wins(g,W,D,y,nz,nx,s=.32){ if(nz) windowRow(g,nz,s,y,D/2+.03,-(nz-1)*(W/nz)/2,W/nz); if(nx) windowRow(g,nx,s,y,W/2+.03,-(nx-1)*(D/nx)/2,D/nx,true); }
function tree(g,x,z,s=1,kind=0){ if(kind===1){ const tr=cyl(.05*s,.08*s,1.1*s,M('#eeeae0'),6); P(tr,x,.55*s,z); g.add(tr); for(const [a,b,c] of [[0,1.25,0],[.22,1.05,.1],[-.2,1.1,-.1]]){ const c1=sph(.32*s,M('#6f8f4e',{shine:8,flat:true}),6); P(c1,x+a*s,b*s,z+c*s); g.add(c1);} return; }
  const tr=cyl(.06*s,.09*s,.6*s,M('#7a4b2a'),6); P(tr,x,.3*s,z); const c=sph(.42*s,M(['#3f9d3a','#4caf50','#2e8b3e'][Math.abs(Math.round(x*7+z*3))%3],{shine:10,flat:true}),7); P(c,x,.85*s,z); g.add(tr,c); }
function person(g,x,z,col,s=.6){ const b=rbox(.28*s,.42*s,.2*s,.08*s,M(col)); P(b,x,.3*s,z); const h=sph(.13*s,M('#f2c9a0'),8); P(h,x,.62*s,z); g.add(b,h); }
function carM(g,x,z,col,rot=0,s=.7){ const c=new THREE.Group(); const b=rbox(1.5,.42,.8,.18,M(col,{shine:90})); P(b,0,.38,0); const t=rbox(.85,.36,.72,.16,M('#bfe8ff',{shine:100,spec:0xffffff})); P(t,-.1,.72,0); c.add(b,t);
  for(const [a,bb] of [[-.5,.4],[.5,.4],[-.5,-.4],[.5,-.4]]){ const w=cyl(.17,.17,.12,M('#222'),8); w.rotation.x=Math.PI/2; P(w,a,.2,bb); c.add(w); } c.scale.setScalar(s); c.rotation.y=rot; P(c,x,0,z); g.add(c); return c; }
function truckM(g,x,z,rot=0,s=.55,col='#e8281e'){ const c=new THREE.Group(); const b=rbox(2.3,.85,1,.2,M(col,{shine:95})); P(b,-.2,.75,0); const cab=rbox(.85,1,1,.24,M(col,{shine:95})); P(cab,1.15,.82,0);
  const w=rbox(.1,.42,.86,.05,M('#bfe8ff',{shine:120})); P(w,1.58,1,0); const st=box(2.32,.1,1.02,M('#ffffff')); P(st,-.2,.55,0); c.add(b,cab,w,st);
  for(const [a,bb] of [[-.9,.5],[.1,.5],[1.1,.5],[-.9,-.5],[.1,-.5],[1.1,-.5]]){ const wh=cyl(.24,.24,.16,M('#1f1f1f'),8); wh.rotation.x=Math.PI/2; P(wh,a,.26,bb); c.add(wh); }
  const lb=box(.5,.1,.3,M('#ff1744',{em:0xff1744,ei:.6})); P(lb,1.15,1.37,0); c.add(lb); c.scale.setScalar(s); c.rotation.y=rot; P(c,x,0,z); g.add(c); return c; }
function flagPole(C,x,z,h=2.2,col='#ffcc33'){ const p=cyl(.03,.04,h,M('#eeeeee',{shine:90}),6); P(p,x,h/2,z); C.g.add(p); const f=new THREE.Mesh(new THREE.PlaneGeometry(.6,.36),M(col,{shine:10})); f.material.side=THREE.DoubleSide;
  const piv=new THREE.Group(); piv.userData.keep=true; P(piv,x,h-.2,z); f.position.x=.3; piv.add(f); C.A.add(piv); C.anim.push(t=>{ piv.rotation.y=Math.sin(t*2+x)*.35-.6; f.rotation.y=Math.sin(t*5+z)*.15; }); }
function blinker(C,x,y,z,col=0xff1744,sp=4){ const b=sph(.08,new THREE.MeshPhongMaterial({color:col,emissive:col,emissiveIntensity:1}),6); b.userData.keep=true; P(b,x,y,z); C.A.add(b); C.anim.push(t=>{ b.material.emissiveIntensity=Math.sin(t*sp+x)>0?1.4:.1; }); }
function spinner(C,obj,axis='z',sp=2){ obj.userData.keep=true; C.A.add(obj); C.anim.push((t,dt)=>{ obj.rotation[axis]+=dt*sp; }); return obj; }
function sign(C,text,w,x,y,z,o={},rotY=0){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w*.25),signMat(text,o)); m.rotation.y=rotY; P(m,x,y,z); C.g.add(m); return m; }
function shopBase(C,col,awn,text,floors=1){ const {g,W,D,lv}=C; const H=1+floors*0; const h=.95+(floors-1)*.7;
  const body=rbox(W,h,D,.1,M(col,{shine:25})); P(body,0,h/2,0); g.add(body); const roof=rbox(W+.14,.12,D+.14,.05,M(trimFor(lv))); P(roof,0,h+.06,0); g.add(roof);
  const glass=box(W*.62,.5,.05,WIN()); P(glass,-W*.12,.42,D/2+.03); g.add(glass); const door=box(.26,.6,.05,M('#5d4037')); P(door,W*.33,.32,D/2+.03); g.add(door);
  const aw=box(W*.95,.06,.38,texMat('awn'+awn,()=>stripeTex(awn,'#ffffff',8,true),{shine:30})); aw.rotation.x=.35; P(aw,0,.86,D/2+.2); g.add(aw);
  sign(C,text,Math.min(1.5,W*.9),0,h+.32,D/2-.12,{bg:'#1d2b3a',size:70}); if(floors>1) wins(g,W,D,h-.4,2,2,.28); wins(g,W,D,.5,0,1,.3); return h; }

/* ---------- the models: C = {g, A, anim[], smoke[], lv, W, D} ---------- */
const MODELS = {
  house(C){ const {g,W,D,lv}=C; const big=lv>=4?1.12:1, w=W*.78*big, d=D*.62*big, stump=.32;
    const cols=['#f5e6c8','#d9ecf2','#f2d7d5','#e3f0d3','#fff3c4'][lv%5];
    for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1],[0,1],[0,-1]]){ const s=box(.07,stump,.07,M('#6d4c41')); P(s,a*w/2*.9,stump/2,b*d/2*.9-.05); g.add(s); }
    const walls=box(w,.75,d,texMat('wb'+cols,()=>stripeTex(cols,'#00000018',10),{shine:15})); P(walls,0,stump+.375,-.05); g.add(walls);
    const roof=hipRoof(w+.22,d+.22,.55,texMat('iron',()=>stripeTex('#b8c2c9','#8d989f',16,true),{shine:70})); P(roof,0,stump+.75+.27,-.05); g.add(roof);
    const ver=box(w,.04,.36,M('#8d6e63')); P(ver,0,stump+.02,d/2+.13); g.add(ver); const vr=box(w,.24,.03,M(trimFor(lv))); P(vr,0,stump+.14,d/2+.3); g.add(vr);
    const vroof=box(w+.1,.04,.42,texMat('iron',()=>stripeTex('#b8c2c9','#8d989f',16,true))); vroof.rotation.x=.18; P(vroof,0,stump+.78,d/2+.12); g.add(vroof);
    for(let i=0;i<4;i++){ const p=box(.04,.75,.04,M(trimFor(lv))); P(p,-w/2+.06+i*(w-.12)/3,stump+.38,d/2+.3); g.add(p); }
    const stairs=box(.24,.06,.3,M('#8d6e63')); stairs.rotation.x=-.6; P(stairs,w*.25,.16,d/2+.42); g.add(stairs);
    wins(g,w,d,stump+.42,2,2,.24); const door=box(.2,.42,.03,M('#2e7d32')); P(door,w*.25,stump+.24,d/2-.03); g.add(door);
    const ch=box(.14,.4,.14,M('#8d6e63')); P(ch,-w*.28,stump+1.1,-.2); g.add(ch); if(lv%2===1) C.smoke.push([-w*.28,stump+1.35,-.2,'#f0f0f0',1.3]);
    if(lv>=2){ for(let i=0;i<3;i++){ const f=sph(.09,M(['#e91e63','#ffeb3b','#ab47bc'][i]),5); P(f,-W*.4+i*.12,.08,D*.42); g.add(f); } }
    if(lv>=3){ const tank=cyl(.16,.16,.5,M('#9fb7c4',{shine:60}),10); P(tank,w/2+.12,.25,-d*.25); g.add(tank); }
    if(lv>=5){ const pop=box(w*.5,.45,d*.5,M(cols)); P(pop,-w*.12,stump+1.15,-.15); g.add(pop); const pr=hipRoof(w*.6,d*.6,.3,M('#8d989f',{shine:60})); P(pr,-w*.12,stump+1.52,-.15); g.add(pr); wins(g,w*.5,d*.5,stump+1.15,1,0,.2); }
    if(lv>=6){ const sol=box(w*.38,.03,.3,M('#1a237e',{shine:120,spec:0xffffff})); sol.rotation.x=.4; P(sol,w*.2,stump+.98,d*.18); g.add(sol); }
    if(lv>=7){ const pool=box(.6,.06,.4,M('#29b6f6',{shine:120,em:0x0d47a1,ei:.2})); P(pool,W*.28,.04,-D*.36); g.add(pool); }
    if(lv>=8) carM(g,-W*.28,D*.36,'#ffb300',0,.45); },
  units(C){ const {g,W,D,lv}=C; const fl=Math.min(8,1+Math.ceil(lv*0.75)), fh=.55, w=W*.7, d=D*.7, col=['#e8dcc8','#cfd8dc','#f0e0d0'][lv%3];
    const body=rbox(w,fl*fh,d,.08,M(col,{shine:25})); P(body,0,fl*fh/2,-.1); g.add(body);
    for(let f=0;f<fl;f++){ wins(g,w,d-.2,f*fh+.32,3,3,.26); if(f>0&&f%1===0){ const bal=box(w*.9,.04,.22,M('#ffffff')); P(bal,0,f*fh+.06,d/2+.0); g.add(bal); const rail=box(w*.9,.14,.02,M('#90a4ae',{op:.7})); P(rail,0,f*fh+.14,d/2+.1); g.add(rail); } }
    const par=rbox(w+.1,.12,d+.1,.04,M(trimFor(lv))); P(par,0,fl*fh+.06,-.1); g.add(par);
    const can=box(.7,.05,.4,M('#37474f')); P(can,0,.62,d/2+.15); g.add(can); sign(C,'UNITS',.8,0,.78,d/2+.12,{bg:'#37474f',size:70});
    if(lv>=3){ const t=cyl(.22,.22,.45,M('#b0bec5'),10); P(t,w*.25,fl*fh+.3,-d*.2); g.add(t); for(let i=0;i<2;i++){ const ac=box(.22,.16,.22,M('#eceff1')); P(ac,-w*.25+i*.3,fl*fh+.2,0); g.add(ac);} }
    if(lv>=6){ const gr=box(w*.5,.08,d*.4,M('#66bb6a')); P(gr,-w*.15,fl*fh+.16,d*.15); g.add(gr); tree(g,-w*.2,d*.15,.5); tree(g,0,d*.25,.4); }
    if(lv>=8){ const ph=box(w*.4,.4,d*.4,WIN()); P(ph,w*.15,fl*fh+.32,-d*.2); g.add(ph); }
    for(let i=0;i<Math.min(3,1+(lv>>2));i++) carM(g,W*.42,-D*.35+i*.55,['#e53935','#1e88e5','#fdd835'][i],Math.PI/2,.4); },
  bakery(C){ const {g,W,D,lv}=C; const h=shopBase(C,'#ffe0b2','#d84315','BAKERY',lv>=4?2:1); const pie=sph(.32,M('#d4a056',{shine:30}),10); pie.scale.y=.5; P(pie,0,h+.7,-.1); g.add(pie); const crust=new THREE.Mesh(new THREE.TorusGeometry(.3,.06,6,14),M('#b07a35')); crust.rotation.x=Math.PI/2; P(crust,0,h+.72,-.1); g.add(crust);
    if(lv>=3){ const tb=cyl(.18,.18,.04,M('#ffffff'),10); P(tb,W*.42,.4,D*.2); const leg=cyl(.02,.02,.4,M('#555'),5); P(leg,W*.42,.2,D*.2); g.add(tb,leg); }
    if(lv>=6) C.smoke.push([-W*.3,h+.3,-D*.3,'#ffffff',2]); },
  cafe(C){ const {g,W,D,lv}=C; const h=shopBase(C,'#d7ccc8','#2e7d32','CAFE',lv>=4?2:1); const cup=cyl(.2,.15,.3,M('#ffffff'),10); P(cup,0,h+.5,0); g.add(cup); const cof=cyl(.18,.18,.02,M('#5d4037'),10); P(cof,0,h+.65,0); g.add(cof);
    for(let i=0;i<Math.min(3,1+(lv>>1));i++){ const x=W*.45, z=-D*.3+i*.4; const u=new THREE.Mesh(new THREE.ConeGeometry(.24,.14,8),M(['#ef5350','#fff176','#4db6ac'][i])); P(u,x,.7,z); const pl=cyl(.015,.015,.65,M('#eee'),4); P(pl,x,.33,z); const tb=cyl(.12,.12,.03,M('#fff'),8); P(tb,x,.33,z); g.add(u,pl,tb); } },
  surf(C){ const {g,W,D,lv}=C; const h=shopBase(C,'#80deea','#f57c00','SURF',lv>=5?2:1); const n=Math.min(6,2+lv);
    for(let i=0;i<n;i++){ const b=rbox(.12,.7,.04,.04,M(['#ff7043','#ffee58','#29b6f6','#ab47bc','#66bb6a','#ec407a'][i%6],{shine:80})); b.rotation.z=.12; P(b,-W*.38+i*.13,.38,D/2+.12); g.add(b); }
    if(lv>=5){ const big=rbox(.3,1.6,.08,.1,M('#ff7043',{shine:80})); big.rotation.z=.3; P(big,W*.3,h+.75,0); g.add(big); } },
  servo(C){ const {g,W,D,lv}=C; const sh=rbox(W*.35,.8,D*.7,.06,M('#fafafa')); P(sh,-W*.3,.4,-.05); g.add(sh); wins(g,W*.35,D*.7,.45,1,0,.3);
    const can=box(W*.55,.1,D*.7,M('#d32f2f',{shine:60})); P(can,W*.18,1.05,0); g.add(can); const cb=box(W*.56,.08,D*.71,M('#ffeb3b')); P(cb,W*.18,.96,0); g.add(cb);
    for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const p=box(.06,1,.06,M('#eeeeee')); P(p,W*.18+a*W*.24,.5,b*D*.3); g.add(p); }
    const np=Math.min(3,1+Math.floor(lv/3)); for(let i=0;i<np;i++){ const pm=rbox(.16,.42,.12,.03,M('#263238')); P(pm,W*.05+i*.3,.21,0); const sc=box(.1,.08,.01,M('#76ff03',{em:0x33691e,ei:.8})); P(sc,W*.05+i*.3,.34,.07); g.add(pm,sc); }
    const py=box(.08,1.5,.08,M('#9e9e9e')); P(py,W*.45,.75,D*.4); g.add(py); sign(C,'SERVO',.7,W*.45,1.4,D*.4+.05,{bg:'#d32f2f',size:80}); sign(C,'PIES $3',.7,W*.45,1.18,D*.4+.05,{bg:'#212121',size:70,fg:'#ffeb3b'});
    if(lv>=4) carM(g,W*.2,-D*.18,'#43a047',0,.4); if(lv>=6){ const cw=rbox(.5,.55,.6,.05,M('#4fc3f7',{op:.6})); P(cw,-W*.3,.3,D*.4); g.add(cw);} },
  pub(C){ const {g,W,D,lv}=C; const w=W*.72, d=D*.72, f=2, fh=.8; const body=rbox(w,f*fh,d,.06,M(lv>=6?'#c8a27a':'#e8d1a8',{shine:20})); P(body,-.15,f*fh/2,-.15); g.add(body);
    const roof=hipRoof(w+.3,d+.3,.6,texMat('iron2',()=>stripeTex('#a33b2e','#7e2a20',16,true),{shine:60})); P(roof,-.15,f*fh+.3,-.15); g.add(roof);
    for(let k=0;k<2;k++){ const deck=box(w+.4,.05,.42,M('#8d6e63')); P(deck,-.15+.0,fh*k+.02+(k?0:0),d/2+.06); if(k) g.add(deck); const deck2=box(.42,.05,d+.4,M('#8d6e63')); P(deck2,w/2+.06,fh*k+.02,-.15); if(k) g.add(deck2);
      const rail=box(w+.4,.14,.02,M('#ffffff')); P(rail,-.15,fh*k+.1+(k?.04:0),d/2+.26); g.add(rail); const rail2=box(.02,.14,d+.4,M('#ffffff')); P(rail2,w/2+.26,fh*k+.1+(k?.04:0),-.15); g.add(rail2); }
    for(let i=0;i<5;i++){ const p=box(.05,f*fh,.05,M('#ffffff')); P(p,-w/2-.15+i*(w+.3)/4,f*fh/2,d/2+.26); g.add(p); const p2=box(.05,f*fh,.05,M('#ffffff')); P(p2,w/2+.26,f*fh/2,-d/2-.15+i*(d+.3)/4); g.add(p2); }
    const vr=box(w+.5,.05,.5,M('#8d989f')); P(vr,-.15,f*fh+.02,d/2+.1); g.add(vr); const vr2=box(.5,.05,d+.5,M('#8d989f')); P(vr2,w/2+.1,f*fh+.02,-.15); g.add(vr2);
    for(let k=0;k<f;k++) wins(g,w,d,k*fh+.45,3,3,.26); sign(C,'HOTEL',1.3,-.15,f*fh-.25,d/2-.12,{bg:'#1b5e20',size:80,border:'#ffd54f'});
    if(lv>=4) for(let i=0;i<Math.min(3,lv-3);i++){ const u=new THREE.Mesh(new THREE.ConeGeometry(.28,.15,8),M(['#2e7d32','#fbc02d','#c62828'][i])); P(u,-W*.4+i*.5,.8,D*.42); const pl=cyl(.015,.015,.75,M('#eee'),4); P(pl,-W*.4+i*.5,.38,D*.42); g.add(u,pl); }
    if(lv>=8){ const bs=rbox(.6,.6,.6,.05,M('#90a4ae')); P(bs,-W*.38,.3,-D*.38); g.add(bs); } },
  timber(C){ const {g,W,D,lv}=C; for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const p=box(.08,1.1,.08,M('#6d4c41')); P(p,-W*.15+a*W*.25,.55,-D*.15+b*D*.25); g.add(p); }
    const r=box(W*.6,.06,D*.6,texMat('iron',()=>stripeTex('#b8c2c9','#8d989f',16,true))); r.rotation.z=.12; P(r,-W*.15,1.15,-D*.15); g.add(r);
    const piles=Math.min(6,1+lv); for(let k=0;k<piles;k++){ const px=W*.3, pz=-D*.38+k*.32; for(let y=0;y<3;y++) for(let x=0;x<3-y;x++){ const l=cyl(.07,.07,.9,M('#a1673a'),7); l.rotation.x=Math.PI/2; l.rotation.z=Math.PI/2; P(l,px+(x-1+y*.5)*.15,.08+y*.13,pz); l.rotation.set(0,0,Math.PI/2); g.add(l);} }
    const bench=box(.9,.35,.3,M('#455a64')); P(bench,-W*.15,.18,-D*.15); g.add(bench);
    const saw=cyl(.22,.22,.02,M('#cfd8dc',{shine:120}),14); saw.rotation.x=Math.PI/2; const sg=new THREE.Group(); P(sg,-W*.15,.42,-D*.15); sg.add(saw); spinner(C,sg,'z',9);
    const dust=sph(.25,M('#e0c08a'),7); dust.scale.y=.5; P(dust,-W*.38,.08,D*.3); g.add(dust); if(lv>=4) truckM(g,W*.05,D*.38,0,.4,'#2e7d32'); if(lv>=7){ const sh2=rbox(.7,.7,.6,.05,M('#8d6e63')); P(sh2,-W*.36,.35,D*.12); g.add(sh2);} },
  quarry(C){ const {g,W,D,lv}=C; const rock=M('#a1887f',{flat:true,shine:5}); for(let k=0;k<4;k++){ const t=box(W*(.85-k*.18),.25,D*(.85-k*.18),M(['#bcaaa4','#a1887f','#8d6e63','#795548'][k],{shine:5})); P(t,-W*.05,.125+k*.25,-D*.05); g.add(t); }
    for(let i=0;i<Math.min(6,2+lv);i++){ const r=new THREE.Mesh(new THREE.DodecahedronGeometry(.18+(i%3)*.06),rock); r.castShadow=true; P(r,W*.36-(i%3)*.25,.15,D*.36-Math.floor(i/3)*.3); g.add(r); }
    const ex=new THREE.Group(); const body=rbox(.5,.3,.36,.05,M('#ffb300',{shine:60})); P(body,0,.35,0); const tr=box(.6,.14,.4,M('#333')); P(tr,0,.1,0); ex.add(body,tr); P(ex,W*.25,.75,-D*.1); g.add(ex);
    const arm=new THREE.Group(); const a1=box(.7,.08,.08,M('#ffb300')); P(a1,.35,0,0); const bk=box(.16,.16,.16,M('#424242')); P(bk,.7,-.05,0); arm.add(a1,bk); P(arm,W*.25+.1,1.2,-D*.1); arm.userData.keep=true; C.A.add(arm); C.anim.push(t=>{ arm.rotation.z=-.3+Math.sin(t*1.3)*.35; arm.rotation.y=Math.sin(t*.4)*.6; });
    if(lv>=4){ const cv=box(1.4,.06,.2,M('#424242')); cv.rotation.z=.35; P(cv,-W*.3,.55,D*.32); g.add(cv); } if(lv>=6) truckM(g,-W*.3,-D*.36,Math.PI/2,.4,'#ffb300'); C.smoke.push([W*.1,.9,0,'#d7ccc8',3.5]); },
  farm(C){ const {g,W,D,lv}=C; const barn=box(.9,.7,.8,M('#c62828',{shine:20})); P(barn,-W*.32,.35,-D*.22); g.add(barn); const br=gable(.95,.86,.45,M('#eceff1')); P(br,-W*.32,.7,-D*.22); g.add(br);
    const bd=box(.36,.46,.03,texMat('barnd',()=>stripeTex('#ffffff','#c62828',4,true))); P(bd,-W*.32,.23,-D*.22+.41); g.add(bd);
    const rows=4+Math.min(4,lv>>1); for(let i=0;i<rows;i++){ const r=box(W*.5,.12+lv*.035,.16,M(i%2?'#7cb342':'#9ccc65',{flat:true})); P(r,W*.18,.08+lv*.017,-D*.4+i*(D*.8/rows)); g.add(r); }
    const wt=cyl(.03,.06,1.5,M('#9e9e9e'),5); P(wt,-W*.42,.75,D*.32); g.add(wt); const bl=new THREE.Group(); for(let i=0;i<6;i++){ const b=box(.05,.32,.02,M('#eeeeee')); b.position.y=.16; const h=new THREE.Group(); h.rotation.z=i*Math.PI/3; h.add(b); bl.add(h);} P(bl,-W*.42,1.5,D*.32+.04); spinner(C,bl,'z',2.2);
    if(lv>=3) for(let i=0;i<Math.min(3,lv-2);i++){ const cow=rbox(.3,.18,.14,.05,M(i%2?'#ffffff':'#5d4037')); P(cow,-W*.15+i*.3,.15,D*.4); g.add(cow); }
    if(lv>=5){ const silo=cyl(.2,.2,1.2,M('#cfd8dc',{shine:60}),10); P(silo,-W*.05,.6,-D*.36); const top=sph(.2,M('#b0bec5'),8); P(top,-W*.05,1.2,-D*.36); g.add(silo,top); }
    if(lv>=7){ const tr=rbox(.4,.25,.25,.05,M('#2e7d32')); P(tr,W*.42,.2,D*.38); g.add(tr); } },
  hospital(C){ const {g,W,D,lv}=C; const fl=2+Math.min(4,lv>>1), fh=.6, w=W*.7, d=D*.6; const body=rbox(w,fl*fh,d,.06,M('#fafafa',{shine:30})); P(body,-.1,fl*fh/2,-.2); g.add(body);
    for(let f=0;f<fl;f++) wins(g,w,d,f*fh+.35,4,3,.24); const band=box(w+.02,.12,d+.02,M('#26a69a')); P(band,-.1,.65,-.2); g.add(band);
    const wing=rbox(W*.4,.7,D*.35,.05,M('#eeeeee')); P(wing,W*.22,.35,D*.22); g.add(wing); const can=box(.8,.05,.4,M('#26a69a')); P(can,W*.22,.62,D*.42); g.add(can);
    sign(C,'HOSPITAL',1.1,-.1,fl*fh-.2,d/2-.17,{bg:'#00897b',size:70}); const hb=new THREE.Mesh(new THREE.PlaneGeometry(.5,.5),signMat('H',{w:128,h:128,bg:'#2e7d32',size:96,r:20})); hb.rotation.x=-Math.PI/2; P(hb,-.1,fl*fh+.02,-.2); g.add(hb);
    if(lv>=2){ const amb=new THREE.Group(); const b=rbox(.9,.5,.45,.08,M('#ffffff',{shine:80})); P(b,0,.32,0); const s=box(.92,.08,.46,M('#43a047')); P(s,0,.3,0); amb.add(b,s); P(amb,W*.35,0,-D*.05); amb.rotation.y=Math.PI/2; g.add(amb); blinker(C,W*.35,.62,-D*.05,0x2979ff,7); } },
  police(C){ const {g,W,D,lv}=C; const w=W*.68, d=D*.6, h=.9+(lv>=4?.6:0); const body=rbox(w,h,d,.06,M('#eceff1')); P(body,-.1,h/2,-.2); g.add(body); const band=box(w+.02,.16,d+.02,texMat('chk',()=>{ const c=document.createElement('canvas'); c.width=128;c.height=16; const x=c.getContext('2d'); for(let i=0;i<16;i++){ x.fillStyle=i%2?'#1a237e':'#ffffff'; x.fillRect(i*8,0,8,8); x.fillStyle=i%2?'#ffffff':'#1a237e'; x.fillRect(i*8,8,8,8);} const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=THREE.RepeatWrapping; t.repeat.set(3,1); return t; }));
    P(band,-.1,.3,-.2); g.add(band); const roof=rbox(w+.12,.1,d+.12,.04,M('#1a237e')); P(roof,-.1,h+.05,-.2); g.add(roof); wins(g,w,d,h-.35,3,2,.26); sign(C,'POLICE',1,-.1,h+.28,d/2-.2,{bg:'#1a237e',size:80});
    const lamp=sph(.1,M('#2979ff',{em:0x2979ff,ei:.8}),8); P(lamp,w*.3,h+.15,d/2-.25); g.add(lamp); blinker(C,w*.3-.1,h+.2,d/2-.25,0x2979ff,3);
    const car=new THREE.Group(); carM(car,0,0,'#ffffff',0,.45); const lb=box(.2,.05,.1,M('#2979ff',{em:0x2979ff,ei:.6})); P(lb,0,.5,0); car.add(lb); P(car,W*.3,0,D*.38); g.add(car); flagPole(C,-W*.4,D*.38,2,'#1565c0'); },
  school(C){ const {g,W,D,lv}=C; const b=rbox(W*.55,.8,D*.35,.06,M('#ffcc80')); P(b,-W*.18,.4,-D*.3); g.add(b); const r=hipRoof(W*.6,D*.42,.35,M('#5d4037',{shine:30})); P(r,-W*.18,.98,-D*.3); g.add(r); wins(g,W*.55,D*.35,.45,4,1,.26);
    sign(C,'SCHOOL',1.1,-W*.18,.95,-D*.3+D*.18,{bg:'#e65100',size:80});
    const oval=new THREE.Mesh(new THREE.CircleGeometry(1,24),M('#66bb6a')); oval.rotation.x=-Math.PI/2; oval.scale.set(W*.22,D*.2,1); P(oval,W*.22,.03,D*.12); g.add(oval); const line=new THREE.Mesh(new THREE.RingGeometry(.92,1,24),M('#ffffff')); line.rotation.x=-Math.PI/2; line.scale.set(W*.22,D*.2,1); P(line,W*.22,.04,D*.12); g.add(line);
    const slide=box(.08,.5,.6,M('#ff7043')); slide.rotation.x=.7; P(slide,-W*.38,.25,D*.3); g.add(slide); for(const z of [-.15,.15]){ const s=box(.04,.6,.04,M('#1e88e5')); P(s,-W*.18,.3,D*.3+z); g.add(s);} const sb=box(.04,.04,.4,M('#1e88e5')); P(sb,-W*.18,.6,D*.3); g.add(sb);
    flagPole(C,W*.02,-D*.05,2.2,'#2e7d32'); if(lv>=4){ const b2=rbox(W*.25,1.2,D*.25,.06,M('#ffe0b2')); P(b2,W*.32,.6,-D*.32); g.add(b2); wins(g,W*.25,D*.25,.8,2,2,.24); }
    if(lv>=6){ const hall=rbox(W*.3,.9,D*.25,.06,M('#90caf9')); P(hall,-W*.36,.45,D*.05); g.add(hall); }
    for(let i=0;i<Math.min(4,1+lv>>1);i++) person(g,W*.15+i*.25,D*.15,['#e53935','#1e88e5','#fdd835','#8e24aa'][i],.5); },
  water(C){ const {g,W,D,lv}=C; const h=1.4+lv*.18; for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const l=cyl(.04,.05,h,M('#90a4ae'),6); l.rotation.z=a*.06; l.rotation.x=-b*.06; P(l,a*.28,h/2,b*.28); g.add(l); }
    for(const y of [h*.35,h*.7]){ const ring=new THREE.Mesh(new THREE.TorusGeometry(.4,.025,4,8),M('#90a4ae')); ring.rotation.x=Math.PI/2; ring.rotation.z=Math.PI/4; P(ring,0,y,0); g.add(ring); }
    const tank=cyl(.5,.5,.7,M(lv>=5?'#4fc3f7':'#b0bec5',{shine:70}),14); P(tank,0,h+.35,0); g.add(tank); const top=new THREE.Mesh(new THREE.ConeGeometry(.55,.3,14),M('#78909c')); top.castShadow=true; P(top,0,h+.85,0); g.add(top);
    const band=cyl(.51,.51,.14,M(trimFor(lv)),14); P(band,0,h+.35,0); g.add(band); blinker(C,0,h+1.05,0,0xff1744,2.5); },
  power(C){ const {g,W,D,lv}=C; const b=rbox(W*.5,.9,D*.45,.06,M('#b0bec5')); P(b,-W*.2,.45,-D*.22); g.add(b); wins(g,W*.5,D*.45,.5,3,2,.26);
    const ns=Math.min(3,1+(lv>>2)); for(let i=0;i<ns;i++){ const c=cyl(.18,.24,1.8,M('#cfd8dc',{shine:30}),10); P(c,-W*.38+i*.42,.9,-D*.42); g.add(c); const r=cyl(.19,.19,.14,M('#e53935'),10); P(r,-W*.38+i*.42,1.65,-D*.42); g.add(r); C.smoke.push([-W*.38+i*.42,1.9,-D*.42,'#ffffff',.8]); }
    for(let i=0;i<3;i++){ const tbx=box(.3,.35,.25,M('#78909c')); P(tbx,W*.28,.18,-D*.3+i*.35); g.add(tbx); }
    if(lv>=4) for(let i=0;i<Math.min(4,lv-3);i++){ const sp=box(.5,.03,.32,M('#1a237e',{shine:120,spec:0xffffff})); sp.rotation.x=-.4; P(sp,-W*.3+(i%2)*.6,.25,D*.18+Math.floor(i/2)*.4); g.add(sp); }
    if(lv>=6){ const tw=cyl(.04,.06,2,M('#eceff1'),6); P(tw,W*.36,1,D*.36); g.add(tw); const bl=new THREE.Group(); for(let i=0;i<3;i++){ const h=new THREE.Group(); const bb=box(.05,.6,.02,M('#ffffff')); bb.position.y=.3; h.rotation.z=i*Math.PI*2/3; h.add(bb); bl.add(h);} P(bl,W*.36,2,D*.36+.05); spinner(C,bl,'z',2.5); } },
  station2(C){ const {g,W,D,lv}=C; const w=W*.7, d=D*.55, bays=lv>=3?2:1; const walls=rbox(w,1.3,d,.08,M('#e0523c',{shine:40})); P(walls,0,.65,-.25); g.add(walls);
    const roof=rbox(w+.2,.18,d+.2,.06,M('#56687a')); P(roof,0,1.38,-.25); g.add(roof); const tr=rbox(w+.22,.07,d+.22,.03,M(trimFor(lv))); P(tr,0,1.27,-.25); g.add(tr);
    for(let i=0;i<2;i++){ const x=-w/4+i*w/2; const dr=box(w*.4,.9,.04,i<bays?texMat('door',()=>stripeTex('#f5f5f5','#cfd4da',10),{shine:60}):M('#a3362a')); P(dr,x,.47,-.25+d/2+.03); g.add(dr); }
    sign(C,'STATION 2',1.2,0,1.12,-.25+d/2+.05,{bg:'#1e2a38',size:66}); wins(g,w,d,.8,0,2,.26); const ap=box(w,.03,D*.4,M('#d6d0c4')); P(ap,0,.02,D*.28); g.add(ap);
    truckM(g,-w/4,D*.3,-Math.PI/2,.4); if(lv>=3) truckM(g,w/4,D*.3,-Math.PI/2,.4); blinker(C,w*.4,1.5,-.25,0xff1744,6); flagPole(C,W*.42,-D*.35,2,'#ffcc33'); },
  training(C){ const {g,W,D,lv}=C; const fl=2+Math.min(3,lv>>1), fh=.55; for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const p=box(.06,fl*fh,.06,M('#c2412f')); P(p,-W*.25+a*.3,fl*fh/2,-D*.25+b*.3); g.add(p); }
    for(let f=1;f<=fl;f++){ const fl1=box(.66,.05,.66,M('#9e9e9e')); P(fl1,-W*.25,f*fh,-D*.25); g.add(fl1); } const lad=box(.25,fl*fh,.04,M('#ffcc33')); lad.rotation.x=-.12; P(lad,-W*.25,fl*fh/2,-D*.25+.38); g.add(lad);
    const cont=rbox(.9,.5,.45,.04,M('#795548')); P(cont,W*.22,.25,-D*.2); g.add(cont); const fl2=new THREE.Mesh(new THREE.ConeGeometry(.16,.5,7),new THREE.MeshPhongMaterial({color:'#ff9800',emissive:'#ff5722',emissiveIntensity:1,transparent:true,opacity:.9})); fl2.userData.keep=true; P(fl2,W*.22,.75,-D*.2); C.A.add(fl2); C.anim.push(t=>{ fl2.scale.set(1+Math.sin(t*13)*.15,1+Math.sin(t*9)*.3,1); }); C.smoke.push([W*.22,1,-D*.2,'#616161',1.2]);
    for(let i=0;i<5;i++){ const c=new THREE.Mesh(new THREE.ConeGeometry(.07,.22,8),M('#ff6d00')); c.castShadow=true; P(c,-W*.4+i*.35,.11,D*.35); g.add(c); }
    const hose=new THREE.Mesh(new THREE.TorusGeometry(.2,.04,5,12),M('#e53935')); hose.rotation.x=Math.PI/2; P(hose,W*.32,.05,D*.3); g.add(hose); if(lv>=4) carM(g,W*.1,D*.15,'#78909c',.5,.45); person(g,-W*.05,D*.05,'#c9a762',.6); },
  hazdepot(C){ const {g,W,D,lv}=C; const w=W*.65, d=D*.5; const b=rbox(w,1,d,.06,M('#f2f2ee')); P(b,-.1,.5,-.25); g.add(b); const band=box(w+.02,.25,d+.02,TT('hz',()=>{ const t=hazardTex(); t.repeat.set(4,1); return new THREE.MeshPhongMaterial({map:t}); })); P(band,-.1,.25,-.25); g.add(band);
    const r=rbox(w+.15,.12,d+.15,.04,M('#2f8f4f')); P(r,-.1,1.06,-.25); g.add(r); const dia=new THREE.Mesh(new THREE.PlaneGeometry(.45,.45),M('#ff8f00')); dia.rotation.z=Math.PI/4; P(dia,-.4,.65,-.25+d/2+.03); g.add(dia);
    for(let i=0;i<Math.min(8,3+lv);i++){ const dr=cyl(.12,.12,.34,M(['#1e88e5','#43a047','#ffb300'][i%3],{shine:80}),10); P(dr,W*.32+(i%2)*.26,.17,-D*.38+Math.floor(i/2)*.26); g.add(dr); }
    if(lv>=3){ const tent=new THREE.Mesh(new THREE.ConeGeometry(.5,.6,4),M('#ffeb3b',{shine:30})); tent.castShadow=true; tent.rotation.y=Math.PI/4; P(tent,-W*.3,.3,D*.3); g.add(tent); } truckM(g,W*.1,D*.33,0,.38,'#f5f5f5'); },
  rescuebase(C){ const {g,W,D,lv}=C; const w=W*.65, d=D*.5; const b=rbox(w,1.1,d,.06,M('#f39c12')); P(b,-.1,.55,-.25); g.add(b); const r=rbox(w+.15,.12,d+.15,.04,M('#37474f')); P(r,-.1,1.16,-.25); g.add(r);
    const dr=box(w*.5,.8,.04,texMat('rd',()=>stripeTex('#eceff1','#b0bec5',8),{shine:60})); P(dr,-.1,.42,-.25+d/2+.03); g.add(dr); sign(C,'RESCUE',.9,-.1,.98,-.25+d/2+.05,{bg:'#37474f',size:80});
    truckM(g,0,D*.33,0,.4,'#1565c0'); const tw=box(.08,1.8,.08,M('#90a4ae')); P(tw,W*.38,.9,-D*.36); g.add(tw); const rope=box(.02,1.4,.02,M('#ff7043')); P(rope,W*.38+.3,.9,-D*.36); g.add(rope); const arm=box(.4,.06,.06,M('#90a4ae')); P(arm,W*.38+.15,1.78,-D*.36); g.add(arm);
    if(lv>=4){ const crane=box(1,.08,.08,M('#ffca28')); crane.rotation.z=.6; P(crane,-W*.35,.6,D*.3); g.add(crane); } if(lv>=6) carM(g,W*.35,D*.05,'#90a4ae',.4,.45); },
  helipad(C){ const {g,W,D,lv}=C; const pad=cyl(W*.4,W*.42,.08,M('#9e9e9e'),24); P(pad,W*.05,.04,D*.05); g.add(pad);
    const ht=new THREE.Mesh(new THREE.CircleGeometry(W*.36,24),TT('hpad',()=>{ const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d'); x.fillStyle='#616161'; x.fillRect(0,0,256,256); x.strokeStyle='#ffeb3b'; x.lineWidth=14; x.beginPath(); x.arc(128,128,110,0,7); x.stroke(); x.fillStyle='#ffffff'; x.font='bold 150px Arial'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('H',128,138); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return new THREE.MeshPhongMaterial({map:t}); }));
    ht.rotation.x=-Math.PI/2; P(ht,W*.05,.09,D*.05); g.add(ht); if(lv>=3){ const hg=rbox(.9,.8,.8,.05,M('#cfd8dc')); P(hg,-W*.36,.4,-D*.36); g.add(hg); } const ft=cyl(.18,.18,.5,M('#e53935'),10); ft.rotation.z=Math.PI/2; P(ft,-W*.38,.2,D*.38); g.add(ft);
    // windsock
    const ws=box(.03,1.1,.03,M('#eee')); P(ws,W*.42,.55,-D*.42); g.add(ws); const sock=new THREE.Mesh(new THREE.ConeGeometry(.08,.4,8,1,true),M('#ff6d00')); sock.rotation.z=Math.PI/2; const sp=new THREE.Group(); sp.userData.keep=true; sock.position.x=.2; sp.add(sock); P(sp,W*.42,1.05,-D*.42); C.A.add(sp); C.anim.push(t=>{ sp.rotation.y=Math.sin(t*.7)*.8; });
    // the water bomber
    const heli=new THREE.Group(); heli.userData.keep=true; const body=sph(.32,M('#d32f2f',{shine:90}),12); body.scale.set(1.5,1,1); P(body,0,.4,0); const win=sph(.22,M('#bfe8ff',{shine:120}),10); win.scale.set(1,.8,.9); P(win,.25,.48,0);
    const tail=box(.9,.08,.08,M('#d32f2f')); P(tail,-.7,.5,0); const fin=box(.08,.3,.04,M('#ffffff')); P(fin,-1.12,.6,0); const sk1=box(.8,.03,.04,M('#333')); P(sk1,0,.06,.2); const sk2=sk1.clone(); P(sk2,0,.06,-.2);
    const bucket=cyl(.12,.08,.18,M('#ff9800'),8); P(bucket,0,-.35,0); const rope=box(.01,.4,.01,M('#333')); P(rope,0,-.1,0); heli.add(body,win,tail,fin,sk1,sk2); if(lv>=2) heli.add(bucket,rope);
    const rot=new THREE.Group(); for(let i=0;i<2;i++){ const bl=box(1.5,.02,.08,M('#212121')); bl.rotation.y=i*Math.PI/2; rot.add(bl);} P(rot,0,.75,0); heli.add(rot); P(heli,W*.05,.1,D*.05); C.A.add(heli);
    const home=heli.position.clone(); C.anim.push((t,dt)=>{ const cyc=(t+3)%38; rot.rotation.y+=dt*(cyc<26?28:4); let y=0, ox=0, oz=0;
      if(cyc<3) y=cyc*.8; else if(cyc<23){ y=2.4+Math.sin(t)*.15; const a=(cyc-3)/20*Math.PI*2; ox=Math.sin(a)*3; oz=(1-Math.cos(a))*-2; heli.rotation.y=-a; } else if(cyc<26) y=(26-cyc)*.8; else heli.rotation.y=0;
      heli.position.set(home.x+ox,home.y+y,home.z+oz); }); },
  comms(C){ const {g,W,D,lv}=C; const h=2+lv*.35; for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const l=cyl(.02,.03,h,M('#eceff1',{shine:90}),5); l.rotation.z=-a*.05; l.rotation.x=b*.05; P(l,a*.2,h/2,b*.2); g.add(l); }
    for(let i=1;i<Math.floor(h/.4);i++){ const y=i*.4; const s=.2*(1-y/h*.5); for(const rz of [0,Math.PI/2]){ const cb=box(s*2.1,.02,.02,M('#eceff1')); cb.rotation.y=rz; P(cb,0,y,0); g.add(cb);} }
    const dish=new THREE.Mesh(new THREE.SphereGeometry(.25,12,6,0,Math.PI*2,0,Math.PI/2.6),M('#ffffff',{shine:90})); dish.material.side=THREE.DoubleSide; dish.rotation.x=-1.1; dish.rotation.z=.6; P(dish,.18,h*.7,.18); g.add(dish);
    if(lv>=4){ const d2=dish.clone(); d2.rotation.z=-.8; P(d2,-.2,h*.5,.15); g.add(d2); } const hut=rbox(.6,.45,.5,.05,M('#cfd8dc')); P(hut,W*.15,.22,D*.2); g.add(hut); blinker(C,0,h+.08,0,0xff1744,3); },
  park(C){ const {g,W,D,lv}=C; const lawn=box(W,.06,D,M('#7cc957',{shine:5})); P(lawn,0,.03,0); g.add(lawn); const pth=box(W,.07,.3,M('#e7dcc0')); P(pth,0,.04,0); g.add(pth); const pth2=box(.3,.07,D,M('#e7dcc0')); P(pth2,0,.04,0); g.add(pth2);
    const base=cyl(.42,.46,.18,M('#b0bec5'),16); P(base,0,.12,0); g.add(base); const pool=cyl(.36,.36,.04,M('#4fc3f7',{shine:120,em:0x0d47a1,ei:.2}),16); P(pool,0,.21,0); g.add(pool);
    const jet=cyl(.03,.08,.5,new THREE.MeshPhongMaterial({color:'#b3e5fc',transparent:true,opacity:.75,shininess:120}),8); jet.userData.keep=true; P(jet,0,.45,0); C.A.add(jet); C.anim.push(t=>{ const k=1+Math.sin(t*4)*.2; jet.scale.set(1,k,1); jet.position.y=.2+.25*k; });
    tree(g,-W*.32,-D*.32,.8,1); tree(g,W*.32,-D*.32,.75); tree(g,-W*.32,D*.32,.7); if(lv>=2) tree(g,W*.32,D*.32,.8,1);
    for(const [x,z,r] of [[-W*.2,.28,0],[W*.2,-.28,0]]){ const s=box(.4,.04,.12,M('#8d6e63')); P(s,x,.2,z); const bk=box(.4,.14,.03,M('#8d6e63')); P(bk,x,.3,z+(z>0?.06:-.06)); g.add(s,bk); }
    if(lv>=3) for(let i=0;i<6;i++){ const f=sph(.07,M(['#e91e63','#ffeb3b','#ab47bc'][i%3]),5); P(f,-W*.42+i*.08,.1,D*.1); g.add(f); }
    if(lv>=4){ const rot=cyl(.35,.35,.05,M('#ffffff'),8); P(rot,W*.3,.08,D*.3); const rr=new THREE.Mesh(new THREE.ConeGeometry(.42,.3,8),M('#2e7d32')); rr.castShadow=true; P(rr,W*.3,.75,D*.3); g.add(rot,rr); for(let i=0;i<4;i++){ const p=cyl(.02,.02,.55,M('#fff'),4); P(p,W*.3+Math.cos(i*1.57)*.3,.35,D*.3+Math.sin(i*1.57)*.3); g.add(p);} }
    if(lv>=5){ const st=cyl(.12,.15,.5,M('#ffd54f',{shine:100}),8); P(st,-W*.3,.3,D*.3); const top=sph(.14,M('#ffd54f',{shine:100}),8); P(top,-W*.3,.65,D*.3); g.add(st,top); }
    person(g,W*.1,D*.18,'#43a047'); },
  bbq(C){ const {g,W,D,lv}=C; const pad=box(W,.05,D,M('#d6d0c4')); P(pad,0,.03,0); g.add(pad); for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const p=box(.05,.8,.05,M('#6d4c41')); P(p,a*W*.35,.4,b*D*.35); g.add(p); }
    const rf=gable(W*.85,D*.85,.3,texMat('iron3',()=>stripeTex('#2e7d32','#1b5e20',12,true))); P(rf,0,.8,0); g.add(rf); const bq=rbox(.4,.32,.25,.03,M('#9e9e9e',{shine:100})); P(bq,-W*.2,.16,0); g.add(bq);
    const tb=box(.35,.04,.3,M('#a1673a')); P(tb,W*.18,.26,0); g.add(tb); C.smoke.push([-W*.2,.4,0,'#eeeeee',1.6]); if(lv>=3){ const tb2=tb.clone(); P(tb2,W*.18,.26,-D*.38); g.add(tb2); } if(lv>=5){ const l=sph(.06,LAMP(),6); P(l,0,.72,0); g.add(l);} person(g,-W*.1,D*.2,'#ff7043',.5); },
  banana(C){ const {g,W,D,lv}=C; const s=.75+lv*.08; const pl=rbox(W*.6,.2,D*.4,.05,M('#bcaaa4')); P(pl,0,.1,-D*.1); g.add(pl);
    const ban=new THREE.Mesh(new THREE.TorusGeometry(1*s,.32*s,10,20,Math.PI*.75),M('#ffe135',{shine:60})); ban.castShadow=true; ban.rotation.set(0,Math.PI/4,Math.PI*.12); P(ban,0,.5,-D*.1); g.add(ban);
    const tip=new THREE.Mesh(new THREE.ConeGeometry(.12*s,.3*s,8),M('#5d4037')); P(tip,-.2,1.5*s,-D*.1); g.add(tip); const hut=rbox(.7,.55,.5,.05,M('#fff8e1')); P(hut,W*.3,.28,D*.3); g.add(hut); sign(C,'BANANAS',.7,W*.3,.72,D*.3+.26,{bg:'#f9a825',size:60});
    if(lv>=3) flagPole(C,-W*.4,D*.38,1.6,'#ffe135'); for(let i=0;i<Math.min(4,lv);i++) person(g,-W*.25+i*.22,D*.3,['#e53935','#1e88e5','#43a047','#8e24aa'][i],.55); },
  pineapple(C){ const {g,W,D,lv}=C; const s=.7+lv*.08; const pl=rbox(W*.5,.2,D*.5,.05,M('#bcaaa4')); P(pl,0,.1,-D*.1); g.add(pl);
    const pm=TT('pine',()=>{ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'); x.fillStyle='#f9a825'; x.fillRect(0,0,128,128); x.strokeStyle='#8d5b00'; x.lineWidth=5; for(let i=-128;i<256;i+=24){ x.beginPath(); x.moveTo(i,0); x.lineTo(i+128,128); x.stroke(); x.beginPath(); x.moveTo(i+128,0); x.lineTo(i,128); x.stroke(); } const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(3,2); return new THREE.MeshPhongMaterial({map:t,shininess:30}); });
    const body=new THREE.Mesh(new THREE.SphereGeometry(.6*s,14,12),pm); body.castShadow=true; body.scale.y=1.45; P(body,0,.2+.87*s,-D*.1); g.add(body);
    for(let i=0;i<7;i++){ const lf=new THREE.Mesh(new THREE.ConeGeometry(.12*s,.8*s,4),M('#2e7d32',{flat:true})); lf.castShadow=true; const a=i/7*Math.PI*2; lf.rotation.set(Math.cos(a)*.5,0,Math.sin(a)*.5); P(lf,Math.sin(a)*.1,.2+1.9*s,-D*.1+Math.cos(a)*.1); g.add(lf); }
    const hut=rbox(.7,.55,.5,.05,M('#fff8e1')); P(hut,W*.3,.28,D*.32); g.add(hut); sign(C,'PINEAPPLES',.7,W*.3,.72,D*.32+.26,{bg:'#2e7d32',size:52}); for(let i=0;i<Math.min(4,lv);i++) person(g,-W*.3+i*.22,D*.34,['#fdd835','#1e88e5','#e53935','#8e24aa'][i],.55); },
  beach(C){ const {g,W,D,lv}=C; const sand=box(W,.06,D,M('#f3dfa2',{shine:5})); P(sand,0,.03,0); g.add(sand);
    const water=box(W,.05,D*.38,new THREE.MeshPhongMaterial({color:'#29b6f6',shininess:120,transparent:true,opacity:.9,emissive:'#01579b',emissiveIntensity:.15})); water.userData.keep=true; P(water,0,.07,-D*.31); C.A.add(water);
    const foam=box(W,.03,.08,M('#ffffff')); foam.userData.keep=true; P(foam,0,.09,-D*.12); C.A.add(foam); C.anim.push(t=>{ foam.position.z=-D*.12+Math.sin(t*1.2)*.08; water.position.y=.07+Math.sin(t*1.2)*.01; });
    for(let i=0;i<Math.min(4,1+lv);i++){ const x=-W*.35+i*.45, z=D*.15+(i%2)*.3; const u=new THREE.Mesh(new THREE.ConeGeometry(.3,.16,8),M(['#e53935','#fdd835','#1e88e5','#43a047'][i])); u.castShadow=true; P(u,x,.7,z); const pl=cyl(.015,.015,.65,M('#eee'),4); P(pl,x,.35,z); const tw=box(.35,.02,.18,M(['#ff80ab','#80d8ff','#ccff90','#ffd180'][i])); P(tw,x+.15,.07,z+.15); g.add(u,pl,tw); }
    for(const x of [-W*.45,W*.45]){ const p=cyl(.015,.015,.7,M('#eee'),4); P(p,x,.35,-D*.02); g.add(p); const f=box(.2,.14,.01,TT('lsf',()=>{ const c=document.createElement('canvas'); c.width=32;c.height=32; const xx=c.getContext('2d'); xx.fillStyle='#d32f2f'; xx.fillRect(0,0,32,16); xx.fillStyle='#fdd835'; xx.fillRect(0,16,32,16); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return new THREE.MeshBasicMaterial({map:t}); })); P(f,x+.1,.62,-D*.02); g.add(f); }
    if(lv>=3){ for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const l=box(.04,.7,.04,M('#ffffff')); P(l,W*.3+a*.15,.35,D*.38+b*.12); g.add(l);} const cab=box(.4,.3,.34,M('#d32f2f')); P(cab,W*.3,.85,D*.38); g.add(cab); }
    person(g,-W*.1,D*.05,'#ff7043',.55); if(lv>=2) person(g,W*.15,-D*.05,'#29b6f6',.55); },
  gum(C){ tree(C.g,0,0,1.15,1); },
  lamp(C){ const p=cyl(.03,.04,1.3,M('#455a64'),6); P(p,0,.65,0); const arm=box(.3,.03,.03,M('#455a64')); P(arm,.13,1.3,0); const l=sph(.08,LAMP(),8); P(l,.28,1.25,0); C.g.add(p,arm,l); },
  hut(C){ const {g,W,D}=C; const b=rbox(W*.6,.6,D*.5,.05,M('#ff9800')); P(b,0,.3,-.1); g.add(b); const r=gable(W*.68,D*.6,.3,M('#5d4037')); P(r,0,.6,-.1); g.add(r); const d=box(.18,.36,.03,M('#5d4037')); P(d,.1,.18,-.1+D*.25+.02); g.add(d);
    const hh=sph(.16,M('#ffd23f',{shine:80}),10); hh.scale.y=.6; P(hh,-.2,.9,-.1); g.add(hh); const wb=box(.26,.1,.16,M('#78909c')); P(wb,W*.3,.12,D*.32); g.add(wb); person(g,-W*.28,D*.3,'#ff9800',.55); },
  /* ---------- v5 base pieces: material bands timber -> brick -> steel -> gold trim ---------- */
  pump(C){ const {g,W,D,lv}=C; const B=band(lv); const pad=rbox(W*.9,.25,D*.9,.1,M(B.base)); P(pad,0,.12,0); g.add(pad);
    const pool=cyl(W*.3,W*.3,.08,M('#4fc3f7',{em:0x0a4a6a,ei:.4}),20); P(pool,W*.15,.3,D*.15); g.add(pool); const rim=new THREE.Mesh(new THREE.TorusGeometry(W*.3,.07,6,20),M(B.trim)); rim.rotation.x=Math.PI/2; P(rim,W*.15,.32,D*.15); g.add(rim);
    const hy=cyl(.28,.32,1.0,M('#e53935'),14); P(hy,-W*.2,.75,-D*.2); const cap=sph(.3,M('#e53935'),14); cap.scale.y=.6; P(cap,-W*.2,1.25,-D*.2); const nub=cyl(.12,.12,.3,M(B.trim),10); nub.rotation.z=Math.PI/2; P(nub,-W*.2+.3,.9,-D*.2); g.add(hy,cap,nub);
    if(lv>=3){ const pipe=cyl(.08,.08,W*.5,M('#90a4ae'),8); pipe.rotation.x=Math.PI/2; pipe.rotation.z=Math.PI/4; P(pipe,0,.45,0); g.add(pipe); }
    if(lv>=6){ const hy2=cyl(.2,.24,.7,M('#ffca28'),12); P(hy2,W*.3,.6,-D*.3); g.add(hy2); }
    const wheel=new THREE.Group(); wheel.userData.keep=true; const wr=new THREE.Mesh(new THREE.TorusGeometry(.32,.06,6,16),M(lv>=7?'#ffcf33':'#455a64')); wheel.add(wr); for(let i=0;i<3;i++){ const sp=box(.6,.05,.05,M('#455a64')); sp.rotation.z=i*Math.PI/3; wheel.add(sp);} P(wheel,-W*.2,.9,-D*.2+.36); C.A.add(wheel); C.anim.push((t,dt)=>{ wheel.rotation.z+=dt*2.5; });
    const jet=new THREE.Group(); jet.userData.keep=true; for(let i=0;i<6;i++){ const d=sph(.07,M('#b3e5fc',{op:.85}),6); d.userData.k=i/6; jet.add(d);} P(jet,W*.15,.3,D*.15); C.A.add(jet);
    C.anim.push(t=>{ jet.children.forEach(d=>{ const k=(t*.9+d.userData.k)%1; d.position.set(Math.sin(d.userData.k*6.28)*k*.5,Math.sin(k*Math.PI)*1.1,Math.cos(d.userData.k*6.28)*k*.5); }); }); },
  mint(C){ const {g,W,D,lv}=C; const B=band(lv); const b=rbox(W*.75,.9+lv*.05,D*.6,.12,M(B.wall)); P(b,-.05,.5,-.15); g.add(b); const r=rbox(W*.82,.18,D*.68,.08,M(B.roof)); P(r,-.05,1.0+lv*.05,-.15); g.add(r);
    const press=rbox(.5,.6,.5,.08,M('#546e7a')); P(press,W*.22,.4,D*.25); g.add(press); const st=cyl(.18,.18,.2,M('#ffd54f',{em:0x5a3d00,ei:.3}),14); P(st,W*.22,.82,D*.25); g.add(st);
    for(let k=0;k<Math.min(8,2+lv);k++){ const c=cyl(.16,.16,.06,M('#ffca28',{em:0x4a3200,ei:.35}),12); P(c,-W*.28+(k%4)*.2,.06+Math.floor(k/4)*.07,D*.32); g.add(c);} wins(g,W*.75,D*.6,.55,2,0,.26);
    const sm=cyl(.1,.12,.6,M('#8d6e63'),8); P(sm,-W*.3,1.4,-D*.3); g.add(sm); C.smoke.push([-W*.3,1.75,-D*.3,'#eeeeee',1.1]);
    const pist=new THREE.Group(); pist.userData.keep=true; const pp=box(.18,.4,.18,M('#b0bec5')); pist.add(pp); P(pist,W*.22,1.1,D*.25); C.A.add(pist); C.anim.push(t=>{ pist.position.y=1.0+Math.abs(Math.sin(t*3))*.25; }); },
  vault(C){ const {g,W,D,lv}=C; const B=band(lv); const h=1+Math.min(lv,8)*.08; const body=rbox(W*.8,h,D*.8,.16,M(B.wall)); P(body,0,h/2,0); g.add(body);
    const door=cyl(.42,.42,.08,M(B.trim),20); door.rotation.x=Math.PI/2; P(door,0,h*.5,D*.4+.02); g.add(door); const hub=cyl(.12,.12,.12,M('#37474f'),10); hub.rotation.x=Math.PI/2; P(hub,0,h*.5,D*.4+.06); g.add(hub);
    for(let i=0;i<4;i++){ const sp=box(.5,.05,.05,M('#37474f')); sp.rotation.z=i*Math.PI/4; P(sp,0,h*.5,D*.4+.08); g.add(sp);} for(const a of [-1,1]){ const rv=box(.08,h*.8,.08,M(B.trim)); P(rv,a*W*.38,h/2,D*.4); g.add(rv); }
    const n=Math.min(10,2+lv); for(let k=0;k<n;k++){ const c=sph(.16,M('#ffca28',{em:0x4a3200,ei:.4}),8); c.scale.y=.45; P(c,(k%4-1.5)*.26,h+.05+Math.floor(k/4)*.1,((k*7)%3-1)*.22); g.add(c);} if(lv>=5){ const gb=rbox(.4,.22,.25,.05,M('#ffd54f',{em:0x5a3d00,ei:.4})); P(gb,0,h+.32,0); g.add(gb);} },
  tank(C){ const {g,W,D,lv}=C; const B=band(lv); const h=1.1+Math.min(lv,8)*.1, r=W*.36; const t=cyl(r,r,h,M(lv>=5?'#90caf9':'#64b5f6'),22); P(t,0,h/2+.15,0); g.add(t);
    for(let k=0;k<3;k++){ const bd=cyl(r+.03,r+.03,.07,M(B.trim),22); P(bd,0,.25+k*h*.42,0); g.add(bd);} const lid=cyl(r*.9,r+.04,.18,M(B.roof),22); P(lid,0,h+.24,0); g.add(lid); const ft=rbox(W*.9,.15,D*.9,.06,M(B.base)); P(ft,0,.08,0); g.add(ft);
    const gauge=box(.12,h*.7,.04,M('#ffffff')); P(gauge,0,h/2+.15,r+.02); g.add(gauge); const lvlb=box(.08,h*.5,.05,M('#29b6f6',{em:0x05507a,ei:.5})); P(lvlb,0,h*.4+.15,r+.03); g.add(lvlb);
    const lad=box(.06,h,.06,M('#455a64')); P(lad,r*.7,h/2+.15,r*.7); g.add(lad); const fl=new THREE.Group(); fl.userData.keep=true; const pole=box(.03,.5,.03,M('#eee')); P(pole,0,.25,0); const flg=box(.3,.18,.02,M('#29b6f6')); P(flg,.15,.42,0); fl.add(pole,flg); P(fl,0,h+.3,0); C.A.add(fl); C.anim.push(t=>{ flg.rotation.y=Math.sin(t*3)*.4; }); },
  cannon(C){ const {g,W,D,lv}=C; const B=band(lv); const base=rbox(W*.82,.4,D*.82,.14,M(B.base)); P(base,0,.2,0); g.add(base); const ring=cyl(W*.32,W*.36,.2,M(B.trim),20); P(ring,0,.5,0); g.add(ring);
    const head=new THREE.Group(); head.userData.keep=true; const hb=cyl(.42,.48,.6,M('#e53935'),16); P(hb,0,.3,0); const dome=sph(.42,M('#e53935'),16); dome.scale.y=.6; P(dome,0,.62,0); head.add(hb,dome);
    const nb=lv>=5?2:1; for(let k=0;k<nb;k++){ const bar=cyl(.13,.17,.95,M(lv>=7?'#ffcf33':'#cfd8dc'),12); bar.rotation.x=Math.PI/2; P(bar,(nb>1?(k-.5)*.28:0),.42,.55); const tip=cyl(.17,.17,.12,M('#37474f'),12); tip.rotation.x=Math.PI/2; P(tip,(nb>1?(k-.5)*.28:0),.42,1.02); head.add(bar,tip); }
    if(lv>=3){ const cap=cyl(.1,.1,.18,M(B.trim),8); P(cap,0,.9,0); head.add(cap);} P(head,0,.6,0); C.A.add(head); C.head=head; C.anim.push(t=>{ if(!head.userData.aim) head.rotation.y=Math.sin(t*.4)*1.2; }); },
  sprinkler(C){ const {g,W,D,lv}=C; const B=band(lv); const h=1.4+Math.min(lv,8)*.14; for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const l=cyl(.06,.08,h,M(B.base),6); l.rotation.z=a*.08; l.rotation.x=-b*.08; P(l,a*W*.26,h/2,b*D*.26); g.add(l); }
    for(let y=.5;y<h;y+=.6){ const r=box(W*.55,.05,.05,M(B.base)); P(r,0,y,D*.26); g.add(r); const r2=r.clone(); P(r2,0,y,-D*.26); g.add(r2);} const pl=rbox(W*.66,.16,D*.66,.06,M(B.trim)); P(pl,0,h,0); g.add(pl);
    const tk=cyl(.38,.38,.5,M('#4fc3f7'),16); P(tk,0,h+.33,0); g.add(tk); const pad=rbox(W*.9,.12,D*.9,.05,M('#b0bec5')); P(pad,0,.06,0); g.add(pad);
    const head=new THREE.Group(); head.userData.keep=true; const hub=cyl(.1,.1,.3,M('#455a64'),8); head.add(hub); const na=lv>=4?4:2; for(let i=0;i<na;i++){ const arm=box(.9,.06,.06,M('#cfd8dc')); arm.rotation.y=i*Math.PI/na; head.add(arm); }
    P(head,0,h+.7,0); C.A.add(head); C.head=head; C.spin=head; C.anim.push((t,dt)=>{ head.rotation.y+=dt*(head.userData.aim?9:1.5); }); },
  mortar(C){ const {g,W,D,lv}=C; const B=band(lv); const bk=cyl(W*.4,W*.44,.55,M(B.wall),18); P(bk,0,.28,0); g.add(bk); const sb=new THREE.Mesh(new THREE.TorusGeometry(W*.4,.09,6,18),M(B.trim)); sb.rotation.x=Math.PI/2; P(sb,0,.56,0); g.add(sb);
    for(let k=0;k<6;k++){ const s=sph(.18,M('#d7ccc8'),8); s.scale.y=.6; const a=k/6*6.28; P(s,Math.cos(a)*W*.47,.12,Math.sin(a)*W*.47); g.add(s);} 
    const head=new THREE.Group(); head.userData.keep=true; const bar=cyl(.32,.26,.8,M(lv>=6?'#ffcf33':'#5d6d7e'),14); bar.rotation.x=-.6; P(bar,0,.4,.1); const mz=new THREE.Mesh(new THREE.TorusGeometry(.32,.07,6,14),M('#37474f')); mz.rotation.x=Math.PI/2-.6; P(mz,0,.72,.32); const foam=sph(.22,M('#ffffff'),10); P(foam,0,.78,.36); head.add(bar,mz,foam);
    P(head,0,.55,0); C.A.add(head); C.head=head; C.anim.push(t=>{ foam.scale.setScalar(.9+Math.sin(t*4)*.12); }); },
  bomber(C){ const {g,W,D,lv}=C; const B=band(lv); const pad=rbox(W*.9,.3,D*.9,.12,M(B.base)); P(pad,0,.15,0); g.add(pad); const hp=cyl(W*.34,W*.34,.05,M('#ffca28'),20); P(hp,0,.32,0); g.add(hp); const hc=cyl(W*.28,W*.28,.06,M(B.base),20); P(hc,0,.34,0); g.add(hc);
    for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const l=sph(.1,M('#ff5252',{em:0xaa0000,ei:.6}),6); P(l,a*W*.4,.36,b*D*.4); g.add(l);} if(lv>=4){ const rad=cyl(.06,.08,1,M('#90a4ae'),6); P(rad,W*.38,.8,-D*.38); const dish=sph(.25,M(B.trim),10); dish.scale.z=.35; P(dish,W*.38,1.35,-D*.38); g.add(rad,dish); }
    const head=new THREE.Group(); head.userData.keep=true; const body=sph(.34,M('#ff7043'),12); body.scale.set(1,.8,1.5); P(body,0,.55,0); const win=sph(.22,M('#bfe8ff'),10); P(win,0,.65,.32); const tail=box(.08,.08,.8,M('#ff7043')); P(tail,0,.6,-.65); const fin=box(.04,.3,.2,M(B.trim)); P(fin,0,.75,-1.0);
    const bk=cyl(.12,.09,.2,M('#29b6f6'),8); P(bk,0,.22,0); head.add(body,win,tail,fin,bk); const rot=new THREE.Group(); for(let i=0;i<2;i++){ const bl=box(1.5,.03,.1,M('#263238')); bl.rotation.y=i*Math.PI/2; rot.add(bl);} P(rot,0,.95,0); head.add(rot);
    P(head,0,.35,0); C.A.add(head); C.head=head; C.anim.push((t,dt)=>{ rot.rotation.y+=dt*(head.userData.aim?30:8); head.position.y=.35+(head.userData.aim?.5+Math.sin(t*3)*.1:Math.sin(t*2)*.05); }); },
  wall(C){ const {g,lv}=C; const B=band(lv), m=M(lv>=7?'#5d6d7e':B.wall), cap=M(B.trim); const ph=.75+Math.min(lv,8)*.03; const post=rbox(.85,ph,.85,.14,m); P(post,0,ph/2,0); g.add(post); const pc=rbox(.95,.14,.95,.06,cap); P(pc,0,ph+.05,0); g.add(pc);
    const mk=C.mask||0; const dirs=[[1,0,1],[-1,0,2],[0,1,4],[0,-1,8]]; for(const [a,b,bit] of dirs){ if(!(mk&bit)) continue; const seg=rbox(a?1.2:.62,ph*.82,a?.62:1.2,.1,m); P(seg,a*.6+(a?0:0),ph*.41,b*.6); g.add(seg); const sc=box(a?1.2:.7,.1,a?.7:1.2,cap); P(sc,a*.6,ph*.82+.03,b*.6); g.add(sc); }
    if(lv>=5){ const sp=new THREE.Mesh(new THREE.ConeGeometry(.12,.3,6),M('#cfd8dc')); P(sp,0,ph+.27,0); g.add(sp);} },
  trap(C){ const {g,lv}=C; const pl=cyl(.55,.6,.08,M('#455a64'),12); P(pl,0,.04,0); const btn=cyl(.25,.28,.12,M('#ff5252',{em:0x880000,ei:.4}),12); P(btn,0,.12,0); g.add(pl,btn); for(let k=0;k<4;k++){ const s=box(.25,.02,.08,M('#ffd400')); s.rotation.y=k*Math.PI/2; P(s,Math.cos(k*Math.PI/2)*.42,.09,Math.sin(k*Math.PI/2)*.42); g.add(s);} },
  barracks(C){ const {g,W,D,lv}=C; const B=band(lv); const bw=W*.62, bd=D*.5; const b=rbox(bw,.85,bd,.1,M(B.wall)); P(b,-.15,.43,-.2); g.add(b); const r=gable(bw+.15,bd+.2,.55,M('#c62828')); P(r,-.15,.86,-.2); g.add(r);
    const dr=box(.36,.55,.04,M('#5d4037')); P(dr,-.15,.28,-.2+bd/2+.02); g.add(dr); wins(g,bw,bd,.55,2,0,.24); const yard=rbox(W*.95,.06,D*.95,.03,M('#d7ccc8')); P(yard,0,.03,0); g.add(yard);
    for(let k=0;k<Math.min(4,1+(lv>>1));k++){ const cone=new THREE.Mesh(new THREE.ConeGeometry(.08,.25,8),M('#ff7a1a')); cone.castShadow=true; P(cone,W*.1+k*.25,.13,D*.35); g.add(cone);} if(lv>=3){ const t2=rbox(.6,.5,.6,.08,M(B.trim)); P(t2,W*.3,.25,-D*.3); g.add(t2);} 
    const fl=new THREE.Group(); fl.userData.keep=true; const pole=cyl(.03,.03,1.6,M('#eeeeee'),6); P(pole,0,.8,0); const flg=new THREE.Mesh(new THREE.PlaneGeometry(.6,.36,6,1),M('#ff5722')); flg.material.side=THREE.DoubleSide; P(flg,.3,1.4,0); fl.add(pole,flg); P(fl,W*.38,0,D*.05); C.A.add(fl);
    const fp=flg.geometry.attributes.position, fb=fp.array.slice(); C.anim.push(t=>{ for(let i=0;i<fp.count;i++){ const x=fb[i*3]+.3; fp.array[i*3+2]=Math.sin(x*6-t*6)*.08*x; } fp.needsUpdate=true; }); },
  lab(C){ const {g,W,D,lv}=C; const B=band(lv); const b=rbox(W*.7,.8,D*.6,.1,M(B.wall)); P(b,-.1,.4,-.15); g.add(b); const dome=sph(.55,M('#b3e5fc',{op:.75}),16); dome.scale.y=.75; P(dome,-.1,.85,-.15); g.add(dome);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.56,.06,6,18),M(B.trim)); ring.rotation.x=Math.PI/2; P(ring,-.1,.82,-.15); g.add(ring); wins(g,W*.7,D*.6,.45,3,1,.22);
    const fk=new THREE.Group(); fk.userData.keep=true; const fb=sph(.22,M('#76ff03',{em:0x2a6a00,ei:.6}),10); const neck=cyl(.06,.06,.25,M('#e0f7fa'),8); P(neck,0,.25,0); fk.add(fb,neck); P(fk,-.1,.95,-.15); C.A.add(fk);
    const bub=new THREE.Group(); bub.userData.keep=true; for(let i=0;i<4;i++){ const s=sph(.06,M('#ccff90',{op:.8}),6); s.userData.k=i/4; bub.add(s);} P(bub,-.1,1.15,-.15); C.A.add(bub); C.anim.push(t=>{ fb.scale.setScalar(1+Math.sin(t*5)*.06); bub.children.forEach(s=>{ const k=(t*.6+s.userData.k)%1; s.position.set(Math.sin(k*9)*.08,k*.8,0); s.scale.setScalar(1-k*.6); }); });
    if(lv>=4){ const ant=cyl(.03,.03,.9,M('#90a4ae'),6); P(ant,W*.25,1.1,-D*.25); g.add(ant);} },
  hq(C){ const {g,W,D,lv}=C; const B=band(lv); const w=W*.82, d=D*.62, f=1+Math.min(3,lv>>1+0), fh=.9; const plinth=rbox(W*.96,.25,D*.96,.12,M(B.base)); P(plinth,0,.12,0); g.add(plinth);
    const body=rbox(w,f*fh+.3,d,.14,M(lv>=5?'#c62828':'#e0523c')); P(body,0,(f*fh+.3)/2+.2,-D*.12); g.add(body); const roof=rbox(w+.2,.2,d+.2,.08,M(B.roof)); P(roof,0,f*fh+.6,-D*.12); g.add(roof);
    for(let k=0;k<3;k++){ const bay=rbox(w*.26,.95,.08,.05,M('#eceff1')); P(bay,(k-1)*w*.32,.68,-D*.12+d/2+.03); g.add(bay); for(let s=0;s<4;s++){ const ln=box(w*.24,.03,.09,M('#b0bec5')); P(ln,(k-1)*w*.32,.35+s*.22,-D*.12+d/2+.04); g.add(ln);} }
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(w*.6,.32),signMat('HQ',{bg:'#b71c1c',size:80,w:256,h:96})); P(sign,0,1.35,-D*.12+d/2+.03); g.add(sign); wins(g,w,d,1.0+fh*(f-1)*.6,0,3,.3);
    const th=f*fh+1.6+lv*.12; const tw=rbox(.9,th,.9,.1,M(B.wall)); P(tw,w*.38,th/2+.2,-D*.35); g.add(tw); const tr=hipRoof(1.1,1.1,.6,M(B.roof)); P(tr,w*.38,th+.5,-D*.35); g.add(tr); if(lv>=4){ const gt=sph(.15,M('#ffcf33',{em:0x6a4a00,ei:.4}),10); P(gt,w*.38,th+.9,-D*.35); g.add(gt);} 
    const sir=new THREE.Group(); sir.userData.keep=true; const lt=sph(.16,M('#ff1744',{em:0xff1744,ei:.8}),10); sir.add(lt); P(sir,w*.38,th+.22,-D*.35+.5); C.A.add(sir); C.anim.push(t=>{ lt.material.emissiveIntensity=Math.sin(t*6)>0?1.2:.2; });
    const fl=new THREE.Group(); fl.userData.keep=true; const pole=cyl(.04,.04,2,M('#eeeeee'),6); P(pole,0,1,0); const flg=new THREE.Mesh(new THREE.PlaneGeometry(.8,.5,6,1),M('#ffca28')); flg.material.side=THREE.DoubleSide; P(flg,.4,1.7,0); fl.add(pole,flg); P(fl,-w*.42,.2,D*.38); C.A.add(fl);
    const fp=flg.geometry.attributes.position, fb=fp.array.slice(); C.anim.push(t=>{ for(let i=0;i<fp.count;i++){ const x=fb[i*3]+.4; fp.array[i*3+2]=Math.sin(x*6-t*5)*.1*x; } fp.needsUpdate=true; });
    C.smoke.push([-w*.3,f*fh+.8,-D*.3,'#eeeeee',1.4]); },
  road(C){},
};

/* ---------- the layer ---------- */
export class TownLayer {
  constructor(base, cb){ this.base=base; this.s=base.scene; this.cb=cb||{}; this.objs=new Map(); this.hits=[]; this.mode=null; this.place=null; this.cars=[]; this.walkers=[]; this.lampOn=0; this.t=0;
    base.town=this; base.bounds={u0:-26,u1:26,v0:-30,v1:36}; base.updateCam();
    this.g=new THREE.Group(); this.s.add(this.g);
    // ground canvas covering the grid
    const cv=this.cv=document.createElement('canvas'); cv.width=cv.height=1024; this.gtex=new THREE.CanvasTexture(cv); this.gtex.colorSpace=THREE.SRGBColorSpace; this.gtex.anisotropy=4;
    const gm=new THREE.Mesh(new THREE.PlaneGeometry(GRID*CELL,GRID*CELL),new THREE.MeshPhongMaterial({map:this.gtex,shininess:4})); gm.rotation.x=-Math.PI/2; gm.position.y=GY-.03; gm.receiveShadow=true; this.s.add(gm); this.ground=gm;
    this.plane=new THREE.Plane(new THREE.Vector3(0,1,0),-GY); this.makeBush(); this.roadG=new THREE.Group(); this.s.add(this.roadG);
    this.sel=new THREE.Group(); const sm=new THREE.MeshBasicMaterial({color:'#ffffff'}); for(let i=0;i<4;i++){ const b=new THREE.Mesh(new THREE.BoxGeometry(1,.06,.08),sm); this.sel.add(b);} this.sel.visible=false; this.s.add(this.sel);
    this.ghost=new THREE.Group(); this.s.add(this.ghost); this.tiles=[]; for(let i=0;i<9;i++){ const t=new THREE.Mesh(new THREE.PlaneGeometry(CELL*.94,CELL*.94),new THREE.MeshBasicMaterial({color:'#4caf50',transparent:true,opacity:.55,depthWrite:false})); t.rotation.x=-Math.PI/2; t.visible=false; this.s.add(t); this.tiles.push(t); }
    base.hook={ down:(x,y)=>this.hDown(x,y), move:(x,y)=>this.hMove(x,y), up:()=>this.hUp() };
    this.dayKey=''; }
  /* --- ground --- */
  drawGround(S){ const x=this.cv.getContext('2d'), px=1024/(GRID*CELL), cs=CELL*px; const own=new Set(S.tw.plots), rnd=mulberry(3);
    x.fillStyle='#8f9d4f'; x.fillRect(0,0,1024,1024);
    for(let j=0;j<GRID;j++) for(let i=0;i<GRID;i++){ const k=Math.floor(i/CHUNK)+','+Math.floor(j/CHUNK); const o=own.has(k);
      x.fillStyle=o?((i+j)%2?'#7fcf55':'#76c64d'):((i*7+j*3)%5?'#97a352':'#8c9a4b'); x.fillRect(i*cs,j*cs,cs+1,cs+1);
      for(let n=0;n<(o?5:9);n++){ x.fillStyle=o?'rgba(40,110,30,.18)':(rnd()<.5?'rgba(120,90,40,.25)':'rgba(70,90,30,.3)'); x.beginPath(); x.arc(i*cs+rnd()*cs,j*cs+rnd()*cs,o?1.5+rnd()*2:2+rnd()*4,0,7); x.fill(); } }
    if(this.mode==='place'||this.mode==='move'){ x.strokeStyle='rgba(255,255,255,.35)'; x.lineWidth=1.5; for(let i=0;i<=GRID;i++){ x.beginPath(); x.moveTo(i*cs,0); x.lineTo(i*cs,1024); x.stroke(); x.beginPath(); x.moveTo(0,i*cs); x.lineTo(1024,i*cs); x.stroke(); } }
    // plot borders
    x.lineWidth=4; for(const k of own){ const [cx,cy]=k.split(',').map(Number); x.strokeStyle='rgba(255,255,255,.55)'; for(const [dx,dy,x0,y0,x1,y1] of [[0,-1,0,0,1,0],[0,1,0,1,1,1],[-1,0,0,0,0,1],[1,0,1,0,1,1]]) if(!own.has((cx+dx)+','+(cy+dy))){ x.beginPath(); x.moveTo((cx+x0)*CHUNK*cs,(cy+y0)*CHUNK*cs); x.lineTo((cx+x1)*CHUNK*cs,(cy+y1)*CHUNK*cs); x.stroke(); } }
    if(this.mode==='expand') for(const p of this.cb.buyable()){ x.fillStyle='rgba(255,213,79,.35)'; x.fillRect(p.cx*CHUNK*cs,p.cy*CHUNK*cs,CHUNK*cs,CHUNK*cs); x.strokeStyle='#ffd54f'; x.lineWidth=5; x.strokeRect(p.cx*CHUNK*cs+3,p.cy*CHUNK*cs+3,CHUNK*cs-6,CHUNK*cs-6); }
    this.gtex.needsUpdate=true; this.hideBush(own); }
  makeBush(){ const rnd=mulberry(11); const pts=[];
    for(let j=0;j<GRID;j++) for(let i=0;i<GRID;i++){ if(rnd()>.42) continue; const x=-HALF+(i+.2+rnd()*.6)*CELL, z=-HALF+(j+.2+rnd()*.6)*CELL; const u=(x-z)*SQ, v=(x+z)*SQ; if(Math.abs(u)<8&&v>-16&&v<16) continue; if(Math.abs(u)<3&&v>13) continue; pts.push({x,z,k:Math.floor(i/CHUNK)+','+Math.floor(j/CHUNK),s:.6+rnd()*.7,g:rnd()<.35}); }
    for(let n=0;n<420;n++){ const x=(rnd()*2-1)*48, z=(rnd()*2-1)*48; if(Math.abs(x)<HALF+.5&&Math.abs(z)<HALF+.5) continue; const u=(x-z)*SQ, v=(x+z)*SQ; if(Math.abs(u)<3.2&&v>13) continue; pts.push({x,z,k:null,s:.7+rnd()*.8,g:rnd()<.35}); }
    this.bush=pts; const n=pts.length; const trunkG=new THREE.CylinderGeometry(.08,.12,.8,5); trunkG.translate(0,.4,0); const canG=new THREE.IcosahedronGeometry(.6,0); canG.translate(0,1.15,0);
    const tm=new THREE.InstancedMesh(trunkG,M('#7a4b2a'),n), cm=new THREE.InstancedMesh(canG,new THREE.MeshPhongMaterial({flatShading:true,shininess:8}),n); tm.castShadow=cm.castShadow=true; cm.receiveShadow=true;
    const cols=['#3f9d3a','#4caf50','#2e8b3e','#6f8f4e','#5b8a3c'].map(c=>new THREE.Color(c)); const m=new THREE.Matrix4(), q=new THREE.Quaternion(), sc=new THREE.Vector3();
    pts.forEach((p,i)=>{ q.setFromAxisAngle(new THREE.Vector3(0,1,0),i*1.7); sc.setScalar(p.s); m.compose(new THREE.Vector3(p.x,GY,p.z),q,sc); tm.setMatrixAt(i,m); cm.setMatrixAt(i,m); cm.setColorAt(i,cols[(p.g?3:0)+(i%(p.g?2:3))]); p.m=m.clone(); });
    this.s.add(tm,cm); this.bushT=tm; this.bushC=cm; }
  hideBush(own){ const z=new THREE.Matrix4().makeScale(0,0,0); let ch=false; this.bush.forEach((p,i)=>{ const hide=p.k&&own.has(p.k); if(hide!==!!p.hidden){ p.hidden=hide; const m=hide?z:p.m; this.bushT.setMatrixAt(i,m); this.bushC.setMatrixAt(i,m); ch=true; } });
    if(ch){ this.bushT.instanceMatrix.needsUpdate=true; this.bushC.instanceMatrix.needsUpdate=true; } }
  /* --- models --- */
  build(t,lv,opt={}){ const d=TB[t]; const C={mask:opt.mask||0,g:new THREE.Group(),A:new THREE.Group(),anim:[],smoke:[],lv:Math.max(1,lv),W:d.w*CELL-.35,D:d.h*CELL-.35,t};
    if(opt.site){ const pad=box(C.W,.08,C.D,M('#bcaaa4')); P(pad,0,.04,0); C.g.add(pad); for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const c=new THREE.Mesh(new THREE.ConeGeometry(.1,.3,8),M('#ff7a1a')); c.castShadow=true; P(c,a*(C.W/2-.15),.15,b*(C.D/2-.15)); C.g.add(c);} const pal=rbox(.5,.3,.4,.04,M('#c58b4b')); P(pal,-C.W*.2,.15,C.D*.15); C.g.add(pal); }
    else MODELS[t](C);
    if(opt.scaffold||opt.site){ const m=M('#b0b7bd',{shine:60}); const h=opt.site?1.2:Math.min(3.2,new THREE.Box3().setFromObject(C.g).max.y+.2); const w=C.W/2+.05, dd=C.D/2+.05;
      for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const p=box(.05,h,.05,m); P(p,a*w,h/2,b*dd); C.g.add(p); } for(let y=.6;y<h;y+=.6){ for(const b of [-1,1]){ const r=box(C.W+.1,.04,.04,m); P(r,0,y,b*dd); C.g.add(r);} for(const a of [-1,1]){ const r=box(.04,.04,C.D+.1,m); P(r,a*w,y,0); C.g.add(r);} }
      const jib=new THREE.Group(); jib.userData.keep=true; const mast=box(.08,h+1,.08,M('#ffca28')); P(mast,0,(h+1)/2,0); const arm=box(1.6,.07,.07,M('#ffca28')); P(arm,.5,h+1,0); const hook=box(.02,.6,.02,M('#333')); P(hook,1.1,h+.7,0); jib.add(mast,arm,hook); P(jib,-w,0,-dd); C.A.add(jib); C.anim.push(t=>{ jib.rotation.y=Math.sin(t*.5)*1.2; }); }
    bake(C.g); C.g.add(C.A); C.top=new THREE.Box3().setFromObject(C.g).max.y; return C; }
  key(it,S){ return [it.t,it.l,it.r,it.i,it.j,!!it.up,!!it.dmg,it.t==='wall'?wallMask(this.wset,it.i,it.j):0].join('|'); }
  sync(S){ const seen=new Set(); let roadsChanged=false; const statics=['road']; this.wset=new Set(S.tw.items.filter(x=>x.t==='wall').map(x=>x.i+','+x.j));
    for(const it of S.tw.items){ seen.add(it.id); if(statics.includes(it.t)){ continue; } const k=this.key(it,S); const o=this.objs.get(it.id); if(o&&o.key===k) continue; if(o) this.drop(it.id);
      const C=this.build(it.t,it.l,{site:it.l<1&&!TB[it.t].instant,scaffold:it.l>=1&&!!it.up,mask:it.t==='wall'?wallMask(this.wset,it.i,it.j):0}); const grp=new THREE.Group(); grp.add(C.g); const c=this.center(it); grp.position.set(c.x,GY,c.z); C.g.rotation.y=-(it.r||0)*Math.PI/2;
      const [w,h]=this.dims(it); const hit=new THREE.Mesh(new THREE.BoxGeometry(w*CELL-.1,Math.max(1.2,C.top),h*CELL-.1),new THREE.MeshBasicMaterial({visible:false})); hit.position.y=Math.max(1.2,C.top)/2; hit.userData.tid=it.id; grp.add(hit);
      let dmgG=null; if(it.dmg){ dmgG=this.damageFx(w*CELL,h*CELL,C.top); grp.add(dmgG); }
      this.g.add(grp); this.objs.set(it.id,{grp,key:k,C,hit,top:C.top,item:it,dmg:it.dmg,emit:C.smoke.map(s=>({p:new THREE.Vector3(s[0],s[1],s[2]),col:s[3],every:s[4],t:Math.random()*s[4]}))});
      if(o) this.bounce(it.id); }
    for(const id of [...this.objs.keys()]) if(!seen.has(id)) this.drop(id);
    const rk=S.tw.items.filter(x=>x.t==='road').map(x=>x.i+','+x.j).sort().join(';'); if(rk!==this.roadKey){ this.roadKey=rk; this.buildRoads(S); }
    this.hits=[...this.objs.values()].map(o=>o.hit).concat(this.roadHits||[]); this.items=S.tw.items; this.S=S; this.fleet(S); }
  drop(id){ const o=this.objs.get(id); if(!o) return; this.g.remove(o.grp); o.grp.traverse(m=>{ if(m.isMesh&&m.geometry&&!m.geometry.userData?.shared) m.geometry.dispose(); }); this.objs.delete(id); }
  dims(it){ const d=TB[it.t]; return (it.r||0)%2?[d.h,d.w]:[d.w,d.h]; }
  center(it){ const [w,h]=this.dims(it); return {x:-HALF+(it.i+w/2)*CELL, z:-HALF+(it.j+h/2)*CELL}; }
  bounce(id){ const o=this.objs.get(id); if(o) o.bounceT=.0001; }
  damageFx(W,D,top){ const g=new THREE.Group(); const sc=new THREE.Mesh(new THREE.CircleGeometry(Math.max(W,D)*.62,20),new THREE.MeshBasicMaterial({color:'#2b2622',transparent:true,opacity:.45,depthWrite:false})); sc.rotation.x=-Math.PI/2; P(sc,0,.05,0); g.add(sc);
    const cols=['#7d7368','#5e5a55','#8d6e63','#9e9e9e']; for(let i=0;i<8;i++){ const r=new THREE.Mesh(new THREE.DodecahedronGeometry(.1+Math.random()*.12),M(cols[i%4],{flat:true})); r.castShadow=true; const a=Math.random()*6.28; P(r,Math.cos(a)*W*.45,.08,Math.sin(a)*D*.45); g.add(r); }
    const crack=M('#1a1a1a'); for(let i=0;i<4;i++){ const c=box(.03,.35+Math.random()*.3,.02,crack); c.rotation.z=(Math.random()-.5)*1.2; const onX=i%2; if(onX){ c.rotation.y=Math.PI/2; P(c,W*.36,.3+Math.random()*Math.min(1,top*.4),(Math.random()-.5)*D*.5); } else P(c,(Math.random()-.5)*W*.5,.3+Math.random()*Math.min(1,top*.4),D*.36); g.add(c); }
    const tarp=box(W*.45,.04,D*.35,M('#1e88e5',{shine:40})); tarp.rotation.set(.1,.4,-.08); P(tarp,0,Math.min(top,2.5)*.85,0); g.add(tarp);
    for(const a of [-1,1]){ const c=new THREE.Mesh(new THREE.ConeGeometry(.1,.3,8),M('#ff6d00')); P(c,a*W*.45,.15,D*.5); g.add(c); }
    const tape=box(W*.9,.04,.02,M('#ffeb3b')); P(tape,0,.25,D*.5); g.add(tape); return g; }
  buildRoads(S){ this.s.remove(this.roadG); this.roadG=new THREE.Group(); const set=new Set(S.tw.items.filter(x=>x.t==='road').map(x=>x.i+','+x.j)); const isR=(i,j)=>set.has(i+','+j)||this.cb.blocked(i,j)==='road';
    const asph=M('#50555c',{shine:8}), kerb=M('#c9c4b8'), line=M('#f5f5f5'), hit=new THREE.MeshBasicMaterial({visible:false}); this.roadHits=[];
    for(const it of S.tw.items.filter(x=>x.t==='road')){ const c=this.center(it); const g=new THREE.Group(); P(g,c.x,GY,c.z); const a=box(CELL,.06,CELL,asph); P(a,0,.03,0); g.add(a);
      const nb=[[1,0],[-1,0],[0,1],[0,-1]].map(([di,dj])=>isR(it.i+di,it.j+dj));
      nb.forEach((on,k)=>{ const [di,dj]=[[1,0],[-1,0],[0,1],[0,-1]][k]; if(on){ for(let s=0;s<2;s++){ const l=box(di?.32:.07,.02,dj?.32:.07,line); P(l,di*(.22+s*.5),.07,dj*(.22+s*.5)); g.add(l);} } else { const kb=box(di?.1:CELL,.1,dj?.1:CELL,kerb); P(kb,di*(CELL/2-.05),.06,dj*(CELL/2-.05)); g.add(kb); } });
      if(!nb.some(Boolean)){ const l=box(.6,.02,.07,line); P(l,0,.07,0); g.add(l); }
      const h=new THREE.Mesh(new THREE.BoxGeometry(CELL,.3,CELL),hit); h.userData.tid=it.id; P(h,c.x,GY+.15,c.z); this.roadHits.push(h); this.s.add(h); g.updateMatrixWorld(true); this.roadG.add(g); }
    bake(this.roadG); this.s.add(this.roadG); this.roadSet=set; }
  /* --- cars & walkers on player roads --- */
  fleet(S){ const roads=S.tw.items.filter(x=>x.t==='road'); const wantC=Math.min(5,Math.floor(roads.length/4)), wantW=Math.min(6,Math.floor(roads.length/3));
    while(this.cars.length>wantC){ const c=this.cars.pop(); this.s.remove(c.m); } while(this.walkers.length>wantW){ const w=this.walkers.pop(); this.s.remove(w.m); this.base.extraWalkers=this.base.extraWalkers.filter(x=>x!==w); }
    const cols=['#e53935','#1e88e5','#fdd835','#43a047','#ffffff','#8e24aa'];
    while(this.cars.length<wantC&&roads.length){ const r=roads[Math.floor(Math.random()*roads.length)]; const m=new THREE.Group(); carM(m,0,0,cols[this.cars.length%6],0,.5); this.s.add(m); const c=this.center(r); m.position.set(c.x,GY+.06,c.z); this.cars.push({m,at:[r.i,r.j],to:null,k:0,prev:null,sp:1.6+Math.random()}); }
    let added=false; while(this.walkers.length<wantW&&roads.length){ const r=roads[Math.floor(Math.random()*roads.length)]; const m=this.base.figure(['#e53935','#fb8c00','#1e88e5','#8e24aa','#43a047','#c0ca33'][this.walkers.length%6]); m.scale.setScalar(.7); this.s.add(m); const c=this.center(r); m.position.set(c.x,GY+.06,c.z);
      const w={m,at:[r.i,r.j],to:null,k:0,prev:null,sp:.5+Math.random()*.3,side:Math.random()<.5?1:-1}; this.walkers.push(w); this.base.extraWalkers.push(w); added=true; }
    if(added&&this.base.headList) this.base.setHeads(this.base.headList); }
  stepAgent(a,dt,yOff){ if(!this.roadSet||!this.roadSet.size) return; if(!a.to){ const opts=[[1,0],[-1,0],[0,1],[0,-1]].map(([di,dj])=>[a.at[0]+di,a.at[1]+dj]).filter(([i,j])=>this.roadSet.has(i+','+j)); if(!opts.length){ a.idle=(a.idle||0)+dt; return; }
      let nx=opts.filter(o=>!a.prev||o[0]!==a.prev[0]||o[1]!==a.prev[1]); if(!nx.length) nx=opts; a.to=nx[Math.floor(Math.random()*nx.length)]; a.k=0; }
    const c0=this.center({t:'road',i:a.at[0],j:a.at[1],r:0}), c1=this.center({t:'road',i:a.to[0],j:a.to[1],r:0}); a.k+=dt*a.sp/CELL; const k=Math.min(1,a.k); const dx=c1.x-c0.x, dz=c1.z-c0.z, L=Math.hypot(dx,dz)||1;
    const off=(a.side||1)*(a.side?.62:.32); const px=-dz/L*off, pz=dx/L*off; a.m.position.set(c0.x+dx*k+px,GY+yOff,c0.z+dz*k+pz); a.m.rotation.y=a.side?Math.atan2(dx,dz):Math.atan2(-dz,dx);
    if(a.k>=1){ a.prev=a.at; a.at=a.to; a.to=null; } }
  /* --- placement --- */
  startPlace(p){ this.place=p; this.mode=p.moveId?'move':'place'; if(p.moveId){ const o=this.objs.get(p.moveId); if(o) o.grp.visible=false; } this.makeGhost(); this.drawGround(this.S); this.updGhost(); }
  endPlace(){ if(this.place?.moveId){ const o=this.objs.get(this.place.moveId); if(o) o.grp.visible=true; } this.place=null; this.mode=null; this.ghost.clear(); this.tiles.forEach(t=>t.visible=false); this.drawGround(this.S); }
  setExpand(on){ this.mode=on?'expand':null; this.drawGround(this.S); }
  makeGhost(){ this.ghost.clear(); const p=this.place; if(p.t==='road'){ const g=box(CELL,.08,CELL,new THREE.MeshBasicMaterial({color:'#50555c',transparent:true,opacity:.7})); P(g,0,.04,0); this.ghost.add(g); return; }
    const C=this.build(p.t,p.lv||1); C.g.traverse(o=>{ if(o.isMesh){ o.material=TT('gh'+o.material.uuid,()=>{ const m=o.material.clone(); m.transparent=true; m.opacity=.62; m.depthWrite=false; return m; }); o.castShadow=false; } }); C.g.userData.inner=true; this.ghost.add(C.g); this.ghostC=C; }
  rotate(){ if(!this.place) return; this.place.r=((this.place.r||0)+1)%4; this.updGhost(); }
  updGhost(){ const p=this.place; if(!p) return; const it={t:p.t,i:p.i,j:p.j,r:p.r||0}; const c=this.center(it); this.ghost.position.set(c.x,GY+.02,c.z); if(this.ghost.children[0]) this.ghost.children[0].rotation.y=-(p.r||0)*Math.PI/2;
    const cells=this.cb.cellsOk(it,p.i,p.j,p.moveId); this.tiles.forEach((t,k)=>{ const cc=cells[k]; t.visible=!!cc; if(!cc) return; const q=this.center({t:'road',i:cc[0],j:cc[1],r:0}); t.position.set(q.x,GY+.04,q.z); t.material.color.set(cc[2]?'#43e04a':'#ff3b30'); });
    p.ok=cells.every(c=>c[2]); this.cb.onPlace&&this.cb.onPlace(p); }
  groundAt(x,y){ const r=this.base.renderer.domElement.getBoundingClientRect(); const v=new THREE.Vector2((x-r.left)/r.width*2-1,-((y-r.top)/r.height)*2+1); const rc=this.base.raycaster; rc.setFromCamera(v,this.base.cam); const hit=new THREE.Vector3(); return rc.ray.intersectPlane(this.plane,hit)?hit:null; }
  cellAt(x,y){ const h=this.groundAt(x,y); if(!h) return null; return {i:Math.floor((h.x+HALF)/CELL), j:Math.floor((h.z+HALF)/CELL), x:h.x, z:h.z}; }
  hDown(x,y){ if(!this.place) return false; const c=this.cellAt(x,y); if(!c) return false; const [w,h]=this.dims({t:this.place.t,r:this.place.r||0}); const p=this.place;
    if(c.i>=p.i&&c.i<p.i+w&&c.j>=p.j&&c.j<p.j+h){ this.drag={di:c.i-p.i,dj:c.j-p.j}; return true; } return false; }
  hMove(x,y){ if(!this.drag||!this.place) return; const c=this.cellAt(x,y); if(!c) return; const ni=c.i-this.drag.di, nj=c.j-this.drag.dj; if(ni!==this.place.i||nj!==this.place.j){ this.place.i=ni; this.place.j=nj; this.updGhost(); } }
  hUp(){ this.drag=null; }
  tap(rc,x,y){ if(this.place){ const c=this.cellAt(x,y); if(c){ const [w,h]=this.dims({t:this.place.t,r:this.place.r||0}); this.place.i=c.i-Math.floor((w-1)/2); this.place.j=c.j-Math.floor((h-1)/2); this.updGhost(); } return true; }
    if(this.mode==='expand'){ const c=this.cellAt(x,y); if(c) this.cb.onPlot&&this.cb.onPlot(Math.floor(c.i/CHUNK)+','+Math.floor(c.j/CHUNK)); return true; }
    const hits=rc.intersectObjects(this.hits,false); if(hits.length){ let tid=hits[0].object.userData.tid; const c=this.cellAt(x,y);
      if(c&&hits.length>1){ const under=this.items.find(it=>{ const [w,h]=this.dims(it); return it.t!=='road'&&c.i>=it.i&&c.i<it.i+w&&c.j>=it.j&&c.j<it.j+h; }); if(under&&hits.some(h=>h.object.userData.tid===under.id)) tid=under.id; }
      this.cb.onSelect&&this.cb.onSelect(tid); return true; } return false; }
  select(id){ this.selId=id; if(!id){ this.sel.visible=false; return; } const it=this.items.find(x=>x.id===id); if(!it){ this.sel.visible=false; return; } const [w,h]=this.dims(it), c=this.center(it); const W=w*CELL, D=h*CELL;
    const [a,b,cc,d]=this.sel.children; a.scale.set(W,1,1); P(a,0,0,D/2); b.scale.set(W,1,1); P(b,0,0,-D/2); cc.scale.set(D,1,1); cc.rotation.y=Math.PI/2; P(cc,W/2,0,0); d.scale.set(D,1,1); d.rotation.y=Math.PI/2; P(d,-W/2,0,0);
    this.sel.position.set(c.x,GY+.08,c.z); this.sel.visible=true; this.bounce(id); }
  screenPos(id,up=.35){ const o=this.objs.get(id); const it=o?o.item:this.items?.find(x=>x.id===id); if(!it) return null; const c=this.center(it); const v=new THREE.Vector3(c.x,GY+(o?Math.min(o.top,4):.4)+up,c.z).project(this.base.cam); return {x:(v.x+1)/2*this.base.w, y:(1-v.y)/2*this.base.h, on:Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1}; }
  cellScreen(i,j){ const c=this.center({t:'road',i,j,r:0}); const v=new THREE.Vector3(c.x,GY,c.z).project(this.base.cam); return {x:(v.x+1)/2*this.base.w, y:(1-v.y)/2*this.base.h}; }
  plotScreen(k){ const [cx,cy]=k.split(',').map(Number); const v=new THREE.Vector3(-HALF+(cx+.5)*CHUNK*CELL,GY+.3,-HALF+(cy+.5)*CHUNK*CELL).project(this.base.cam); return {x:(v.x+1)/2*this.base.w, y:(1-v.y)/2*this.base.h, on:Math.abs(v.x)<1.05&&Math.abs(v.y)<1.05}; }
  focus(id,zoom){ const it=this.items.find(x=>x.id===id); if(!it) return; const c=this.center(it); const u=(c.x-c.z)*SQ, v=(c.x+c.z)*SQ; this.base.panTarget={x:u,y:v-.6}; if(zoom){ this.base.zoom=zoom; this.base.updateCam(); } }
  focusCell(i,j){ const c=this.center({t:'road',i,j,r:0}); this.base.panTarget={x:(c.x-c.z)*SQ,y:(c.x+c.z)*SQ-.6}; }
  viewCell(){ const c=this.base.camTarget; return {i:Math.floor((c.x+HALF)/CELL), j:Math.floor((c.z+HALF)/CELL)}; }
  moodChanged(){ this.dayKey=''; }
  /* --- per frame --- */
  update(dt,t){ this.t=t;
    for(const o of this.objs.values()){ for(const f of o.C.anim) f(t,dt);
      if(o.bounceT){ o.bounceT+=dt; const k=o.bounceT, s=1+Math.sin(k*18)*Math.exp(-k*7)*.12; o.grp.scale.set(1/Math.sqrt(s),s,1/Math.sqrt(s)); if(k>1){ o.bounceT=0; o.grp.scale.set(1,1,1); } }
      if(o.grp.visible) for(const e of o.emit){ e.t-=dt; if(e.t<=0){ e.t=e.every*(0.7+Math.random()*.6); this.puff(o.C.g.localToWorld(e.p.clone()),e.col); } }
      if(o.dmg){ o.dt=(o.dt||0)-dt; if(o.dt<=0){ o.dt=.35; this.puff(new THREE.Vector3(o.grp.position.x+(Math.random()-.5),GY+Math.min(o.top,2.5),o.grp.position.z+(Math.random()-.5)),'#4a4a4a'); } } }
    if(this.sel.visible){ const s=.75+Math.sin(t*5)*.25; this.sel.children.forEach(c=>c.material.color.setScalar(s)); }
    for(const c of this.cars) this.stepAgent(c,dt,.06); for(const w of this.walkers){ this.stepAgent(w,dt,.06); const sw=Math.sin(t*10*w.sp)*.3; if(w.m.userData.legs){ w.m.userData.legs[0].rotation.x=sw; w.m.userData.legs[1].rotation.x=-sw; } }
    if(this.place&&this.ghostC){ for(const f of this.ghostC.anim) f(t,dt); this.tiles.forEach(x=>x.material.opacity=.4+Math.sin(t*6)*.15); }
    this.dayNight(); }
  puff(pos,col){ const p=this.base.puffs.find(p=>p.life<=0); if(!p) return; p.m.material.color.set(col); p.m.position.copy(pos); p.m.visible=true; p.life=2.4; }
  dayNight(){ const on=this.S?.prefs?.daynight!==false; const ph=this.debugPhase??((Date.now()/1000)%480)/480; let n=on?Math.max(0,1-Math.abs(ph-.82)/.11):0; n=Math.min(1,n*1.6); const dusk=on?Math.max(0,1-Math.abs(ph-.82)/.2)-n*.6:0;
    const key=(n*20|0)+'|'+(dusk*20|0)+'|'+(this.base.mood||''); if(key===this.dayKey) return; this.dayKey=key; this.night=n;
    const B=this.base; if(!B.mood){ const day=new THREE.Color('#8fd3ff'), nite=new THREE.Color('#1c2b4d'), sun=new THREE.Color('#ffb36b'); const c=day.clone().lerp(sun,Math.max(0,dusk)*.45).lerp(nite,n); B.scene.background.copy(c); B.scene.fog.color.copy(c);
      B.sun.intensity=2.3*(1-n*.8); B.sun.color.set('#fff4dc').lerp(new THREE.Color('#ff9a5a'),Math.max(0,dusk)*.6).lerp(new THREE.Color('#9fb4ff'),n); B.hemi.intensity=1.25*(1-n*.55); }
    const w=WIN(); w.emissive.set(n>.15?'#ffc65a':'#1d5a7a'); w.emissiveIntensity=.5+n*1.3; const l=LAMP(); l.emissiveIntensity=.3+n*2.5; }
}
