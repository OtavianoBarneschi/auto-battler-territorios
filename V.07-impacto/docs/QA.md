# V.07 — Impacto refinado

Base funcional: V.05 / main 2a5d6e7; estudo anterior: V.06 / 41bb82a, tag v.06-estudo. Apenas dois exemplos. Produção preservada por solicitação explícita da exploração isolada; sem push ou deploy no main.

## Changelog
Face com somente ATK e VIDA em números, sem ícones. Janela estreita atrás do personagem, composição ampliada, textura anterior atenuada, contadores com recortes e cores estáveis. Nome e todos os metadados na consulta por clique, acessível por teclado e toque. Comparação anterior/refinado e escalas de 220, 130 e 54 px de largura.

## Arquitetura
PNG original intacto → composição SVG em artboards → PNG renderizado com resvg → galeria de consulta. Fontes locais. Nenhuma ilustração regenerada. Scripts compose.py e render.cjs permitem reproduzir os dois renders. Pillow é usado para a prancha. Renderização usa @resvg/resvg-js externo em LOCALAPPDATA/CodexCardTools; não duplica node_modules.

## Validação e limitações
Verificar com python scripts/verify.py. A consulta foi inspecionada no navegador com a regra original de Rádio. Valores e artes comparados com V.05; a face SVG deve conter exatamente dois elementos text. Comparação renderizada e inspecionada. Este estudo é estático: não simula combate nem altera gameplay. A cor vem acompanhada de posição fixa; a legenda externa apresenta o significado. Não há custo individual na base, portanto nenhum valor foi criado.

O personagem rompe as laterais, mas não deve cobrir os números. A composição em 54 px precisa de nova adaptação óptica quando for integrada ao tabuleiro de 54 × 63; aqui é uma redução proporcional de 54 × 81. Sombras são aplicadas à camada inteira, sem alterar o arquivo original. Não há paralaxe nem animação. Não foram validadas outras artes, números de múltiplos dígitos, estados de dano ou nomes longos.

## Próximo passo
Aguardar avaliação deste refinamento. Só depois preparar adaptação óptica e estados reutilizáveis e discutir aplicação ao catálogo.

Benchmark principal consultado: https://unity.com/resources/marvel-snap — seção Creating epic cards e ferramentas de frame break. A direção usa separação de planos e hierarquia curta, sem copiar os recipientes ou lettering do jogo.
