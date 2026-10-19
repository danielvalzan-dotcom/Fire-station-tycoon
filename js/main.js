// Firey Station Tycoon v2: UI controller. Fictional game. Not affiliated with any fire service.
import * as D from './data.js';
import * as G from './state.js';
import { S } from './state.js';
import { Snd, Music, setAudioPrefs } from './audio.js';
import { BaseScene } from './scene.js';
import { avatarSVG } from './avatar.js';
import { runMinigame } from './minigame.js';
import { Backend } from './backend.js';
const $=s=>document.querySelector(s), fmt=D.fmt, fmtTime=D.fmtTime;
export const ICON = {
  coin:`<svg class="i-coin" viewBox="0 0 32 32"><use href="#ic-coin"/></svg>`,
  badge:`<svg class="i-badge" viewBox="0 0 32 32"><use href="#ic-badge"/></svg>`,
  trophy:`<svg class="i-trophy" viewBox="0 0 32 32"><path d="M9 4h14v7a7 7 0 0 1-14 0z" fill="#ffca28" stroke="#8a5300" stroke-width="2"/><path d="M9 6H4c0 5 3 7 5 7M23 6h5c0 5-3 7-5 7" fill="none" stroke="#8a5300" stroke-width="2"/><rect x="13" y="18" width="6" height="5" fill="#ffb300" stroke="#8a5300" stroke-width="2"/><rect x="9" y="23" width="14" height="5" rx="2" fill="#8d6e63" stroke="#4e342e" stroke-width="2"/><path d="M12 6v5" stroke="#fff" stroke-width="2" opacity=".6"/></svg>`,
};
const C = n => `${ICON.coin}<b>${fmt(n)}</b>`, B = n => `${ICON.badge}<b>${fmt(n)}</b>`;
const roleChip = (r,n,ok) => `<span class="chip ${ok===undefined?'':ok?'ok':'bad'}" style="--rc:${D.ROLES[r].color}">${D.ROLES[r].icon} ${n>1?n+'× ':''}${D.ROLES[r].short}</span>`;

/* ---------- boot ---------- */
const boot=G.load(); setAudioPrefs(S.prefs);
let scene; const world=$('#world');
await document.fonts.load('40px "Lilita One"').catch(()=>{});
scene=new BaseScene(world,{ onSelect:id=>openBuilding(id), onTapEmpty:()=>closeSheet() });
window.FST={ S:()=>S, G, D, scene, Snd, Music, openPanel:(v,a)=>openPanel(v,a), openBuilding:id=>openBuilding(id) };

/* ---------- labels over buildings ---------- */
const labelsEl=$('#labels'); const labels={};
for(const id of D.BUILD_ORDER){ const el=document.createElement('div'); el.className='blabel'; el.dataset.bid=id; labelsEl.appendChild(el); labels[id]=el;
  el.addEventListener('click',e=>{ const t=e.target.closest('[data-collect]'); if(t){ e.stopPropagation(); collectSizzle(); return; } const p=e.target.closest('[data-pager]'); if(p){ e.stopPropagation(); openPanel('calls'); return; } openBuilding(id); }); }
function renderLabel(id){ const i=G.bInfo(id), el=labels[id]; let h='';
  if(i.up) h+=`<div class="lbar"><i data-pstart="${i.up.start}" data-pend="${i.up.end}"></i><span data-end="${i.up.end}"></span></div>`;
  h+=`<div class="lname">${i.l?`<span class="lv">${i.l}</span>`:''}${D.BUILDINGS[id].name}</div>`;
  if(i.locked) h=`<div class="lname dim">🔒 ${D.BUILDINGS[id].name} · Lv ${i.unlockAt}</div>`;
  else if(i.l===0&&!i.up) h=`<div class="lname build">🔨 Build ${D.BUILDINGS[id].name}</div>`;
  if(id==='quarters'&&S.sizzle.stored>=1) h=`<div class="bubble" data-collect>${ICON.coin}<b>${fmt(S.sizzle.stored)}</b></div>`+h;
  if(id==='comms'){ const n=S.calls.filter(c=>c.state==='open').length; if(n) h=`<div class="bubble pager" data-pager>🚨<b>${n}</b></div>`+h; }
  if(el._h!==h){ el.innerHTML=h; el._h=h; } }
function placeLabels(){ for(const id of D.BUILD_ORDER){ const p=scene.screenPos(id); labels[id].style.transform=`translate(${p.x}px,${p.y}px) translate(-50%,-100%)`; } }

/* ---------- HUD ---------- */
function hud(){
  $('#coins').textContent=fmt(S.coins); $('#badges').textContent=fmt(S.badges);
  $('#slvl').textContent=S.level; $('#sxp').style.width=Math.min(100,S.xp/G.stationXpNeed(S.level)*100)+'%';
  $('#trophies').innerHTML=`${ICON.trophy}<b>${S.trophies}</b><small>${D.LEAGUES[G.league()].name}</small>`;
  $('#builders').innerHTML=`👷 <b>${S.builders-G.buildersBusy()}/${S.builders}</b>`;
  const open=S.calls.filter(c=>c.state==='open').length; const cb=$('#btnCalls .count'); cb.textContent=open; cb.style.display=open?'':'none';
  const out=S.calls.filter(c=>c.state==='out').length; $('#trucks').innerHTML=`🚒 <b>${G.freeAppliances()}/${D.appliances(G.bl('engine'))}</b>`;
  const q=G.currentQuest(); const qe=$('#quest');
  if(q){ const done=q.done(); const h=`<span class="qi">🎯</span><span class="qt">${q.text}</span>${done?`<button class="gbtn green sm" data-act="claim">Claim ${ICON.badge}${q.reward}</button>`:`<span class="qr">${ICON.badge}${q.reward}</span>`}`;
    if(qe._h!==h){ qe.innerHTML=h; qe._h=h; } qe.classList.toggle('ready',done); qe.style.display=''; } else qe.style.display='none';
  const r=S.rush, re=$('#rush'); if(r.active){ re.style.display=''; re.innerHTML=`🚨 RUSH HOUR <b>${r.done}/3</b> · <span data-end="${r.until}"></span> · 2x pay`; } else re.style.display='none';
  for(const id of D.BUILD_ORDER) renderLabel(id);
}
function liveTimers(root=document){ const t=Date.now();
  root.querySelectorAll('[data-end]').forEach(el=>{ el.textContent=fmtTime((+el.dataset.end-t)/1000); });
  root.querySelectorAll('[data-pend]').forEach(el=>{ const a=+el.dataset.pstart, b=+el.dataset.pend; el.style.width=Math.max(0,Math.min(100,(t-a)/(b-a)*100))+'%'; });
  root.querySelectorAll('[data-scost]').forEach(el=>{ const end=+el.dataset.scost; el.innerHTML=B(D.badgeSpeedCost((end-t)/1000)); }); }

/* ---------- toasts / modal ---------- */
function toast(msg,cls=''){ const box=$('#toasts'); while(box.children.length>=3) box.firstChild.remove();
  const d=document.createElement('div'); d.className='toast '+cls; d.innerHTML=msg; box.appendChild(d); setTimeout(()=>{ d.classList.add('out'); setTimeout(()=>d.remove(),350); },2600); }
function err(m){ if(m){ toast(m,'bad'); Snd.no(); return true; } return false; }
let modalCb=[];
function modal(html, buttons=[], cls=''){ const m=$('#modal'); modalCb=buttons;
  m.innerHTML=`<div class="mcard ${cls}">${html}<div class="mbtns">${buttons.map((b,i)=>`<button class="gbtn ${b.cls||'green'}" data-mi="${i}">${b.label}</button>`).join('')}</div></div>`; m.classList.add('on'); modalAt=performance.now(); Snd.swish(); }
let modalAt=0;
function closeModal(){ $('#modal').classList.remove('on'); $('#modal').innerHTML=''; }
$('#modal').addEventListener('click',e=>{ const b=e.target.closest('[data-mi]'); if(!b) return; if(performance.now()-modalAt<500) return; /* swallow stray taps from frantic mini-game mashing */ const cb=modalCb[+b.dataset.mi]; if(!cb.keep) closeModal(); cb.fn&&cb.fn(); });
function fakeAd(done){ let n=3; modal(`<h2>Sponsored</h2><div class="adbox"><span class="demo">DEMO AD</span><div class="cd" id="adcd">3</div><p>Placeholder only. No real ad plays and nothing is tracked.</p></div>`,[],'ad');
  const iv=setInterval(()=>{ n--; const el=$('#adcd'); if(el) el.textContent=n; if(n<=0){ clearInterval(iv); closeModal(); Snd.adDone(); done(); } },1000); }

/* ---------- building sheet ---------- */
let sheetId=null;
function openBuilding(id){ sheetId=id; scene.select(id); Snd.pop(); renderSheet(); $('#sheet').classList.add('on'); }
function closeSheet(){ sheetId=null; scene.select(null); $('#sheet').classList.remove('on'); }
function renderSheet(){ if(!sheetId) return; const id=sheetId, i=G.bInfo(id), def=D.BUILDINGS[id]; const el=$('#sheet .sbody');
  let act='';
  if(i.up) act=`<div class="pbar big"><i data-pstart="${i.up.start}" data-pend="${i.up.end}"></i><span>Upgrading to Lv ${i.l+1} · <b data-end="${i.up.end}"></b></span></div>
     <div class="row2"><button class="gbtn purple" data-act="speed" data-id="${id}">Finish now <span data-scost="${i.up.end}"></span></button><button class="gbtn orange" data-act="adspeed" data-id="${id}">📺 −5 min <small>DEMO</small></button></div>`;
  else if(i.locked) act=`<div class="note">🔒 Unlocks at station level ${i.unlockAt}. Earn station XP from call-outs, upgrades and competitions.</div>`;
  else if(i.maxed) act=`<div class="note gold">⭐ Max level. Top of the range, mate.</div>`;
  else if(i.capped) act=`<div class="note">Reach station level ${i.l} to upgrade further.</div>`;
  else act=`<button class="gbtn green wide ${S.coins<i.cost?'cant':''}" data-act="upgrade" data-id="${id}">${i.l?'Upgrade':'Build'} · ${C(i.cost)} · ⏱ ${fmtTime(i.time)}</button>`;
  const shortcut={engine:['calls','🚨 Call-outs'],comms:['calls','🚨 Call-outs'],quarters:['crew','👥 Crew'],tower:['crew','🏋️ Train crew'],gym:['compete','🏆 Compete'],rescue:['crew','👥 Crew'],hazmat:['crew','👥 Crew']}[id];
  el.innerHTML=`<div class="shead"><div class="sicon">${def.icon}</div><div><div class="stitle">${def.name}</div><div class="stars">${'★'.repeat(Math.min(10,i.l))}<span>${'★'.repeat(Math.max(0,def.max-i.l))}</span></div></div><button class="xbtn" data-act="closesheet">✕</button></div>
    <div class="sdesc">${def.desc}</div>
    <div class="effect"><div><small>Now</small>${i.l?def.effect(i.l):'Not built yet'}</div>${i.maxed?'':`<div class="arrow">➜</div><div class="next"><small>Lv ${i.l+1}</small>${def.effect(i.l+1)}</div>`}</div>
    ${act}${shortcut?`<button class="gbtn blue wide sm2" data-act="open" data-v="${shortcut[0]}">${shortcut[1]}</button>`:''}`;
  liveTimers(el); }

/* ---------- full panels ---------- */
let view=null, viewArg=null, dispatchSel=[], compPick=null, lbCache=null;
function openPanel(v,arg){ const was=view; view=v; viewArg=arg; if(v!=='dispatch') dispatchSel=[]; closeSheet(); renderPanel(true); $('#panel').classList.add('on'); if(!was) Snd.swish();
  Music.setTrack(v==='compete'?'comp':'base'); }
function closePanel(){ view=null; $('#panel').classList.remove('on'); Music.setTrack('base'); }
function renderPanel(reset){ if(!view) return; const body=$('#panel .pbody'), st=reset?0:body.scrollTop; const title=$('#panel .ptitle');
  const R={calls:pCalls,dispatch:pDispatch,crew:pCrew,crewDetail:pCrewDetail,compete:pCompete,leader:pLeader,shop:pShop,settings:pSettings}[view];
  const [t,h]=R(viewArg); title.innerHTML=t; body.innerHTML=h; body.scrollTop=st; liveTimers(body); }
function pCalls(){ const open=S.calls.filter(c=>c.state==='open'), out=S.calls.filter(c=>c.state==='out');
  let h=`<div class="infobar">🚒 Free trucks <b>${G.freeAppliances()}/${D.appliances(G.bl('engine'))}</b> · 💺 ${D.seats(G.bl('engine'))} seats each · 👥 ${S.crew.filter(c=>!c.busy).length} crew free</div>`;
  if(out.length){ h+=`<div class="sect">On scene</div>`; for(const c of out){ const t=G.callType(c);
    h+=`<div class="ccard out"><div class="cic">${t.icon}</div><div class="cinfo"><div class="cname">${t.name}${c.rush?' <span class="rtag">RUSH</span>':''}</div>
      <div class="pbar"><i data-pstart="${c.start}" data-pend="${c.end}"></i><span data-end="${c.end}"></span></div><div class="csub">${Math.round(c.chance*100)}% success · ${c.team.length} crew</div></div>
      <button class="gbtn purple sm" data-act="speedcall" data-id="${c.id}"><span data-scost="${c.end}"></span></button></div>`; } }
  h+=`<div class="sect">Pager · new jobs</div>`;
  if(!open.length) h+=`<div class="empty">All quiet for now. Grab a cuppa. New calls arrive every ~${D.callEvery(G.bl('comms'))}s.</div>`;
  for(const c of open){ const t=G.callType(c); const free=S.crew.filter(m=>!m.busy);
    const chips=Object.entries(t.req).map(([r,n])=>roleChip(r,n,free.filter(m=>m.role===r).length>=n)).join('')||'<span class="chip ok">Anyone</span>';
    h+=`<div class="ccard ${c.rush?'rush':''}" data-act="respond" data-id="${c.id}"><div class="cic">${t.icon}</div><div class="cinfo"><div class="cname">${t.name} <span class="tier">${'▮'.repeat(t.tier)}</span>${c.rush?' <span class="rtag">RUSH 2x</span>':''}</div>
      <div class="chips">${chips}</div><div class="csub">${ICON.coin}${fmt(Math.round(t.reward*G.payMult()*(c.rush?2:1)))} · ⭐${t.xp} XP · ⏱${fmtTime(t.time)} · expires <span data-end="${c.expires}"></span></div></div><div class="go">›</div></div>`; }
  return ['🚨 Call-outs',h]; }
function pDispatch(id){ const call=S.calls.find(c=>c.id===id); if(!call||call.state!=='open'){ setTimeout(()=>openPanel('calls')); return ['🚨 Call-outs','']; }
  const t=G.callType(call), e=G.evalTeam(call,dispatchSel); const counts={}; dispatchSel.forEach(i=>{ const m=S.crew.find(c=>c.id===i); counts[m.role]=(counts[m.role]||0)+1; });
  const reqChips=Object.entries(t.req).map(([r,n])=>roleChip(r,n,(counts[r]||0)>=n)).join('')||'<span class="chip">Anyone can go</span>';
  const bonusChips=t.bonus.map(r=>roleChip(r,1,counts[r]?true:undefined)).join('');
  const pct=Math.round(e.chance*100), col=pct>=80?'#43a047':pct>=55?'#ffb300':'#e53935';
  let h=`<div class="dhead"><div class="cic big">${t.icon}</div><div><div class="cname">${t.name}</div><div class="blurb">“${t.blurb}”</div></div></div>
   <div class="reqbox"><div><small>MUST HAVE</small><div class="chips">${reqChips}</div></div>${t.bonus.length?`<div><small>BONUS (+6% each)</small><div class="chips">${bonusChips}</div></div>`:''}</div>
   <div class="meter"><div class="mlabel">Success chance <b style="color:${col}">${dispatchSel.length?pct+'%':'–'}</b></div><div class="mbar"><i style="width:${dispatchSel.length?pct:0}%;background:${col}"></i></div>
   <div class="mstats"><span>💺 ${dispatchSel.length}/${e.seats}</span><span>⏱ ${fmtTime(e.time)}</span><span>${C(e.reward)}</span><span>💪 ${e.power}/${t.diff}</span></div></div>
   <div class="row2"><button class="gbtn blue" data-act="autopick" data-id="${id}">✨ Best team</button><button class="gbtn red ${e.ok&&G.freeAppliances()>0?'':'cant'}" data-act="dispatch" data-id="${id}">🚒 DISPATCH!</button></div>
   <div class="sect">Pick your crew (tap to add)</div><div class="pick">`;
  const free=S.crew.slice().sort((a,b)=>G.memberPower(b,t.skills)-G.memberPower(a,t.skills));
  for(const m of free){ const sel=dispatchSel.includes(m.id); const p=Math.round(G.memberPower(m,t.skills)); const need=t.req[m.role];
    h+=`<div class="prow ${sel?'sel':''} ${m.busy?'busy':''}" data-act="${m.busy?'':'toggle'}" data-id="${m.id}">${avatarSVG(m,44)}<div class="pinfo"><b>${m.name}</b><small>${D.ROLES[m.role].short} · Lv ${m.lvl}${need?' · <span class="need">needed</span>':''}</small></div><div class="ppow">💪${p}</div>${m.busy?'<span class="btag">On a job</span>':`<div class="tick">${sel?'✓':'+'}</div>`}</div>`; }
  h+='</div>'; return ['🚒 Dispatch',h]; }
function crewCard(m){ const br=G.bestRarity(m); return `<div class="card r${br}" data-act="crewdetail" data-id="${m.id}">${avatarSVG(m,92)}<div class="clv">${m.lvl}</div>${m.sp>0?`<div class="sp">+${m.sp}</div>`:''}
  <div class="cn">${m.name}</div><div class="cr" style="color:${D.ROLES[m.role].color}">${D.ROLES[m.role].short}</div><div class="cp">💪 ${G.overallPower(m)}</div>${m.busy?'<div class="btag">On a job</div>':''}</div>`; }
function pCrew(){ const n=S.crew.length, beds=G.crewBeds();
  let h=`<div class="infobar">🛏️ Beds <b>${n}/${beds}</b> · 🎓 Level cap <b>${G.crewCap()}</b> (Training Tower) · tap a card to level and gear up</div><div class="grid">`;
  for(const m of S.crew) h+=crewCard(m);
  h+=`<div class="card add" data-act="recruitmenu"><div class="plus">＋</div><div class="cn">Recruit</div><div class="cp">${C(G.nextRecruitCost())}</div></div></div>`; return [`👥 Crew roster`,h]; }
function pCrewDetail(id){ const m=S.crew.find(c=>c.id===id); if(!m) return pCrew(); const role=D.ROLES[m.role]; const need=D.xpNeed(m.lvl), cap=G.crewCap(); const idx=S.crew.indexOf(m);
  let h=`<div class="dcard r${G.bestRarity(m)}"><button class="nav l" data-act="crewdetail" data-id="${S.crew[(idx-1+S.crew.length)%S.crew.length].id}">‹</button>${avatarSVG(m,150)}<button class="nav r" data-act="crewdetail" data-id="${S.crew[(idx+1)%S.crew.length].id}">›</button>
    <div class="dn">${m.name}</div><div class="dr" style="color:${role.color}">${role.icon} ${role.name}</div>
    <div class="xpline"><span class="lvb">Lv ${m.lvl}</span><div class="pbar"><i style="width:${m.lvl>=cap?100:m.xp/need*100}%"></i><span>${m.lvl>=cap?`Level cap ${cap}: upgrade the Training Tower`:`${m.xp}/${need} XP`}</span></div></div>
    <div class="row2"><div class="spbox">Skill points <b>${m.sp}</b></div><button class="gbtn green ${m.lvl>=cap||m.busy?'cant':''}" data-act="train" data-id="${m.id}">🏋️ Drill · ${C(G.trainCostFor(m))}</button></div></div>
    <div class="sect">Skills</div>`;
  for(const [k,name,desc] of role.skills){ const v=m.sk[k]; h+=`<div class="skill"><div class="sk-i"><b>${name}</b><small>${desc}</small><div class="pips">${Array.from({length:D.SKILL_MAX},(_,i)=>`<i class="${i<v?'on':''}"></i>`).join('')}</div></div>
    <button class="gbtn ${m.sp>0&&v<D.SKILL_MAX?'green':'cant'} sm" data-act="skill" data-id="${m.id}" data-k="${k}">${v>=D.SKILL_MAX?'MAX':`+1 · ${C(G.skillCost(m,k))}`}</button></div>`; }
  h+=`<div class="sect">Gear · total bonus +${G.gearBonus(m)}% power</div><div class="gear">`;
  for(const [k,name,ic] of D.GEAR_SLOTS){ const t=m.gear[k], R=D.RARITY[t], cost=D.gearCost(t);
    h+=`<div class="gslot" style="--rc:${R.color};--rg:${R.glow}"><div class="gic">${ic}</div><div class="gname">${name}</div><div class="grar">${R.name} · +${R.bonus}%</div>
      ${cost?`<button class="gbtn sm ${S.coins>=cost[0]&&S.badges>=cost[1]?'gold':'cant'}" data-act="gear" data-id="${m.id}" data-k="${k}">➜ ${D.RARITY[t+1].name}<br>${C(cost[0])}${cost[1]?' '+B(cost[1]):''}</button>`:'<div class="gmax">MAX</div>'}</div>`; }
  h+='</div>'; return [`👤 ${m.name}`,h]; }
function pCompete(){ const L=G.league(), lg=D.LEAGUES[L], next=D.LEAGUES[L+1];
  let h=`<div class="league" style="--lc:${lg.color}"><div class="lshield">${ICON.trophy}</div><div class="linfo"><div class="lname2">${lg.name} League</div><div class="ltr">${ICON.trophy}<b>${S.trophies}</b>${next?` / ${next.min} for ${next.name}`:' · Top of the ladder!'}</div>
    <div class="pbar"><i style="width:${next?Math.min(100,(S.trophies-lg.min)/(next.min-lg.min)*100):100}%"></i></div></div></div>
    <div class="row2"><button class="gbtn blue" data-act="open" data-v="leader">📋 Leaderboard</button><button class="gbtn orange" data-act="mutualaid">🤝 Mutual aid</button></div>
    <div class="sect">Events vs rival stations · win: +30 ${ICON.trophy} + gear crate</div>`;
  for(const c of D.COMPS){ const team=G.compTeam(c); const norm=G.crewNorm(c,team);
    h+=`<div class="ccard comp" data-act="comp" data-id="${c.id}"><div class="cic">${c.icon}</div><div class="cinfo"><div class="cname">${c.name}</div><div class="csub">${c.how}</div>${S.comp.best[c.id]!=null?`<div class="csub"><b>🏅 PB: ${c.game==='catch'?S.comp.best[c.id]+' pts':S.comp.best[c.id].toFixed(2)+'s'}</b></div>`:''}
      <div class="csub">Team: ${team.map(m=>m.name).join(', ')||'nobody free'} · crew boost <b>${Math.round(norm*100)}%</b></div></div><div class="go">›</div></div>`; }
  h+=`<p class="fine">Rivals are simulated AI stations for now. Online leagues, friend visits and mutual aid will plug into a small backend later.</p>`;
  return ['🏆 Competitions',h]; }
function pLeader(){ if(!lbCache){ Backend.getLeaderboard({me:{id:S.playerId,name:S.stationName,trophies:S.trophies}}).then(r=>{ lbCache=r; if(view==='leader') renderPanel(); }); return ['📋 Leaderboard','<div class="empty">Loading…</div>']; }
  const meIdx=lbCache.findIndex(r=>r.isYou); const rows=lbCache.slice(0,20); if(meIdx>=20) rows.push(lbCache[meIdx]);
  let h=`<div class="infobar">Simulated stations for now · online play coming later</div><div class="lb">`;
  for(const r of rows) h+=`<div class="lrow ${r.isYou?'you':''}"><span class="rk">${r.rank}</span><span class="ln">${r.name}</span><span class="lg">${r.league}</span><span class="lt">${ICON.trophy}${r.trophies}</span>${r.isYou?'':`<button class="gbtn sm blue" data-act="visit" data-id="${r.id}">Visit</button>`}</div>`;
  return ['📋 Leaderboard',h+'</div><div class="row2"><button class="gbtn" data-act="open" data-v="compete">‹ Back</button></div>']; }
function pShop(){ let h=`<div class="demo-banner">🧪 DEMO SHOP: nothing here is for sale yet.<br>No real ads, no payments, nothing is charged.</div>
  <div class="ccard shop"><div class="cic">📺</div><div class="cinfo"><div class="cname">Free badges</div><div class="csub">Watch a short ad for +5 badges (3s DEMO, no real ad)</div></div><button class="gbtn orange sm" data-act="adbadges">Watch<br><small>DEMO</small></button></div>`;
  for(const it of D.SHOP){ const ic=it.icon==='badge'?ICON.badge:it.icon;
    h+=`<div class="ccard shop"><div class="cic">${ic}</div><div class="cinfo"><div class="cname">${it.name}</div><div class="csub">${it.desc}</div></div>
     ${it.id==='xmas'?`<button class="gbtn sm blue" data-act="xmas">${S.xmas?'On ✓':'Try'}</button>`:''}<button class="gbtn sm demo" data-act="demobuy">${it.price}<small>Demo, not for sale yet</small></button></div>`; }
  return ['🛒 Shop',h]; }
function pSettings(){ return ['⚙️ Settings',`
  <div class="setrow"><span>🎵 Music</span><button class="gbtn sm ${S.prefs.music?'green':'cant'}" data-act="tmusic">${S.prefs.music?'ON':'OFF'}</button></div>
  <div class="setrow"><span>🔔 Sound effects</span><button class="gbtn sm ${S.prefs.sfx?'green':'cant'}" data-act="tsfx">${S.prefs.sfx?'ON':'OFF'}</button></div>
  <p class="fine">No sound on iPhone? Check the silent switch on the side of the phone.</p>
  <div class="stat"><span>Call-outs attended</span><b>${S.stats.calls} (${S.stats.success} saved)</b></div>
  <div class="stat"><span>Coins earned</span><b>${fmt(S.stats.earned)}</b></div>
  <div class="stat"><span>Competitions</span><b>${S.comp.played} played · ${S.comp.wins} won</b></div>
  <div class="stat"><span>Player ID (for online play later)</span><b class="mono">${S.playerId.slice(0,14)}</b></div>
  <div class="about"><b>Firey Station Tycoon</b> · v${D.VERSION} prototype<br>A fictional game. Not affiliated with, or endorsed by, any fire service.<br>
  3D engine: three.js (MIT). Font: Lilita One (SIL Open Font License). All art drawn in code; all sounds and music synthesised in code.</div>
  <button class="gbtn red wide" data-act="reset">Reset progress</button>`]; }

/* ---------- actions ---------- */
document.addEventListener('click',async e=>{ const b=e.target.closest('[data-act]'); if(!b||!b.dataset.act) return; const a=b.dataset.act, id=b.dataset.id;
  if(!['toggle','upgrade','dispatch','skill','gear','train','claim','comp'].includes(a)) Snd.tap();
  switch(a){
  case 'closesheet': closeSheet(); break;
  case 'closepanel': closePanel(); break;
  case 'open': openPanel(b.dataset.v); break;
  case 'upgrade': { if(err(G.startUpgrade(id))) break; Snd.hammer(); toast(`👷 Builder started on the ${D.BUILDINGS[id].name}`,'good'); after(); break; }
  case 'speed': { if(err(G.speedUp(id))) break; Snd.speedUp(); G.tick(); handle(G.tick()); after(); break; }
  case 'adspeed': fakeAd(()=>{ G.cutTime(id,300); toast('⏩ 5 minutes skipped (demo ad)','gold'); after(); }); break;
  case 'respond': dispatchSel=G.autoTeam(S.calls.find(c=>c.id===id)); openPanel('dispatch',id); Snd.pager(); break;
  case 'toggle': { const i=dispatchSel.indexOf(id); const seats=D.seats(G.bl('engine')); if(i>=0) dispatchSel.splice(i,1); else if(dispatchSel.length<seats) dispatchSel.push(id); else { err(`Only ${seats} seats on the truck`); break; } Snd.tap(); renderPanel(); break; }
  case 'autopick': dispatchSel=G.autoTeam(S.calls.find(c=>c.id===id)); renderPanel(); break;
  case 'dispatch': { if(err(G.dispatch(id,dispatchSel))) break; Snd.siren(); scene.launchTruck(); const t=G.callType(S.calls.find(c=>c.id===id)); toast(`🚒 Crew en route to the ${t.name.toLowerCase()}!`,'good'); dispatchSel=[]; openPanel('calls'); after(); break; }
  case 'speedcall': { const c=S.calls.find(x=>x.id===id); if(c&&!err(G.speedCall(c))){ Snd.speedUp(); handle(G.tick()); after(); } break; }
  case 'crewdetail': openPanel('crewDetail',id); Snd.pop(); break;
  case 'recruitmenu': recruitMenu(); break;
  case 'train': { const m=S.crew.find(c=>c.id===id); const [er,ups]=G.train(m); if(err(er)) break; Snd.skill(); if(ups.length){ Snd.level(); toast(`⭐ ${m.name} reached Lv ${m.lvl}! +1 skill point`,'gold'); } else toast(`🏋️ ${m.name} smashed the drill (+XP)`,'good'); after(); break; }
  case 'skill': { const m=S.crew.find(c=>c.id===id); if(err(G.upSkill(m,b.dataset.k))) break; Snd.skill(); after(); break; }
  case 'gear': { const m=S.crew.find(c=>c.id===id); if(err(G.upGear(m,b.dataset.k))) break; Snd.equip(); const t=m.gear[b.dataset.k]; toast(`${D.RARITY[t].name} gear fitted to ${m.name}!`, t>=3?'gold':'good'); if(t>=3) Snd.buildDone(); after(); break; }
  case 'claim': { const n=G.claimQuest(); if(n){ Snd.collect(); toast(`🎯 Goal complete! +${n} badges`,'gold'); after(); } break; }
  case 'comp': startComp(D.COMPS.find(c=>c.id===id)); break;
  case 'visit': visitBase(id); break;
  case 'mutualaid': modal(`<h2>🤝 Mutual aid</h2><p>Soon you'll be able to call in a mate's station to help on big jobs, and help them back for badges.</p><p class="fine">Needs online play, so this is a placeholder for now.</p>`,[{label:'No worries'}]); break;
  case 'adbadges': fakeAd(()=>{ S.badges+=5; Snd.collect(); toast(`+5 badges (demo ad)`,'gold'); after(); }); break;
  case 'demobuy': toast('🧪 Demo only, not for sale yet. Nothing was charged.'); break;
  case 'xmas': S.xmas=!S.xmas; scene.setXmas?.(S.xmas); after(); break;
  case 'tmusic': S.prefs.music=!S.prefs.music; setAudioPrefs(S.prefs); after(); break;
  case 'tsfx': S.prefs.sfx=!S.prefs.sfx; setAudioPrefs(S.prefs); after(); break;
  case 'reset': modal('<h2>Start again?</h2><p>This wipes your whole station, crew and trophies.</p>',[{label:'Yes, reset',cls:'red',fn:()=>{ G.resetAll(); location.reload(); }},{label:'Cancel',cls:'blue'}]); break;
  case 'sound': { const on=!(S.prefs.sfx||S.prefs.music); S.prefs.sfx=on; S.prefs.music=on; setAudioPrefs(S.prefs); after(); break; }
  }
});
['#btnCalls','#btnCrew','#btnComp','#btnShop'].forEach((s,i)=>$(s).addEventListener('click',()=>{ Snd.tap(); openPanel(['calls','crew','compete','shop'][i]); }));
$('#btnSettings').addEventListener('click',()=>{ Snd.tap(); openPanel('settings'); });
$('#btnSound').addEventListener('click',()=>{ Snd.tap(); const on=!(S.prefs.sfx||S.prefs.music); S.prefs.sfx=on; S.prefs.music=on; setAudioPrefs(S.prefs); after(); });
$('#badgePlus').addEventListener('click',()=>{ Snd.tap(); openPanel('shop'); });

function recruitMenu(){ const cost=G.nextRecruitCost(); const full=S.crew.length>=G.crewBeds();
  modal(`<h2>Recruit a Firey</h2><p>${full?'<b>Quarters are full.</b> Upgrade Quarters & Kitchen for more beds.':`Cost ${C(cost)} · Beds ${S.crew.length}/${G.crewBeds()}`}</p><div class="rlist">${D.ROLE_ORDER.map(r=>{ const R=D.ROLES[r]; const have=S.crew.filter(c=>c.role===r).length;
     return `<button class="rrow" data-role="${r}" ${full?'disabled':''}><span class="ri" style="background:${R.color}">${R.icon}</span><span class="rt"><b>${R.name}</b><small>${R.skills.map(s=>s[1]).join(' · ')}</small></span><span class="rh">×${have}</span></button>`; }).join('')}</div>`,[{label:'Close',cls:'blue'}],'recruit');
  $('#modal .rlist').addEventListener('click',e=>{ const b=e.target.closest('[data-role]'); if(!b) return; const [er,m]=G.recruit(b.dataset.role); if(err(er)) return; closeModal(); Snd.recruit();
    modal(`<h2>Welcome aboard!</h2><div class="newcrew">${avatarSVG(m,140)}</div><p><b>${m.name}</b> joins as a <b style="color:${D.ROLES[m.role].color}">${D.ROLES[m.role].name}</b>.</p>`,[{label:'Sweet as',fn:()=>openPanel('crewDetail',m.id)}]); after(); }); }

async function visitBase(id){ const b=await Backend.getBase(id); if(!b) return;
  modal(`<h2>🏠 ${b.name}</h2><p>Station level ${b.level} · crew power ${b.crewPower}</p><div class="vgrid">${D.BUILD_ORDER.map(k=>`<div>${D.BUILDINGS[k].icon}<small>${D.BUILDINGS[k].name}</small><b>Lv ${b.buildings[k]}</b></div>`).join('')}</div><p class="fine">Simulated station. Real friend visits come with online play.</p>`,[{label:'Back',cls:'blue'}]); }

/* ---------- competitions ---------- */
async function startComp(comp){ const team=G.compTeam(comp); if(team.length<3) return err('You need 3 free crew to enter. Wait for crews to return or recruit more.');
  Snd.pop(); const rivals=await Backend.getRivals({trophies:S.trophies,n:3}); const norm=G.crewNorm(comp,team);
  modal(`<h2>${comp.icon} ${comp.name}</h2><p>${comp.how}</p><div class="vs"><div class="vteam">${team.map(m=>avatarSVG(m,58)).join('')}<small>${S.stationName}<br>crew boost ${Math.round(norm*100)}%</small></div><div class="vsx">VS</div>
     <div class="vriv">${rivals.map(r=>`<div><b>${r.name}</b><small>${r.league} · ${ICON.trophy}${r.trophies}</small></div>`).join('')}</div></div>`,
    [{label:'🏁 Let\'s go!',cls:'green',fn:()=>{ Music.setTrack('comp'); Music.boost=10; Snd.rushStart();
        runMinigame($('#mg'),comp,{norm,rivals,you:'You'},res=>finishComp(comp,team,rivals,res)); }},{label:'Not now',cls:'blue'}]); }
async function finishComp(comp,team,rivals,res){ Music.boost=0; const r=G.applyComp(comp,res.place,team);
  const mine=res.rows.find(x=>x.you)?.value, pbOld=S.comp.best[comp.id]; let pb=false; if(mine!=null&&mine<99){ const better=comp.game==='catch'?(pbOld==null||mine>pbOld):(pbOld==null||mine<pbOld); if(better){ S.comp.best[comp.id]=mine; pb=pbOld!=null; } }
  await Backend.submitCompResult({ playerId:S.playerId, compId:comp.id, score:res.perf, place:res.place, trophiesDelta:r.dT, ts:Date.now() }); lbCache=null;
  const places=['1st','2nd','3rd','4th']; res.place===0?Snd.win():res.place===1?Snd.trophyUp():Snd.lose(); if(r.dT>0) setTimeout(()=>Snd.trophyUp(),1400); else setTimeout(()=>Snd.trophyDown(),900);
  let crateH=''; if(r.crate){ if(r.crate.crew) crateH=`<div class="crate"><div class="cratebox">🎁</div><p>Gear crate: <b>${r.crate.crew.name}</b>'s ${D.GEAR_SLOTS.find(s=>s[0]===r.crate.slot)[1]} ➜ <b style="color:${D.RARITY[r.crate.to].color}">${D.RARITY[r.crate.to].name}</b></p>${avatarSVG(r.crate.crew,96)}</div>`; else crateH=`<p>Gear crate: everyone's maxed! +${r.crate.badges} badges</p>`; setTimeout(()=>Snd.crate(),1600); }
  modal(`<h2 class="${res.place===0?'gold':''}">${res.place===0?'🏆 WINNERS!':places[res.place]+' place'}</h2>
    <div class="standings">${res.rows.map((row,i)=>`<div class="srow ${row.you?'you':''}"><span>${places[i]}</span><b>${row.you?S.stationName:row.name}</b><span>${comp.game==='catch'?row.value+' pts':row.value>=99?'DNF':row.value.toFixed(2)+'s'}</span></div>`).join('')}</div>
    <div class="rewards"><span>${ICON.trophy}<b>${r.dT>0?'+':''}${r.dT}</b></span><span>${C(r.coins)}</span>${r.badges?`<span>${B(r.badges)}</span>`:''}</div>
    ${pb?`<p class="gold">🏅 New personal best!</p>`:''}${r.promoted?`<p class="gold">⬆️ Promoted to ${D.LEAGUES[G.league()].name} League!</p>`:''}${crateH}`,[{label:'Back to station',fn:()=>openPanel('compete')}],'results');
  Music.setTrack('base'); after(); }

/* ---------- events from the game tick ---------- */
function handle(evts){ for(const e of evts){
  if(e.built){ Snd.buildDone(); toast(`🎉 ${D.BUILDINGS[e.built].name} is now level ${G.bl(e.built)}!`,'gold'); scene.bounce(e.built); }
  if(e.newCall){ Snd.pager(); const t=G.callType(e.newCall); toast(`📟 New call: ${t.icon} ${t.name}`,''); }
  if(e.result){ const r=e.result; r.ok?Snd.callWin():Snd.callFail(); if(!document.hidden) scene.returnTruck();
    toast(r.ok?`✅ ${r.type.name}: sorted! +${fmt(r.coins)} coins${r.badges?` +${r.badges} badge`:''}`:`😬 ${r.type.name} got away from us. +${fmt(r.coins)} coins`, r.ok?'good':'bad');
    r.ups.forEach(([m,l])=>setTimeout(()=>{ toast(`⭐ ${m.name} reached Lv ${l}!`,'gold'); Snd.level(); },600)); }
  if(e.result?.stationUps?.length) setTimeout(()=>{ toast(`🏅 Station level ${S.level}! +5 badges`,'gold'); Snd.level(); },900);
  if(e.rushStart){ Snd.rushStart(); Music.boost=24; toast('🚨 RUSH HOUR! 3 jobs at double pay. Clear them all for +10 badges','bad'); }
  if(e.rushWin){ Snd.win(); Music.boost=0; toast('🏆 Rush Hour smashed! +10 badges','gold'); }
  if(e.rushLose){ Snd.lose(); Music.boost=0; toast(`Rush Hour over: ${e.done}/3. She'll be right next time!`); }
} if(evts.length) after(true); }
function after(fromTick){ hud(); syncScene(); if(view&&!(fromTick&&view==='dispatch')) renderPanel(); renderSheet(); G.save(); }
function syncScene(){ for(const id of D.BUILD_ORDER){ const i=G.bInfo(id); scene.setBuilding(id,i.l,{upgrading:!!i.up,locked:i.locked}); } scene.setXmas?.(S.xmas); }
function collectSizzle(){ const n=G.collectSizzle(); if(n){ Snd.collect(); toast(`🌭 Sausage sizzle takings: +${fmt(n)} coins`,'gold'); after(); } }

/* ---------- loop ---------- */
let last=performance.now(), acc=0, accS=0;
function frame(t){ const dt=Math.min(.1,(t-last)/1000); last=t; acc+=dt; accS+=dt;
  scene.update(dt); placeLabels();
  if(acc>=.25){ acc=0; handle(G.tick()); hud(); liveTimers(); }
  if(accS>=5){ accS=0; G.save(); }
  requestAnimationFrame(frame); }
syncScene(); hud();
document.addEventListener('visibilitychange',()=>{ if(document.hidden) G.save(); });
window.addEventListener('pagehide',()=>G.save());

/* ---------- welcome ---------- */
const away=(Date.now()-S.lastSeen)/1000;
if(boot.fresh){
  modal(`<div class="logo">Firey<span>Station Tycoon</span></div><p>G'day, Boss! You've taken over <b>Snag Flats Station</b>: a tired engine bay, four keen Fireys and a sausage sizzle.</p>
    ${boot.migrated?`<div class="note gold">Thanks for playing v1! Your old progress is now <b>${fmt(boot.migrated.coins)} coins</b> and <b>${boot.migrated.badges} badges</b>.</div>`:''}
    <p>Answer call-outs, upgrade your station, level and gear up your crew, and beat rival stations at the comps.</p><p class="fine">Fictional game, original art. Not affiliated with any fire service.</p>`,
    [{label:'🚒 Start shift',fn:()=>{ Snd.unlock(); S.nextCallAt=Date.now()+1500; G.save(); }}],'welcome');
} else { const evts=G.tick(); const res=evts.filter(e=>e.result).map(e=>e.result); const built=evts.filter(e=>e.built).map(e=>e.built);
  if(away>120 && (res.length||built.length||S.sizzle.stored>=1)){
    modal(`<h2>Welcome back, Boss!</h2><p>You were away ${fmtTime(away)}.</p>
     ${res.length?`<div class="stat"><span>Call-outs finished</span><b>${res.filter(r=>r.ok).length} saved / ${res.length}</b></div><div class="stat"><span>Coins earned</span><b>${fmt(res.reduce((a,r)=>a+r.coins,0))}</b></div>`:''}
     ${built.length?`<div class="stat"><span>Upgrades finished</span><b>${built.map(b=>D.BUILDINGS[b].name).join(', ')}</b></div>`:''}
     ${S.sizzle.stored>=1?`<div class="stat"><span>Sausage sizzle takings waiting</span><b>${fmt(S.sizzle.stored)}</b></div>`:''}`,
     [{label:'Collect & get to work',fn:()=>{ collectSizzle(); }}]); }
  handle(evts); }
requestAnimationFrame(t=>{ last=t; frame(t); });
