# Auditoria V.05 — exploração visual

Data: 2026-11-17. Base funcional: V.04 (31c9cbe), com auditoria em 9bdd961.
Implementação: c9a21f4, tag v.05, enviada ao main.
Escopo: cinco direções × Cowboy/Rádio = dez cartas. Artes, valores e regras preservados. A coleção de 50 aguarda aprovação.

## Verificação

69 testes Node aprovados. Revisão de desktop (1440px), celular (390px), filtros/ampliação, habilidade completa e texto expandido. Início do jogo contra BOT verificado. Comparação SHA-256 das 50 artes e dos dados com a V.04 passou.

## Deploy confirmado

https://auto-battler-territorios.pages.dev/modelos.html

Após push do main, HTTP 200 e conteúdo publicado correspondente ao local: modelos.html, modelos.mjs, modelos.css, engine.mjs (V.05), cards.json e skills.json. As artes Cowboy e Rádio publicadas têm SHA-256 idêntico ao original local. CLI Cloudflare sem autenticação; publicação concluída pela integração Git existente.

## Pacote

V.05 - AUDITORIA.zip: fonte, 50 artes necessárias ao jogo preservado, configuração, dados, documentação e testes. Exclui Git, dependências, builds, caches, credenciais e screenshots. MANIFESTO.json registra commit e hashes. Testes de comparação entre versões requerem as pastas V.03 e V.04 do repositório como irmãs; o ZIP contém somente a V.05.

Rollback: V.04 preservada no Git e pasta original. Nenhuma direção aplicada ao renderer das 50 cartas.
