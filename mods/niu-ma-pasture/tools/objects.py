# Plain terminals' objects on a 12 x 12 art grid (ground on art row 11.2):
#   obj-firepit-base, obj-firepit-flame-<a|b|blue>
#   obj-pot-base, obj-pot-fire-<a|b|blue>
#   obj-crystal-<dim|lit|blue|green|red>
# Flames are separate layers so the mod can flicker them. Used by sprites.py.
import math
import os

from hd import Layer, R, outline, mix

OW, OH = 12, 12

PAL = {
    "G": "#8d9096", "Gs": "#6c6f76", "Gh": "#b4b7bd",          # stones
    "A": "#4a3f38",                                            # ash
    "L": "#7a4a2a", "Ls": "#5c361e", "Lc": "#c9a06a",          # logs, cut ends
    "F": "#ff8a2a", "Fy": "#ffd24a", "Fw": "#fff6c2",          # flame
    "B": "#4a8dff", "By": "#9cc8ff", "Bw": "#e6f3ff",          # blue flame
    "I": "#3b3e45", "Ih": "#62666f", "Is": "#26282d",          # iron
    "W": "#6fb2e6", "Wh": "#b9e0ff",                           # water
    "T": "#8a5a32", "Ts": "#6a4224",                           # tripod
    "g": "#4f9b3d", "gh": "#6cc456",                           # grass
    "O": "#2b2420",
}


def logs(L, y=9.9):
    L.strand([(3.0, y), (8.8, y - 2.0)], 0.62, 0.55, "L")
    L.strand([(9.0, y), (3.2, y - 1.9)], 0.62, 0.55, "Ls")
    for x, yy in ((3.0, y), (9.0, y)):
        L.ellipse(x, yy, 0.62, 0.55, "Lc")


def flame(L, lean=0.0, tall=1.0, blue=False, base=(6.0, 8.6), w=1.9):
    k = ("B", "By", "Bw") if blue else ("F", "Fy", "Fw")
    bx, by = base
    top = by - 5.2 * tall
    L.poly([(bx - w, by), (bx - w * 0.9, by - 1.6 * tall), (bx - 0.6 + lean * 0.5, by - 3.4 * tall), (bx + lean, top),
            (bx + 0.9 + lean * 0.4, by - 3.0 * tall), (bx + w * 0.95, by - 1.4 * tall), (bx + w, by)], k[0])
    L.poly([(bx - w * 0.55, by), (bx - 0.4 + lean * 0.3, by - 2.4 * tall), (bx + lean * 0.7, by - 3.8 * tall),
            (bx + 0.6 + lean * 0.3, by - 2.2 * tall), (bx + w * 0.55, by)], k[1])
    L.ellipse(bx + lean * 0.2, by - 0.9 * tall, w * 0.32, 0.9 * tall, k[2])


def firepit_base(L):
    L.ellipse(6.0, 9.7, 3.7, 1.15, "A")
    logs(L)
    for i in range(9):
        a = math.pi * 2 * i / 9 + 0.2
        x, y = 6.0 + 4.5 * math.cos(a), 9.7 + 1.5 * math.sin(a)
        L.ellipse(x, y, 0.95, 0.7, "G" if math.sin(a) > -0.2 else "Gs")
        L.ellipse(x - 0.25, y - 0.25, 0.35, 0.22, "Gh")


def pot_base(L):
    for top, bot in (((6.0, 0.6), (1.6, 11.2)), ((6.0, 0.6), (10.4, 11.2)), ((6.0, 0.6), (7.2, 11.0))):
        L.strand([top, bot], 0.32, 0.36, "T" if bot[0] != 7.2 else "Ts")
    L.ellipse(6.0, 0.8, 0.55, 0.45, "Ts")
    L.strand([(6.0, 1.0), (6.0, 3.9)], 0.14, 0.14, "Is")
    L.strand([(3.5, 4.2), (4.6, 2.9), (6.0, 2.6), (7.4, 2.9), (8.5, 4.2)], 0.16, 0.16, "Is")
    L.ellipse(6.0, 6.3, 3.0, 2.3, "I")
    L.ellipse(5.1, 5.6, 1.0, 0.8, "Ih")
    L.ellipse(6.0, 7.9, 2.4, 0.6, "Is")
    L.ellipse(6.0, 4.35, 3.15, 0.72, "Ih")
    L.ellipse(6.0, 4.35, 2.6, 0.45, "W")
    L.ellipse(5.4, 4.25, 0.8, 0.18, "Wh")
    L.strand([(4.0, 10.6), (8.0, 10.0)], 0.42, 0.38, "L")
    L.strand([(8.2, 10.6), (4.2, 10.1)], 0.42, 0.38, "Ls")


CRYSTAL = {
    "dim": ("#5b4f7a", "#43395f", "#7d70a6"),
    "lit": ("#b58cff", "#8656e0", "#efe2ff"),
    "blue": ("#6fc3ff", "#3d8fdc", "#e2f5ff"),
    "green": ("#7fe39a", "#3fb26b", "#e6ffef"),
    "red": ("#ff7a7a", "#d64545", "#ffe3e3"),
}


def crystal(L):
    shards = [
        [(6.0, 0.8), (7.7, 3.8), (7.3, 10.8), (4.8, 10.8), (4.3, 3.8)],
        [(3.0, 4.4), (4.5, 6.2), (4.5, 10.9), (2.5, 10.9), (2.0, 6.4)],
        [(9.3, 5.0), (10.3, 6.9), (9.9, 10.9), (7.6, 10.9), (7.8, 6.8)],
    ]
    centres = [6.0, 3.25, 9.0]
    for pts, cx in zip(shards, centres):
        L.poly(pts, lambda x, y, cx=cx: "Cl" if x < cx else "Cs")
    L.strand([(5.2, 2.6), (5.0, 8.0)], 0.16, 0.16, "Cw")
    L.strand([(2.9, 6.0), (2.8, 9.0)], 0.12, 0.12, "Cw")
    for x in (1.6, 3.6, 7.0, 10.6):
        L.strand([(x, 11.2), (x + 0.4, 9.9)], 0.22, 0.12, "g")
        L.strand([(x + 0.5, 11.2), (x + 0.9, 10.3)], 0.2, 0.12, "gh")


def all_objects(render, out_dir):
    def out(name, draw, pal=PAL, line=True):
        L = Layer(OW * R, OH * R)
        draw(L)
        if line:
            outline(L)
        with open(os.path.join(out_dir, f"{name}.svg"), "w") as f:
            f.write(render(L, pal))

    out("obj-firepit-base", firepit_base)
    out("obj-firepit-flame-a", lambda L: flame(L, lean=-0.3, tall=1.0), line=False)
    out("obj-firepit-flame-b", lambda L: flame(L, lean=0.5, tall=0.85), line=False)
    out("obj-firepit-flame-blue", lambda L: flame(L, lean=0.0, tall=0.55, blue=True, w=1.2), line=False)
    out("obj-pot-base", pot_base)
    out("obj-pot-fire-a", lambda L: flame(L, lean=-0.2, tall=0.42, base=(6.0, 10.0), w=1.6), line=False)
    out("obj-pot-fire-b", lambda L: flame(L, lean=0.3, tall=0.34, base=(6.0, 10.0), w=1.5), line=False)
    out("obj-pot-fire-blue", lambda L: flame(L, lean=0.0, tall=0.3, base=(6.0, 10.0), w=1.0, blue=True), line=False)
    for state, (light, dark, glint) in CRYSTAL.items():
        pal = dict(PAL, Cl=light, Cs=dark, Cw=glint, O=mix(dark, "#000000", 0.55))
        out(f"obj-crystal-{state}", crystal, pal)
