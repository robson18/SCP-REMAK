"""Prepara as artes: cartas com ATQ/Vida e titulo apagados (o jogo escreve por cima),
verso da carta e baralho recortados com transparencia, mesa."""
import sys, os, json, numpy as np
from PIL import Image
from scipy import ndimage
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OLD = sys.argv[1]  # assets do jogo antigo (artes provisorias)
OUT = os.path.join(ROOT, 'assets')
SRC = os.path.join(ROOT, 'assets/src')

def erase(a, x0, x1, y0, y1):
    """apaga um retangulo interpolando, linha a linha, entre a coluna da esquerda e a da direita"""
    L = a[y0:y1, x0-1].astype(float); R = a[y0:y1, x1].astype(float)
    t = np.linspace(0, 1, x1-x0)[None, :, None]
    a[y0:y1, x0:x1] = (L[:, None]*(1-t) + R[:, None]*t).astype(np.uint8)

def fill(a, mask, it=1500):
    """preenche os pixels da mascara pela media dos vizinhos (inpainting de Laplace)"""
    ys, xs = np.where(mask); y0, y1, x0, x1 = ys.min()-2, ys.max()+3, xs.min()-2, xs.max()+3
    r = a[y0:y1, x0:x1].astype(float); m = mask[y0:y1, x0:x1]
    r[m] = r[~m].mean(0)
    for _ in range(it):
        avg = (np.roll(r, 1, 0) + np.roll(r, -1, 0) + np.roll(r, 1, 1) + np.roll(r, -1, 1)) / 4
        r[m] = avg[m]
    a[y0:y1, x0:x1] = r.astype(np.uint8)

def clean_stats(a):
    """apaga icones e numeros de ATQ/Vida: o jogo desenha os mesmos simbolos em todas as cartas"""
    for x0, x1 in ((58, 302), (788, 1042)):
        y0, y1 = 1258, 1398
        reg = a[y0:y1, x0:x1].astype(int)
        bright = reg.max(2) > 95
        lab, n = ndimage.label(bright)
        keep = np.zeros_like(bright)
        for i in range(1, n+1):
            c = lab == i; ys, xs = np.where(c)
            if ys.min() == 0 or xs.min() == 0 or ys.max() == c.shape[0]-1 or xs.max() == c.shape[1]-1: continue  # brilho da borda
            if c.sum() < 25: continue
            keep |= c
        keep = ndimage.binary_dilation(keep, iterations=6)
        full = np.zeros(a.shape[:2], bool); full[y0:y1, x0:x1] = keep
        if full.any(): fill(a, full)
    return a

W, H = 543, 724
NEW = sorted(f[5:-5] for f in os.listdir(os.path.join(ROOT, 'assets/src')) if f.startswith('card_'))
for n in NEW:
    a = clean_stats(np.array(Image.open(os.path.join(ROOT, f'assets/src/card_{n}.webp')).convert('RGB')))
    Image.fromarray(a).resize((W, H), Image.LANCZOS).save(f'{OUT}/card_{n}.webp', quality=86)
    if n == '682':
        frame = a.copy()
json.dump(NEW, open(f'{OUT}/new_cards.json', 'w'))
Image.open(os.path.join(ROOT, 'assets/src/menu.webp')).convert('RGB').resize((1600, 900), Image.LANCZOS).save(f'{OUT}/menu.webp', quality=88)

# moldura generica: titulo apagado e janela de arte vazia (preenchida pelo jogo)
erase(frame, 330, 905, 38, 122); erase(frame, 330, 880, 135, 190)
fr = Image.fromarray(frame).convert('RGBA'); px = np.array(fr)
px[212:925, 46:1042, 3] = 0
Image.fromarray(px).resize((W, H), Image.LANCZOS).save(f'{OUT}/frame.webp', quality=88)

# arte provisoria das cartas que ainda nao tem arte nova (janela de arte do jogo antigo)
os.makedirs(f'{OUT}/art', exist_ok=True)
for fn in os.listdir(OLD):
    if fn.startswith('card_') and fn.endswith('.webp'):
        im = Image.open(os.path.join(OLD, fn)).convert('RGB')
        w, h = im.size; art = im.crop((int(w*.05), int(h*.135), int(w*.95), int(h*.6)))
        art.resize((500, 357), Image.LANCZOS).save(f'{OUT}/art/{fn}', quality=80)

# verso e baralho: fundo preto vira transparente
sheet = np.array(Image.open(os.path.join(SRC, 'backs.webp')).convert('RGB'))
def cut(box, name, w):
    x0, y0, x1, y1 = box; a = sheet[y0:y1, x0:x1]
    m = a.max(2) > 22; m = ndimage.binary_fill_holes(ndimage.binary_closing(m, iterations=3))
    glow = np.clip(a.max(2).astype(float)*4, 0, 255)
    al = np.maximum(m*255, glow).astype(np.uint8)
    al = ndimage.gaussian_filter(al, .8)
    im = Image.fromarray(np.dstack([a, al])); im = im.resize((w, round(w*im.size[1]/im.size[0])), Image.LANCZOS)
    im.save(f'{OUT}/{name}.webp', quality=88)
cut((780, 8, 995, 298), 'back', 240)
cut((478, 8, 712, 312), 'deck', 240)
Image.open(os.path.join(SRC, 'table.webp')).convert('RGB').save(f'{OUT}/table.webp', quality=88)
