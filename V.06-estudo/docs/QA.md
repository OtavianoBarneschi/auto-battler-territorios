# Revisão — V.06 estudo de arte

Data: 17/11/2026. Base funcional: V.05, tag v.05, main 2a5d6e7. Este estudo não substitui o jogo.

## Preservação

- Cowboy: ATK 8, VIDA 4, rank 5, Lendário. Habilidade original: início do combate, 8 de dano ao último inimigo da fila na zona.
- Rádio: ATK 9, VIDA 3, rank 6, Mítico. Habilidade original: início do combate, 10 de dano ao primeiro inimigo da zona.
- JSON copiado integralmente para os dois registros; PNGs originais copiados sem alteração e verificados por SHA-256. Nenhum custo foi inventado: a base não define custo individual.
- Materiais gerados separadamente; personagens compostos por escala uniforme. Não foram enviados ao gerador para redesenho.

## Revisão visual e decisões

As dez composições foram renderizadas antes da galeria. A prancha comparativa permite avaliar acabamento sem depender de CSS. O modelo C teve o personagem deslocado para liberar a coluna de atributos; E teve os atributos elevados para liberar o chapéu e a mão. A tipografia secundária foi reforçada após inspeção dos renders.

A oferece a maior energia e ruptura da moldura; B integra melhor o suporte pintado ao universo de brinquedos; C é o mais gráfico e assimétrico; D prioriza uma peça colecionável esmaltada; E explora materialidade artesanal. A e C têm mais ruído no fundo; B e E dedicam mais área à moldura; D concentra bastante informação na base. Esses são os principais compromissos para a escolha.

## Escalas e limitações

Galeria com cartas ampliáveis, 220 px, 130 px, miniaturas 54 × 63 e 43 × 50 px e várias unidades por zona. A versão mini é uma redução óptica, não uma simples miniaturização da carta inteira. Os números e personagens têm prioridade. Não se espera ler a habilidade nem todos os ornamentos nessa escala: a consulta abre a regra original.

O diagrama de três posições indica primeiro/último, não quantidade de inimigos. A legenda é necessária no primeiro contato. A gramática foi validada somente com as duas habilidades deste estudo; não representa ainda todas as habilidades do jogo.

Os fundos são imagens raster de exploração. Uma implementação definitiva precisará separar materiais e estados, adaptar nomes longos, outras raridades e habilidades, verificar acessibilidade e desempenho no jogo real. Não há simulação de combate nesta galeria e não foi feito teste com jogadores.

## Verificação

O script `scripts/verify.py` verifica igualdade dos dados e artes, habilidades, composição sem distorção, quantidade e dimensões dos renders, referências locais e isolamento. A inspeção de navegador verifica comparação, troca de modo, consulta e apresentação responsiva. As imagens de benchmark são referências documentais, não assets incorporados às cartas.

## Produção

Sem alteração de mecânicas, assets ou configuração de produção. Sem push/deploy para main: o pedido desta etapa exige trabalho isolado. Próximo passo depende da escolha A–E; as outras 48 cartas não foram produzidas.
