# Auditoria V.12 — Mobile Experience

## Linha de base

V.11 em `main` no commit `f465ef7535dc464e95d5bc94518999286018d961`. Conferência do manifesto público de produção em 19/11/2026. Auditoria inicial conduzida em Chrome com emulação de toque e viewport de 360 × 720 px, com capturas das telas reais e uma rodada jogada.

| Tela | Observação na V.11 | Resposta na V.12 |
| --- | --- | --- |
| Início e regras | Personagens ocultos em 360 px. O botão final de regras ficava fora da primeira área visível. | Artes centrais, início ao alcance do polegar e manual curto com fechamento visível. |
| Compra de pacotes | Estação e baralho antecediam os pacotes. O primeiro controle terminava em y=724 px e o segundo em y=922 px. | Cápsulas lado a lado e serviços compactos no rodapé da oficina. |
| Escolha de cartas | Primeiras escolhas terminavam em y=807 px e a quinta em y=1401 px. | Carrossel com carta central, cinco atalhos de toque e ação próxima da escolha. |
| Reciclagem e baralho | Grade, consulta em segundo modal e confirmação distante. A ação inicial de reciclagem terminava em y=1695 px durante a auditoria. | Uma folha com seleção, habilidade, quantidade de cópias e confirmação visíveis no mesmo contexto. |
| Posicionamento | Três zonas em coluna. A zona C terminava em y=1354 px. Em zona ocupada, um toque no centro podia abrir uma carta. | Três setores simultâneos e botões próprios de posicionamento, contagem por equipe e inspeção separada. |
| Batalha e arquibancada | Dois painéis vazios consumiam espaço. Eventos de habilidade substituíam o duelo e a página inteira era remontada a cada evento. | Duelo persistente, dano junto à carta, indicadores de ATK e vida, habilidade na faixa de leitura e arquibancada compacta. |
| Resultado | Placar e vencedor legíveis. Cartões de zona e botão competiam com espaços fixos em telas curtas. | Resultado por zona e próximo passo em um painel compacto. |
| Coleção e detalhes | Raridades altas usavam ícones iguais. A coleção inteira era montada inicialmente. | Nomes nos filtros, artes sob demanda e detalhe com fechamento previsível. |

## Benchmark

- O tabuleiro de três zonas do Marvel Snap orientou manter A, B e C simultâneas, com identificadores e leitura de estado em cada setor. [Entrevista com a equipe Second Dinner](https://developer.apple.com/news/?id=sosm2p7q)
- Balatro Mobile adapta os controles para toque. A V.12 adota seleção explícita e confirmação próxima das cartas. [Balatro Mobile na App Store](https://apps.apple.com/us/app/balatro/id6502453075)
- Wildfrost organiza o combate em linhas e promove leitura do estado dos personagens. A V.12 mantém identificação e atributos no palco durante os efeitos. [Wildfrost na App Store](https://apps.apple.com/us/app/wildfrost/id6462882621)
- Slay the Spire separa preparação do baralho e arena. A V.12 conserva o foco de cada fase e deixa consultas globais recolhidas. [Slay the Spire na App Store](https://apps.apple.com/us/app/slay-the-spire/id1491530147)
- A matriz de testes verifica alvos primários de pelo menos 44 × 44 px e o CSS usa os insets do dispositivo. [Diretrizes de controles para jogos Apple](https://developer.apple.com/design/human-interface-guidelines/game-controls)

## Preservação e publicação

Motor da V.11 preservado exceto pelo identificador. Dados, efeitos, geometria das cartas, molduras e PNGs verificados por comparação com a V.11. As 50 cópias WebP decodificam para os mesmos pixels RGBA. Campo de até 12 cartas e evolução de duplicatas continuam no backlog.

O preview público usa o projeto `ducksnrobots` no Cloudflare Pages, com publicação direta dos arquivos estáticos da tag `v.12`. A entrada do ZIP registra o commit, a tag e os endereços dos deploys. O endereço de produção serve a V.11 durante a aprovação. [Abrir preview público](https://ducksnrobots.pages.dev/)

## Desempenho observado

| Métrica | V.11 | V.12 |
| --- | ---: | ---: |
| Arquivos transmitidos para as 50 ilustrações | 33.877.639 bytes | 23.725.368 bytes |
| Primeira pintura com conteúdo, mediana | 2,68 s | 1,34 s |
| Artes do início, mediana até terminar as respostas | 9,20 s | 7,64 s |
| Bytes das duas artes do início | 1.294.991 | 944.376 |
| SVGs de cartas montados ao abrir a coleção em 360 px | 50 | 6 |

Amostra local de três carregamentos frios por versão com Chrome, 360 × 640, latência simulada de 100 ms, transferência a 200 kB/s e CPU a 4× de desaceleração. As métricas descrevem esse ensaio. O teste funcional executa até fim de jogo e reinício em cada perfil. O replay reutiliza o palco durante a batalha completa, inclusive após abrir a arquibancada.
