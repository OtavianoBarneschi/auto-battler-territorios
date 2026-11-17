# DUCKS N ROBOTS

Versão estável: **V.04**. Jogue contra o BOT com 50 personagens, seleção de cartas por raridade, três zonas e arquibancada de 10 tipos. As versões anteriores permanecem em `V.01/`, `V.02/` e `V.03/` para auditoria e rollback.

## Rodar localmente

Requer Node.js 22 ou superior. Sem instalar dependências:

```sh
cd V.04
npm start
```

Abra o endereço exibido pelo servidor. Rode `npm test` para validar catálogo, regras e habilidades.

## Publicação

O projeto Cloudflare Pages existente usa `wrangler.toml` com saída estática em `V.04/`. A URL principal é [auto-battler-territorios.pages.dev](https://auto-battler-territorios.pages.dev/). A confirmação da publicação está em [V.04/AUDITORIA.md](V.04/AUDITORIA.md).

Leia [arquitetura](V.04/docs/ARQUITETURA.md), [changelog](V.04/docs/CHANGELOG.md), [testes](V.04/docs/TESTES.md), [limitações](V.04/docs/PROBLEMAS.md) e [backlog](V.04/docs/BACKLOG.md).
