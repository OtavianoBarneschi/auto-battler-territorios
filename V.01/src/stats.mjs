export function baseStats(card) {
  if (!card || !Number.isFinite(card.atk) || !Number.isFinite(card.hp) || card.atk <= 0 || card.hp <= 0) {
    throw new Error('Carta com atributos inválidos');
  }
  return { atk: card.atk, hp: card.hp };
}
