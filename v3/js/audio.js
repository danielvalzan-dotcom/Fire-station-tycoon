// Firey Station Tycoon v2: audio. Every sound and both music tracks are synthesised live with the Web Audio API.
// No audio files or third-party sounds are used, so there is nothing to license.
// iOS only allows audio after a user gesture, so unlock() is called on the first tap.
const midi = n => 440*Math.pow(2,(n-69)/12);
let cfg = { sfx:true, music:true };
export function setAudioPrefs(p){ cfg=p; Snd.applyVolumes(); }

export const Snd = { ctx:null, sfxBus:null, musicBus:null, noiseBuf:null, sprayG:null, unlocked:false, last:{},
  init(){ if(this.ctx) return this.ctx; const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null;
    try{ this.ctx=new AC(); }catch(e){ return null; }
    const a=this.ctx, comp=a.createDynamicsCompressor(); comp.threshold.value=-16; comp.ratio.value=4; comp.connect(a.destination);
    this.sfxBus=a.createGain(); this.musicBus=a.createGain(); this.sfxBus.connect(comp); this.musicBus.connect(comp);
    const len=a.sampleRate*2, buf=a.createBuffer(1,len,a.sampleRate), d=buf.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1; this.noiseBuf=buf;
    const src=a.createBufferSource(); src.buffer=buf; src.loop=true; const bp=a.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=2400; bp.Q.value=.6;
    const lfo=a.createOscillator(), lg=a.createGain(); lfo.frequency.value=7; lg.gain.value=700; lfo.connect(lg).connect(bp.frequency); lfo.start();
    this.sprayG=a.createGain(); this.sprayG.gain.value=0; src.connect(bp).connect(this.sprayG).connect(this.sfxBus); src.start();
    this.applyVolumes(); return a; },
  unlock(){ const a=this.init(); if(!a) return; if(a.state!=='running'&&!document.hidden) a.resume();
    if(!this.unlocked){ const sb=a.createBufferSource(); sb.buffer=a.createBuffer(1,1,22050); sb.connect(a.destination); sb.start(0); this.unlocked=true; }
    Music.start(); },
  applyVolumes(){ if(!this.ctx) return; const t=this.ctx.currentTime;
    this.sfxBus.gain.setTargetAtTime(cfg.sfx?1.8:0,t,.04); this.musicBus.gain.setTargetAtTime(cfg.music?0.35:0,t,.15); },
  live(){ return this.ctx&&this.ctx.state==='running'; },
  limit(k,ms){ const n=performance.now(); if(n-(this.last[k]||0)<ms) return true; this.last[k]=n; return false; },
  tone(f,d,o={}){ if(!this.live()) return; const a=this.ctx, t0=a.currentTime+(o.delay||0), osc=a.createOscillator(), g=a.createGain();
    osc.type=o.type||'sine'; osc.frequency.setValueAtTime(f,t0); if(o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2,t0+(o.glide||d));
    const v=o.v??.08, at=o.attack??.005; g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(v,t0+at); g.gain.exponentialRampToValueAtTime(0.0001,t0+d);
    let node=osc; if(o.lp){ const f=a.createBiquadFilter(); f.type='lowpass'; f.frequency.value=o.lp; osc.connect(f); node=f; }
    node.connect(g).connect(o.bus||this.sfxBus); osc.start(t0); osc.stop(t0+d+.05); },
  noise(d,o={}){ if(!this.live()) return; const a=this.ctx, t0=a.currentTime+(o.delay||0), src=a.createBufferSource(), f=a.createBiquadFilter(), g=a.createGain();
    src.buffer=this.noiseBuf; f.type=o.ft||'bandpass'; f.frequency.setValueAtTime(o.freq||3000,t0); if(o.f2) f.frequency.exponentialRampToValueAtTime(o.f2,t0+d); f.Q.value=o.q??1;
    const v=o.v??.05; g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(v,t0+(o.attack??.005)); g.gain.exponentialRampToValueAtTime(0.0001,t0+d);
    src.connect(f).connect(g).connect(o.bus||this.sfxBus); src.start(t0,Math.random()); src.stop(t0+d+.05); },
  bell(f,delay=0,v=.05){ this.tone(f,1.1,{v,delay}); this.tone(f*2.76,.5,{v:v*.35,delay}); this.tone(f*5.4,.25,{v:v*.15,delay}); },
  // ---- kept from v0.2 ----
  tap(){ this.tone(1100,.04,{v:.035,f2:700,type:'triangle'}); },
  siren(){ if(this.limit('siren',450)) return;
    for(let i=0;i<2;i++){ const d=i*.42; this.tone(620,.4,{type:'sawtooth',v:.04,f2:1250,glide:.2,delay:d,lp:2200,attack:.03}); this.tone(625,.4,{type:'triangle',v:.04,f2:1260,glide:.2,delay:d,attack:.03}); }
    this.tone(1250,.3,{type:'triangle',v:.03,f2:650,delay:.84,attack:.02}); },
  coin(){ this.tone(1318,.07,{type:'square',v:.03,lp:5000}); this.tone(1760,.22,{type:'square',v:.03,delay:.065,lp:5000}); this.tone(2637,.25,{v:.015,delay:.12}); },
  buy(){ [523,659,784,1047].forEach((f,i)=>this.tone(f,.16,{type:'triangle',v:.06,delay:i*.055})); this.noise(.35,{ft:'highpass',freq:6000,v:.015,delay:.18}); this.tone(2093,.3,{v:.02,delay:.22}); },
  level(){ [67,72,76,79].forEach((m,i)=>{ this.tone(midi(m),.18,{type:'square',v:.035,delay:i*.11,lp:3000}); this.tone(midi(m),.18,{type:'triangle',v:.04,delay:i*.11}); });
    [72,76,79,84].forEach(m=>this.tone(midi(m),.8,{type:'triangle',v:.035,delay:.46,attack:.02})); this.noise(.6,{ft:'highpass',freq:7000,v:.02,delay:.46}); },
  no(){ this.tone(180,.18,{type:'sawtooth',v:.035,f2:130,lp:900}); },
  adDone(){ this.tone(midi(79),.12,{v:.05}); this.tone(midi(84),.4,{v:.05,delay:.1}); this.tone(midi(88),.5,{v:.03,delay:.2}); },
  rushStart(){ for(let i=0;i<3;i++) this.bell(midi(88),i*.22,.06); this.tone(300,.7,{type:'sawtooth',v:.035,f2:900,delay:.7,lp:1800,attack:.1}); this.last.siren=0; this.siren(); },
  win(){ const seq=[[72,0],[72,.12],[72,.24],[76,.36],[79,.6],[76,.78],[79,.9]]; seq.forEach(([m,t])=>{ this.tone(midi(m),.16,{type:'square',v:.035,delay:t,lp:3000}); this.tone(midi(m+12),.16,{type:'triangle',v:.025,delay:t}); });
    [72,76,79,84].forEach(m=>this.tone(midi(m),1.2,{type:'triangle',v:.035,delay:1.05,attack:.02})); this.noise(1.2,{ft:'highpass',freq:5000,v:.03,delay:1.05}); },
  lose(){ [67,66,65,64].forEach((m,i)=>this.tone(midi(m-12),i===3?.7:.28,{type:'sawtooth',v:.04,delay:i*.3,lp:900,f2:i===3?midi(m-13):null,glide:.7})); },
  setSpray(n){ if(!this.ctx||n===this.sprayN) return; this.sprayN=n; this.sprayG.gain.setTargetAtTime(n>0?Math.min(.06,.03+.01*n):0,this.ctx.currentTime,.12); },
  // ---- new in v2 ----
  pop(){ this.tone(520,.09,{v:.05,f2:900,type:'triangle'}); this.tone(1300,.06,{v:.02,delay:.03}); },          // select building
  swish(){ this.noise(.22,{freq:900,f2:3500,q:1.4,v:.05}); },                                                       // open a panel
  pager(){ if(this.limit('pager',1500)) return; for(let i=0;i<3;i++){ this.tone(2093,.09,{type:'square',v:.025,delay:i*.16,lp:4000}); this.tone(1568,.09,{type:'square',v:.025,delay:i*.16+.08,lp:4000}); } },
  hammer(){ for(let i=0;i<3;i++){ this.tone(220,.08,{type:'square',v:.05,delay:i*.18,f2:90,lp:1200}); this.noise(.06,{freq:2500,v:.05,delay:i*.18}); } },
  buildDone(){ this.bell(midi(84),0,.05); this.bell(midi(91),.15,.04); this.level(); },
  recruit(){ [60,64,67,72,76].forEach((m,i)=>this.tone(midi(m),.2,{type:'triangle',v:.05,delay:i*.07})); this.cheer(.6,.4); },
  equip(){ this.noise(.12,{freq:4200,q:6,v:.06}); this.tone(1480,.25,{v:.03,type:'triangle'}); this.tone(2217,.35,{v:.02,delay:.05}); this.tone(330,.1,{type:'square',v:.03,lp:900}); },
  skill(){ this.tone(midi(76),.1,{type:'triangle',v:.05}); this.tone(midi(83),.25,{type:'triangle',v:.05,delay:.07}); this.tone(midi(88),.3,{v:.02,delay:.12}); },
  crate(){ for(let i=0;i<14;i++) this.noise(.05,{freq:180+i*20,q:2,v:.04+i*.003,delay:i*.06}); this.tone(midi(84),.6,{type:'triangle',v:.05,delay:.9}); this.tone(midi(88),.6,{type:'triangle',v:.04,delay:.9}); this.tone(midi(91),.9,{v:.04,delay:.95}); this.noise(.8,{ft:'highpass',freq:6000,v:.03,delay:.9}); },
  speedUp(){ this.noise(.35,{freq:400,f2:6000,q:1.2,v:.06}); this.tone(400,.35,{type:'triangle',v:.04,f2:1600}); },
  collect(){ for(let i=0;i<5;i++) this.tone(1318+i*90,.12,{type:'square',v:.022,delay:i*.05,lp:5000}); this.tone(2637,.3,{v:.015,delay:.25}); },
  callWin(){ this.tone(midi(72),.12,{type:'triangle',v:.05}); this.tone(midi(76),.12,{type:'triangle',v:.05,delay:.1}); this.tone(midi(79),.35,{type:'triangle',v:.05,delay:.2}); this.coin(); },
  callFail(){ this.tone(midi(64),.2,{type:'triangle',v:.05}); this.tone(midi(60),.45,{type:'triangle',v:.05,delay:.18}); },
  beep(hi){ this.tone(hi?1320:880,hi?.5:.16,{type:'square',v:.04,lp:3000}); if(hi) this.tone(660,.5,{type:'sawtooth',v:.03,lp:1500}); },  // 3-2-1-GO
  hit(q){ if(q===2){ this.tone(1568,.12,{type:'triangle',v:.06}); this.tone(2093,.18,{v:.03,delay:.04}); } else if(q===1) this.tone(1175,.09,{type:'triangle',v:.05}); else this.tone(160,.15,{type:'sawtooth',v:.04,f2:110,lp:700}); },
  step(){ this.noise(.04,{freq:1200,q:2,v:.03}); this.tone(240+Math.random()*60,.05,{type:'triangle',v:.03}); },
  splash(){ this.noise(.35,{freq:1800,f2:500,q:.8,v:.07}); },
  cheer(dur=1.6,v=.6){ for(let i=0;i<4;i++) this.noise(dur,{freq:900+i*400,q:.9,v:.03*v,attack:.25,delay:i*.03}); for(let i=0;i<5;i++) this.tone(600+Math.random()*500,.25,{type:'triangle',v:.012*v,delay:Math.random()*dur*.7,f2:900+Math.random()*400}); },
  trophyUp(){ this.tone(midi(79),.12,{type:'square',v:.03,lp:3000}); this.tone(midi(84),.12,{type:'square',v:.03,delay:.1,lp:3000}); this.tone(midi(91),.5,{type:'triangle',v:.05,delay:.2}); },
  // ---- v3 action scenes ----
  hydraulic(p){ if(this.limit('hyd',90)) return; this.tone(70+p*160,.12,{type:'sawtooth',v:.035,lp:500+p*900}); },
  pop2(){ this.noise(.18,{freq:600,q:.7,v:.09}); this.tone(140,.25,{type:'square',v:.05,f2:60,lp:700}); },
  cut(){ this.noise(.25,{freq:3200,f2:1400,q:3,v:.07}); this.tone(900,.2,{type:'sawtooth',v:.02,f2:400,lp:2500}); },
  thud(){ this.tone(110,.18,{type:'triangle',v:.09,f2:55}); this.noise(.12,{freq:400,q:.8,v:.06}); },
  crackle(){ if(this.limit('crk',140)) return; this.noise(.05+Math.random()*.05,{freq:1800+Math.random()*2500,q:4,v:.02+Math.random()*.02}); },
  gasBeep(){ this.tone(2400,.05,{type:'square',v:.025,lp:5000}); },
  sizzle(){ if(this.limit('szl',120)) return; this.noise(.18,{freq:5000,q:.8,v:.035}); },
  rake(){ if(this.limit('rake',110)) return; this.noise(.08,{freq:900,q:1.5,v:.04}); },
  creak(){ this.tone(180,.35,{type:'sawtooth',v:.03,f2:120,lp:600,attack:.05}); },
  alarm(){ if(this.limit('alarm',2500)) return; for(let i=0;i<3;i++){ this.tone(660,.5,{type:'sawtooth',v:.035,f2:990,delay:i*.6,lp:2200,glide:.5}); } },
  thunder(){ this.noise(2.2,{freq:180,f2:60,q:.5,v:.16,attack:.05}); this.noise(.4,{freq:900,q:.6,v:.08}); },
  saw(on){ if(!this.ctx) return; if(!this.sawO){ const a=this.ctx, o=a.createOscillator(), g=a.createGain(), f=a.createBiquadFilter(); o.type='sawtooth'; o.frequency.value=95; f.type='lowpass'; f.frequency.value=1400; g.gain.value=0; o.connect(f).connect(g).connect(this.sfxBus); o.start(); this.sawO=o; this.sawG=g; }
    this.sawG.gain.setTargetAtTime(on?.05:0,this.ctx.currentTime,.03); this.sawO.frequency.setTargetAtTime(on?(on>1?70:120):95,this.ctx.currentTime,.05); },
  // looping weather bed: 'rain' | 'wind' | 'ash' | 'hail' | 'fog' | 'shake' | null
  weather(type){ if(!this.ctx) return; const a=this.ctx;
    if(!this.wxG){ const src=a.createBufferSource(); src.buffer=this.noiseBuf; src.loop=true; const f=a.createBiquadFilter(); f.type='bandpass'; f.Q.value=.6; const g=a.createGain(); g.gain.value=0; src.connect(f).connect(g).connect(this.sfxBus); src.start(); this.wxF=f; this.wxG=g; }
    const cfg={rain:[2800,.07],hail:[3600,.08],wind:[500,.09],ash:[700,.05],fog:[300,.035],shake:[120,.09]}[type]||[800,0];
    this.wxF.frequency.setTargetAtTime(cfg[0],a.currentTime,.4); this.wxG.gain.setTargetAtTime(cfg[1],a.currentTime,.8); this.wxType=type; },
  trophyDown(){ this.tone(midi(67),.15,{type:'triangle',v:.04}); this.tone(midi(62),.35,{type:'triangle',v:.04,delay:.14}); },
};

// Two looping tracks, both generated: 'base' is a sunny ukulele-style pluck, 'comp' is a driving sports-day groove.
const TRACKS = {
  base:{ bpm:96, prog:[[60,64,67,72],[55,59,62,67],[57,60,64,69],[53,57,60,65],[60,64,67,72],[55,59,62,67],[53,57,60,65],[55,59,62,65]] },
  comp:{ bpm:132, prog:[[57,60,64,69],[53,57,60,65],[55,59,62,67],[52,56,59,64],[57,60,64,69],[53,57,60,65],[50,53,57,62],[52,56,59,64]] },
};
export const Music = { timer:null, next:0, step:0, track:'base', boost:0,
  setTrack(t){ if(this.track!==t){ this.track=t; this.step=0; } },
  start(){ if(this.timer||!Snd.ctx) return; this.next=Snd.ctx.currentTime+.15; this.timer=setInterval(()=>this.tick(),50); },
  tick(){ const a=Snd.ctx; if(!a||a.state!=='running') return;
    if(!cfg.music||a.currentTime>this.next+1){ this.next=Math.max(this.next,a.currentTime+.1); if(!cfg.music) return; }
    const T=TRACKS[this.track], e=60/(T.bpm+this.boost)/2; while(this.next<a.currentTime+.3){ this.play(T,this.step,this.next-a.currentTime); this.next+=e; this.step++; } },
  play(T,step,d){ const bus=Snd.musicBus, bar=Math.floor(step/8)%8, s=step%8, ch=T.prog[bar], comp=this.track==='comp';
    const sw = !comp&&s%2 ? .035 : 0;
    if(comp){ Snd.tone(midi(ch[0]-24),.18,{type:'sawtooth',v:.07,bus,delay:d,lp:600});
      if(s%2===0) Snd.tone(150,.12,{v:.08,f2:45,bus,delay:d}); if(s===2||s===6) Snd.noise(.12,{freq:1800,q:.7,v:.05,bus,delay:d});
      Snd.noise(.04,{ft:'highpass',freq:8000,v:.018,bus,delay:d});
      const pat=[3,2,1,2,3,2,0,1]; if(s!==7) Snd.tone(midi(ch[pat[s]]+12),.14,{type:'square',v:.016,bus,delay:d,lp:2400});
      if(bar%2===1&&s===0) Snd.tone(midi(ch[3]+12),.6,{type:'triangle',v:.02,bus,delay:d});
      return; }
    if(s===0||s===3||s===4||s===6) Snd.tone(midi(ch[0]-24),s===0?.45:.25,{type:'triangle',v:.11,bus,delay:d});
    const pat=[0,2,1,3,2,1,3,2]; Snd.tone(midi(ch[pat[s]]+(s===3?12:0)),.22,{type:'triangle',v:.032,bus,delay:d+sw,lp:2600});
    if(s%2) Snd.noise(.05,{ft:'highpass',freq:7500,v:.014,bus,delay:d+sw});
    if(s===0||s===4) Snd.tone(130,.14,{v:.06,f2:48,bus,delay:d});
    if(bar%2===1&&(s===2||s===5)) Snd.tone(midi(ch[3]+12),.35,{v:.016,bus,delay:d+sw});
  },
};
['pointerdown','touchend','click','keydown'].forEach(ev=>document.addEventListener(ev,()=>Snd.unlock(),{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{ if(Snd.ctx){ document.hidden?Snd.ctx.suspend():Snd.ctx.resume(); } });
