import { impactoSvg } from './impacto.mjs';
import {
  VERSION, TERRITORIES, BENCH_CAPACITY, createGame, draftOptions, choosePackage,
  chooseCard, botDraft, botZone, currentCard, placeCard, resolveBattle, applyRoundResult, nextRound,
} from './engine.mjs';

const app = document.querySelector('#app');
const names = ['JOGADOR A', 'BOT'];
const zones = { A: 'ESQUERDA', B: 'CENTRO', C: 'DIREITA' };
const ranks = ['', 'COMUM', 'INCOMUM', 'RARO', 'ÉPICO', 'LENDÁRIO', 'MÍTICO'];
let cards = [], byId = {}, skills = {}, decks, config, game = null;
let battleFrame = 0, battleTimer = null;

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function art(unit) {
  return './' + (unit?.artAsset ?? byId[unit?.id]?.artAsset ?? '');
}
function cardView(value, extra = '') {
 const unit=typeof value==='string'?byId[value]:value;
 const base=byId[unit.id]??unit;
 return `<div class="card impacto ${extra}" role="button" tabindex="0" data-inspect="${esc(unit.id)}" data-name="${esc(unit.name??base.name)}" data-atk="${Number(unit.atk)}" data-hp="${Number(unit.hp)}" aria-label="Consultar ${esc(base.name)}: ataque ${unit.atk}, vida ${unit.hp}">${impactoSvg(unit)}</div>`;
}
function miniCard(entry, player) {
 const base=byId[entry.id]??entry;
 return `<span class="mini-card impacto-mini p${player}" role="button" tabindex="0" data-inspect="${esc(entry.id)}" data-atk="${Number(entry.atk)}" data-hp="${Number(entry.hp)}" aria-label="Consultar ${esc(base.name)}: ataque ${entry.atk}, vida ${entry.hp}">${impactoSvg(entry,true)}</span>`;
}
function header(phase) {
  const players = game?.players;
  return `<header class="topbar"><div class="brand"><span class="brand-mark">✦</span><span>DUCKS <em>N</em><br><strong>ROBOTS</strong></span></div>
    <div class="header-center"><span class="eyebrow">RODADA ${game?.round ?? '—'}</span><span class="phase-name">${phase}</span></div>
    <div class="version">${VERSION}</div></header>
    ${players ? `<div class="scoreboard">
      <div class="score p0"><span>${names[0]}</span><strong>♥ ${players[0].lives} <i>•</i> ✦ ${players[0].medals}</strong></div>
      <div class="score-divider">VS</div>
      <div class="score p1"><span>${names[1]}</span><strong>♥ ${players[1].lives} <i>•</i> ✦ ${players[1].medals}</strong></div>
    </div>` : ''}`;
}
function collection(){return `${header('COLEÇÃO IMPACTO')}<main class="screen"><h1>50 personagens</h1><p class="card-legend">ATK à esquerda · VIDA à direita · Clique para consultar nome e habilidade</p><p><a href="./index.html">← Jogar</a></p><div class="collection">${cards.map(c=>cardView(c)).join('')}</div></main>`;}
function intro() {
  return `${header('DUELO LOCAL')}<main class="intro screen">
    <div class="intro-art left"><img src="${esc(art(byId['01']))}" alt="" /></div>
    <div class="intro-art right"><img src="${esc(art(byId['50']))}" alt="" /></div>
    <p class="eyebrow">50 PERSONAGENS · 3 ZONAS · 1 VENCEDOR</p>
    <h1>DUCKS <small>N</small><br><em>ROBOTS</em></h1>
    <p class="intro-copy">Monte seu baralho, escolha a ordem dos combatentes e acompanhe as habilidades automáticas em três zonas independentes.</p>
    <button class="primary large" data-action="start">JOGAR <span>➜</span></button>
    <a class="design-link" href="./colecao.html">VER AS 50 CARTAS ↗</a><p class="quiet">A Zona B desempata quando os jogadores vencem a mesma quantidade de zonas.</p>
  </main>`;
}
function draft() {
  const player = game.players[0];
  const choosing = game.draftChoice === null;
  const option = draftOptions(game, config)[game.draftChoice];
  return `${header('ESCOLHA DE CARTAS')}<main class="screen shop-screen"><p class="card-legend">Amarelo à esquerda: ATK · Coral à direita: VIDA · Clique na arte para consultar</p>
    <div class="section-title"><div><p class="eyebrow">RODADA ${game.round} · BARALHO ${player.deck.length} CARTAS</p>
      <h1>${choosing ? 'Escolha um pacote' : `Escolha ${option.rank ? 'uma carta' : 'uma carta livre'}`}</h1>
      <p>${choosing ? 'As cartas escolhidas ficam no baralho nas próximas rodadas.' : `Escolha ${option.count - game.picksRemaining + 1} de ${option.count} · cinco opções diferentes`}</p></div></div>
    ${choosing ? `<div class="package-options">${draftOptions(game, config).map((pack, index) => `<button class="package-option rank-${pack.rank ?? 0}" data-action="package" data-index="${index}"><small>OPÇÃO ${'ABC'[index]}</small><strong>${pack.count} ${pack.rank ? ranks[pack.rank] : 'DE QUALQUER RARIDADE'}</strong><span>ESCOLHER ➜</span></button>`).join('')}</div>`
      : `<div class="offers">${game.offers.map((id, index) => `<div class="offer">${cardView(id)}<button class="offer-price" data-action="pick" data-index="${index}">ESCOLHER CARTA</button></div>`).join('')}</div>`}
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
  const who = game.turn, draw = currentCard(game), id = draw?.id;
  return `${header('POSICIONAMENTO')}<main class="screen placement-screen">
    <div class="section-title"><div><p class="eyebrow">ESCOLHA UMA ZONA</p>
      <h1>Vez do <span class="player-color p${who}">${names[who]}</span></h1>
      <p>Toque em uma zona ou arraste a carta. Os combatentes lutam na ordem em que foram posicionados.</p></div>
      <div class="remaining"><b>${game.queues[0].length} A</b><b>${game.queues[1].length} BOT</b><small>RESTANTES</small></div></div>
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
  if (event.type === 'bench') return `${names[event.player]}: arquibancada atualizada`;
  if (event.type === 'bench_full') return 'ARQUIBANCADA LOTADA';
  if (event.type === 'stalemate') return 'A zona terminou sem avanço no combate';
  return '';
}
function benchView(player, events) {
  const counts = {};
  for (const event of events) if (event.type === 'bench' && event.player === player) counts[event.id] = event.count;
  const entries = Object.entries(counts);
  return `<div class="bench ${entries.length >= 8 ? 'bench-alert' : ''}"><div class="bench-title"><b>${names[player]}</b><span>ARQUIBANCADA ${entries.length}/${BENCH_CAPACITY}</span></div>
    <div class="bench-slots">${Array.from({ length: BENCH_CAPACITY }, (_, index) => {
      const [id, count] = entries[index] ?? [];
      return id ? `<span class="bench-slot filled" title="${esc(byId[id]?.name)} ×${count}">${miniCard(byId[id],player)}<b>×${count}</b></span>` : '<span class="bench-slot"></span>';
    }).join('')}</div></div>`;
}
function battle() {
  const all = game.battle.events, done = battleFrame >= all.length;
  const event = all[Math.min(battleFrame, all.length - 1)];
  const completed = game.battle.territories.filter(result => {
    const index = all.findIndex(item => item.type === 'territory' && item.territory === result.territory);
    return index >= 0 && index < battleFrame;
  });
  let center;
  if (done) center = `<div class="battle-message ${game.battle.overflow ? 'bench-defeat' : ''}"><span class="battle-spark">${game.battle.overflow ? '!' : '✦'}</span><h2>${game.battle.overflow ? 'Arquibancada lotada' : 'Confronto encerrado'}</h2><p>${game.battle.overflow ? 'O limite de 10 personagens diferentes foi ultrapassado.' : 'As três zonas foram resolvidas.'}</p></div>`;
  else if (event.type === 'strike') center = `<div class="duel"><div class="fighter p0">${cardView(event.left)}
    <div class="combat-hp">♥ ${event.left.hp} <small>−${event.leftDamage}</small></div></div>
    <div class="impact">⚔</div><div class="fighter p1">${cardView(event.right)}
    <div class="combat-hp">♥ ${event.right.hp} <small>−${event.rightDamage}</small></div></div></div>`;
  else if (event.type === 'territory') center = `<div class="battle-message"><span class="battle-spark">${event.territory}</span>
    <h2>${event.winner === null ? 'Zona empatada' : `${names[event.winner]} venceu a Zona ${event.territory}`}</h2></div>`;
  else center = `<div class="battle-message effect-${event.type}"><span class="battle-spark">${event.type === 'summon' ? '✦' : event.type === 'block' ? '◈' : event.type === 'buff' ? '↑' : event.type === 'skill_damage' ? '⚡' : '◆'}</span>
    <h2>${esc(eventText(event))}</h2></div>`;
  return `${header('BATALHA')}<main class="screen battle-screen">
    <div class="benches">${benchView(0, all.slice(0, battleFrame + (done ? 0 : 1)))}${benchView(1, all.slice(0, battleFrame + (done ? 0 : 1)))}</div>
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
    <p class="eyebrow">RODADA ${result.round} · ${result.overflow ? 'ARQUIBANCADA LOTADA' : result.tiebreak ? 'ZONA B DECIDIU' : 'CONFRONTO FINALIZADO'}</p>
    <h1>${title}</h1><p class="result-copy">${winner === null ? 'Ninguém ganhou medalha ou perdeu vida.' : `${names[winner]} ganhou 1 medalha. ${names[1 - winner]} perdeu 1 vida.`}</p>
    <div class="result-board">${result.territories.map(zone => `<div class="result-land land-${zone.territory}">
      <span>${zone.territory}</span><b>${zones[zone.territory]}</b><small>${zone.territory === 'B' ? 'DESEMPATE · ' : ''}${zone.winner === null ? 'EMPATE' : names[zone.winner]}</small></div>`).join('')}</div>
    <div class="final-score">${game.players.map((player, index) => `<div><span>${names[index]}</span>
      <strong>♥ ${player.lives} <i>✦</i> ${player.medals}</strong></div>`).join('')}</div>
    <button class="primary large" data-action="${isOver ? 'restart' : 'next-round'}">${isOver ? 'JOGAR NOVAMENTE' : 'PRÓXIMA RODADA'} ➜</button>
  </main>`;
}
function render() {
  app.innerHTML = !game ? (/\/colecao(?:\.html)?\/?$/.test(location.pathname) ? collection() : intro()) : game.phase === 'draft' ? draft() : game.phase === 'placement' ? placement() : game.phase === 'battle' ? battle() : results(game.phase === 'gameover');
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
function advanceBot() {
  if (game.phase === 'draft' && game.draftPlayer === 1) botDraft(game, cards, config, skills);
  while (game.phase === 'placement' && game.turn === 1) {
    placeCard(game, botZone(game, byId, skills), byId, skills);
  }
  if (game.phase === 'battle' && !game.battle) {
    resolveBattle(game, byId, skills);
    animateBattle();
    return true;
  }
  return false;
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
  }, 260);
}
function act(action, data = {}) {
  if (action === 'start' || action === 'restart') { clearInterval(battleTimer); game = createGame(cards, decks, config); }
  else if (action === 'package') choosePackage(game, Number(data.index), cards, config);
  else if (action === 'pick') chooseCard(game, Number(data.index), cards, config);
  else if (action === 'place') {
    placeCard(game, data.territory, byId, skills);
  } else if (action === 'skip') { clearInterval(battleTimer); battleFrame = game.battle.events.length; }
  else if (action === 'show-result') applyRoundResult(game, config);
  else if (action === 'next-round') nextRound(game, cards, config);
  if (advanceBot()) return;
  render();
}
app.addEventListener('click', event => {
  const inspect=event.target.closest('[data-inspect]');
  if(inspect){openDetail(inspect);return;}
  const button = event.target.closest('[data-action]');
  if (button && !button.disabled) act(button.dataset.action, button.dataset);
});

const detail=document.createElement('dialog');
detail.className='card-detail';document.body.append(detail);
function openDetail(el){
 const base=byId[el.dataset.inspect]??{id:el.dataset.inspect,name:el.dataset.name,atk:Number(el.dataset.atk),hp:Number(el.dataset.hp),rarity:'Invocação',rank:0,skillDescription:'Unidade invocada.',skillId:'—'};
 const current={...base,atk:Number(el.dataset.atk),hp:Number(el.dataset.hp)};
 detail.innerHTML=`<button class="detail-close" aria-label="Fechar detalhes">×</button><div class="detail-layout"><div class="detail-art">${impactoSvg(current)}</div><section><p class="eyebrow">CONSULTA DA CARTA</p><h2>${esc(base.name)}</h2><p>ATK ${current.atk} · VIDA ${current.hp}</p><p class="detail-base">Base: ATK ${base.atk} · VIDA ${base.hp}</p><p>${esc(base.rarity)} · Rank ${base.rank}</p><h3>Habilidade</h3><p>${esc(base.skillDescription)}</p><small>ID ${esc(base.id)} · ${esc(base.skillId)} · Custo individual não definido na base.</small></section></div>`;
 detail.querySelector('.detail-close').onclick=()=>detail.close();detail.showModal();
}
app.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)&&event.target.matches('[data-inspect]')){event.preventDefault();event.stopPropagation();openDetail(event.target);}});
try {
  const responses = await Promise.all([
    fetch('./data/cards.json'), fetch('./data/skills.json'),
    fetch('./data/baralhos-iniciais.json'), fetch('./data/config.json'),
  ]);
  if (!responses.every(response => response.ok)) throw new Error('Falha ao carregar dados');
  [cards, skills, decks, config] = await Promise.all(responses.map(response => response.json()));
  byId = Object.fromEntries(cards.map(card => [card.id, card]));
  render();
} catch (error) {
  app.innerHTML = '<main class="screen error"><h1>Não foi possível abrir o jogo</h1><p>Recarregue a página e confira os arquivos publicados.</p></main>';
  console.error(error);
}
