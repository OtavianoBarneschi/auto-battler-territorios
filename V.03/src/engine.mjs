import { createSkillDispatcher } from './effects.mjs';

export const VERSION = 'V.03';
export const TERRITORIES = ['A', 'B', 'C'];

export function shuffle(items, rng = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(rng() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function randomOffers(cards, count, rng = Math.random) {
  if (!cards.length) return [];
  return Array.from({ length: count }, () => cards[Math.min(cards.length - 1, Math.floor(rng() * cards.length))].id);
}

export function emptyPlacements() {
  return Object.fromEntries(TERRITORIES.map(zone => [zone, [[], []]]));
}

export function createUnit(card, player, instanceId, extra = {}) {
  if (!card || !Number.isFinite(card.atk) || !Number.isFinite(card.hp) || card.atk < 0 || card.hp < 1) {
    throw new Error('Carta com atributos inválidos');
  }
  return {
    id: card.id, instanceId, player, name: card.name, rank: card.rank ?? 0,
    atk: card.atk, hp: card.hp, maxHp: card.hp, skillId: card.skillId ?? null,
    artAsset: card.artAsset, uses: {}, summonDepth: 0, summoned: false, ...extra,
  };
}

export function createGame(cards, initialDecks, config, rng = Math.random) {
  const byId = Object.fromEntries(cards.map(card => [card.id, card]));
  if (Object.keys(byId).length !== cards.length) throw new Error('IDs duplicados no catálogo');
  const starting = [initialDecks.jogador_x, initialDecks.jogador_y];
  for (const deck of starting) for (const id of deck) if (!byId[id]) throw new Error(`Carta desconhecida: ${id}`);
  return {
    version: VERSION, round: 1, phase: 'shop', shopPlayer: 0, turn: null,
    players: starting.map(deck => ({
      deck: [...deck], lives: config.vidas_iniciais, medals: 0,
      coins: config.economia_provisoria.moedas_por_rodada,
    })),
    offers: randomOffers(cards, config.economia_provisoria.ofertas_na_loja, rng),
    queues: [[], []], placements: emptyPlacements(), nextInstance: 1,
    lastPlacementEvents: [], battle: null, result: null, champion: null,
  };
}

export function buyCard(state, offerIndex, cardsById) {
  if (state.phase !== 'shop') return false;
  const card = cardsById[state.offers[offerIndex]];
  const player = state.players[state.shopPlayer];
  if (!card || player.coins < card.cost) return false;
  player.coins -= card.cost;
  player.deck.push(card.id);
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
    state.lastPlacementEvents = [];
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

export function placeCard(state, territory, cardsById, skills, rng = Math.random) {
  if (state.phase !== 'placement' || !TERRITORIES.includes(territory)) return false;
  const player = state.turn;
  const id = state.queues[player][0];
  if (!id || !cardsById[id]) return false;
  state.queues[player].shift();
  const entry = createUnit(cardsById[id], player, state.nextInstance++);
  state.placements[territory][player].push(entry);
  const context = {
    territory, sides: state.placements[territory], events: [], effectCount: 0,
    dealDamage: () => 0, queueSummon: () => false,
  };
  createSkillDispatcher(skills, rng)(context, 'ON_PLACE', entry);
  state.lastPlacementEvents = context.events;
  const other = 1 - player;
  if (state.queues[other].length) state.turn = other;
  else if (state.queues[player].length) state.turn = player;
  else { state.phase = 'battle'; state.turn = null; }
  return true;
}

function createBattleContext(territory, sides, skills, rng) {
  const context = {
    territory, sides, events: [], effectCount: 0, pendingSummons: [], nextSummon: 1,
    rng,
  };
  const dispatch = createSkillDispatcher(skills, rng);
  context.dispatch = (trigger, subject, payload) => dispatch(context, trigger, subject, payload);
  context.prepareDamage = (target, raw, source, kind) => {
    const payload = { amount: Math.max(0, raw), source, kind };
    context.dispatch('BEFORE_DAMAGE', target, payload);
    return Math.max(0, payload.amount);
  };
  context.dealDamage = (target, raw, source, kind, nonlethal = false) => {
    if (!target || target.hp <= 0) return 0;
    const prepared = context.prepareDamage(target, raw, source, kind);
    const damage = Math.min(prepared, nonlethal ? Math.max(0, target.hp - 1) : target.hp);
    if (damage <= 0) return 0;
    target.hp -= damage;
    target.lastDamageSource = source ?? null;
    context.events.push({ territory, type: kind === 'skill' ? 'skill_damage' : 'attack_damage',
      actor: source?.name ?? '', target: target.name, amount: damage });
    context.dispatch('ON_DAMAGE_TAKEN', target, { damage, source, kind });
    return damage;
  };
  context.queueSummon = (actor, subject, spec) => {
    if (!subject || actor.summonDepth >= 2) return false;
    const index = sides[subject.player].indexOf(subject);
    if (index < 0) return false;
    const atk = typeof spec.atk === 'number' ? spec.atk : Math.ceil(actor.atk * spec.atk.selfAtkPercent / 100);
    const unit = createUnit({
      id: spec.id, name: spec.name, rank: 0, atk, hp: spec.hp,
      skillId: spec.skillId ?? null, artAsset: spec.artFromActor ? actor.artAsset : null,
    }, subject.player, `s${context.nextSummon++}`, {
      summoned: true, summonDepth: actor.summonDepth + 1,
    });
    context.pendingSummons.push({ subject, player: subject.player, unit });
    return true;
  };
  context.processDeaths = () => {
    let processed = 0;
    while (true) {
      let dead = null;
      for (const side of sides) {
        dead = side.find(unit => unit.hp <= 0 && !unit.deadProcessed);
        if (dead) break;
      }
      if (!dead) break;
      if (++processed > 200) throw new Error('Limite de segurança de mortes excedido');
      dead.deadProcessed = true;
      const side = sides[dead.player];
      const faintedIndex = side.indexOf(dead);
      const killer = dead.lastDamageSource;
      if (killer && killer.player !== dead.player && killer.hp > 0) {
        context.dispatch('ON_KILL', killer, { defeated: dead });
      }
      context.events.push({ territory, type: 'faint', actor: dead.name });
      context.dispatch('ON_FAINT', dead, { killer, faintedIndex });
      context.dispatch('ON_ALLY_FAINT', dead, { killer, faintedIndex });
      const waiting = context.pendingSummons.filter(item => item.subject === dead);
      context.pendingSummons = context.pendingSummons.filter(item => item.subject !== dead);
      side.splice(faintedIndex, 1, ...waiting.map(item => item.unit));
      for (const item of waiting) {
        context.events.push({ territory, type: 'summon', actor: item.unit.name });
        context.dispatch('ON_SUMMON', item.unit);
      }
    }
  };
  return context;
}

function healthSignature(sides) {
  return sides.map(side => side.map(unit => `${unit.instanceId}:${unit.hp}`).join(',')).join('|');
}

export function resolveTerritory(territory, entries, cardsById, skills, rng = Math.random) {
  if (!TERRITORIES.includes(territory)) throw new Error('Zona inválida');
  const sides = entries.map((side, player) => side.map((entry, index) => {
    if (entry.atk !== undefined && entry.maxHp !== undefined) {
      return { ...entry, player, uses: { ...entry.uses } };
    }
    return createUnit(cardsById[entry.id], player, entry.instanceId ?? `${player}-${index}`);
  }));
  const ctx = createBattleContext(territory, sides, skills, rng);
  ctx.dispatch('ON_BATTLE_START', null);
  ctx.processDeaths();
  let strikes = 0;
  let noHealthChange = 0;
  while (sides[0].length && sides[1].length) {
    if (++strikes > 1000) {
      ctx.events.push({ territory, type: 'stalemate' });
      break;
    }
    const beforeHealth = healthSignature(sides);
    const left = sides[0][0], right = sides[1][0];
    ctx.dispatch('BEFORE_ATTACK', left);
    ctx.dispatch('BEFORE_ATTACK', right);
    const toRight = ctx.prepareDamage(right, left.atk, left, 'attack');
    const toLeft = ctx.prepareDamage(left, right.atk, right, 'attack');
    const rightDamage = Math.min(right.hp, toRight);
    const leftDamage = Math.min(left.hp, toLeft);
    right.hp -= rightDamage;
    left.hp -= leftDamage;
    if (rightDamage > 0) right.lastDamageSource = left;
    if (leftDamage > 0) left.lastDamageSource = right;
    ctx.events.push({ territory, type: 'strike',
      left: { id: left.id, name: left.name, artAsset: left.artAsset, atk: left.atk, hp: left.hp, maxHp: left.maxHp },
      right: { id: right.id, name: right.name, artAsset: right.artAsset, atk: right.atk, hp: right.hp, maxHp: right.maxHp },
      leftDamage, rightDamage });
    if (leftDamage > 0) ctx.dispatch('ON_DAMAGE_TAKEN', left, { damage: leftDamage, source: right, kind: 'attack' });
    if (rightDamage > 0) ctx.dispatch('ON_DAMAGE_TAKEN', right, { damage: rightDamage, source: left, kind: 'attack' });
    ctx.dispatch('AFTER_ATTACK', left);
    ctx.dispatch('AFTER_ATTACK', right);
    ctx.processDeaths();
    if (healthSignature(sides) === beforeHealth) noHealthChange++;
    else noHealthChange = 0;
    if (noHealthChange >= 12) {
      ctx.events.push({ territory, type: 'stalemate' });
      break;
    }
  }
  const winner = sides[0].length && !sides[1].length ? 0 : sides[1].length && !sides[0].length ? 1 : null;
  ctx.events.push({ territory, type: 'territory', winner });
  return { territory, winner, events: ctx.events, survivors: sides };
}

export function resolveBattle(state, cardsById, skills, rng = Math.random) {
  if (state.phase !== 'battle') throw new Error('A batalha ainda não começou');
  const territories = TERRITORIES.map(zone => resolveTerritory(zone, state.placements[zone], cardsById, skills, rng));
  const wins = [0, 0];
  for (const result of territories) if (result.winner !== null) wins[result.winner]++;
  const bWinner = territories[1].winner;
  const tiebreak = wins[0] === wins[1] && bWinner !== null;
  const winner = wins[0] > wins[1] ? 0 : wins[1] > wins[0] ? 1 : bWinner;
  state.battle = { territories, events: territories.flatMap(result => result.events), wins, winner, tiebreak };
  return state.battle;
}

export function applyRoundResult(state, config) {
  if (state.phase !== 'battle' || !state.battle) throw new Error('Batalha sem resultado');
  const { winner, territories, wins, tiebreak } = state.battle;
  if (winner !== null) {
    state.players[winner].medals++;
    state.players[1 - winner].lives--;
  }
  state.result = { round: state.round, winner, territories, wins, tiebreak };
  if (winner !== null &&
      (state.players[winner].medals >= config.medalhas_para_vencer || state.players[1 - winner].lives <= 0)) {
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
