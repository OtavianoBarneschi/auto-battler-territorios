# DUCKS N ROBOTS — Arquitetura V.04

## Fonte e dados

A V.04 evolui o motor, a interface e as 50 artes da V.03 recebida em `DUCKS_N_ROBOTS_V03_RARIDADES.zip`. `data/cards.json` conserva IDs, nomes, ATK, VIDA, SKILL e caminhos das artes. Somente o campo de custo da economia antiga foi retirado. `data/equivalencias.csv` é a referência recebida para Tier e raridade. `data/skills.json` conserva as 50 regras declarativas e a invocação auxiliar.

`data/baralhos-iniciais.json` define dois baralhos idênticos de nove cartas Comuns. `data/config.json` centraliza as sete tabelas de pacotes, nove cartas iniciais, três vidas e sete medalhas. `BENCH_CAPACITY = 10` fica em `src/engine.mjs`.

## Fluxo

Início → escolha de pacote e cartas do Jogador A → escolha automática do BOT sob as mesmas ofertas → embaralhamento → posicionamento alternado, sempre iniciado por A → combate → resultado → próxima rodada. Após a sétima escolha, a próxima rodada começa diretamente no posicionamento com o baralho acumulado.

Cada oferta contém cinco IDs diferentes da raridade selecionada. Na rodada 7, os cinco são sorteados entre as 50 cartas. As escolhas anteriores não bloqueiam novas cópias. Os dois baralhos são embaralhados novamente a cada rodada. O BOT só usa sua carta atual e as cartas já visíveis nas zonas para posicionar.

## Motor

`src/engine.mjs` mantém estado, aquisição, BOT, posicionamento, combate e progressão. `src/effects.mjs` despacha as habilidades por gatilhos e alvos dentro da zona atual. As zonas A, B e C não compartilham efeitos. A ordem de posicionamento define a fila de cada zona. O dano de ataque é simultâneo. O combate preserva os limites de segurança da V.03 contra loops de mortes, efeitos e golpes sem avanço.

Na resolução das mortes de cada troca, todos os combatentes já mortos são contabilizados juntos. A arquibancada é compartilhada pelas três zonas e indexada por ID e jogador. Invocações marcadas como temporárias não entram. Se os dois lados ultrapassarem 10 no mesmo lote, a rodada empata; se apenas um ultrapassar, o outro vence imediatamente. O resultado da arquibancada prevalece sobre as zonas. Fora dessa condição, vence quem conquistar mais zonas; em igualdade, o vencedor de B decide.

`src/main.mjs` apresenta seleção, zonas, animação dos eventos, arquibancadas e resultado. Toda a lógica de regras permanece separada da interface para permitir outro controlador no futuro.
