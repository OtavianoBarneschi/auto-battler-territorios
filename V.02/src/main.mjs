import {
  VERSION, TERRITORIES, createGame, buyCard, reroll, finishShopTurn,
  currentCard, placeCard, resolveBattle, applyRoundResult, nextRound,
} from './engine.mjs';

const app = document.querySelector('#app');
const names = ['JOGADOR X', 'JOGADOR Y'];
const zones = { A: 'ESQUERDA', B: 'CENTRO', C: 'DIREITA' };
const ranks = ['', 'BÁSICO', 'COMUM', 'INCOMUM', 'RARO', 'ÉPICO', 'LENDÁRIO'];
let cards = [], byId = {}, skills = {}, decks, config, game = null;
let battleFrame = 0, battleTimer = null;

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function art(unit) {
  return './' + (unit?.artAsset ?? byId[unit?.id]?.artAsset ?? '');
}
function cardView(value, extra = '') {
  const unit = typeof value === 'string' ? byId[value] : value;
  const base = byId[unit.id] ?? unit;
  const rank = base.rank || 0;
  return `<div class="card rank-${rank} ${extra}">
    <div class="card-top"><span>${rank ? `RANK ${rank} · ${ranks[rank]}` : 'INVOCAÇÃO'}</span><span>${unit.id?.padStart?.(2, '0') ?? ''}</span></div>
    <div class="card-art"><img src="${esc(art(unit))}" alt="${esc(unit.name ?? base.name)}" /></div>
    <div class="card-info"><strong>${esc(unit.name ?? base.name)}</strong>
      <div class="stats"><span class="atk">⚔ ${unit.atk}</span><span class="hp">♥ ${unit.hp}</span></div>
      <p class="skill-text">${esc(base.skillDescription ?? 'Unidade invocada.')}</p>
    </div>
  </div>`;
}
function miniCard(entry, player) {
  const base = byId[entry.id] ?? entry;
  return `<span class="mini-card p${player}" title="${esc(base.name)} · ⚔ ${entry.atk} · ♥ ${entry.hp} · ${esc(base.skillDescription ?? '')}">
    <img src="${esc(art(entry))}" alt="" /><span class="mini-name">${esc(base.name)}</span>
    <b>⚔ ${entry.atk}</b><b>♥ ${entry.hp}</b></span>`;
}
function header(phase) {
  const players = game?.players;
  return `<header class="topbar"><div class="brand"><span class="brand-mark">✦</span><span>DUCK <em>AND</em><br><strong>ROBOTS</strong></span></div>
    <div class="header-center"><span class="eyebrow">RODADA ${game?.round ?? '—'}</span><span class="phase-name">${phase}</span></div>
    <div class="version">${VERSION}</div></header>
    ${players ? `<div class="scoreboard">
      <div class="score p0"><span>${names[0]}</span><strong>♥ ${players[0].lives} <i>•</i> ✦ ${players[0].medals}</strong></div>
      <div class="score-divider">VS</div>
      <div class="score p1"><span>${names[1]}</span><strong>♥ ${players[1].lives} <i>•</i> ✦ ${players[1].medals}</strong></div>
    </div>` : ''}`;
}
function intro() {
  return `${header('DUELO LOCAL')}<main class="intro screen">
    <div class="intro-art left"><img src="${esc(art(byId['01']))}" alt="" /></div>
    <div class="intro-art right"><img src="${esc(art(byId['50']))}" alt="" /></div>
    <p class="eyebrow">50 PERSONAGENS · 3 ZONAS · 1 VENCEDOR</p>
    <h1>DUCK <small>AND</small><br><em>ROBOTS</em></h1>
    <p class="intro-copy">Monte seu baralho, escolha a ordem dos combatentes e acompanhe as habilidades automáticas em três zonas independentes.</p>
    <button class="primary large" data-action="start">JOGAR <span>➜</span></button>
    <p class="quiet">A Zona B desempata quando os jogadores vencem a mesma quantidade de zonas.</p>
  </main>`;
}
function shop() {
  const who = game.shopPlayer, player = game.players[who];
  return `${header('MERCADO')}<main class="screen shop-screen">
    <div class="section-title"><div><p class="eyebrow">PREPARAÇÃO • ${names[who]}</p><h1>Reforce o baralho</h1>
      <p>As cartas adquiridas permanecem nas próximas rodadas.</p></div>
      <div class="coins">◉ <strong>${player.coins}</strong><small>MOEDAS</small></div></div>
    <div class="offers">${game.offers.map((id, index) => {
      const card = byId[id], disabled = card.cost > player.coins;
      return `<button class="offer" data-action="buy" data-index="${index}" ${disabled ? 'disabled' : ''}>
        ${cardView(id)}<span class="offer-price">◉ ${card.cost} · ADQUIRIR</span></button>`;
    }).join('')}</div>
    <div class="shop-actions"><button class="secondary" data-action="reroll" ${player.coins < config.economia_provisoria.custo_reroll ? 'disabled' : ''}>⟳ TROCAR OFERTAS · ◉ ${config.economia_provisoria.custo_reroll}</button>
      <button class="primary" data-action="shop-done">${who === 0 ? 'VEZ DO JOGADOR Y' : 'POSICIONAR CARTAS'} ➜</button></div>
    <div class="deck-panel"><div><span class="eyebrow">SEU BARALHO</span><strong>${player.deck.length} CARTAS</strong></div>
      <div class="deck-list">${Object.entries(player.deck.reduce((all, id) => (all[id] = (all[id] || 0) + 1, all), {}))
        .map(([id, count]) => `<span>${esc(byId[id].name)} <b>×${count}</b></span>`).join('')}</div></div>
  </main>`;
}
function zoneHeading(zone) {
  return `<span class="zone-mark">${zone}</span><span><b>ZONA ${zone}</b><small>${zones[zone]}</small></span>
    ${zone === 'B' ? '<span class="tiebreak-badge">DESEMPATE</span>' : ''}`;
}
function placement() {
  const who = game.turn, draw = currentCard(game), id = draw.id;
  return `${header('POSICIONAMENTO')}<main class="screen placement-screen">
    <div class="section-title"><div><p class="eyebrow">ESCOLHA UMA ZONA</p>
      <h1>Vez do <span class="player-color p${who}">${names[who]}</span></h1>
      <p>Toque em uma zona ou arraste a carta. Os combatentes lutam na ordem em que foram posicionados.</p></div>
      <div class="remaining"><b>${game.queues[0].length} X</b><b>${game.queues[1].length} Y</b><small>RESTANTES</small></div></div>
    <div class="placement-layout"><div class="current-panel"><p class="eyebrow">CARTA REVELADA</p>
      <div class="draggable" draggable="true">${cardView(id, 'active-card')}</div>
      <small>${game.players[who].deck.length - game.queues[who].length} / ${game.players[who].deck.length}</small>
    </div><div class="territories">${TERRITORIES.map(zone => `<button class="territory land-${zone}" data-action="place" data-territory="${zone}">
      <div class="land-heading">${zoneHeading(zone)}<span class="land-arrow">＋</span></div>
      ${[0, 1].map(player => `<div class="lane"><label>${names[player]}</label>
        <div class="lane-cards">${game.placements[zone][player].map(entry => miniCard(entry, player)).join('') || '<span class="empty-slot">VAZIO</span>'}</div></div>`).join('')}
    </button>`).join('')}</div></div>
    ${game.lastPlacementEvents.length ? `<p class="placement-feedback">✦ ${esc(eventText(game.lastPlacementEvents.at(-1)))}</p>` : ''}
  </main>`;
}
function eventText(event) {
  const actor = event.actor || 'Habilidade';
  if (event.type === 'buff') return `${actor} fortaleceu ${event.target}${event.atk ? ` · +${event.atk} ATK` : ''}${event.hp ? ` · +${event.hp} VIDA` : ''}`;
  if (event.type === 'skill_damage') return `${actor} causou ${event.amount} de dano especial em ${event.target}`;
  if (event.type === 'block') return `${actor} bloqueou ${event.amount} de dano`;
  if (event.type === 'weaken') return `${actor} reduziu o ATK de ${event.target} em ${event.amount}`;
  if (event.type === 'summon') return `${actor} entrou na zona`;
  if (event.type === 'faint') return `${actor} foi eliminado`;
  if (event.type === 'stalemate') return 'A zona terminou sem avanço no combate';
  return '';
}
function battle() {
  const all = game.battle.events, done = battleFrame >= all.length;
  const event = all[Math.min(battleFrame, all.length - 1)];
  const completed = game.battle.territories.filter(result => all.findIndex(item => item.type === 'territory' && item.territory === result.territory) < battleFrame);
  let center;
  if (done) center = `<div class="battle-message"><span class="battle-spark">✦</span><h2>Confronto encerrado</h2><p>As três zonas foram resolvidas.</p></div>`;
  else if (event.type === 'strike') center = `<div class="duel"><div class="fighter p0">${cardView(event.left)}
    <div class="combat-hp">♥ ${event.left.hp} <small>−${event.leftDamage}</small></div></div>
    <div class="impact">⚔</div><div class="fighter p1">${cardView(event.right)}
    <div class="combat-hp">♥ ${event.right.hp} <small>−${event.rightDamage}</small></div></div></div>`;
  else if (event.type === 'territory') center = `<div class="battle-message"><span class="battle-spark">${event.territory}</span>
    <h2>${event.winner === null ? 'Zona empatada' : `${names[event.winner]} venceu a Zona ${event.territory}`}</h2></div>`;
  else center = `<div class="battle-message effect-${event.type}"><span class="battle-spark">${event.type === 'summon' ? '✦' : event.type === 'block' ? '◈' : event.type === 'buff' ? '↑' : event.type === 'skill_damage' ? '⚡' : '◆'}</span>
    <h2>${esc(eventText(event))}</h2></div>`;
  return `${header('BATALHA')}<main class="screen battle-screen">
    <div class="battle-progress">${TERRITORIES.map(zone => `<span class="${completed.some(item => item.territory === zone) ? 'complete' : !done && event.territory === zone ? 'current' : ''}">${zone} ${zone === 'B' ? '<small>DESEMPATE</small>' : ''}</span>`).join('')}</div>
    <p class="eyebrow battle-label">${done ? 'FIM DA BATALHA' : `ZONA ${event.territory} · ${zones[event.territory]}`}</p>
    ${center}<div class="battle-footer"><p>${done ? `${game.battle.wins[0]} × ${game.battle.wins[1]} zonas` : 'Combate automático em andamento'}</p>
      ${done ? '<button class="primary" data-action="show-result">VER RESULTADO ➜</button>' : '<button class="secondary quiet-button" data-action="skip">PULAR ANIMAÇÃO</button>'}</div>
  </main>`;
}
function results(isOver) {
  const result = game.result, winner = result.winner;
  const title = isOver ? `${names[game.champion]} VENCEU!` : winner === null ? 'RODADA EMPATADA' : `${names[winner]} VENCEU A RODADA`;
  return `${header(isOver ? 'FIM DE JOGO' : 'RESULTADO')}<main class="screen result-screen">
    <div class="result-crest">${isOver ? '♛' : winner === null ? '◇' : '✦'}</div>
    <p class="eyebrow">RODADA ${result.round} · ${result.tiebreak ? 'ZONA B DECIDIU' : 'CONFRONTO FINALIZADO'}</p>
    <h1>${title}</h1><p class="result-copy">${winner === null ? 'Ninguém ganhou medalha ou perdeu vida.' : `${names[winner]} ganhou 1 medalha. ${names[1 - winner]} perdeu 1 vida.`}</p>
    <div class="result-board">${result.territories.map(zone => `<div class="result-land land-${zone.territory}">
      <span>${zone.territory}</span><b>${zones[zone.territory]}</b><small>${zone.territory === 'B' ? 'DESEMPATE · ' : ''}${zone.winner === null ? 'EMPATE' : names[zone.winner]}</small></div>`).join('')}</div>
    <div class="final-score">${game.players.map((player, index) => `<div><span>${names[index]}</span>
      <strong>♥ ${player.lives} <i>✦</i> ${player.medals}</strong></div>`).join('')}</div>
    <button class="primary large" data-action="${isOver ? 'restart' : 'next-round'}">${isOver ? 'JOGAR NOVAMENTE' : 'PRÓXIMA RODADA'} ➜</button>
  </main>`;
}
function render() {
  app.innerHTML = !game ? intro() : game.phase === 'shop' ? shop() : game.phase === 'placement' ? placement() : game.phase === 'battle' ? battle() : results(game.phase === 'gameover');
  if (game?.phase === 'placement') {
    const drag = app.querySelector('.draggable');
    drag.addEventListener('dragstart', event => { event.dataTransfer.setData('text/plain', 'card'); event.dataTransfer.effectAllowed = 'move'; });
    app.querySelectorAll('.territory').forEach(zone => {
      zone.addEventListener('dragover', event => { event.preventDefault(); zone.classList.add('drag-hover'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('drag-hover'));
      zone.addEventListener('drop', event => { event.preventDefault(); zone.classList.remove('drag-hover'); if (event.dataTransfer.getData('text/plain') === 'card') act('place', zone.dataset); });
    });
  }
}
function animateBattle() {
  clearInterval(battleTimer);
  battleFrame = 0;
  render();
  battleTimer = setInterval(() => {
    if (game.phase !== 'battle') { clearInterval(battleTimer); return; }
    battleFrame++;
    if (battleFrame >= game.battle.events.length) clearInterval(battleTimer);
    render();
  }, 420);
}
function act(action, data = {}) {
  if (action === 'start' || action === 'restart') { clearInterval(battleTimer); game = createGame(cards, decks, config); }
  else if (action === 'buy') buyCard(game, Number(data.index), byId);
  else if (action === 'reroll') reroll(game, cards, config);
  else if (action === 'shop-done') finishShopTurn(game, cards, config);
  else if (action === 'place') {
    if (placeCard(game, data.territory, byId, skills) && game.phase === 'battle') {
      resolveBattle(game, byId, skills); animateBattle(); return;
    }
  } else if (action === 'skip') { clearInterval(battleTimer); battleFrame = game.battle.events.length; }
  else if (action === 'show-result') applyRoundResult(game, config);
  else if (action === 'next-round') nextRound(game, cards, config);
  render();
}
app.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (button && !button.disabled) act(button.dataset.action, button.dataset);
});

try {
  const responses = await Promise.all([
    fetch('./data/cards.json'), fetch('./data/skills.json'),
    fetch('./data/baralhos-iniciais.json'), fetch('./data/config-prototipo.json'),
  ]);
  if (!responses.every(response => response.ok)) throw new Error('Falha ao carregar dados');
  [cards, skills, decks, config] = await Promise.all(responses.map(response => response.json()));
  byId = Object.fromEntries(cards.map(card => [card.id, card]));
  render();
} catch (error) {
  app.innerHTML = '<main class="screen error"><h1>Não foi possível abrir o jogo</h1><p>Recarregue a página e confira os arquivos publicados.</p></main>';
  console.error(error);
}
