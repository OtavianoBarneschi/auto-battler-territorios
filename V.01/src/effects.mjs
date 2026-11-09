// Nenhuma habilidade é registrada na V.01. O barramento aceita múltiplos
// efeitos por gatilho quando o catálogo de habilidades for definido.
export const EFFECT_TRIGGERS = ['onPlacement', 'duringBattle', 'onDamage', 'onDeath'];

export function createEffectBus() {
  const handlers = Object.fromEntries(EFFECT_TRIGGERS.map(trigger => [trigger, []]));
  return {
    register(trigger, handler) {
      if (!handlers[trigger]) throw new Error(`Gatilho desconhecido: ${trigger}`);
      handlers[trigger].push(handler);
    },
    emit(trigger, context) {
      for (const handler of handlers[trigger] ?? []) handler(context);
    },
  };
}
