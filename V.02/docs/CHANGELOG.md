# Changelog

## V.02 — 2026-11-15

- Duck and Robots passou a ter 50 cartas jogáveis, com as 50 ilustrações PNG originais, atributos, Ranks e descrições fornecidos.
- Habilidades automáticas implementadas por gatilhos e operações reutilizáveis; valores dos efeitos em `data/skills.json`.
- Três zonas com filas e combates independentes. A Zona B desempata quando cada jogador venceu a mesma quantidade de zonas.
- Invocações na posição do combatente eliminado, dano de habilidades, mitigação, melhorias temporárias e limites de ativação.
- Interface das cartas mostra arte, nome, ATK, VIDA, Rank e habilidade. A batalha mostra efeitos de forma discreta e permite pular a animação.
- Catálogo e efeitos validados com 65 testes automatizados, comparação dos 50 atributos e descrições com o pedido original e capturas locais das principais telas em desktop e layout móvel.

## V.01 — 2026-11-09

Primeira partida local 1×1 com três territórios, cartas provisórias, compra, posicionamento alternado, batalha automática, medalhas e vidas. A pasta `V.01/` permanece preservada para rollback.
