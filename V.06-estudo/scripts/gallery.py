from pathlib import Path
from html import escape as e
import json,sys
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
models=json.loads((ROOT/'docs/concepts.json').read_text(encoding='utf8'))
cards=json.loads((ROOT/'assets/cards.json').read_text(encoding='utf8'))
refs=json.loads((ROOT/'research/benchmark.json').read_text(encoding='utf8'))
def img(m,c,mini=False,cls=''):
    return f'<img class="{cls}" src="renders/{m}-{c["id"]}{"-mini" if mini else ""}.png" alt="Modelo {m}: {c["name"]}, ATK {c["atk"]}, VIDA {c["hp"]}, {c["rarity"]}, rank {c["rank"]}" width="{216 if mini else 640}" height="{252 if mini else 960}">'
def button(m,c,mini=False,cls=''):
    return f'<button class="art-button {cls}" data-model="{m}" data-card="{c["id"]}" aria-label="Ampliar modelo {m} — {c["name"]}">{img(m,c,mini)}</button>'
head='''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ducks N Robots — Nova exploração A–E</title><link rel="stylesheet" href="gallery.css"></head><body>
<header><a class="brand" href="index.html">DUCKS N ROBOTS</a><span>ESTUDO DE ARTE / V.06</span><a href="benchmark.html">Pesquisa &amp; moodboard ↗</a></header><main>
<div class="lead"><h1>Cinco novas direções.</h1><p>Cowboy + Rádio. Arte original, novos suportes.<br>Toque em qualquer carta para ampliar e consultar os dados.</p></div>
<nav class="views" aria-label="Modo de visualização"><button class="selected" data-view="concepts" aria-pressed="true">Comparação A–E</button><button data-view="scales" aria-pressed="false">Escalas de jogo</button><a href="benchmark.html">Benchmark visual</a></nav>
<div class="model-filter" aria-label="Filtrar modelo"><span>MODELOS</span><button data-filter="all" class="selected" aria-pressed="true">Todos</button>'''
head+=''.join(f'<button data-filter="{m["id"]}" aria-pressed="false">{m["id"]}</button>' for m in models)+'</div>'
gallery='<section id="concepts" class="comparison" aria-label="Dez cartas-exemplo">'
for m in models:
    mid=m['id']
    gallery+=f'<article class="model" data-group="{mid}"><h2><b>{mid}</b>{e(m["name"])}</h2><p class="tag">{m["tag"]}</p><div class="pair">'+''.join(button(mid,c) for c in cards)+'</div>'
    gallery+=f'<p class="concept">{e(m["idea"])}</p><details><summary>Conceito, referências e decisões</summary><p>{e(m["type"])}</p><p><strong>Referências:</strong> {e(" · ".join(m["refs"]))}.</p><p>{e(m["tradeoff"])}</p><a href="benchmark.html">Ver pesquisa e fontes ↗</a></details></article>'
gallery+='</section>'
scales='''<section id="scales" hidden><div class="scale-intro"><h2>O teste é no tamanho em que se joga.</h2><p>Exibição em pixels CSS, sem ampliar os grupos abaixo. Combate: largura 220 px. Carta móvel: largura 130 px. Unidades no tabuleiro: 54 × 63 px e 43 × 50 px, conforme a V.05. Clique para consultar a carta completa.</p></div>'''
for m in models:
    mid=m['id']
    scales+=f'<article class="scale-model" data-group="{mid}"><h2>{mid} / {e(m["name"])}</h2><div class="scale-grid"><section><h3>COMBATE · 220 PX</h3><div class="size-pair combat">'+''.join(button(mid,c) for c in cards)+'</div></section><section><h3>CARTA MÓVEL · 130 PX</h3><div class="size-pair mobile-card">'+''.join(button(mid,c) for c in cards)+'</div></section></div>'
    scales+='<h3>TABULEIRO · 54 × 63 PX · REDUÇÃO ÓPTICA</h3><div class="zones">'
    for zone in 'ABC':
        scales+=f'<section class="zone"><h4>ZONA {zone}</h4><div class="lane">'+''.join(button(mid,c,True) for c in (cards*3))+'</div><div class="lane">'+''.join(button(mid,c,True) for c in (cards[::-1]*3))+'</div></section>'
    scales+='</div><h3>TABULEIRO MÓVEL · 43 × 50 PX</h3><div class="lane tiny">'+''.join(button(mid,c,True) for c in cards*6)+'</div><p class="scale-note">A miniatura usa a mesma arte e os mesmos valores, com composição reduzida. A regra completa fica na consulta; não foi comprimida em texto ilegível.</p></article>'
scales+='</section>'
legend='''<section class="legend"><h2>Como ler as cartas</h2><div class="legend-grid"><p><strong>Pena-lâmina</strong> Ataque.</p><p><strong>Coração</strong> Vida.</p><p><strong>Coroa / engrenagem</strong> Lendário / Mítico; o número é o rank.</p><p><strong>Bandeira → impacto → fila</strong> Início do combate → dano indicado → inimigo na posição destacada, na mesma zona.</p></div><p>A fila é um diagrama de posição, não uma contagem de inimigos. Consulte a regra original clicando na carta. A base não define custo individual; nenhum custo foi acrescentado.</p></section>
<footer><span>Estudo isolado. Produção V.05 preservada.</span><a href="docs/QA.md">Revisão e limitações</a><a href="docs/prompts.json">Prompts dos materiais</a><span>17 NOV 2026</span></footer></main>
<dialog id="detail" aria-labelledby="detail-title"><button id="close" aria-label="Fechar carta ampliada">×</button><div class="detail-grid"><img id="detail-image" alt=""><div><p id="detail-model" class="tag"></p><h2 id="detail-title"></h2><p id="detail-stats"></p><h3>HABILIDADE ORIGINAL</h3><p id="detail-rule"></p><p id="detail-origin"></p><hr><p id="detail-concept"></p><a id="download" download>Baixar carta em PNG ↗</a></div></div></dialog>'''
data='<script id="study-data" type="application/json">'+json.dumps({'cards':cards,'models':models},ensure_ascii=False).replace('</','<\/')+'</script><script src="gallery.js"></script></body></html>'
(ROOT/'index.html').write_text(head+gallery+scales+legend+data,encoding='utf8')

bench='''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Benchmark visual — Ducks N Robots</title><link rel="stylesheet" href="gallery.css"></head><body><header><a class="brand" href="index.html">DUCKS N ROBOTS</a><span>PESQUISA VISUAL / V.06</span><a href="index.html">Voltar às propostas ↗</a></header><main class="benchmark"><div class="lead"><h1>O que faz uma carta funcionar.</h1><p>Referências reais, observações visuais e critérios de projeto.<br>Imagens de terceiros somente para estudo; não integram os assets do jogo.</p></div><section class="research-principles"><h2>Critérios extraídos da pesquisa</h2><p><strong>1.</strong> A silhueta precede o ornamento. <strong>2.</strong> Números precisam de massa e contraste. <strong>3.</strong> Materiais devem combinar com o traço. <strong>4.</strong> Raridade precisa de forma além de cor. <strong>5.</strong> O tamanho pequeno exige uma composição própria.</p><p>As observações abaixo são análise visual deste estudo. Fatos de produção são atribuídos às respectivas fontes. Nenhum asset de outro jogo foi usado nas cartas A–E.</p></section>'''
for i,r in enumerate(refs):
    bench+=f'<article class="reference"><div class="reference-image"><img src="research/{r["image"]}" alt="Referência visual: {e(r["title"])}">'
    if r.get('secondImage'):bench+=f'<img src="research/{r["secondImage"]}" alt="Estudo de iconografia de Bo Geddes">'
    bench+=f'<small>{e(r["credit"])}</small></div><div><span class="tag">REFERÊNCIA {i+1:02d}</span><h2>{e(r["title"])}</h2><h3>O QUE FUNCIONA</h3><p>{e(r["observation"])}</p><h3>TRADUÇÃO PARA DUCKS N ROBOTS</h3><p>{e(r["takeaway"])}</p><p class="source-links">'+''.join(f'<a href="{u}" target="_blank" rel="noopener">{e(label)} ↗</a>' for label,u in r['links'])+f'</p><small>{e(r["limit"])}</small></div></article>'
bench+='''<section class="research-principles"><h2>Da pesquisa às cinco rotas</h2><p>A explora explosão de silhueta; B, objeto pintado; C, impressão e assimetria; D, peça esmaltada de competição; E, camadas de papel. O objetivo é comparar identidades, não acabamentos intercambiáveis.</p><p>As fontes foram acessadas em 17/11/2026. Tipografias locais distribuídas sob OFL: Bungee, Lilita One, Anton, Racing Sans One, Bree Serif e Barlow Condensed — <a href="https://github.com/google/fonts">Google Fonts</a>. Licenças incluídas em assets/fonts.</p></section><footer><a href="index.html">Comparar A–E ↗</a><a href="research/image-sources.json">URLs diretas das imagens</a><span>Estudo local · sem publicação</span></footer></main></body></html>'''
(ROOT/'benchmark.html').write_text(bench,encoding='utf8')

# Reproducible contact sheet and individual presentation boards.
font=ImageFont.truetype(str(ROOT/'assets/fonts/barlowcondensed-BarlowCondensed-Bold.ttf'),27)
small=ImageFont.truetype(str(ROOT/'assets/fonts/barlowcondensed-BarlowCondensed-Regular.ttf'),22)
sheet=Image.new('RGB',(1740,1170),'#202125');draw=ImageDraw.Draw(sheet)
for col,m in enumerate(models):
    draw.text((col*342+22,22),m['id']+' / '+m['name'].upper(),font=small,fill='#eee7da')
    for row,c in enumerate(cards):
        im=Image.open(ROOT/'renders'/f'{m["id"]}-{c["id"]}.png');im.thumbnail((320,480));sheet.paste(im,(col*342+12,65+row*520),im)
sheet.save(ROOT/'comparacao.png')
for m in models:
    board=Image.new('RGB',(1600,1300),'#202125');d=ImageDraw.Draw(board)
    d.text((50,30),'MODELO '+m['id']+' / '+m['name'].upper(),font=font,fill='#eee7da')
    d.text((50,75),m['tag'],font=small,fill='#a7a6a2')
    for col,c in enumerate(cards):
        im=Image.open(ROOT/'renders'/f'{m["id"]}-{c["id"]}.png');im.thumbnail((480,720));board.paste(im,(40+col*510,125),im)
        d.text((80+col*510,865),f'{c["name"]} / ATK {c["atk"]} / VIDA {c["hp"]} / {c["rarity"]} {c["rank"]}',font=small,fill='#eee7da')
    d.text((1100,125),'LARGURA 220 PX',font=small,fill='#eee7da')
    for row,c in enumerate(cards):
        im=Image.open(ROOT/'renders'/f'{m["id"]}-{c["id"]}.png').resize((220,330),Image.Resampling.LANCZOS);board.paste(im,(1110,165+row*350),im)
    d.text((50,960),'TABULEIRO / 54 × 63 PX — VER EM 100% PARA AVALIAR A ESCALA',font=small,fill='#a7a6a2')
    for n,c in enumerate(cards*6):
        im=Image.open(ROOT/'renders'/f'{m["id"]}-{c["id"]}-mini.png').resize((54,63),Image.Resampling.LANCZOS);board.paste(im,(50+n*66,1010),im)
    # Short lines only, no automatic font squeezing.
    import textwrap
    for n,line in enumerate(textwrap.wrap(m['idea'],width=125)):
        d.text((50,1120+n*30),line,font=small,fill='#d2cec5')
    board.save(ROOT/f'modelo-{m["id"]}.png')
print('Gallery, benchmark, contact sheet and 5 artboards created.')
