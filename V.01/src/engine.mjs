import { baseStats } from './stats.mjs';

export const VERSION = 'V.01';
export const TERRITORIES = ['A', 'B', 'C'];

export function shuffle(items, rng = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function randomOffers(cards, count, rng = Math.random) {
  return Array.from({ length: count }, () => cards[Math.floor(rng() * cards.length)].id);
}

export function createGame(cards, initialDecks, config, rng = Math.random) {
  const byId = Object.fromEntries(cards.map(card => [card.id, card]));
  const starting = [initialDecks.jogador_x, initialDecks.jogador_y];
  for (const deck of starting) for (const id of deck) if (!byId[id]) throw new Error(`Carta desconhecida: ${id}`);
  const state = {
    version: VERSION, round: 1, phase: 'shop', shopPlayer: 0, turn: null,
    players: starting.map(deck => ({ deck: [...deck], lives: config.vidas_iniciais, medals: 0, coins: config.economia_provisoria.moedas_por_rodada })),
    offers: [], queues: [[], []], placements: emptyPlacements(), nextInstance: 1,
    battle: null, result: null, champion: null,
  };
  state.offers = randomOffers(cards, config.economia_provisoria.ofertas_na_loja, rng);
  return state;
}

export function emptyPlacements() {
  return Object.fromEntries(TERRITORIES.map(id => [id, [[], []]]));
}

export function buyCard(state, offerIndex, cardsById) {
  if (state.phase !== 'shop') return false;
  const id = state.offers[offerIndex];
  const card = cardsById[id];
  const player = state.players[state.shopPlayer];
  if (!card || player.coins < card.custo) return false;
  player.coins -= card.custo;
  player.deck.push(id);
  state.offers.splice(offerIndex, 1);
  return true;
}

export function reroll(state, cards, config, rng = Math.random) {
  if (state.phase !== 'shop') return false;
  const player = state.players[state.shopPlayer];
  const cost = config.economia_provisoria.custo_reroll;
  if (player.coins < cost) return false;
  player.coins -= cost;
  state.offers = randomOffers(cards, config.economia_provisoria.ofertas_na_loja, rng);
  return true;
}

export function finishShopTurn(state, cards, config, rng = Math.random) {
  if (state.phase !== 'shop') return false;
  if (state.shopPlayer === 0) {
    state.shopPlayer = 1;
    state.offers = randomOffers(cards, config.economia_provisoria.ofertas_na_loja, rng);
  } else {
    state.phase = 'placement';
    state.placements = emptyPlacements();
    state.queues = state.players.map(player => shuffle(player.deck, rng));
    state.turn = (state.round - 1) % 2;
    if (!state.queues[state.turn].length) state.turn = 1 - state.turn;
  }
  return true;
}

export function currentCard(state) {
  if (state.phase !== 'placement') return null;
  const id = state.queues[state.turn][0];
  return id ? { id, player: state.turn } : null;
}

export function placeCard(state, territory, effects = null) {
  if (state.phase !== 'placement' || !TERRITORIES.includes(territory)) return false;
  const player = state.turn;
  const id = state.queues[player].shift();
  if (!id) return false;
  const entry = { id, instanceId: state.nextInstance++ };
  state.placements[territory][player].push(entry);
  effects?.emit('onPlacement', { state, territory, player, entry });
  const other = 1 - player;
  if (state.queues[other].length) state.turn = other;
  else if (state.queues[player].length) state.turn = player;
  else { state.phase = 'battle'; state.turn = null; }
  return true;
}

export function resolveTerritory(territory, sides, cardsById, effects = null) {
  const fighters = sides.map(side => side.map(entry => ({ ...entry, ...baseStats(cardsById[entry.id]) })));
  let positions = [0, 0];
  const events = [];
  while (positions[0] < fighters[0].length && positions[1] < fighters[1].length) {
    const left = fighters[0][positions[0]];
    const right = fighters[1][positions[1]];
    effects?.emit('duringBattle', { territory, fighters: [left, right] });
    const leftAtk = left.atk;
    const rightAtk = right.atk;
    left.hp = Math.max(0, left.hp - rightAtk);
    right.hp = Math.max(0, right.hp - leftAtk);
    effects?.emit('onDamage', { territory, fighter: left, player: 0, damage: rightAtk });
    effects?.emit('onDamage', { territory, fighter: right, player: 1, damage: leftAtk });
    events.push({ territory, type: 'strike', left: { ...left }, right: { ...right }, leftDamage: rightAtk, rightDamage: leftAtk });
    if (left.hp === 0) { effects?.emit('onDeath', { territory, fighter: left, player: 0 }); positions[0]++; }
    if (right.hp === 0) { effects?.emit('onDeath', { territory, fighter: right, player: 1 }); positions[1]++; }
  }
  const leftAlive = positions[0] < fighters[0].length;
  const rightAlive = positions[1] < fighters[1].length;
  const winner = leftAlive ? 0 : rightAlive ? 1 : null;
  events.push({ territory, type: 'territory', winner });
  return { territory, winner, events, survivors: fighters.map((side, player) => side.slice(positions[player])) };
}

export function resolveBattle(state, cardsById, effects = null) {
  if (state.phase !== 'battle') throw new Error('A batalha ainda não começou');
  const territories = TERRITORIES.map(id => resolveTerritory(id, state.placements[id], cardsById, effects));
  const wins = [0, 0];
  for (const result of territories) if (result.winner !== null) wins[result.winner]++;
  const winner = wins[0] === wins[1] ? null : wins[0] > wins[1] ? 0 : 1;
  state.battle = { territories, events: territories.flatMap(result => result.events), wins, winner };
  return state.battle;
}

export function applyRoundResult(state, config) {
  if (state.phase !== 'battle' || !state.battle) throw new Error('Batalha sem resultado');
  const winner = state.battle.winner;
  if (winner !== null) {
    state.players[winner].medals++;
    state.players[1 - winner].lives--;
  }
  state.result = { round: state.round, winner, territories: state.battle.territories, wins: state.battle.wins };
  if (winner !== null && (state.players[winner].medals >= config.medalhas_para_vencer || state.players[1 - winner].lives <= 0)) {
    state.champion = winner;
    state.phase = 'gameover';
  } else state.phase = 'result';
  return state.result;
}

export function nextRound(state, cards, config, rng = Math.random) {
  if (state.phase !== 'result') return false;
  state.round++;
  state.phase = 'shop';
  state.shopPlayer = 0;
  state.players.forEach(player => { player.coins = config.economia_provisoria.moedas_por_rodada; });
  state.offers = randomOffers(cards, config.economia_provisoria.ofertas_na_loja, rng);
  state.battle = null;
  state.result = null;
  return true;
}

