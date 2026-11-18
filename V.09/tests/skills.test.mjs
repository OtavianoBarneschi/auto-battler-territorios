import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createUnit, createGame, placeCard, resolveTerritory,
} from '../src/engine.mjs';
import cards from '../data/cards.json' with { type: 'json' };
import skills from '../data/skills.json' with { type: 'json' };
import decks from '../data/baralhos-iniciais.json' with { type: 'json' };
import config from '../data/config.json' with { type: 'json' };

const byId = Object.fromEntries(cards.map(card => [card.id, card]));
byId.ally = { id: 'ally', name: 'Aliado teste', atk: 1, hp: 100, rank: 0, skillId: null, artAsset: '' };
byId.enemy = { id: 'enemy', name: 'Inimigo teste', atk: 20, hp: 100, rank: 0, skillId: null, artAsset: '' };
byId.weak = { id: 'weak', name: 'Alvo fraco', atk: 0, hp: 1, rank: 0, skillId: null, artAsset: '' };
const fixed = () => 0;
let serial = 1;
const unit = (id, player, changes = {}) => createUnit(byId[id], player, serial++, changes);
const battle = (left, right) => resolveTerritory('A', [left, right], byId, skills, fixed);

const expected = {
  '01': ['buff'], '02': ['buff'], '03': ['skill_damage'], '04': ['weaken'],
  '05': ['buff'], '06': ['buff'], '07': ['skill_damage'], '08': ['buff'],
  '09': ['buff'], '10': ['buff'], '11': ['buff'], '12': ['buff'],
  '13': ['skill_damage'], '14': ['summon', 'Mini Pato Astronauta'],
  '15': ['buff'], '16': ['summon', 'Espírito'], '17': ['skill_damage'],
  '18': ['buff'], '19': ['buff'], '20': ['skill_damage'], '21': ['buff'],
  '22': ['summon', 'Isca de Pato'], '23': ['skill_damage'], '24': ['buff'],
  '25': ['skill_damage'], '26': ['buff'], '27': ['summon', 'Mini Torradeira'],
  '28': ['buff'], '29': ['block'], '30': ['buff'], '31': ['buff'],
  '32': ['weaken'], '33': ['skill_damage'], '34': ['buff'], '35': ['buff'],
  '36': ['buff'], '37': ['buff'], '38': ['block'], '39': ['buff'],
  '40': ['buff'], '41': ['buff'], '42': ['skill_damage'],
  '43': ['summon', 'Mini Lata'], '44': ['skill_damage'], '45': ['buff'],
  '46': ['skill_damage'], '47': ['buff'], '48': ['skill_damage'],
  '49': ['skill_damage'], '50': ['buff'],
};

function run(id) {
  const trigger = skills[`skill_${id}`].triggers[0];
  const actor = unit(id, 0);
  if (trigger === 'ON_PLACE') {
    const game = createGame(cards, decks, config, fixed);
    game.phase = 'placement'; game.turn = 0;
    game.queues = [['ally'], []];
    game.placements.A[0] = [actor];
    placeCard(game, 'A', byId, skills, fixed);
    return game.lastPlacementEvents;
  }
  if (trigger === 'ON_BATTLE_START') {
    return battle([unit('ally', 0), actor, unit('ally', 0)], [unit('enemy', 1), unit('enemy', 1)]).events;
  }
  if (trigger === 'ON_KILL') {
    return battle([actor], [unit('weak', 1)]).events;
  }
  if (trigger === 'ON_FAINT') {
    actor.hp = 1; actor.maxHp = 1;
    return battle([actor, unit('ally', 0), unit('ally', 0)], [unit('enemy', 1), unit('enemy', 1)]).events;
  }
  if (trigger === 'ON_ALLY_FAINT') {
    return battle([unit('weak', 0), actor, unit('ally', 0)], [unit('enemy', 1)]).events;
  }
  if (trigger === 'ON_DAMAGE_TAKEN') {
    actor.hp = 100; actor.maxHp = 100;
    return battle([actor, unit('ally', 0)], [unit('enemy', 1, { atk: 2 })]).events;
  }
  if (trigger === 'BEFORE_DAMAGE') {
    if (id === '29') return battle([actor], [unit('13', 1, { hp: 100, maxHp: 100 })]).events;
    return battle([actor], [unit('enemy', 1, { atk: 2 })]).events;
  }
  if (trigger === 'AFTER_ATTACK') {
    if (id === '19') return battle([unit('ally', 0), actor], [unit('enemy', 1)]).events;
    actor.hp = 100; actor.maxHp = 100;
    return battle([actor, unit('ally', 0)], [unit('enemy', 1)]).events;
  }
  if (trigger === 'BEFORE_ATTACK') return battle([actor], [unit('enemy', 1)]).events;
  if (trigger === 'ON_SUMMON') {
    const front = unit('22', 0, { hp: 1, maxHp: 1 });
    return battle([front, actor], [unit('enemy', 1)]).events;
  }
  throw new Error(`Cenário ausente para ${id}: ${trigger}`);
}

for (const card of cards) {
  test(`habilidade ${card.id} · ${card.name}`, () => {
    const events = run(card.id);
    const [type, summonName] = expected[card.id];
    assert.ok(events.some(event =>
      event.type === type && event.actor === (summonName ?? card.name)
    ), `Habilidade não ativou: ${card.id} (${type})`);
  });
}

test('Pirata arredonda redução de 33% para baixo e não mata', () => {
  const result = battle([unit('03', 0)], [unit('enemy', 1, { atk: 0, hp: 3, maxHp: 3 })]);
  assert.equal(result.events.filter(event => event.type === 'skill_damage' && event.actor === byId['03'].name).length, 0);
  const result2 = battle([unit('03', 0)], [unit('enemy', 1, { atk: 0, hp: 10, maxHp: 10 })]);
  assert.equal(result2.events.find(event => event.type === 'skill_damage' && event.actor === byId['03'].name).amount, 3);
});

test('Torradeira e Lata invocam sem ciclos infinitos', () => {
  const result = battle([unit('43', 0, { hp: 1, maxHp: 1 })], [unit('enemy', 1)]);
  const cans = result.events.filter(event => event.type === 'summon' && event.actor === 'Mini Lata');
  assert.equal(cans.length, 2);
  assert.ok(result.events.length < 100);
});

test('redução de dano só consome o tipo de ataque correto', () => {
  const tv = unit('29', 0, { hp: 20, maxHp: 20 });
  const waiter = unit('38', 0, { hp: 20, maxHp: 20 });
  const result = battle([tv, waiter], [unit('enemy', 1, { atk: 2 })]);
  assert.equal(result.events.filter(event => event.type === 'block' && event.actor === 'TV Hipnotizadora').length, 0);
  assert.ok(result.events.some(event => event.type === 'block' && event.actor === 'Garçom'));
});

test('limites de ativação impedem crescimento infinito', () => {
  const king = unit('50', 0, { hp: 100, maxHp: 100, atk: 0 });
  const result = battle([king], [unit('enemy', 1, { hp: 100, maxHp: 100, atk: 0 })]);
  assert.equal(result.events.filter(event => event.type === 'buff' && event.actor === 'Rei da Sucata').length, 3);
  assert.ok(result.events.some(event => event.type === 'stalemate') || result.winner !== null);
});

