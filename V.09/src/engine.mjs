import { createSkillDispatcher } from './effects.mjs';

export const VERSION = 'V.09';
export const TERRITORIES = ['A', 'B', 'C'];
export const BENCH_CAPACITY = 10;

export function shuffle(items, rng = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(rng() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function randomOffers(cards, rank, rng = Math.random) {
  const pool = cards.filter(card => rank == null || card.rank === rank);
  if (pool.length < 5) throw new Error('Catálogo insuficiente para cinco ofertas');
  return shuffle(pool, rng).slice(0, 5).map(card => card.id);
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
  const starting = [initialDecks.jogador_a, initialDecks.bot];
  if (starting.some(deck => deck.length !== config.initial_cards || deck.some(id => byId[id]?.rank !== 1)))
    throw new Error('Baralho inicial deve conter apenas cartas Comuns');
  for (const deck of starting) for (const id of deck) if (!byId[id]) throw new Error(`Carta desconhecida: ${id}`);
  return {
    version: VERSION, round: 1, phase: 'draft', draftPlayer: 0, draftChoice: null,
    picksRemaining: 0, turn: null,
    players: starting.map(deck => ({
      deck: [...deck], lives: config.starting_lives, medals: 0, bench: {},
    })),
    offers: [],
    queues: [[], []], placements: emptyPlacements(), nextInstance: 1,
    lastPlacementEvents: [], battle: null, result: null, champion: null,
  };
}

export function draftOptions(state, config) { return config.draft[state.round - 1] ?? []; }

export function choosePackage(state, index, cards, config, rng = Math.random) {
  if (state.phase !== 'draft' || state.draftChoice !== null) return false;
  const option = draftOptions(state, config)[index];
  if (!option) return false;
  state.draftChoice = index;
  state.picksRemaining = option.count;
  state.offers = randomOffers(cards, option.rank, rng);
  return true;
}

export function chooseCard(state, offerIndex, cards, config, rng = Math.random) {
  if (state.phase !== 'draft' || state.draftChoice === null) return false;
  const id = state.offers[offerIndex];
  if (!id) return false;
  state.players[state.draftPlayer].deck.push(id);
  state.picksRemaining--;
  if (state.picksRemaining) {
    state.offers = randomOffers(cards, draftOptions(state, config)[state.draftChoice].rank, rng);
  } else if (state.draftPlayer === 0) {
    state.draftPlayer = 1;
    state.draftChoice = null;
    state.offers = [];
  } else startPlacement(state, rng);
  return true;
}

export function startPlacement(state, rng = Math.random) {
  state.phase = 'placement';
  state.placements = emptyPlacements();
  state.lastPlacementEvents = [];
  state.queues = state.players.map(player => shuffle(player.deck, rng));
  state.players.forEach(player => { player.bench = {}; });
  state.turn = 0;
}

export function botDraft(state, cards, config, skills, rng = Math.random) {
  if (state.phase !== 'draft' || state.draftPlayer !== 1) return false;
  const options = draftOptions(state, config);
  const optionScore = option => option.count * (option.rank == null ? 3.5 : 1 + option.rank * 0.9);
  const best = options.map((option, index) => ({ index, score: optionScore(option) + rng() * 1.5 }))
    .sort((a, b) => b.score - a.score)[0];
  choosePackage(state, best.index, cards, config, rng);
  while (state.phase === 'draft' && state.draftPlayer === 1) {
    const deck = state.players[1].deck;
    const pick = state.offers.map((id, index) => {
      const card = cards.find(item => item.id === id);
      const skill = skills[card.skillId];
      const synergy = skill?.triggers.includes('ON_ALLY_FAINT') ? 1.5 :
        skill?.triggers.includes('ON_PLACE') ? 1.2 : 0;
      const copies = deck.filter(entry => entry === id).length;
      return { index, score: card.atk + card.hp * 0.75 + card.rank * 0.6 + synergy - copies * 0.5 + rng() * 2 };
    }).sort((a, b) => b.score - a.score)[0];
    chooseCard(state, pick.index, cards, config, rng);
  }
  return true;
}

export function botZone(state, cardsById, skills, rng = Math.random) {
  if (state.phase !== 'placement' || state.turn !== 1) return null;
  const card = cardsById[currentCard(state).id];
  const scores = TERRITORIES.map(zone => {
    const [ours, theirs] = [state.placements[zone][1], state.placements[zone][0]];
    const strength = side => side.reduce((sum, unit) => sum + unit.atk + unit.hp * 0.7, 0);
    const deficit = strength(theirs) - strength(ours);
    const density = ours.length;
    const need = deficit > 0 ? Math.min(6, deficit * 0.25) : -Math.min(5, -deficit * 0.15);
    const tieValue = zone === 'B' ? 1.4 : 0;
    const skillValue = skills[card.skillId]?.triggers.includes('ON_PLACE') ? Math.min(2, ours.length * 0.8) : 0;
    return { zone, score: need + tieValue + skillValue - density * 2 + rng() * 2.5 };
  });
  return scores.sort((a, b) => b.score - a.score)[0].zone;
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

function createBattleContext(territory, sides, skills, rng, shared) {
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
      const batch = sides.flatMap(side => side.filter(unit => unit.hp <= 0 && !unit.deadProcessed));
      if (!batch.length) break;
      if ((processed += batch.length) > 200) throw new Error('Limite de segurança de mortes excedido');
      batch.forEach(dead => { dead.deadProcessed = true; });
      if (shared) {
        for (const dead of batch) if (!dead.summoned) {
          const entries = shared.bench[dead.player];
          entries[dead.id] = (entries[dead.id] ?? 0) + 1;
          context.events.push({ territory, type: 'bench', player: dead.player, id: dead.id, count: entries[dead.id] });
        }
        const overflowing = shared.bench.map(entries => Object.keys(entries).length > shared.capacity);
        if (overflowing.some(Boolean)) {
          shared.overflow = overflowing;
          context.events.push({ territory, type: 'bench_full', overflowing });
          return;
        }
      }
      for (const dead of batch) {
        const side = sides[dead.player];
        const faintedIndex = side.indexOf(dead);
        const killer = dead.lastDamageSource;
        if (killer && killer.player !== dead.player && killer.hp > 0) context.dispatch('ON_KILL', killer, { defeated: dead });
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
    }
  };
  return context;
}

function healthSignature(sides) {
  return sides.map(side => side.map(unit => `${unit.instanceId}:${unit.hp}`).join(',')).join('|');
}

export function resolveTerritory(territory, entries, cardsById, skills, rng = Math.random, shared = null) {
  if (!TERRITORIES.includes(territory)) throw new Error('Zona inválida');
  const sides = entries.map((side, player) => side.map((entry, index) => {
    if (entry.atk !== undefined && entry.maxHp !== undefined) {
      return { ...entry, player, uses: { ...entry.uses } };
    }
    return createUnit(cardsById[entry.id], player, entry.instanceId ?? `${player}-${index}`);
  }));
  const ctx = createBattleContext(territory, sides, skills, rng, shared);
  ctx.dispatch('ON_BATTLE_START', null);
  ctx.processDeaths();
  let strikes = 0;
  let noHealthChange = 0;
  while (sides[0].length && sides[1].length && !shared?.overflow) {
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
  if (!shared?.overflow) ctx.events.push({ territory, type: 'territory', winner });
  return { territory, winner, events: ctx.events, survivors: sides };
}

export function resolveBattle(state, cardsById, skills, rng = Math.random) {
  if (state.phase !== 'battle') throw new Error('A batalha ainda não começou');
  const shared = { bench: [{}, {}], capacity: BENCH_CAPACITY, overflow: null };
  const territories = [];
  for (const zone of TERRITORIES) {
    if (shared.overflow) break;
    territories.push(resolveTerritory(zone, state.placements[zone], cardsById, skills, rng, shared));
  }
  state.players.forEach((player, index) => { player.bench = shared.bench[index]; });
  const wins = [0, 0];
  for (const result of territories) if (result.winner !== null) wins[result.winner]++;
  const bWinner = territories.find(item => item.territory === 'B')?.winner ?? null;
  const tiebreak = wins[0] === wins[1] && bWinner !== null;
  const winner = shared.overflow ? shared.overflow[0] && shared.overflow[1] ? null : shared.overflow[0] ? 1 : 0
    : wins[0] > wins[1] ? 0 : wins[1] > wins[0] ? 1 : bWinner;
  state.battle = { territories, events: territories.flatMap(result => result.events), wins, winner,
    tiebreak: !shared.overflow && tiebreak, overflow: shared.overflow, bench: shared.bench };
  return state.battle;
}

export function applyRoundResult(state, config) {
  if (state.phase !== 'battle' || !state.battle) throw new Error('Batalha sem resultado');
  const { winner, territories, wins, tiebreak, overflow } = state.battle;
  if (winner !== null) {
    state.players[winner].medals++;
    state.players[1 - winner].lives--;
  }
  state.result = { round: state.round, winner, territories, wins, tiebreak, overflow };
  if (winner !== null &&
      (state.players[winner].medals >= config.medals_to_win || state.players[1 - winner].lives <= 0)) {
    state.champion = winner;
    state.phase = 'gameover';
  } else state.phase = 'result';
  return state.result;
}

export function nextRound(state, cards, config, rng = Math.random) {
  if (state.phase !== 'result') return false;
  state.round++;
  state.phase = state.round <= config.draft.length ? 'draft' : 'placement';
  state.draftPlayer = 0;
  state.draftChoice = null;
  state.picksRemaining = 0;
  state.offers = [];
  state.players.forEach(player => { player.bench = {}; });
  if (state.phase === 'placement') startPlacement(state, rng);
  state.battle = null;
  state.result = null;
  return true;
}
