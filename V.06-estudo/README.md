# DUCKS N ROBOTS — V.06 estudo A–E

Exploração isolada: dez cartas, cinco direções, sempre Cowboy e Rádio. Abra `index.html` no navegador. O arquivo funciona localmente, sem instalação. `benchmark.html` contém pesquisa, imagens e fontes. `comparacao.png` reúne as dez cartas; `modelo-A.png` a `modelo-E.png` são pranchas individuais.

Alternativa: `npm start` e abra http://127.0.0.1:4197. Não existe comando de deploy neste estudo.

## Arquitetura e reprodução

- `assets/`: artes originais intactas, cinco fundos complementares, dados e fontes com licenças.
- `artboards/`: SVGs de composição editáveis, com referências relativas aos assets.
- `renders/`: dez PNGs em 960 × 1440 e dez versões ópticas em 432 × 504.
- `research/`: imagens de referência, URLs e análise. Uso documental, não componentes das cartas.
- `docs/`: conceitos, prompts e revisão crítica.
- `scripts/compose.py`: composição vetorial; `render.cjs`: renderização resvg; `gallery.py`: galeria e pranchas.

Reprodução: Python com Pillow; Node com `@resvg/resvg-js` instalado fora do projeto em `%LOCALAPPDATA%/CodexCardTools`. A variável `CARD_TOOLS` pode apontar para o módulo em outro local. Execute compose.py, render.cjs e gallery.py nessa ordem. Para verificar a preservação, mantenha a pasta V.05 ao lado e execute `npm test`. Não há dependências pesadas duplicadas no repositório.

## Changelog e backlog

V.06-estudo — cinco novas direções: Impacto, Oficina encantada, Onda pirata, Liga de lata, Teatro de papel. Materiais próprios, composição em SVG, fontes locais, iconografia vetorial, consulta dos dados originais, benchmark e escalas reais.

Pendente: escolha do modelo pelo usuário. Depois da aprovação, preparar componentes e estados reutilizáveis, validar nomes longos e todas as habilidades/raridades, testar desempenho e só então propor aplicação ao restante do catálogo. Limitações detalhadas em `docs/QA.md`.

Base: V.05 / main 2a5d6e7. Produção preservada em https://auto-battler-territorios.pages.dev/ . Esta entrega não foi publicada nesse endereço.
