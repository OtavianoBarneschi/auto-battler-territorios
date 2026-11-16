# Duck and Robots

Versão estável atual: **V.02**. Duelo local 1×1 com 50 cartas, habilidades automáticas, três zonas e desempate pela Zona B. A versão anterior permanece em [`V.01/`](V.01/) para rollback.

## Rodar localmente

Requer Node.js 22 ou superior. Sem instalação de dependências:

```sh
cd V.02
npm start
```

Abra `http://localhost:4173`. Para testar o motor: `npm test`.

## Publicação

Jogue em [auto-battler-territorios.pages.dev](https://auto-battler-territorios.pages.dev). O Cloudflare Pages publica o `main` usando a configuração de [`wrangler.toml`](wrangler.toml), com saída em `V.02`. O jogo é estático e não usa variáveis de ambiente.

Veja [arquitetura](V.02/docs/ARQUITETURA.md), [changelog](V.02/docs/CHANGELOG.md), [backlog](V.02/docs/BACKLOG.md), [problemas](V.02/docs/PROBLEMAS.md) e [testes](V.02/docs/TESTES.md).
