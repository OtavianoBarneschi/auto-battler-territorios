# Backlog — DUCKS N ROBOTS

## Direções para versões futuras

### 1. Baralho sem limite de 12, campo com limite de 12
- O jogador **pode ter mais de 12 cartas no deck** (15, 18 etc.).
- Na partida, **no máximo 12 cartas podem ser posicionadas no campo**; se o baralho contiver 15, as últimas três da ordem de compra/compra aleatória não entram naquela rodada.
- Proposta: até **4 cartas em cada uma das três zonas (A/B/C)**, totalizando 12.
- O sistema deve concluir o posicionamento após alcançar o limite mesmo se restarem cartas no baralho, e não remover essas cartas permanentemente.
- Definir com testes o que acontece com habilidades de posicionamento, a ordem de compra/embaralhamento e possíveis zonas não preenchidas.
- Revisar o desenho final antes de implementar.

### 2. Evoluir cartas duplicadas (+1 ATK/+1 HP)
- Quando o jogador tem **duas cópias iguais**, poderá **evoluir a carta que já possuía**, adicionando **+1 ATK e +1 HP** à carta mantida.
- Proposta: fusão/consumo de uma cópia extra. Especificar se a ação é manual ou automática e limites de evolução.
- Guardar melhorias por instância/cópia no baralho, preservando IDs, ilustrações, raridades e valores-base. Não modificar o catálogo global.
- Criar UI visual de evolução e testes de persistência, sem alterar as seis raridades de moldura.
- **Reservado para uma versão futura.**

## Posteriores
- Avaliar feedback das 50 cartas em partida.
- Explorar estados visuais de buff/dano sem adicionar informação permanente.
- Validar ergonomia, contraste e fluidez em aparelhos físicos durante sessões longas.
