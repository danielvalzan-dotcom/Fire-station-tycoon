// Firey Station Tycoon v2: online features, SIMULATED for now.
// Everything online goes through this one object, so a real backend can replace LocalSim later without UI changes.
// A small free backend (e.g. Supabase, Firebase or a Cloudflare Worker + KV) only needs these endpoints:
//
//   POST /v1/players                  -> { playerId, token }                      (anonymous device login)
//   GET  /v1/rivals?trophies=N&n=3    -> [ RivalStation ]
//   POST /v1/comp-results             <- CompResult  -> { ok, trophies }
//   GET  /v1/leaderboard?scope=global -> [ LeaderRow ]
//   GET  /v1/bases/:playerId          -> BaseSnapshot                              (friend visits)
//   POST /v1/mutual-aid               <- { callId, callType } -> { helper?: RivalStation }
//
// Shapes:
//   RivalStation = { id, name, trophies, league, rating (0..1 skill), crewPower, isBot }
//   CompResult   = { playerId, compId, score, place, trophiesDelta, ts }
//   LeaderRow    = { rank, id, name, trophies, league, isYou }
//   BaseSnapshot = { id, name, level, buildings:{id:level}, crew:[{role,lvl,bestRarity}] }
import { RIVAL_NAMES, LEAGUES, leagueOf } from './data.js';

function seeded(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const PREFIX=['North','South','East','West','Upper','Lower','Old','New','Little','Big'];
function botPool(){ const r=seeded(1337), out=[]; const day=Math.floor(Date.now()/864e5);
  for(let i=0;i<48;i++){ const base=RIVAL_NAMES[i%RIVAL_NAMES.length]; const name=i<RIVAL_NAMES.length?base:`${PREFIX[i%PREFIX.length]} ${base}`;
    const tr=Math.round(Math.pow(r(),1.6)*2600 + Math.sin(day*.7+i)*25); out.push({ id:'bot'+i, name, trophies:Math.max(0,tr), isBot:true,
      level:1+Math.floor(tr/180), crewPower:Math.round(60+tr*.4) }); }
  return out; }

export const LocalSim = {
  mode:'local-sim (offline, AI rivals)',
  async getRivals({ trophies, n=3 }){ const L=leagueOf(trophies);
    const pool=botPool().filter(b=>Math.abs(b.trophies-trophies)<350).sort(()=>Math.random()-.5);
    const out=[]; for(let i=0;i<n;i++){ const b=pool[i]||botPool()[Math.floor(Math.random()*48)];
      const rating=Math.max(.25,Math.min(.97,.33+L*.11+(Math.random()*.2-.1)));
      out.push({ ...b, trophies:Math.max(0,trophies+Math.round(Math.random()*120-60)), league:LEAGUES[L].name, rating }); }
    return out; },
  async submitCompResult(res){ const k='fst_v2_comp_log'; try{ const a=JSON.parse(localStorage.getItem(k)||'[]'); a.push(res); localStorage.setItem(k,JSON.stringify(a.slice(-50))); }catch(e){} return { ok:true }; },
  async getLeaderboard({ me }){ const rows=botPool().map(b=>({ id:b.id, name:b.name, trophies:b.trophies, isYou:false }));
    rows.push({ id:me.id, name:me.name, trophies:me.trophies, isYou:true });
    rows.sort((a,b)=>b.trophies-a.trophies); return rows.map((r,i)=>({ ...r, rank:i+1, league:LEAGUES[leagueOf(r.trophies)].name })); },
  async getBase(id){ const b=botPool().find(x=>x.id===id); if(!b) return null; const lv=Math.min(10,1+Math.floor(b.trophies/300));
    return { id, name:b.name, level:b.level, buildings:{engine:lv,tower:lv,gym:Math.max(1,lv-1),hazmat:Math.max(0,lv-2),rescue:Math.max(0,lv-1),quarters:lv,comms:lv}, crewPower:b.crewPower }; },
  async requestMutualAid(){ return { helper:null, note:'Mutual aid from real players is coming with online play.' }; },
};
export const Backend = LocalSim;
