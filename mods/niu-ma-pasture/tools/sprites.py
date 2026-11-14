#!/usr/bin/env python3
# Draws the pasture's pixel art into ../sprites/*.svg. The mod never runs this.
#   python3 tools/sprites.py
# Animals (drawn by hd.py at 3 px per art unit): a 36 x 28 art grid, facing right ("-r")
# and mirrored ("-l"), feet on art row 27.
#   <breed>-stand-<r|l>.svg       standing, head up (tail drawn separately)
#   <breed>-graze-body-<r|l>.svg  head down: body only
#   <breed>-graze-head-<r|l>.svg  head down: neck, head, a bite of grass (it bobs)
#   <breed>-tail-<a|b>-<r|l>.svg  the tail, hanging (a) and swished (b)
#   <breed>-sit-<r|l>.svg         lying down, eyes closed, happy (tail included)
#   <breed>-act-<frame>-<r|l>.svg what it does when clicked: rear, buck, paw, moo... (actions.py)
#   critter-<kind>-<sit|hop>-<r|l>.svg  sub-agents' small animals (critters.py)
#   obj-*.svg                     plain terminals' pot, fire pit and crystal (objects.py)
import math
import os

W, H = 36, 28
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sprites")
OUTLINE = "#2b2420"

BREEDS = {
    # horses
    "chestnut": dict(kind="horse", B="#b8693a", S="#93512b", M="#5a2e1a", H="#3a2a22", N="#7d4426", K="#3a2018"),
    "grey":     dict(kind="horse", B="#eceff3", S="#c5cad3", M="#9aa3b0", H="#6b6b72", N="#cdb8b4", K="#7a6662"),
    "black":    dict(kind="horse", B="#3d3d4a", S="#2b2b35", M="#17171e", H="#e9e6df", N="#5a5a66", K="#111116",
                     blaze="#f4f1ea", socks="#f4f1ea"),
    "palomino": dict(kind="horse", B="#e8bf6c", S="#c99c4f", M="#fbf2d8", H="#7a5a38", N="#c48b58", K="#6b4528"),
    "pinto":    dict(kind="horse", B="#f6f3ec", S="#d8d2c6", M="#6e4128", H="#4a3a30", N="#d9b8a8", K="#7a5a4a",
                     P="#9a5a33", Q="#7a4526", spots=[(10, 14, 3.2, 2.6), (19, 13, 2.6, 2.2), (25, 6, 1.6, 2.4)]),
    "bay":      dict(kind="horse", B="#8a4b2a", S="#6d3a20", M="#1e1612", H="#2a201a", N="#4a2a1a", K="#1a120e",
                     socks="#2a1d16"),
    "buckskin": dict(kind="horse", B="#dcb978", S="#b9955a", M="#2a201a", H="#2a201a", N="#6b4a30", K="#2a1a12",
                     socks="#2a201a"),
    "appaloosa": dict(kind="horse", B="#f1ece2", S="#d5cfc2", M="#5a4a40", H="#4a3a30", N="#cdb3a6", K="#6a5248",
                     P="#3a2f2a", Q="#2c2420", spots=[(9, 13, 1.3, 1.1), (12, 15, 1.1, 1.0), (8, 16, 1.2, 1.0),
                     (11, 12, 1.0, 0.9), (14, 13, 1.0, 1.0), (10, 18, 1.1, 0.8), (16, 15, 0.9, 0.9), (13, 17, 0.9, 0.8)]),
    "shire":    dict(kind="horse", B="#3b2a22", S="#2b1e18", M="#15100d", H="#d9d2c4", N="#4e3a30", K="#100b09",
                     blaze="#f4f1ea", socks="#f4f1ea"),
    # cows
    "holstein": dict(kind="cow", B="#f7f6f1", S="#d9d7cf", M="#2b2b2b", H="#3a3532", N="#f3b3b3", K="#b0605f",
                     P="#2b2b2b", Q="#1d1d1d", R="#efe6cc", U="#f3a8b4",
                     spots=[(9, 13, 3.0, 2.2), (17, 16, 3.0, 2.0), (21, 12, 1.8, 1.5), (29, 8, 1.8, 2.0)]),
    "jersey":   dict(kind="cow", B="#c98a4f", S="#a86d39", M="#7d4f28", H="#3a2a22", N="#3b302b", K="#1d1714",
                     R="#efe6cc", U="#e8a0a8", face="#9a6533"),
    "highland": dict(kind="cow", B="#d4782f", S="#b25f1f", M="#9c4f18", H="#3a2a22", N="#e7a77c", K="#8a4a2a",
                     R="#f2e4c2", U="#e8a0a8", shaggy=True),
    "hereford": dict(kind="cow", B="#8e3b20", S="#6f2c16", M="#f4efe6", H="#3a2a22", N="#f1b6b0", K="#a2554f",
                     R="#efe6cc", U="#f1a8b0", face="#f4efe6", belly="#f4efe6"),
    "angus":    dict(kind="cow", polled=True, B="#2a2a30", S="#1c1c21", M="#121216", H="#3a3532", N="#4a3c44", K="#151515",
                     R="#2a2a30", U="#d88f9c"),
    "galloway": dict(kind="cow", polled=True, B="#24242a", S="#18181d", M="#141418", H="#3a3532", N="#4a3c44", K="#151515",
                     R="#24242a", U="#d88f9c", P="#f4f1ea", Q="#d8d4cc", spots=[(14.5, 15, 3.6, 9)]),
    "brownswiss": dict(kind="cow", B="#8e7c6c", S="#716256", M="#4e423a", H="#3a2a22", N="#2e2a28", K="#121010",
                     R="#efe6cc", U="#e8a0a8", face="#7a6a5c"),
}
COMMON = dict(E="#1b1512", G="#5fbf4a", L="#f29aa0", T=None)


class Grid:
    def __init__(self):
        self.c = [[None] * W for _ in range(H)]

    def put(self, x, y, k):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < W and 0 <= y < H:
            self.c[y][x] = k

    def rect(self, x0, y0, x1, y1, k):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.put(x, y, k)

    def rrect(self, x0, y0, x1, y1, k, r=2):
        self.rect(x0, y0, x1, y1, k)
        cut = [(0, 0), (1, 0), (0, 1)] if r >= 2 else [(0, 0)]
        for dx, dy in cut:
            for cx, cy, sx, sy in ((x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)):
                self.put(cx + sx * dx, cy + sy * dy, None)

    def filled(self, x, y):
        return 0 <= x < W and 0 <= y < H and self.c[y][x] is not None

    def map(self, fn):
        for y in range(H):
            for x in range(W):
                if self.c[y][x] is not None:
                    self.c[y][x] = fn(x, y, self.c[y][x])


def outline(g, under=None):
    """Dark edge on every empty pixel next to a filled one (not where `under` already draws)."""
    marks = []
    for y in range(H):
        for x in range(W):
            if g.c[y][x] is None and any(g.filled(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                if under is None or not under.filled(x, y):
                    marks.append((x, y))
    for x, y in marks:
        g.c[y][x] = "O"
    return g


def patterns(g, b, dy=0):
    spots = [(x, y + dy, rx, ry) for x, y, rx, ry in b.get("spots", [])]

    def fn(x, y, k):
        if k in ("B", "S"):
            for sx, sy, rx, ry in spots:
                if ((x - sx) / rx) ** 2 + ((y - sy) / ry) ** 2 <= 1:
                    return "P" if k == "B" else "Q"
        return k
    g.map(fn)


def legs(g, b, xs, y0, y1, width):
    for i, x in enumerate(xs):
        far = i % 2 == 0
        g.rect(x, y0, x + width - 1, y1, "S" if far else "B")
        g.rect(x, y1 + 1, x + width - 1, y1 + 2, "H")
        if b.get("socks"):
            g.rect(x, y1 - 1, x + width - 1, y1, "X")


# ---- horse ---------------------------------------------------------------

def horse_body(g, b, dy=0):
    g.rrect(7, 12 + dy, 25, 19 + dy, "B")
    g.rect(8, 18 + dy, 24, 19 + dy, "S")
    g.put(8, 19 + dy, None)


def horse_head_up(g, b, dy=0, happy=False):
    for y in range(5, 15):
        xl = 21.5 + (14 - y) * 0.55
        g.rect(int(xl), y + dy, int(xl) + 4, y + dy, "B")
    g.rrect(26, 3 + dy, 32, 8 + dy, "B", r=1)
    g.rrect(30, 6 + dy, 34, 9 + dy, "N", r=1)
    g.rect(27, 1 + dy, 28, 2 + dy, "B")
    g.put(30, 2 + dy, "B")
    if b.get("blaze"):
        g.rect(30, 3 + dy, 31, 6 + dy, "X")
    for y in range(4, 14):
        xl = int(21.5 + (14 - y) * 0.55)
        g.put(xl, y + dy, "M")
        g.put(xl - 1, y + dy, "M")
    g.put(26, 3 + dy, "M")
    g.put(27, 3 + dy, "M")
    if happy:
        g.put(28, 5 + dy, "E"); g.put(29, 4 + dy, "E"); g.put(30, 5 + dy, "E")
        g.put(29, 7 + dy, "L")
    else:
        g.put(29, 5 + dy, "E")
    g.put(33, 8 + dy, "K")


def horse_head_down(g, b):
    for y in range(11, 21):
        xl = 21.5 + (y - 12) * 0.7
        g.rect(int(xl), y, int(xl) + 4, y, "B")
    g.rrect(27, 18, 32, 23, "B", r=1)
    g.rrect(30, 21, 34, 25, "N", r=1)
    g.put(27, 17, "B"); g.put(28, 16, "B")
    if b.get("blaze"):
        g.rect(31, 19, 32, 22, "X")
    for y in range(11, 19):
        xr = int(21.5 + (y - 12) * 0.7) + 4
        g.put(xr, y, "M")
    g.put(30, 20, "E")
    g.put(33, 24, "K")
    for x, y in ((35, 24), (35, 23), (34, 26), (35, 26)):
        g.put(x, y, "G")


def horse_tail(g, swish):
    for y in range(13, 22):
        if swish:
            x = 6.2 - (y - 13) * 0.55
        else:
            x = 6 - (1 if 15 <= y <= 19 else 0) + (0.6 if y >= 20 else 0)
        g.put(x, y, "M")
        g.put(x - 1, y, "M")


def horse_sit(g, b):
    dy = 4
    g.rrect(7, 12 + dy, 25, 19 + dy, "B")
    g.rect(8, 18 + dy, 24, 19 + dy, "S")
    g.rect(22, 23, 28, 24, "S"); g.rect(29, 23, 30, 24, "H")
    g.rect(4, 23, 10, 24, "S"); g.rect(2, 23, 3, 24, "H")
    for y in range(17, 24):
        x = 6 - (y - 17) * 0.7
        g.put(x, y, "M"); g.put(x - 1, y, "M")
    horse_head_up(g, b, dy=dy - 1, happy=True)


# ---- cow -----------------------------------------------------------------

def cow_body(g, b, dy=0):
    g.rrect(5, 11 + dy, 24, 20 + dy, "B")
    g.rect(6, 19 + dy, 23, 20 + dy, "S")
    if b.get("belly"):
        g.rect(9, 18 + dy, 21, 20 + dy, "Y")
    if b.get("shaggy"):
        for x in range(5, 25, 2):
            g.put(x, 21 + dy, "M")
        for x in range(6, 24, 3):
            g.put(x, 10 + dy, "M")


def cow_head(g, b, x0, y0, happy=False, down=False):
    face = "F" if b.get("face") else "B"
    g.rrect(x0, y0, x0 + 6, y0 + 6, face, r=1)
    g.rrect(x0 + 3, y0 + 4, x0 + 8, y0 + 8, "N", r=1)
    g.put(x0 + 6, y0 + 7, "K"); g.put(x0 + 8, y0 + 7, "K")
    g.rect(x0 - 2, y0 + 1, x0 - 1, y0 + 2, "B")
    if b.get("shaggy"):
        g.put(x0 + 1, y0 - 1, "R"); g.put(x0, y0 - 2, "R"); g.put(x0 - 1, y0 - 3, "R"); g.put(x0 - 2, y0 - 3, "R")
        g.put(x0 + 4, y0 - 1, "R"); g.put(x0 + 5, y0 - 2, "R"); g.put(x0 + 6, y0 - 3, "R"); g.put(x0 + 7, y0 - 3, "R")
        g.rect(x0, y0, x0 + 6, y0 + 1, "M")
        g.rect(x0 + 2, y0 + 2, x0 + 5, y0 + 2, "M")
    else:
        g.put(x0 + 1, y0 - 1, "R"); g.put(x0 + 2, y0 - 2, "R")
        g.put(x0 + 4, y0 - 1, "R"); g.put(x0 + 5, y0 - 2, "R")
    ey = y0 + 2 if not b.get("shaggy") else y0 + 3
    if happy:
        g.put(x0 + 3, ey, "E"); g.put(x0 + 4, ey - 1, "E"); g.put(x0 + 5, ey, "E")
        g.put(x0 + 2, ey + 2, "L")
    else:
        g.put(x0 + 4, ey, "E")


def cow_legs(g, b, dy=0):
    legs(g, b, [6, 10, 18, 22], 21 + dy, 23 + dy, 3)
    g.rect(13, 21, 16, 22, "U")


def cow_tail(g, swish):
    for y in range(12, 21):
        x = (4 - (y - 12) * 0.45) if swish else (4 if y < 18 else 4 - (y - 18) * 0.3)
        g.put(x, y, "M" if False else "S")
    tx = 4 - 8 * 0.45 if swish else 3.4
    g.rect(int(round(tx)) - 1, 20, int(round(tx)), 22, "T")


def cow_sit(g, b):
    dy = 4
    g.rrect(5, 11 + dy, 24, 20 + dy, "B")
    g.rect(6, 19 + dy, 23, 20 + dy, "S")
    if b.get("belly"):
        g.rect(9, 18 + dy, 21, 20 + dy, "Y")
    g.rect(20, 25, 27, 25, "S"); g.rect(28, 25, 29, 25, "H")
    g.rect(3, 25, 9, 25, "S"); g.rect(1, 25, 2, 25, "H")
    for y in range(16, 24):
        g.put(4 - (y - 16) * 0.4, y, "S")
    g.rect(0, 23, 1, 24, "T")
    g.rect(22, 10 + dy, 26, 16 + dy, "B")
    cow_head(g, b, 25, 6 + dy - 1, happy=True)


# ---- output --------------------------------------------------------------

def palette(b):
    p = dict(COMMON)
    p.update({k: v for k, v in b.items() if isinstance(v, str)})
    p["O"] = OUTLINE
    p["X"] = b.get("blaze") or b.get("socks") or b["B"]
    p["F"] = b.get("face") or b["B"]
    p["Y"] = b.get("belly") or b["S"]
    p["T"] = b["M"] if b["kind"] == "cow" else b["M"]
    p.setdefault("P", b["B"]); p.setdefault("Q", b["S"])
    p.setdefault("R", "#efe6cc"); p.setdefault("U", "#f3a8b4")
    return p


def svg(g, pal, mirror=False):
    rows = []
    for y in range(H):
        line = g.c[y][::-1] if mirror else g.c[y]
        x = 0
        while x < W:
            k = line[x]
            if k is None:
                x += 1
                continue
            x1 = x
            while x1 + 1 < W and line[x1 + 1] == k:
                x1 += 1
            rows.append(f'<rect x="{x}" y="{y}" width="{x1 - x + 1}" height="1" fill="{pal[k]}"/>')
            x = x1 + 1
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W * 4}" height="{H * 4}" viewBox="0 0 {W} {H}" '
            f'shape-rendering="crispEdges">' + "".join(rows) + "</svg>\n")


def write(name, g, pal):
    for side, mirror in (("r", False), ("l", True)):
        with open(os.path.join(OUT, f"{name}-{side}.svg"), "w") as f:
            f.write(svg(g, pal, mirror))


def breed(name, b):
    pal = palette(b)
    horse = b["kind"] == "horse"

    def finish(g, under=None, dy=0):
        patterns(g, b, dy)
        return outline(g, under)

    g = Grid()
    if horse:
        horse_body(g, b); legs(g, b, [8, 11, 20, 23], 20, 24, 2); horse_head_up(g, b)
    else:
        cow_body(g, b); cow_legs(g, b); g.rect(22, 9, 26, 16, "B"); cow_head(g, b, 25, 5)
    write(f"{name}-stand", finish(g), pal)

    body = Grid()
    if horse:
        horse_body(body, b); legs(body, b, [8, 11, 20, 23], 20, 24, 2)
    else:
        cow_body(body, b); cow_legs(body, b)
    body_fill = Grid(); body_fill.c = [row[:] for row in body.c]
    write(f"{name}-graze-body", finish(body), pal)

    head = Grid()
    if horse:
        horse_head_down(head, b)
    else:
        for y in range(11, 20):
            x = 21.5 + (y - 11) * 0.5
            head.rect(int(x), y, int(x) + 4, y, "B")
        cow_head(head, b, 26, 17)
        for x, y in ((35, 25), (35, 24), (34, 26)):
            head.put(x, y, "G")
    write(f"{name}-graze-head", finish(head, under=body_fill), pal)

    for tag, swish in (("a", False), ("b", True)):
        t = Grid()
        (horse_tail if horse else cow_tail)(t, swish)
        write(f"{name}-tail-{tag}", outline(t), pal)

    s = Grid()
    (horse_sit if horse else cow_sit)(s, b)
    write(f"{name}-sit", finish(s, dy=4), pal)


# ---- scenery -------------------------------------------------------------

def blob_svg(w, h, circles, light, shade, scale=4):
    g = [[None] * w for _ in range(h)]
    for cx, cy, r in circles:
        for y in range(h):
            for x in range(w):
                if (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r:
                    g[y][x] = light
    for y in range(h - 1, -1, -1):
        for x in range(w):
            if g[y][x] and (y + 1 >= h or g[y + 1][x] is None or y >= h - 3):
                g[y][x] = shade
    for y in range(h):
        for x in range(w):
            if g[y][x] == shade and y < h - 3 and all(g[yy][x] == light for yy in range(max(0, y - 2), y)):
                pass
    rows = []
    for y in range(h):
        x = 0
        while x < w:
            k = g[y][x]
            if k is None:
                x += 1
                continue
            x1 = x
            while x1 + 1 < w and g[y][x1 + 1] == k:
                x1 += 1
            rows.append(f'<rect x="{x}" y="{y}" width="{x1 - x + 1}" height="1" fill=/>')
            x = x1 + 1
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w * scale}" height="{h * scale}" viewBox="0 0 {w} {h}" '
            f'shape-rendering="crispEdges">' + "".join(rows) + "</svg>\n")


def pixels_svg(rows_map, pal, scale=4):
    h = len(rows_map); w = max(len(r) for r in rows_map)
    out = []
    for y, row in enumerate(rows_map):
        for x, ch in enumerate(row):
            if ch != "." and ch in pal:
                out.append(f'<rect x="{x}" y="{y}" width="1" height="1" fill="{pal[ch]}"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w * scale}" height="{h * scale}" viewBox="0 0 {w} {h}" '
            f'shape-rendering="crispEdges">' + "".join(out) + "</svg>\n")


def scenery():
    clouds = {
        "cloud1a": (40, 16, [(10, 10, 6), (19, 7, 7), (28, 9, 6), (34, 11, 4)]),
        "cloud1b": (40, 16, [(8, 11, 5), (16, 8, 6), (25, 6, 7), (33, 10, 5)]),
        "cloud2a": (30, 13, [(8, 8, 5), (15, 6, 6), (23, 8, 5)]),
        "cloud2b": (30, 13, [(7, 9, 4), (14, 7, 5), (21, 5, 6), (26, 9, 3)]),
        "cloud3a": (52, 18, [(9, 12, 6), (18, 9, 8), (29, 7, 9), (40, 10, 7), (47, 13, 4)]),
        "cloud3b": (52, 18, [(8, 13, 5), (17, 10, 7), (27, 9, 8), (37, 7, 8), (46, 12, 5)]),
        "cloud4a": (24, 11, [(7, 7, 4), (13, 5, 5), (19, 7, 4)]),
        "cloud4b": (24, 11, [(6, 7, 4), (12, 6, 4), (18, 5, 5)]),
    }
    for name, (w, h, circles) in clouds.items():
        with open(os.path.join(OUT, f"{name}.svg"), "w") as f:
            f.write(blob_svg(w, h, circles, "#ffffff", "#dbe8f5"))

    pal = {"g": "#4f9e3f", "G": "#6cc456", "d": "#3c7d31", "w": "#ffffff", "y": "#ffd84a", "p": "#ff9ec4",
           "c": "#ffb347", "s": "#5a8f3a", "t": "#7a4a2a", "T": "#5b3720", "l": "#4caf50", "L": "#78cc5e",
           "D": "#2f7d32", "r": "#c0392b", "R": "#962d22", "W": "#f5efe3", "k": "#3b2a1e", "b": "#8b5a2b"}
    art = {
        "tuft1": ["..G...G..", ".G.g.Gg..", ".gGgGgG.G", "gdgdgdgdg"],
        "tuft2": [".G..G.", "GgG.gG", "gdgGdg"],
        "flower-w": [".w.", "wyw", ".w.", ".s.", "ss."],
        "flower-y": [".y.", "ycy", ".y.", ".s.", ".ss"],
        "flower-p": [".p.", "pyp", ".p.", ".s.", "s.."],
        "tree": ["....LLLL....", "..LLlLLLLL..", ".LLlllLLlLL.", "LLllDllllLLL", "LlllllDlllLL",
                 "lllDllllllDl", ".lllllllDll.", "..DlllllllD.", "....DtTD....", ".....tT.....",
                 ".....tT.....", ".....tT....."],
        "barn": [".......rr.......", ".....rrrrrr.....", "...rrrrrrrrrr...", ".rrrrrrRRrrrrrr.",
                 "WWWWWWWWWWWWWWWW", "WrrrrrrrrrrrrrrW", "WrrrWWWWWWWrrrrW", "WrrrWkWkWkWrrWrW",
                 "WrrrWWkWkWWrrrrW", "WrrrWkWkWkWrrrrW", "WrrrWWWWWWWrrrrW", "WWWWWWWWWWWWWWWW"],
        "fence": ["b...b...b...b...b", "bbbbbbbbbbbbbbbbb", "b...b...b...b...b", "bbbbbbbbbbbbbbbbb",
                  "b...b...b...b...b"],
    }
    for name, rows in art.items():
        with open(os.path.join(OUT, f"{name}.svg"), "w") as f:
            f.write(pixels_svg(rows, pal))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    import sys
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import hd

    def write_hd(name, render, layer, pal):
        for side, mirror in (("r", False), ("l", True)):
            with open(os.path.join(OUT, f"{name}-{side}.svg"), "w") as f:
                f.write(render(layer, pal, mirror))
    import actions
    for n, b in BREEDS.items():
        hd.breed(n, b, COMMON, write_hd)
        actions.breed_actions(n, b, COMMON, write_hd)
    import critters
    critters.all_critters(hd.svg, write_hd)
    import objects
    objects.all_objects(hd.svg, OUT)
    scenery()
    print("wrote", len(os.listdir(OUT)), "files to", os.path.normpath(OUT))
