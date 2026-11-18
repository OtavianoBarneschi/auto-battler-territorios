# Arquitetura V.10

Base da V.09 copiada via árvore Git mantendo SHA dos 50 PNGs, todos os dados, efeitos e templates SVG das cartas. `src/main.mjs`: apresentação e interações. `src/style.css`: design system Tech Industrial aditivo, com adaptações mobile. `assets/tech-hangar.svg`: fundo vetorial leve, sem dependências externas. `src/engine.mjs`: apenas número de versão. `src/impacto.mjs`, `src/rarity-frames.mjs`, `src/impacto-templates.mjs` preservados.

Os filtros da Coleção operam em memória no catálogo sem modificar o baralho. A tela de regras não altera a sessão. Layouts de jogo mantêm os comandos `data-action` originais.
