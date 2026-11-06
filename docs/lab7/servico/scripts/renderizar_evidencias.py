"""Renderiza os logs de evidência (pytest e curl) como imagens PNG estilo terminal.

Uso: python scripts/renderizar_evidencias.py [pasta_dos_logs]
"""
import re, sys, textwrap
from PIL import Image, ImageDraw, ImageFont
F="/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"; FB="/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
def render(lines, out, title, cols=104, size=22):
    font=ImageFont.truetype(F,size); bold=ImageFont.truetype(FB,size)
    wrapped=[]
    for l in lines:
        l=l.rstrip('\n')
        if not l: wrapped.append(''); continue
        ind=len(l)-len(l.lstrip())
        wrapped += textwrap.wrap(l, cols, subsequent_indent=' '*(ind+2), drop_whitespace=False, break_on_hyphens=False) or ['']
    cw=font.getlength('M'); lh=int(size*1.45); pad=18; bar=34
    W=int(cw*cols)+2*pad; H=bar+pad*2+lh*len(wrapped)
    im=Image.new('RGB',(W,H),'#1e1f29'); d=ImageDraw.Draw(im)
    d.rectangle([0,0,W,bar],fill='#2d2f3b')
    for i,c in enumerate(['#ff5f56','#ffbd2e','#27c93f']): d.ellipse([12+i*22,10,26+i*22,24],fill=c)
    d.text((W//2,bar//2),title,font=font,fill='#c8c8d0',anchor='mm')
    y=bar+pad
    for l in wrapped:
        col='#e6e6e6'; f=font
        if l.startswith('$'): col='#8be9fd'; f=bold
        elif l.startswith('###'): col='#f1fa8c'; f=bold
        elif re.search(r'\bpassed\b',l) and '=' in l: col='#50fa7b'; f=bold
        elif re.match(r'HTTP 2',l): col='#50fa7b'; f=bold
        elif re.match(r'HTTP [45]',l): col='#ff5555'; f=bold
        elif '"codigo"' in l: col='#ffb86c'
        if 'PASSED' in l:
            a,b=l.split('PASSED',1)
            d.text((pad,y),a,font=font,fill=col); x=pad+font.getlength(a)
            d.text((x,y),'PASSED',font=bold,fill='#50fa7b'); d.text((x+bold.getlength('PASSED'),y),b,font=font,fill=col)
        else: d.text((pad,y),l,font=f,fill=col)
        y+=lh
    im.save(out); print(out, im.size)
if __name__=='__main__':
    E=(sys.argv[1] if len(sys.argv)>1 else 'docs/evidencias').rstrip('/')+'/'
    t=open(E+'testes_pytest.log').read().splitlines()
    t=[l.replace('/workspace/lab7/servico/.venv/bin/python','.venv/bin/python') for l in t]
    render(t, E+'01_testes_pytest.png', 'servico — python -m pytest -v — 29/10/2026')
    c=open(E+'curl_demo.log').read()
    secs=re.split(r'(?m)^(?=### )',c)
    pick=lambda ns:[l for s in secs for n in ns if s.startswith(f'### {n}.') for l in s.splitlines()]
    render(pick([2,3,4]), E+'02_curl_condicoes_de_erro.png', 'curl — responderProposta: condições de erro (409 e 422)')
    render(pick([5,6]), E+'03_curl_aceite_e_proposta_ja_respondida.png', 'curl — responderProposta: aceite (200) e nova resposta (409)')
