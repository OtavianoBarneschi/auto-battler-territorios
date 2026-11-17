from pathlib import Path
import json,hashlib,xml.etree.ElementTree as E
r=Path(__file__).resolve().parents[1];base=r.parent/'V.05'
cards=json.loads((r/'assets/cards.json').read_text(encoding='utf8'));src=json.loads((base/'data/cards.json').read_text(encoding='utf8'))
for c in cards:
 assert c==next(x for x in src if x['id']==c['id'])
 name=Path(c['artAsset']).name
 assert hashlib.sha256((r/'assets'/name).read_bytes()).digest()==hashlib.sha256((base/c['artAsset']).read_bytes()).digest()
 doc=E.parse(r/'artboards'/f'A-{c["id"]}.svg');ns={'s':'http://www.w3.org/2000/svg'}
 assert [t.text for t in doc.findall('.//s:text',ns)]==[str(c['atk']),str(c['hp'])]
 imgs=doc.findall('.//s:image',ns);hero=[i for i in imgs if i.get('{http://www.w3.org/1999/xlink}href').endswith(name)][0]
 assert hero.get('width')==hero.get('height')
assert json.loads((r/'assets/skills.json').read_text())=={k:v for k,v in json.loads((base/'data/skills.json').read_text()).items() if k in ['skill_07','skill_49']}
print('OK: artes, registros, habilidades, escala uniforme e somente dois números por face.')
