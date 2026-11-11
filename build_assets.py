"""Build atlas + backgrounds + font data for the game. Output: out/assets.json"""
import base64, io, json
import numpy as np
from PIL import Image
import cut

FONT_DIR = 'fonts/'

frames = {}  # name -> (img, ax, ay)


def add(name, im, ax, ay=None):
    frames[name] = (im, int(round(ax)), im.height if ay is None else int(ay))


# --- Galya -----------------------------------------------------------
g = [im for im, _ in cut.cut('13', 6, 0.2)]
for name, im, ax in zip(['g_idle', 'g_run', 'g_jump', 'g_wind', 'g_smash', 'g_hit'], g, [27, 31, 24, 28, 28, 34]):
    add(name, im, ax)
g2 = [im for im, _ in cut.cut('20', 4, 0.2)]
for name, im, ax in zip(['g_laugh1', 'g_laugh2', 'g_dance1', 'g_dance2'], g2, [36, 19, 38, 23]):
    add(name, im, ax)

# --- rabbits ---------------------------------------------------------
r = [im for im, _ in cut.cut('14', 5, 0.15)]
for name, im, ax, ay in zip(['r_sit', 'r_tremble', 'r_give', 'r_run', 'r_ko'], r, [18, 25, 17, 31, 24], [49, 36, 48, 44, 54]):
    add(name, im, ax, ay)

# --- boss ------------------------------------------------------------
b = [im for im, _ in cut.cut('19', 4, 0.31, stems=True)]
for name, im in zip(['b_wave', 'b_beg', 'b_cry', 'b_flowers'], b):
    add(name, im, 64, 140)

# --- ice cream man ---------------------------------------------------
ic = [im for im, _ in cut.cut('21', 2, 0.18)]
add('ice1', ic[0], 63)
add('ice2', ic[1], 63)

# --- items -----------------------------------------------------------
it = [im for im, _ in cut.cut('15', 5, 0.1)]
for name, im in zip(['carrot', 'hat', 'pan', 'pot', 'heart'], it):
    add(name, im, im.width / 2)
its = [im for im, _ in cut.cut('15', 5, 0.066)]
add('hat_s', its[1], its[1].width / 2)
add('heart_s', its[4], its[4].width / 2)
add('carrot_s', its[0], its[0].width / 2)

# --- ice cream cone cropped from the cart emblem ----------------------
src = np.array(Image.open(cut.SRC % '21').convert('RGB')).astype(int)
x0, y0, x1, y1 = 600, 405, 765, 560
crop = src[y0:y1, x0:x1]
rr, gg, bb = crop[..., 0], crop[..., 1], crop[..., 2]
cream = (rr > 225) & (gg > 215) & (bb > 180) & (rr - bb < 70)
from scipy import ndimage as ndi
lab, n = ndi.label(cream)
border = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1])
bgm = np.isin(lab, [v for v in border if v != 0])
al = (~bgm).astype(float)
pm = crop.astype(float) * al[..., None]
rgb, a2 = cut.box_down(pm, al, 0.2)
keep = a2 >= 0.5
lab2, n2 = ndi.label(keep)
sizes = ndi.sum(keep, lab2, range(1, n2 + 1))
keep = lab2 == (int(np.argmax(sizes)) + 1)
cone = np.dstack([rgb, keep * 255.0]).astype(np.uint8)
cone[~keep] = 0
ys, xs = np.where(keep)
cone = Image.fromarray(cone, 'RGBA').crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
add('cone', cone, cone.width / 2)

# --- pack atlas (simple shelves) --------------------------------------
AW = 1024
items = sorted(frames.items(), key=lambda kv: -kv[1][0].height)
x = y = shelf = 0
pos = {}
for name, (im, ax, ay) in items:
    if x + im.width + 2 > AW:
        x = 0
        y += shelf + 2
        shelf = 0
    pos[name] = (x, y)
    x += im.width + 2
    shelf = max(shelf, im.height)
AH = y + shelf
atlas = Image.new('RGBA', (AW, AH), (0, 0, 0, 0))
meta = {}
for name, (im, ax, ay) in frames.items():
    px, py = pos[name]
    atlas.paste(im, (px, py))
    meta[name] = [px, py, im.width, im.height, ax, ay]
atlas = atlas.quantize(colors=255, method=Image.FASTOCTREE, dither=Image.NONE)
atlas.save('out/atlas.png', optimize=True)


def datauri(path, mime):
    return 'data:%s;base64,%s' % (mime, base64.b64encode(open(path, 'rb').read()).decode())


# --- backgrounds -------------------------------------------------------
for n, name in (('16', 'bg1'), ('17', 'bg2')):
    im = Image.open(cut.SRC % n).convert('RGB').resize((800, 450), Image.BOX)
    im = im.quantize(colors=56, method=Image.MEDIANCUT, dither=Image.NONE)
    im.save('out/%s.png' % name, optimize=True)

out = {
    'atlas': datauri('out/atlas.png', 'image/png'),
    'frames': meta,
    'bg1': datauri('out/bg1.png', 'image/png'),
    'bg2': datauri('out/bg2.png', 'image/png'),
    'font_cyr': datauri(FONT_DIR + 'press-start-2p-cyrillic-400-normal.woff', 'font/woff'),
    'font_lat': datauri(FONT_DIR + 'press-start-2p-latin-400-normal.woff', 'font/woff'),
}
json.dump(out, open('out/assets.json', 'w'))
import os
print('atlas', atlas.size, os.path.getsize('out/atlas.png'), 'bg', os.path.getsize('out/bg1.png'), os.path.getsize('out/bg2.png'))
print(json.dumps(meta))
