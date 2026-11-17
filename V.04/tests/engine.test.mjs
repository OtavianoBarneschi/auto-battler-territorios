import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { BENCH_CAPACITY, createGame, createUnit, randomOffers, draftOptions, choosePackage,
  chooseCard, botDraft, botZone, currentCard, placeCard, resolveBattle, applyRoundResult,
  nextRound, emptyPlacements, startPlacement } from '../src/engine.mjs';
import cards from '../data/cards.json' with { type: 'json' };
import skills from '../data/skills.json' with { type: 'json' };
import decks from '../data/baralhos-iniciais.json' with { type: 'json' };
import config from '../data/config.json' with { type: 'json' };

const byId = Object.fromEntries(cards.map(card => [card.id, card]));
const fixed = () => 0;
const game = () => createGame(cards, decks, config, fixed);
const unit = (id, player, instanceId, atk = 0, hp = 1, summoned = false) =>
  createUnit({ id, name: id, atk, hp, artAsset: '', skillId: null }, player, instanceId, { summoned });

test('50 cartas preservadas, CSV e artes corretos', () => {
  const baseline = JSON.parse(readFileSync(new URL('../data/baseline-v03-sha256.json', import.meta.url), 'utf8'));
  const rows = readFileSync(new URL('../data/equivalencias.csv', import.meta.url), 'utf8').replace(/^\uFEFF/, '').trim().split(/\r?\n/).slice(1);
  assert.equal(cards.length, 50); assert.equal(rows.length, 50);
  assert.equal(new Set(cards.map(c => c.id)).size, 50);
  for (let i = 0; i < 50; i++) {
    const [id, name, , tier, , rarity] = rows[i].split(';');
    const card = cards[i];
    assert.deepEqual([card.id, card.name, card.rank, card.rarity], [id, name, Number(tier), rarity]);
    const values = ['id', 'name', 'atk', 'hp', 'skillId', 'skillDescription', 'artAsset'].map(key => card[key]);
    assert.equal(createHash('sha256').update(JSON.stringify(values)).digest('hex'), baseline[card.id]);
    assert.ok(existsSync(new URL(`../${card.artAsset}`, import.meta.url)));
    assert.ok(skills[card.skillId]); assert.equal('cost' in card, false);
  }
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(rank => cards.filter(c => c.rank === rank).length), [10, 8, 8, 8, 8, 8]);
});

test('pacotes, cinco ofertas únicas, duplicatas e persistência', () => {
  assert.deepEqual(config.draft.map(o => o.map(({ count, rank }) => [count, rank])), [
    [[2, 1], [1, 2]], [[3, 1], [2, 2], [1, 3]], [[3, 2], [2, 3], [1, 4]],
    [[3, 3], [2, 4], [1, 5]], [[3, 4], [2, 5], [1, 6]], [[3, 5], [2, 6]], [[3, null]],
  ]);
  const state = game();
  assert.equal(state.players[0].deck.length, 9);
  assert.deepEqual(state.players[0].deck, state.players[1].deck);
  assert.ok(state.players[0].deck.every(id => byId[id].rank === 1));
  choosePackage(state, 0, cards, config, fixed);
  assert.equal(state.offers.length, 5); assert.equal(new Set(state.offers).size, 5);
  assert.ok(state.offers.every(id => byId[id].rank === 1));
  const id = state.offers[0];
  chooseCard(state, 0, cards, config, fixed);
  chooseCard(state, state.offers.indexOf(id), cards, config, fixed);
  assert.ok(state.players[0].deck.filter(x => x === id).length >= 2);
  botDraft(state, cards, config, skills, fixed);
  assert.equal(state.phase, 'placement'); assert.equal(state.turn, 0);
  state.phase = 'result'; nextRound(state, cards, config, fixed);
  assert.equal(state.players[0].deck.length, 11);
  assert.deepEqual(draftOptions(state, config), config.draft[1]);
  assert.equal(new Set(randomOffers(cards, null, fixed)).size, 5);
  assert.ok(new Set(randomOffers(cards, null, fixed).map(id => byId[id].rank)).size > 1);
});

test('jogador inicia e BOT posiciona sem acessar a fila humana', () => {
  const state = game(); startPlacement(state, fixed);
  const first = currentCard(state).id;
  placeCard(state, 'B', byId, skills, fixed);
  assert.equal(state.placements.B[0][0].id, first); assert.equal(state.turn, 1);
  const queue = [...state.queues[0]];
  const zone = botZone(state, byId, skills, fixed);
  assert.ok(['A', 'B', 'C'].includes(zone));
  assert.deepEqual(state.queues[0], queue);
  placeCard(state, zone, byId, skills, fixed);
  assert.equal(state.turn, 0);
});

test('arquibancada agrupa IDs, ignora invocações e reinicia', () => {
  const state = game(); state.phase = 'battle'; state.placements = emptyPlacements();
  state.placements.A[0] = [unit('x', 0, 1), unit('x', 0, 2), unit('summon', 0, 3, 0, 1, true)];
  state.placements.A[1] = [unit('killer', 1, 4, 10, 10)];
  resolveBattle(state, byId, {}, fixed);
  assert.deepEqual(state.players[0].bench, { x: 2 });
  applyRoundResult(state, config); nextRound(state, cards, config, fixed);
  assert.deepEqual(state.players[0].bench, {});
});

test('11 tipos causam derrota imediata, vida e medalha', () => {
  assert.equal(BENCH_CAPACITY, 10);
  const state = game(); state.phase = 'battle'; state.placements = emptyPlacements();
  state.placements.A[0] = Array.from({ length: 11 }, (_, i) => unit(`dead${i}`, 0, i + 1));
  state.placements.A[1] = [unit('killer', 1, 99, 30, 99)];
  const result = resolveBattle(state, byId, {}, fixed);
  assert.deepEqual(result.overflow, [true, false]); assert.equal(result.winner, 1);
  assert.equal(result.territories.length, 1);
  applyRoundResult(state, config);
  assert.equal(state.players[0].lives, 2); assert.equal(state.players[1].medals, 1);
});

test('mortes simultâneas dos dois lados empatam a rodada', () => {
  const state = game(); state.phase = 'battle'; state.placements = emptyPlacements();
  state.placements.A[0] = Array.from({ length: 11 }, (_, i) => unit(`a${i}`, 0, i, 2, 1));
  state.placements.A[1] = Array.from({ length: 11 }, (_, i) => unit(`b${i}`, 1, i + 20, 2, 1));
  const result = resolveBattle(state, byId, {}, fixed);
  assert.deepEqual(result.overflow, [true, true]); assert.equal(result.winner, null);
  applyRoundResult(state, config);
  assert.deepEqual(state.players.map(p => [p.lives, p.medals]), [[3, 0], [3, 0]]);
});

test('dez tipos são permitidos e a contagem atravessa as três zonas', () => {
  const state = game(); state.phase = 'battle'; state.placements = emptyPlacements();
  for (const [zone, start, count] of [['A', 0, 4], ['B', 4, 3], ['C', 7, 3]]) {
    state.placements[zone][0] = Array.from({ length: count }, (_, i) => unit(`type${start + i}`, 0, start + i));
    state.placements[zone][1] = [unit(`killer${zone}`, 1, 40 + start, 30, 99)];
  }
  const result = resolveBattle(state, byId, {}, fixed);
  assert.equal(Object.keys(state.players[0].bench).length, 10);
  assert.equal(result.overflow, null);
  assert.equal(result.territories.length, 3);
});

test('Zona B desempata apenas quando vitórias em zonas são iguais', () => {
  const state = game(); state.phase = 'battle'; state.placements = emptyPlacements();
  state.placements.A = [[unit('strong', 0, 1, 8, 8)], [unit('weak', 1, 2, 1, 1)]];
  state.placements.B = [[unit('weak', 0, 3, 1, 1)], [unit('strong', 1, 4, 8, 8)]];
  assert.equal(resolveBattle(state, byId, {}, fixed).winner, 1);
  const other = game(); other.phase = 'battle'; other.placements = emptyPlacements();
  other.placements.A = [[unit('strong', 0, 5, 8, 8)], [unit('weak', 1, 6, 1, 1)]];
  other.placements.B = [[unit('strong', 0, 7, 8, 8)], [unit('weak', 1, 8, 1, 1)]];
  other.placements.C = [[unit('weak', 0, 9, 1, 1)], [unit('strong', 1, 10, 8, 8)]];
  assert.equal(resolveBattle(other, byId, {}, fixed).winner, 0);
});

test('rodada 8 segue sem adquirir cartas', () => {
  const state = game(); state.phase = 'result'; state.round = 7;
  nextRound(state, cards, config, fixed);
  assert.equal(state.phase, 'placement'); assert.equal(state.round, 8);
  assert.deepEqual(state.players.map(p => p.deck.length), [9, 9]);
});

test('terceira vida perdida e sétima medalha encerram a partida', () => {
  for (const scenario of ['lives', 'medals']) {
    const state = game(); state.phase = 'battle';
    state.players[scenario === 'lives' ? 0 : 1][scenario === 'lives' ? 'lives' : 'medals'] = scenario === 'lives' ? 1 : 6;
    state.battle = { winner: 1, territories: [], wins: [0, 0], tiebreak: false, overflow: null };
    applyRoundResult(state, config);
    assert.equal(state.phase, 'gameover'); assert.equal(state.champion, 1);
  }
});

test('partidas completas contra BOT terminam sem travar', () => {
  for (let seed = 1; seed <= 12; seed++) {
    let value = seed;
    const rng = () => ((value = (value * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    const state = createGame(cards, decks, config, rng);
    while (state.phase !== 'gameover' && state.round <= 25) {
      if (state.phase === 'draft') {
        if (state.draftPlayer === 0) {
          choosePackage(state, Math.floor(rng() * draftOptions(state, config).length), cards, config, rng);
          while (state.phase === 'draft' && state.draftPlayer === 0) chooseCard(state, Math.floor(rng() * 5), cards, config, rng);
        }
        botDraft(state, cards, config, skills, rng);
      }
      if (state.phase === 'placement') {
        while (state.phase === 'placement') {
          const zone = state.turn === 1 ? botZone(state, byId, skills, rng) : ['A', 'B', 'C'][Math.floor(rng() * 3)];
          assert.equal(placeCard(state, zone, byId, skills, rng), true);
        }
      }
      if (state.phase === 'battle') { resolveBattle(state, byId, skills, rng); applyRoundResult(state, config); }
      if (state.phase === 'result') nextRound(state, cards, config, rng);
    }
    assert.equal(state.phase, 'gameover', `seed ${seed}`);
    assert.ok(state.round <= 25);
  }
});
