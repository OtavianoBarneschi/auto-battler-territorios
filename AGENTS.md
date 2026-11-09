# Regras permanentes do projeto

- Antes de alterar o jogo, identificar a última versão funcional por pastas `V.xx`, tags e commits.
- Preservar a única cópia funcional de cada versão. Implementar uma nova evolução em pasta `V.02`, `V.03` etc. sem destruir a anterior. Evitar duplicar dependências pesadas.
- A cada versão: implementar, validar o jogo, executar testes proporcionais, atualizar número e changelog, fazer commit e push, criar tag, confirmar deploy do `main` no Cloudflare, gerar `V.xx - AUDITORIA.zip` e resumir a entrega.
- O endereço principal deve servir a última versão estável. Não publicar versão quebrada. Preservar rollback por Git e deploys. Exibir discretamente a versão no jogo.
- Registrar bugs, limitações, decisões provisórias e próximos passos. Não mudar regras confirmadas sem instrução do usuário.
- Habilidades permanecem fora da V.01. A próxima versão prioriza o sistema modular de habilidades.
- O ZIP de auditoria inclui fonte essencial, configurações, dados, arquitetura, changelog, backlog, testes, problemas, versão, commit e URL de deploy. Exclui `.git`, dependências, builds, caches, credenciais, temporários e imagens desnecessárias.
