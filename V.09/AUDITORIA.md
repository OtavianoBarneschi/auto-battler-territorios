# V.09 — Auditoria de mudança

Origem: árvore Git completa da V.08, copiada sem modificar assets e dados; novas camadas `src/rarity-frames.mjs` e ligação em `src/impacto.mjs`.

Preservação por identidade de objetos Git: todos os 50 PNGs, dados JSON, estilos, efeitos, templates, habilidades e lógica de gameplay são os da V.08.

Molduras: geometria fixa, progressão bronze/prata/ouro e três coroas. Só ATK/HP visíveis, valores dinâmicos.

Arquivos modificados: impacto.mjs; engine.mjs apenas VERSION; tests/impacto.test.mjs; docs; VERSION.json; wrangler.toml. Novos: rarity-frames.mjs; tests/rarity-frames.test.mjs.

Rollback: mudar pages_build_output_dir para ./V.08 e fazer push. Versões anteriores preservadas.
