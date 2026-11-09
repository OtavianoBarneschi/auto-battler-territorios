# Arquitetura V.01

- `data/cards.json`: 18 cartas configuráveis com nome, arte, custo, ATK e HP. Os valores são provisórios.
- `data/baralhos-iniciais.json`: seis cartas para cada jogador no início da partida.
- `data/config-prototipo.json`: regras confirmadas e economia provisória.
- `src/engine.mjs`: estado da partida, compra, colocação, resolução dos territórios e pontuação. Não depende do DOM.
- `src/stats.mjs`: validação e leitura dos atributos básicos.
- `src/effects.mjs`: barramento de gatilhos extensível. Nenhum efeito é registrado na V.01.
- `src/main.mjs`: telas, entrada por toque/clique/arrastar e animação dos eventos do motor.
- `src/style.css`: identidade visual provisória e layouts desktop/mobile.

## Fluxo

Tela inicial → loja de X → loja de Y → colocação alternada → batalha A/B/C → resultado → próxima rodada ou fim.

As compras ficam nos baralhos permanentes. Cada rodada cria filas embaralhadas temporárias. Cada território mantém a ordem de entrada. O motor gera eventos de ataque e conquista; a interface os apresenta em sequência. Resultado da partida só é aplicado após a animação.

## Pontos preparados para habilidades

O motor recebe opcionalmente um barramento de efeitos com `onPlacement`, `duringBattle`, `onDamage` e `onDeath`. O barramento aceita vários manipuladores por gatilho. A V.01 passa `null`, pois não há habilidades definidas. Quando o design de habilidades for aprovado, registrar manipuladores vinculados aos IDs das cartas e adicionar um campo `habilidades` aos dados; preservar os testes atuais e ampliar os casos de simultaneidade.

## Decisões provisórias

- Economia do ZIP: 3 moedas por jogador por rodada, 3 ofertas aleatórias, troca de ofertas por 1 moeda, custo das cartas entre 1 e 3.
- X começa a colocação na rodada 1; o primeiro jogador alterna a cada rodada.
- Cartas oferecidas podem se repetir. O jogador pode encerrar sua compra com moedas sobrando; elas não passam à rodada seguinte.
- As cartas compradas entram no baralho antes do embaralhamento da mesma rodada.
- A batalha é totalmente automática. Não há salvar/carregar partida na V.01.
