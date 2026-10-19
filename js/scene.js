// Firey Station Tycoon v2: 3D isometric base (Three.js, vendored locally).
// All models are built from primitives in code. Original art, no real logos or insignia.
import * as THREE from './vendor/three.bundle.min.js';
import { RoundedBoxGeometry } from './vendor/three.bundle.min.js';

const SQ = Math.SQRT1_2;
// layout in screen-aligned coords: u = right, v = towards the bottom of the screen
const uv = (u,v) => ({ x:(v+u)*SQ, z:(v-u)*SQ });
export const LAYOUT = {
  comms:    { u:-2.7, v:-9.6, w:2.6, d:2.6 },
  tower:    { u: 2.8, v:-9.4, w:2.6, d:2.6 },
  gym:      { u:-2.8, v:-4.6, w:3.0, d:3.0 },
  hazmat:   { u: 2.9, v:-4.4, w:3.0, d:2.6 },
  quarters: { u:-2.8, v: 0.6, w:3.4, d:3.0 },
  rescue:   { u: 2.9, v: 0.6, w:3.0, d:3.0 },
  engine:   { u: 0.0, v: 6.0, w:4.6, d:3.6 },
};

const matCache = new Map();
function M(color, o={}){ const k=color+JSON.stringify(o); if(matCache.has(k)) return matCache.get(k);
  const m = new THREE.MeshPhongMaterial({ color, shininess:o.shine??38, specular:o.spec??0x2a2a2a, emissive:o.em??0x000000,
    emissiveIntensity:o.ei??1, transparent:!!o.op, opacity:o.op??1, flatShading:!!o.flat, map:o.map||null });
  matCache.set(k,m); return m; }
function rbox(w,h,d,r,mat){ const g=new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/2-.001,h/2-.001,d/2-.001)); const m=new THREE.Mesh(g,mat); m.castShadow=true; m.receiveShadow=true; return m; }
function box(w,h,d,mat){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.castShadow=true; m.receiveShadow=true; return m; }
function cyl(rt,rb,h,mat,seg=16){ const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat); m.castShadow=true; m.receiveShadow=true; return m; }
function sph(r,mat,seg=16){ const m=new THREE.Mesh(new THREE.SphereGeometry(r,seg,Math.max(8,seg*0.75|0)),mat); m.castShadow=true; return m; }
function at(o,x,y,z){ o.position.set(x,y,z); return o; }

function textTex(text, opt={}){
  const c=document.createElement('canvas'); const W=opt.w||512, H=opt.h||128; c.width=W; c.height=H; const g=c.getContext('2d');
  g.fillStyle=opt.bg||'#1d2b3a'; const r=opt.r??28; g.beginPath(); g.roundRect(4,4,W-8,H-8,r); g.fill();
  g.lineWidth=8; g.strokeStyle=opt.border||'#ffffff'; g.stroke();
  g.font=`${opt.size||72}px "Lilita One", "Arial Black", sans-serif`; g.textAlign='center'; g.textBaseline='middle';
  g.lineWidth=10; g.strokeStyle='rgba(0,0,0,.45)'; g.strokeText(text,W/2,H/2+4); g.fillStyle=opt.fg||'#fff'; g.fillText(text,W/2,H/2+4);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t; }
function stripeTex(c1,c2,n=8,vertical=false){ const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d');
  g.fillStyle=c1; g.fillRect(0,0,128,128); g.fillStyle=c2; const s=128/n;
  for(let i=0;i<n;i++) if(vertical) g.fillRect(i*s,0,s*0.18,128); else g.fillRect(0,i*s,128,s*0.16);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; }
function hazardTex(){ const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d');
  g.fillStyle='#ffd400'; g.fillRect(0,0,128,128); g.fillStyle='#222'; for(let i=-4;i<8;i++){ g.beginPath(); g.moveTo(i*32,0); g.lineTo(i*32+16,0); g.lineTo(i*32+16-128,128); g.lineTo(i*32-128,128); g.fill(); }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; }

function windowRow(group, n, w, y, z, x0, gap, faceX=false){
  for(let i=0;i<n;i++){ const fr=box(w+.12,w*.9+.12,.06,M('#ffffff')); const gl=box(w,w*.9,.08,M('#7fd3ff',{em:0x1d5a7a,ei:.5,shine:90,spec:0xffffff}));
    const p=x0+i*gap; if(faceX){ fr.rotation.y=gl.rotation.y=Math.PI/2; at(fr,z,y,p); at(gl,z+.02,y,p); } else { at(fr,p,y,z); at(gl,p,y,z+.02); }
    group.add(fr,gl); } }

export class BaseScene {
  constructor(container, { onSelect, onTapEmpty }){
    this.container=container; this.onSelect=onSelect; this.onTapEmpty=onTapEmpty;
    const r=this.renderer=new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio||1, 2)); r.shadowMap.enabled=true; r.shadowMap.type=THREE.PCFShadowMap;
    r.outputColorSpace=THREE.SRGBColorSpace; r.toneMapping=THREE.ACESFilmicToneMapping; r.toneMappingExposure=1.08;
    container.appendChild(r.domElement); r.domElement.style.touchAction='none';
    const s=this.scene=new THREE.Scene(); s.background=new THREE.Color('#8fd3ff'); s.fog=new THREE.Fog('#8fd3ff', 60, 110);
    this.cam=new THREE.OrthographicCamera(-10,10,10,-10,0.1,200); this.camDist=50; this.zoom=1; this.pan=new THREE.Vector2(0,0); this.bounds={u0:-3.5,u1:3.5,v0:-7,v1:7}; this.zMin=.45; this.zMax=2.4; this.extraWalkers=[];
    // lights
    this.hemi=new THREE.HemisphereLight('#e8f6ff','#5d7a3a',1.25); s.add(this.hemi);
    const sun=this.sun=new THREE.DirectionalLight('#fff4dc',2.3); sun.position.set(9,24,15); sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048); const sc=sun.shadow.camera; sc.left=-22; sc.right=22; sc.top=22; sc.bottom=-22; sc.near=1; sc.far=90; sun.shadow.bias=-0.0006; sun.shadow.normalBias=0.03; sun.shadow.radius=4;
    s.add(sun); s.add(sun.target);
    this.buildings={}; this.anim=[]; this.trucksOut=[]; this.walkers=[]; this.t=0; this.selected=null; this.levels={};
    this.raycaster=new THREE.Raycaster(); this.ptr=new THREE.Vector2();
    this.buildWorld(); this.bindInput(); this.resize();
    window.addEventListener('resize',()=>this.resize()); if(window.ResizeObserver) new ResizeObserver(()=>this.resize()).observe(container);
  }
  resize(){ const w=this.container.clientWidth||1, h=this.container.clientHeight||1; this.w=w; this.h=h; this.renderer.setSize(w,h,false);
    this.renderer.domElement.style.width=w+'px'; this.renderer.domElement.style.height=h+'px'; this.updateCam(); }
  updateCam(){ const aspect=this.w/this.h; const halfW=7.4/this.zoom; const halfH=halfW/aspect;
    Object.assign(this.cam,{left:-halfW,right:halfW,top:halfH,bottom:-halfH}); this.cam.updateProjectionMatrix();
    // camera looks at target from iso direction; pan in screen-aligned u/v
    const B=this.bounds; this.pan.x=Math.max(B.u0,Math.min(B.u1,this.pan.x)); this.pan.y=Math.max(B.v0,Math.min(B.v1,this.pan.y));
    const p=uv(this.pan.x, this.pan.y+0.6); const tgt=new THREE.Vector3(p.x,0,p.z);
    const dir=new THREE.Vector3(1,1.15,1).normalize(); this.cam.position.copy(tgt).addScaledVector(dir,this.camDist); this.cam.lookAt(tgt);
    if(this.sun){ this.sun.target.position.copy(tgt); this.sun.position.set(tgt.x+9,24,tgt.z+15); } this.camTarget=tgt; }

  buildWorld(){
    const s=this.scene;
    // outer ground
    const g=new THREE.Mesh(new THREE.PlaneGeometry(300,300), M('#5fa043',{shine:5})); g.rotation.x=-Math.PI/2; g.position.y=-0.62; g.receiveShadow=true; s.add(g);
    // compound slab (rotated so it is tall on a portrait screen)
    const slab=new THREE.Group(); slab.rotation.y=Math.PI/4; s.add(slab);
    const base=rbox(12.6,1.2,27.6,.5,M('#8a6a45',{shine:10})); at(base,0,-0.6,0); slab.add(base);
    const top=rbox(12.4,.3,27.4,.14,M('#79c24f',{shine:14})); at(top,0,-0.05,0); slab.add(top);
    // concrete apron + driveway
    const apron=rbox(8.6,.12,6.6,.1,M('#d6d0c4',{shine:20})); at(apron,0,0.12,6.6); slab.add(apron);
    const drive=rbox(3.6,.1,6,.08,M('#5b6068',{shine:10})); at(drive,0,0.1,11.3); slab.add(drive);
    // paths between buildings
    const pathM=M('#e7dcc0',{shine:10});
    [[0,-2,1.3,15.5]].forEach(([x,z,w,d])=>{ const p=rbox(w,.08,d,.04,pathM); at(p,x,0.12,z); slab.add(p); });
    [[-4.6],[-0.2],[ -9.4]].forEach(([z])=>{ const p=rbox(10.4,.08,1.0,.04,pathM); at(p,0,0.12,z+2.4); slab.add(p); });
    // road leaving the base (down the screen)
    const road=box(3.8,.1,70,M('#4e535a',{shine:6})); road.rotation.y=Math.PI/4; const rp=uv(0,48); at(road,rp.x,-0.55,rp.z); road.receiveShadow=true; s.add(road);
    for(let i=0;i<26;i++){ const dsh=box(.18,.02,1.1,M('#ffffff')); dsh.rotation.y=Math.PI/4; const dp=uv(0,15+i*2.6); at(dsh,dp.x,-0.48,dp.z); s.add(dsh); }
    // fence posts around slab edge
    const postM=M('#f4f1ea'), railM=M('#d9d3c7');
    for(const side of [-1,1]){ for(let i=0;i<14;i++){ const v=-13+i*2; const p=uv(side*6.05,v); s.add(at(rbox(.22,.7,.22,.06,postM),p.x,.35,p.z)); }
      const rail=box(.08,.08,26,railM); rail.rotation.y=Math.PI/4; const rp2=uv(side*6.05,0); at(rail,rp2.x,.55,rp2.z); s.add(rail); }
    { const p=uv(-3.4,-13.6), q=uv(3.4,-13.6); for(let i=-5;i<=5;i++){ const pp=uv(i*1.1,-13.6); s.add(at(rbox(.22,.7,.22,.06,postM),pp.x,.35,pp.z)); } }
    // trees around
    const rnd=mulberry(7);
    // v4: surrounding bush is instanced by the town layer
    // decorations inside
    for(const [u,v] of [[-5.3,-12.6],[5.3,-12.6],[-5.3,12.4],[5.3,9.5],[-5.3,4.2],[5.4,-1.8],[-0.2,-12.8]]){ const p=uv(u,v); this.tree(p.x,p.z,0.55,rnd); }
    this.flag(uv(-4.6,9.6));
    this.waterTank(uv(4.9,11.4));
    this.hoseReel(uv(-4.4,11.6));
    this.car(uv(4.9,-7.2),'#ffffff',0.2); this.car(uv(-5.1,-7.0),'#2e7dd7',1.2);
    // buildings
    for(const id of Object.keys(LAYOUT)) this.makeBuilding(id,1);
    // selection ring
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1,.07,8,48),M('#ffffff',{em:0xffffff,ei:.9})); ring.rotation.x=Math.PI/2; ring.visible=false; s.add(ring); this.ring=ring;
    // crew walkers
    const roles=['#e53935','#fb8c00','#1e88e5','#8e24aa','#43a047','#c0ca33'];
    const pts=[uv(0,-11),uv(0,-7),uv(0,-2.2),uv(0,2.6),uv(-2,3.3),uv(2,3.3),uv(0,-6.8),uv(-1.8,-7),uv(1.8,-7)];
    for(let i=0;i<5;i++){ const w=this.figure(roles[i]); const p=pts[i]; at(w,p.x,0.15,p.z); s.add(w); this.walkers.push({m:w,pts,i:i,next:pts[(i+1)%pts.length],sp:0.9+rnd()*0.5,wait:rnd()*2}); }
    // smoke puffs pool
    this.puffs=[]; for(let i=0;i<70;i++){ const p=sph(.25,M('#ffffff',{op:.8,shine:0})); p.castShadow=false; p.visible=false; s.add(p); this.puffs.push({m:p,life:0}); }
  }
  tree(x,z,sc,rnd){ const t=new THREE.Group(); const trunk=cyl(.12*sc,.16*sc,.8*sc,M('#7a4b2a'),8); at(trunk,0,.4*sc,0); t.add(trunk);
    const greens=['#3f9d3a','#4caf50','#2e8b3e','#5cb85c']; const col=greens[Math.floor(rnd()*4)];
    if(rnd()<.5){ const c1=sph(.75*sc,M(col,{shine:12}),12); at(c1,0,1.15*sc,0); const c2=sph(.5*sc,M(col,{shine:12}),10); at(c2,.35*sc,1.55*sc,.2*sc); t.add(c1,c2); }
    else { for(let k=0;k<3;k++){ const c=new THREE.Mesh(new THREE.ConeGeometry((.8-k*.2)*sc,.9*sc,8),M(col,{shine:12,flat:true})); c.castShadow=true; at(c,0,(.9+k*.45)*sc,0); t.add(c);} }
    at(t,x,-0.05+(Math.abs(x)+Math.abs(z)>10?-0.5:0.1),z); t.rotation.y=rnd()*6; this.scene.add(t); return t; }
  figure(color){ const f=new THREE.Group(); const body=rbox(.34,.46,.26,.12,M(color)); at(body,0,.42,0);
    const stripe=box(.36,.05,.28,M('#e8ff6a',{em:0x445500,ei:.4})); at(stripe,0,.36,0);
    const head=sph(.15,M('#f2c9a0'),12); at(head,0,.8,0); const hel=sph(.17,M('#ffd23f',{shine:80}),12); hel.scale.set(1,.7,1.1); at(hel,0,.88,0);
    const brim=cyl(.2,.22,.03,M('#ffd23f',{shine:80}),16); at(brim,0,.84,-.02);
    const l1=rbox(.12,.22,.12,.05,M('#222')); at(l1,-.08,.1,0); const l2=l1.clone(); at(l2,.08,.1,0);
    f.add(body,stripe,head,hel,brim,l1,l2); f.userData.legs=[l1,l2]; return f; }
  flag(p){ const pole=cyl(.05,.06,4,M('#eeeeee',{shine:90}),8); at(pole,p.x,2,p.z); this.scene.add(pole);
    const geo=new THREE.PlaneGeometry(1.4,.85,10,4); const fl=new THREE.Mesh(geo,new THREE.MeshPhongMaterial({color:'#ffcc33',side:THREE.DoubleSide,shininess:20}));
    fl.castShadow=true; at(fl,p.x+.7,3.5,p.z); fl.rotation.y=-Math.PI/4; this.scene.add(fl); this.flagMesh=fl; this.flagBase=geo.attributes.position.array.slice(); }
  waterTank(p){ const t=cyl(.6,.6,1.3,M('#8fb3c9',{shine:60}),20); at(t,p.x,.95,p.z); const lid=cyl(.64,.64,.1,M('#6b8ea3'),20); at(lid,p.x,1.62,p.z); t.position.y=.75;
    const r1=cyl(.62,.62,.05,M('#5e7f93'),20); at(r1,p.x,.5,p.z); const r2=r1.clone(); at(r2,p.x,1.05,p.z); this.scene.add(t,lid,r1,r2); }
  hoseReel(p){ const g=new THREE.Group(); const reel=new THREE.Mesh(new THREE.TorusGeometry(.35,.14,10,20),M('#e53935',{shine:70})); reel.castShadow=true; at(reel,0,.55,0);
    const st=rbox(.12,.6,.5,.04,M('#9e9e9e')); at(st,0,.3,0); g.add(st,reel); g.rotation.y=Math.PI/4; at(g,p.x,0.1,p.z); this.scene.add(g); }
  car(p,color,rot){ const g=new THREE.Group(); const b=rbox(1.5,.42,.8,.18,M(color,{shine:90})); at(b,0,.38,0); const c=rbox(.85,.36,.72,.16,M('#bfe8ff',{shine:100,spec:0xffffff})); at(c,-.1,.72,0);
    g.add(b,c); for(const [x,z] of [[-.5,.4],[.5,.4],[-.5,-.4],[.5,-.4]]){ const w=cyl(.17,.17,.12,M('#222'),12); w.rotation.x=Math.PI/2; at(w,x,.2,z); g.add(w); }
    g.rotation.y=rot; at(g,p.x,0.08,p.z); this.scene.add(g); return g; }
  truck(color='#e8281e'){ const g=new THREE.Group();
    const body=rbox(2.3,.85,1.0,.2,M(color,{shine:95,spec:0x666666})); at(body,-.2,.75,0);
    const cab=rbox(.85,1.0,1.0,.24,M(color,{shine:95,spec:0x666666})); at(cab,1.15,.82,0);
    const wind=rbox(.1,.42,.86,.05,M('#bfe8ff',{shine:120,spec:0xffffff})); at(wind,1.58,1.0,0);
    const stripe=box(2.32,.1,1.02,M('#ffffff')); at(stripe,-.2,.55,0);
    const ladder=new THREE.Group(); for(const z of [-.28,.28]){ const r=box(2.1,.06,.06,M('#d0d6dc',{shine:90})); at(r,0,0,z); ladder.add(r); }
    for(let i=0;i<8;i++){ const r=box(.05,.05,.56,M('#d0d6dc')); at(r,-1+i*.28,0,0); ladder.add(r); } at(ladder,-.25,1.25,0);
    const lb1=box(.14,.1,.3,M('#2979ff',{em:0x2979ff,ei:.6})); at(lb1,1.15,1.37,-.22); const lb2=box(.14,.1,.3,M('#ff1744',{em:0xff1744,ei:.6})); at(lb2,1.15,1.37,.22);
    g.add(body,cab,wind,stripe,ladder,lb1,lb2); g.userData.lights=[lb1,lb2];
    for(const [x,z] of [[-.9,.5],[.1,.5],[1.1,.5],[-.9,-.5],[.1,-.5],[1.1,-.5]]){ const w=cyl(.24,.24,.16,M('#1f1f1f'),14); w.rotation.x=Math.PI/2; at(w,x,.26,z); const hub=cyl(.1,.1,.17,M('#cfcfcf',{shine:90}),10); hub.rotation.x=Math.PI/2; at(hub,x,.26,z); g.add(w,hub); }
    return g; }

  // ---- buildings ----
  makeBuilding(id, level, state={}){
    const old=this.buildings[id]; if(old) this.scene.remove(old.group);
    const L=LAYOUT[id], p=uv(L.u,L.v); const grp=new THREE.Group(); at(grp,p.x,0.1,p.z);
    const inner=new THREE.Group(); grp.add(inner);
    const lv=level|0; const trim = lv>=7?'#ffcf33':lv>=4?'#ffe8a3':'#ffffff';
    const sc=0.9+Math.min(lv,10)*0.012;
    if(lv<=0){ this.plot(inner,L,state.locked); }
    else this['b_'+id](inner,L,lv,trim);
    inner.scale.setScalar(lv>0?sc:1);
    // invisible hit box
    const hit=new THREE.Mesh(new THREE.BoxGeometry(L.w+.4,3.2,L.d+.4),new THREE.MeshBasicMaterial({visible:false})); hit.position.y=1.5; hit.userData.bid=id; grp.add(hit);
    if(state.upgrading) this.scaffold(inner,L);
    this.scene.add(grp); const bb=new THREE.Box3().setFromObject(inner); const top=lv<=0?1.6:Math.min(id==='comms'?2.4:9,bb.max.y-0.1);
    this.buildings[id]={group:grp,inner,hit,level:lv,state,top};
    return grp; }
  setBuilding(id, level, state){ const b=this.buildings[id]; const key=level+'|'+!!state.upgrading+'|'+!!state.locked;
    if(b && b.key===key) return; this.makeBuilding(id,level,state); this.buildings[id].key=key; if(b) this.bounce(id); }
  plot(g,L,locked){ const pad=rbox(L.w,.12,L.d,.1,M(locked?'#9b8c78':'#b98c5a',{shine:5})); at(pad,0,.06,0); g.add(pad);
    for(let i=0;i<4;i++){ const cone=new THREE.Mesh(new THREE.ConeGeometry(.16,.45,10),M('#ff7a1a',{shine:60})); cone.castShadow=true;
      at(cone,(i%2?1:-1)*(L.w/2-.3),.32,(i<2?1:-1)*(L.d/2-.3)); g.add(cone); }
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.55),new THREE.MeshBasicMaterial({map:textTex(locked?'LOCKED':'BUILD ME',{bg:locked?'#555':'#2e7d32',size:62})}));
    const post=box(.08,.9,.08,M('#8d6e63')); at(post,0,.45,L.d/2-.5); g.add(post); at(sign,0,1.05,L.d/2-.45); sign.rotation.y=Math.PI/4; g.add(sign);
    if(!locked){ const crate=rbox(.6,.5,.6,.08,M('#c58b4b')); at(crate,-.6,.3,-.4); const crate2=crate.clone(); at(crate2,-.2,.3,-.9); g.add(crate,crate2); } }
  scaffold(g,L){ const m=M('#b0b7bd',{shine:60}); const h=2.8;
    for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const p=box(.07,h,.07,m); at(p,x*(L.w/2+.15),h/2,z*(L.d/2+.15)); g.add(p); }
    for(const y of [.9,1.8,2.7]){ for(const z of [-1,1]){ const b=box(L.w+.3,.06,.06,m); at(b,0,y,z*(L.d/2+.15)); g.add(b);} for(const x of [-1,1]){ const b=box(.06,.06,L.d+.3,m); at(b,x*(L.w/2+.15),y,0); g.add(b);} }
    const plank=box(L.w+.3,.06,.35,M('#c58b4b')); at(plank,0,1.85,L.d/2+.15); g.add(plank); }
  sign(g,text,w,y,z,opts){ const t=new THREE.Mesh(new THREE.PlaneGeometry(w,w*.25),new THREE.MeshBasicMaterial({map:textTex(text,opts)})); at(t,0,y,z); g.add(t); return t; }

  b_engine(g,L,lv,trim){
    const w=L.w, d=L.d; const brick=M('#e0523c',{shine:45});
    const walls=rbox(w,2.3,d,.22,brick); at(walls,0,1.15,0); g.add(walls);
    const roof=rbox(w+.35,.35,d+.35,.16,M('#56687a',{shine:50})); at(roof,0,2.45,0); g.add(roof);
    const tr=rbox(w+.38,.14,d+.38,.06,M(trim)); at(tr,0,2.24,0); g.add(tr);
    const bays=Math.min(3,1+Math.floor(lv/3)); const doorW=(w-0.5)/3-.2;
    const doorTex=stripeTex('#f5f5f5','#cfd4da',10);
    this.bayDoors=[];
    for(let i=0;i<3;i++){ const x=-w/2+.45+doorW/2+i*(doorW+.2);
      const frame=rbox(doorW+.16,1.75,.12,.05,M(trim)); at(frame,x,.9,d/2+.02); g.add(frame);
      if(i<bays){ const door=box(doorW,1.6,.1,M('#ffffff',{map:doorTex,shine:60})); at(door,x,.85,d/2+.06); g.add(door); this.bayDoors.push({door,x});
        const ped=rbox(doorW*.5,.6,.1,.04,M('#2a2a2a')); }
      else { const blank=box(doorW,1.6,.1,M('#a3362a')); at(blank,x,.85,d/2+.05); g.add(blank); } }
    this.sign(g,'ENGINE BAY',2.6,1.95,d/2+.08,{bg:'#1e2a38'});
    windowRow(g,3,.5,1.4,w/2+.04,-d/2+.7,.85,true);
    // lamp + bell
    const bell=sph(.2,M('#ffcc33',{shine:120,spec:0xffffff}),12); at(bell,w/2-.4,2.85,d/2-.4); g.add(bell);
    if(lv>=5){ const tw=rbox(1.1,1.2,1.1,.18,brick); at(tw,-w/2+.7,3.0,-d/2+.7); const tr2=rbox(1.3,.25,1.3,.1,M('#3a4450')); at(tr2,-w/2+.7,3.7,-d/2+.7); g.add(tw,tr2); }
  }
  b_tower(g,L,lv,trim){
    const floors=3+Math.min(4,Math.floor(lv/2)); const fh=.85; const h=floors*fh;
    const body=rbox(L.w*.75,h,L.d*.75,.2,M('#e0e0e0',{shine:30})); at(body,0,h/2,0); g.add(body);
    for(let f=0;f<floors;f++){ const band=rbox(L.w*.78,.08,L.d*.78,.03,M(f%2?'#c2412f':trim)); at(band,0,f*fh+.05,0); g.add(band);
      windowRow(g,2,.32,f*fh+.45,L.d*.375+.03,-.35,.7); windowRow(g,1,.32,f*fh+.45,L.w*.375+.03,0,0,true); }
    const roof=rbox(L.w*.9,.25,L.d*.9,.1,M('#c2412f')); at(roof,0,h+.12,0); g.add(roof);
    // railing on top
    for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; const p=box(.05,.4,.05,M('#ffffff')); at(p,Math.cos(a)*.95,h+.45,Math.sin(a)*.95); g.add(p); }
    // ladder on front face
    const lad=new THREE.Group(); for(const x of [-.22,.22]){ const r=box(.06,h,.06,M('#ffcc33',{shine:90})); at(r,x,h/2,0); lad.add(r);} for(let i=0;i<floors*3;i++){ const r=box(.44,.05,.05,M('#ffcc33')); at(r,0,.2+i*h/(floors*3),0); lad.add(r);} 
    at(lad,L.w*.375+.12,0,.55); lad.rotation.y=Math.PI/2; g.add(lad);
    this.towerH=h; this.climber=this.figure('#fb8c00'); this.climber.scale.setScalar(.8); this.climber.rotation.y=Math.PI/2; g.add(this.climber); this.climber.userData.x=L.w*.375+.32;
    this.sign(g,'TRAINING',1.5,h-.4,L.d*.375+.05,{bg:'#c2412f',size:80});
  }
  b_gym(g,L,lv,trim){
    const walls=rbox(L.w,1.6,L.d,.25,M('#4f8ad9',{shine:40})); at(walls,0,.8,0); g.add(walls);
    const roof=rbox(L.w+.3,.3,L.d+.3,.14,M('#f5f5f5')); at(roof,0,1.72,0); g.add(roof);
    const tr=rbox(L.w+.32,.1,L.d+.32,.04,M(trim)); at(tr,0,1.56,0); g.add(tr);
    const door=rbox(.8,1.1,.1,.06,M('#ffffff',{shine:80})); at(door,.6,.55,L.d/2+.03); g.add(door);
    windowRow(g,2,.5,.95,L.d/2+.03,-.9,.75); windowRow(g,2,.5,.95,L.w/2+.03,-.5,1,true);
    const db=new THREE.Group(); const bar=cyl(.06,.06,1.6,M('#9e9e9e',{shine:100}),10); bar.rotation.z=Math.PI/2; db.add(bar);
    for(const x of [-.65,.65]){ const pl=cyl(.32,.32,.18,M('#222',{shine:60}),18); pl.rotation.z=Math.PI/2; at(pl,x,0,0); db.add(pl); }
    at(db,0,2.35,0); g.add(db); this.dumbbell=db;
    if(lv>=3){ for(const [x,z] of [[-L.w/2-.5,.5],[-L.w/2-.5,-.6]]){ const k=rbox(.4,.5,.4,.12,M('#e53935',{shine:80})); at(k,x,.25,z); g.add(k);} }
  }
  b_hazmat(g,L,lv,trim){
    const walls=rbox(L.w,1.5,L.d,.2,M('#f2f2ee',{shine:30})); at(walls,0,.75,0); g.add(walls);
    const band=box(L.w+.02,.35,L.d+.02,M('#ffffff',{map:hazardTex(),shine:40})); band.material.map.repeat.set(4,1); at(band,0,.35,0); g.add(band);
    const roof=rbox(L.w+.3,.3,L.d+.3,.12,M('#2f8f4f')); at(roof,0,1.62,0); g.add(roof);
    const tr=rbox(L.w+.32,.1,L.d+.32,.04,M(trim)); at(tr,0,1.46,0); g.add(tr);
    const dia=new THREE.Mesh(new THREE.PlaneGeometry(.75,.75),M('#ff8f00',{em:0x552200,ei:.3})); dia.rotation.z=Math.PI/4; at(dia,-.6,1.0,L.d/2+.03); g.add(dia);
    const dia2=new THREE.Mesh(new THREE.PlaneGeometry(.5,.5),M('#ffffff')); dia2.rotation.z=Math.PI/4; at(dia2,-.6,1.0,L.d/2+.035); g.add(dia2);
    const door=rbox(.8,1.0,.1,.05,M('#9aa3ab',{map:stripeTex('#a7b0b8','#8a939b',6),shine:60})); at(door,.6,.55,L.d/2+.03); g.add(door);
    const n=2+Math.min(4,lv); for(let i=0;i<n;i++){ const b=cyl(.22,.22,.6,M(['#1e88e5','#43a047','#ffb300'][i%3],{shine:80}),14); at(b,L.w/2+.4,.3,-L.d/2+.4+i*.5); g.add(b);
      const r=cyl(.23,.23,.05,M('#222'),14); at(r,L.w/2+.4,.45,-L.d/2+.4+i*.5); g.add(r); }
  }
  b_rescue(g,L,lv,trim){
    const walls=rbox(L.w,1.7,L.d,.22,M('#f39c12',{shine:35})); at(walls,0,.85,0); g.add(walls);
    const roof=rbox(L.w+.3,.3,L.d+.3,.12,M('#37474f')); at(roof,0,1.82,0); g.add(roof);
    const tr=rbox(L.w+.32,.1,L.d+.32,.04,M(trim)); at(tr,0,1.66,0); g.add(tr);
    const door=box(1.5,1.3,.1,M('#ffffff',{map:stripeTex('#eceff1','#b0bec5',8),shine:60})); at(door,-.2,.68,L.d/2+.04); g.add(door);
    this.sign(g,'RESCUE',1.4,1.5,L.d/2+.07,{bg:'#37474f',size:84});
    windowRow(g,2,.45,1.05,L.w/2+.03,-.6,1.1,true);
    // wrecked car for practice
    const car=this.car({x:0,z:0},'#90a4ae',0); this.scene.remove(car); car.scale.setScalar(.75); car.rotation.set(0,.4,.12); at(car,L.w/2+.2,0,L.d/2+.7); g.add(car);
    // tool rack: spreader tool
    const tool=rbox(.18,.7,.18,.06,M('#ffca28',{shine:90})); tool.rotation.z=.5; at(tool,-L.w/2-.35,.4,.3); g.add(tool);
  }
  b_quarters(g,L,lv,trim){
    const walls=rbox(L.w,1.4,L.d,.2,M('#ffe0b2',{shine:25})); at(walls,0,.7,0); g.add(walls);
    // pitched roof: extruded gable
    { const hd=L.d/2+.35, rh=1.0, sh=new THREE.Shape(); sh.moveTo(-hd,0); sh.lineTo(hd,0); sh.lineTo(0,rh); sh.closePath();
      const geo=new THREE.ExtrudeGeometry(sh,{depth:L.w+.4,bevelEnabled:true,bevelThickness:.06,bevelSize:.06,bevelSegments:2}); geo.translate(0,0,-(L.w+.4)/2);
      const roof=new THREE.Mesh(geo,M('#e2512a',{shine:50})); roof.castShadow=true; roof.receiveShadow=true; roof.rotation.y=Math.PI/2; at(roof,0,1.4,0); g.add(roof); }
    const tr=rbox(L.w+.1,.1,L.d+.1,.04,M(trim)); at(tr,0,1.42,0); g.add(tr);
    const chim=rbox(.4,.9,.4,.08,M('#8d6e63')); at(chim,-L.w/2+.7,2.2,-.4); g.add(chim); this.chimney=new THREE.Vector3();
    chim.updateMatrixWorld(); this.chimneyObj=chim;
    const door=rbox(.6,.95,.1,.05,M('#6d4c41',{shine:60})); at(door,0,.5,L.d/2+.03); g.add(door);
    windowRow(g,2,.45,.85,L.d/2+.03,-1.0,2.0); windowRow(g,2,.45,.85,L.w/2+.03,-.7,1.4,true);
    // BBQ / sizzle stand
    const bbq=rbox(.9,.5,.5,.08,M('#424242',{shine:80})); at(bbq,L.w/2+.15,.35,L.d/2+.75); const plate=box(.8,.05,.42,M('#757575',{shine:120})); at(plate,L.w/2+.15,.62,L.d/2+.75);
    const umb=new THREE.Mesh(new THREE.ConeGeometry(.75,.35,12),M('#e53935',{shine:60})); umb.castShadow=true; at(umb,L.w/2+.15,1.5,L.d/2+.75); const ump=cyl(.03,.03,1.3,M('#eee'),6); at(ump,L.w/2+.15,.85,L.d/2+.75);
    g.add(bbq,plate,umb,ump);
    for(let i=0;i<3;i++){ const sn=cyl(.04,.04,.3,M('#a0522d'),6); sn.rotation.z=Math.PI/2; at(sn,L.w/2+.15,.67,L.d/2+.65+i*.1); g.add(sn); }
  }
  b_comms(g,L,lv,trim){
    const walls=rbox(L.w*.85,1.3,L.d*.85,.22,M('#cfd8dc',{shine:40})); at(walls,0,.65,0); g.add(walls);
    const roof=rbox(L.w*.9+.2,.25,L.d*.9+.2,.1,M('#455a64')); at(roof,0,1.42,0); g.add(roof);
    const tr=rbox(L.w*.9+.22,.08,L.d*.9+.22,.03,M(trim)); at(tr,0,1.29,0); g.add(tr);
    windowRow(g,2,.42,.8,L.d*.425+.03,-.45,.9); windowRow(g,1,.42,.8,L.w*.425+.03,0,0,true);
    const mh=2.4+lv*.18; const mast=cyl(.06,.1,mh,M('#eceff1',{shine:90}),8); at(mast,-.5,1.5+mh/2,-.5); g.add(mast);
    for(let i=1;i<4;i++){ const cr=box(.6-i*.1,.04,.04,M('#eceff1')); at(cr,-.5,1.5+i*mh/4,-.5); g.add(cr); }
    const tip=sph(.12,M('#ff1744',{em:0xff1744,ei:1}),10); at(tip,-.5,1.5+mh+.05,-.5); g.add(tip); this.mastTip=tip;
    const dish=new THREE.Mesh(new THREE.SphereGeometry(.45,16,8,0,Math.PI*2,0,Math.PI/2.6),M('#ffffff',{shine:90,side:THREE.DoubleSide}));
    dish.material.side=THREE.DoubleSide; dish.castShadow=true; dish.rotation.x=-1.1; dish.rotation.z=.4; at(dish,.5,1.85,.3); g.add(dish);
  }

  setXmas(on){ if(!!this.xmasOn===!!on) return; this.xmasOn=!!on; if(this.xmasG){ this.scene.remove(this.xmasG); this.xmasG=null; } if(!on) return;
    const g=new THREE.Group(); const L=LAYOUT.engine, c=uv(L.u,L.v); const cols=[0xff1744,0xffea00,0x00e676,0x2979ff]; this.xlights=[];
    for(let i=0;i<22;i++){ const k=i/22; let x,z; const w=L.w/2+.2, d=L.d/2+.2; const per=k*4; const e=Math.floor(per), f=per-e;
      [x,z]=[[-w+2*w*f,d],[w,d-2*d*f],[w-2*w*f,-d],[-w,-d+2*d*f]][e]; const b=sph(.09,new THREE.MeshPhongMaterial({color:cols[i%4],emissive:cols[i%4],emissiveIntensity:.8}),8); b.castShadow=false; at(b,c.x+x,2.3,c.z+z); g.add(b); this.xlights.push(b); }
    const T=LAYOUT.tower, tp=uv(T.u,T.v), th=(this.towerH||3); const hat=new THREE.Mesh(new THREE.ConeGeometry(.55,1.0,16),M('#e53935',{shine:30})); hat.castShadow=true; at(hat,tp.x,th+.78,tp.z); hat.rotation.z=.3;
    const brim=new THREE.Mesh(new THREE.TorusGeometry(.55,.13,8,20),M('#ffffff')); brim.rotation.x=Math.PI/2; at(brim,tp.x,th+.3,tp.z);
    const pom=sph(.16,M('#ffffff')); pom.position.set(0,.52,0); hat.add(pom); g.add(hat,brim); this.scene.add(g); this.xmasG=g; }
  // ---- runtime ----
  setTrucksHome(n){ this.trucksHome=n; }
  launchTruck(){ const t=this.truck(); const L=LAYOUT.engine; const start=uv(0,L.v+1.6), end=uv(0,32);
    t.rotation.y=-Math.PI/4+Math.PI/2*0; t.rotation.y=Math.atan2(-(end.z-start.z),(end.x-start.x)); at(t,start.x,.12,start.z); this.scene.add(t);
    this.trucksOut.push({m:t,from:start,to:end,t:0,dur:4.5,dir:1}); }
  returnTruck(){ const t=this.truck(); const L=LAYOUT.engine; const start=uv(0,32), end=uv(0,L.v+1.6);
    t.rotation.y=Math.atan2(-(end.z-start.z),(end.x-start.x)); at(t,start.x,.12,start.z); this.scene.add(t); this.trucksOut.push({m:t,from:start,to:end,t:0,dur:4.5,dir:-1}); }
  select(id){ this.selected=id; if(!id){ this.ring.visible=false; return; } const L=LAYOUT[id], p=uv(L.u,L.v); this.ring.visible=true;
    this.ring.position.set(p.x,.25,p.z); const r=Math.max(L.w,L.d)*.78; this.ring.scale.set(r,r,1); this.bounce(id); }
  bounce(id){ const b=this.buildings[id]; if(b) b.bounceT=0.0001; }
  focus(id){ const L=LAYOUT[id]; this.panTarget={x:Math.max(-3.5,Math.min(3.5,L.u*0.4)), y:L.v-0.5}; }
  screenPos(id){ const L=LAYOUT[id], p=uv(L.u,L.v); const b=this.buildings[id]; const h=(b?b.top:2)+0.35;
    const v=new THREE.Vector3(p.x,h,p.z).project(this.cam); return { x:(v.x+1)/2*this.w, y:(1-v.y)/2*this.h }; }
  // ---- v3: disaster damage, weather mood, animal crew heads ----
  setDamage(id,on){ this.dmg=this.dmg||{}; if(!!this.dmg[id]===!!on) return; if(this.dmg[id]){ this.scene.remove(this.dmg[id].g); delete this.dmg[id]; } if(!on) return;
    const L=LAYOUT[id], p=uv(L.u,L.v), g=new THREE.Group();
    const scorch=new THREE.Mesh(new THREE.CircleGeometry(2.3,28),new THREE.MeshBasicMaterial({color:'#2b2622',transparent:true,opacity:.42,depthWrite:false})); scorch.rotation.x=-Math.PI/2; at(scorch,p.x,.06,p.z); g.add(scorch);
    const cols=['#7d7368','#5e5a55','#8d6e63','#9e9e9e'];
    for(let i=0;i<9;i++){ const r=rbox(.3+Math.random()*.35,.18+Math.random()*.2,.3+Math.random()*.3,.05,M(cols[i%4],{flat:true})); const a=Math.random()*6.28, d=1.2+Math.random()*1.1; at(r,p.x+Math.cos(a)*d,.12,p.z+Math.sin(a)*d); r.rotation.set(Math.random(),Math.random()*3,Math.random()); g.add(r); }
    const tarp=box(1.5,.06,1.1,M('#1e88e5',{shine:40})); at(tarp,p.x+.3,(this.buildings[id]?.top||2)-.05,p.z+.2); tarp.rotation.set(.12,.5,-.08); g.add(tarp);
    for(const dx of [-1.6,1.6]){ const c=new THREE.Mesh(new THREE.ConeGeometry(.16,.42,10),M('#ff6d00',{shine:60})); at(c,p.x+dx,.22,p.z+1.9); g.add(c); }
    this.scene.add(g); this.dmg[id]={g,pos:new THREE.Vector3(p.x,(this.buildings[id]?.top||2)+.3,p.z),t:Math.random()}; }
  setMood(type){ const bg={ash:'#d79a5f',rain:'#7f8d9b',wind:'#8c9ba6',hail:'#6e7c8b',fog:'#a3bf8c',shake:'#b9aa92'}[type]||'#8fd3ff';
    this.scene.background.set(bg); this.scene.fog.color.set(bg); this.sun.intensity=type?1.5:2.3; this.mood=type||null; this.town?.moodChanged?.(); }
  setHeads(list){ // list[i] = {url, svg}: painted head token if present, otherwise the SVG animal
    this.headList=list; this.walkers.concat(this.extraWalkers).forEach((w,i)=>{ const it=list[i%list.length]; if(!it) return; if(w.sprite){ w.m.remove(w.sprite); w.sprite.material.map?.dispose(); }
      w.m.children.forEach(ch=>{ if(ch.position.y>.72) ch.visible=false; });
      const mat=new THREE.SpriteMaterial({transparent:true,depthWrite:false}); const sp=new THREE.Sprite(mat); sp.scale.set(.66,.66,1); sp.position.set(0,.98,0); w.m.add(sp); w.sprite=sp;
      const useCanvas=img=>{ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'); x.save(); x.beginPath(); x.arc(64,64,60,0,7); x.closePath(); x.clip(); x.drawImage(img,0,0,128,128); x.restore();
        x.lineWidth=7; x.strokeStyle='#ffffff'; x.beginPath(); x.arc(64,64,59,0,7); x.stroke(); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; mat.map=t; mat.needsUpdate=true; };
      const img=new Image(); img.onload=()=>useCanvas(img); img.onerror=()=>{ const f=new Image(); f.onload=()=>useCanvas(f); f.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(it.svg); }; img.src=it.url; }); }
  update(dt){
    this.t+=dt; const t=this.t;
    if(this.panTarget){ this.pan.x+=(this.panTarget.x-this.pan.x)*Math.min(1,dt*6); this.pan.y+=(this.panTarget.y-this.pan.y)*Math.min(1,dt*6);
      if(Math.abs(this.panTarget.x-this.pan.x)+Math.abs(this.panTarget.y-this.pan.y)<.01) this.panTarget=null; this.updateCam(); }
    else if(this.vel&&(Math.abs(this.vel.x)+Math.abs(this.vel.y)>.01)&&!this.dragging){ this.pan.x+=this.vel.x*dt; this.pan.y+=this.vel.y*dt; this.vel.multiplyScalar(Math.pow(.9,dt*60)); this.updateCam(); }
    // bounce
    for(const b of Object.values(this.buildings)){ if(b.bounceT){ b.bounceT+=dt; const k=b.bounceT; const s=1+Math.sin(k*18)*Math.exp(-k*7)*.12; b.group.scale.set(1/s**.5,s,1/s**.5); if(k>1){ b.bounceT=0; b.group.scale.set(1,1,1);} } }
    if(this.ring.visible){ const s=1+Math.sin(t*5)*.04; this.ring.material.opacity=1; this.ring.scale.z=1; this.ring.rotation.z=t*.5; }
    // flag wave
    if(this.flagMesh){ const pos=this.flagMesh.geometry.attributes.position; const a=pos.array, b=this.flagBase;
      for(let i=0;i<a.length;i+=3){ const x=b[i]+.7; a[i+2]=Math.sin(x*4-t*5)*.12*x; } pos.needsUpdate=true; }
    if(this.dumbbell) this.dumbbell.rotation.y=t*.8;
    if(this.xlights) this.xlights.forEach((b,i)=>b.material.emissiveIntensity=(Math.floor(t*3+i)%2)?1.2:.15);
    if(this.mastTip) this.mastTip.material.emissiveIntensity=(Math.sin(t*4)>0)?1.2:.1;
    if(this.climber&&this.towerH){ const ph=(t*.12)%2; const y=ph<1?ph:2-ph; this.climber.position.set(this.climber.userData.x,.1+y*(this.towerH-.9),.55); }
    // chimney smoke
    if(this.chimneyObj){ this.smokeT=(this.smokeT||0)+dt; if(this.smokeT>.45){ this.smokeT=0; const p=this.puffs.find(p=>p.life<=0); if(p){ p.m.material.color.set('#ffffff'); const w=new THREE.Vector3(); this.chimneyObj.getWorldPosition(w); p.m.position.copy(w).add(new THREE.Vector3(0,.55,0)); p.life=2.4; p.m.visible=true; } } }
    if(this.dmg) for(const k in this.dmg){ const d=this.dmg[k]; d.t+=dt; if(d.t>.32){ d.t=0; const p=this.puffs.find(p=>p.life<=0); if(p){ p.m.material.color.set('#555555'); p.m.position.copy(d.pos).add(new THREE.Vector3((Math.random()-.5)*.8,0,(Math.random()-.5)*.8)); p.m.visible=true; p.life=2.4; } } }
    for(const p of this.puffs){ if(p.life>0){ p.life-=dt; p.m.position.y+=dt*.6; p.m.position.x+=dt*.25; const k=1-p.life/2.4; p.m.scale.setScalar(.6+k*1.6); p.m.material.opacity=.75*(1-k); if(p.life<=0) p.m.visible=false; } }
    // walkers
    for(const w of this.walkers){ if(w.wait>0){ w.wait-=dt; continue; } const m=w.m, dx=w.next.x-m.position.x, dz=w.next.z-m.position.z, L=Math.hypot(dx,dz);
      if(L<.05){ w.i=(w.i+1+(Math.random()*3|0))%w.pts.length; w.next=w.pts[w.i]; w.wait=Math.random()*2.5; continue; }
      const sp=w.sp*dt; m.position.x+=dx/L*Math.min(sp,L); m.position.z+=dz/L*Math.min(sp,L); m.rotation.y=Math.atan2(dx,dz);
      const sw=Math.sin(t*10*w.sp)*.25; m.userData.legs[0].rotation.x=sw; m.userData.legs[1].rotation.x=-sw; m.position.y=.15+Math.abs(Math.sin(t*10*w.sp))*.04; }
    // trucks driving
    for(const tr of this.trucksOut){ tr.t+=dt/tr.dur; const k=tr.t<1?(tr.dir>0?tr.t*tr.t:1-(1-tr.t)*(1-tr.t)):1;
      tr.m.position.x=tr.from.x+(tr.to.x-tr.from.x)*k; tr.m.position.z=tr.from.z+(tr.to.z-tr.from.z)*k;
      const on=Math.floor(t*8)%2; tr.m.userData.lights[0].material.emissiveIntensity=on?1.4:.1; tr.m.userData.lights[1].material.emissiveIntensity=on?.1:1.4;
      if(tr.t>=1){ this.scene.remove(tr.m); tr.done=true; } }
    this.trucksOut=this.trucksOut.filter(t=>!t.done);
    this.town?.update(dt,t);
    this.renderer.render(this.scene,this.cam);
  }
  bindInput(){
    const el=this.renderer.domElement, pts=new Map(); let start=null, pinch0=null;
    let hooked=false;
    el.addEventListener('pointerdown',e=>{ e.preventDefault(); el.setPointerCapture?.(e.pointerId);
      if(pts.size===0&&this.hook?.down?.(e.clientX,e.clientY)){ hooked=true; pts.set(e.pointerId,{x:e.clientX,y:e.clientY}); return; }
      pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pts.size===1){ start={x:e.clientX,y:e.clientY,pan:this.pan.clone(),moved:false,t:performance.now()}; this.panTarget=null; this.vel=new THREE.Vector2(); this.dragging=true; }
      if(pts.size===2){ const [a,b]=[...pts.values()]; pinch0={d:Math.hypot(a.x-b.x,a.y-b.y),z:this.zoom}; if(start) start.moved=true; } },{passive:false});
    el.addEventListener('pointermove',e=>{ if(!pts.has(e.pointerId)) return; if(hooked){ this.hook?.move?.(e.clientX,e.clientY); return; } const prev=pts.get(e.pointerId); pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pts.size===2&&pinch0){ const [a,b]=[...pts.values()]; const d=Math.hypot(a.x-b.x,a.y-b.y); this.zoom=Math.max(this.zMin,Math.min(this.zMax,pinch0.z*d/pinch0.d)); this.updateCam(); return; }
      if(!start) return; const dx=e.clientX-start.x, dy=e.clientY-start.y; if(!start.moved&&Math.hypot(dx,dy)>8) start.moved=true;
      if(start.moved){ const unit=(this.cam.right-this.cam.left)/this.w; const vScale=1/Math.sin(Math.atan2(1.15,Math.SQRT2));
        const nx=start.pan.x-dx*unit, ny=start.pan.y-dy*unit*vScale;
        const now=performance.now(); this.vel.set((nx-this.pan.x)/Math.max(.016,(now-(this.lastMv||now))/1000)*.5,(ny-this.pan.y)/Math.max(.016,(now-(this.lastMv||now))/1000)*.5); this.lastMv=now;
        this.pan.set(nx,ny); this.updateCam(); } });
    const up=e=>{ if(!pts.has(e.pointerId)) return; if(hooked){ pts.delete(e.pointerId); hooked=false; this.hook?.up?.(e.clientX,e.clientY); return; } pts.delete(e.pointerId); if(pts.size<2) pinch0=null;
      if(pts.size===0){ this.dragging=false; if(start&&!start.moved&&e.type==='pointerup') this.tap(e.clientX,e.clientY); else if(this.vel&&performance.now()-(this.lastMv||0)>80) this.vel.set(0,0); start=null; } };
    el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up);
    el.addEventListener('wheel',e=>{ e.preventDefault(); this.zoom=Math.max(this.zMin,Math.min(this.zMax,this.zoom*(e.deltaY>0?.92:1.08))); this.updateCam(); },{passive:false});
  }
  tap(cx,cy){ const r=this.renderer.domElement.getBoundingClientRect(); this.ptr.set((cx-r.left)/r.width*2-1, -((cy-r.top)/r.height)*2+1);
    this.raycaster.setFromCamera(this.ptr,this.cam); if(this.town&&this.town.tap(this.raycaster,cx,cy)) return; const hits=this.raycaster.intersectObjects(Object.values(this.buildings).map(b=>b.hit),false);
    if(hits.length){ this.onSelect(hits[0].object.userData.bid); } else this.onTapEmpty(); }
}
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

export { THREE, M, rbox, box, cyl, sph, at, textTex, stripeTex, hazardTex, windowRow, uv, mulberry };
