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

def icon(kind,x,y,size=30,color=CREAM,outline=None):
    # One bespoke symbol grammar: pointed feather blade, bolted mechanical heart,
    # start pennant, impact burst. No emoji or icon-library mixing.
    glyphs={
      'atk':'M6 27 10 17 23 2 30 1 29 8 14 23 4 30 1 27 8 20 11 23Z M14 15 21 8 24 7 17 17Z',
      'hp':'M16 29 4 18Q-3 8 5 3Q11-1 16 6Q21-1 27 3Q35 8 28 18Z',
      'start':'M4 30V2H8V4L28 8 21 14 8 17V30Z',
      'damage':'M18 0 19 9 28 3 24 14 32 17 22 20 25 30 15 24 9 32 8 23 0 24 7 15 2 7 13 10Z',
      'rank':'M2 22 0 8 9 13 16 0 23 13 32 8 30 22Z M4 26H28V31H4Z',
      'gear':'M12 0H20L22 5 27 4 32 11 28 16 32 21 27 28 22 27 20 32H12L10 27 5 28 0 21 4 16 0 11 5 4 10 5Z',
    }
    extra=''
    if kind=='hp':extra='<circle cx="8" cy="10" r="2" fill="#fff" opacity=".6"/>'
    if kind=='gear':extra=f'<circle cx="16" cy="16" r="6" fill="{outline or NAVY}"/>'
    return f'<g transform="translate({x},{y}) scale({size/32})">'+path(glyphs[kind],color,outline,1.3 if outline else 0)+extra+'</g>'

def seal(card,x,y,style='dark',scale=1):
    color='#f5c65b' if card['rank']==5 else '#d3b5f3'
    fill=NAVY if style=='dark' else CREAM
    ink=color if style=='dark' else INK
    glyph='rank' if card['rank']==5 else 'gear'
    return f'<g transform="translate({x},{y}) scale({scale})">'+path('M-90 -23H90L104 0 90 25H-90L-104 0Z',fill,color,2)+icon(glyph,-86,-13,27,ink,fill)+text(-37,12,card['rank'],34,ink,'Bungee')+text(28,6,card['rarity'].upper(),18,ink,'Barlow Condensed',weight='600')+'</g>'

def badge(value,kind,x,y,style='comic',size=112):
    fill='#d99c2c' if kind=='atk' else '#c6524e'
    if style=='comic':
        d='M0 -56 18 -49 40 -52 47 -33 60 -22 53 2 59 23 39 39 25 55 0 50 -25 56 -39 36 -57 24 -50 0 -58 -23 -39 -36 -24 -54Z' if kind=='atk' else 'M-53 -47Q-6 -60 0 -49Q21 -58 52 -47L49 22 0 60 -48 22Z'
    elif style=='wood':d='M-50 -45Q-22 -61 0 -56Q31 -59 51 -42L55 28 30 54 -29 54 -55 28Z'
    elif style=='print':d='M-53 -53H53V53H-53Z'
    elif style=='enamel':d='M-52 -35Q-56 -56 -31 -56H31Q56 -56 52 -35L48 36Q0 66 -48 36Z'
    else:d='M-53 -46 -27 -55 4 -51 25 -57 53 -44 48 -15 56 16 43 47 7 54 -27 50 -56 36 -49 0Z'
    result=f'<g transform="translate({x},{y}) scale({size/112})">'
    result+=path(d,NAVY,None,extra='transform="translate(0,5)"')
    result+=path(d,('url(#amber)' if kind=='atk' else 'url(#coral)') if style in ['wood','enamel'] else fill,NAVY,5)
    result+=path(d,'none',CREAM,1.5,extra='transform="scale(.90)" opacity=".7"')
    result+=icon(kind,-13,-46,26,CREAM,NAVY)
    result+=text(0,34,value,72,CREAM,'Bungee' if style=='comic' else 'Lilita One',stroke=NAVY,sw=3)
    return result+'</g>'

def target(card,x,y,color=CREAM):
    selected=2 if card['id']=='07' else 0
    s=f'<g transform="translate({x},{y})">'
    for n in range(3):
        s+=f'<path d="M{n*22} 0h15v22h-15z" fill="{color if n==selected else "none"}" stroke="{color}" stroke-width="2"/>'
    s+=path(f'M{selected*22+2} -8 {selected*22+7.5} -2 {selected*22+13} -8Z',color)
    return s+'</g>'

def ability(card,y,x=320,color=CREAM,font='Barlow Condensed',size=29,compact=False):
    action=SKILLS[card['skillId']]['actions'][0]
    n=action['amount'];label='ÚLTIMO' if action['target']=='lastEnemy' else 'PRIMEIRO'
    # Exact mechanics in SVG desc and gallery detail; visual sentence follows start > damage > enemy.
    s=icon('start',x-223,y-23,28,color)
    s+=text(x-179,y,'›',32,color,'Arial')
    s+=icon('damage',x-146,y-24,30,color)
    s+=text(x-88,y+4,n,43,color,'Barlow Condensed',weight='700')
    s+=text(x-38,y,'›',32,color,'Arial')
    s+=target(card,x-2,y-20,color)
    s+=text(x+146,y+2,label,size,color,font)
    return s

def base_svg(card,model,body,width=640,height=960):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
<title>Modelo {model} — {escape(card['name'])}</title><desc>ATK {card['atk']}; VIDA {card['hp']}; rank {card['rank']}; {escape(card['rarity'])}. {escape(card['skillDescription'])} Custo individual não definido na base V.05.</desc>
<defs><linearGradient id="amber" x2=".5" y2="1"><stop stop-color="#f6d585"/><stop offset=".48" stop-color="#d79d32"/><stop offset="1" stop-color="#a67124"/></linearGradient><linearGradient id="coral" x2=".4" y2="1"><stop stop-color="#f1a19a"/><stop offset=".48" stop-color="#c6534e"/><stop offset="1" stop-color="#893e43"/></linearGradient><clipPath id="round"><rect x="22" y="24" width="596" height="908" rx="23"/></clipPath><filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="5" flood-color="#071720" flood-opacity=".6"/></filter></defs>
{body}</svg>'''

def compose(card,m):
    name=card['name'].upper();s='';tier='#f5c65b' if card['rank']==5 else '#d3b5f3'
    if m=='A':
        s+=path('M61 82 583 57 596 839 557 905 58 905Z',NAVY,CREAM,5)
        s+=image('background-A.png',68,77,512,768)
        s+=path('M69 77 578 77 578 844 68 844Z','none','#adc0b8',5)
        s+=hero(card,8,166,624,513)
        s+=seal(card,320,123,scale=.92)
        s+=badge(card['atk'],'atk',83,107,'comic',122)+badge(card['hp'],'hp',557,107,'comic',122)
        s+=path('M33 690 588 661 604 769 58 800 40 773Z',NAVY,CREAM,5)
        s+=text(324,758,name,81 if len(name)>5 else 100,'#ffcf51','Bungee',stroke=NAVY,sw=10,extra='transform="rotate(-3 320 735)"')
        s+=ability(card,835)
        s+=text(320,884,f'{card["rarity"].upper()} • {card["id"]} / DUCKS N ROBOTS',18,CREAM,'Barlow Condensed',extra='letter-spacing="2"')
    elif m=='B':
        s+=image('background-B.png',22,24,596,908)
        s+=seal(card,320,80,'light',.93)
        s+=hero(card,48,181,544,445)
        s+=badge(card['atk'],'atk',94,207,'wood',110)+badge(card['hp'],'hp',546,207,'wood',110)
        s+=text(320,698,name,83 if len(name)>5 else 95,'#304536','Lilita One',stroke='#fff1c5',sw=2)
        s+=ability(card,816,color='#fff0c7',font='Lilita One',size=23)
        s+=text(320,860,'INÍCIO DO COMBATE',18,'#e6d3a7','Barlow Condensed',extra='letter-spacing="3"')
        s+=text(320,901,'DUCKS N ROBOTS / '+card['id'],15,'#f4dfaa','Barlow Condensed',extra='letter-spacing="2"')
    elif m=='C':
        s+=f'<g clip-path="url(#round)">'+image('background-C.png',22,24,596,908)+'</g>'
        s+=path('M34 36H605V920H34Z','none',CREAM,2)
        s+=text(69,76,'D / R',26,CREAM,'Barlow Condensed',anchor='start',extra='letter-spacing="5"')
        s+=seal(card,454,69,'light',.82)
        s+=hero(card,136,177,468,486)
        # Offset attribute rail and tilted title give a different silhouette hierarchy.
        s+=path('M32 196 120 185 120 501 32 514Z',INK,CREAM,3)
        s+=icon('atk',61,214,30,CREAM)+text(76,326,card['atk'],103,CREAM,'Barlow Condensed',weight='700')
        s+=path('M45 345 107 339','none','#ff872f',4)
        s+=icon('hp',61,364,30,CREAM)+text(76,477,card['hp'],103,CREAM,'Barlow Condensed',weight='700')
        s+=text(335,788,name,98 if len(name)>5 else 120,INK,'Anton',weight='700',extra='transform="rotate(-9 335 750)" letter-spacing="2"')
        s+=ability(card,875,x=320,font='Barlow Condensed')
        s+=text(320,915,'DUCKS N ROBOTS · '+card['id'],16,CREAM,'Barlow Condensed',extra='letter-spacing="4"')
    elif m=='D':
        s+=image('background-D.png',22,24,596,908)
        s+=text(320,122,name,78 if len(name)>5 else 91,NAVY,'Racing Sans One',stroke=CREAM,sw=1)
        s+=hero(card,40,191,560,479)
        s+=seal(card,320,690,'dark',.92)
        s+=badge(card['atk'],'atk',100,744,'enamel',119)+badge(card['hp'],'hp',540,744,'enamel',119)
        s+=text(320,754,'DUCKS N ROBOTS',22,CREAM,'Racing Sans One')
        s+=ability(card,850,color=NAVY,size=27)
        s+=text(320,897,f'{card["rarity"].upper()} / {card["id"]}',16,NAVY,'Barlow Condensed',extra='letter-spacing="3"')
    else:
        s+=image('background-E.png',22,24,596,908)
        s+=hero(card,55,204,530,451)
        s+=seal(card,320,186,'light',.9)
        s+=badge(card['atk'],'atk',88,145,'paper',106)+badge(card['hp'],'hp',552,145,'paper',106)
        s+=text(310,744,card['name'],86 if len(name)>5 else 100,'#253746','Bree Serif',extra='transform="rotate(-5 310 720)"')
        s+=ability(card,854,x=320,color=CREAM,font='Bree Serif',size=23)
        s+=text(320,899,'DUCKS N ROBOTS / '+card['id'],15,CREAM,'Barlow Condensed',extra='letter-spacing="2"')
    return base_svg(card,m,s)

def mini(card,m):
    # Separate optical size; target output exactly 54x63 (desktop) / 43x50 (mobile).
    palettes={'A':('#24b5be','#092837'),'B':('#c7a66d','#294c43'),'C':('#ff7231','#321638'),'D':('#dbe7d4','#173740'),'E':('#e9bb8c','#253346')}
    bg,ink=palettes[m];rank='#f5c65b' if card['rank']==5 else '#d3b5f3'
    s=f'<rect x="2" y="2" width="212" height="248" rx="18" fill="{bg}" stroke="{ink}" stroke-width="4"/>'
    s+=image('background-'+m+'.png',3,-15,210,315,extra='opacity=".8"')
    s+=hero(card,10,40,196,176)
    s+=f'<path d="M3 3H213V51H3Z" fill="{ink}"/>'
    s+=icon('atk',8,9,19,CREAM)+text(44,42,card['atk'],42,CREAM,'Barlow Condensed',weight='700')
    s+=icon('hp',156,9,18,CREAM)+text(191,42,card['hp'],42,CREAM,'Barlow Condensed',weight='700')
    s+=f'<path d="M3 211H213V249H3Z" fill="{ink}"/>'
    s+=text(89,240,card['name'].upper(),29,CREAM,'Barlow Condensed',weight='600')
    s+=f'<path d="M171 209H213V249H171Z" fill="{rank}"/>'+text(192,240,card['rank'],33,ink,'Barlow Condensed',weight='700')
    return base_svg(card,m+' mini',s,216,252)

for m in 'ABCDE':
    for card in CARDS:
        stem=f'{m}-{card["id"]}'
        (ROOT/'artboards'/f'{stem}.svg').write_text(compose(card,m),encoding='utf8')
        (ROOT/'artboards'/f'{stem}-mini.svg').write_text(mini(card,m),encoding='utf8')
print('10 compositions + 10 optical miniatures created.')
