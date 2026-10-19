// Crew portrait art: SVG drawn in code. Gear rarity changes colours, shine and trim.
import { ROLES, RARITY, SKIN_TONES, HAIR } from './data.js';
const HELMET = ['#f2c230','#ffd54f','#2f7fe0','#9b40c9','#ffc61a'];   // issue .. legendary
const COAT   = ['#b8954f','#d4b062','#2a62c4','#6f34a8','#d79a00'];
const TRIM   = ['#cfd8dc','#e8ff6a','#b3ffff','#ffd1ff','#fff59d'];
const BOOT   = ['#3b3b3b','#2b2b2b','#1c3f7a','#4a1f6e','#7a5200'];
let n=0;
export function avatarSVG(c, size=96){
  const id='a'+(n++), g=c.gear, role=ROLES[c.role], skin=SKIN_TONES[c.look.skin], hair=HAIR[c.look.hair];
  const hel=HELMET[g.helmet], coat=COAT[g.coat], trim=TRIM[g.coat], boot=BOOT[g.boots], ba=g.ba;
  const glow=RARITY[Math.max(g.helmet,g.coat,g.boots,g.ba)];
  const shine = t => t>=3 ? `<animate attributeName="opacity" values=".5;1;.5" dur="2s" repeatCount="indefinite"/>` : '';
  const hairPath = [`M33 44 q-2 -10 6 -14 M63 44 q2 -10 -6 -14`, `M32 46 q-3 -6 0 -12 M64 46 q3 -6 0 -12`, `M34 44 q0 -6 4 -8 M62 44 q0 -6 -4 -8`][c.look.hairStyle||0];
  return `<svg viewBox="0 0 96 96" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="${id}bg" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="${role.color}" stop-opacity=".95"/><stop offset="1" stop-color="#1b1f2a"/></radialGradient>
    <linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".35" stop-color="${hel}"/><stop offset="1" stop-color="${hel}" stop-opacity=".85"/></linearGradient>
    <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${coat}"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
    <linearGradient id="${id}t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa"/><stop offset=".5" stop-color="#eef"/><stop offset="1" stop-color="#9aa"/></linearGradient>
  </defs>
  <rect x="0" y="0" width="96" height="96" rx="18" fill="url(#${id}bg)"/>
  ${glow.bonus>=16?`<circle cx="48" cy="46" r="40" fill="${glow.color}" opacity=".18">${shine(3)}</circle>`:''}
  <!-- BA cylinder behind the shoulder -->
  ${ba>0?`<rect x="66" y="52" width="13" height="34" rx="6" fill="url(#${id}t)" stroke="#555" stroke-width="1"/><rect x="66" y="58" width="13" height="5" fill="${RARITY[ba].color}"/>`:''}
  <!-- coat / body -->
  <path d="M18 96 C18 72 28 62 48 62 C68 62 78 72 78 96 Z" fill="url(#${id}c)" stroke="#2a1d10" stroke-width="2"/>
  <path d="M48 62 L48 96" stroke="#000" stroke-opacity=".25" stroke-width="2"/>
  <rect x="20" y="80" width="56" height="5" fill="${trim}" opacity=".95">${shine(g.coat)}</rect>
  <rect x="24" y="71" width="48" height="4" fill="${trim}" opacity=".8"/>
  <path d="M40 62 L48 72 L56 62" fill="#ffffff" fill-opacity=".9"/>
  ${ba>0?`<path d="M60 70 q10 -6 12 -14" stroke="#333" stroke-width="3" fill="none"/>`:''}
  <!-- head -->
  <ellipse cx="48" cy="46" rx="15" ry="16" fill="${skin}" stroke="#3a2618" stroke-width="1.5"/>
  <path d="${hairPath}" stroke="${hair}" stroke-width="4" stroke-linecap="round" fill="none"/>
  <circle cx="42" cy="47" r="2.2" fill="#2a1d14"/><circle cx="54" cy="47" r="2.2" fill="#2a1d14"/>
  <circle cx="42.7" cy="46.3" r=".7" fill="#fff"/><circle cx="54.7" cy="46.3" r=".7" fill="#fff"/>
  <ellipse cx="39" cy="53" rx="3" ry="1.8" fill="#ff8a80" opacity=".45"/><ellipse cx="57" cy="53" rx="3" ry="1.8" fill="#ff8a80" opacity=".45"/>
  ${c.look.stache?`<path d="M41 55 q7 -4 14 0 q-7 2 -14 0z" fill="${hair}"/>`:''}
  <path d="M42 57 q6 5 12 0" stroke="#3a2618" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <!-- helmet -->
  <path d="M28 40 C28 22 68 22 68 40 Z" fill="url(#${id}h)" stroke="#2a1d10" stroke-width="2"/>
  <path d="M22 41 Q48 34 74 41 Q76 45 72 45 Q48 39 24 45 Q20 45 22 41Z" fill="${hel}" stroke="#2a1d10" stroke-width="1.6"/>
  <path d="M48 23 L48 38" stroke="#000" stroke-opacity=".2" stroke-width="3"/>
  <ellipse cx="38" cy="29" rx="6" ry="3" fill="#fff" opacity=".55" transform="rotate(-25 38 29)"/>
  ${g.helmet>=4?`<path d="M48 26 l2 4 4.5 .6 -3.3 3 .9 4.4 -4.1 -2.2 -4.1 2.2 .9 -4.4 -3.3 -3 4.5 -.6z" fill="#fff8d0">${shine(4)}</path>`:''}
  ${g.helmet>=2?`<rect x="36" y="38" width="24" height="3" rx="1.5" fill="${TRIM[g.helmet]}" opacity=".9"/>`:''}
  <!-- boots peek -->
  <rect x="26" y="90" width="16" height="6" rx="2" fill="${boot}"/><rect x="54" y="90" width="16" height="6" rx="2" fill="${boot}"/>
  ${g.boots>=2?`<rect x="26" y="90" width="16" height="2" fill="${RARITY[g.boots].color}"/><rect x="54" y="90" width="16" height="2" fill="${RARITY[g.boots].color}"/>`:''}
  <!-- role chip -->
  <circle cx="16" cy="16" r="11" fill="#fff" stroke="${role.color}" stroke-width="3"/>
  <text x="16" y="20.5" font-size="12" text-anchor="middle">${role.icon}</text>
</svg>`; }
