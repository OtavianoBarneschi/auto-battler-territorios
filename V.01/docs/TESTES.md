# Testes e resultados — V.01

Executar em `V.01/`: `npm test`.

## Automatizados — 2026-11-09

**11/11 passaram** com Node.js 22:

1. Compra aumenta o baralho permanente e gasta moedas.
2. Posicionamento alternado, visibilidade dos dados colocados e preservação da ordem.
3. Ataques simultâneos e morte simultânea.
4. HP restante persiste contra o próximo adversário.
5. Territórios vazios e derrota por ausência de cartas.
6. Barramento de efeitos aceita múltiplos manipuladores sem habilidades ativas.
7. Resultados territoriais 1×0, 1×1 e 0×0.
8. Medalha, perda de vida e empate sem mudança.
9. Vitória ao alcançar sete medalhas.
10. Derrota após perder três vidas.
11. Simulação de partida completa da loja até o fim.

`node --check` passou para os módulos do motor e interface. Requisições HTTP locais ao HTML, JSON e SVG retornaram 200.

## Ainda pendente

- Revisão visual e interação completa no navegador em larguras mobile e 1920×1080. A ferramenta de navegador interrompeu a sessão por não conseguir verificar a URL ativa no Windows.
- Verificação funcional pela URL pública após configuração do Cloudflare Pages.
