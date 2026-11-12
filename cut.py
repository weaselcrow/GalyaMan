"""Cut sprite sheets: chroma-key green, split poses, downscale to game size."""
import json, sys
import numpy as np
from PIL import Image

NAMES = {'13': 'galya', '14': 'rabbits', '15': 'items', '16': 'bg_level', '17': 'bg_boss', '19': 'boss', '20': 'galya_dance', '21': 'icecream'}


class _Src:
    def __mod__(self, k):
        return 'art/%s.png' % NAMES[k]


SRC = _Src()
BG = np.array([4.0, 248.0, 3.0])


def matte(a, protect_stems=False):
    """a: HxWx3 float. returns premultiplied RGB + alpha (0..1)."""
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx = np.maximum(r, b)
    spill = np.clip((g - mx) / 240.0, 0, 1)
    alpha = 1.0 - spill
    # real yellow-greens (carrot tops, stew herbs) stay opaque
    real = (r - b > 22) & (g < 235)
    if protect_stems:
        real |= (g < 218) & (b >= 22) & (r < 40) & (b - r >= 16)
    alpha[real] = 1.0
    alpha[alpha < 0.08] = 0
    alpha[alpha > 0.92] = 1
    al = alpha[..., None]
    fg = (a - (1 - al) * BG) / np.maximum(al, 1e-3)
    fg = np.clip(fg, 0, 255)
    # anything still strongly green and not "real" is fringe -> darken
    fr, fgr, fb = fg[..., 0], fg[..., 1], fg[..., 2]
    fringe = (~real) & (fgr - np.maximum(fr, fb) > 30)
    fg[fringe, 1] = np.maximum(fr, fb)[fringe]
    return fg * al, alpha


def runs(mask_cols, gap):
    out, start, last, g = [], None, None, 0
    for x, c in enumerate(mask_cols):
        if c:
            if start is None:
                start = x
            last, g = x, 0
        elif start is not None:
            g += 1
            if g > gap:
                out.append((start, last))
                start = None
    if start is not None:
        out.append((start, last))
    return out


def box_down(pm, al, scale):
    """Area-average downscale of premultiplied image."""
    h, w = al.shape
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    chans = []
    for i in range(3):
        chans.append(np.array(Image.fromarray(pm[..., i].astype(np.float32), 'F').resize((nw, nh), Image.BOX)))
    a2 = np.array(Image.fromarray(al.astype(np.float32), 'F').resize((nw, nh), Image.BOX))
    rgb = np.dstack(chans) / np.maximum(a2[..., None], 1e-3)
    return np.clip(rgb, 0, 255), a2


def cut(sheet, n, scale, gap=15, stems=False, pad=0, path=None, alpha=False):
    im = Image.open(path or (SRC % sheet))
    if alpha:
        # sheet already has a real alpha channel
        rgba = np.array(im.convert('RGBA')).astype(float)
        al = rgba[..., 3] / 255.0
        pm = rgba[..., :3] * al[..., None]
    else:
        a = np.array(im.convert('RGB')).astype(float)
        pm, al = matte(a, stems)
    solid = al > 0.5
    rs = runs(solid.sum(0) > 0, gap)
    # drop specks
    rs = [r for r in rs if r[1] - r[0] > 12]
    assert len(rs) == n, (sheet, len(rs), rs)
    out = []
    for (x0, x1) in rs:
        rows = np.where(solid[:, x0:x1 + 1].sum(1) > 0)[0]
        y0, y1 = rows[0], rows[-1]
        rgb, a2 = box_down(pm[y0:y1 + 1, x0:x1 + 1], al[y0:y1 + 1, x0:x1 + 1], scale)
        keep = a2 >= 0.5
        res = np.dstack([rgb, keep * 255.0]).astype(np.uint8)
        res[~keep] = 0
        out.append((Image.fromarray(res, 'RGBA'), (x0, y0, x1, y1)))
    return out


if __name__ == '__main__':
    pass
