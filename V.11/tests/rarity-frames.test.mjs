import test from 'node:test';
import assert from 'node:assert/strict';
import cards from '../data/cards.json' with { type: 'json' };
import {rarityRank,rarityFrameSvg,miniRarityFrame,RARITY_LEVELS} from '../src/rarity-frames.mjs';
import {impactoSvg} from '../src/impacto.mjs';
const expected=['Comum','Incomum','Raro','Épico','Lendário','Mítico'];
test('seis níveis de raridade permanecem na sequência acordada',()=>assert.deepEqual(RARITY_LEVELS,expected));
test('todos os 50 personagens usam raridade do catálogo',()=>{
 assert.equal(cards.length,50);
 for(const c of cards){
  assert.equal(rarityRank(c),c.rank);
  assert.match(impactoSvg(c),new RegExp('data-rarity-tier="'+c.rank+'"'));
  assert.match(impactoSvg(c,true),new RegExp('data-rarity-mini="'+c.rank+'"'));
 }
});
test('molduras compartilham exatamente os mesmos eixos e geometria estrutural',()=>{
 const rails=['M106 139 529 123 550 819 102 842Z','M115 155 518 140 538 808 113 826Z'];
 for(let rank=1;rank<=6;rank++){
  const svg=rarityFrameSvg({rank});
  for(const path of rails)assert.ok(svg.includes(path),rank+': '+path);
  assert.equal((svg.match(/data-rarity-tier=/g)||[]).length,1);
  assert.equal((miniRarityFrame({rank}).match(/data-rarity-mini=/g)||[]).length,1);
 }
});
test('emblemas seguem estrela/estrela/estrela/coroa/coroa/coroa',()=>{
 for(let rank=1;rank<=6;rank++){
  const svg=rarityFrameSvg({rank});
  assert.equal(svg.includes('translate(320 95)'),rank>=4);

  assert.ok(!svg.includes('<text'));
 }
});
test('faces preservam os dois números, mesmo com buffs e dano',()=>{
 for(const c of cards){
  for(const mini of [false,true]){
   const svg=impactoSvg({...c,atk:123,hp:0},mini);
   assert.deepEqual([...svg.matchAll(/<text[^>]*>([^<]+)<\/text>/g)].map(m=>m[1]),['123','0']);
  }
 }
});
