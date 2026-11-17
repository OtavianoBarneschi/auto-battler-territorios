# DUCKS N ROBOTS — Auditoria V.04

Executar em `V.04/`: `npm test` (Node.js 22 ou superior). O teste compara as 50 cartas com hashes dos dados da V.03 em `data/baseline-v03-sha256.json` e com `data/equivalencias.csv` e verifica todas as 50 artes. A V.04 pode ser testada isoladamente.

Validações automatizadas: tabela dos sete pacotes, cinco ofertas diferentes, raridades, cartas repetidas e persistentes, ausência de custo nas cartas, Jogador A inicial, posicionamento do BOT, arquibancada por ID e pelas três zonas, invocações temporárias, dez lugares permitidos, derrota no 11º tipo, empate por mortes simultâneas, desempate em B, condições de vitória, progressão sem aquisição após a rodada 7, 50 habilidades e 12 partidas simuladas até o fim. Resultado: **68 testes passaram, 0 falharam**.

Validação visual local em navegador: início → escolha de pacote → duas ofertas de cinco cartas → posicionamento alternado → combate e arquibancadas → resultado → segunda rodada. Revisados desktop e viewport móvel de 390 × 844, sem rolagem horizontal.

Após o push ao `main`, a URL pública respondeu 200 sem autenticação para HTML, motor V.04, catálogo, configuração e artes de exemplo. O título público é `DUCKS N ROBOTS — Auto Battler`.
