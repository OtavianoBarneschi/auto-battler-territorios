import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  createGame, createUnit, buyCard, finishShopTurn, currentCard, placeCard,
  resolveTerritory, resolveBattle, applyRoundResult, nextRound,
} from '../src/engine.mjs';
import cards from '../data/cards.json' with { type: 'json' };
import skills from '../data/skills.json' with { type: 'json' };
import decks from '../data/baralhos-iniciais.json' with { type: 'json' };
import config from '../data/config-prototipo.json' with { type: 'json' };

const byId = Object.fromEntries(cards.map(card => [card.id, card]));
const fixed = () => 0;
const mock = (id, atk, hp) => ({ id, name: id, atk, hp, rank: 0, artAsset: '', skillId: null });
const mockById = { ...byId, x: mock('x', 5, 5), y: mock('y', 1, 1), tie: mock('tie', 2, 2) };
const pair = (a, b) => [[{ id: a }], [{ id: b }]];

test('catálogo contém 50 cartas, 50 artes e distribuição correta', () => {
  assert.equal(cards.length, 50);
  assert.equal(new Set(cards.map(card => card.id)).size, 50);
  assert.equal(Object.keys(skills).filter(id => id.startsWith('skill_')).length, 50);
  assert.deepEqual(cards.map(card => card.id), Array.from({ length: 50 }, (_, i) => String(i + 1).padStart(2, '0')));
  for (const card of cards) {
    assert.ok(card.name && card.skillDescription && skills[card.skillId]);
    assert.ok(Number.isInteger(card.atk) && Number.isInteger(card.hp) && card.atk > 0 && card.hp > 0);
    assert.ok(existsSync(new URL(`../${card.artAsset}`, import.meta.url)), card.artAsset);
    assert.doesNotMatch(card.skillDescription.toLowerCase(), /ouro|dinheiro|compra|venda|moeda/);
  }
  for (let rank = 1; rank <= 6; rank++) {
    const expected = rank === 1 ? 5 : 4;
    assert.equal(cards.filter(card => card.rank === rank && Number(card.id) <= 25).length, expected);
    assert.equal(cards.filter(card => card.rank === rank && Number(card.id) > 25).length, expected);
  }
});

test('atributos enviados foram preservados nos extremos e casos especiais', () => {
  assert.deepEqual([byId['01'].rank, byId['01'].atk, byId['01'].hp], [1, 2, 2]);
  assert.deepEqual([byId['28'].rank, byId['28'].atk, byId['28'].hp], [5, 2, 2]);
  assert.deepEqual([byId['37'].rank, byId['37'].atk, byId['37'].hp], [6, 4, 12]);
  assert.deepEqual([byId['50'].rank, byId['50'].atk, byId['50'].hp], [6, 10, 6]);
});

test('compra, posicionamento alternado e habilidade ao posicionar', () => {
  const game = createGame(cards, decks, config, fixed);
  const initial = game.players[0].deck.length;
  game.offers = ['01'];
  assert.equal(buyCard(game, 0, byId), true);
  assert.equal(game.players[0].deck.length, initial + 1);
  assert.equal(game.players[0].coins, 2);
  finishShopTurn(game, cards, config, fixed);
  finishShopTurn(game, cards, config, fixed);
  assert.equal(game.turn, 0);
  const first = currentCard(game).id;
  assert.equal(placeCard(game, 'A', byId, skills, fixed), true);
  assert.equal(game.placements.A[0][0].id, first);
  assert.equal(game.turn, 1);
  assert.equal(placeCard(game, 'D', byId, skills, fixed), false);
});

test('posição posterior ativa habilidades de posicionamento já presentes', () => {
  const game = createGame(cards, decks, config, fixed);
  game.phase = 'placement'; game.turn = 0;
  game.queues = [['01'], []];
  game.placements.A[0] = [createUnit(byId['12'], 0, 1), createUnit(byId['24'], 0, 2), createUnit(byId['31'], 0, 3)];
  placeCard(game, 'A', byId, skills, fixed);
  const [chef, thief, washer, placed] = game.placements.A[0];
  assert.equal(chef.atk, 2);
  assert.equal(thief.atk, 5); assert.equal(thief.hp, 3);
  assert.equal(washer.atk, 4); assert.equal(washer.hp, 4);
  assert.equal(placed.atk, 3);
});

test('ataques são simultâneos e melhorias de batalha não alteram baralho ou posicionamento', () => {
  const before = createUnit(byId['50'], 0, 1);
  const result = resolveTerritory('A', [[before], [createUnit(byId['50'], 1, 2)]], byId, skills, fixed);
  assert.equal(result.events.filter(event => event.type === 'strike').length, 1);
  assert.equal(result.winner, null);
  assert.equal(before.atk, 10);
  assert.equal(byId['50'].atk, 10);
});

test('zonas vazias, morte simultânea e invocações', () => {
  assert.equal(resolveTerritory('A', [[], []], mockById, skills, fixed).winner, null);
  assert.equal(resolveTerritory('A', pair('x', 'tie'), mockById, skills, fixed).winner, 0);
  assert.equal(resolveTerritory('A', pair('tie', 'tie'), mockById, skills, fixed).winner, null);
  const sides = [
    [createUnit(byId['22'], 0, 1, { atk: 2, hp: 1, maxHp: 1 })],
    [createUnit(byId['27'], 1, 2, { atk: 2, hp: 1, maxHp: 1 })],
  ];
  const result = resolveTerritory('A', sides, byId, skills, fixed);
  assert.ok(result.events.some(event => event.type === 'summon' && event.actor === 'Isca de Pato'));
  assert.ok(result.events.some(event => event.type === 'summon' && event.actor === 'Mini Torradeira'));
  assert.ok(result.events.length < 100);
});

test('Zona B desempata apenas quantidades iguais de zonas', () => {
  const cases = [
    { A: pair('x', 'y'), B: pair('y', 'x'), C: pair('tie', 'tie'), wins: [1, 1], winner: 1, tiebreak: true },
    { A: pair('x', 'y'), B: pair('tie', 'tie'), C: pair('y', 'x'), wins: [1, 1], winner: null, tiebreak: false },
    { A: pair('x', 'y'), B: pair('y', 'x'), C: pair('x', 'y'), wins: [2, 1], winner: 0, tiebreak: false },
    { A: pair('tie', 'tie'), B: pair('x', 'y'), C: pair('tie', 'tie'), wins: [1, 0], winner: 0, tiebreak: false },
    { A: [[], []], B: [[], []], C: [[], []], wins: [0, 0], winner: null, tiebreak: false },
  ];
  for (const item of cases) {
    const game = createGame(cards, decks, config, fixed);
    game.phase = 'battle'; game.placements = { A: item.A, B: item.B, C: item.C };
    const battle = resolveBattle(game, mockById, skills, fixed);
    assert.deepEqual(battle.wins, item.wins);
    assert.equal(battle.winner, item.winner);
    assert.equal(battle.tiebreak, item.tiebreak);
  }
});

test('habilidades não atravessam zonas', () => {
  const game = createGame(cards, decks, config, fixed);
  game.phase = 'battle';
  game.placements = { A: [[{ id: '07' }], []], B: [[], [{ id: 'y' }]], C: [[], []] };
  const result = resolveBattle(game, mockById, skills, fixed);
  assert.equal(result.territories[1].survivors[1][0].hp, 1);
  assert.equal(result.territories[0].winner, 0);
  assert.equal(result.territories[1].winner, 1);
});

test('progressão soma medalha, subtrai vida e preserva empate', () => {
  const game = createGame(cards, decks, config, fixed);
  game.phase = 'battle';
  game.battle = { winner: 0, territories: [], wins: [1, 1], tiebreak: true };
  applyRoundResult(game, config);
  assert.equal(game.players[0].medals, 1);
  assert.equal(game.players[1].lives, 2);
  nextRound(game, cards, config, fixed);
  game.phase = 'battle';
  game.battle = { winner: null, territories: [], wins: [0, 0], tiebreak: false };
  applyRoundResult(game, config);
  assert.equal(game.players[0].medals, 1);
  assert.equal(game.players[1].lives, 2);
});

test('sete medalhas ou terceira derrota encerram partida', () => {
  const game = createGame(cards, decks, config, fixed);
  game.players[0].medals = 6;
  game.phase = 'battle'; game.battle = { winner: 0, territories: [], wins: [1, 0], tiebreak: false };
  applyRoundResult(game, config);
  assert.equal(game.phase, 'gameover');
  assert.equal(game.champion, 0);
  const other = createGame(cards, decks, config, fixed);
  other.players[1].lives = 1;
  other.phase = 'battle'; other.battle = { winner: 0, territories: [], wins: [1, 0], tiebreak: false };
  applyRoundResult(other, config);
  assert.equal(other.phase, 'gameover');
  assert.equal(other.players[1].lives, 0);
});

test('simulação com 50 cartas por jogador termina sem ciclo infinito', () => {
  const game = createGame(cards, decks, config, () => .37);
  game.players[0].deck = cards.map(card => card.id);
  game.players[1].deck = cards.map(card => card.id);
  finishShopTurn(game, cards, config, () => .37);
  finishShopTurn(game, cards, config, () => .37);
  let index = 0;
  while (game.phase === 'placement') {
    placeCard(game, ['A', 'B', 'C'][index++ % 3], byId, skills, () => .37);
  }
  const battle = resolveBattle(game, byId, skills, () => .37);
  assert.equal(index, 100);
  assert.ok(battle.events.length < 2000);
  assert.equal(battle.territories.length, 3);
});
