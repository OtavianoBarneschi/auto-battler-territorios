# Testes — V.02

Executar em `V.02/`: `npm test`.

## Automatizados — 2026-11-15

**65/65 passaram** com Node.js 22:

- 50 cenários individuais de ativação, um por habilidade.
- Catálogo com 50 IDs únicos e 50 vínculos para PNGs existentes; distribuição exata dos seis Ranks, metade patos e metade robôs.
- Compra, posicionamento alternado e efeitos disparados quando uma carta posterior é colocada.
- Ataque e morte simultâneos; melhorias temporárias; invocações e cadeia da Mini Lata sem ciclo infinito.
- Zonas vazias, efeitos restritos à própria zona e os cinco casos de contagem/desempate testados.
- Medalhas, vidas, empate e encerramento da partida.
- Arredondamento do Pato Pirata, mitigação por tipo de dano e limite do Rei da Sucata.
- Simulação com 50 cartas em cada baralho, 100 posicionamentos e conclusão das três zonas.
- 100 batalhas completas adicionais com posicionamento e escolhas aleatórias reproduzíveis; nenhuma excedeu 448 eventos.

Uma comparação independente com o texto do pedido encontrou **0 divergências** entre as 50 linhas de nome/Rank/ATK/VIDA e as 50 descrições registradas em `data/cards.json`.

## Validação local do site

- HTTP local respondeu 200 para o HTML e para os 50 PNGs.
- Capturas headless do Edge revisadas nas telas de entrada, mercado, posicionamento, batalha e resultado em 1920 × 1080; também em janela móvel de 500 × 844.
- As cartas, o marcador de desempate, os feedbacks de habilidade e o resultado ficaram legíveis nas capturas. A arte foi ajustada para caber inteira na área da carta.

## Deploy público — 2026-11-15

- Após o push do commit `f2dfada` ao `main`, `https://auto-battler-territorios.pages.dev/` respondeu 200 com o título “Duck and Robots — Auto Battler”.
- O catálogo público `data/cards.json` respondeu 200 com 50 cartas, de Pato Cavaleiro a Rei da Sucata.
- O módulo público `src/engine.mjs` respondeu 200 e contém `V.02`.
- `assets/cartas/50_rei_da_sucata.png` respondeu 200 como `image/png`.

## Pendente

- Interação por clique/toque em navegador e aparelho físico. A ferramenta de controle visual encerrou a sessão porque não conseguiu verificar com confiança a URL do Edge.
