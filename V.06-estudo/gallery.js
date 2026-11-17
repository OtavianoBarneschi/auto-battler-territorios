const study=JSON.parse(document.querySelector('#study-data').textContent);
let selected='all';
function filter(id){
 selected=id;
 document.querySelectorAll('[data-group]').forEach(el=>el.hidden=id!=='all'&&el.dataset.group!==id);
 document.querySelector('.comparison').classList.toggle('focused',id!=='all');
 document.querySelectorAll('[data-filter]').forEach(el=>{el.classList.toggle('selected',el.dataset.filter===id);el.setAttribute('aria-pressed',el.dataset.filter===id);});
}
document.querySelectorAll('[data-filter]').forEach(el=>el.addEventListener('click',()=>filter(el.dataset.filter)));
document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click',()=>{
 for(const view of ['concepts','scales'])document.getElementById(view).hidden=view!==el.dataset.view;
 document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('selected',b===el);b.setAttribute('aria-pressed',b===el);});
}));
const dialog=document.querySelector('#detail');
document.querySelectorAll('[data-card]').forEach(button=>button.addEventListener('click',()=>{
 const c=study.cards.find(c=>c.id===button.dataset.card),m=study.models.find(m=>m.id===button.dataset.model);
 const file=`renders/${m.id}-${c.id}.png`;
 document.querySelector('#detail-image').src=file;
 document.querySelector('#detail-image').alt=`Modelo ${m.id} — ${c.name}`;
 document.querySelector('#detail-model').textContent=`MODELO ${m.id} / ${m.name}`;
 document.querySelector('#detail-title').textContent=c.name;
 document.querySelector('#detail-stats').textContent=`ATK ${c.atk} · VIDA ${c.hp} · ${c.rarity} · Rank ${c.rank}`;
 document.querySelector('#detail-rule').textContent=c.skillDescription;
 document.querySelector('#detail-origin').textContent=`ID ${c.id} · ${c.skillId}. Dados da V.05. Custo individual não definido na base.`;
 document.querySelector('#detail-concept').textContent=m.idea;
 document.querySelector('#download').href=file;
 dialog.showModal();
}));
document.querySelector('#close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
