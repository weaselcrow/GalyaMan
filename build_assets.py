"""Build atlas + backgrounds + font data for the game. Output: out/assets.json"""
import base64, io, json
import numpy as np
from PIL import Image
import cut

FONT_DIR = 'fonts/'

frames = {}  # name -> (img, ax, ay)


def add(name, im, ax, ay=None):
    frames[name] = (im, int(round(ax)), im.height if ay is None else int(ay))


def blobs(im):
    from scipy import ndimage as ndi2
    a = np.array(im)
    lab, n = ndi2.label(a[..., 3] > 0)
    sizes = ndi2.sum(a[..., 3] > 0, lab, range(1, n + 1))
    order = np.argsort(-sizes)
    return lab, [int(o) + 1 for o in order]


def feet_cx(im, rows=6):
    """x-centre of whatever part of the body touches the ground (ignores a pan lying nearby)"""
    lab, order = blobs(im)
    body = lab == order[0]
    ys = np.where(body.any(1))[0]
    band = body[ys.max() - rows + 1:ys.max() + 1]
    xs = np.where(band.any(0))[0]
    return (xs.min() + xs.max()) / 2.0


def pan_cx(im):
    lab, order = blobs(im)
    xs = np.where((lab == order[1]).any(0))[0]
    return (xs.min() + xs.max()) / 2.0


# --- Galya -----------------------------------------------------------
g = [im for im, _ in cut.cut('13', 6, 0.2)]
for name, im, ax in zip(['g_idle', 'g_run', 'g_jump', 'g_wind', 'g_smash', 'g_hit'], g, [27, 31, 24, 28, 28, 34]):
    add(name, im, ax)
g2 = [im for im, _ in cut.cut('20', 4, 0.2)]
for name, im in zip(['g_laugh1', 'g_laugh2', 'g_dance1', 'g_dance2'], g2):
    add(name, im, feet_cx(im))

# --- extra Galya animations (sheets with real alpha) -------------------
def jacket_cx(im):
    a = np.array(im).astype(int)
    m = (a[..., 3] > 0) & (a[..., 0] > 90) & (a[..., 1] < 75) & (a[..., 2] < 80) & (a[..., 0] - a[..., 1] > 50)
    xs = np.where(m)[1]
    return xs.mean() if len(xs) else im.width / 2


def add_auto(names, lst):
    for name, (im, _) in zip(names, lst):
        add(name, im, feet_cx(im))


def biggest_blob(im):
    """keep only the largest connected piece (drops the frying pan lying next to crouching Galya)"""
    from scipy import ndimage as ndi2
    a = np.array(im)
    lab, n = ndi2.label(a[..., 3] > 0)
    if n < 2:
        return im
    sizes = ndi2.sum(a[..., 3] > 0, lab, range(1, n + 1))
    keep = lab == (int(np.argmax(sizes)) + 1)
    a[~keep] = 0
    ys, xs = np.where(keep)
    return Image.fromarray(a, 'RGBA').crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


wolf = cut.cut(None, 5, 0.2, path='art/galya_wolf.png', alpha=True)
add_auto(['g_wolf0'], wolf[:1])
# howl sequence: the pan lies on the floor in all four frames, so anchor them by the pan to keep it still
off = float(np.median([pan_cx(im) - feet_cx(im) for im, _ in wolf[1:]]))
for name, (im, _) in zip(['g_howl0a', 'g_howl0b', 'g_howl1', 'g_howl2'], wolf[1:]):
    add(name, im, pan_cx(im) - off)
# player crouch: same poses without the pan (she keeps it on her back)
add_auto(['g_crouch', 'g_crouch2'], [(biggest_blob(wolf[1][0]), None), (biggest_blob(wolf[2][0]), None)])
add_auto(['g_vod%d' % i for i in range(8)], cut.cut(None, 8, 0.2, path='art/galya_vodka.png', alpha=True))
add_auto(['g_mask0', 'g_mask1', 'g_mask2'], cut.cut(None, 3, 0.2, path='art/galya_mask.png', alpha=True))
for name, (im, _) in zip(['g_r0', 'g_r1', 'g_r2', 'g_r3'], cut.cut(None, 4, 0.2, path='art/galya_run.png', alpha=True)):
    add(name, im, jacket_cx(im))
add_auto(['g_shake1', 'g_shake2'], cut.cut(None, 2, 0.2, path='art/galya_shake.png'))
for name, (im, _) in zip(['t_stand', 't_mount', 't_sit', 't_ride', 't_cry1', 't_cry2'], cut.cut(None, 6, 0.3, path='art/tikhon.png', alpha=True)):
    add(name, im, im.width / 2)
mm = cut.cut(None, 2, 0.12, path='art/mask_money.png')
add('mask', mm[0][0], mm[0][0].width / 2)
mm = cut.cut(None, 2, 0.07, path='art/mask_money.png')
add('money', mm[1][0], mm[1][0].width / 2)

# --- rabbits ---------------------------------------------------------
r = [im for im, _ in cut.cut('14', 5, 0.15)]
for name, im, ax, ay in zip(['r_sit', 'r_tremble', 'r_give', 'r_run', 'r_ko'], r, [18, 25, 17, 31, 24], [49, 36, 48, 44, 54]):
    add(name, im, ax, ay)

# --- boss: Нудл Дудл ---------------------------------------------------
def body_anchor(im, center=False):
    """x: middle of the feet (or of the frame), y: bottom of the body, ignoring loose sparkles and feathers"""
    from scipy import ndimage as ndi2
    a = np.array(im)
    lab, n = ndi2.label(a[..., 3] > 0)
    sizes = ndi2.sum(a[..., 3] > 0, lab, range(1, n + 1))
    body = lab == (int(np.argmax(sizes)) + 1)
    yb = np.where(body.any(1))[0].max()
    xs = np.where(body[yb - 4:yb + 1].any(0))[0]
    return (im.width / 2 if center else (xs.min() + xs.max()) / 2.0), yb + 1


NOODLE = 0.21
for name, (im, _) in zip(['n_wave', 'n_beg', 'n_cry', 'n_flowers'], cut.cut(None, 4, NOODLE, path='art/noodle.png', alpha=True)):
    add(name, im, *body_anchor(im))
def degreen(im):
    """the death sheet has nothing green on it: neutralise green left over from the background"""
    a = np.array(im).astype(int)
    a[..., 1] = np.minimum(a[..., 1], np.maximum(a[..., 0], a[..., 2]) + 6)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


# the death sheet came out drawn a little smaller, scale it up so her head matches the fight poses
for name, (im, _) in zip(['n_hit', 'n_kneel', 'n_lie', 'n_spirit'], cut.cut(None, 4, NOODLE * 1.12, path='art/noodle_death.png')):
    im = degreen(im)
    add(name, im, *body_anchor(im, center=(name == 'n_spirit')))

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
