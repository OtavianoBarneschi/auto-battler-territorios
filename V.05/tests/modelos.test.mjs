import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { MODELS, SAMPLE_IDS, cardMarkup } from '../src/modelos.mjs';
const read = path => readFileSync(new URL(path, import.meta.url));
const cards = JSON.parse(read('../data/cards.json'));
const skills = JSON.parse(read('../data/skills.json'));
test('catálogo, habilidades e todas as ilustrações preservados byte a byte da V.04', () => {
  for (const file of ['data/cards.json', 'data/skills.json', ...cards.map(c => c.artAsset)]) {
    const hash = content => createHash('sha256').update(content).digest('hex');
    assert.equal(hash(read('../' + file)), hash(read('../../V.04/' + file)), file);
  }
});
test('cinco propostas usam os mesmos dois personagens, números e regra original', () => {
  assert.deepEqual(MODELS.map(m => m.id), ['A','B','C','D','E']);
  assert.deepEqual(SAMPLE_IDS, ['07','49']);
  for (const model of MODELS) for (const id of SAMPLE_IDS) {
    const card = cards.find(c => c.id === id);
    const html = cardMarkup(card, model.id, skills[card.skillId]);
    for (const content of [card.artAsset, card.name, card.skillDescription, card.rarity, `Ataque ${card.atk}`, `Vida ${card.hp}`, `Rank ${card.rank}`]) assert.ok(html.includes(content), content);
    assert.ok(html.includes(`data-detail="${id}"`));
  }
});
test('motor preservado exceto identificador de versão; cartas do jogo sem redesign', () => {
  assert.equal(read('../src/engine.mjs').toString().replace("'V.05'", "'V.04'"), read('../../V.04/src/engine.mjs').toString());
  const extract = source => source.toString().split('function cardView')[1].split('function miniCard')[0];
  assert.equal(extract(read('../src/main.mjs')), extract(read('../../V.04/src/main.mjs')));
});
