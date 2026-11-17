export const MODELS = [
  { id: 'A', name: 'Galeria', label: 'EDITORIAL / SOFISTICADO', note: 'Papel claro, tipografia clássica e espaço para a arte respirar.' },
  { id: 'B', name: 'Relíquia', label: 'COLECIONÁVEL / METÁLICO', note: 'Moldura lapidada, brilho de raridade e presença de edição especial.' },
  { id: 'C', name: 'Essência', label: 'MINIMAL / CONTEMPORÂNEO', note: 'Uma superfície contínua. Só o personagem e o que importa.' },
  { id: 'D', name: 'Comando', label: 'TÁTICO / DIGITAL', note: 'Informação em módulos, leitura rápida e precisão de interface.' },
  { id: 'E', name: 'Manifesto', label: 'GRÁFICO / AUTORAL', note: 'Composição assimétrica, contraste e energia de pôster colecionável.' },
];
export const SAMPLE_IDS = ['07', '49'];
const paths = {
  attack: '<path d="m5 3 13 13-2 2L3 5V3h2Zm10 12 5-5M13 19l6-6M18 18l3 3"/>',
  heart: '<path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-5 5 4 12 8 15 4-3 13-10 8-15Z"/>',
  spark: '<path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z"/>',
  gem: '<path d="m3 8 4-5h10l4 5-9 13L3 8Zm0 0h18M7 3l5 18 5-18"/>',
  target: '<circle cx="12" cy="12" r="7"/><path d="M12 1v6m0 10v6M1 12h6m10 0h6"/>',
  play: '<path d="m8 4 12 8-12 8V4Z"/>',
};
export const icon = type => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[type]}</svg>`;
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
export function cardMarkup(card, model, skill) {
  const duck = card.id === '07';
  const faction = duck ? 'PATO' : 'ROBÔ';
  const skillId = `skill-${model}-${card.id}`;
  const action = skill.actions[0];
  const target = { lastEnemy: 'ÚLTIMO', firstEnemy: 'PRIMEIRO' }[action.target];
  if (skill.triggers[0] !== 'ON_BATTLE_START' || action.type !== 'damage' || !target) throw new Error('Habilidade fora do escopo desta exploração.');
  return `<article class="sample model-${model} ${duck ? 'duck' : 'robot'}" aria-label="Modelo ${model} — ${faction}: ${esc(card.name)}" data-card-id="${card.id}">
    <div class="card-surface">
      <div class="ornament" aria-hidden="true"></div>
      <div class="card-series"><span>DNR</span><span>${faction} / ${card.id}</span></div>
      <div class="rarity" title="Rank ${card.rank} — ${esc(card.rarity)}">${icon('gem')}<span>${esc(card.rarity)}</span><b>${card.rank}</b></div>
      <div class="art-stage"><img src="./${esc(card.artAsset)}" alt="${faction} ${esc(card.name)} — ilustração original" draggable="false"></div>
      <div class="identity"><span class="faction">${faction} <i> / ${card.id}</i></span><h3>${esc(card.name)}</h3></div>
      <div class="attributes"><span class="attack" aria-label="Ataque ${card.atk}" title="Ataque">${icon('attack')}<b>${card.atk}</b></span><span class="health" aria-label="Vida ${card.hp}" title="Vida">${icon('heart')}<b>${card.hp}</b></span></div>
      <button class="ability" data-detail="${card.id}" aria-label="Ler habilidade de ${esc(card.name)}" aria-describedby="${skillId}">${icon('play')}<span class="ability-damage">${icon('spark')}<b>${action.amount}</b></span><span class="ability-target">${icon('target')}<span>${target}</span></span><span class="info-mark">i</span></button>
      <div class="card-signature" aria-hidden="true">DUCKS N ROBOTS <span>✦</span></div>
    </div>
    <p class="full-skill" id="${skillId}">${esc(card.skillDescription)}</p>
  </article>`;
}
async function init() {
  const response = await fetch('./data/cards.json');
  if (!response.ok) throw new Error('Não foi possível carregar as cartas.');
  const cards = await response.json();
  const skillsResponse = await fetch('./data/skills.json');
  if (!skillsResponse.ok) throw new Error('Não foi possível carregar as habilidades.');
  const skills = await skillsResponse.json();
  const samples = SAMPLE_IDS.map(id => cards.find(card => card.id === id));
  if (samples.some(card => !card)) throw new Error('Cartas-exemplo não encontradas.');
  document.querySelector('#gallery').innerHTML = MODELS.map(model => `<section class="model-column" data-model="${model.id}" aria-labelledby="model-${model.id}"><header class="model-heading"><div><span class="model-letter">${model.id}</span><span><small>MODELO ${model.id}</small><h2 id="model-${model.id}">${model.name}</h2></span></div><p>${model.label}</p></header><div class="sample-pair">${samples.map(card => cardMarkup(card, model.id, skills[card.skillId])).join('')}</div><p class="direction-note">${model.note}</p><button class="focus-model" data-focus="${model.id}">Ampliar modelo ${model.id} <span>↗</span></button></section>`).join('');
  document.querySelector('#symbols').innerHTML = [['attack','Ataque'],['heart','Vida'],['gem','Raridade / rank'],['play','Início do combate'],['spark','Dano'],['target','Alvo na zona']].map(([type,label])=>`<span>${icon(type)} ${label}</span>`).join('');
  function filter(id) {
    document.querySelectorAll('.model-column').forEach(el => el.hidden = id !== 'all' && el.dataset.model !== id);
    document.querySelector('.gallery').classList.toggle('focused', id !== 'all');
    document.querySelectorAll('[data-filter]').forEach(button => { button.classList.toggle('active', button.dataset.filter === id); button.setAttribute('aria-pressed', button.dataset.filter === id); });
  }
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => filter(button.dataset.filter)));
  document.querySelectorAll('[data-focus]').forEach(button => button.addEventListener('click', () => { filter(button.dataset.focus); document.querySelector('.toolbar').scrollIntoView({ block:'start' }); }));
  document.querySelector('#full-text').addEventListener('change', event => document.body.classList.toggle('show-text', event.target.checked));
  const dialog = document.querySelector('#skill-dialog');
  document.querySelectorAll('[data-detail]').forEach(button => button.addEventListener('click', () => {
    const card = samples.find(card => card.id === button.dataset.detail);
    document.querySelector('#dialog-title').textContent = card.name;
    document.querySelector('#dialog-body').innerHTML = `<p class="dialog-stats">${icon('attack')} ${card.atk} ${icon('heart')} ${card.hp} ${icon('gem')} ${esc(card.rarity)} · Rank ${card.rank}</p><p class="rule">${esc(card.skillDescription)}</p><p class="source-note">ID ${card.id} · ${esc(card.skillId)}<br>Não há custo individual definido na base atual.</p>`;
    dialog.showModal();
  }));
  document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
}
if (typeof document !== 'undefined') init().catch(error => { document.querySelector('#gallery').textContent = error.message; });
