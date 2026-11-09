import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, buyCard, finishShopTurn, currentCard, placeCard, resolveTerritory, resolveBattle, applyRoundResult, nextRound } from '../src/engine.mjs';
import cards from '../data/cards.json' with { type: 'json' };
import decks from '../data/baralhos-iniciais.json' with { type: 'json' };
import config from '../data/config-prototipo.json' with { type: 'json' };
import { createEffectBus } from '../src/effects.mjs';

const byId = Object.fromEntries(cards.map(card => [card.id, card]));
const fixed = () => 0;
const pair = (a, b) => [[{ id: a, instanceId: 1 }], [{ id: b, instanceId: 2 }]];

test('compra aumenta permanentemente o baralho e gasta moedas', () => {
  const game = createGame(cards, decks, config, fixed);
  const before = game.players[0].deck.length;
  assert.equal(buyCard(game, 0, byId), true);
  assert.equal(game.players[0].deck.length, before + 1);
  assert.equal(game.players[0].coins, 2);
  finishShopTurn(game, cards, config, fixed);
  finishShopTurn(game, cards, config, fixed);
  assert.equal(game.queues[0].length, before + 1);
});

test('posicionamento alterna e preserva ordem e visibilidade', () => {
  const game = createGame(cards, decks, config, fixed);
  finishShopTurn(game, cards, config, fixed);
  finishShopTurn(game, cards, config, fixed);
  assert.equal(game.turn, 0);
  const first = currentCard(game).id;
  assert.equal(placeCard(game, 'A'), true);
  assert.equal(game.turn, 1);
  assert.equal(game.placements.A[0][0].id, first);
  placeCard(game, 'A');
  assert.equal(game.turn, 0);
  const second = currentCard(game).id;
  placeCard(game, 'A');
  assert.deepEqual(game.placements.A[0].map(c => c.id), [first, second]);
  assert.equal(placeCard(game, 'D'), false);
});

test('ataques simultâneos produzem morte simultânea', () => {
  const result = resolveTerritory('A', pair('batedor', 'batedor'), byId);
  assert.equal(result.winner, null);
  assert.equal(result.events[0].left.hp, 0);
  assert.equal(result.events[0].right.hp, 0);
});

test('sobrevivente mantém HP ao enfrentar próximo adversário', () => {
  const sides = [[{ id: 'paladino' }], [{ id: 'goblin' }, { id: 'goblin' }]];
  const result = resolveTerritory('B', sides, byId);
  assert.equal(result.winner, 0);
  assert.equal(result.events[0].left.hp, 5);
  assert.equal(result.events[1].left.hp, 3);
  assert.equal(result.survivors[0][0].hp, 3);
});

test('territórios vazios e sem sobreviventes empatam', () => {
  assert.equal(resolveTerritory('A', [[], []], byId).winner, null);
  assert.equal(resolveTerritory('A', [[{ id: 'recruta' }], []], byId).winner, 0);
  assert.equal(resolveTerritory('A', [[], [{ id: 'recruta' }]], byId).winner, 1);
});

test('barramento aceita múltiplos manipuladores sem habilitar habilidades', () => {
  const effects = createEffectBus();
  const observed = [];
  effects.register('duringBattle', () => observed.push('battle-1'));
  effects.register('duringBattle', () => observed.push('battle-2'));
  effects.register('onDamage', ({ player }) => observed.push(`damage-${player}`));
  effects.register('onDeath', ({ player }) => observed.push(`death-${player}`));
  resolveTerritory('A', pair('batedor', 'batedor'), byId, effects);
  assert.deepEqual(observed, ['battle-1', 'battle-2', 'damage-0', 'damage-1', 'death-0', 'death-1']);
});

test('placares 1x0, 1x1 e 0x0', () => {
  const cases = [
    { lands: { A: pair('paladino', 'goblin'), B: [[], []], C: [[], []] }, wins: [1, 0], winner: 0 },
    { lands: { A: pair('paladino', 'goblin'), B: pair('goblin', 'paladino'), C: [[], []] }, wins: [1, 1], winner: null },
    { lands: { A: [[], []], B: [[], []], C: [[], []] }, wins: [0, 0], winner: null },
  ];
  for (const item of cases) {
    const game = createGame(cards, decks, config, fixed);
    game.phase = 'battle'; game.placements = item.lands;
    const battle = resolveBattle(game, byId);
    assert.deepEqual(battle.wins, item.wins);
    assert.equal(battle.winner, item.winner);
  }
});

test('medalha, vida e empate sem mudança', () => {
  const game = createGame(cards, decks, config, fixed);
  game.phase = 'battle'; game.placements = { A: pair('paladino', 'goblin'), B: [[], []], C: [[], []] };
  resolveBattle(game, byId); applyRoundResult(game, config);
  assert.equal(game.players[0].medals, 1);
  assert.equal(game.players[1].lives, 2);
  nextRound(game, cards, config, fixed);
  assert.equal(game.round, 2);
  finishShopTurn(game, cards, config, fixed); finishShopTurn(game, cards, config, fixed);
  assert.equal(game.turn, 1);
  game.phase = 'battle'; game.placements = { A: [[], []], B: [[], []], C: [[], []] };
  resolveBattle(game, byId); applyRoundResult(game, config);
  assert.equal(game.players[0].medals, 1);
  assert.equal(game.players[1].lives, 2);
});

test('sete medalhas encerram a partida', () => {
  const game = createGame(cards, decks, config, fixed);
  game.players[0].medals = 6;
  game.phase = 'battle'; game.battle = { winner: 0, wins: [1, 0], territories: [] };
  applyRoundResult(game, config);
  assert.equal(game.phase, 'gameover');
  assert.equal(game.champion, 0);
  assert.equal(game.players[0].medals, 7);
});

test('três derrotas encerram a partida', () => {
  const game = createGame(cards, decks, config, fixed);
  game.players[1].lives = 1;
  game.phase = 'battle'; game.battle = { winner: 0, wins: [1, 0], territories: [] };
  applyRoundResult(game, config);
  assert.equal(game.phase, 'gameover');
  assert.equal(game.players[1].lives, 0);
});

test('partida completa, do início ao fim', () => {
  const game = createGame(cards, decks, config, fixed);
  for (let round = 0; round < 3; round++) {
    finishShopTurn(game, cards, config, fixed);
    finishShopTurn(game, cards, config, fixed);
    while (game.phase === 'placement') {
      const id = currentCard(game).id;
      // O Jogador X concentra cartas em A; Y divide as cartas entre B e C.
      placeCard(game, game.turn === 0 ? 'A' : id === 'recruta' ? 'B' : 'C');
    }
    assert.equal(game.phase, 'battle');
    resolveBattle(game, byId);
    applyRoundResult(game, config);
    if (game.phase === 'gameover') break;
    nextRound(game, cards, config, fixed);
  }
  assert.equal(game.phase, 'gameover');
  assert.ok(game.champion !== null);
});
