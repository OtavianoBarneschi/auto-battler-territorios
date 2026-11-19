# Arquitetura V.12

O jogo é um site estático servido por Cloudflare Pages. A V.12 parte do commit V.11 `f465ef7535dc464e95d5bc94518999286018d961`. A configuração `wrangler.toml` da branch de preview publica `V.12`. A branch `main` é a referência de produção.

- `src/engine.mjs`, `src/effects.mjs` e `data/` executam as mesmas regras da V.11. O único ajuste do motor é a constante de versão.
- `src/main.mjs` monta as fases e despacha suas ações para o motor. Arrastar continua disponível no desktop. Botões A, B e C e botões de inspeção têm alvos independentes.
- `src/style.css` mantém o Tech Industrial de base. `src/mobile.css` implementa o shell compacto, paisagem, carrossel, controles e folhas de consulta, com insets das áreas seguras.
- O replay consome a sequência de eventos já resolvida pelo motor. Atualiza os atributos, indicativos de dano, zonas e contadores do DOM. Recria o SVG de um combatente quando muda o personagem e pausa com consulta aberta ou aba oculta.
- `src/impacto.mjs` mantém as faces e molduras aprovadas e referencia versões WebP de pixels idênticos. Os PNGs canônicos continuam versionados. `scripts/encode-art.py` verifica igualdade dos pixels RGBA ao gerar as cópias.
- A coleção cria os SVGs das cartas perto da janela visível via `IntersectionObserver`. Fontes locais Barlow Condensed, DM Sans e Bungee são distribuídas com suas licenças.
