# Arquitetura V.09

Cópia integral de V.08 com um módulo `src/rarity-frames.mjs`. `rarityFrameSvg(unit)` insere a camada de material e emblema atrás da arte no SVG Impacto, antes das caixas ATK/HP. `miniRarityFrame(unit)` aplica raridade à miniatura sem alterar caixa, arte ou atributos.

Camada de raridade toma `unit.rank` (com fallback `unit.rarity`) e usa geometria invariável 640×960, centro x=320. IDs SVG namespaced por instância, evitando conflito entre cartas. As seis variantes são acabamentos de uma única arquitetura, não seis templates.

Motor permanece idêntico à V.08, exceto VERSION. O Cloudflare serve a pasta V.09.
