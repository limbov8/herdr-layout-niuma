# Small animals for sub-agents, on a 16 x 12 art grid (feet on art row 11.6), facing right.
#   critter-<kind>-<sit|hop>-<r|l>.svg
# Used by sprites.py; drawn with hd.py's shapes.
from hd import Layer, R, shade, outline, mix

CW, CH = 16, 12

KINDS = {
    "rabbit": dict(B="#a87b52", S="#86603e", Y="#efe4d4", I="#f2a7b0", E="#1b1512", K="#e8919c", W="#ffffff"),
    "bunny": dict(B="#f4f1ec", S="#d8d1c6", Y="#ffffff", I="#f5b2bc", E="#3a1f24", K="#e8919c", W="#ffffff"),
    "squirrel": dict(B="#c8662e", S="#a14f20", Y="#f3dfc1", I="#e7a07a", E="#1b1512", K="#3a2318", W="#ffffff",
                     T="#d97a3a", N="#8a5a2b"),
    "hedgehog": dict(B="#6a5444", S="#4f3d31", Y="#e2c79e", I="#d9b48a", E="#1b1512", K="#1b1512", W="#ffffff",
                     T="#8c7362"),
}


def rabbit(L, hop):
    if hop:
        L.strand([(4.6, 7.6), (2.6, 9.0), (1.2, 9.8)], 1.0, 0.55, "S")
        L.ellipse(7.4, 6.6, 4.2, 2.3, "B")
        L.ellipse(5.0, 7.0, 2.4, 2.3, "B")
        L.strand([(10.6, 7.8), (12.4, 9.0), (13.4, 9.4)], 0.55, 0.38, "B")
        L.ellipse(12.2, 4.9, 2.1, 1.75, "B")
        L.strand([(11.0, 3.8), (9.6, 2.2), (8.0, 1.4)], 0.6, 0.42, "S")
        L.strand([(11.6, 3.6), (10.4, 1.6), (9.2, 0.7)], 0.6, 0.42, "B")
        L.strand([(11.0, 3.2), (9.6, 1.4)], 0.2, 0.2, "I")
        L.ellipse(2.8, 5.8, 1.1, 1.0, "W")
        L.ellipse(7.4, 7.9, 2.6, 0.8, "Y")
        L.ellipse(12.9, 4.4, 0.42, 0.45, "E"); L.ellipse(13.05, 4.25, 0.15, 0.15, "W")
        L.ellipse(14.1, 5.2, 0.32, 0.28, "K")
    else:
        L.ellipse(6.4, 11.1, 2.2, 0.65, "S")
        L.ellipse(5.8, 8.6, 2.8, 2.6, "B")
        L.ellipse(7.4, 8.0, 3.4, 2.9, "B")
        L.ellipse(10.4, 10.9, 0.9, 0.6, "B")
        L.ellipse(10.6, 5.5, 2.2, 1.95, "B")
        L.strand([(10.4, 4.0), (10.6, 2.0), (11.2, 0.5)], 0.58, 0.42, "S")
        L.strand([(9.6, 4.1), (9.2, 2.0), (9.0, 0.6)], 0.6, 0.44, "B")
        L.strand([(9.5, 3.6), (9.2, 1.4)], 0.2, 0.2, "I")
        L.ellipse(3.4, 7.8, 1.15, 1.05, "W")
        L.ellipse(8.6, 9.6, 1.8, 1.4, "Y")
        L.ellipse(11.3, 5.1, 0.45, 0.48, "E"); L.ellipse(11.45, 4.95, 0.16, 0.16, "W")
        L.ellipse(12.6, 5.9, 0.32, 0.28, "K")
        L.cut_below(11.6)


def squirrel(L, hop):
    if hop:
        L.strand([(4.6, 6.4), (2.6, 5.2), (1.2, 3.0), (1.6, 1.0)], 0.9, 1.6, "T")
        L.strand([(3.6, 5.6), (2.0, 3.6)], 0.2, 0.2, "S")
        L.strand([(5.6, 8.2), (3.6, 9.6), (2.6, 10.2)], 0.7, 0.4, "S")
        L.ellipse(7.8, 7.4, 3.6, 1.9, "B")
        L.strand([(10.2, 8.4), (12.0, 9.8)], 0.42, 0.3, "B")
        L.ellipse(11.8, 5.8, 1.8, 1.55, "B")
        L.poly([(11.2, 4.6), (11.0, 3.2), (12.0, 4.4)], "B")
        L.ellipse(8.0, 8.4, 2.4, 0.7, "Y")
        L.ellipse(12.4, 5.4, 0.38, 0.4, "E"); L.ellipse(12.55, 5.25, 0.14, 0.14, "W")
        L.ellipse(13.5, 6.2, 0.26, 0.24, "K")
    else:
        L.strand([(5.6, 10.6), (3.2, 9.0), (2.4, 6.0), (3.2, 3.2), (5.2, 2.2)], 1.0, 1.9, "T")
        L.strand([(3.6, 8.6), (3.2, 5.4), (4.2, 3.4)], 0.2, 0.2, "S")
        L.ellipse(8.2, 8.4, 2.6, 2.9, "B")
        L.ellipse(8.4, 11.1, 1.7, 0.6, "S")
        L.ellipse(10.4, 5.0, 1.9, 1.7, "B")
        L.poly([(9.6, 3.8), (9.4, 2.3), (10.5, 3.5)], "B")
        L.ellipse(9.2, 9.0, 1.4, 1.8, "Y")
        L.ellipse(10.4, 7.8, 0.7, 0.55, "B")
        L.ellipse(11.2, 7.3, 0.62, 0.58, "N")
        L.ellipse(11.0, 4.6, 0.4, 0.42, "E"); L.ellipse(11.15, 4.45, 0.14, 0.14, "W")
        L.ellipse(12.2, 5.4, 0.26, 0.24, "K")
        L.cut_below(11.6)


def hedgehog(L, hop):
    dy = -0.4 if hop else 0.0
    L.ellipse(7.2, 8.6 + dy, 4.8, 3.2, "B")
    L.poly([(10.0, 7.2 + dy), (13.6, 9.0 + dy), (12.4, 10.6 + dy), (9.8, 10.4 + dy)], "Y")
    for i in range(9):
        x = 3.2 + i * 0.9
        L.strand([(x, 7.0 + dy + (i % 2) * 0.6), (x - 0.7, 5.6 + dy + (i % 3) * 0.3)], 0.14, 0.12, "T")
    L.ellipse(13.6, 9.0 + dy, 0.36, 0.32, "K")
    L.ellipse(11.5, 8.6 + dy, 0.36, 0.38, "E"); L.ellipse(11.62, 8.45 + dy, 0.12, 0.12, "W")
    if hop:
        L.ellipse(5.4, 11.0, 0.8, 0.5, "Y"); L.ellipse(10.6, 10.8, 0.8, 0.5, "Y")
    else:
        L.ellipse(6.0, 11.1, 0.8, 0.5, "Y"); L.ellipse(9.8, 11.1, 0.8, 0.5, "Y")
    L.cut_below(11.6)


DRAW = {"rabbit": rabbit, "bunny": rabbit, "squirrel": squirrel, "hedgehog": hedgehog}


def palette(c):
    p = dict(c)
    for k in ("B", "Y"):
        p[k + "h"] = mix(c[k], "#ffffff", 0.2)
        p[k + "s"] = mix(c[k], "#000000", 0.14)
    p.setdefault("T", c["B"]); p.setdefault("N", c["S"])
    p["O"] = mix(c["S"], "#000000", 0.6)
    return p


def all_critters(render, write):
    for kind, colors in KINDS.items():
        pal = palette(colors)
        for pose in ("sit", "hop"):
            L = Layer(CW * R, CH * R)
            DRAW[kind](L, pose == "hop")
            shade(L)
            outline(L)
            write(f"critter-{kind}-{pose}", render, L, pal)
