# What a horse or cow does when clicked: whole-animal frames (tail included) on a bigger
# 44 x 38 art grid, the usual 36 x 28 grid placed at (OX, OY) so a rearing head or a
# kicked-back leg has room. Feet stay on art row 27 + OY. Used by sprites.py:
#   <breed>-act-<frame>-<r|l>.svg
# Horses: rear-a / rear-b (rearing, front legs folded / striking: paw the air), buck,
#   paw-a / paw-b (pawing the ground), toss-up / toss-down (head tossing), trot-a / trot-b
#   (piaffe: diagonal pairs, trotting on the spot).
# Cows (they don't rear or piaffe): hop (kicking up their heels), paw-a / paw-b, shake-a /
#   shake-b (shaking the head), moo (head up, mouth open).
# Parts are drawn with hd.py's shapes in the usual coordinates, then turned about a joint.
import math

import hd
from hd import Layer, R

OX, OY = 4, 10
AW, AH = 36 + 2 * OX, 28 + OY

# Each leg: hip or shoulder, knee or hock, hoof; radius top and bottom; far side (darker).
HORSE_LEGS = {
    "fh": ([(13.0, 17.6), (12.2, 21.6), (12.7, 25.6)], (1.4, 0.65), True),
    "ff": ([(21.4, 17.6), (21.6, 21.8), (21.5, 25.6)], (1.1, 0.65), True),
    "nh": ([(10.8, 17.8), (9.6, 21.6), (10.3, 25.6)], (1.7, 0.7), False),
    "nf": ([(23.4, 17.6), (23.7, 21.8), (23.8, 25.6)], (1.25, 0.7), False),
}
COW_LEGS = {
    "fh": ([(11.2, 18.6), (10.4, 22.0), (11.0, 25.5)], (1.7, 1.05), True),
    "ff": ([(19.6, 18.6), (19.8, 22.2), (19.8, 25.5)], (1.4, 1.05), True),
    "nh": ([(8.6, 18.8), (7.8, 22.0), (8.4, 25.5)], (2.0, 1.15), False),
    "nf": ([(22.0, 18.6), (22.2, 22.2), (22.2, 25.5)], (1.6, 1.15), False),
}


def legs(L, b, horse, which, moved=None):
    """Draws the legs in `which` (far ones first); `moved` gives some new joint points."""
    table = HORSE_LEGS if horse else COW_LEGS
    for k in ("fh", "ff", "nh", "nf"):
        if k not in which:
            continue
        pts, (r0, r1), far = table[k]
        pts = (moved or {}).get(k, pts)
        body = "S" if far else "B"
        L.strand(pts, r0, r1, body)
        L.ellipse(pts[1][0], pts[1][1], (r0 + r1) * 0.45, (r0 + r1) * 0.4, body)
        (hx, hy), (px, py) = pts[-1], pts[-2]
        if horse and b.get("socks"):
            sx, sy = hx + (px - hx) * 0.45, hy + (py - hy) * 0.45
            L.strand([(sx, sy), (hx, hy)], r1 * 1.02, r1 * 1.02, "X")
        on_ground = hy >= 25.3
        w = 1.0 if horse else 1.25
        if on_ground:
            L.poly([(hx - w * 0.9, 25.6), (hx + w * 0.9, 25.6), (hx + w * 1.15, 27.0), (hx - w * 1.05, 27.0)], "H")
            if not horse:
                L.strand([(hx + 0.05, 25.9), (hx + 0.05, 27.0)], 0.12, 0.12, "O")
        else:
            d = math.hypot(hx - px, hy - py) or 1
            ux, uy = (hx - px) / d, (hy - py) / d
            L.strand([(hx - ux * 0.2, hy - uy * 0.2), (hx + ux * 1.2, hy + uy * 1.2)], w * 0.95, w * 1.05, "H")


def turn(dst, src, pivot, deg, dx=0.0, dy=0.0, off=(OX, OY)):
    """Paints `src` (usual coordinates) onto `dst` (action grid), turned `deg` about
    `pivot` (positive: the front, on the right, goes up), then moved by (dx, dy)."""
    if not src.c:
        return
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    cx, cy = pivot
    pts = [((px + 0.5) / R, (py + 0.5) / R) for px, py in src.c]
    xs, ys = [], []
    for x, y in pts:
        ex, ey = x - cx, y - cy
        xs.append(cx + ex * c + ey * s); ys.append(cy - ex * s + ey * c)
    ox, oy = off
    x0, x1 = min(xs) - 1 + dx + ox, max(xs) + 1 + dx + ox
    y0, y1 = min(ys) - 1 + dy + oy, max(ys) + 1 + dy + oy
    for qy in range(max(0, int(y0 * R)), min(dst.gh, int(y1 * R) + 1)):
        for qx in range(max(0, int(x0 * R)), min(dst.gw, int(x1 * R) + 1)):
            X, Y = (qx + 0.5) / R - ox - dx - cx, (qy + 0.5) / R - oy - dy - cy
            sx, sy = cx + X * c - Y * s, cy + X * s + Y * c
            k = src.c.get((int(sx * R), int(sy * R)))
            if k:
                dst.c[(qx, qy)] = k


def part(draw, b):
    L = Layer(60 * R, 50 * R)
    draw(L)
    hd.spots(L, b)
    return L


def frame(b, pieces):
    """pieces: (draw, pivot, deg, dx, dy), back to front."""
    out = Layer(AW * R, AH * R)
    for draw, pivot, deg, dx, dy in pieces:
        turn(out, part(draw, b), pivot, deg, dx, dy)
    out.cut_below(27.0 + OY)
    hd.rainbow(out, b)
    hd.shade(out)
    hd.outline(out)
    return out


def horse_frames(b):
    torso = lambda L: hd.horse_torso(L, b)
    head = lambda L: hd.horse_head_up(L, b)
    tail = lambda L: hd.horse_tail(L, False)
    swish = lambda L: hd.horse_tail(L, True)
    four = lambda moved=None: (lambda L: legs(L, b, True, "fh ff nh nf", moved))
    hip, shoulder, neck = (11.5, 18.0), (22.5, 18.0), (20.0, 13.6)

    # Rearing: everything but the hind legs turns up about the hip, sinking a little onto
    # the hocks; the front legs fold (a) or strike out (b).
    folded = {"ff": [(21.4, 17.6), (24.0, 20.2), (23.0, 23.0)], "nf": [(23.4, 17.6), (26.2, 19.8), (25.2, 22.8)]}
    striking = {"ff": [(21.4, 17.6), (23.4, 19.8), (22.2, 22.4)], "nf": [(23.4, 17.6), (27.0, 18.6), (28.6, 21.2)]}
    hind = {"fh": [(13.0, 19.2), (15.0, 22.4), (14.0, 25.6)], "nh": [(10.8, 19.4), (13.2, 22.6), (11.4, 25.6)]}
    def rear(front):
        return [(swish, hip, 30, 0, 1.4), (lambda L: legs(L, b, True, "fh nh", hind), hip, 0, 0, 0),
                (torso, hip, 30, 0, 1.4), (lambda L: legs(L, b, True, "ff nf", front), hip, 30, 0, 1.4),
                (head, hip, 30, 0, 1.4)]

    # Bucking: hindquarters up about the shoulder, hind legs flung out behind, head lowered.
    kicked = {"fh": [(13.0, 17.6), (9.0, 18.6), (5.0, 18.0)], "nh": [(10.8, 17.8), (6.6, 19.6), (2.4, 19.6)]}
    def low_head(L):
        h = Layer(60 * R, 50 * R)
        hd.horse_head_up(h, b)
        turn(L, h, neck, -26, off=(0, 0))
    buck = [(swish, shoulder, -11, 0, 0), (lambda L: legs(L, b, True, "fh nh", kicked), shoulder, -11, 0, 0),
            (lambda L: legs(L, b, True, "ff nf"), shoulder, 0, 0, 0), (torso, shoulder, -11, 0, 0),
            (low_head, shoulder, -11, 0, 0)]

    # Pawing the ground: the near front leg lifts (a), then strikes forward and scrapes (b).
    paw_a = {"nf": [(23.4, 17.6), (26.0, 20.6), (25.0, 23.4)]}
    paw_b = {"nf": [(23.4, 17.6), (25.4, 21.4), (26.8, 25.6)]}
    stand = lambda moved, deg=0: [(tail, hip, 0, 0, 0), (torso, hip, 0, 0, 0), (four(moved), hip, 0, 0, 0),
                                  (head, neck, deg, 0, 0)]

    # Piaffe: a trot on the spot, the diagonal pairs lifting in turn, head tucked.
    trot_a = {"nf": [(23.4, 17.6), (25.6, 20.8), (24.6, 23.6)], "fh": [(13.0, 17.6), (14.2, 21.0), (12.6, 24.0)]}
    trot_b = {"ff": [(21.4, 17.6), (23.6, 20.8), (22.6, 23.6)], "nh": [(10.8, 17.8), (11.8, 21.2), (10.0, 24.0)]}

    return {
        "rear-a": frame(b, rear(folded)),
        "rear-b": frame(b, rear(striking)),
        "buck": frame(b, buck),
        "paw-a": frame(b, stand(paw_a)),
        "paw-b": frame(b, stand(paw_b)),
        "toss-up": frame(b, stand(None, 18)),
        "toss-down": frame(b, stand(None, -9)),
        "trot-a": frame(b, stand(trot_a, -6)),
        "trot-b": frame(b, stand(trot_b, -6)),
    }


def cow_moo(L, b):
    hd.cow_head_up(L, b)
    L.ellipse(31.5, 12.9, 1.15, 0.75, "K")
    L.ellipse(31.6, 13.2, 0.6, 0.32, "L")


def cow_frames(b):
    torso = lambda L: hd.cow_torso(L, b)
    head = lambda L: hd.cow_head_up(L, b)
    tail = lambda L: hd.cow_tail(L, False)
    swish = lambda L: hd.cow_tail(L, True)
    mid, neck = (15.0, 18.0), (21.0, 13.4)
    stand = lambda moved=None, deg=0, draw_head=head: [
        (tail, mid, 0, 0, 0), (torso, mid, 0, 0, 0), (lambda L: legs(L, b, False, "fh ff nh nf", moved), mid, 0, 0, 0),
        (draw_head, neck, deg, 0, 0)]

    # Kicking up its heels: legs tucked, hind legs flung back, nose a little up. The mod
    # lifts the whole frame off the ground.
    tucked = {"ff": [(19.6, 18.6), (21.8, 21.0), (20.6, 23.4)], "nf": [(22.0, 18.6), (24.4, 20.8), (23.2, 23.2)],
              "fh": [(11.2, 18.6), (8.8, 21.2), (6.4, 22.8)], "nh": [(8.6, 18.8), (6.0, 20.8), (3.4, 22.2)]}
    hop = [(swish, mid, 6, 0, -1.5), (torso, mid, 6, 0, -1.5),
           (lambda L: legs(L, b, False, "fh ff nh nf", tucked), mid, 6, 0, -1.5), (head, mid, 12, 0, -1.5)]

    paw_a = {"nf": [(22.0, 18.6), (24.6, 21.2), (23.8, 23.8)]}
    paw_b = {"nf": [(22.0, 18.6), (24.0, 22.0), (25.4, 25.5)]}
    return {
        "hop": frame(b, hop),
        "paw-a": frame(b, stand(paw_a, -4)),
        "paw-b": frame(b, stand(paw_b, -6)),
        "shake-a": frame(b, stand(None, 10)),
        "shake-b": frame(b, stand(None, -8)),
        "moo": frame(b, stand(None, 16, lambda L: cow_moo(L, b))),
    }


def breed_actions(name, b, common, write):
    pal = hd.palette(b, common)
    frames = horse_frames(b) if b["kind"] == "horse" else cow_frames(b)
    for key, L in frames.items():
        write(f"{name}-act-{key}", hd.svg, L, pal)
