import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,existsSync } from 'node:fs';
const get=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const main=get('../src/main.mjs'),css=get('../src/style.css');
test('V.10: todas as oito fases usam UI Tech Industrial',()=>{
 for(const marker of ['tech-hero','package-option','tech-offers','tech-placement','tech-battle','tech-results','collection-console','tech-detail']){
  assert.ok(main.includes(marker),'missing '+marker);
 }
});
test('os comandos da UI permanecem conectados',()=>{
 for(const action of ['start','package','pick','place','skip','show-result','next-round','restart','rules']){
  assert.ok(main.includes("action === '"+action+"'")||main.includes("data-action=\""+action+"\""),'action '+action);
 }
 assert.ok(main.includes("collectionFaction=factionButton.dataset.faction"));
 assert.ok(main.includes("collectionRank=Number(rarityButton.dataset.rarityFilter)"));
});
test('regras e acessibilidade essenciais',()=>{
 assert.match(main,/regras/i);
 assert.ok(main.includes("rulesDialog.showModal()"));
 assert.ok(main.includes("detail.showModal()"));
 assert.ok(main.includes("role=\"button\" tabindex=\"0\""));
 assert.ok(css.includes("prefers-reduced-motion"));
});
test('background do hangar e classes do sistema visual',()=>{
 assert.ok(existsSync(new URL('../assets/tech-hangar.svg',import.meta.url)));
 for(const className of ['.tech-hero','.tech-offers','.tech-territories','.tech-battle','.tech-results','.collection-stage','.tech-detail']){
  assert.ok(css.includes(className),className);
 }
});
