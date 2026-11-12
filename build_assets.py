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


# --- СЮЖЕТ: отдельный атлас (свои 255 цветов), листы с прозрачным или зелёным фоном ----
from scipy import ndimage as ndi2
import os as _os
frames2 = {}
def story_sheet(file, names, target, main_only=True):
    path = 'art/%s.png' % file
    if not _os.path.exists(path): print('нет', path); return
    im = Image.open(path).convert('RGBA'); a = np.array(im).astype(float)
    if (a[..., 3] < 40).mean() > .2:            # прозрачный фон: берём альфу, свечение отсекаем
        al = (a[..., 3] > 215).astype(float); pm = a[..., :3] * al[..., None]
    else:                                        # зелёный фон: штатный хромакей
        pm, al = cut.matte(a[..., :3]); al = (al > .5).astype(float); pm = pm * (al[..., None] > 0)
    solid = al > .5; n = len(names); rs = []
    for gap in range(8, 260, 6):
        rs = [r for r in cut.runs(solid.sum(0) > 0, gap) if r[1] - r[0] > 12]
        if len(rs) <= n: break
    assert len(rs) == n, (file, len(rs))
    crops = []
    for (x0, x1) in rs:
        m = solid[:, x0:x1 + 1].copy()
        if main_only:                            # выкидываем улетевшие детали (морковка, корона, чёрточки)
            lab, k = ndi2.label(ndi2.binary_dilation(m, iterations=3))
            if k > 1:
                sizes = ndi2.sum(m, lab, range(1, k + 1)); big = int(np.argmax(sizes)) + 1
                cols = np.where((lab == big).any(0))[0]; c0, c1 = cols[0] - 6, cols[-1] + 6
                keep = np.zeros(k + 1, bool)
                for j in range(1, k + 1):
                    cj = np.where((lab == j).any(0))[0]; keep[j] = cj[0] >= c0 and cj[-1] <= c1
                m &= keep[lab]
        ys, xs = np.where(m); crops.append((x0 + xs.min(), ys.min(), x0 + xs.max(), ys.max(), m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]))
    scale = target / max(c[3] - c[1] + 1 for c in crops)
    for name, (cx0, cy0, cx1, cy1, m) in zip(names, crops):
        rgb, a2 = cut.box_down(pm[cy0:cy1 + 1, cx0:cx1 + 1] * m[..., None], al[cy0:cy1 + 1, cx0:cx1 + 1] * m, scale)
        keep = a2 >= .5; res = np.dstack([rgb, keep * 255.0]).astype(np.uint8); res[~keep] = 0
        if name: frames2[name] = Image.fromarray(res, 'RGBA')
story_sheet('s_enemies', ['e_bite', 'e_throw', 'e_guard', 'e_santa', 'e_witch'], 58)
story_sheet('s_boss1', ['sb0_1', 'sb0_2', 'sb0_3', 'sb0_4'], 140)
story_sheet('s_boss2', ['sb1_1', 'sb1_2', 'sb1_3', 'sb1_4'], 122)
story_sheet('s_boss3', ['sb2_1', 'sb2_2', 'sb2_3', 'sb2_4'], 100)
story_sheet('s_npc', ['t_stand', 't_give', 'd_a1', 'd_a2', 'd_b1', 'd_b2'], 88)
story_sheet('s_dog', ['k_idle', 'k_run1', 'k_run2', 'k_jump', 'k_bite', 'k_hurt', 'k_howl'], 50)
story_sheet('s_items', ['s_crown', 's_orange', 's_snow', 's_gift', 's_coin', 's_fire'], 24, main_only=False)
meta2 = {}; atlas2_uri = None
if frames2:
    x = y = shelf = 0; pos2 = {}
    for name, im in sorted(frames2.items(), key=lambda kv: -kv[1].height):
        if x + im.width + 2 > AW: x = 0; y += shelf + 2; shelf = 0
        pos2[name] = (x, y); x += im.width + 2; shelf = max(shelf, im.height)
    at2 = Image.new('RGBA', (AW, y + shelf), (0, 0, 0, 0))
    for name, im in frames2.items():
        px, py = pos2[name]; at2.paste(im, (px, py)); meta2[name] = [px, py, im.width, im.height, int(round(im.width / 2)), im.height, 1]
    at2 = at2.quantize(colors=255, method=Image.FASTOCTREE, dither=Image.NONE); at2.save('out/atlas2.png', optimize=True); atlas2_uri = datauri('out/atlas2.png', 'image/png')
    meta.update(meta2); print('atlas2', at2.size, _os.path.getsize('out/atlas2.png'), sorted(meta2))
sbg = []
for k in (1, 2, 3):
    pair = []
    for suf in ('', 'b'):
        p = 'art/s_bg%d%s.png' % (k, suf)
        if not _os.path.exists(p): p = 'art/s_bg%d.png' % k
        if not _os.path.exists(p): pair = None; break
        im = Image.open(p).convert('RGB').resize((800, 450), Image.BOX).quantize(colors=64, method=Image.MEDIANCUT, dither=Image.NONE)
        o = 'out/sbg%d%s.png' % (k, suf); im.save(o, optimize=True); pair.append(datauri(o, 'image/png'))
    if pair: sbg.append(pair)

smap = None
if _os.path.exists('art/s_map.png'):
    Image.open('art/s_map.png').convert('RGB').resize((800, 450), Image.BOX).quantize(colors=96, method=Image.MEDIANCUT, dither=Image.NONE).save('out/smap.png', optimize=True); smap = datauri('out/smap.png', 'image/png')

out = {
    'atlas': datauri('out/atlas.png', 'image/png'),
    'frames': meta,
    'bg1': datauri('out/bg1.png', 'image/png'),
    'bg2': datauri('out/bg2.png', 'image/png'),
    'atlas2': atlas2_uri, 'sbg': sbg, 'smap': smap,
    'font_cyr': datauri(FONT_DIR + 'press-start-2p-cyrillic-400-normal.woff', 'font/woff'),
    'font_lat': datauri(FONT_DIR + 'press-start-2p-latin-400-normal.woff', 'font/woff'),
}
json.dump(out, open('out/assets.json', 'w'))
import os
print('atlas', atlas.size, os.path.getsize('out/atlas.png'), 'bg', os.path.getsize('out/bg1.png'), os.path.getsize('out/bg2.png'))
print(json.dumps(meta))
