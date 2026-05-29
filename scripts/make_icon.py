"""
Generate the Converto app icon: a pixel-art old-school antenna TV with two
back-and-forth conversion arrows. Drawn at 32x32, scaled nearest-neighbor for
crisp pixels. Outputs PNGs (src/ui/assets) and a multi-size .ico (build/).
"""
import os
from PIL import Image, ImageDraw

# ── Palette ──────────────────────────────────────────────
SKY     = (140, 209, 240, 255)   # icon background (sky blue)
YELLOW  = (242, 255, 73, 255)    # TV screen (highlighter yellow)
RED     = (214, 40, 40, 255)     # conversion arrows (cinema red)
BODY    = (45, 46, 64, 255)      # TV body (dark)
DARK    = (22, 22, 34, 255)      # outlines / antenna
PINK    = (255, 179, 209, 255)   # knob
LIME    = (170, 240, 130, 255)   # knob

S = 32
img = Image.new("RGBA", (S, S), SKY)
d = ImageDraw.Draw(img)

def rect(x0, y0, x1, y1, c):
    d.rectangle([x0, y0, x1, y1], fill=c)

def px(x, y, c):
    d.point((x, y), fill=c)

# ── Antenna ──────────────────────────────────────────────
d.line([(16, 12), (9, 3)], fill=DARK, width=1)    # left rod
d.line([(16, 12), (23, 3)], fill=DARK, width=1)   # right rod
for (kx, ky) in [(9, 3), (8, 2), (23, 3), (24, 2)]:
    px(kx, ky, DARK)                               # antenna knobs

# ── TV body ──────────────────────────────────────────────
rect(3, 12, 28, 28, DARK)        # outline
rect(4, 13, 27, 27, BODY)        # body fill

# ── Screen ───────────────────────────────────────────────
rect(6, 15, 20, 25, DARK)        # screen border
rect(7, 16, 19, 24, YELLOW)      # screen

# ── Conversion arrows (red, on screen) ───────────────────
# top arrow → pointing right
rect(8, 18, 16, 18, RED)
d.line([(15, 17), (17, 19)], fill=RED, width=1)
d.line([(15, 19), (17, 17)], fill=RED, width=1)
px(17, 18, RED); px(16, 17, RED); px(16, 19, RED)
# bottom arrow ← pointing left
rect(10, 22, 18, 22, RED)
d.line([(11, 21), (9, 23)], fill=RED, width=1)
d.line([(11, 23), (9, 21)], fill=RED, width=1)
px(9, 22, RED); px(10, 21, RED); px(10, 23, RED)

# ── Control panel (right of screen) ──────────────────────
rect(22, 15, 26, 25, DARK)
rect(23, 16, 25, 24, BODY)
px(24, 18, PINK); px(24, 17, PINK)
px(24, 22, LIME); px(24, 21, LIME)

# ── Legs ─────────────────────────────────────────────────
rect(7, 28, 9, 29, DARK)
rect(22, 28, 24, 29, DARK)

# ── Export ───────────────────────────────────────────────
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
assets = os.path.join(root, "src", "ui", "assets")
os.makedirs(assets, exist_ok=True)

def scaled(size):
    return img.resize((size, size), Image.NEAREST)

scaled(256).save(os.path.join(assets, "icon.png"))
scaled(64).save(os.path.join(assets, "icon-64.png"))
# Multi-size .ico for window icon + electron-builder packaging
scaled(256).save(
    os.path.join(assets, "icon.ico"),
    sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)
print("Wrote:", os.path.join(assets, "icon.png"))
print("Wrote:", os.path.join(assets, "icon.ico"))
