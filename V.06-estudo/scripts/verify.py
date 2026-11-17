from pathlib import Path
import hashlib,json,unittest,re
from xml.etree import ElementTree as ET
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT.parent/'V.05'
def read(p):return json.loads(p.read_text(encoding='utf8'))
class Preservation(unittest.TestCase):
 def test_original_data(self):
  source={c['id']:c for c in read(BASE/'data/cards.json')}
  cards=read(ROOT/'assets/cards.json')
  self.assertEqual([c['id'] for c in cards],['07','49'])
  for c in cards:self.assertEqual(c,source[c['id']])
 def test_original_art_bytes(self):
  for c in read(ROOT/'assets/cards.json'):
   original=BASE/c['artAsset'];copied=ROOT/'assets'/Path(c['artAsset']).name
   self.assertEqual(hashlib.sha256(original.read_bytes()).digest(),hashlib.sha256(copied.read_bytes()).digest())
 def test_skills(self):
  source=read(BASE/'data/skills.json');skills=read(ROOT/'assets/skills.json')
  for k,v in skills.items():self.assertEqual(v,source[k])
 def test_composition_content(self):
  for m in 'ABCDE':
   for c in read(ROOT/'assets/cards.json'):
    p=ROOT/'artboards'/f'{m}-{c["id"]}.svg';doc=ET.parse(p);s=p.read_text(encoding='utf8')
    self.assertIn(c['skillDescription'],s)
    self.assertIn(f'ATK {c["atk"]}; VIDA {c["hp"]}; rank {c["rank"]}',s)
    self.assertIn(c['rarity'],s)
    images=doc.findall('.//{http://www.w3.org/2000/svg}image')
    char=[im for im in images if im.attrib['{http://www.w3.org/1999/xlink}href'].endswith(Path(c['artAsset']).name)]
    self.assertEqual(len(char),1)
    self.assertEqual(char[0].attrib['width'],char[0].attrib['height'])
    self.assertEqual(char[0].attrib['preserveAspectRatio'],'xMidYMid meet')
 def test_render_outputs(self):
  pngs=list((ROOT/'renders').glob('*.png'));self.assertEqual(len(pngs),20)
  for p in pngs:
   with Image.open(p) as i:i.verify()
   with Image.open(p) as i:self.assertEqual(i.size,(432,504) if '-mini' in p.name else (960,1440))
   self.assertGreater(p.stat().st_size,200000)
 def test_gallery_refs(self):
  for name in ['index.html','benchmark.html']:
   s=(ROOT/name).read_text(encoding='utf8')
   for href in re.findall(r'(?:src|href)="([^"#]+)"',s):
    if not href.startswith(('https:','http:')):self.assertTrue((ROOT/href).exists(),href)
 def test_five_models(self):
  self.assertEqual([m['id'] for m in read(ROOT/'docs/concepts.json')],list('ABCDE'))
  self.assertEqual(len(read(ROOT/'docs/prompts.json')),5)
  self.assertEqual(len(read(ROOT/'research/benchmark.json')),8)
 def test_no_production_entrypoint(self):
  self.assertFalse((ROOT/'wrangler.toml').exists());self.assertFalse((ROOT/'.openai').exists())
if __name__=='__main__':unittest.main(verbosity=2)
