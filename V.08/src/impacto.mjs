import templates from './impacto-templates.mjs';
let sequence=0;
export function impactoSvg(unit,mini=false){
 const id=`impacto${++sequence}-`;
 let svg=templates[unit.id];
 if(!svg){svg=Object.values(templates).find(t=>unit.artAsset&&t.includes(unit.artAsset.split('/').at(-1)))??templates['01'].replace(/<g filter="url\(#[^)]+\)"><image[^>]+><\/g>/,'');}
 svg=svg.replaceAll('__ATK__',String(Number(unit.atk)||0)).replaceAll('__HP__',String(Number(unit.hp)||0));
 svg=svg.replace(/<text([^>]*)>([^<]+)<\/text>/g,(_,attrs,value)=>`<text${attrs.replace(/font-size="105"/,`font-size="${value.length>2?Math.max(28,170/value.length):value.length===2?80:105}"`)}>${value}</text>`);
 svg=svg.replace(/id="([^"]+)"/g,(_,n)=>`id="${id}${n}"`).replace(/url\(#([^)]+)\)/g,(_,n)=>`url(#${id}${n})`);
 if(mini){
  // Optical layout fits the board footprint; the full card remains in consultation.
  const art=svg.match(/<g filter="url\(#[^)]+\)">(<image[^>]+>)<\/g>/)?.[1]||'';
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 216 252" aria-hidden="true"><rect x="2" y="3" width="212" height="246" rx="12" fill="#123543" stroke="#9cc7be" stroke-width="4"/><svg x="0" y="32" width="216" height="220" viewBox="0 185 640 650">${art}</svg><path d="M3 3H82V57H3Z" fill="#ffcf53"/><path d="M134 3H213V57H134Z" fill="#f17c70"/><g font-family="Bungee" font-size="48" fill="#fff7dc" stroke="#25323b" stroke-width="2" paint-order="stroke" text-anchor="middle"><text x="42" y="46" font-size="${String(Number(unit.atk)||0).length>1?Math.max(16,70/String(Number(unit.atk)||0).length):48}">${Number(unit.atk)||0}</text><text x="174" y="46" font-size="${String(Number(unit.hp)||0).length>1?Math.max(16,70/String(Number(unit.hp)||0).length):48}">${Number(unit.hp)||0}</text></g></svg>`;
 }
 return svg.replace('<svg ','<svg aria-hidden="true" ');
}
