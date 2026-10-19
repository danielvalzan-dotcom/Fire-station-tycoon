// Crew portraits (v3): Aussie animal Fireys.
// Each portrait layers a hand-drawn SVG animal (always there as a fallback) under an optional painted portrait
// (assets/crew/<species>.webp, or <species>_elite.webp at Epic+ gear). If the image file is missing it removes itself and the SVG shows.
// Gear rarity changes the SVG helmet, coat, trim, boots and BA colours, the card frame/glow, and swaps to the elite painted portrait.
import { ROLES, RARITY, SPECIES_LOOK } from './data.js';
const HELMET = ['#f2c230','#ffd54f','#2f7fe0','#9b40c9','#1d1d1d'];   // issue .. legendary (legendary = black+gold)
const HTRIM  = ['#c9a227','#fff2a8','#b3e5ff','#f0c4ff','#ffcc33'];
const COAT   = ['#b8954f','#c9a762','#2a62c4','#6f34a8','#2a2a2a'];
const TRIM   = ['#cfd8dc','#e8ff6a','#b3ffff','#ffd1ff','#ffcc33'];
const BOOT   = ['#3b3b3b','#2b2b2b','#1c3f7a','#4a1f6e','#7a5200'];
let n=0;
export const portraitURL = (sp, elite) => `assets/crew/${sp}${elite?'_elite':''}.webp`;
export const headURL = (sp, elite) => `assets/crew/${sp}${elite?'_elite':''}_head.webp`;
export const isElite = c => { const g=c.gear; return Math.max(g.helmet,g.coat,g.ba)>=3 || (g.helmet+g.coat+g.boots+g.ba)>=9; };
const bestR = c => Math.max(c.gear.helmet,c.gear.coat,c.gear.boots,c.gear.ba);

function ears(L,id){ const f=L.fur, f2=L.fur2;
  switch(L.ear){
    case 'tall': return `<path d="M30 30 C22 6 30 2 36 8 C40 14 40 24 38 32Z" fill="${f}" stroke="#2a1d10" stroke-width="1.6"/><path d="M32 27 C28 12 32 8 35 11 C37 15 37 22 36 28Z" fill="#e7a3a0"/>
      <path d="M66 30 C74 6 66 2 60 8 C56 14 56 24 58 32Z" fill="${f}" stroke="#2a1d10" stroke-width="1.6"/><path d="M64 27 C68 12 64 8 61 11 C59 15 59 22 60 28Z" fill="#e7a3a0"/>`;
    case 'pointy': return `<path d="M28 34 L30 10 L42 26Z" fill="${f}" stroke="#2a1d10" stroke-width="1.6"/><path d="M31 29 L32 16 L39 26Z" fill="${f2}"/>
      <path d="M68 34 L66 10 L54 26Z" fill="${f}" stroke="#2a1d10" stroke-width="1.6"/><path d="M65 29 L64 16 L57 26Z" fill="${f2}"/>`;
    case 'fluffy': return `<circle cx="27" cy="38" r="12" fill="${f}" stroke="#2a1d10" stroke-width="1.6"/><circle cx="28" cy="39" r="7" fill="${f2}"/>
      <circle cx="69" cy="38" r="12" fill="${f}" stroke="#2a1d10" stroke-width="1.6"/><circle cx="68" cy="39" r="7" fill="${f2}"/>`;
    case 'round': return `<circle cx="32" cy="33" r="6.5" fill="${f}" stroke="#2a1d10" stroke-width="1.5"/><circle cx="64" cy="33" r="6.5" fill="${f}" stroke="#2a1d10" stroke-width="1.5"/>`;
    case 'small': return `<circle cx="33" cy="35" r="5" fill="${f}" stroke="#2a1d10" stroke-width="1.5"/><circle cx="63" cy="35" r="5" fill="${f}" stroke="#2a1d10" stroke-width="1.5"/>`;
    case 'pink': return `<circle cx="31" cy="33" r="7" fill="${f}" stroke="#111" stroke-width="1.5"/><circle cx="31" cy="33" r="4.2" fill="#e88f8f"/><circle cx="65" cy="33" r="7" fill="${f}" stroke="#111" stroke-width="1.5"/><circle cx="65" cy="33" r="4.2" fill="#e88f8f"/>`;
    case 'crest': return `<path d="M60 30 C66 10 78 6 84 4 C78 12 74 18 72 22 C80 16 86 16 90 16 C82 22 76 28 70 34Z" fill="#ffd21f" stroke="#a37b00" stroke-width="1.4"/>`;
    case 'spines': { let s=''; for(let i=0;i<11;i++){ const a=Math.PI*(1.05+i*0.09), x=48+Math.cos(a)*20, y=46+Math.sin(a)*20, x2=48+Math.cos(a)*31, y2=46+Math.sin(a)*31;
        s+=`<path d="M${x-2.5} ${y} L${x2} ${y2} L${x+2.5} ${y+1}Z" fill="#c9a37a" stroke="#5a3f25" stroke-width="1"/>`; } return s; }
    case 'frill': return `<path d="M14 62 C8 44 18 40 22 34 C26 44 30 50 34 56 M82 62 C88 44 78 40 74 34 C70 44 66 50 62 56" fill="#ef7a2c" stroke="#8a3a10" stroke-width="1.6"/>
      <path d="M12 64 Q18 48 30 54 Q24 62 12 64Z M84 64 Q78 48 66 54 Q72 62 84 64Z" fill="#f59a3d" stroke="#8a3a10" stroke-width="1.4"/>`;
    default: return ''; } }
function snout(L,mood){ const f2=L.fur2, nose=L.nose;
  const mouth = mood==='worried' ? `<path d="M43 63 q5 -3 10 0" stroke="#3a1d10" stroke-width="2" fill="none" stroke-linecap="round"/>`
             : mood==='determined' ? `<path d="M42 62 q6 2 12 0" stroke="#3a1d10" stroke-width="2" fill="none" stroke-linecap="round"/>`
             : `<path d="M41 60 q7 7 14 0" fill="#7a2a22" stroke="#3a1d10" stroke-width="1.6"/><path d="M44 62 q4 3 8 0" fill="#e57373"/>`;
  switch(L.snout){
    case 'long': return `<ellipse cx="45" cy="57" rx="11" ry="8" fill="${f2}" stroke="#2a1d10" stroke-width="1.4"/><ellipse cx="40" cy="53" rx="5" ry="3.6" fill="${nose}"/><ellipse cx="38.6" cy="52" rx="1.6" ry="1" fill="#fff" opacity=".6"/>${mouth}`;
    case 'koala': return `<ellipse cx="48" cy="58" rx="9" ry="7" fill="${f2}"/><ellipse cx="48" cy="52" rx="6.5" ry="8.5" fill="${nose}" stroke="#111" stroke-width="1"/><ellipse cx="46" cy="48" rx="2" ry="3" fill="#fff" opacity=".35"/>${mouth}`;
    case 'wide': return `<ellipse cx="48" cy="57" rx="13" ry="8" fill="${f2}" stroke="#2a1d10" stroke-width="1.2"/><path d="M41 50 q7 -4 14 0 q-2 6 -7 6 q-5 0 -7 -6z" fill="${nose}"/>${mouth}`;
    case 'short': return `<ellipse cx="48" cy="57" rx="9" ry="6.5" fill="${f2}"/><path d="M43 51 q5 -3 10 0 q-1 4 -5 4.5 q-4 -.5 -5 -4.5z" fill="${nose}"/>${mouth}${L.teeth?'<path d="M44 61 l1.5 3 1.5 -3 M50 61 l1.5 3 1.5 -3" fill="#fff" stroke="#fff" stroke-width=".8"/>':''}`;
    case 'beak': return `<path d="M36 52 Q30 56 33 60 Q44 64 52 56 Q46 50 36 52Z" fill="#4a4a4a" stroke="#1a1a1a" stroke-width="1.4"/><path d="M34 58 Q42 62 50 57" stroke="#1a1a1a" stroke-width="1.2" fill="none"/>${mood==='happy'?'<path d="M36 58 Q42 66 50 58" fill="#d9534f"/>':''}`;
    case 'hook': return `<path d="M38 48 Q30 52 32 62 Q36 58 40 57 Q48 56 52 50 Q46 45 38 48Z" fill="#2e2e2e" stroke="#000" stroke-width="1.2"/><path d="M40 57 Q46 64 52 56" fill="#3d3d3d" stroke="#000" stroke-width="1"/>`;
    case 'bill': return `<path d="M24 56 Q22 48 34 48 L52 50 Q56 54 52 58 L34 62 Q24 63 24 56Z" fill="#6b5a4e" stroke="#2a1d10" stroke-width="1.5"/><circle cx="31" cy="52" r="1" fill="#2a1d10"/><circle cx="35" cy="52" r="1" fill="#2a1d10"/><path d="M26 57 Q38 58 52 54" stroke="#2a1d10" stroke-width="1" fill="none"/>`;
    case 'needle': return `<path d="M30 58 L46 52 L48 60Z" fill="${f2}" stroke="#2a1d10" stroke-width="1.3"/><circle cx="29" cy="58.5" r="2.4" fill="${nose}"/><path d="M42 61 q4 2 8 -1" stroke="#3a1d10" stroke-width="1.6" fill="none"/>`;
    case 'lizard': return `<ellipse cx="46" cy="57" rx="14" ry="8" fill="${f2}" stroke="#3d4d1e" stroke-width="1.4"/><circle cx="38" cy="53" r="1" fill="#3d4d1e"/><circle cx="42" cy="53" r="1" fill="#3d4d1e"/>
      <path d="M34 60 Q46 68 58 59" fill="${mood==='happy'?'#c94d4d':'none'}" stroke="#3d4d1e" stroke-width="1.6"/>${mood==='happy'?'<path d="M37 61 l1.5 2 1.5 -2 l1.5 2 1.5 -2 l1.5 2 1.5 -2 l1.5 2 1.5 -2 l1.5 2 1.5 -2" stroke="#fff" fill="none" stroke-width="1"/>':''}`;
    default: return mouth; } }
function eyes(L,mood){ const ey=L.eye; const brow = mood==='worried' ? ['M33 39 L42 37','M63 39 L54 37'] : mood==='determined' ? ['M33 36 L43 40','M63 36 L53 40'] : ['M34 37 Q38 34 43 37','M53 37 Q58 34 62 37'];
  const lid = L.snout==='koala' ? `<path d="M34 43 Q38 40 43 43" fill="${L.fur}" /><path d="M53 43 Q58 40 62 43" fill="${L.fur}"/>` : '';
  return `<ellipse cx="39" cy="45" rx="5" ry="5.6" fill="#fff" stroke="#2a1d10" stroke-width="1"/><ellipse cx="57" cy="45" rx="5" ry="5.6" fill="#fff" stroke="#2a1d10" stroke-width="1"/>
   <circle cx="39.6" cy="45.6" r="3.2" fill="${ey}"/><circle cx="57.6" cy="45.6" r="3.2" fill="${ey}"/><circle cx="39.8" cy="45.8" r="1.6" fill="#120a05"/><circle cx="57.8" cy="45.8" r="1.6" fill="#120a05"/>
   <circle cx="41" cy="44" r="1.1" fill="#fff"/><circle cx="59" cy="44" r="1.1" fill="#fff"/>${lid}
   <path d="${brow[0]}" stroke="#2a1d10" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="${brow[1]}" stroke="#2a1d10" stroke-width="2.4" stroke-linecap="round" fill="none"/>`; }

export function animalSVG(c, size=96, mood='happy'){
  const id='a'+(n++), g=c.gear, L=SPECIES_LOOK[c.species]||SPECIES_LOOK.roo, role=ROLES[c.role];
  const hel=HELMET[g.helmet], ht=HTRIM[g.helmet], coat=COAT[g.coat], trim=TRIM[g.coat], boot=BOOT[g.boots], ba=g.ba;
  const br=bestR(c), glow=RARITY[br];
  const shine = t => t>=3 ? `<animate attributeName="opacity" values=".5;1;.5" dur="2s" repeatCount="indefinite"/>` : '';
  const head = L.neck ? `<path d="M42 70 Q40 58 44 52 L54 52 Q58 58 56 70Z" fill="${L.fur}" stroke="#2a1d10" stroke-width="1.4"/>` : '';
  return `<svg viewBox="0 0 96 96" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="${id}bg" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#bfe8e1"/><stop offset="1" stop-color="#5fa79c"/></radialGradient>
    <linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".3" stop-color="${hel}"/><stop offset="1" stop-color="${hel}"/></linearGradient>
    <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${coat}"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
    <radialGradient id="${id}f" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="${L.fur2}" stop-opacity=".55"/><stop offset=".55" stop-color="${L.fur}"/><stop offset="1" stop-color="${L.fur}"/></radialGradient>
    <linearGradient id="${id}t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a9a9a"/><stop offset=".5" stop-color="#f3f7f7"/><stop offset="1" stop-color="#8a9a9a"/></linearGradient>
  </defs>
  <rect x="0" y="0" width="96" height="96" rx="18" fill="url(#${id}bg)"/>
  ${br>=2?`<circle cx="48" cy="46" r="42" fill="${glow.color}" opacity=".22">${shine(br)}</circle>`:''}
  ${L.ear==='frill'?ears(L,id):''}
  ${ba>0?`<rect x="68" y="56" width="14" height="34" rx="6" fill="url(#${id}t)" stroke="#555" stroke-width="1"/><rect x="68" y="62" width="14" height="5" fill="${RARITY[ba].color}"/>`:''}
  <path d="M14 96 C14 74 26 66 48 66 C70 66 82 74 82 96 Z" fill="url(#${id}c)" stroke="#2a1d10" stroke-width="2"/>
  <path d="M38 66 L48 78 L58 66" fill="${coat}" stroke="#2a1d10" stroke-width="1.6"/><path d="M48 78 L48 96" stroke="#000" stroke-opacity=".3" stroke-width="2"/>
  <rect x="16" y="84" width="64" height="5" fill="${trim}">${shine(g.coat)}</rect><rect x="20" y="76" width="56" height="3.5" fill="${trim}" opacity=".85"/>
  ${ba>0?`<path d="M30 68 L34 96 M66 68 L62 96" stroke="#1d1d1d" stroke-width="5"/><rect x="31" y="80" width="6" height="4" rx="1" fill="${br>=4?'#ffcc33':'#9e9e9e'}"/><rect x="59" y="80" width="6" height="4" rx="1" fill="${br>=4?'#ffcc33':'#9e9e9e'}"/><circle cx="48" cy="86" r="4" fill="url(#${id}t)" stroke="#333"/>`:''}
  ${head}
  ${L.ear!=='frill'&&L.ear!=='crest'&&L.ear!=='spines'?ears(L,id):''}
  ${L.ear==='spines'?ears(L,id):''}
  <ellipse cx="48" cy="48" rx="19" ry="18" fill="url(#${id}f)" stroke="#2a1d10" stroke-width="1.8"/>
  ${L.mask?`<path d="M30 44 Q40 40 46 46 Q40 49 30 47Z M66 44 Q56 40 50 46 Q56 49 66 47Z" fill="${L.mask}" opacity=".85"/>`:''}
  <ellipse cx="34" cy="55" rx="3.5" ry="2" fill="#ff8a80" opacity=".35"/><ellipse cx="62" cy="55" rx="3.5" ry="2" fill="#ff8a80" opacity=".35"/>
  ${eyes(L,mood)}${snout(L,mood)}
  ${L.ear==='crest'?ears(L,id):''}
  <path d="M27 38 C27 16 69 16 69 38 Z" fill="url(#${id}h)" stroke="#1a120a" stroke-width="2"/>
  <path d="M19 39 Q48 31 77 39 Q80 44 75 44 Q48 37 21 44 Q16 44 19 39Z" fill="${hel}" stroke="#1a120a" stroke-width="1.6"/>
  <path d="M27 38 Q48 33 69 38" stroke="${ht}" stroke-width="2" fill="none"/>
  <path d="M48 18 L48 34" stroke="${ht}" stroke-opacity=".8" stroke-width="3"/>
  <ellipse cx="37" cy="25" rx="6" ry="3" fill="#fff" opacity=".5" transform="rotate(-25 37 25)"/>
  ${g.helmet>=2?`<path d="M43 26 h10 v7 l-5 3 l-5 -3z" fill="${ht}" stroke="#1a120a" stroke-width="1"/>`:''}
  ${g.helmet>=4?`<path d="M48 22 l1.6 3.2 3.6 .5 -2.6 2.5 .6 3.5 -3.2 -1.7 -3.2 1.7 .6 -3.5 -2.6 -2.5 3.6 -.5z" fill="#fff8d0">${shine(4)}</path>`:''}
  <rect x="22" y="92" width="18" height="4" rx="2" fill="${boot}"/><rect x="56" y="92" width="18" height="4" rx="2" fill="${boot}"/>
</svg>`; }

// Card portrait: SVG animal under the painted portrait (if present), with a role chip and gear-rarity pips.
export function avatarSVG(c, size=96, mood='happy'){
  const role=ROLES[c.role], br=bestR(c), el=isElite(c);
  const pips = size>=56 ? `<div class="gpips">${['helmet','coat','boots','ba'].map(k=>`<i style="background:${RARITY[c.gear[k]].color}"></i>`).join('')}</div>` : '';
  return `<div class="av r${br}" style="width:${size}px;height:${size}px">${animalSVG(c,size,mood)}<img src="${portraitURL(c.species,el)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">
    <span class="rchip" style="--rc:${role.color}">${role.icon}</span>${pips}</div>`; }
// a head-only SVG for 3D billboards
export function headSVG(c){ const s=animalSVG(c,128); return s.replace('viewBox="0 0 96 96"','viewBox="10 4 76 74"'); }
