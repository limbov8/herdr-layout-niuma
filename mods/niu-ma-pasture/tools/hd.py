# The animals, drawn from shapes at three pixels per art unit (108 x 84 on the same
# 36 x 28 art grid the mod lays out with, feet on art row 27). Used by sprites.py.
# Shapes are in art units, facing right; the "-l" files are mirrored.
import math

R = 3
GW, GH = 36 * R, 28 * R
BODY_KEYS = ("B", "P", "F", "Y")


def mix(a, b, t):
    a = [int(a[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(x + (y - x) * t):02x}" for x, y in zip(a, b))


class Layer:
    def __init__(self, gw=None, gh=None):
        self.c = {}
        self.gw, self.gh = gw or GW, gh or GH

    # -- shapes (art units) --
    def _fill(self, inside, key, bbox, where=None):
        x0, y0, x1, y1 = bbox
        for py in range(max(0, int(y0 * R) - 1), min(self.gh, int(y1 * R) + 2)):
            for px in range(max(0, int(x0 * R) - 1), min(self.gw, int(x1 * R) + 2)):
                x, y = (px + 0.5) / R, (py + 0.5) / R
                if inside(x, y) and (where is None or where(x, y, self.c.get((px, py)))):
                    self.c[(px, py)] = key(x, y) if callable(key) else key

    def ellipse(self, cx, cy, rx, ry, key, where=None):
        self._fill(lambda x, y: ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1, key,
                   (cx - rx, cy - ry, cx + rx, cy + ry), where)

    def poly(self, pts, key, where=None):
        def inside(x, y):
            n, ok = len(pts), False
            j = n - 1
            for i in range(n):
                xi, yi = pts[i]; xj, yj = pts[j]
                if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
                    ok = not ok
                j = i
            return ok
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        self._fill(inside, key, (min(xs), min(ys), max(xs), max(ys)), where)

    def strand(self, pts, r0, r1, key, where=None):
        """A tapering stroke through `pts`, radius r0 at the start to r1 at the end."""
        segs = list(zip(pts, pts[1:]))
        total = sum(math.dist(a, b) for a, b in segs) or 1
        acc = 0
        for a, b in segs:
            la = math.dist(a, b)
            ra = r0 + (r1 - r0) * acc / total
            rb = r0 + (r1 - r0) * (acc + la) / total
            acc += la

            def inside(x, y, a=a, b=b, ra=ra, rb=rb):
                dx, dy = b[0] - a[0], b[1] - a[1]
                L = dx * dx + dy * dy or 1
                t = max(0, min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L))
                r = ra + (rb - ra) * t
                return (x - a[0] - t * dx) ** 2 + (y - a[1] - t * dy) ** 2 <= r * r
            m = max(ra, rb)
            self._fill(inside, key, (min(a[0], b[0]) - m, min(a[1], b[1]) - m,
                                     max(a[0], b[0]) + m, max(a[1], b[1]) + m), where)

    def recolor(self, key, where):
        for (px, py), k in list(self.c.items()):
            x, y = (px + 0.5) / R, (py + 0.5) / R
            new = where(x, y, k)
            if new:
                self.c[(px, py)] = new

    def cut_below(self, y):
        for (px, py) in [p for p in self.c if (p[1] + 0.5) / R > y]:
            del self.c[(px, py)]

    def filled(self, px, py):
        return (px, py) in self.c


def shade(layer):
    """Top edge lighter, bottom edge darker: a little light from above."""
    out = {}
    for (px, py), k in layer.c.items():
        if k not in BODY_KEYS:
            continue
        if not layer.filled(px, py - 1):
            out[(px, py)] = k + "h"
        elif not layer.filled(px, py + 1) or not layer.filled(px, py + 2):
            out[(px, py)] = k + "s"
    layer.c.update(out)


def outline(layer, under=None):
    marks = []
    for (px, py) in list(layer.c):
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (px + dx, py + dy)
            if 0 <= q[0] < layer.gw and 0 <= q[1] < layer.gh and q not in layer.c and not (under and under.filled(*q)):
                marks.append(q)
    for q in marks:
        layer.c[q] = "O"


def spots(layer, b, dy=0):
    sp = [(x, y + dy, rx, ry) for x, y, rx, ry in b.get("spots", [])]
    if sp:
        layer.recolor(None, lambda x, y, k: "P" if k == "B" and any(((x - sx) / rx) ** 2 + ((y - sy) / ry) ** 2 <= 1
                                                                  for sx, sy, rx, ry in sp) else None)


def shifted(pts, dx=0.0, dy=0.0):
    return [(x + dx, y + dy) for x, y in pts]


# ---- horse ---------------------------------------------------------------

def horse_torso(L, b, dy=0.0):
    L.ellipse(16.5, 15.3 + dy, 8.6, 4.3, "B")
    L.ellipse(9.6, 14.6 + dy, 4.3, 4.0, "B")
    L.ellipse(22.6, 15.4 + dy, 3.8, 3.9, "B")
    L.poly(shifted([(10, 16.5), (23, 16.5), (21, 19.3), (12, 19.3)], dy=dy), "B")


def horse_legs(L, b):
    def leg(pts, r, far):
        key = (lambda x, y: "X" if b.get("socks") and y > 23.4 else ("S" if far else "B"))
        L.strand(pts, r[0], r[-1], key)
        bot = pts[-1]
        L.poly([(bot[0] - 0.9, 25.6), (bot[0] + 0.9, 25.6), (bot[0] + 1.15, 27.0), (bot[0] - 1.05, 27.0)], "H")
    leg([(13.0, 17.6), (12.2, 21.6), (12.7, 25.6)], (1.4, 0.65), True)
    leg([(21.4, 17.6), (21.6, 21.8), (21.5, 25.6)], (1.1, 0.65), True)
    leg([(10.8, 17.8), (9.6, 21.6), (10.3, 25.6)], (1.7, 0.7), False)
    leg([(23.4, 17.6), (23.7, 21.8), (23.8, 25.6)], (1.25, 0.7), False)
    # knees and hocks
    L.ellipse(9.7, 21.4, 0.85, 0.75, "B")
    L.ellipse(23.7, 21.6, 0.8, 0.7, "B")


def horse_head_up(L, b, dy=0.0, happy=False):
    L.poly(shifted([(18.8, 12.8), (25.4, 4.4), (27.8, 4.2), (29.2, 8.6), (26.6, 13.0), (25.8, 16.4), (21.0, 15.6)], dy=dy), "B")
    L.poly(shifted([(25.8, 4.6), (27.2, 3.2), (28.6, 3.3), (33.2, 6.6), (34.7, 8.0), (34.8, 9.2), (34.0, 10.0),
                    (32.4, 10.1), (29.4, 9.4), (27.6, 7.6)], dy=dy), "B")
    L.ellipse(29.0, 8.0 + dy, 1.7, 1.5, "B")
    L.recolor(None, lambda x, y, k: "N" if k == "B" and x > 32.6 and y < 10.6 + dy and y > 5.5 + dy else None)
    if b.get("blaze"):
        L.strand(shifted([(28.4, 3.9), (31.2, 5.6), (33.7, 7.6)], dy=dy), 0.55, 0.7, "X",
                 where=lambda x, y, k: k in ("B", "N"))
    L.poly(shifted([(27.8, 3.6), (28.6, 1.2), (29.1, 3.4)], dy=dy), "S")
    L.poly(shifted([(26.7, 3.9), (27.0, 0.9), (28.3, 3.3)], dy=dy), "B")
    # mane along the crest, forelock
    L.strand(shifted([(27.0, 3.3), (25.3, 5.4), (23.4, 8.0), (21.3, 10.6), (19.2, 12.6)], dy=dy), 0.85, 0.95, "M")
    for i, (x, y) in enumerate([(25.0, 5.9), (23.4, 8.2), (21.8, 10.4)]):
        L.poly(shifted([(x - 0.3, y - 0.8), (x + 0.9, y + 0.1), (x - 0.4, y + 1.6 + (i % 2) * 0.4)], dy=dy), "M")
    L.ellipse(27.6, 3.9 + dy, 0.85, 0.55, "M")
    L.strand(shifted([(26.2, 4.2), (24.6, 6.3), (22.6, 9.0)], dy=dy), 0.18, 0.18, "Mh")
    face(L, eye=(29.3, 5.6 + dy), nose=(33.9, 8.3 + dy), mouth=((33.1, 9.65 + dy), (34.4, 9.45 + dy)),
         happy=happy, blush=(30.6, 7.6 + dy))


def horse_head_down(L, b):
    L.poly([(18.8, 12.8), (21.6, 10.8), (26.0, 15.0), (29.6, 19.4), (29.0, 22.8), (26.0, 20.8), (23.8, 17.6), (21.0, 15.6)], "B")
    L.poly([(27.6, 18.4), (29.6, 17.6), (31.6, 20.0), (33.6, 23.8), (34.5, 25.6), (33.7, 26.8), (32.0, 26.9),
            (30.6, 25.7), (28.6, 22.8)], "B")
    L.ellipse(29.6, 22.4, 1.6, 1.6, "B")
    L.recolor(None, lambda x, y, k: "N" if k == "B" and y > 24.4 and x > 30.2 else None)
    if b.get("blaze"):
        L.strand([(30.0, 18.4), (32.0, 21.4), (33.6, 24.8)], 0.55, 0.7, "X", where=lambda x, y, k: k in ("B", "N"))
    L.poly([(27.6, 18.6), (26.1, 16.4), (28.5, 17.4)], "B")
    L.strand([(19.2, 12.2), (22.0, 10.9), (25.2, 13.5), (27.9, 16.5), (28.9, 18.0)], 0.85, 0.8, "M")
    for (x, y) in [(22.4, 11.4), (24.8, 13.4), (26.9, 15.6)]:
        L.poly([(x - 0.8, y - 0.2), (x + 0.6, y - 0.6), (x + 0.3, y + 1.3)], "M")
    L.strand([(21.0, 11.0), (24.0, 12.6), (26.6, 15.4)], 0.18, 0.18, "Mh")
    face(L, eye=(30.3, 20.5), nose=(33.4, 25.6), mouth=((32.0, 26.4), (33.0, 26.6)))
    grass(L, 34.4)


def horse_tail(L, swish):
    if swish:
        main = [(7.8, 12.4), (5.8, 13.8), (4.2, 16.0), (3.0, 18.8), (2.5, 21.6)]
        side = [(7.4, 12.9), (5.6, 15.2), (4.6, 18.2), (4.2, 20.4)]
    else:
        main = [(7.8, 12.4), (6.4, 14.5), (5.7, 17.5), (5.8, 20.5), (6.3, 22.8)]
        side = [(7.3, 12.9), (6.8, 15.0), (6.7, 18.0), (7.1, 21.4)]
    L.strand(main, 1.15, 0.65, "M")
    L.strand(side, 0.7, 0.45, "M")
    L.strand(main[1:-1], 0.2, 0.2, "Mh")


def horse_sit(L, b):
    dy = 4.4
    horse_torso(L, b, dy)
    L.cut_below(25.9)
    L.strand([(21.2, 23.6), (25.8, 24.7), (28.6, 24.8)], 1.1, 0.75, lambda x, y: "X" if b.get("socks") and x > 26.6 else "S")
    L.ellipse(29.4, 24.9, 0.95, 0.8, "H")
    L.strand([(11.0, 24.2), (7.0, 25.0)], 0.85, 0.7, lambda x, y: "X" if b.get("socks") and x < 8.6 else "S")
    L.ellipse(6.3, 25.0, 0.9, 0.8, "H")
    L.ellipse(10.4, 21.6, 3.4, 3.1, "B")
    L.strand([(8.0, 18.6), (6.2, 21.4), (4.6, 23.9), (2.6, 25.2), (0.9, 25.4)], 1.05, 0.6, "M")
    horse_head_up(L, b, dy=4.0, happy=True)


# ---- cow -----------------------------------------------------------------

def cow_torso(L, b, dy=0.0):
    L.ellipse(9.0, 15.2 + dy, 4.6, 4.8, "B")
    L.ellipse(20.4, 15.0 + dy, 4.3, 4.8, "B")
    L.poly(shifted([(9, 10.5), (21, 10.3), (21, 19.8), (9, 19.95)], dy=dy), "B")
    L.ellipse(20.0, 10.9 + dy, 2.6, 1.3, "B")
    L.ellipse(8.0, 11.0 + dy, 2.2, 1.2, "B")
    if b.get("belly"):
        L.recolor(None, lambda x, y, k: "Y" if k == "B" and y > 17.4 + dy and 8 < x < 22 else None)
    if b.get("shaggy"):
        for i, x in enumerate(range(6, 24, 1)):
            L.poly(shifted([(x - 0.6, 19.4), (x + 0.6, 19.4), (x + 0.1 * (i % 3), 20.8 + 0.4 * (i % 2))], dy=dy), "B")
        for x in range(7, 22, 2):
            L.strand(shifted([(x, 11.2), (x + 0.7, 13.0)], dy=dy), 0.16, 0.16, "Bs")


def cow_legs(L, b):
    def leg(pts, r, far):
        L.strand(pts, r[0], r[-1], "S" if far else "B")
        bot = pts[-1]
        L.poly([(bot[0] - 1.2, 25.5), (bot[0] + 1.2, 25.5), (bot[0] + 1.35, 27.0), (bot[0] - 1.3, 27.0)], "H")
        L.strand([(bot[0] + 0.05, 25.9), (bot[0] + 0.05, 27.0)], 0.12, 0.12, "O")
    leg([(11.2, 18.6), (10.4, 22.0), (11.0, 25.5)], (1.7, 1.05), True)
    leg([(19.6, 18.6), (19.8, 22.2), (19.8, 25.5)], (1.4, 1.05), True)
    leg([(8.6, 18.8), (7.8, 22.0), (8.4, 25.5)], (2.0, 1.15), False)
    leg([(22.0, 18.6), (22.2, 22.2), (22.2, 25.5)], (1.6, 1.15), False)


def cow_head_up(L, b, dy=0.0, happy=False):
    L.poly(shifted([(19.8, 11.0), (24.8, 9.0), (27.0, 12.6), (25.8, 17.4), (22.6, 18.6), (20.4, 16)], dy=dy), "B")
    L.ellipse(24.2, 17.0 + dy, 1.5, 1.8, "B")
    L.ellipse(24.6, 7.9 + dy, 1.8, 0.8, "B")
    L.ellipse(24.3, 8.0 + dy, 1.0, 0.36, "U")
    L.poly(shifted([(25.0, 7.2), (26.4, 5.8), (29.8, 5.8), (31.4, 7.4), (32.4, 10.2), (31.6, 12.6), (27.6, 13.0),
                    (25.6, 11.0)], dy=dy), "F")
    L.ellipse(31.4, 11.3 + dy, 2.4, 1.9, "N")
    horns(L, b, base=(27.2, 6.2 + dy), far=(29.0, 5.9 + dy), up=True)
    face(L, eye=(28.6, 8.6 + dy), nose=(32.9, 10.9 + dy), mouth=((30.4, 12.85 + dy), (32.4, 12.6 + dy)),
         happy=happy, blush=(30.0, 10.7 + dy), nose2=(31.0, 10.6 + dy))
    if b.get("shaggy"):
        L.poly(shifted([(25.2, 6.0), (30.6, 5.6), (31.0, 8.6), (29.8, 8.1), (29.0, 9.4), (28.0, 8.3), (27.0, 9.2),
                        (25.8, 8.2)], dy=dy), "M")
        L.strand(shifted([(26.4, 6.6), (27.2, 8.4)], dy=dy), 0.16, 0.16, "Mh")
        L.strand(shifted([(28.6, 6.4), (29.4, 8.0)], dy=dy), 0.16, 0.16, "Mh")


def cow_head_down(L, b):
    L.poly([(19.8, 11.0), (23.6, 11.2), (27.4, 16.4), (28.8, 20.4), (26.6, 22.0), (24.0, 19.2), (21.0, 17.0)], "B")
    L.ellipse(25.0, 19.6, 1.4, 1.6, "B")
    L.ellipse(26.6, 18.3, 1.7, 0.75, "B")
    L.ellipse(26.4, 18.4, 0.95, 0.34, "U")
    L.poly([(26.4, 17.8), (29.0, 16.8), (31.0, 18.8), (32.8, 22.8), (33.4, 25.0), (32.4, 26.7), (29.4, 26.9),
            (27.6, 24.2), (26.2, 20.6)], "F")
    L.ellipse(31.6, 25.4, 2.0, 1.6, "N")
    horns(L, b, base=(27.9, 17.4), far=(29.6, 17.0), up=False)
    face(L, eye=(29.7, 20.3), nose=(32.9, 25.7), mouth=((30.4, 26.7), (32.2, 26.8)), nose2=(31.7, 25.5))
    if b.get("shaggy"):
        L.poly([(26.6, 17.4), (30.2, 16.6), (31.4, 19.6), (30.2, 19.3), (29.6, 20.8), (28.6, 19.6), (27.4, 20.4)], "M")
    grass(L, 33.8)


def horns(L, b, base, far, up):
    if b.get("polled"):
        return
    bx, by = base; fx, fy = far
    if b.get("shaggy"):
        if up:
            L.strand([(bx - 0.4, by), (bx - 2.0, by - 1.4), (bx - 3.6, by - 1.8), (bx - 4.6, by - 3.0)], 0.75, 0.32, "R")
            L.strand([(fx, fy), (fx + 1.6, fy - 1.4), (fx + 3.0, fy - 2.0), (fx + 3.8, fy - 3.2)], 0.7, 0.3, "R")
        else:
            L.strand([(bx - 0.4, by), (bx - 1.8, by - 1.6), (bx - 3.0, by - 2.0), (bx - 3.8, by - 3.2)], 0.75, 0.32, "R")
            L.strand([(fx, fy), (fx + 1.4, fy - 1.4), (fx + 2.8, fy - 1.8), (fx + 3.6, fy - 3.0)], 0.7, 0.3, "R")
        return
    if up:
        L.strand([(bx - 0.3, by), (bx - 0.3, by - 1.6), (bx + 0.6, by - 2.6)], 0.55, 0.32, "R")
        L.strand([(fx, fy), (fx + 0.3, fy - 1.5), (fx + 1.1, fy - 2.1)], 0.5, 0.3, "R")
    else:
        L.strand([(bx, by), (bx - 0.6, by - 1.4), (bx - 0.1, by - 2.4)], 0.55, 0.32, "R")
        L.strand([(fx, fy), (fx + 0.2, fy - 1.4), (fx + 1.0, fy - 2.1)], 0.5, 0.3, "R")


def cow_tail(L, swish):
    if swish:
        pts = [(5.4, 11.6), (3.8, 13.8), (2.7, 16.8), (2.1, 19.4)]
        tuft = (2.0, 20.6)
    else:
        pts = [(5.4, 11.6), (4.6, 14.0), (4.4, 17.5), (4.6, 20.0)]
        tuft = (4.6, 21.2)
    L.strand(pts, 0.5, 0.38, "Bs")
    L.ellipse(tuft[0], tuft[1], 0.95, 1.5, "T")
    L.strand([(tuft[0] - 0.2, tuft[1] - 0.8), (tuft[0] - 0.1, tuft[1] + 1.0)], 0.15, 0.15, "Th")


def cow_sit(L, b):
    dy = 4.3
    cow_torso(L, b, dy)
    L.cut_below(25.9)
    L.strand([(19.8, 23.8), (24.8, 24.8), (27.4, 24.9)], 1.3, 1.05, "S")
    L.ellipse(28.4, 25.0, 1.1, 0.9, "H")
    L.strand([(10.0, 24.2), (6.0, 25.1)], 1.1, 0.9, "S")
    L.ellipse(5.0, 25.1, 1.0, 0.85, "H")
    L.ellipse(9.6, 21.4, 3.6, 3.2, "B")
    L.strand([(5.4, 16.4), (3.4, 19.4), (2.0, 22.6), (1.5, 24.0)], 0.48, 0.38, "Bs")
    L.ellipse(1.4, 25.0, 0.9, 1.0, "T")
    cow_head_up(L, b, dy=4.0, happy=True)


# ---- shared details -------------------------------------------------------

def face(L, eye, nose, mouth, happy=False, blush=None, nose2=None):
    ex, ey = eye
    if happy:
        L.strand([(ex - 0.65, ey + 0.25), (ex, ey - 0.35), (ex + 0.65, ey + 0.25)], 0.2, 0.2, "E")
        if blush:
            L.ellipse(blush[0], blush[1], 0.7, 0.42, "L")
    else:
        L.ellipse(ex, ey, 0.6, 0.62, "E")
        L.ellipse(ex + 0.17, ey - 0.2, 0.2, 0.2, "W")
    L.ellipse(nose[0], nose[1], 0.38, 0.32, "K")
    if nose2:
        L.ellipse(nose2[0], nose2[1], 0.3, 0.26, "K")
    L.strand([mouth[0], mouth[1]], 0.13, 0.13, "K")


def grass(L, x):
    for (a, b) in [((x, 27.0), (x + 0.4, 25.4)), ((x + 0.6, 27.0), (x + 1.3, 25.9)), ((x - 0.4, 27.0), (x - 0.7, 25.8))]:
        L.strand([a, b], 0.22, 0.14, "G")


# ---- palette and output ---------------------------------------------------

def palette(b, common):
    p = dict(common)
    p.update({k: v for k, v in b.items() if isinstance(v, str)})
    B, S = b["B"], b["S"]
    p.setdefault("P", B); p.setdefault("Q", S)
    p.setdefault("R", "#efe6cc"); p.setdefault("U", "#f3a8b4")
    p["U"] = mix(p["U"], S, 0.35)
    F = b.get("face") or B
    Y = b.get("belly") or S
    p.update({
        "Bh": mix(B, "#ffffff", 0.22), "Bs": S,
        "Ph": mix(p["P"], "#ffffff", 0.18), "Ps": p["Q"],
        "F": F, "Fh": mix(F, "#ffffff", 0.2), "Fs": mix(F, "#000000", 0.16),
        "Y": Y, "Yh": mix(Y, "#ffffff", 0.15), "Ys": mix(Y, "#000000", 0.12),
        "Mh": mix(b["M"], "#ffffff", 0.28),
        "T": b["M"], "Th": mix(b["M"], "#ffffff", 0.25),
        "X": b.get("blaze") or b.get("socks") or B,
        "W": "#ffffff",
        "O": mix(S, "#000000", 0.62),
    })
    return p


def svg(layer, pal, mirror=False):
    gw, gh = layer.gw, layer.gh
    rows = []
    for py in range(gh):
        line = [layer.c.get((px, py)) for px in range(gw)]
        if mirror:
            line.reverse()
        x = 0
        while x < gw:
            k = line[x]
            if k is None:
                x += 1
                continue
            x1 = x
            while x1 + 1 < gw and line[x1 + 1] == k:
                x1 += 1
            rows.append(f'<rect x="{x}" y="{py}" width="{x1 - x + 1}" height="1" fill="{pal[k]}"/>')
            x = x1 + 1
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{gw * 4}" height="{gh * 4}" viewBox="0 0 {gw} {gh}" '
            f'shape-rendering="crispEdges">' + "".join(rows) + "</svg>\n")


def breed(name, b, common, write):
    pal = palette(b, common)
    horse = b["kind"] == "horse"

    def finish(L, under=None, dy=0):
        spots(L, b, dy)
        shade(L)
        outline(L, under)
        return L

    L = Layer()
    if horse:
        horse_torso(L, b); horse_legs(L, b); horse_head_up(L, b)
    else:
        cow_torso(L, b); cow_legs(L, b); cow_head_up(L, b)
    write(f"{name}-stand", svg, finish(L), pal)

    body = Layer()
    if horse:
        horse_torso(body, b); horse_legs(body, b)
    else:
        cow_torso(body, b); cow_legs(body, b)
    fill = Layer(); fill.c = dict(body.c)
    write(f"{name}-graze-body", svg, finish(body), pal)

    head = Layer()
    (horse_head_down if horse else cow_head_down)(head, b)
    write(f"{name}-graze-head", svg, finish(head, under=fill), pal)

    for tag, swish in (("a", False), ("b", True)):
        t = Layer()
        (horse_tail if horse else cow_tail)(t, swish)
        outline(t)
        write(f"{name}-tail-{tag}", svg, t, pal)

    s = Layer()
    (horse_sit if horse else cow_sit)(s, b)
    write(f"{name}-sit", svg, finish(s, dy=4.3), pal)
