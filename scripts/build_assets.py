"""
Extract + repack the Tiny Swords assets the Converto UI uses into clean, flat
filenames under src/ui/assets/decor/, and reconstruct the separated 9-slice
paper/button/bar kits into contiguous border-image atlases.

Prints the border-image-slice insets to paste into CSS.
"""
import os, shutil, random
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, 'src', 'ui', 'assets', 'decor',
                    'Tiny Swords (Free Pack)', 'Tiny Swords (Free Pack)')
OUT  = os.path.join(ROOT, 'src', 'ui', 'assets', 'decor')

def load(*parts): return Image.open(os.path.join(PACK, *parts)).convert('RGBA')
def out(name):    return os.path.join(OUT, name)

# ── alpha projection → bands of non-empty runs ───────────
def _bands(sums):
    res, s = [], None
    for i, v in enumerate(sums):
        if v > 0 and s is None: s = i
        elif v == 0 and s is not None: res.append((s, i)); s = None
    if s is not None: res.append((s, len(sums)))
    return res

def _cols(im):
    px = im.split()[3].load(); w, h = im.size
    return [sum(px[x, y] for y in range(h)) for x in range(w)]
def _rows(im):
    px = im.split()[3].load(); w, h = im.size
    return [sum(px[x, y] for x in range(w)) for y in range(h)]

def _pick3(b):
    return [b[0], b[len(b) // 2], b[-1]]

# ── reconstruct a 3x3 separated kit into a tight 9-slice ──
def make9(im, mid=24):
    xb, yb = _pick3(_bands(_cols(im))), _pick3(_bands(_rows(im)))
    grid = []
    for (y0, y1) in yb:
        row = []
        for (x0, x1) in xb:
            p = im.crop((x0, y0, x1, y1)); bb = p.getbbox()
            row.append(p.crop(bb) if bb else p)
        grid.append(row)
    (tl, tm, tr), (ml, mm, mr), (bl, bm, br) = grid
    L = max(tl.width, ml.width, bl.width)
    R = max(tr.width, mr.width, br.width)
    T = max(tl.height, tm.height, tr.height)
    B = max(bl.height, bm.height, br.height)
    W, H = L + mid + R, T + mid + B
    a = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    def put(p, x, y, w, h): a.alpha_composite(p.resize((max(1, w), max(1, h)), Image.NEAREST), (x, y))
    put(tl, 0, 0, L, T);          put(tr, L + mid, 0, R, T)
    put(bl, 0, T + mid, L, B);    put(br, L + mid, T + mid, R, B)
    put(tm, L, 0, mid, T);        put(bm, L, T + mid, mid, B)
    put(ml, 0, T, L, mid);        put(mr, L + mid, T, R, mid)
    put(mm, L, T, mid, mid)
    return a, (T, R, B, L)

# ── reconstruct a horizontal 3-slice bar ─────────────────
def make_bar(im, mid=16):
    xb = _pick3(_bands(_cols(im))); h = im.height
    l, m, r = [im.crop((x0, 0, x1, h)) for (x0, x1) in xb]
    L, R = l.width, r.width
    W = L + mid + R
    a = Image.new('RGBA', (W, h), (0, 0, 0, 0))
    a.alpha_composite(l.resize((L, h), Image.NEAREST), (0, 0))
    a.alpha_composite(m.resize((mid, h), Image.NEAREST), (L, 0))
    a.alpha_composite(r.resize((R, h), Image.NEAREST), (L + mid, 0))
    return a, (0, R, 0, L)

slices = {}

# Panels
a, s = make9(load('UI Elements', 'UI Elements', 'Papers', 'RegularPaper.png'));  a.save(out('paper.png'));        slices['paper'] = s
a, s = make9(load('UI Elements', 'UI Elements', 'Papers', 'SpecialPaper.png'));  a.save(out('paper-special.png')); slices['paper-special'] = s
# Buttons
a, s = make9(load('UI Elements', 'UI Elements', 'Buttons', 'BigRedButton_Regular.png')); a.save(out('btn-red.png'));            slices['btn-red'] = s
a, s = make9(load('UI Elements', 'UI Elements', 'Buttons', 'BigRedButton_Pressed.png')); a.save(out('btn-red-pressed.png'));    slices['btn-red-pressed'] = s
a, s = make9(load('UI Elements', 'UI Elements', 'Buttons', 'BigBlueButton_Regular.png')); a.save(out('btn-blue.png'));          slices['btn-blue'] = s
a, s = make9(load('UI Elements', 'UI Elements', 'Buttons', 'BigBlueButton_Pressed.png')); a.save(out('btn-blue-pressed.png'));  slices['btn-blue-pressed'] = s
# Progress bar
a, s = make_bar(load('UI Elements', 'UI Elements', 'Bars', 'BigBar_Base.png')); a.save(out('bar.png')); slices['bar'] = s
load('UI Elements', 'UI Elements', 'Bars', 'BigBar_Fill.png').save(out('bar-fill.png'))

# Grass tile (interior solid cell of the autotile atlas)
tm = load('Terrain', 'Tileset', 'Tilemap_color1.png')
tm.crop((64, 64, 128, 128)).save(out('grass.png'))

# Poof (green water splash, 9 frames @192) — UI feedback on conversion done
load('Particle FX', 'Water Splash.png').save(out('poof.png'))

# ── Village scenery (static; varied types + roof colors) ──
def bld(color, name, dst):
    load('Buildings', f'{color} Buildings', f'{name}.png').save(out(dst))

bld('Blue',   'Castle',    'castle.png')
bld('Blue',   'House1',    'house-blue-1.png')
bld('Blue',   'House2',    'house-blue-2.png')
bld('Blue',   'House3',    'house-blue-3.png')
bld('Red',    'House1',    'house-red-1.png')
bld('Red',    'House2',    'house-red-2.png')
bld('Purple', 'House1',    'house-purple-1.png')
bld('Purple', 'House3',    'house-purple-3.png')
bld('Blue',   'Tower',     'tower-blue.png')
bld('Red',    'Tower',     'tower-red.png')
bld('Purple', 'Tower',     'tower-purple.png')
bld('Blue',   'Barracks',  'barracks-blue.png')
bld('Yellow', 'Barracks',  'barracks-yellow.png')
bld('Blue',   'Archery',   'archery-blue.png')
bld('Blue',   'Monastery', 'monastery-blue.png')
bld('Purple', 'Monastery', 'monastery-purple.png')

# Trees / bushes — crop a single (frame-0) static sprite from each sheet
def frame0(im, fw, fh):
    p = im.crop((0, 0, fw, fh)); bb = p.getbbox()
    return p.crop(bb) if bb else p

for i in (1, 2, 3):
    frame0(load('Terrain', 'Resources', 'Wood', 'Trees', f'Tree{i}.png'), 192, 256).save(out(f'tree{i}.png'))
for i in (1, 2, 3, 4):
    frame0(load('Terrain', 'Decorations', 'Bushes', f'Bushe{i}.png'), 128, 128).save(out(f'bush{i}.png'))

# Rocks / stones (single sprites)
for i in (1, 2, 3, 4):
    load('Terrain', 'Decorations', 'Rocks', f'Rock{i}.png').save(out(f'rock{i}.png'))

# Clouds (single sprites)
load('Terrain', 'Decorations', 'Clouds', 'Clouds_01.png').save(out('cloud1.png'))
load('Terrain', 'Decorations', 'Clouds', 'Clouds_03.png').save(out('cloud2.png'))

# ── Compose one village diorama (back-to-front = depth via overlap) ──
def compose_village():
    random.seed(11)
    W, H = 1920, 700
    GRASS = 470                  # grass band height (matches CSS .ground)
    GRASS_TOP = H - GRASS        # = 230 : canvas y of the grass-top line
    BACK = GRASS_TOP + 72        # back-row baseline: building mid-sections land ~at the grass top
    placed = []                  # (baseline_y, img, cx)
    R = random.randint
    def U(a, b): return random.uniform(a, b)

    def spr(name, scale):
        im = Image.open(out(name)).convert('RGBA')
        bb = im.getbbox()
        if bb: im = im.crop(bb)
        if scale != 1.0:
            im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.NEAREST)
        return im

    def place(name, cx, baseline, scale=1.0):
        placed.append((baseline, spr(name, scale), int(cx)))

    trees    = ['tree1.png', 'tree2.png', 'tree3.png']
    props    = ['bush1.png', 'bush2.png', 'bush3.png', 'bush4.png',
                'rock1.png', 'rock2.png', 'rock3.png', 'rock4.png']
    houses   = ['house-red-1.png', 'house-red-2.png', 'house-blue-1.png', 'house-blue-2.png',
                'house-blue-3.png', 'house-purple-1.png', 'house-purple-3.png']
    towers   = ['tower-blue.png', 'tower-red.png', 'tower-purple.png']
    specials = ['monastery-blue.png', 'monastery-purple.png', 'barracks-yellow.png',
                'barracks-blue.png', 'archery-blue.png']
    allbld   = houses + towers + specials

    # ── MAIN BACK ROW (the design we have) — at the grass top, pokes into sky ──
    clusters = [
        (210,  ['house-red-1.png', 'house-blue-2.png', 'tower-purple.png', 'house-blue-1.png']),
        (570,  ['house-purple-3.png', 'barracks-yellow.png', 'house-blue-3.png', 'tower-red.png']),
        (1360, ['house-red-2.png', 'archery-blue.png', 'house-purple-1.png', 'tower-blue.png']),
        (1720, ['house-blue-1.png', 'barracks-blue.png', 'house-red-1.png', 'tower-purple.png']),
    ]
    for cx, names in clusters:
        n = len(names); spread = 84
        for j, name in enumerate(names):
            off = (j - (n - 1) / 2) * spread
            place(name, cx + off, BACK + R(-6, 12), U(0.80, 0.93))
        for s in (-1, 1):
            place(random.choice(trees), cx + s * R(150, 225), BACK - 8 + R(-8, 16), U(0.92, 1.12))
        for _ in range(4):
            place(random.choice(props), cx + R(-200, 200), BACK + R(2, 22), U(0.6, 0.9))

    # more trees between the OUTER batches (keep the castle's middle clear of trees)
    for gx in (385, 1545):
        for _ in range(3):
            place(random.choice(trees), gx + R(-55, 55), BACK - 4 + R(-10, 18), U(0.95, 1.2))

    # castle centerpiece — set back + higher, framed by towers/monasteries for scale
    cx = 965
    place('monastery-blue.png',   cx - 230, BACK - 50, 0.72)
    place('monastery-purple.png', cx + 230, BACK - 50, 0.72)
    place('tower-blue.png',       cx - 292, BACK - 22, 0.98)
    place('tower-red.png',        cx + 292, BACK - 22, 0.98)
    place('castle.png',           cx,       BACK - 22, 1.34)
    place('tower-purple.png',     cx - 156, BACK + 6,  0.88)
    place('tower-blue.png',       cx + 156, BACK + 6,  0.88)

    # ── DESCENDING FRONT ROWS (no castle) — fill the grass downward, recede up ──
    def make_row(baseline, slo, shi, step, jit, tree_ratio, skip_center=False):
        x = R(20, step)
        while x < W - 20:
            cx2 = x + R(-jit, jit)
            if not (skip_center and 760 < cx2 < 1170):
                if random.random() < tree_ratio:
                    place(random.choice(trees), cx2, baseline + R(-6, 10), U(slo, shi) * 1.08)
                else:
                    place(random.choice(allbld), cx2, baseline + R(-6, 12), U(slo, shi))
                if random.random() < 0.65:
                    place(random.choice(props), cx2 + R(-step // 2, step // 2), baseline + R(6, 20), U(0.6, 0.92))
            x += step + R(-16, 16)

    make_row(400, 0.76, 0.90, 150, 26, 0.40, skip_center=True)
    make_row(490, 0.82, 0.96, 164, 30, 0.42)
    make_row(575, 0.90, 1.04, 178, 34, 0.42)
    make_row(655, 0.98, 1.12, 192, 38, 0.44)

    # dense front carpet of bushes + stones (closest, drawn last)
    for _ in range(100):
        place(random.choice(props), R(10, W - 10), 662 + R(0, 34), U(0.55, 1.05))

    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for baseline, img, cx in sorted(placed, key=lambda p: p[0]):
        canvas.alpha_composite(img, (cx - img.width // 2, baseline - img.height))
    canvas.save(out('village.png'))
    print(f'village.png composed ({W}x{H}, {len(placed)} sprites)')

compose_village()

# Remove now-unused assets from earlier iterations
for stale in ('water-foam.png', 'water-bg.png', 'house1.png', 'house2.png', 'house3.png'):
    fp = out(stale)
    if os.path.exists(fp): os.remove(fp)

# Cursors → 32x32 crisp
def cur(src, dst):
    im = load('UI Elements', 'UI Elements', 'Cursors', src)
    bb = im.getbbox(); im = im.crop(bb) if bb else im
    im.resize((32, 32), Image.NEAREST).save(out(dst))
cur('Cursor_01.png', 'cursor-arrow.png')
cur('Cursor_02.png', 'cursor-hand.png')
cur('Cursor_03.png', 'cursor-no.png')

print('=== border-image-slice (top right bottom left) ===')
for k, v in slices.items():
    print(f'  {k:18} {v[0]} {v[1]} {v[2]} {v[3]}')
print('Done. Output ->', OUT)
