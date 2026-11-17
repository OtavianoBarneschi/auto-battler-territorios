"""Compose original art layers without changing character PNGs. No HTML/CSS card rendering."""
from pathlib import Path
from xml.sax.saxutils import escape
import json, math

ROOT = Path(__file__).resolve().parents[1]
CARDS = json.loads((ROOT/'assets/cards.json').read_text(encoding='utf8'))
SKILLS = json.loads((ROOT/'assets/skills.json').read_text(encoding='utf8'))
NAVY='#102a38'; CREAM='#fff1cc'; INK='#2c1834'

def text(x,y,s,size=24,fill=CREAM,font='Arial',anchor='middle',stroke=None,sw=0,weight=None,extra=''):
    return f'<text x="{x}" y="{y}" font-family="{font}" font-size="{size}" text-anchor="{anchor}" fill="{fill}"'+(f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round" paint-order="stroke fill"' if stroke else '')+(f' font-weight="{weight}"' if weight else '')+f' {extra}>{escape(str(s))}</text>'

def path(d,fill,stroke=None,sw=1,extra=''):
    return f'<path d="{d}" fill="{fill}"'+(f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"' if stroke else '')+f' {extra}/>'

def image(file,x,y,w,h,extra=''):
    return f'<image xlink:href="../assets/{file}" x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid meet" {extra}/>'

def hero(card,x,y,w,h):
    # Place bounding box, with uniform scaling of the complete unmodified source.
    box=(92,130,932,894) if card['id']=='07' else (92,96,932,928)
    scale=min(w/(box[2]-box[0]),h/(box[3]-box[1]))
    ox=x+(w-(box[2]-box[0])*scale)/2-box[0]*scale
    oy=y+(h-(box[3]-box[1])*scale)/2-box[1]*scale
    return image(Path(card['artAsset']).name,round(ox,3),round(oy,3),round(1024*scale,3),round(1024*scale,3))

def base_svg(card,model,body,width=640,height=960):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
<title>Modelo {model} — {escape(card['name'])}</title><desc>ATK {card['atk']}; VIDA {card['hp']}; rank {card['rank']}; {escape(card['rarity'])}. {escape(card['skillDescription'])} Custo individual não definido na base V.05.</desc>
<defs><linearGradient id="amber" x2=".5" y2="1"><stop stop-color="#f6d585"/><stop offset=".48" stop-color="#d79d32"/><stop offset="1" stop-color="#a67124"/></linearGradient><linearGradient id="coral" x2=".4" y2="1"><stop stop-color="#f1a19a"/><stop offset=".48" stop-color="#c6534e"/><stop offset="1" stop-color="#893e43"/></linearGradient><clipPath id="round"><rect x="22" y="24" width="596" height="908" rx="23"/></clipPath><filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="5" flood-color="#071720" flood-opacity=".6"/></filter></defs>
{body}</svg>'''

def clean(card):
    # Narrow recessed window behind the complete character creates real frame break.
    s='<defs><linearGradient id="field" x2="0" y2="1"><stop stop-color="#123e50"/><stop offset="1" stop-color="#071c2b"/></linearGradient><radialGradient id="light"><stop stop-color="#72e7df" stop-opacity=".32"/><stop offset="1" stop-color="#72e7df" stop-opacity="0"/></radialGradient><clipPath id="window"><path d="M108 151 520 135 540 808 112 829Z"/></clipPath><linearGradient id="edge" x2="1" y2="1"><stop stop-color="#f9e9ac"/><stop offset=".35" stop-color="#a9d8cc"/><stop offset=".7" stop-color="#294e60"/><stop offset="1" stop-color="#f9e9ac"/></linearGradient></defs>'
    s+=path('M99 139 530 123 551 819 102 841Z','#071824','#06101b',12)
    s+=path('M108 151 520 135 540 808 112 829Z','url(#field)','url(#edge)',8)
    s+='<g clip-path="url(#window)">'+image('background-A.png',105,143,438,687,extra='opacity=".16"')+'<ellipse cx="325" cy="440" rx="330" ry="400" fill="url(#light)"/></g>'
    s+=path('M125 177 129 764M149 812 489 796','none','#d5f5e3',2,extra='opacity=".4"')
    s+='<ellipse cx="330" cy="788" rx="214" ry="28" fill="#000d19" opacity=".65"/>'
    s+='<g filter="url(#shadow)">'+hero(card,16,198,608,583)+'</g>'
    for value,x,color,dark in [(card['atk'],113,'#ffcf53','#75501b'),(card['hp'],527,'#f17c70','#813b3d')]:
        s+=f'<g transform="translate({x},145)">'
        shape='M-65 -55 45 -55 65 -35 65 47 48 65 -65 65Z'
        s+=path(shape,'#061724','#061724',12,extra='transform="translate(0,7)"')
        s+=path(shape,color,'#fff0c7',3)
        s+=path('M-56 -43H39L52 -29','none','#fff7dd',3,extra='opacity=".65"')
        s+=text(0,43,value,105,'#fff7dc','Bungee',stroke=dark,sw=5)
        s+='</g>'
    return base_svg(card,'Impacto refinado',s)
for card in CARDS:
    (ROOT/'artboards'/f'A-{card["id"]}.svg').write_text(clean(card),encoding='utf8')
