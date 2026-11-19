# Arquitetura V.11

Base V.10 clonada no Git preservando imagens, templates Impacto, raridades e habilidades. `src/engine.mjs` adiciona `deckRemovalStatus` e `removeCardFromDeck`, guarda `removalsThisShop` no jogador humano e reinicia o contador em `nextRound`. `data/config.json` adiciona `deck_remove_limit_per_shop=1`, `deck_remove_cost=0`, `deck_remove_min_cards=1`.

Interface: `src/main.mjs` inclui estação na compra, modal acessível com agrupamento de cópias, inspeção e confirmação em duas etapas. `src/style.css` adiciona os estilos Tech Industrial e mobile. A fase de draft continua concluindo após escolher a última carta; remover antes dessa escolha.

Os dados do catálogo não são alterados; a remoção mexe apenas no array `players[0].deck` da run. Oponentes/BOT usam lógica V.10.
