// Catálogo declarativo: gatilho + alvo + operação. Nenhuma carta exige lógica
// exclusiva no motor. Ordem: Jogador A, BOT, depois ordem da fila.
export const TRIGGERS = [
  'ON_PLACE', 'ON_BATTLE_START', 'BEFORE_ATTACK', 'AFTER_ATTACK',
  'BEFORE_DAMAGE', 'ON_DAMAGE_TAKEN', 'ON_KILL', 'ON_FAINT',
  'ON_ALLY_FAINT', 'ON_SUMMON',
];

function living(side) { return side.filter(unit => unit.hp > 0); }
function pick(list, rng) { return list.length ? list[Math.min(list.length - 1, Math.floor(rng() * list.length))] : null; }
function unique(list) { return [...new Set(list.filter(Boolean))]; }

function amount(value, actor, target) {
  if (typeof value === 'number') return value;
  if (value?.selfAtkPercent !== undefined) return Math.ceil(actor.atk * value.selfAtkPercent / 100);
  if (value?.selfMaxHpPercent !== undefined) return Math.ceil(actor.maxHp * value.selfMaxHpPercent / 100);
  if (value?.selfAtk !== undefined) return actor.atk;
  if (value?.targetCurrentHpPercent !== undefined) {
    const raw = target.hp * value.targetCurrentHpPercent / 100;
    return value.round === 'floor' ? Math.floor(raw) : Math.ceil(raw);
  }
  return 0;
}

function targets(ctx, actor, subject, key, payload) {
  const allies = living(ctx.sides[actor.player]);
  const enemies = living(ctx.sides[1 - actor.player]);
  const side = ctx.sides[actor.player];
  const index = side.indexOf(actor);
  const otherAllies = allies.filter(unit => unit !== actor);
  switch (key) {
    case 'self': return actor.hp > 0 ? [actor] : [];
    case 'subject': return subject?.hp > 0 ? [subject] : [];
    case 'allAllies': return allies;
    case 'otherAllies': return otherAllies;
    case 'firstAlly': return otherAllies.slice(0, 1);
    case 'frontAlly': return side.slice(0, index).reverse().filter(unit => unit.hp > 0).slice(0, 1);
    case 'backAlly': return side.slice(index + 1).filter(unit => unit.hp > 0).slice(0, 1);
    case 'nextTwoBehind': return side.slice(index + 1).filter(unit => unit.hp > 0).slice(0, 2);
    case 'alliesAhead': return side.slice(0, index).filter(unit => unit.hp > 0);
    case 'alliesBehind': return side.slice(index + 1).filter(unit => unit.hp > 0);
    case 'randomAlly': return unique([pick(otherAllies, ctx.rng)]);
    case 'firstEnemy':
    case 'activeEnemy': return enemies.slice(0, 1);
    case 'lastEnemy': return enemies.slice(-1);
    case 'maxHpEnemy': return enemies.length ? [enemies.reduce((best, unit) => unit.hp > best.hp ? unit : best)] : [];
    case 'minHpEnemy': return enemies.length ? [enemies.reduce((best, unit) => unit.hp < best.hp ? unit : best)] : [];
    case 'randomEnemy': return unique([pick(enemies, ctx.rng)]);
    case 'firstAndLastEnemy': return unique([enemies[0], enemies.at(-1)]);
    case 'activeEnemyAndBackAlly': return unique([enemies[0], ...side.slice(index + 1).filter(unit => unit.hp > 0).slice(0, 1)]);
    case 'allLiving': return [...allies, ...enemies];
    case 'killerEnemy': return payload.killer?.hp > 0 && payload.killer.player !== actor.player ? [payload.killer] : [];
    default: throw new Error(`Alvo desconhecido: ${key}`);
  }
}

function condition(ctx, actor, subject, trigger, rule, payload) {
  if (trigger === 'ON_PLACE' || trigger === 'ON_SUMMON') {
    if (actor === subject || actor.player !== subject.player) return false;
  }
  if (trigger === 'ON_ALLY_FAINT' && (actor === subject || actor.player !== subject.player)) return false;
  if (trigger === 'ON_DAMAGE_TAKEN' && payload.damage <= 0) return false;
  if (trigger === 'BEFORE_DAMAGE' && payload.amount <= 0) return false;
  if (rule.condition === 'selfAttacked' && actor !== subject) return false;
  if (rule.condition === 'frontAllyAttacked') {
    const side = ctx.sides[actor.player];
    if (actor === subject || side.indexOf(actor) - 1 !== side.indexOf(subject)) return false;
  }
  if (rule.condition === 'allyAheadFainted') {
    const side = ctx.sides[actor.player];
    if (payload.faintedIndex >= side.indexOf(actor)) return false;
  }
  return true;
}

function runAction(ctx, actor, subject, action, payload) {
  if (action.type === 'mitigate') {
    if (payload.kind !== action.damageKind) return false;
    if (payload.kind === 'skill' && payload.source?.player === actor.player) return false;
    const reduction = Math.min(payload.amount, action.amount);
    if (reduction <= 0) return false;
    payload.amount -= reduction;
    ctx.events.push({ territory: ctx.territory, type: 'block', actor: actor.name, amount: reduction });
    return true;
  }
  if (action.type === 'summon') return ctx.queueSummon(actor, subject, action.unit, payload);
  let applied = false;
  for (const target of targets(ctx, actor, subject, action.target, payload)) {
    const atk = amount(action.atk ?? 0, actor, target);
    const hp = amount(action.hp ?? 0, actor, target);
    if (action.type === 'buff' && target.hp > 0 && (atk || hp)) {
      target.atk += atk; target.maxHp += hp; target.hp += hp;
      ctx.events.push({ territory: ctx.territory, type: 'buff', actor: actor.name, target: target.name, atk, hp });
      applied = true;
    } else if (action.type === 'reduceAtk' && target.hp > 0) {
      const reduction = Math.min(target.atk, action.amount);
      if (reduction > 0) {
        target.atk -= reduction;
        ctx.events.push({ territory: ctx.territory, type: 'weaken', actor: actor.name, target: target.name, amount: reduction });
        applied = true;
      }
    } else if (action.type === 'damage') {
      const dealt = ctx.dealDamage(target, amount(action.amount, actor, target), actor, 'skill', Boolean(action.amount?.nonlethal));
      if (dealt > 0) applied = true;
    }
  }
  return applied;
}

export function createSkillDispatcher(skills, rng = Math.random) {
  return function dispatch(ctx, trigger, subject, payload = {}) {
    if (!TRIGGERS.includes(trigger)) throw new Error(`Gatilho desconhecido: ${trigger}`);
    ctx.rng = rng;
    let actors;
    if (trigger === 'ON_BATTLE_START') actors = [...ctx.sides[0], ...ctx.sides[1]];
    else if (['ON_PLACE', 'ON_SUMMON', 'ON_ALLY_FAINT', 'AFTER_ATTACK'].includes(trigger)) {
      actors = [...ctx.sides[subject.player]];
    } else actors = [subject];
    for (const actor of actors) {
      if (!actor || (actor.hp <= 0 && !['ON_FAINT', 'AFTER_ATTACK', 'ON_DAMAGE_TAKEN'].includes(trigger))) continue;
      const rule = skills[actor.skillId];
      if (!rule?.triggers.includes(trigger)) continue;
      if (rule.maxUses !== undefined && (actor.uses[actor.skillId] ?? 0) >= rule.maxUses) continue;
      if (!condition(ctx, actor, subject, trigger, rule, payload)) continue;
      let applied = false;
      for (const action of rule.actions) applied = runAction(ctx, actor, subject, action, payload) || applied;
      if (applied) {
        actor.uses[actor.skillId] = (actor.uses[actor.skillId] ?? 0) + 1;
        ctx.effectCount++;
        if (ctx.effectCount > 2000) throw new Error('Limite de segurança de efeitos excedido');
      }
    }
  };
}
