// Firey Station Tycoon v5: renders a drill raid (own scene) or a defence replay (on your real town).
// Draw-call budget: one merged mesh + one outline per troop, all legs / blob shadows / projectiles / rubble are
// InstancedMeshes, and every particle (water, sparks, dust, embers) is one Points object.
import { THREE, M, OUTLINE, ramp, mulberry } from './scene.js';
import { RoundedBoxGeometry } from './vendor/three.bundle.min.js';
import { mergeGeometries } from './vendor/three.bundle.min.js';
import * as TD from './towndata.js';
import * as War from './war.js';
import * as W from './wardata.js';
import { wallMask } from './town3d.js';
const { CELL, GRID, TB } = TD; const HALF=GRID*CELL/2, GY=-0.5;
const wx=x=>-HALF+x*CELL, wz=y=>-HALF+y*CELL;
const V=new THREE.Vector3(), Q=new THREE.Quaternion(), S1=new THREE.Vector3(1,1,1), MX=new THREE.Matrix4(), UP=new THREE.Vector3(0,1,0);

/* ---------- troop models: built from primitives, vertex-coloured, merged into one geometry each ---------- */
let VCMAT=null; const vcMat=()=>VCMAT||(VCMAT=new THREE.MeshToonMaterial({vertexColors:true,gradientMap:ramp()}));
function part(geo,col,x,y,z,o={}){ const g=geo.index?geo.toNonIndexed():geo; if(o.rx) g.rotateX(o.rx); if(o.ry) g.rotateY(o.ry); if(o.rz) g.rotateZ(o.rz); if(o.s) g.scale(...o.s); g.translate(x,y,z);
  const c=new THREE.Color(col), n=g.attributes.position.count, a=new Float32Array(n*3); for(let i=0;i<n;i++){ a[i*3]=c.r; a[i*3+1]=c.g; a[i*3+2]=c.b; } g.setAttribute('color',new THREE.BufferAttribute(a,3)); for(const k of Object.keys(g.attributes)) if(!['position','normal','color'].includes(k)) g.deleteAttribute(k); return g; }
const Sp=(r,s=12)=>new THREE.SphereGeometry(r,s,Math.max(6,s*.7|0)), Bx=(w,h,d)=>{ const m=Math.min(w,h,d); return m>=.04?new RoundedBoxGeometry(w,h,d,2,Math.min(m*.32,m/2-.001)):new THREE.BoxGeometry(w,h,d); }, Cy=(a,b,h,s=12)=>new THREE.CylinderGeometry(a,b,h,s), Co=(r,h,s=10)=>new THREE.ConeGeometry(r,h,s);
const SKIN='#f2c29a';
function firey(ps,o){ const coat=o.coat||'#e0b33a', hel=o.hel||'#ffd23f'; ps.push(part(Bx(.42,.42,.3),coat,0,.48,0), part(Bx(.44,.06,.32),'#e8ff6a',0,.44,0), part(Bx(.44,.06,.32),'#e8ff6a',0,.6,0));
  ps.push(part(Sp(.27),o.skin||SKIN,0,.92,0), part(Sp(.3),hel,0,1.02,-.02,{s:[1,.72,1.08]}), part(Cy(.36,.38,.04,16),hel,0,.96,-.04), part(Bx(.12,.08,.04),'#ffffff',0,1.08,.27));
  ps.push(part(Sp(.045,6),'#222',-.09,.94,.24), part(Sp(.045,6),'#222',.09,.94,.24), part(Bx(.12,.3,.12),coat,-.27,.5,.04,{rz:.25}), part(Bx(.12,.3,.12),coat,.27,.5,.04,{rz:-.25})); }
function animalHead(ps,sp){ const fur={roo:'#c98b55',koala:'#9e9e9e',wombat:'#8d6e63',platypus:'#795548'}[sp]||'#bcaaa4';
  ps.push(part(Sp(.3),fur,0,.95,0)); if(sp==='roo'){ ps.push(part(Co(.08,.3,6),fur,-.12,1.28,0), part(Co(.08,.3,6),fur,.12,1.28,0), part(Sp(.12),fur,0,.88,.24,{s:[1,.8,1.4]})); }
  else if(sp==='koala'){ ps.push(part(Sp(.15),fur,-.27,1.1,0), part(Sp(.15),fur,.27,1.1,0), part(Sp(.09),'#37474f',0,.92,.28,{s:[1,1.2,.8]})); }
  else if(sp==='platypus'){ ps.push(part(Bx(.3,.06,.24),'#455a64',0,.88,.32)); } else { ps.push(part(Sp(.1),'#5d4037',0,.88,.27)); }
  ps.push(part(Sp(.045,6),'#111',-.1,1.0,.26), part(Sp(.045,6),'#111',.1,1.0,.26), part(Cy(.32,.34,.05,16),'#ffd23f',0,1.18,0), part(Bx(.12,.12,.04),'#ffcf33',0,1.22,.3)); }
function truck(ps,col,ladder){ ps.push(part(Bx(.9,.55,1.7),col,0,.45,0), part(Bx(.88,.4,.5),col,0,.88,.55), part(Bx(.8,.25,.05),'#bfe8ff',0,.9,.81), part(Bx(.92,.06,1.72),'#ffffff',0,.5,0));
  for(const [a,b] of [[-.45,.5],[.45,.5],[-.45,-.5],[.45,-.5]]) ps.push(part(Cy(.18,.18,.14,10),'#222',a,.18,b,{rz:Math.PI/2}));
  ps.push(part(Bx(.3,.08,.12),'#ff1744',-.2,1.12,.55), part(Bx(.3,.08,.12),'#2979ff',.2,1.12,.55));
  if(ladder){ ps.push(part(Cy(.22,.25,.15,10),'#90a4ae',0,.8,-.3), part(Bx(.18,.1,1.9),'#cfd8dc',0,1.1,-.1,{rx:-.35})); } else ps.push(part(Cy(.38,.38,1.1,14),'#eceff1',0,.9,-.25,{rx:Math.PI/2})); }
function geoFor(kind,sp){ const ps=[];
  if(kind==='hose'){ firey(ps,{}); ps.push(part(Cy(.05,.05,.4,6),'#d32f2f',.2,.45,.25,{rx:Math.PI/2.4}), part(Cy(.06,.04,.16,6),'#9e9e9e',.2,.52,.45,{rx:Math.PI/2})); }
  else if(kind==='ladder'){ firey(ps,{coat:'#d84315'}); ps.push(part(Bx(.06,1.2,.06),'#bdbdbd',-.32,.75,-.2), part(Bx(.06,1.2,.06),'#bdbdbd',-.08,.75,-.2)); for(let k=0;k<4;k++) ps.push(part(Bx(.24,.04,.04),'#bdbdbd',-.2,.3+k*.3,-.2)); }
  else if(kind==='chainsaw'){ firey(ps,{coat:'#558b2f',hel:'#ff6f00'}); ps.push(part(Bx(.16,.16,.28),'#ff6f00',.22,.42,.32), part(Bx(.05,.08,.4),'#9e9e9e',.22,.42,.6)); }
  else if(kind==='hazmat'){ firey(ps,{coat:'#fdd835',hel:'#fdd835'}); ps.push(part(Bx(.36,.2,.05),'#80deea',0,.94,.27), part(Cy(.12,.12,.4,8),'#9e9e9e',0,.55,-.25), part(Cy(.06,.06,.3,6),'#76ff03',.25,.45,.3,{rx:Math.PI/2})); }
  else if(kind==='tanker') truck(ps,'#7b1fa2',false);
  else if(kind==='aerial') truck(ps,'#d32f2f',true);
  else if(kind==='heli'){ ps.push(part(Sp(.42),'#ff7043',0,.5,0,{s:[1,.85,1.5]}), part(Sp(.26),'#bfe8ff',0,.6,.42), part(Bx(.1,.1,.9),'#ff7043',0,.55,-.75), part(Bx(.05,.35,.22),'#ffffff',0,.72,-1.15), part(Cy(.16,.12,.24,8),'#29b6f6',0,.08,0), part(Bx(.05,.05,.9),'#333',-.3,.08,0), part(Bx(.05,.05,.9),'#333',.3,.08,0), part(Bx(1.8,.03,.1),'#263238',0,.98,0), part(Bx(.1,.03,1.8),'#263238',0,.98,0)); }
  else if(kind==='hero'){ ps.push(part(Bx(.46,.46,.34),'#c62828',0,.5,0), part(Bx(.48,.07,.36),'#e8ff6a',0,.46,0), part(Bx(.14,.32,.14),'#c62828',-.3,.52,.04,{rz:.25}), part(Bx(.14,.32,.14),'#c62828',.3,.52,.04,{rz:-.25}), part(Co(.12,.18,5),'#ffcf33',0,.62,.2,{rx:Math.PI/2})); animalHead(ps,sp); }
  else if(kind==='ember'){ ps.push(part(Sp(.3),'#ff9800',0,.45,0), part(Co(.22,.5,8),'#ffca28',0,.85,0), part(Co(.12,.3,6),'#ff5722',.18,.7,0), part(Co(.12,.3,6),'#ff5722',-.18,.7,0), part(Sp(.05,6),'#3e2723',-.1,.5,.27), part(Sp(.05,6),'#3e2723',.1,.5,.27)); }
  else if(kind==='blaze'){ ps.push(part(Sp(.5),'#e64a19',0,.65,0), part(Co(.4,.9,8),'#ff9800',0,1.3,0), part(Sp(.18),'#5d4037',-.45,.55,.1), part(Sp(.18),'#5d4037',.45,.55,.1), part(Sp(.07,6),'#fff176',-.15,.75,.45), part(Sp(.07,6),'#fff176',.15,.75,.45)); }
  else if(kind==='firebug'){ ps.push(part(Sp(.32),'#4e342e',0,.35,0,{s:[1,.7,1.3]}), part(Sp(.18),'#3e2723',0,.4,.38), part(Co(.06,.3,5),'#ff5722',-.1,.62,.45,{rx:-.6}), part(Co(.06,.3,5),'#ff5722',.1,.62,.45,{rx:-.6}), part(Sp(.12),'#ff7043',0,.55,-.2)); }
  else if(kind==='smoke'){ ps.push(part(Sp(.4),'#757575',0,.5,0), part(Sp(.3),'#9e9e9e',.3,.7,0), part(Sp(.3),'#616161',-.3,.65,.1), part(Sp(.06,6),'#ff5722',-.12,.55,.36), part(Sp(.06,6),'#ff5722',.12,.55,.36)); }
  const g=mergeGeometries(ps,false); g.computeBoundingSphere(); return g; }
const GEO=new Map(); const troopGeo=(k,sp)=>{ const key=k+(sp||''); if(!GEO.has(key)) GEO.set(key,geoFor(k,sp)); return GEO.get(key); };
const LEGS_ON=new Set(['hose','ladder','chainsaw','hazmat','hero','ember','blaze','firebug']);

/* ---------- particles ---------- */
class Particles { constructor(n=700){ this.n=n; this.p=new Float32Array(n*3); this.c=new Float32Array(n*3); this.sz=new Float32Array(n); this.a=new Float32Array(n); this.v=new Float32Array(n*3); this.life=new Float32Array(n); this.max=new Float32Array(n); this.grav=new Float32Array(n); this.grow=new Float32Array(n); this.i=0;
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(this.p,3)); g.setAttribute('color',new THREE.BufferAttribute(this.c,3)); g.setAttribute('size',new THREE.BufferAttribute(this.sz,1)); g.setAttribute('alpha',new THREE.BufferAttribute(this.a,1));
    const m=new THREE.ShaderMaterial({ transparent:true, depthWrite:false, uniforms:{ scale:{value:1} }, vertexShader:`attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA; uniform float scale; void main(){ vC=color; vA=alpha; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv; gl_PointSize=size*scale; }`,
      fragmentShader:`varying vec3 vC; varying float vA; void main(){ vec2 d=gl_PointCoord-.5; float r=dot(d,d); if(r>.25) discard; float e=smoothstep(.25,.12,r); gl_FragColor=vec4(vC*(1.05-r*.8),vA*e); }` });
    this.mesh=new THREE.Points(g,m); this.mesh.frustumCulled=false; this.mesh.renderOrder=5; }
  emit(x,y,z,vx,vy,vz,col,size,life,grav=-6,grow=0){ const i=this.i=(this.i+1)%this.n; this.p.set([x,y,z],i*3); this.v.set([vx,vy,vz],i*3); const c=col.isColor?col:new THREE.Color(col); this.c.set([c.r,c.g,c.b],i*3); this.sz[i]=size; this.life[i]=life; this.max[i]=life; this.grav[i]=grav; this.grow[i]=grow; this.a[i]=1; }
  update(dt){ for(let i=0;i<this.n;i++){ if(this.life[i]<=0){ if(this.a[i]){ this.a[i]=0; } continue; } this.life[i]-=dt; const k=i*3; this.v[k+1]+=this.grav[i]*dt; this.p[k]+=this.v[k]*dt; this.p[k+1]+=this.v[k+1]*dt; this.p[k+2]+=this.v[k+2]*dt; if(this.p[k+1]<GY+.05&&this.grav[i]<0){ this.p[k+1]=GY+.05; this.v[k+1]*=-.3; this.v[k]*=.6; this.v[k+2]*=.6; }
      this.sz[i]+=this.grow[i]*dt; this.a[i]=Math.min(1,this.life[i]/this.max[i]*1.6); }
    const g=this.mesh.geometry; g.attributes.position.needsUpdate=true; g.attributes.color.needsUpdate=true; g.attributes.size.needsUpdate=true; g.attributes.alpha.needsUpdate=true; } }

/* ---------- the view ---------- */
export class BattleView {
  constructor(base, town, B, opt={}){ this.base=base; this.town=town; this.B=B; this.opt=opt; this.home=!!opt.home; this.t=0; this.acc=0; this.speed=opt.speed||1; this.running=!!opt.running; this.objs=new Map(); this.units=new Map(); this.floaters=[]; this.dmgAcc=new Map(); this.lastStars=0;
    this.fx=opt.fxEl; this.scene=this.home?base.scene:this.makeScene(); this.root=new THREE.Group(); this.scene.add(this.root);
    this.parts=new Particles(); this.root.add(this.parts.mesh);
    const blob=new THREE.CircleGeometry(.42,16); blob.rotateX(-Math.PI/2); this.blobs=new THREE.InstancedMesh(blob,new THREE.MeshBasicMaterial({color:'#000',transparent:true,opacity:.28,depthWrite:false}),120); this.blobs.count=0; this.blobs.renderOrder=2; this.root.add(this.blobs);
    const leg=new THREE.BoxGeometry(.14,.26,.14); leg.translate(0,-.13,0); this.legs=new THREE.InstancedMesh(leg,new THREE.MeshToonMaterial({gradientMap:ramp()}),240); this.legs.count=0; this.legs.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(240*3),3); this.root.add(this.legs);
    this.projM=new THREE.InstancedMesh(new THREE.SphereGeometry(.2,10,8),new THREE.MeshToonMaterial({gradientMap:ramp(),emissive:'#0b3d5c'}),120); this.projM.count=0; this.projM.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(120*3),3); this.root.add(this.projM);
    this.rubG=this.rubbleGeo(); this.rub=new THREE.InstancedMesh(this.rubG,vcMat(),160); this.rub.count=0; this.rub.receiveShadow=true; this.root.add(this.rub);
    this.redZone=this.makeRed(); this.root.add(this.redZone);
    if(!this.home) this.buildBase(); else this.mapHome();
    this.hpEls=new Map(); }
  makeScene(){ const s=new THREE.Scene(); s.background=new THREE.Color('#7ec8ff'); s.fog=new THREE.Fog('#7ec8ff',90,260);
    s.add(new THREE.HemisphereLight('#f3fbff','#4f7a2a',1.3)); const sun=new THREE.DirectionalLight('#fff1d6',2.4); sun.position.set(14,30,20); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); const c=sun.shadow.camera; c.left=-34; c.right=34; c.top=34; c.bottom=-34; c.far=110; sun.shadow.bias=-.0006; sun.shadow.normalBias=.03; s.add(sun,sun.target); this.sun=sun;
    // grass: two-tone tiles, dirt pads under buildings, worn paths
    const cv=document.createElement('canvas'); cv.width=cv.height=1024; const g=cv.getContext('2d'); const px=1024/GRID;
    for(let j=0;j<GRID;j++) for(let i=0;i<GRID;i++){ g.fillStyle=(i+j)%2?'#86e05a':'#7dd852'; g.fillRect(i*px,j*px,px+1,px+1); }
    const R=mulberry(3); g.lineCap='round'; for(let k=0;k<700;k++){ const x0=R()*1024,y0=R()*1024; g.lineWidth=2.6; g.strokeStyle='#4fae38'; g.beginPath(); for(const d of [-5,0,5]){ g.moveTo(x0+d*.6,y0+4); g.quadraticCurveTo(x0+d*.9,y0-2,x0+d*1.5,y0-8+Math.abs(d)*.6); } g.stroke(); g.lineWidth=1.4; g.strokeStyle='#b8f58c'; g.beginPath(); g.moveTo(x0,y0+3); g.quadraticCurveTo(x0,y0-2,x0+.7,y0-6); g.stroke(); }
    for(const o of this.B.b){ if(o.trap) continue; g.fillStyle=o.wall?'rgba(150,110,60,.3)':'#e8c88a'; for(const [i,j] of o.cells){ g.beginPath(); g.roundRect(i*px+(o.wall?6:-4),j*px+(o.wall?6:-4),px-(o.wall?12:-8),px-(o.wall?12:-8),10); g.fill(); } }
    g.strokeStyle='rgba(0,0,0,.18)'; g.lineWidth=10; g.strokeRect(5,5,1014,1014);
    const tex=new THREE.CanvasTexture(cv); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4;
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(GRID*CELL,GRID*CELL),new THREE.MeshToonMaterial({map:tex,gradientMap:ramp()})); ground.rotation.x=-Math.PI/2; ground.position.y=GY; ground.receiveShadow=true; s.add(ground);
    const outer=new THREE.Mesh(new THREE.PlaneGeometry(260,260),new THREE.MeshToonMaterial({color:'#5cc443',gradientMap:ramp()})); outer.rotation.x=-Math.PI/2; outer.position.y=GY-.02; s.add(outer);
    // ring of instanced trees and rocks around the map
    const n=150, tg=new THREE.IcosahedronGeometry(1,1); tg.translate(0,1.6,0); const tr=new THREE.CylinderGeometry(.18,.25,1.2,6); tr.translate(0,.6,0);
    const can=new THREE.InstancedMesh(tg,new THREE.MeshToonMaterial({gradientMap:ramp()}),n), trk=new THREE.InstancedMesh(tr,M('#7a4b2a'),n); can.castShadow=true;
    for(let k=0;k<n;k++){ const a=R()*Math.PI*2, side=Math.floor(R()*4), t=(R()-.5)*(GRID*CELL+14), off=HALF+2+R()*9; const x=side===0?t:side===1?t:side===2?off:-off, z=side===0?off:side===1?-off:t; const sc=.8+R()*.7;
      MX.compose(V.set(x,GY,z),Q.setFromAxisAngle(UP,a),new THREE.Vector3(sc,sc*(.9+R()*.4),sc)); can.setMatrixAt(k,MX); trk.setMatrixAt(k,MX); can.setColorAt(k,new THREE.Color(['#43c443','#5fd35a','#38b04a','#8cc63f'][k%4])); }
    const ol=new THREE.InstancedMesh(tg,OUTLINE,n); ol.instanceMatrix=can.instanceMatrix; s.add(can,trk,ol); return s; }
  rubbleGeo(){ const ps=[]; const R=mulberry(11); for(let k=0;k<9;k++){ const b=new THREE.DodecahedronGeometry(.18+R()*.22,0); ps.push(part(b,['#8d6e63','#a1887f','#6d4c41','#9e9e9e','#bdbdbd'][k%5],(R()-.5)*1.4,.08+R()*.15,(R()-.5)*1.4)); }
    ps.push(part(new THREE.BoxGeometry(.9,.06,.12),'#5d4037',.1,.1,.2,{ry:.6}), part(new THREE.BoxGeometry(.7,.06,.12),'#5d4037',-.2,.14,-.1,{ry:-.4})); return mergeGeometries(ps,false); }
  makeRed(){ const cells=[]; for(let j=0;j<GRID;j++) for(let i=0;i<GRID;i++) if(War.forbidden(this.B,i,j)&&!(this.B.grid[j*GRID+i]>=0)) cells.push([i,j]);
    const gs=cells.map(([i,j])=>{ const p=new THREE.PlaneGeometry(CELL*.96,CELL*.96); p.rotateX(-Math.PI/2); p.translate(wx(i+.5),GY+.04,wz(j+.5)); return p; }); const m=new THREE.Mesh(gs.length?mergeGeometries(gs,false):new THREE.PlaneGeometry(0,0),new THREE.MeshBasicMaterial({color:'#ff3b30',transparent:true,opacity:0,depthWrite:false})); m.renderOrder=1; m.userData.cells=cells.length; return m; }
  flashRed(){ this.redT=1.6; }
  buildBase(){ const wset=new Set(this.B.b.filter(o=>o.wall).map(o=>o.cells[0].join(',')));
    for(const o of this.B.b){ if(o.trap) continue; const C=this.town.build(o.t,o.lv,{mask:o.wall?wallMask(wset,o.cells[0][0],o.cells[0][1]):0}); const grp=new THREE.Group(); grp.add(C.g); grp.position.set(wx(o.cx),GY,wz(o.cy)); this.root.add(grp); this.objs.set(o.k,{grp,C,top:C.top,o}); } }
  mapHome(){ for(const o of this.B.b){ const tob=this.town.objs.get(o.id); if(tob) this.objs.set(o.k,{grp:tob.grp,C:tob.C,top:tob.top,o,home:true}); else this.objs.set(o.k,{grp:null,top:3,o}); } this.hidden=[]; }
  dispose(){ this.scene.remove(this.root); if(this.home){ (this.hidden||[]).forEach(g=>g.visible=true); } for(const u of this.units.values()){ u.m.geometry=null; } this.units.clear(); this.fx&&(this.fx.innerHTML='');
    if(!this.home){ this.scene.traverse(o=>{ if(o.isMesh&&o.geometry&&!o.geometry.userData?.shared&&!GEO_SET.has(o.geometry)) o.geometry.dispose(); }); } }
  tileAt(rc){ const pl=new THREE.Plane(new THREE.Vector3(0,1,0),-GY); const h=new THREE.Vector3(); if(!rc.ray.intersectPlane(pl,h)) return null; return { x:(h.x+HALF)/CELL, y:(h.z+HALF)/CELL }; }
  tap(rc,cx,cy){ const p=this.tileAt(rc); if(p&&this.opt.onTap) this.opt.onTap(p.x,p.y,cx,cy); }
  scr(x,y,z){ V.set(x,y,z).project(this.base.cam); return { x:(V.x+1)/2*this.base.w, y:(1-V.y)/2*this.base.h, on:Math.abs(V.x)<1.1&&Math.abs(V.y)<1.1 }; }
  float(x,y,z,html,cls){ if(!this.fx) return; const el=document.createElement('div'); el.className='bfl '+(cls||''); el.innerHTML=html; this.fx.appendChild(el); this.floaters.push({el,x,y,z,t:0}); }
  /* ---- events from the sim ---- */
  onEv(e){ const P=this.parts, B=this.B;
    if(e.e==='spawn'){ const u=e.u; const kind=u.type==='hero'?'hero':u.type; const geo=troopGeo(kind,u.sp); const m=new THREE.Mesh(geo,vcMat()); const ol=new THREE.Mesh(geo,OUTLINE); m.add(ol); const sc=1.5*(u.type==='hero'?1.35:u.big?1.25:u.enemy&&u.type==='blaze'?1.3:1); m.scale.setScalar(.01); this.root.add(m);
      this.units.set(u.id,{u,m,sc,born:0,legs:LEGS_ON.has(kind),walk:Math.random()*6,col:new THREE.Color(kind==='hazmat'?'#fdd835':u.enemy?'#5d4037':'#37474f')}); for(let k=0;k<12;k++) P.emit(wx(u.x),GY+.3,wz(u.y),(Math.random()-.5)*3,1+Math.random()*2,(Math.random()-.5)*3,u.enemy?'#ff9800':'#ffffff',22,.6,-3,20); this.opt.onUnit&&this.opt.onUnit(u); }
    else if(e.e==='atk'){ const U=this.units.get(e.u.id), o=e.b; if(!U) return; const u=e.u; const sx=wx(u.x), sz=wz(u.y), tx=wx(o.cx), tz=wz(o.cy), top=GY+Math.min(2.5,(this.objs.get(o.k)?.top||1.5)*.7);
      const water=!u.enemy, col=water?(u.type==='hazmat'?'#e8ffd0':'#5ec8ff'):'#ff7a1a'; const n=u.range>1.5||u.air?16:6; const sy=GY+(u.air?2.8:.7);
      for(let k=0;k<n;k++){ const f=.25+Math.random()*.15; P.emit(sx,sy,sz,(tx-sx)/f/2*(.85+Math.random()*.3),(top-sy)/f/2+3.2,(tz-sz)/f/2*(.85+Math.random()*.3),col,water?14:18,f*2,-6); }
      for(let k=0;k<5;k++) P.emit(tx+(Math.random()-.5),top,tz+(Math.random()-.5),(Math.random()-.5)*4,2+Math.random()*3,(Math.random()-.5)*4,water?'#ffffff':'#ffd54f',10,.45,-9);
      if(!u.enemy&&!this.opt.quiet) this.opt.sfx&&this.opt.sfx('hose'); }
    else if(e.e==='dmg'){ const o=e.b; const a=(this.dmgAcc.get(o.k)||0)+e.d; this.dmgAcc.set(o.k,a); o._hitT=2.2; }
    else if(e.e==='destroy'){ const o=e.b, ob=this.objs.get(o.k); const x=wx(o.cx), z=wz(o.cy);
      for(let k=0;k<(o.wall?10:34);k++) P.emit(x+(Math.random()-.5)*2,GY+.5+Math.random()*1.5,z+(Math.random()-.5)*2,(Math.random()-.5)*3,1+Math.random()*2.5,(Math.random()-.5)*3,['#8d6e63','#9e9e9e','#bdbdbd','#6d4c41'][k%4],40+Math.random()*30,1.4,-1.5,30);
      if(ob&&ob.grp){ ob.dying=0; if(this.home) this.hidden.push(ob.grp); }
      const cells=o.cells.length>16?o.cells.filter((c,i)=>i%6===0):o.cells; for(const [i,j] of cells){ if(this.rub.count>=160) break; MX.compose(V.set(wx(i+.5),GY,wz(j+.5)),Q.setFromAxisAngle(UP,Math.random()*6),S1); this.rub.setMatrixAt(this.rub.count++,MX); } this.rub.instanceMatrix.needsUpdate=true;
      if(!o.wall){ const s=this.scr(x,GY+2,z); this.opt.onDestroy&&this.opt.onDestroy(o,s); } this.opt.sfx&&this.opt.sfx(o.wall?'wall':'boom'); }
    else if(e.e==='fire'){ const ob=this.objs.get(e.b.k); if(ob&&ob.C&&ob.C.head&&e.p.u!==undefined){ const h=ob.C.head; h.userData.aim=1.2; const tx=e.p.tx-e.b.cx, ty=e.p.ty-e.b.cy; h.rotation.y=Math.atan2(tx,ty)+(this.home?((ob.o?.r)||0):0); }
      if(e.p.kind==='spray'){ const x=wx(e.b.cx), z=wz(e.b.cy); for(let k=0;k<8;k++){ const a=Math.random()*6.28; P.emit(x,GY+2.4,z,Math.cos(a)*5,1,Math.sin(a)*5,'#b3e5fc',12,.5,-8); } } }
    else if(e.e==='phit'){ const p=e.p; const x=wx(p.x), z=wz(p.y); const n=p.splash?22:8; for(let k=0;k<n;k++) P.emit(x,GY+.4,z,(Math.random()-.5)*(p.splash?7:3),2+Math.random()*3,(Math.random()-.5)*(p.splash?7:3),p.kind==='foam'?'#ffffff':'#81d4fa',p.kind==='foam'?26:14,.7,-8); }
    else if(e.e==='uhit'){ const U=this.units.get(e.u.id); if(U) U.flash=.15; }
    else if(e.e==='down'){ const U=this.units.get(e.u.id); if(U){ const x=wx(e.u.x), z=wz(e.u.y); for(let k=0;k<14;k++) P.emit(x,GY+.6,z,(Math.random()-.5)*2,1.5+Math.random()*2,(Math.random()-.5)*2,e.u.enemy?'#bdbdbd':'#ffffff',28,1,-1,24); U.dying=0; } }
    else if(e.e==='trap'){ const x=wx(e.b.cx), z=wz(e.b.cy); for(let k=0;k<40;k++) P.emit(x,GY+.3,z,(Math.random()-.5)*8,3+Math.random()*4,(Math.random()-.5)*8,k%2?'#ffd400':'#ff5252',24,.9,-9); this.float(x,GY+1.5,z,'⚠️ TRAP!','big'); this.opt.sfx&&this.opt.sfx('boom'); }
    else if(e.e==='ability'){ const u=e.u, x=wx(u.x), z=wz(u.y); const col={roo:'#ffca28',koala:'#76ff03',wombat:'#8d6e63',platypus:'#40c4ff'}[e.kind]||'#ff5252'; for(let k=0;k<50;k++){ const a=k/50*6.28; P.emit(x,GY+.4,z,Math.cos(a)*7,1.5,Math.sin(a)*7,col,22,.8,-2); } this.float(x,GY+2.6,z,W.HEROES[e.kind]?.ability||'Rally Cry','big'); this.opt.sfx&&this.opt.sfx('ability'); }
    else if(e.e==='disarm'){ this.float(wx(e.b.cx),GY+1,wz(e.b.cy),'⚡ disarmed',''); }
    else if(e.e==='over'){ this.opt.onOver&&this.opt.onOver(B); } }
  update(dt,t){ this.t+=dt; const B=this.B;
    if(this.running&&!B.over){ this.acc+=Math.min(.25,dt)*this.speed; while(this.acc>=.05){ this.acc-=.05; War.step(B,.05); for(const e of B.ev) this.onEv(e); B.ev.length=0; if(B.over) break; } }
    else { for(const e of B.ev) this.onEv(e); B.ev.length=0; }
    if(B.stars!==this.lastStars){ const was=this.lastStars; this.lastStars=B.stars; this.opt.onStar&&this.opt.onStar(B.stars,was); }
    const k=this.running?Math.min(1,this.acc/.05):1; let bl=0, lg=0;
    for(const [id,U] of this.units){ const u=U.u, m=U.m; const x=wx(u.px+(u.x-u.px)*k), z=wz(u.py+(u.y-u.py)*k); U.born+=dt;
      if(U.dying!==undefined){ U.dying+=dt; m.scale.setScalar(Math.max(.01,U.sc*(1-U.dying*2))); m.position.y+=dt*1.5; if(U.dying>.5){ this.root.remove(m); this.units.delete(id); } continue; }
      const pop=Math.min(1,U.born*5), sc=U.sc*(pop<1?pop*1.2:1); const moving=Math.hypot(u.x-u.px,u.y-u.py)>.0005; if(moving) U.walk+=dt*11;
      const fly=u.air?2.6+Math.sin(this.t*2+id)*.15:0; const hop=moving&&U.legs?Math.abs(Math.sin(U.walk))*.07:0; const lunge=u.atkT>0?Math.sin(this.t*18)*.08:0;
      m.position.set(x+Math.sin(u.face)*lunge,GY+.26*(U.legs?1:0)+fly+hop,z+Math.cos(u.face)*lunge); const tr=u.face; m.rotation.y+=(((tr-m.rotation.y+Math.PI*3)%(Math.PI*2))-Math.PI)*Math.min(1,dt*12); m.rotation.z=moving&&U.legs?Math.sin(U.walk)*.06:0;
      m.scale.set(sc*(1+lunge*.6),sc*(1-lunge*.5),sc); if(U.flash>0){ U.flash-=dt; m.scale.multiplyScalar(1.08); }
      if(bl<120){ MX.compose(V.set(x,GY+.03,z),Q.identity(),V.clone().set(sc*(u.air?.8:1)*(u.big?1.5:1),1,sc*(u.air?.8:1)*(u.big?1.5:1))); this.blobs.setMatrixAt(bl++,MX); }
      if(U.legs&&lg<238){ for(const s of [-1,1]){ const sw=moving?Math.sin(U.walk)*s*.6:0; Q.setFromAxisAngle(V.set(1,0,0),sw); const rq=new THREE.Quaternion().setFromAxisAngle(UP,m.rotation.y).multiply(Q); const off=new THREE.Vector3(s*.11*sc,0,0).applyAxisAngle(UP,m.rotation.y);
          MX.compose(new THREE.Vector3(x+off.x,m.position.y+.02,z+off.z),rq,new THREE.Vector3(sc,sc,sc)); this.legs.setMatrixAt(lg,MX); this.legs.setColorAt(lg,U.col); lg++; } }
      if(u.air&&u.type==='heli'&&U.m) U.m.children[0].rotation.y=0; }
    this.blobs.count=bl; this.blobs.instanceMatrix.needsUpdate=true; this.legs.count=lg; this.legs.instanceMatrix.needsUpdate=true; if(this.legs.instanceColor) this.legs.instanceColor.needsUpdate=true;
    // projectiles
    let pc=0; for(const p of B.projs){ if(pc>=120) break; const prog=p.dist?1-Math.hypot(p.tx-p.x,p.ty-p.y)/Math.max(.01,p.dist):1; const arc=p.kind==='foam'?Math.sin(Math.max(0,Math.min(1,prog))*Math.PI)*4:p.air?Math.sin(prog*Math.PI)*.8+1.6*prog:1.2*(1-prog)+.6;
      MX.compose(V.set(wx(p.x),GY+.6+arc+(p.from&&!p.air?(1-prog)*1:0),wz(p.y)),Q.identity(),new THREE.Vector3().setScalar(p.kind==='foam'?1.6:p.kind==='spray'?.6:1)); this.projM.setMatrixAt(pc,MX); this.projM.setColorAt(pc,new THREE.Color(p.kind==='foam'?'#ffffff':p.kind==='bomb'?'#29b6f6':'#81d4fa')); pc++;
      if(Math.random()<.5) this.parts.emit(wx(p.x),GY+.6+arc,wz(p.y),0,0,0,'#b3e5fc',10,.3,0); }
    this.projM.count=pc; this.projM.instanceMatrix.needsUpdate=true; if(this.projM.instanceColor) this.projM.instanceColor.needsUpdate=true;
    // buildings: dying shrink, heads relax, flames on damaged ones, idle animations
    for(const ob of this.objs.values()){ const o=ob.o; if(ob.C&&ob.grp&&ob.grp.visible) for(const f of ob.C.anim) f(this.t,dt);
      if(ob.C&&ob.C.head&&ob.C.head.userData.aim>0) ob.C.head.userData.aim-=dt;
      if(ob.dying!==undefined&&ob.grp&&ob.grp.visible){ ob.dying+=dt; const s=Math.max(.01,1-ob.dying*3); ob.grp.scale.set(1+ob.dying*.6,s,1+ob.dying*.6); if(ob.dying>.33){ ob.grp.visible=false; ob.grp.scale.set(1,1,1); } }
      if(o.alive&&o.hp<o.max*.6&&Math.random()<dt*(o.hp<o.max*.3?10:4)){ const c=o.cells[Math.floor(Math.random()*o.cells.length)]; const col=this.B.mode==='attack'?'#666666':'#ff7a1a'; this.parts.emit(wx(c[0]+.5),GY+(ob.top||1.5)*.8,wz(c[1]+.5),(Math.random()-.5)*.4,1.4,(Math.random()-.5)*.4,this.B.mode==='attack'?(Math.random()<.5?'#9e9e9e':'#757575'):(Math.random()<.5?'#ff9800':'#ffca28'),30,1.2,.6,18); } }
    this.parts.mesh.material.uniforms.scale.value=this.base.zoom*this.base.renderer.getPixelRatio()*1.2; this.parts.update(dt);
    if(this.redT>0){ this.redT-=dt; this.redZone.material.opacity=Math.min(.35,this.redT*.4); } else this.redZone.material.opacity=0;
    this.overlay(dt); }
  overlay(dt){ if(!this.fx) return;
    for(const [k,a] of this.dmgAcc){ const o=this.B.b[k]; if(!o) continue; o._numT=(o._numT||0)-dt; if(o._numT<=0&&a>0){ o._numT=.45; this.dmgAcc.set(k,0); const ob=this.objs.get(k); this.float(wx(o.cx),GY+(ob?.top||1.5)+.4,wz(o.cy),'-'+a,'dmg'); if(o.share.coins>0||o.share.mats>0){ const f=a/o.max; const c=Math.round(o.share.coins*f), m=Math.round(o.share.mats*f); if(c>0||m>0) this.float(wx(o.cx)+.6,GY+(ob?.top||1.5)+.9,wz(o.cy),(c>0?`🪙+${c} `:'')+(m>0?`💧+${m}`:''),'loot'); } } }
    for(let i=this.floaters.length-1;i>=0;i--){ const f=this.floaters[i]; f.t+=dt; const s=this.scr(f.x,f.y+f.t*1.2,f.z); f.el.style.transform=`translate(${s.x}px,${s.y}px) translate(-50%,-50%) scale(${Math.min(1,f.t*6)})`; f.el.style.opacity=String(Math.max(0,1-Math.max(0,f.t-.6)*2)); if(f.t>1.2){ f.el.remove(); this.floaters.splice(i,1); } }
    // hp bars for damaged buildings and heroes
    const want=new Set(); for(const o of this.B.b){ if(!o.alive||!o._hitT||o.trap) continue; o._hitT-=dt; if(o._hitT<=0) continue; want.add('b'+o.k); const ob=this.objs.get(o.k); this.bar('b'+o.k,wx(o.cx),GY+(ob?.top||1.5)+.2,wz(o.cy),o.hp/o.max,o.wall?'w':''); }
    for(const U of this.units.values()){ const u=U.u; if(u.dead||(u.type!=='hero'&&u.hp>=u.max)) continue; want.add('u'+u.id); this.bar('u'+u.id,U.m.position.x,U.m.position.y+1.5*U.sc,U.m.position.z,u.hp/u.max,u.type==='hero'?'h':u.enemy?'e':'u'); }
    for(const [k,el] of this.hpEls) if(!want.has(k)){ el.remove(); this.hpEls.delete(k); } }
  bar(k,x,y,z,f,cls){ let el=this.hpEls.get(k); if(!el){ el=document.createElement('div'); el.className='hpb '+cls; el.innerHTML='<i></i>'; this.fx.appendChild(el); this.hpEls.set(k,el); } const s=this.scr(x,y,z); el.style.transform=`translate(${s.x}px,${s.y}px) translate(-50%,-50%)`; el.firstChild.style.width=(Math.max(0,f)*100)+'%'; }
}
const GEO_SET=new Set();
