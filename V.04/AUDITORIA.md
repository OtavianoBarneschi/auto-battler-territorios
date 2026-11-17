# DUCKS N ROBOTS — Auditoria V.04

Data: 2026-11-17. Base: `DUCKS_N_ROBOTS_V03_RARIDADES.zip`. Equivalências: `DUCKS_N_ROBOTS_50_EQUIVALENCIAS.csv`, copiadas para `data/equivalencias.csv`.

## Fonte e versão

- Versão: V.04. Código de implementação: commit `31c9cbe9809f6f273da70721681e881d624856b9` no `main`.
- V.03 mantida no repositório para rollback. A V.04 preserva 50 IDs, nomes, artes, ATK, VIDA e SKILL; o teste usa hashes dos dados originais.
- Raridades: 10 Comuns, 8 Incomuns, 8 Raros, 8 Épicos, 8 Lendários e 8 Míticos, consistentes com o CSV.

## Validação

- `npm test`: 68 testes passaram, 0 falharam; incluindo 50 habilidades e 12 partidas completas simuladas.
- Navegador local: pacote, duas ofertas de cinco, posicionamento alternado, batalha, arquibancadas, resultado e rodada seguinte verificados por interação. Layout desktop e mobile 390 × 844 sem rolagem horizontal.
- Público: [auto-battler-territorios.pages.dev](https://auto-battler-territorios.pages.dev/) responde 200 sem senha, com título `DUCKS N ROBOTS — Auto Battler`. `src/engine.mjs` publica V.04; `src/main.mjs`, `data/cards.json`, `data/config.json` e artes 01/50 respondem 200.

## Pendências reais

- Não há salvamento ao atualizar a página.
- BOT heurístico, ainda sem avaliação de equilíbrio por jogadores.
- Gestos em aparelhos físicos não foram testados. Toque/clique funciona no navegador.
- As zonas são resolvidas em sequência; mortes simultâneas de uma mesma etapa são agrupadas. Detalhes em `docs/PROBLEMAS.md`.
