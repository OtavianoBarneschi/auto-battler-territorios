import { impactoSvg } from './impacto.mjs';
import {
  VERSION, TERRITORIES, BENCH_CAPACITY, createGame, draftOptions, choosePackage,
  chooseCard, botDraft, botZone, currentCard, placeCard, resolveBattle, applyRoundResult, nextRound,
  deckRemovalStatus, removeCardFromDeck,
} from './engine.mjs';

const app = document.querySelector('#app');
const names = ['JOGADOR A', 'BOT'];
const zones = { A: 'ESQUERDA', B: 'CENTRO', C: 'DIREITA' };
const ranks = ['', 'COMUM', 'INCOMUM', 'RARO', 'ÉPICO', 'LENDÁRIO', 'MÍTICO'];
let cards = [], byId = {}, skills = {}, decks, config, game = null;
let battleFrame = 0, battleTimer = null;
let collectionFaction='all', collectionRank=0;

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
  return `<header class="topbar"><div class="brand"><span class="brand-mark" aria-hidden="true">⚙</span><span>DUCKS <em>N</em><br><strong>ROBOTS</strong></span></div>
    <div class="header-center"><span class="eyebrow">RODADA ${game?.round ?? '—'}</span><span class="phase-name">${phase}</span></div>
    <div class="version"><span class="system-online"></span>${VERSION}</div></header>
    ${players ? `<div class="scoreboard">
      <div class="score p0"><span>${names[0]}</span><strong>♥ ${players[0].lives} <i>•</i> ✦ ${players[0].medals}</strong></div>
      <div class="score-divider">VS</div>
      <div class="score p1"><span>${names[1]}</span><strong>♥ ${players[1].lives} <i>•</i> ✦ ${players[1].medals}</strong></div>
    </div>` : ''}`;
}
function collection(){
 const visible=cards.filter(c=>(collectionFaction==='all'||(collectionFaction==='ducks'?Number(c.id)<=25:Number(c.id)>25))&&(!collectionRank||c.rank===collectionRank));
 return `${header('COLEÇÃO')}<main class="screen collection-screen"><div class="collection-head"><div><p class="eyebrow">ARQUIVO DE PERSONAGENS / 050</p><h1>COLEÇÃO <span class="collection-counter">${visible.length} / 50</span></h1><p>Explore o elenco. Clique em uma carta para consultar sua habilidade.</p></div><a class="back-link" href="./index.html">← MENU PRINCIPAL</a></div>
 <div class="collection-console"><div class="filter-set">${[['all','TODOS'],['ducks','PATOS'],['robots','ROBÔS']].map(([key,label])=>`<button class="filter-chip ${collectionFaction===key?'is-active':''}" data-faction="${key}">${label}</button>`).join('')}</div><div class="filter-set rarity-filter">${[0,1,2,3,4,5,6].map(rank=>`<button class="filter-chip ${collectionRank===rank?'is-active':''}" data-rarity-filter="${rank}" title="${rank?ranks[rank]:'Todas as raridades'}">${rank===0?'TODAS':rank<=3?'★'.repeat(rank):'♛'}</button>`).join('')}</div></div>
 <div class="collection-stage"><div class="collection">${visible.map(c=>cardView(c)).join('')}</div></div></main>`;
}
function intro() {
  return `${header('DUELO LOCAL')}<main class="intro screen tech-hero">
    <div class="intro-art left"><img src="${esc(art(byId['07']))}" alt="" /></div>
    <div class="intro-art right"><img src="${esc(art(byId['49']))}" alt="" /></div>
    <p class="eyebrow">PROTOCOLO DE ARENA · 3 FRENTES</p>
    <h1 class="hero-logo">DUCKS <small>N</small><br><em>ROBOTS</em></h1>
    <p class="intro-copy">Monte seu baralho. Domine as três frentes. Conquiste sete medalhas.</p>
    <button class="primary large" data-action="start">JOGAR <span>▶</span></button>
    <div class="hero-subnav"><a class="design-link" href="./colecao.html">▤ COLEÇÃO</a><button class="hero-help" data-action="rules">◎ REGRAS</button></div><p class="quiet">7 MEDALHAS PARA VENCER · 3 VIDAS POR JOGADOR</p>
  </main>`;
}
function draft() {
  const player = game.players[0];
  const choosing = game.draftChoice === null;
  const option = draftOptions(game, config)[game.draftChoice];
  return `${header('ESCOLHA DE CARTAS')}<main class="screen shop-screen tech-shop"><p class="card-legend">Amarelo à esquerda: ATK · Coral à direita: VIDA · Clique na arte para consultar</p>
    <div class="section-title"><div><p class="eyebrow">RODADA ${game.round} · BARALHO ${player.deck.length} CARTAS</p>
      <h1>${choosing ? 'ESCOLHA UM PACOTE' : 'ESCOLHA UMA CARTA'}</h1>
      <p>${choosing ? 'Selecione uma cápsula de recompensa para reforçar seu baralho.' : `Escolha ${option.count - game.picksRemaining + 1} de ${option.count} · cinco opções diferentes`}</p></div></div>
    <div class="shop-workbench"><button class="recycle-station ${deckRemovalStatus(game,config).available?'':'station-locked'}" data-action="recycle-open" ${deckRemovalStatus(game,config).available?'':'disabled'} aria-label="Abrir estação de reciclagem para remover uma carta"><span class="station-icon" aria-hidden="true"><svg viewBox="0 0 80 80"><path d="M28 13H52L60 25L69 49L55 65H25L11 49L20 25Z" fill="none" stroke="currentColor" stroke-width="4"/><path d="M40 17L52 36H29ZM18 48L40 48L30 64ZM60 47L47 64L40 42Z" fill="currentColor" opacity=".8"/><circle cx="40" cy="40" r="7" fill="currentColor"/></svg></span><span class="station-copy"><small>ESTAÇÃO DE RECICLAGEM · SERVIÇO</small><strong>REMOVER 1 CARTA</strong><span>${deckRemovalStatus(game,config).remaining? (game.draftChoice!==null&&game.picksRemaining===1?'GRÁTIS · USE ANTES DA ÚLTIMA ESCOLHA':'GRÁTIS · '+deckRemovalStatus(game,config).remaining+' DISPONÍVEL'):'UTILIZADO NESTA RODADA'}</span></span><span class="station-arrow" aria-hidden="true">${deckRemovalStatus(game,config).available?'➜':'✓'}</span></button>
    <details class="deck-panel deck-console"><summary><span class="eyebrow">SEU BARALHO</span><strong>${player.deck.length} CARTAS</strong><span class="deck-toggle">VER BARALHO ▾</span></summary>
      <div class="deck-list">${Object.entries(player.deck.reduce((all, id) => (all[id] = (all[id] || 0) + 1, all), {}))
        .map(([id, count]) => `<span>${esc(byId[id].name)} <b>×${count}</b></span>`).join('')}</div></details></div>
    ${choosing ? `<div class="package-options">${draftOptions(game, config).map((pack, index) => `<button class="package-option rank-${pack.rank ?? 0}" data-action="package" data-index="${index}"><small class="package-index">CÁPSULA ${'ABC'[index]}</small><span class="pack-object"><span class="pack-seal">${pack.rank>=4?'♛':pack.rank?'★':'✦'}</span><i></i></span><strong>${pack.count} ${pack.rank?ranks[pack.rank]:'LIVRES'}</strong><span class="pack-action">ABRIR PACOTE ➜</span></button>`).join('')}</div>`
      : `<div class="offers tech-offers">${game.offers.map((id, index) => `<div class="offer">${cardView(id)}<button class="offer-price" data-action="pick" data-index="${index}">SELECIONAR ➜</button></div>`).join('')}</div>`}

  </main>`;
}
function zoneHeading(zone) {
  return `<span class="zone-mark">${zone}</span><span><b>ZONA ${zone}</b><small>${zones[zone]}</small></span>
    ${zone === 'B' ? '<span class="tiebreak-badge">DESEMPATE</span>' : ''}`;
}
function placement() {
  const who = game.turn, draw = currentCard(game), id = draw?.id;
  return `${header('POSICIONAMENTO')}<main class="screen placement-screen tech-placement">
    <div class="section-title"><div><p class="eyebrow">ESCOLHA UMA ZONA</p>
      <h1>POSICIONE SUA CARTA <span class="turn-chip p${who}">${names[who]}</span></h1>
      <p>Toque em uma frente ou arraste a carta para posicionar.</p></div>
      <div class="remaining"><b>${game.queues[0].length} A</b><b>${game.queues[1].length} BOT</b><small>RESTANTES</small></div></div>
    <div class="placement-layout"><div class="current-panel"><p class="eyebrow">CARTA ATUAL</p>
      <div class="draggable" draggable="true">${cardView(id, 'active-card')}</div>
      <small>${game.players[who].deck.length - game.queues[who].length} / ${game.players[who].deck.length}</small>
    </div><div class="territories tech-territories">${TERRITORIES.map(zone => `<button class="territory land-${zone}" data-action="place" data-territory="${zone}">
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
    <div class="impact">VS</div><div class="fighter p1">${cardView(event.right)}
    <div class="combat-hp">♥ ${event.right.hp} <small>−${event.rightDamage}</small></div></div></div>`;
  else if (event.type === 'territory') center = `<div class="battle-message"><span class="battle-spark">${event.territory}</span>
    <h2>${event.winner === null ? 'Zona empatada' : `${names[event.winner]} venceu a Zona ${event.territory}`}</h2></div>`;
  else center = `<div class="battle-message effect-${event.type}"><span class="battle-spark">${event.type === 'summon' ? '✦' : event.type === 'block' ? '◈' : event.type === 'buff' ? '↑' : event.type === 'skill_damage' ? '⚡' : '◆'}</span>
    <h2>${esc(eventText(event))}</h2></div>`;
  return `${header('BATALHA')}<main class="screen battle-screen tech-battle">
    <div class="benches">${benchView(0, all.slice(0, battleFrame + (done ? 0 : 1)))}${benchView(1, all.slice(0, battleFrame + (done ? 0 : 1)))}</div>
    <div class="battle-progress tech-progress">${TERRITORIES.map(zone => `<span class="${completed.some(item => item.territory === zone) ? 'complete' : !done && event.territory === zone ? 'current' : ''}">${zone} ${zone === 'B' ? '<small>DESEMPATE</small>' : ''}</span>`).join('')}</div>
    <p class="eyebrow battle-label">${done ? 'FIM DA BATALHA' : `ZONA ${event.territory} · ${zones[event.territory]}`}</p>
    <div class="combat-stage">${center}</div><div class="battle-footer"><p>${done ? `${game.battle.wins[0]} × ${game.battle.wins[1]} zonas` : 'COMBATE EM ANDAMENTO'}</p>
      ${done ? '<button class="primary" data-action="show-result">VER RESULTADO ➜</button>' : '<button class="secondary quiet-button" data-action="skip">PULAR ANIMAÇÃO</button>'}</div>
  </main>`;
}
function results(isOver) {
  const result = game.result, winner = result.winner;
  const title = isOver ? `${names[game.champion]} VENCEU!` : winner === null ? 'RODADA EMPATADA' : `${names[winner]} VENCEU A RODADA`;
  return `${header(isOver ? 'FIM DE JOGO' : 'RESULTADO')}<main class="screen result-screen tech-results">
    <div class="result-crest"><span>${isOver ? '♛' : winner === null ? '◇' : '✦'}</span></div>
    <p class="eyebrow">RODADA ${result.round} · ${result.overflow ? 'ARQUIBANCADA LOTADA' : result.tiebreak ? 'ZONA B DECIDIU' : 'CONFRONTO FINALIZADO'}</p>
    <h1>${title}</h1><p class="result-copy">${winner === null ? 'Ninguém ganhou medalha ou perdeu vida.' : `${names[winner]} ganhou 1 medalha. ${names[1 - winner]} perdeu 1 vida.`}</p>
    <div class="result-board tech-result-board">${result.territories.map(zone => `<div class="result-land land-${zone.territory}">
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
  else if (action === 'rules') { rulesDialog.showModal(); return; }
  else if (action === 'recycle-open') { openRecycleDialog(); return; }
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
  const factionButton=event.target.closest('[data-faction]');
  if(factionButton){collectionFaction=factionButton.dataset.faction;render();return;}
  const rarityButton=event.target.closest('[data-rarity-filter]');
  if(rarityButton){collectionRank=Number(rarityButton.dataset.rarityFilter);render();return;}
  const inspect=event.target.closest('[data-inspect]');
  if(inspect){openDetail(inspect);return;}
  const button = event.target.closest('[data-action]');
  if (button && !button.disabled) act(button.dataset.action, button.dataset);
});

let recycleSelectedId = null;
let recycleConfirming = false;
const recycleDialog = document.createElement('dialog');
recycleDialog.className = 'recycle-dialog';
document.body.append(recycleDialog);
function openRecycleDialog() {
 if (!game || !deckRemovalStatus(game,config).available) return;
 recycleSelectedId=null; recycleConfirming=false;
 renderRecycleDialog(); recycleDialog.showModal();
}
function renderRecycleDialog() {
 const deck=game.players[0].deck;
 const grouped=Object.entries(deck.reduce((map,id)=>(map[id]=(map[id]||0)+1,map),{}))
  .map(([id,count])=>({card:byId[id],count})).filter(entry=>entry.card)
  .sort((a,b)=>a.card.rank-b.card.rank||a.card.name.localeCompare(b.card.name,'pt-BR'));
 const chosen=recycleSelectedId?byId[recycleSelectedId]:null;
 const choiceGrid=grouped.map(({card,count})=>`<div class="recycle-item"><button type="button" class="recycle-choice ${recycleSelectedId===card.id?'is-selected':''}" data-recycle-select="${esc(card.id)}" aria-pressed="${recycleSelectedId===card.id}"><span class="recycle-choice-art">${impactoSvg(card)}</span><span class="recycle-choice-name">${esc(card.name)}</span><span class="recycle-copy">×${count}</span></button><button type="button" class="recycle-inspect" data-recycle-inspect="${esc(card.id)}" aria-label="Inspecionar ${esc(card.name)}">VER HABILIDADE ↗</button></div>`).join('');
 const selection=chosen?`<div class="recycle-selected-art">${impactoSvg(chosen)}</div><h3>${esc(chosen.name)}</h3><p class="recycle-selected-rarity">${esc(chosen.rarity)}</p><p class="recycle-skill">${esc(chosen.skillDescription)}</p><div class="recycle-cost"><span>SERVIÇO</span><strong>GRÁTIS</strong></div>`:`<div class="recycle-placeholder"><span class="recycle-orbit" aria-hidden="true">◇</span><h3>SELECIONE UMA CARTA</h3><p>Escolha uma carta do baralho para reciclar uma cópia.</p></div>`;
 const confirmation = recycleConfirming && chosen ? `<div class="recycle-confirm" role="group" aria-label="Confirmar remoção"><strong>REMOVER ${esc(chosen.name)}?</strong><p>A carta sairá permanentemente do seu baralho nesta partida. Esta ação não pode ser desfeita.</p><div class="recycle-confirm-actions"><button type="button" class="recycle-cancel" data-recycle-back>VOLTAR</button><button type="button" class="recycle-commit" data-recycle-commit>CONFIRMAR REMOÇÃO</button></div></div>` : `<button type="button" class="recycle-primary" data-recycle-intent ${chosen?'':'disabled'}>RECICLAR 1 CARTA <span>➜</span></button>`;
 recycleDialog.innerHTML=`<div class="recycle-shell"><header class="recycle-header"><span class="recycle-header-mark" aria-hidden="true">⌬</span><div><p class="eyebrow">SERVIÇO DA OFICINA / DECKBUILDING</p><h2>ESTAÇÃO DE RECICLAGEM</h2><p>Remova uma carta para refinar seu baralho.</p></div><button type="button" class="recycle-close" data-recycle-close aria-label="Fechar estação">×</button></header><div class="recycle-info-strip"><span>BARALHO <b>${deck.length} CARTAS</b></span><span>REMOÇÕES DISPONÍVEIS <b>${deckRemovalStatus(game,config).remaining}</b></span><span>CUSTO <b>GRÁTIS</b></span></div><div class="recycle-main"><section class="recycle-library" aria-label="Escolher carta para reciclar"><div class="recycle-library-title"><h3>SEU BARALHO</h3><small>1 CÓPIA POR SERVIÇO</small></div><div class="recycle-grid">${choiceGrid}</div></section><aside class="recycle-focus" aria-live="polite"><p class="eyebrow">CARTA SELECIONADA</p>${selection}${confirmation}</aside></div><footer class="recycle-footer"><span>⚠ UMA REMOÇÃO POR ETAPA DE COMPRA. AS CARTAS RESTANTES CONTINUAM NO BARALHO.</span></footer></div>`;
}
recycleDialog.addEventListener('click',event=>{
 const target=event.target;
 if(target.closest('[data-recycle-close]')){recycleDialog.close();return;}
 const inspect=target.closest('[data-recycle-inspect]');
 if(inspect){const card=byId[inspect.dataset.recycleInspect];if(card)openDetail({dataset:{inspect:card.id,atk:card.atk,hp:card.hp}});return;}
 const select=target.closest('[data-recycle-select]');
 if(select){recycleSelectedId=select.dataset.recycleSelect;recycleConfirming=false;renderRecycleDialog();recycleDialog.querySelector('[data-recycle-intent]')?.focus();return;}
 if(target.closest('[data-recycle-intent]')){if(!recycleSelectedId)return;recycleConfirming=true;renderRecycleDialog();recycleDialog.querySelector('[data-recycle-commit]')?.focus();return;}
 if(target.closest('[data-recycle-back]')){recycleConfirming=false;renderRecycleDialog();recycleDialog.querySelector('[data-recycle-intent]')?.focus();return;}
 if(target.closest('[data-recycle-commit]')){
  if(!recycleConfirming||!recycleSelectedId)return;
  const name=byId[recycleSelectedId]?.name || 'Carta';
  const success=removeCardFromDeck(game,recycleSelectedId,config);
  recycleDialog.close(); recycleSelectedId=null; recycleConfirming=false;
  render();
  if(success){const toast=document.createElement('div');toast.className='recycle-toast';toast.setAttribute('role','status');toast.textContent='✓ '+name+' reciclado · Baralho refinado';document.body.append(toast);toast.addEventListener('animationend',()=>toast.remove(),{once:true});}
 }
});

const detail=document.createElement('dialog');
detail.className='card-detail tech-detail';document.body.append(detail);
const rulesDialog=document.createElement('dialog');
rulesDialog.className='rules-detail tech-detail';
document.body.append(rulesDialog);
rulesDialog.innerHTML='<button class="detail-close" aria-label="Fechar regras">×</button><div class="rules-inner"><span class="eyebrow">MANUAL DA ARENA</span><h2>COMO JOGAR</h2><div class="rules-grid"><article><b>01</b><h3>ESCOLHA</h3><p>Selecione pacotes e adicione cartas ao baralho entre as rodadas.</p></article><article><b>02</b><h3>POSICIONE</h3><p>Distribua as cartas entre as zonas A, B e C. A ordem de colocação define a ordem do combate.</p></article><article><b>03</b><h3>CONQUISTE</h3><p>Vença mais zonas para ganhar uma medalha e tirar uma vida do rival. A Zona B desempata.</p></article><article><b>04</b><h3>VENÇA</h3><p>Conquiste sete medalhas antes de perder três vidas.</p></article></div><button class="primary" id="close-rules">ENTENDI ✓</button></div>';
rulesDialog.querySelector('.detail-close').onclick=()=>rulesDialog.close();
rulesDialog.querySelector('#close-rules').onclick=()=>rulesDialog.close();
function openDetail(el){
 const base=byId[el.dataset.inspect]??{id:el.dataset.inspect,name:el.dataset.name,atk:Number(el.dataset.atk),hp:Number(el.dataset.hp),rarity:'Invocação',rank:0,skillDescription:'Unidade invocada.',skillId:'—'};
 const current={...base,atk:Number(el.dataset.atk),hp:Number(el.dataset.hp)};
 detail.innerHTML=`<button class="detail-close" aria-label="Fechar detalhes">×</button><div class="detail-layout"><div class="detail-art">${impactoSvg(current)}</div><section class="detail-info"><p class="eyebrow">ARQUIVO / PERSONAGEM ${esc(base.id)}</p><h2>${esc(base.name)}</h2><span class="detail-rank rank-${base.rank}">${esc(base.rarity)} · RANK ${base.rank}</span><div class="detail-stats"><span><small>ATK</small><strong>${current.atk}</strong></span><span><small>VIDA</small><strong>${current.hp}</strong></span></div><p class="detail-base">BASE: ATK ${base.atk} · VIDA ${base.hp}</p><div class="detail-skill"><h3>HABILIDADE</h3><p>${esc(base.skillDescription)}</p></div></section></div>`;
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
