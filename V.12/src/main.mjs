import { impactoSvg, updateImpactoStats, renderArtPath } from './impacto.mjs';
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
let battleFrame = 0, battleTimer = null, battleDisplay;
let draftIndex = 0, lastDeployment, collectionObserver;
const mobile = matchMedia('(max-width: 700px), (max-width: 1000px) and (max-height: 540px) and (orientation: landscape)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let collectionFaction='all', collectionRank=0;

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function art(unit) {
  return renderArtPath('./' + (unit?.artAsset ?? byId[unit?.id]?.artAsset ?? ''));
}
function cardView(value, extra = '', deferred = false) {
 const unit=typeof value==='string'?byId[value]:value;
 const base=byId[unit.id]??unit;
 return `<div class="card impacto ${extra}" role="button" tabindex="0" data-inspect="${esc(unit.id)}" data-name="${esc(unit.name??base.name)}" data-atk="${Number(unit.atk)}" data-hp="${Number(unit.hp)}" aria-label="Consultar ${esc(base.name)}: ataque ${unit.atk}, vida ${unit.hp}">${deferred ? '' : impactoSvg(unit)}</div>`;
}
function miniCard(entry, player) {
 const base=byId[entry.id]??entry;
 return `<span class="mini-card impacto-mini p${player}" role="button" tabindex="0" data-inspect="${esc(entry.id)}" data-name="${esc(entry.name??base.name)}" data-atk="${Number(entry.atk)}" data-hp="${Number(entry.hp)}" aria-label="Consultar ${esc(base.name)}: ataque ${entry.atk}, vida ${entry.hp}">${impactoSvg(entry,true)}</span>`;
}
function header(phase) {
  const players = game?.players;
  return `<header class="topbar"><div class="brand"><span class="brand-mark" aria-hidden="true">⚙</span><span>DUCKS <em>N</em><br><strong>ROBOTS</strong></span></div>
    <div class="header-center">${game ? `<span class="eyebrow">RODADA ${game.round}</span>` : ''}<span class="phase-name">${phase}</span></div>
    <div class="version"><span class="system-online"></span>${VERSION}</div></header>
    ${players ? `<div class="scoreboard">
      <div class="score p0"><span>${names[0]}</span><strong>♥ ${players[0].lives} <i>•</i> ✦ ${players[0].medals}</strong></div>
      <div class="score-divider">VS</div>
      <div class="score p1"><span>${names[1]}</span><strong>♥ ${players[1].lives} <i>•</i> ✦ ${players[1].medals}</strong></div>
    </div>` : ''}`;
}
function collection(){
 const visible=cards.filter(c=>(collectionFaction==='all'||(collectionFaction==='ducks'?Number(c.id)<=25:Number(c.id)>25))&&(!collectionRank||c.rank===collectionRank));
 return `${header('COLEÇÃO')}<main class="screen collection-screen"><div class="collection-head"><div><p class="eyebrow">ARQUIVO DE PERSONAGENS / 050</p><h1>COLEÇÃO <span class="collection-counter">${visible.length} / 50</span></h1><p>Toque em uma carta para consultar sua habilidade.</p></div><a class="back-link" href="./index.html">← MENU PRINCIPAL</a></div>
 <div class="collection-console"><div class="filter-set">${[['all','TODOS'],['ducks','PATOS'],['robots','ROBÔS']].map(([key,label])=>`<button class="filter-chip ${collectionFaction===key?'is-active':''}" data-faction="${key}" aria-pressed="${collectionFaction===key}">${label}</button>`).join('')}</div><div class="filter-set rarity-filter">${['TODAS', 'COMUM', 'INCOM.', 'RARO', 'ÉPICO', 'LEND.', 'MÍTICO'].map((label, rank)=>`<button class="filter-chip ${collectionRank===rank?'is-active':''}" data-rarity-filter="${rank}" aria-label="${rank?ranks[rank]:'Todas as raridades'}" aria-pressed="${collectionRank===rank}"><span class="full-rarity">${ranks[rank] || label}</span><span class="compact-rarity">${label}</span></button>`).join('')}</div></div>
 <div class="collection-stage"><div class="collection">${visible.map(c=>cardView(c, 'collection-card', true)).join('')}</div></div></main>`;
}
function intro() {
  return `${header('DUELO LOCAL')}<main class="intro screen tech-hero">
    <div class="hero-artwork" aria-hidden="true"><div class="intro-art left"><img src="${esc(art(byId['07']))}" alt="" /></div>
    <div class="intro-art right"><img src="${esc(art(byId['49']))}" alt="" /></div></div>
    <p class="eyebrow">PROTOCOLO DE ARENA · 3 FRENTES</p>
    <h1 class="hero-logo">DUCKS <small>N</small><br><em>ROBOTS</em></h1>
    <p class="intro-copy">Monte seu baralho. Domine as três frentes. Conquiste sete medalhas.</p>
    <div class="hero-actions"><button class="primary large" data-action="start">JOGAR <span>▶</span></button>
    <div class="hero-subnav"><a class="design-link" href="./colecao.html">▤ COLEÇÃO</a><button class="hero-help" data-action="rules">◎ REGRAS</button></div><p class="quiet">7 MEDALHAS PARA VENCER · 3 VIDAS POR JOGADOR</p></div>
  </main>`;
}
function draft() {
  const player = game.players[0];
  const options = draftOptions(game, config);
  const choosing = game.draftChoice === null;
  const removal = deckRemovalStatus(game, config);
  return `${header('OFICINA')}<main class="screen shop-screen tech-shop ${choosing ? 'shop-packages' : 'shop-cards'}">
    <div class="section-title shop-title"><div><p class="eyebrow">OFICINA DE REFORÇOS</p>
      <h1>${choosing ? 'ESCOLHA UM PACOTE' : 'ESCOLHA UMA CARTA'}</h1>
      <p>${choosing ? 'Abra um pacote para reforçar seu baralho.' : 'Compare as cartas e confira as habilidades antes de escolher.'}</p></div>
      ${choosing ? '' : `<span class="selection-meter"><strong>${game.picksRemaining}</strong> de ${options[game.draftChoice].count}<small>ESCOLHAS RESTANTES</small></span>`}</div>
    <div class="shop-workbench">
      <button class="recycle-station ${removal.available ? '' : 'station-locked'}" data-action="recycle-open" ${removal.available ? '' : 'disabled'} aria-label="Abrir estação de reciclagem">
        <span class="station-icon" aria-hidden="true">♻</span>
        <span class="station-copy"><small>ESTAÇÃO DE RECICLAGEM</small><strong>RECICLAR</strong><span>${!removal.remaining ? 'USADA NESTA RODADA' : !removal.available ? 'BARALHO NO MÍNIMO' : game.picksRemaining === 1 ? 'ANTES DA ÚLTIMA ESCOLHA' : '1 GRÁTIS'}</span></span>
      </button>
      <button class="deck-service" data-action="deck-open"><span aria-hidden="true">▤</span><span><strong>BARALHO</strong><small>${player.deck.length} CARTAS</small></span></button>
    </div>
    ${choosing ? `<div class="package-options">${options.map((pack, index) => `<button class="package-option rank-${pack.rank ?? 0}" data-action="package" data-index="${index}">
      <small class="package-index">CÁPSULA ${'ABC'[index]}</small><span class="pack-object" aria-hidden="true"><span class="pack-seal">${pack.rank >= 4 ? '♛' : pack.rank ? '★' : '✦'}</span><i></i></span>
      <strong>${pack.count} × ${pack.rank ? ranks[pack.rank] : 'LIVRE'}</strong><span class="pack-action">ABRIR <span aria-hidden="true">➜</span></span></button>`).join('')}</div>`
      : `<div class="offers tech-offers" aria-label="Cartas disponíveis">${game.offers.map((id, index) => `<article class="offer" data-offer="${index}">${cardView(id)}
      <p class="offer-name">${esc(byId[id].name)}</p><button class="offer-price" data-action="pick" data-index="${index}">SELECIONAR ➜</button></article>`).join('')}</div>
      <div class="draft-dock mobile-only"><div class="draft-steps" role="group" aria-label="Comparar cartas">
        ${game.offers.map((id, index) => `<button data-action="offer-focus" data-index="${index}" aria-label="Opção ${index + 1}, ${esc(byId[id].name)}" aria-pressed="${index === draftIndex}">${index + 1}</button>`).join('')}</div>
      <div class="draft-actions"><button class="secondary" data-action="offer-detail">HABILIDADE</button><button class="primary" data-action="pick" data-mobile-pick data-index="${draftIndex}">ESCOLHER ➜</button></div></div>`}
  </main>`;
}

function syncDraft(index, align = false) {
  const rail = app.querySelector('.tech-offers');
  if (!rail || !mobile.matches) return;
  const tiles = [...rail.children];
  const active = tiles[index];
  if (!active) return;
  if (align) {
    const target = rail.scrollLeft + active.getBoundingClientRect().left - rail.getBoundingClientRect().left - (rail.clientWidth - active.offsetWidth) / 2;
    rail.scrollTo({ left: target, behavior: 'instant' });
  }
  draftIndex = index;
  tiles.forEach((tile, i) => tile.classList.toggle('offer-focused', i === index));
  app.querySelector('[data-mobile-pick]').dataset.index = index;
  app.querySelectorAll('.draft-steps button').forEach((button, i) => button.setAttribute('aria-pressed', i === index));
}

function nearestOffer() {
  const rail = app.querySelector('.tech-offers');
  const center = rail.getBoundingClientRect().left + rail.clientWidth / 2;
  return [...rail.children].reduce((closest, tile, index) => {
    const box = tile.getBoundingClientRect();
    const distance = Math.abs(box.left + box.width / 2 - center);
    return distance < closest.distance ? { index, distance } : closest;
  }, { index: 0, distance: Infinity }).index;
}

function zoneHeading(zone) {
  return `<span class="zone-mark">${zone}</span><span class="zone-name"><b>ZONA ${zone}</b><small>${zones[zone]}</small></span>
    ${zone === 'B' ? '<span class="tiebreak-badge">DESEMPATE</span>' : ''}`;
}

function placement() {
  const who = game.turn;
  const card = byId[currentCard(game).id];
  const queue = game.queues[who].length;
  const total = game.players[who].deck.length;
  const effect = eventText(lastDeployment?.effect);
  return `${header('POSICIONAMENTO')}<main class="screen placement-screen tech-placement">
    <div class="section-title"><div><p class="eyebrow">TRÊS FRENTES</p>
      <h1>POSICIONE SUA CARTA <span class="turn-chip p${who}">${names[who]}</span></h1>
      <p>Toque em uma zona ou arraste a carta.</p></div>
      <div class="remaining"><b>${game.queues[0].length} VOCÊ</b><b>${game.queues[1].length} BOT</b><small>RESTANTES</small></div></div>
    <div class="placement-layout"><div class="current-panel"><p class="eyebrow">CARTA ATUAL</p>
      <div class="draggable" draggable="${!mobile.matches}">${cardView(card, 'active-card')}</div>
      <div class="current-info"><span class="current-count">${total - queue + 1} / ${total}</span><h2>${esc(card.name)}</h2>
        <button class="secondary" data-action="current-detail">HABILIDADE</button>
        <p class="deploy-status" role="status">${lastDeployment ? `${esc(lastDeployment.name)} → Zona ${lastDeployment.zone}` : 'Toque em A, B ou C.'}${effect ? `<small>✦ ${esc(effect)}</small>` : ''}</p>
      </div></div>
      <div class="territories tech-territories">${TERRITORIES.map(zone => `<section class="territory land-${zone} ${lastDeployment?.zone === zone ? 'just-deployed' : ''}">
        <div class="land-heading">${zoneHeading(zone)}</div>
        ${[0, 1].map(player => {
          const entries = game.placements[zone][player];
          return `<div class="lane"><div class="lane-label"><span>${player ? 'BOT' : 'VOCÊ'}</span><b>${entries.length}</b></div>
            <div class="lane-cards" data-lane="${zone}${player}" aria-label="${entries.length} cartas de ${player ? 'Bot' : 'você'} na zona ${zone}">${entries.map(entry => miniCard(entry, player)).join('') || '<span class="empty-slot">VAZIO</span>'}</div></div>`;
        }).join('')}
        <button class="zone-deploy" data-action="place" data-territory="${zone}" aria-label="Posicionar na zona ${zone}"><span>＋</span> POSICIONAR</button>
      </section>`).join('')}</div></div>
  </main>`;
}
function eventText(event) {
  if (!event) return '';
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
function battle() {
  return `${header('BATALHA')}<main class="screen battle-screen tech-battle">
    <div class="battle-progress tech-progress" aria-label="Progresso das zonas">${TERRITORIES.map(zone => `<span data-battle-zone="${zone}">${zone}${zone === 'B' ? '<small>DESEMPATE</small>' : ''}</span>`).join('')}</div>
    <p class="eyebrow battle-label"></p>
    <div class="combat-stage">
      <div class="duel" hidden>${[0, 1].map(player => `${player ? '<div class="impact" aria-hidden="true">VS</div>' : ''}<div class="fighter p${player}">
        <div class="fighter-card"></div><div class="fighter-name"></div>
        <div class="fighter-readout"><span class="fighter-atk"></span><span class="fighter-hp"></span></div>
        <div class="life-track" aria-hidden="true"><i></i></div><span class="damage-hit" aria-hidden="true"></span>
      </div>`).join('')}</div>
      <div class="battle-message" hidden><span class="battle-spark" aria-hidden="true"></span><h2></h2></div>
    </div>
    <p class="battle-report"></p>
    <button class="benches bench-console" data-action="bench-open" aria-label="Consultar arquibancada">
      ${[0, 1].map(player => `<span class="bench bench-${player}"><span class="bench-title"><b>${player ? 'BOT' : 'VOCÊ'}</b><span class="bench-counter">0/${BENCH_CAPACITY}</span></span>
        <span class="bench-marks" aria-hidden="true">${'<i></i>'.repeat(BENCH_CAPACITY)}</span></span>`).join('')}
      <span class="bench-caption">ARQUIBANCADA ↗</span>
    </button>
    <div class="battle-footer"><button class="secondary quiet-button" data-action="skip">PULAR ANIMAÇÃO</button></div>
  </main>`;
}

function paintFighter(player, unit, damage = 0) {
  const fighter = battleDisplay.fighters[player];
  const previous = battleDisplay.units[player];
  if (!previous || previous.id !== unit.id || previous.name !== unit.name) {
    fighter.querySelector('.fighter-card').innerHTML = cardView(unit);
    fighter.querySelector('.fighter-name').textContent = unit.name;
  } else if (previous.atk !== unit.atk || previous.hp !== unit.hp) {
    const card = fighter.querySelector('[data-inspect]');
    updateImpactoStats(card.querySelector('svg'), unit);
    card.dataset.atk = unit.atk;
    card.dataset.hp = unit.hp;
    card.setAttribute('aria-label', `Consultar ${unit.name}: ataque ${unit.atk}, vida ${unit.hp}`);
  }
  battleDisplay.units[player] = unit;
  fighter.querySelector('.fighter-atk').textContent = `ATK ${unit.atk}`;
  fighter.querySelector('.fighter-hp').textContent = `VIDA ${unit.hp}`;
  fighter.querySelector('.life-track i').style.transform = `scaleX(${Math.max(0, Math.min(1, unit.hp / (unit.maxHp || 1)))})`;
  const hit = fighter.querySelector('.damage-hit');
  hit.textContent = damage ? `−${damage}` : '';
  for (const element of [hit, fighter.querySelector('.fighter-card')]) element.getAnimations().forEach(animation => animation.cancel());
  if (damage && !reducedMotion.matches) {
    hit.animate([{ opacity: 0.6, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(-9px)' }], { duration: 210, fill: 'both' });
    fighter.querySelector('.fighter-card').animate([{ transform: 'translateX(0)' }, { transform: `translateX(${player ? 5 : -5}px) rotate(${player ? 1.5 : -1.5}deg)` }, { transform: 'translateX(0)' }], { duration: 160 });
  }
}

function paintBench(player) {
  const bench = app.querySelector(`.bench-${player}`);
  const size = battleDisplay.bench[player].size;
  bench.classList.toggle('bench-alert', size >= 8);
  bench.querySelector('.bench-counter').textContent = `${size}/${BENCH_CAPACITY}`;
  [...bench.querySelectorAll('.bench-marks i')].forEach((mark, i) => mark.classList.toggle('filled', i < size));
}

function showBattleMessage(icon, text) {
  battleDisplay.duel.hidden = true;
  battleDisplay.message.hidden = false;
  battleDisplay.message.querySelector('.battle-spark').textContent = icon;
  battleDisplay.message.querySelector('h2').textContent = text;
}

function paintBattleEvent(event) {
  const { duel, message, report, label, progress, bench } = battleDisplay;
  const zone = event.territory;
  if (battleDisplay.zone !== zone) {
    battleDisplay.zone = zone;
    battleDisplay.units = [null, null];
    const [left, right] = game.placements[zone].map(side => side[0]);
    report.textContent = '';
    if (left && right) {
      paintFighter(0, left);
      paintFighter(1, right);
      duel.hidden = false;
      message.hidden = true;
    } else {
      showBattleMessage(zone, `Zona ${zone}`);
    }
    label.textContent = `ZONA ${zone} · ${zones[zone]}`;
    for (const item of progress) {
      const active = item.dataset.battleZone === zone;
      item.classList.toggle('current', active);
      if (active) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    }
  }
  if (event.type === 'strike') {
    paintFighter(0, event.left, event.leftDamage);
    paintFighter(1, event.right, event.rightDamage);
    duel.hidden = false;
    message.hidden = true;
    if (battleDisplay.effectUntil <= battleFrame) report.textContent = '';
  } else if (event.type === 'territory') {
    const zoneItem = progress.find(item => item.dataset.battleZone === zone);
    zoneItem.classList.add('complete');
    zoneItem.classList.remove('current');
    zoneItem.removeAttribute('aria-current');
    showBattleMessage(zone, event.winner === null ? 'Zona empatada' : `${names[event.winner]} venceu a Zona ${zone}`);
    report.textContent = '';
  } else if (event.type === 'bench') {
    bench[event.player].set(event.id, event.count);
    paintBench(event.player);
  } else if (event.type !== 'faint') {
    report.textContent = '✦ ' + eventText(event);
    battleDisplay.effectUntil = battleFrame + 2;
  }
}

function finishAnimation() {
  clearTimeout(battleTimer);
  battleTimer = null;
  battleFrame = game.battle.events.length;
  battleDisplay.bench = game.battle.bench.map(entries => new Map(Object.entries(entries)));
  [0, 1].forEach(paintBench);
  for (const item of battleDisplay.progress) {
    item.classList.remove('current');
    item.removeAttribute('aria-current');
    item.classList.toggle('complete', game.battle.events.some(event => event.type === 'territory' && event.territory === item.dataset.battleZone));
  }
  const overflow = game.battle.overflow;
  showBattleMessage(overflow ? '!' : '✦', overflow ? 'Arquibancada lotada' : 'Confronto encerrado');
  battleDisplay.label.textContent = 'FIM DA BATALHA';
  battleDisplay.report.textContent = overflow ? 'Limite de 10 personagens diferentes ultrapassado.' : `${game.battle.wins[0]} × ${game.battle.wins[1]} zonas`;
  const button = app.querySelector('.battle-footer button');
  button.className = 'primary';
  button.dataset.action = 'show-result';
  button.textContent = 'VER RESULTADO ➜';
}

function playBattleFrame() {
  if (document.hidden || document.querySelector('dialog[open]')) return;
  const events = game.battle.events;
  const event = events[battleFrame++];
  if (!event) { finishAnimation(); return; }
  paintBattleEvent(event);
  const delay = event.type === 'strike' ? 300 : event.type === 'territory' ? 460 : ['bench', 'faint'].includes(event.type) ? 70 : 360;
  battleTimer = setTimeout(() => {
    battleTimer = null;
    playBattleFrame();
  }, delay);
}

function resumeBattle() {
  if (game?.phase === 'battle' && battleTimer === null && app.querySelector('[data-action="skip"]')) playBattleFrame();
}
document.addEventListener('visibilitychange', resumeBattle);
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
  const previous = app.querySelector('main')?.className;
  const laneScroll = new Map([...app.querySelectorAll('[data-lane]')].map(lane => [lane.dataset.lane, lane.scrollLeft]));
  collectionObserver?.disconnect();
  app.innerHTML = !game ? (/\/colecao(?:\.html)?\/?$/.test(location.pathname) ? collection() : intro()) : game.phase === 'draft' ? draft() : game.phase === 'placement' ? placement() : game.phase === 'battle' ? battle() : results(game.phase === 'gameover');
  if (previous !== app.querySelector('main')?.className) window.scrollTo(0, 0);
  if (game?.phase === 'placement') {
    const drag = app.querySelector('.draggable');
    drag.addEventListener('dragstart', event => { event.dataTransfer.setData('text/plain', 'card'); event.dataTransfer.effectAllowed = 'move'; });
    for (const zone of app.querySelectorAll('.territory')) {
      zone.addEventListener('dragover', event => { event.preventDefault(); zone.classList.add('drag-hover'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('drag-hover'));
      zone.addEventListener('drop', event => {
        event.preventDefault();
        zone.classList.remove('drag-hover');
        if (event.dataTransfer.getData('text/plain') === 'card') act('place', zone.querySelector('[data-territory]').dataset);
      });
    }
    for (const lane of app.querySelectorAll('[data-lane]')) {
      lane.scrollLeft = lane.dataset.lane === `${lastDeployment?.zone}0` ? lane.scrollWidth : laneScroll.get(lane.dataset.lane) ?? 0;
    }
  }
  const rail = app.querySelector('.tech-offers');
  if (rail) {
    syncDraft(draftIndex, true);
    let pending = false;
    rail.addEventListener('scroll', () => {
      if (!mobile.matches || pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        if (rail.isConnected && mobile.matches) syncDraft(nearestOffer());
      });
    }, { passive: true });
  }
  const collectionCards = app.querySelectorAll('.collection-card');
  if (collectionCards.length) {
    collectionObserver = new IntersectionObserver(entries => {
      for (const { isIntersecting, target } of entries) {
        if (!isIntersecting) continue;
        target.innerHTML = impactoSvg(byId[target.dataset.inspect]);
        collectionObserver.unobserve(target);
      }
    }, { rootMargin: '240px' });
    collectionCards.forEach(card => collectionObserver.observe(card));
  }
}

mobile.addEventListener('change', () => {
  if (app.querySelector('.draggable')) app.querySelector('.draggable').draggable = !mobile.matches;
  if (app.querySelector('.tech-offers')) syncDraft(draftIndex, true);
});
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
  clearTimeout(battleTimer);
  battleTimer = null;
  battleFrame = 0;
  render();
  battleDisplay = {
    zone: null, units: [null, null], effectUntil: 0, bench: [new Map(), new Map()],
    duel: app.querySelector('.duel'), message: app.querySelector('.battle-message'),
    report: app.querySelector('.battle-report'), label: app.querySelector('.battle-label'),
    fighters: [...app.querySelectorAll('.fighter')], progress: [...app.querySelectorAll('[data-battle-zone]')],
  };
  playBattleFrame();
}

function act(action, data = {}) {
  if (action === 'rules') { rulesDialog.showModal(); return; }
  if (action === 'recycle-open' || action === 'deck-open') { openRecycleDialog(action === 'recycle-open'); return; }
  if (action === 'bench-open') { openBench(); return; }
  if (action === 'offer-focus') { syncDraft(Number(data.index), true); return; }
  if (action === 'offer-detail') { openDetail(app.querySelector(`[data-offer="${draftIndex}"] [data-inspect]`)); return; }
  if (action === 'current-detail') { openDetail(app.querySelector('.active-card')); return; }
  if (action === 'skip') { finishAnimation(); return; }

  if (action === 'start' || action === 'restart') {
    clearTimeout(battleTimer);
    game = createGame(cards, decks, config);
    lastDeployment = null;
    draftIndex = 0;
  } else if (action === 'package') {
    if (!choosePackage(game, Number(data.index), cards, config)) return;
    draftIndex = 0;
  } else if (action === 'pick') {
    if (!chooseCard(game, Number(data.index), cards, config)) return;
    draftIndex = 0;
  } else if (action === 'place') {
    const card = byId[currentCard(game)?.id];
    if (!card || !placeCard(game, data.territory, byId, skills)) return;
    lastDeployment = { name: card.name, zone: data.territory, effect: game.lastPlacementEvents.at(-1) };
  } else if (action === 'show-result') {
    applyRoundResult(game, config);
    battleDisplay = null;
  } else if (action === 'next-round') {
    nextRound(game, cards, config);
    lastDeployment = null;
    draftIndex = 0;
  }
  if (advanceBot()) return;
  render();
}

app.addEventListener('click', event => {
  const factionButton=event.target.closest('[data-faction]');
  if(factionButton){collectionFaction=factionButton.dataset.faction;render();app.querySelector(`[data-faction="${collectionFaction}"]`).focus({preventScroll:true});return;}
  const rarityButton=event.target.closest('[data-rarity-filter]');
  if(rarityButton){collectionRank=Number(rarityButton.dataset.rarityFilter);render();app.querySelector(`[data-rarity-filter="${collectionRank}"]`).focus({preventScroll:true});return;}
  const inspect = event.target.closest('[data-inspect]');
  if (inspect) {
    const offer = inspect.closest('[data-offer]');
    const index = Number(offer?.dataset.offer);
    if (offer && mobile.matches && index !== draftIndex) syncDraft(index, true);
    else openDetail(inspect);
    return;
  }
  const button = event.target.closest('[data-action]');
  if (button && !button.disabled) act(button.dataset.action, button.dataset);
});

let recycleSelectedId = null;
let recycleConfirming = false;
let recycling = false;
const recycleDialog = document.createElement('dialog');
recycleDialog.className = 'recycle-dialog';
recycleDialog.setAttribute('aria-labelledby', 'deck-dialog-title');
document.body.append(recycleDialog);

function openRecycleDialog(canRemove) {
  if (!game || (canRemove && !deckRemovalStatus(game, config).available)) return;
  recycling = canRemove;
  recycleConfirming = false;
  const grouped = new Map();
  for (const id of game.players[0].deck) grouped.set(id, (grouped.get(id) || 0) + 1);
  const deck = [...grouped].sort(([a], [b]) => byId[a].rank - byId[b].rank || byId[a].name.localeCompare(byId[b].name, 'pt-BR'));
  recycleSelectedId = recycling ? null : deck[0]?.[0] ?? null;
  recycleDialog.innerHTML = `<div class="recycle-shell"><header class="recycle-header">
    <span class="recycle-header-mark" aria-hidden="true">${recycling ? '♻' : '▤'}</span>
    <div><h2 id="deck-dialog-title">${recycling ? 'ESTAÇÃO DE RECICLAGEM' : 'SEU BARALHO'}</h2>
    <p>${game.players[0].deck.length} cartas${recycling ? ' · 1 remoção grátis' : ''}</p></div>
    <button type="button" class="recycle-close" data-recycle-close aria-label="Fechar" autofocus>×</button>
    </header><div class="recycle-main"><section class="recycle-library" aria-label="Cartas do baralho">
    <div class="recycle-grid">${deck.map(([id, count]) => `<button class="recycle-choice" data-recycle-select="${esc(id)}" aria-pressed="false">
    <span class="recycle-choice-art">${impactoSvg(byId[id])}</span><span class="recycle-choice-name">${esc(byId[id].name)}</span><span class="recycle-copy">×${count}</span></button>`).join('')}</div>
    </section><section class="recycle-focus" aria-label="Detalhes da carta"></section></div>
    ${recycling ? '<footer class="recycle-controls"></footer>' : ''}</div>`;
  paintRecycleSelection();
  recycleDialog.showModal();
}

function paintRecycleSelection() {
  const chosen = byId[recycleSelectedId];
  for (const choice of recycleDialog.querySelectorAll('[data-recycle-select]')) {
    const selected = choice.dataset.recycleSelect === recycleSelectedId;
    choice.classList.toggle('is-selected', selected);
    choice.setAttribute('aria-pressed', selected);
  }
  recycleDialog.querySelector('.recycle-focus').innerHTML = chosen ? `<div class="recycle-selected-art">${impactoSvg(chosen)}</div>
    <div class="recycle-card-info"><h3>${esc(chosen.name)}</h3>
    <p class="recycle-selected-rarity">${esc(chosen.rarity)} · ATK ${chosen.atk} · VIDA ${chosen.hp}</p>
    <p class="recycle-skill"><b>Habilidade</b> ${esc(chosen.skillDescription)}</p></div>`
    : '<div class="recycle-placeholder"><span class="recycle-orbit" aria-hidden="true">♻</span><h3>Escolha uma carta para reciclar</h3><p>Toque na carta para conferir a habilidade.</p></div>';
  if (!recycling) return;
  recycleDialog.querySelector('.recycle-controls').innerHTML = recycleConfirming
    ? `<div class="recycle-confirm" role="group" aria-label="Confirmar remoção"><strong>Remover uma cópia de ${esc(chosen.name)}?</strong>
      <p>A cópia sai do baralho nesta partida.</p><div class="recycle-confirm-actions"><button class="recycle-cancel" data-recycle-back>VOLTAR</button>
      <button class="recycle-commit" data-recycle-commit>CONFIRMAR REMOÇÃO</button></div></div>`
    : `<button class="recycle-primary" data-recycle-intent ${chosen ? '' : 'disabled'}>RECICLAR 1 CÓPIA <span aria-hidden="true">➜</span></button>`;
}

let toastTimer;
function recycleToast(name) {
  clearTimeout(toastTimer);
  document.querySelector('.recycle-toast')?.remove();
  const station = app.querySelector('.recycle-station');
  const status = station.querySelector('.station-copy > span');
  const locked = status.textContent;
  station.classList.add('is-recycled');
  status.textContent = '✓ 1 CÓPIA RECICLADA';
  const toast = document.createElement('div');
  toast.className = 'recycle-toast';
  toast.setAttribute('role', 'status');
  toast.textContent = '✓ ' + name + ' · 1 cópia reciclada';
  document.body.append(toast);
  toastTimer = setTimeout(() => {
    toast.remove();
    station.classList.remove('is-recycled');
    status.textContent = locked;
  }, 2250);
}

recycleDialog.addEventListener('click', event => {
  if (event.target.closest('[data-recycle-close]')) { recycleDialog.close(); return; }
  const select = event.target.closest('[data-recycle-select]');
  if (select) {
    recycleSelectedId = select.dataset.recycleSelect;
    recycleConfirming = false;
    paintRecycleSelection();
    recycleDialog.querySelector('.recycle-focus').scrollTop = 0;
  } else if (event.target.closest('[data-recycle-intent]') && recycleSelectedId) {
    recycleConfirming = true;
    paintRecycleSelection();
    recycleDialog.querySelector('[data-recycle-back]').focus({ preventScroll: true });
  } else if (event.target.closest('[data-recycle-back]')) {
    recycleConfirming = false;
    paintRecycleSelection();
    recycleDialog.querySelector('[data-recycle-intent]').focus({ preventScroll: true });
  } else if (event.target.closest('[data-recycle-commit]') && recycleConfirming) {
    if (!removeCardFromDeck(game, recycleSelectedId, config)) return;
    const name = byId[recycleSelectedId].name;
    recycleDialog.close();
    render();
    app.querySelector('[data-action="deck-open"]').focus({ preventScroll: true });
    recycleToast(name);
  }
});
recycleDialog.addEventListener('close', () => { recycleDialog.innerHTML = ''; });

const detail = document.createElement('dialog');
detail.className = 'card-detail tech-detail';
detail.setAttribute('aria-labelledby', 'detail-title');
document.body.append(detail);

function openBench() {
  detail.classList.add('bench-dialog');
  detail.innerHTML = `<div class="dialog-actions"><button class="detail-close" aria-label="Fechar arquibancada" autofocus>×</button></div>
    <div class="bench-detail"><h2 id="detail-title">ARQUIBANCADA</h2>
    ${battleDisplay.bench.map((entries, player) => `<section class="bench-detail-side">
    <h3>${player ? 'BOT' : 'VOCÊ'} <small>${entries.size}/${BENCH_CAPACITY}</small></h3>
    <div class="bench-detail-cards">${[...entries].map(([id, count]) => byId[id] ? `<div class="bench-entry">${miniCard(byId[id], player)}<span>×${count}</span></div>` : '').join('') || 'Vazia'}</div>
    </section>`).join('')}</div>`;
  if (!detail.open) detail.showModal();
  else {
    detail.scrollTop = 0;
    detail.querySelector('.detail-close').focus({ preventScroll: true });
  }
}

detail.addEventListener('click', event => {
  if (event.target.closest('.detail-close') || event.target === detail) detail.close();
  else if (event.target.closest('[data-return-bench]')) openBench();
  else {
    const card = event.target.closest('[data-inspect]');
    if (card) openDetail(card, true);
  }
});
detail.addEventListener('close', () => {
  detail.innerHTML = '';
  detail.classList.remove('bench-dialog');
  resumeBattle();
});

const rulesDialog=document.createElement('dialog');
rulesDialog.className='rules-detail tech-detail';
rulesDialog.setAttribute('aria-labelledby', 'rules-title');
document.body.append(rulesDialog);

rulesDialog.innerHTML = `<div class="dialog-actions"><button class="detail-close" aria-label="Fechar regras" autofocus>×</button></div>
  <div class="rules-inner"><h2 id="rules-title">COMO JOGAR</h2><div class="rules-grid">
  <article><h3>ESCOLHA</h3><p>Abra um pacote e escolha cartas para o baralho. Na oficina você pode reciclar uma cópia por rodada de compras.</p></article>
  <article><h3>POSICIONE</h3><p>Distribua suas cartas entre A, B e C. A ordem de colocação define a ordem de combate.</p></article>
  <article><h3>CONQUISTE</h3><p>Vença mais zonas para ganhar uma medalha e tirar uma vida do rival. A Zona B desempata.</p></article>
  <article><h3>VENÇA</h3><p>Conquiste sete medalhas antes de perder três vidas.</p></article>
  </div><button class="primary" id="close-rules">ENTENDI ✓</button></div>`;
rulesDialog.addEventListener('click', event => {
  if (event.target === rulesDialog || event.target.closest('.detail-close, #close-rules')) rulesDialog.close();
});

function openDetail(el, returnToBench = false) {
  if (!el) return;
  const base = byId[el.dataset.inspect] ?? {
    id: el.dataset.inspect, name: el.dataset.name, atk: Number(el.dataset.atk), hp: Number(el.dataset.hp),
    rarity: 'Invocação', rank: 0, skillDescription: 'Unidade invocada.',
  };
  const current = { ...base, atk: Number(el.dataset.atk), hp: Number(el.dataset.hp) };
  detail.classList.remove('bench-dialog');
  detail.innerHTML = `<div class="dialog-actions">${returnToBench ? '<button class="secondary" data-return-bench>← ARQUIBANCADA</button>' : ''}
    <button class="detail-close" aria-label="Fechar detalhes" autofocus>×</button></div>
    <div class="detail-layout"><div class="detail-art">${impactoSvg(current)}</div>
    <section class="detail-info"><h2 id="detail-title">${esc(base.name)}</h2><span class="detail-rank rank-${base.rank}">${esc(base.rarity)}</span>
    <div class="detail-stats"><span><small>ATK</small><strong>${current.atk}</strong></span><span><small>VIDA</small><strong>${current.hp}</strong></span></div>
    ${current.atk !== base.atk || current.hp !== base.hp ? `<p class="detail-base">BASE · ATK ${base.atk} · VIDA ${base.hp}</p>` : ''}
    <div class="detail-skill"><h3>HABILIDADE</h3><p>${esc(base.skillDescription)}</p></div></section></div>`;
  if (!detail.open) detail.showModal();
  else {
    detail.scrollTop = 0;
    detail.querySelector('.detail-close').focus({ preventScroll: true });
  }
}

for (const scope of [app, detail]) {
  scope.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key) || !event.target.matches('[data-inspect]')) return;
    event.preventDefault();
    event.target.click();
  });
}


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
