"""Prepara as artes: cartas com ATQ/Vida e titulo apagados (o jogo escreve por cima),
verso da carta e baralho recortados com transparencia, mesa."""
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage
SRC, OLD, OUT = sys.argv[1], sys.argv[2], sys.argv[3]  # pasta das imagens enviadas, assets do jogo antigo, saida

def erase(a, x0, x1, y0, y1):
    """apaga um retangulo interpolando, linha a linha, entre a coluna da esquerda e a da direita"""
    L = a[y0:y1, x0-1].astype(float); R = a[y0:y1, x1].astype(float)
    t = np.linspace(0, 1, x1-x0)[None, :, None]
    a[y0:y1, x0:x1] = (L[:, None]*(1-t) + R[:, None]*t).astype(np.uint8)

def clean_stats(a):
    erase(a, 162, 292, 1268, 1392)   # ATQ
    erase(a, 905, 1036, 1268, 1392)  # Vida
    return a

W, H = 543, 724
for n, f in (('682', '4.webp'), ('3812', '1.webp')):
    a = clean_stats(np.array(Image.open(os.path.join(SRC, f)).convert('RGB')))
    Image.fromarray(a).resize((W, H), Image.LANCZOS).save(f'{OUT}/card_{n}.webp', quality=86)
    if n == '682':
        frame = a.copy()

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
sheet = np.array(Image.open(os.path.join(SRC, '2.webp')).convert('RGB'))
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
Image.open(os.path.join(SRC, '3.webp')).convert('RGB').save(f'{OUT}/table.webp', quality=88)
