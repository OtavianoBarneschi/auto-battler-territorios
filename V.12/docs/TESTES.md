# Validação V.12

Node 22+. Execute na pasta V.12.

```powershell
npm test
$env:PORT = '4174'
npm start
```

Em outro terminal com Playwright e WebKit disponíveis, execute `node scripts/mobile-smoke.mjs`. O script aceita nomes dos perfis como argumentos, `GAME_URL` para apontar para o preview e `SCREENSHOTS` para salvar imagens. `PLAYWRIGHT_MODULE` aceita uma URL de arquivo para reaproveitar uma instalação independente. Chrome precisa estar instalado para os perfis Chromium.

A suíte existente cobre motor, raridades, compra, reciclagem, habilidades e molduras. A comparação de base verifica cartas, parâmetros, habilidades, efeitos, templates e PNGs frente à V.11. O fluxo de navegador cobre compra, inspeção, remoção, cancelamento, toque em A/B/C, cartas já posicionadas, batalha, resultado, novas rodadas, fim de jogo, reinício e coleção.

Perfis de navegador

| Motor | Viewports CSS |
| --- | --- |
| Chrome com perfil Android | 360 × 640, 430 × 932 e 800 × 360 |
| WebKit com perfil iPhone | 390 × 844, 480 × 950 e 844 × 390 |
| Desktop Chrome | 1440 × 900 |

O teste valida visibilidade inicial dos comandos críticos, áreas de toque, ausência de rolagem horizontal do documento, preservação da carta ativa no carrossel ao consultar a oficina, consulta da arquibancada e carregamento gradual da coleção. O perfil Chrome 430 executa uma batalha até o fim, verifica a permanência do palco durante o replay e consulta cartas na arquibancada. Os demais perfis também exercitam pular o replay. As telas jogáveis e os modais não usam campos de texto, portanto suas interações não abrem o teclado.

Rodada de validação local em 19/11/2026. V.11 passou 86 testes automatizados, a V.12 passou 87 e os sete perfis Playwright completaram o fluxo até o fim da partida e o reinício. As capturas de auditoria mostram o início, as regras, os pacotes, o baralho, a reciclagem, as cartas, o posicionamento, a batalha, a arquibancada, o resultado e a coleção. Os testes de comparação de versão usam os diretórios anteriores do checkout Git.
