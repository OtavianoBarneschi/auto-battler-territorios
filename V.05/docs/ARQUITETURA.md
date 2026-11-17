# Arquitetura V.05

Aplicação estática sem dependências. `index.html` mantém o jogo V.04, com identificação V.05 e link para o ateliê. Engine, efeitos e renderer das cartas do jogo preservados.

`modelos.html` carrega `src/modelos.mjs` e `src/modelos.css`. O módulo lê os JSON originais e seleciona somente IDs 07 e 49. As cinco propostas compartilham dados e semântica, com composições CSS diferentes. Nenhum dado é gravado ou alterado. SVGs são ícones de UI; personagens usam os PNGs originais com object-fit contain.

Desktop largo: cinco colunas, pato acima de robô. Tablet: três colunas. Celular: duas colunas. Foco em um modelo: dupla lado a lado, ou empilhada no celular. Modal nativo fecha por botão, Escape ou clique externo. Texto original disponível a leitores de tela e por opção global.

Servidor local: `npm start`, porta 4173 (ou variável PORT). Testes: `npm test`. Os testes de preservação comparam V.03/V.04, que devem estar como pastas irmãs no repositório.
