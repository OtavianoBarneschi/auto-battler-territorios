// Ducks n Robots — Impacto / Rarity system V.09
// Structural anchors are invariant across tiers. Only finishes and badges change.
export const RARITY_LEVELS = Object.freeze(['Comum','Incomum','Raro','Épico','Lendário','Mítico']);
const FINISHES = Object.freeze([
  {name:'bronze', dark:'#693729', body:'#a86343', light:'#f5b98e', inner:'#e5a476', gem:'#a95a3a', glow:'#f2a16f'},
  {name:'silver', dark:'#576174', body:'#a6b2c6', light:'#f8fbff', inner:'#d8e3f0', gem:'#9db5e3', glow:'#bfd5fc'},
  {name:'gold', dark:'#83500e', body:'#d99d27', light:'#fff0a6', inner:'#f8c94e', gem:'#f6b32c', glow:'#f5d16c'},
  {name:'royal-silver', dark:'#44556d', body:'#b9c8e4', light:'#f8faff', inner:'#e9edff', gem:'#8ca8d5', glow:'#c4ccff'},
  {name:'royal-gold', dark:'#754007', body:'#e7a827', light:'#fff6a0', inner:'#f5cf5b', gem:'#ed4459', glow:'#ffc34c'},
  {name:'diamond', dark:'#454c9c', body:'#a5b5ff', light:'#ffffff', inner:'#98f5ff', gem:'#70e9ff', glow:'#9e7bff'},
]);
const clampRank = v => { const n=Number(v); return Number.isInteger(n)&&n>=1&&n<=6?n:1; };
export function rarityRank(unit){
 const n=Number(unit?.rank);
 if(Number.isInteger(n)&&n>=1&&n<=6)return n;
 const idx=RARITY_LEVELS.findIndex(label=>label.toLowerCase()===(unit?.rarity||'').toLowerCase());
 return idx<0?1:idx+1;
}
function starPath(cx,cy,outer,inner,points=5){
 let d=''; for(let i=0;i<points*2;i++){const r=i%2?inner:outer; const t=i*Math.PI/points-Math.PI/2; const x=(cx+Math.cos(t)*r).toFixed(2),y=(cy+Math.sin(t)*r).toFixed(2);d+=(i?'L':'M')+x+' '+y+' ';}return d+'Z';
}
function star(x,y,r){const d=starPath(x,y,r,r*.48);return `<g><path d="${d}" fill="url(#rrBadge)" stroke="#172435" stroke-width="5" stroke-linejoin="round"/><path d="${starPath(x-2,y-3,r*.70,r*.33)}" fill="url(#rrLight)" opacity=".8"/><circle cx="${x}" cy="${y}" r="4.5" fill="#fffbea" opacity=".86"/></g>`;}
function crown(){return `<g transform="translate(320 95)"><path d="M-76 -13 -56 30H56L76 -13 34 -2 16 -43 0 -8 -16 -43 -34 -2Z" fill="url(#rrBadge)" stroke="#1b293b" stroke-width="6" stroke-linejoin="round"/><path d="M-62 22H62L58 39H-58Z" fill="url(#rrMetal)" stroke="#1b293b" stroke-width="5" stroke-linejoin="round"/><path d="M-66 -9 -52 22 -29 8 -12 17 0 -1 12 17 29 8 52 22 66 -9" fill="none" stroke="url(#rrLight)" stroke-width="5" opacity=".85"/><path d="M0 -12 16 6 0 25 -16 6Z" fill="url(#rrGem)" stroke="#fff8dc" stroke-width="2.5"/><circle cx="-36" cy="10" r="5" fill="#fff8e7"/><circle cx="36" cy="10" r="5" fill="#fff8e7"/></g>`;}
function emblem(rank){if(rank<=3){const positions=rank===1?[320]:rank===2?[291,349]:[270,320,370];const r=rank===1?33:rank===2?29:26;return positions.map(x=>star(x,94,r)).join('');}return crown();}
function cornerDecor(rank){if(rank<=2)return '';const gem=rank>=5?`<path d="M320 808l21 22-21 21-21-21Z" fill="url(#rrGem)" stroke="url(#rrLight)" stroke-width="4"/>`:'';
 const swirls=rank>=4?`<path d="M124 756q-23-23-17-49m401 49q23-23 17-49M125 219q-22 21-19 50m401-50q22 21 19 50" stroke="url(#rrLight)" stroke-width="7" stroke-linecap="round" fill="none" opacity=".92"/>`:'';
 const slivers=rank>=3?`<path d="M113 330l-13 24 13 25m418-49 13 24-13 25" fill="url(#rrGem)" stroke="url(#rrLight)" stroke-width="4"/>`:'';
 const crystals=rank===6?`<path d="M112 498l-15 29 15 29 14-29Z M528 498l-14 29 14 29 15-29Z" fill="url(#rrGem)" stroke="#f6ffff" stroke-width="3"/><path d="M104 815 141 847 175 835M536 815 499 847 465 835" fill="none" stroke="#e2e1ff" stroke-width="8" opacity=".8"/>`:'';
 return `<g>${slivers}${swirls}${gem}${crystals}</g>`;
}
// All tiers have the same 640x960 canvas, central axis x=320 and exact rail geometry.
export function rarityFrameSvg(unit){
 const rank=rarityRank(unit), c=FINISHES[rank-1];
 const outline='M106 139 529 123 550 819 102 842Z';
 const front='M115 155 518 140 538 808 113 826Z';
 const extras=rank>=5?`<path d="M116 160 520 145 536 803 114 822Z" fill="none" stroke="url(#rrLight)" stroke-width="2.8" stroke-dasharray="6 18" opacity=".68"/>`:'';
 const glow=rank===6?`<path d="${outline}" fill="none" stroke="${c.glow}" opacity=".35" stroke-width="27" filter="url(#rrGlow)"/>`:'';
 return `<g data-rarity-tier="${rank}" data-rarity-finish="${c.name}">
 <defs><linearGradient id="rrMetal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c.dark}"/><stop offset=".30" stop-color="${c.light}"/><stop offset=".62" stop-color="${c.body}"/><stop offset="1" stop-color="${c.dark}"/></linearGradient><linearGradient id="rrLight" x1="0" y1="1" x2="1" y2="0"><stop stop-color="${c.inner}"/><stop offset=".5" stop-color="${c.light}"/><stop offset="1" stop-color="${c.body}"/></linearGradient><linearGradient id="rrBadge" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c.light}"/><stop offset=".55" stop-color="${c.body}"/><stop offset="1" stop-color="${c.dark}"/></linearGradient><linearGradient id="rrGem" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff"/><stop offset=".28" stop-color="${c.gem}"/><stop offset="1" stop-color="${c.dark}"/></linearGradient><filter id="rrGlow" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="9"/></filter></defs>
 ${glow}<path d="${outline}" fill="none" stroke="#112331" stroke-width="32" stroke-linejoin="round"/>
 <path d="${outline}" fill="none" stroke="url(#rrMetal)" stroke-width="22" stroke-linejoin="round"/>
 <path d="${front}" fill="none" stroke="url(#rrLight)" stroke-width="5.5" stroke-linejoin="round"/>
 <path d="M116 210 118 758M521 205 535 749M170 831 471 814" fill="none" stroke="${c.light}" opacity=".62" stroke-width="3.5"/>
 <path d="M109 779 146 819 191 829M530 762 503 813 459 824" fill="none" stroke="${c.dark}" stroke-width="10" stroke-linecap="round"/>
 ${cornerDecor(rank)}${extras}
 <g fill="${c.dark}" stroke="url(#rrLight)" stroke-width="5"><path d="M113 771 145 806 133 838 94 831 91 795Z"/><path d="M528 765 505 805 509 831 548 818 548 788Z"/></g>
 <g fill="#ecf4f9" opacity=".85"><circle cx="110" cy="808" r="6"/><circle cx="531" cy="806" r="6"/></g>
 <path d="M269 829 293 809 349 809 372 825 348 843 293 843Z" fill="url(#rrMetal)" stroke="${c.dark}" stroke-width="5"/>
 <path d="M220 136 239 118 400 113 422 132 401 146 239 150Z" fill="url(#rrMetal)" stroke="${c.dark}" stroke-width="5"/>
 ${emblem(rank)}</g>`;
}
export function miniRarityFrame(unit){
 const rank=rarityRank(unit),c=FINISHES[rank-1];
 let icon=rank<=3?(rank===1?[0]:rank===2?[-8,8]:[-12,0,12]).map(x=>`<path d="${starPath(108+x,23,rank===3?6:7,rank===3?2.9:3.3)}" fill="${c.light}" stroke="#233142" stroke-width="1.5"/>`).join(''):`<path d="M91 17 96 31 120 31 125 17 117 22 112 12 108 21 104 12 99 22Z" fill="${c.light}" stroke="#233142" stroke-width="2"/>`;
 return `<g data-rarity-mini="${rank}"><rect x="4" y="4" width="208" height="244" rx="11" fill="none" stroke="${c.dark}" stroke-width="9"/><rect x="6" y="6" width="204" height="240" rx="10" fill="none" stroke="${c.light}" stroke-width="4"/><path d="M6 61V206M210 61V206" stroke="${c.body}" stroke-width="8"/>${rank===6?`<path d="M9 73V191M207 73V191" stroke="#71f5ff" stroke-width="2"/>`:''}${icon}</g>`;
}
