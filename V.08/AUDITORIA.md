# Auditoria V.08 — Impacto

Base publicada: V.05 / 2a5d6e7. Direção aprovada: V.07 / f1bce8c. Implementação: 1fd5ecc; finalização de publicação: 3b44ef5 (tag v.08.1; tag v.08 preserva implementação inicial).

## Publicação confirmada
Main enviado ao GitHub. Cloudflare Pages check concluído com success para 3b44ef5, deployment 87ffff34-ddca-4a04-b68a-b12afdecc6d5. URL: https://auto-battler-territorios.pages.dev/ . Coleção: https://auto-battler-territorios.pages.dev/colecao .

HTTP 200 e igualdade de conteúdo local/publicado para VERSION.json, main.mjs, impacto.mjs, impacto-templates.mjs, style.css e engine.mjs (normalizando quebras de linha). SHA-256 público/local das artes Cowboy e Rádio idêntico. Coleção pública com 50 cartas e consulta de Rádio validada no navegador. Rota sem extensão do Cloudflare corrigida.

## Preservação e testes
71 testes Node aprovados. SHA-256 de todas as 50 artes iguais à V.05; dados JSON comparados canonicamente, sem diferenças de conteúdo. Motor e effects preservados, com alteração apenas do identificador de versão do motor. Uma rodada completa contra BOT inspecionada até resultado. Coleção de celular sem overflow horizontal. Somente dois números visíveis por face; valores dinâmicos, inclusive zero e múltiplos dígitos.

## Entrega e rollback
V.08 - AUDITORIA.zip inclui fonte, artes necessárias, dados, configurações, arquitetura, changelog, backlog, limitações, testes e manifesto com commit e hashes. Exclui .git, dependências, caches, screenshots e versões antigas. Os testes de preservação requerem as pastas anteriores do repositório como irmãs.

Rollback: restaurar wrangler.toml para ./V.05 no main e publicar pela integração existente. V.05, V.06 e V.07 preservadas. Limitações e decisões estão em docs/PROBLEMAS.md.
