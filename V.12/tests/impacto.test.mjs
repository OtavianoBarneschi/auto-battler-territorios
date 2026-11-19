import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,existsSync} from 'node:fs';import {createHash} from 'node:crypto';import templates from '../src/impacto-templates.mjs';import {impactoSvg} from '../src/impacto.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url));const canonical=(f,b)=>f.endsWith('.json')?Buffer.from(JSON.stringify(JSON.parse(b))):b;const cards=JSON.parse(read('../data/cards.json'));
test('50 artes e todos os dados preservados da versão publicada',()=>{for(const f of ['data/cards.json','data/skills.json','data/baralhos-iniciais.json',...cards.map(c=>c.artAsset)])assert.equal(createHash('sha256').update(canonical(f,read('../'+f))).digest('hex'),createHash('sha256').update(canonical(f,read('../../V.05/'+f))).digest('hex'),f)});
test('motor de combate idêntico à versão anterior',()=>{const now=read('../src/engine.mjs').toString(),old=read('../../V.10/src/engine.mjs').toString();const marker='function createBattleContext(',end='export function nextRound(';assert.equal(now.slice(now.indexOf(marker),now.indexOf(end)),old.slice(old.indexOf(marker),old.indexOf(end)));});
test('V.12 preserva motor, efeitos, dados, molduras, templates e artes da V.11', () => {
  const engine = read('../src/engine.mjs').toString().replace("VERSION = 'V.12'", "VERSION = 'V.11'");
  assert.equal(engine, read('../../V.11/src/engine.mjs').toString());
  for (const file of ['src/effects.mjs', 'src/impacto-templates.mjs', 'src/rarity-frames.mjs',
    'data/config.json', 'data/cards.json', 'data/skills.json', 'data/baralhos-iniciais.json',
    ...cards.map(card => card.artAsset)]) {
    assert.deepEqual(canonical(file, read('../' + file)), canonical(file, read('../../V.11/' + file)), file);
  }
});
test('50 faces: só dois números; caminhos de todas as imagens existem',()=>{assert.equal(Object.keys(templates).length,50);for(const c of cards){for(const mini of [false,true]){const svg=impactoSvg(c,mini);assert.deepEqual([...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m=>m[1]),[String(c.atk),String(c.hp)]);assert.ok(!svg.includes(c.skillDescription));for(const m of svg.matchAll(/xlink:href="([^"]+)"/g))assert.ok(existsSync(new URL('../'+m[1],import.meta.url)),m[1]);}}});
test('buffs, dano e números com múltiplos dígitos usam valores atuais',()=>{for(const mini of [false,true]){const svg=impactoSvg({...cards[0],atk:123,hp:0},mini);assert.match(svg,/>123<\/text>/);assert.match(svg,/>0<\/text>/);}});
test('IDs de máscara são únicos por instância e invocações não usam arte alheia',()=>{assert.notEqual(impactoSvg(cards[0]),impactoSvg(cards[0]));const svg=impactoSvg({id:'summoned',atk:1,hp:1});assert.ok(!svg.includes('01_pato'));});
