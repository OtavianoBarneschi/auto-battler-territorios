# Arquitetura — V.02

## Estrutura

- `data/cards.json`: 50 cartas com ID, nome, Rank, ATK, VIDA, ID/descrição da habilidade, arte e custo provisório da loja.
- `data/skills.json`: 50 regras declarativas e a regra da invocação Mini Lata 2/2. Os valores dos efeitos podem ser ajustados aqui sem alterar o motor.
- `data/baralhos-iniciais.json`: seis cartas por jogador, com a mesma composição inicial.
- `data/config-prototipo.json`: progressão, zonas e economia provisória preservada da V.01.
- `src/engine.mjs`: estado, loja, posicionamento, combate de cada zona, placar e desempate.
- `src/effects.mjs`: despachante dos gatilhos, condições, seleção de alvos e operações comuns.
- `src/main.mjs` e `src/style.css`: telas e animação dos eventos, com layout desktop e móvel.
- `assets/cartas/`: 50 PNGs individuais transparentes.

## Fluxo

Início → mercado de X → mercado de Y → posicionamento alternado → combate independente A/B/C → resultado → próxima rodada ou fim.

Cada jogador compra a próxima carta do próprio baralho embaralhado e escolhe uma zona. O motor mantém a ordem de posicionamento. As cartas colocadas são públicas. Ao fim da colocação, o motor copia os combatentes para cada batalha; melhorias de combate não alteram cartas do baralho.

## Eventos e ordem

Os gatilhos são `ON_PLACE`, `ON_BATTLE_START`, `BEFORE_ATTACK`, `AFTER_ATTACK`, `BEFORE_DAMAGE`, `ON_DAMAGE_TAKEN`, `ON_KILL`, `ON_FAINT`, `ON_ALLY_FAINT` e `ON_SUMMON`.

Dentro de cada zona, efeitos de início são resolvidos primeiro para X e depois Y, em ordem de posicionamento. Antes de cada troca, ambas as habilidades `BEFORE_ATTACK` são processadas. O dano dos ataques é aplicado simultaneamente. Depois vêm reações a dano, efeitos após ataque e mortes, sempre com X antes de Y e da frente para trás. A unidade eliminada sai da fila e suas invocações entram na mesma posição. O limite de 2 gerações de invocação, 200 mortes, 2.000 efeitos e 1.000 trocas protege contra ciclos. Doze trocas seguidas sem mudança de VIDA encerram a zona em empate.

Alvos aleatórios usam o gerador recebido pelo motor, permitindo testes reproduzíveis. Aumentos de VIDA alteram VIDA atual e máxima temporária. ATK não fica negativo. Percentuais arredondam para cima, exceto o dano de 33% do Pato Pirata. Efeitos não têm alcance fora da zona.

## Desempate e progressão

Vence a rodada quem conquista mais zonas. Com quantidades iguais, a Zona B decide se tiver um vencedor; caso contrário, a rodada empata. Vitória concede 1 medalha, derrota tira 1 vida e empate não altera os placares. Sete medalhas ou a terceira vida perdida encerram a partida.

## Decisões provisórias preservadas

- Economia da V.01: 3 moedas por rodada e jogador, 3 ofertas, troca por 1 moeda. Os custos derivados do Rank são 1 para Ranks 1–2, 2 para 3–4 e 3 para 5–6.
- Ofertas podem repetir, moedas não passam à rodada seguinte e compras entram no baralho da mesma rodada.
- O jogador inicial do posicionamento alterna por rodada.
- Limites de ativação sem período explícito contam desde o posicionamento até o fim da batalha da rodada. Em particular, as duas ativações da Cafeteira Insone são compartilhadas entre `ON_PLACE` e `ON_SUMMON`.
- Em dano letal, efeitos `ON_DAMAGE_TAKEN` ainda são disparados; melhorias no próprio combatente eliminado não o revivem.
