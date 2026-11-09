# Três Frentes — Auto Battler de Territórios

Primeira versão jogável (V.01) de um duelo local 1x1 por três territórios. Código e site estático em [`V.01/`](V.01/).

## Rodar localmente

Requer Node.js 22 ou superior. Sem instalação de dependências:

```sh
cd V.01
npm start
```

Abra `http://localhost:4173`. Para testar o motor: `npm test`.

## Publicação

Cloudflare Pages: repositório GitHub `auto-battler-territorios`, branch de produção `main`, comando de build vazio, diretório de saída `V.01`. O projeto é apenas estático e não usa variáveis de ambiente. Em cada versão futura, mudar o diretório de saída para a nova pasta estável, depois validar o deploy.

Os SVGs incluídos no kit são proxies originais e provisórios. Os manuais de terceiros do ZIP de referência não fazem parte deste repositório nem da publicação.

Veja [arquitetura](V.01/docs/ARQUITETURA.md), [changelog](V.01/docs/CHANGELOG.md), [backlog](V.01/docs/BACKLOG.md) e [testes](V.01/docs/TESTES.md).
