import { VERSION, TERRITORIES, createGame, buyCard, reroll, finishShopTurn, currentCard, placeCard, resolveBattle, applyRoundResult, nextRound } from './engine.mjs';

const app = document.querySelector('#app');
let cards = [];
let byId = {};
let decks;
let config;
let game = null;
let battleFrame = 0;
let battleTimer = null;

const names = ['JOGADOR X', 'JOGADOR Y'];
const landNames = { A: 'Bosque', B: 'Ruínas', C: 'Fortaleza' };
const symbols = { A: '✦', B: '◆', C: '♜' };

function cardArt(id) { return `./${byId[id].arte}`; }
function cardView(id, extra = '') {
  const card = byId[id];
  return `<div class="card ${extra}"><div class="card-art"><img src="${cardArt(id)}" alt="${card.nome}" /></div><div class="card-info"><strong>${card.nome}</strong><div class="stats"><span class="atk">⚔ ${card.atk}</span><span class="hp">♥ ${card.hp}</span></div></div></div>`;
}
function miniCard(entry, player) {
  const card = byId[entry.id];
  return `<span class="mini-card p${player}" title="${card.nome}: ${card.atk} ATK, ${card.hp} HP"><img src="${cardArt(entry.id)}" alt="" /><span class="mini-name">${card.nome}</span><b>${card.atk}</b><b>${card.hp}</b></span>`;
}
function header(phase) {
  const players = game?.players;
  return `<header class="topbar"><div class="brand"><span class="brand-mark">✣</span><span>TRÊS<br><strong>FRENTES</strong></span></div><div class="header-center"><span class="eyebrow">RODADA ${game?.round ?? '—'}</span><span class="phase-name">${phase}</span></div><div class="version">${VERSION}</div></header>
  ${players ? `<div class="scoreboard"><div class="score p0"><span>${names[0]}</span><strong>♥ ${players[0].lives} <i>•</i> ✦ ${players[0].medals}</strong></div><div class="score-divider">VS</div><div class="score p1"><span>${names[1]}</span><strong>♥ ${players[1].lives} <i>•</i> ✦ ${players[1].medals}</strong></div></div>` : ''}`;
}
function intro() {
  return `${header('DUELO LOCAL')}<main class="intro screen"><div class="intro-glow"></div><div class="crest">✣</div><p class="eyebrow">UM CAMPO. TRÊS TERRITÓRIOS.</p><h1>TRÊS<br><em>FRENTES</em></h1><p class="intro-copy">Monte seu baralho, posicione suas tropas e assista ao confronto. Dois jogadores. Um dispositivo.</p><button class="primary large" data-action="start">JOGAR <span>➜</span></button><p class="quiet">Conquiste 7 medalhas ou elimine as 3 vidas do rival.</p></main>`;
}
function shop() {
  const who = game.shopPlayer;
  const player = game.players[who];
  return `${header('MERCADO')}<main class="screen shop-screen"><div class="section-title"><div><p class="eyebrow">PREPARAÇÃO • ${names[who]}</p><h1>Reforce o baralho</h1><p>As cartas compradas permanecem nas próximas rodadas.</p></div><div class="coins">◉ <strong>${player.coins}</strong><small>MOEDAS</small></div></div><div class="offers">${game.offers.map((id, index) => `<button class="offer ${byId[id].custo > player.coins ? 'disabled' : ''}" data-action="buy" data-index="${index}" ${byId[id].custo > player.coins ? 'disabled' : ''}>${cardView(id)}<span class="offer-price">◉ ${byId[id].custo} · COMPRAR</span></button>`).join('')}</div><div class="shop-actions"><button class="secondary" data-action="reroll" ${player.coins < config.economia_provisoria.custo_reroll ? 'disabled' : ''}>⟳ TROCAR OFERTAS <span>◉ ${config.economia_provisoria.custo_reroll}</span></button><button class="primary" data-action="shop-done">${who === 0 ? 'VEZ DO JOGADOR Y' : 'POSICIONAR CARTAS'} ➜</button></div><div class="deck-panel"><div><span class="eyebrow">SEU BARALHO</span><strong>${player.deck.length} CARTAS</strong></div><div class="deck-list">${Object.entries(player.deck.reduce((all, id) => (all[id] = (all[id] || 0) + 1, all), {})).map(([id, count]) => `<span>${byId[id].nome} <b>×${count}</b></span>`).join('')}</div></div></main>`;
}
function placement() {
  const who = game.turn;
  const draw = currentCard(game);
  const id = draw?.id;
  const left = game.queues[0].length;
  const right = game.queues[1].length;
  return `${header('POSICIONAMENTO')}<main class="screen placement-screen"><div class="section-title compact"><div><p class="eyebrow">ESCOLHA UMA FRENTE</p><h1>Vez do <span class="player-color p${who}">${names[who]}</span></h1><p>Toque em um território ou arraste a carta. Depois de posicionada, ela fica visível e não pode ser movida.</p></div><div class="remaining"><span>${left} <small>X</small></span><span>${right} <small>Y</small></span><label>RESTANTES</label></div></div><div class="placement-layout"><div class="current-panel"><p class="eyebrow">CARTA REVELADA</p><div class="draggable" draggable="true">${cardView(id, 'active-card')}</div><div class="current-description"><strong>${byId[id].nome}</strong><span>⚔ ${byId[id].atk} &nbsp; ♥ ${byId[id].hp}</span><small>Carta ${game.players[who].deck.length - game.queues[who].length} de ${game.players[who].deck.length}</small></div></div><div class="territories">${TERRITORIES.map(territory => `<button class="territory land-${territory}" data-action="place" data-territory="${territory}"><div class="land-heading"><span class="land-symbol">${symbols[territory]}</span><span><b>TERRITÓRIO ${territory}</b><small>${landNames[territory]}</small></span><span class="land-arrow">＋</span></div><div class="lane"><label>${names[0]}</label><div class="lane-cards">${game.placements[territory][0].map(entry => miniCard(entry, 0)).join('') || '<span class="empty-slot">VAZIO</span>'}</div></div><div class="lane"><label>${names[1]}</label><div class="lane-cards">${game.placements[territory][1].map(entry => miniCard(entry, 1)).join('') || '<span class="empty-slot">VAZIO</span>'}</div></div></button>`).join('')}</div></div></main>`;
}
function battle() {
  const all = game.battle.events;
  const event = all[Math.min(battleFrame, all.length - 1)];
  const done = battleFrame >= all.length;
  const completed = game.battle.territories.filter(result => {
    const index = all.findIndex(e => e.type === 'territory' && e.territory === result.territory);
    return index < battleFrame;
  });
  let center = '';
  if (done) center = `<div class="battle-message"><span class="battle-spark">✣</span><h2>Confronto encerrado</h2><p>As três frentes foram resolvidas.</p></div>`;
  else if (event.type === 'strike') center = `<div class="duel"><div class="fighter p0">${cardView(event.left.id)}<div class="combat-hp">♥ ${event.left.hp} <small>−${event.leftDamage}</small></div></div><div class="impact">⚔</div><div class="fighter p1">${cardView(event.right.id)}<div class="combat-hp">♥ ${event.right.hp} <small>−${event.rightDamage}</small></div></div></div>`;
  else center = `<div class="battle-message"><span class="battle-spark">${symbols[event.territory]}</span><h2>${event.winner === null ? 'Território empatado' : `${names[event.winner]} conquistou ${event.territory}`}</h2></div>`;
  return `${header('BATALHA')}<main class="screen battle-screen"><div class="battle-progress">${TERRITORIES.map(id => `<span class="${completed.some(result => result.territory === id) ? 'complete' : event.territory === id && !done ? 'current' : ''}">${symbols[id]} <b>${id}</b></span>`).join('')}</div><p class="eyebrow battle-label">${done ? 'FIM DA BATALHA' : `TERRITÓRIO ${event.territory} • ${landNames[event.territory]}`}</p>${center}<div class="battle-footer"><p>${done ? `${game.battle.wins[0]} × ${game.battle.wins[1]} territórios` : 'Combate automático em andamento'}</p>${done ? '<button class="primary" data-action="show-result">VER RESULTADO ➜</button>' : '<div class="pulse-dots"><i></i><i></i><i></i></div>'}</div></main>`;
}
function results(isOver) {
  const result = game.result;
  const winner = result.winner;
  const title = isOver ? `${names[game.champion]} VENCEU!` : winner === null ? 'RODADA EMPATADA' : `${names[winner]} VENCEU A RODADA`;
  return `${header(isOver ? 'FIM DE JOGO' : 'RESULTADO')}<main class="screen result-screen"><div class="result-crest">${isOver ? '♛' : winner === null ? '◇' : '✦'}</div><p class="eyebrow">RODADA ${result.round} • ${isOver ? 'PARTIDA ENCERRADA' : 'CONFRONTO FINALIZADO'}</p><h1>${title}</h1><p class="result-copy">${winner === null ? 'Nenhuma vida ou medalha foi alterada.' : `${names[winner]} ganhou 1 medalha. ${names[1 - winner]} perdeu 1 vida.`}</p><div class="result-board">${result.territories.map(t => `<div class="result-land land-${t.territory}"><span>${symbols[t.territory]}</span><b>${t.territory}</b><small>${t.winner === null ? 'EMPATE' : names[t.winner]}</small></div>`).join('')}</div><div class="final-score"><div><span>${names[0]}</span><strong>♥ ${game.players[0].lives} <i>✦</i> ${game.players[0].medals}</strong></div><div><span>${names[1]}</span><strong>♥ ${game.players[1].lives} <i>✦</i> ${game.players[1].medals}</strong></div></div><button class="primary large" data-action="${isOver ? 'restart' : 'next-round'}">${isOver ? 'JOGAR NOVAMENTE' : 'PRÓXIMA RODADA'} ➜</button></main>`;
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
  }, 620);
}
function act(action, data = {}) {
  if (action === 'start' || action === 'restart') { clearInterval(battleTimer); game = createGame(cards, decks, config); }
  else if (action === 'buy') buyCard(game, Number(data.index), byId);
  else if (action === 'reroll') reroll(game, cards, config);
  else if (action === 'shop-done') finishShopTurn(game, cards, config);
  else if (action === 'place') { if (placeCard(game, data.territory) && game.phase === 'battle') { resolveBattle(game, byId); animateBattle(); return; } }
  else if (action === 'show-result') { applyRoundResult(game, config); }
  else if (action === 'next-round') nextRound(game, cards, config);
  render();
}
app.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (button && !button.disabled) act(button.dataset.action, button.dataset);
});

try {
  const [cardResponse, deckResponse, configResponse] = await Promise.all([
    fetch('./data/cards.json'), fetch('./data/baralhos-iniciais.json'), fetch('./data/config-prototipo.json'),
  ]);
  if (![cardResponse, deckResponse, configResponse].every(response => response.ok)) throw new Error('Falha ao carregar dados');
  [cards, decks, config] = await Promise.all([cardResponse.json(), deckResponse.json(), configResponse.json()]);
  byId = Object.fromEntries(cards.map(card => [card.id, card]));
  render();
} catch (error) {
  app.innerHTML = `<main class="screen error"><h1>Não foi possível abrir o jogo</h1><p>Recarregue a página. Se o problema persistir, verifique se os arquivos de dados foram publicados.</p></main>`;
  console.error(error);
}
