import test from 'node:test';
import assert from 'node:assert/strict';
import cards from '../data/cards.json' with { type: 'json' };
import mapping from '../data/sap-equivalencias.json' with { type: 'json' };

const rarity = ['', 'Comum', 'Incomum', 'Raro', 'Épico', 'Lendário', 'Mítico'];

test('50 correspondências SAP por ID, tier e raridade', () => {
  assert.equal(cards.length, 50); assert.equal(mapping.length, 50);
  for (let i = 0; i < cards.length; i++) {
    assert.equal(cards[i].id, mapping[i].id);
    assert.equal(cards[i].rank, mapping[i].sapTier);
    assert.equal(cards[i].rarity, rarity[cards[i].rank]);
    assert.equal(mapping[i].rarity, cards[i].rarity);
    assert.ok(mapping[i].sapEquivalent);
    assert.equal(cards[i].name, mapping[i].name);
  }
});

test('distribuição de raridades preservada: 10, 8, 8, 8, 8, 8', () => {
  for (let i = 1; i <= 6; i++)
    assert.equal(cards.filter(c => c.rank === i).length, i === 1 ? 10 : 8);
});

test('rótulos na UI estão corretos e o nome oficial está exibido', async () => {
  const {readFile} = await import('node:fs/promises');
  const ui = await readFile(new URL('../src/main.mjs',import.meta.url),'utf8');
  assert.match(ui,/const ranks = \['', 'COMUM', 'INCOMUM', 'RARO', 'ÉPICO', 'LENDÁRIO', 'MÍTICO'\]/);
  assert.match(ui, /DUCKS <small>N<\/small>/);
});
