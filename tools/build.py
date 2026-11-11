"""Monta scp_remake.html: um arquivo único com CSS, scripts e imagens embutidos (o mesmo que roda na Release)."""
import base64, os, re, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
uri = lambda p: 'data:image/webp;base64,' + base64.b64encode(open(p, 'rb').read()).decode()
assets = {}
for d, _, fs in os.walk('assets'):
    if d.startswith(os.path.join('assets', 'src')): continue
    for f in fs:
        if f.endswith('.webp'): assets[os.path.join(d, f).replace(os.sep, '/')] = None
html = open('index.html', encoding='utf-8').read()
# imagens fixas da página
for p in re.findall(r'src="(assets/[^"]+)"', html): html = html.replace(f'src="{p}"', f'src="{uri(p)}"')
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>' + open('style.css', encoding='utf-8').read() + '</style>')
amap = 'window.ASSETS=' + json.dumps({p: uri(p) for p in sorted(assets)}) + ';'
def inline(m):
    return '<script>' + open(m.group(1), encoding='utf-8').read().replace('</script', '<\\/script') + '</script>'
html = html.replace('<script src="js/engine.js">', '<script>' + amap + '</script>\n<script src="js/engine.js">', 1)
html = re.sub(r'<script src="([^"]+)"></script>', inline, html)
open('scp_remake.html', 'w', encoding='utf-8').write(html)
print('scp_remake.html', round(os.path.getsize('scp_remake.html') / 1e6, 1), 'MB')
