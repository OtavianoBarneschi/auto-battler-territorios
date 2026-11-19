# Auditoria V.11

Base de projeto: V.10. Não alterar produção sem testes. Código novo: remoção e UI da Estação. Configuração de preços 0 (não há economia de ouro no jogo). Ação limitada a uma por rodada de compras e antes de concluir as escolhas.

Preservação obrigatória: blobs de 50 artes, 50 cartas, habilidades, molduras Impacto e raridades iguais aos da V.10. `src/engine.mjs` só altera estado do deck e número da versão; motor de combate inalterado.

Backlog: 12 no campo, 4 por zona e evolução de duplicatas +1/+1 documentados sem ativar.

Rollback: apontar Cloudflare para V.10 e publicar; diretórios antigos preservados.
