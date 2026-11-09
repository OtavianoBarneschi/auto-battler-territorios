# Testes e resultados — V.01

Executar em `V.01/`: `npm test`.

## Automatizados — 2026-11-09

**11/11 passaram** com Node.js 22:

1. Compra aumenta o baralho permanente e gasta moedas.
2. Posicionamento alternado, visibilidade dos dados colocados e preservação da ordem.
3. Ataques simultâneos e morte simultânea.
4. HP restante persiste contra o próximo adversário.
5. Territórios vazios e derrota por ausência de cartas.
6. Barramento de efeitos aceita múltiplos manipuladores sem habilidades ativas.
7. Resultados territoriais 1×0, 1×1 e 0×0.
8. Medalha, perda de vida e empate sem mudança.
9. Vitória ao alcançar sete medalhas.
10. Derrota após perder três vidas.
11. Simulação de partida completa da loja até o fim.

`node --check` passou para os módulos do motor e interface. Requisições HTTP locais ao HTML, JSON e SVG retornaram 200.

O primeiro deploy de produção do Cloudflare Pages concluiu com status `success`. Requisições públicas sem autenticação a `https://auto-battler-territorios.pages.dev/`, `src/main.mjs`, `src/engine.mjs`, `data/cards.json` e `assets/cartas/recruta.svg` retornaram 200 com o conteúdo esperado.

O deploy seguinte foi iniciado automaticamente por `github:push` em `main` e concluiu com status `success`. Pela URL pública, o Browser Rendering do Cloudflare renderizou e mostrou a tela inicial e a colocação em 1920×1080; em 390×844 mostrou tela inicial, loja, colocação, resultado e fim de jogo. Uma execução automatizada da interface comprou cartas, posicionou por toque/clique, resolveu três rodadas e terminou com X vencedor por reduzir as vidas de Y a zero. Cartas e atributos apareceram nas capturas.

## Ainda pendente

- Validação manual em aparelhos físicos e gesto de arrastar em navegadores móveis específicos. O caminho de toque/clique foi validado remotamente.
