# Dựng "HP001 Rèn Chữ" từ font HP001 gốc (HP Design VN):
#  1. GSUB (calt): chữ ghép phụ âm đôi (ch, kh, nh, gh, ph, th) và o/ô/ơ + chữ sau (oi, ơi, oa, on, ôm…);
#     e, ê đứng sau một chữ khác dùng dạng có thanh ngang bắt đầu ở giữa thân (nối thẳng với nét ra);
#     b, v đứng trước e, ê, a, ă, â, o, ô, ơ (và o đứng trước chữ khác) dùng dạng nét ra thấp, chảy vào chữ sau;
#     i, u, ư, y đứng sau b, v dùng dạng bắt đầu từ đỉnh nét sổ để nét móc trên cao của b, v nối vào
#  2. Nới bề rộng N, V, S, P hoa: nét lượn trên cao không còn đè lên chữ sau
#  3. GPOS (kern): đặt chữ sau theo đầu nét — mép mực của chữ sau, ở đúng độ cao đầu nét ra của
#     chữ trước, trùng với đầu nét ra đó (như điểm neo nối nét). Đầu nét tìm bằng cách rút thân chữ về
#     đường xương 1 điểm ảnh. Chữ không có nét ra ở mép phải (s, chữ hoa B, C, D, O…) thì kéo sát cho chạm.
#  4. Bỏ ánh xạ F f J j W w Z z: HP001 đặt các kiểu chữ khác (A, V, M, m, n, số 2…) vào đó vì bảng chữ
#     tiếng Việt không có các chữ này → gõ "Font" ra "Oont". Bỏ đi để app lấy chữ từ font dự phòng.
#     Đổi tên họ font, ghi chú nguồn gốc
#
# Cần: fonttools, numpy, scipy, Pillow, scikit-image.
# Dùng: python3 build-hp001-calt.py <font gốc> hp001-connection-rules.json <font ra> "HP001 Rèn Chữ" <Regular|Bold>
import json
import sys
import unicodedata

import numpy as np
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw
from scipy import ndimage
from skimage.morphology import skeletonize

SRC, SPEC, OUT, FAMILY, STYLE = sys.argv[1:6]
spec = json.load(open(SPEC))
tt = TTFont(SRC)
cmap = tt.getBestCmap()
glyf = tt["glyf"]
hmtx = tt["hmtx"]
gset = tt.getGlyphSet()
XH = getattr(tt["OS/2"], "sxHeight", 0) or 824

TONES = ["", "̀", "́", "̉", "̃", "̣"]
VOWELS = set("aăâeêioôơuưy")


def toned(base):
    return [unicodedata.normalize("NFC", base + t) for t in TONES]


def gn(ch):
    return cmap[ord(ch)]


# ---------- Vẽ glyph thành mặt nạ để đo chỗ nối ----------
K = 0.25  # điểm ảnh trên một đơn vị font
W, H, BASE, ORIGIN = 1400, 1100, 700, 200


class _Poly(BasePen):
    """Làm phẳng đường viền thành đa giác."""

    def __init__(self, gs):
        super().__init__(gs)
        self.polys, self.cur = [], []

    def _moveTo(self, p):
        self.cur = [p]

    def _lineTo(self, p):
        self.cur.append(p)

    def _curveToOne(self, a, b, c):
        p0 = np.array(self.cur[-1])
        for t in np.linspace(0.1, 1, 10):
            u = 1 - t
            self.cur.append(tuple(u**3 * p0 + 3 * u * u * t * np.array(a) + 3 * u * t * t * np.array(b) + t**3 * np.array(c)))

    def _qCurveToOne(self, a, b):
        p0 = np.array(self.cur[-1])
        for t in np.linspace(0.1, 1, 8):
            u = 1 - t
            self.cur.append(tuple(u * u * p0 + 2 * u * t * np.array(a) + t * t * np.array(b)))

    def _closePath(self):
        if len(self.cur) > 2:
            self.polys.append(self.cur)
        self.cur = []

    _endPath = _closePath


_masks = {}


def body_mask(g):
    """Thân glyph (luật tô nonzero gần đúng; bỏ mảnh nhỏ như dấu thanh, dấu chấm)."""
    if g in _masks:
        return _masks[g]
    pen = _Poly(gset)
    gset[g].draw(pen)

    def area(p):
        return sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(p, p[1:] + p[:1])) / 2

    sign = 1 if sum(area(p) for p in pen.polys) >= 0 else -1
    fill = np.zeros((H, W), bool)
    holes = np.zeros((H, W), bool)
    for p in pen.polys:
        im = Image.new("1", (W, H), 0)
        ImageDraw.Draw(im).polygon([(ORIGIN + x * K, BASE - y * K) for x, y in p], fill=1)
        (fill if area(p) * sign > 0 else holes)[:] |= np.asarray(im)
    m = fill & ~holes
    lab, n = ndimage.label(m, structure=np.ones((3, 3)))
    if n > 1:
        sizes = ndimage.sum(m, lab, range(1, n + 1))
        m = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 0.25 * sizes.max()])
    _masks[g] = m
    return m


def gap(a, b, max_pull=320, step=8):
    """Khoảng cần kéo b (đặt sau a) sang trái cho tới khi hai thân chạm nhau; None nếu quá xa."""
    ma = ndimage.binary_dilation(body_mask(a))
    mb = body_mask(b)
    adv = hmtx[a][0]
    for pull in range(0, max_pull + 1, step):
        shift = int(round((adv - pull) * K))
        if shift >= W:
            continue
        sb = np.zeros_like(mb)
        sb[:, shift:] = mb[:, : W - shift]
        if (ma & sb).any():
            return pull
    return None


def exit_tip(g):
    """Đầu nét ra (đơn vị font): đầu mút phải nhất của đường xương thân chữ, trong dải thân chữ."""
    sk = skeletonize(body_mask(g))
    nb = ndimage.convolve(sk.astype(int), np.ones((3, 3), int), mode="constant") - 1
    ys, xs = np.where(sk & (nb == 1))
    pts = [((x - ORIGIN) / K, (BASE - y) / K) for y, x in zip(ys, xs)]
    pts = [p for p in pts if -0.1 * XH <= p[1] <= 1.25 * XH]
    return max(pts, key=lambda p: p[0]) if pts else None


def ink_left_at(g, y, band=0.07):
    """Mép trái mực của glyph quanh độ cao y; None nếu ở độ cao đó không có mực."""
    m = body_mask(g)
    r0, r1 = int(BASE - (y + band * XH) * K), int(BASE - (y - band * XH) * K)
    cols = np.where(m[max(r0, 0):r1].any(0))[0]
    return None if not len(cols) else (cols[0] - ORIGIN) / K


TIP_OVERLAP = 24  # chỗ nối ăn vào nhau một chút cho liền


def overlap_outside_joint(a, b, adv, tip):
    """Điểm ảnh chồng nét ngoài vùng quanh đầu nối (nét chữ sau đè lên chữ trước)."""
    ma, mb = body_mask(a), body_mask(b)
    s = int(round(adv * K))
    sb = np.zeros_like(mb)
    if s >= 0:
        sb[:, s:] = mb[:, : W - s]
    else:
        sb[:, :s] = mb[:, -s:]
    both = ma & sb
    yy, xx = np.ogrid[:H, :W]
    cx, cy = ORIGIN + tip[0] * K, BASE - tip[1] * K
    both &= (yy - cy) ** 2 + (xx - cx) ** 2 > (110 * K) ** 2
    return int(both.sum())


_tips = {}


def tip_kern(a, b):
    """Kern để đặt b theo đầu nét ra của a; None nếu không dùng được (a không có nét ra ở mép phải,
    b không có mực ở độ cao đó, hoặc đặt vậy sẽ đè nét)."""
    if a not in _tips:
        _tips[a] = exit_tip(a)
    tip = _tips[a]
    adv = hmtx[a][0]
    if tip is None or tip[0] < adv - 250 or not (0.15 * XH <= tip[1] <= 1.05 * XH):
        return None
    xl = ink_left_at(b, tip[1])
    if xl is None:
        return None
    new_adv = tip[0] - TIP_OVERLAP - xl
    # đầu mút đường xương nằm lùi trong nét → nếu hai chữ chưa chạm thì kéo sát thêm cho chạm
    da = ndimage.binary_dilation(body_mask(a))
    mb = body_mask(b)
    for _ in range(21):
        s = int(round(new_adv * K))
        sb = np.zeros_like(mb)
        if 0 <= s < W:
            sb[:, s:] = mb[:, : W - s]
        if (da & sb).any():
            break
        new_adv -= 8
    else:
        return None
    if overlap_outside_joint(a, b, new_adv, tip) > 30:
        return None
    return int(round(new_adv - adv))


# ---------- Bề rộng N, V, S, P ----------
class _Pts(BasePen):
    def __init__(self, gs):
        super().__init__(gs)
        self.p = []

    def _moveTo(self, p):
        self.p.append(p)

    def _lineTo(self, p):
        self.p.append(p)

    def _curveToOne(self, a, b, c):
        self.p += [a, b, c]

    def _qCurveToOne(self, a, b):
        self.p += [a, b]


widened = []
for ch in "NVSP":
    g = gn(ch)
    pen = _Pts(gset)
    gset[g].draw(pen)
    top = [p[0] for p in pen.p if p[1] > 1.15 * XH]
    adv, lsb = hmtx[g]
    if top and max(top) + 120 > adv:
        hmtx[g] = (int(max(top) + 120), lsb)
        widened.append(f"{ch}:{adv}->{hmtx[g][0]}")

# ---------- GSUB: chữ ghép o/ô/ơ ----------
lig_lines, lig_glyphs = [], []
for text, cp in spec["ligatures"]:
    if cp in cmap and all(ord(c) in cmap for c in text):
        lig_lines.append(f"    sub {' '.join(gn(c) for c in text)} by {cmap[cp]};")
        lig_glyphs.append(cmap[cp])
lig_lines = sorted(set(lig_lines), key=lambda l: -l.count(" "))

# ---------- GSUB: dạng giữa từ ----------
medial = [(gn(ch), cmap[cp]) for ch, cp in spec.get("medial", {}).items() if ord(ch) in cmap and cp in cmap]
medial = [(a, b) for a, b in medial if a != b]
medial_glyphs = sorted({b for _, b in medial})
letters_before = []
for c in "aăâbcdđeêghiklmnoôơpqrstuưvxy":
    letters_before += toned(c) if c in VOWELS else [c]
for c in "AĂÂBCDĐEÊGHIKLMOÔƠQRTUƯXY":  # chữ hoa N, P, S, V kết thúc trên cao, không nối
    letters_before += [t.upper() for t in toned(c.lower())] if c.lower() in VOWELS else [c]
# b, v, o còn chữ khác theo sau → dạng nét ra thấp
before_letter = [(gn(ch), cmap[cp]) for ch, cp in spec.get("beforeLetter", {}).items() if ord(ch) in cmap and cp in cmap]
before_letter = [(a, b) for a, b in before_letter if a != b]
before_letter_glyphs = sorted({b for _, b in before_letter})
# Sau b, v: i, u, ư, y nối với nét móc trên cao (giữ b, v chuẩn); chữ khác thì đổi b, v sang nét ra thấp
TOP_START = "iuưy"
letters_after = []
for c in "aăâbcdđeêghiklmnoôơpqrstuưvxy":
    letters_after += toned(c) if c in VOWELS else [c]
after_cls = sorted({gn(c) for c in letters_after if ord(c) in cmap and c[0] not in TOP_START
                    and unicodedata.normalize("NFD", c)[0] not in TOP_START} | set(lig_glyphs))
after_high = [(gn(ch), cmap[cp]) for ch, cp in spec.get("afterHigh", {}).items() if ord(ch) in cmap and cp in cmap]
after_high = [(a, b) for a, b in after_high if a != b]
after_high_glyphs = sorted({b for _, b in after_high})
high_exit = sorted({gn(c) for c in "bv"})
before_cls = sorted({gn(c) for c in letters_before if ord(c) in cmap} | set(lig_glyphs) | set(medial_glyphs)
                    | set(before_letter_glyphs) | set(after_high_glyphs))

# ---------- GPOS: kéo sát những cặp chữ chưa chạm ----------
# glyph ghép (gốc + dấu thanh) dùng chung thân với glyph gốc → gom theo gốc
tone_marks = set()
for ch in "éèẻẽẹ":
    tone_marks |= {c.glyphName for c in glyf[gn(ch)].components if c.glyphName != gn("e")}
by_base = {}
for g in tt.getGlyphOrder():
    gl = glyf[g]
    if gl.isComposite():
        bases = [c.glyphName for c in gl.components if c.glyphName not in tone_marks]
        if len(bases) == 1:
            by_base.setdefault(bases[0], set()).add(g)


def family(g):
    """Glyph + các bản có dấu dựng trên nó."""
    return sorted({g} | by_base.get(g, set()))


lower = []
for c in "aăâbcdđeêghiklmnoôơpqrstuưvxy":
    lower += toned(c) if c in VOWELS else [c]
base_of = {g: base for base, fam in by_base.items() for g in fam}  # glyph có dấu → glyph gốc
# Chữ có thể đứng sau trong một từ (đo theo glyph gốc; glyph có dấu dùng chung kết quả)
next_bases = sorted({base_of.get(g, g) for g in
                     [gn(c) for c in "aăâbcdđeêghiklmnoôơpqrstuưvxy"] + lig_glyphs + medial_glyphs
                     + before_letter_glyphs + after_high_glyphs})
OVERLAP = 16  # kéo thêm cho nét ăn vào nhau, không chỉ tì sát mép
# Mọi chữ có thể đứng trước trong một từ: chữ thường, chữ hoa, chữ ghép. Cặp nào hai thân chưa chạm
# (s + chữ sau, chữ hoa không có nét nối như B, C, D, O, T; bản đậm còn ch, kh, th, qu…) thì kéo sát.
prev_bases = sorted({base_of.get(g, g) for g in
                     [gn(c) for c in "aăâbcdđeêghiklmnoôơpqrstuưvxyAĂÂBCDĐEÊGHIKLMNOÔƠPQRSTUƯVXY"]
                     + lig_glyphs + medial_glyphs + before_letter_glyphs + after_high_glyphs})
NO_JOIN = {gn(c) for c in "NPSV"}  # chữ hoa kết thúc trên cao: giữ khoảng cách đã nới
pairs = []
for pg in prev_bases:
    if pg in NO_JOIN:
        continue
    for nb in next_bases:
        value = tip_kern(pg, nb)
        if value is None:  # không đặt theo đầu nét được → kéo sát cho chạm (nếu đang hở)
            pull = gap(pg, nb)
            if not pull:
                continue
            value = -(pull + OVERLAP)
        if abs(value) < 4:
            continue
        for a in family(pg):
            for b in family(nb):
                pairs.append(f"    pos {a} {b} {value};")
# mỗi cặp glyph một giá trị (glyph có thể vừa là gốc vừa nằm trong họ của gốc khác)
seen, uniq = set(), []
for line in pairs:
    key = tuple(line.split()[1:3])
    if key not in seen:
        seen.add(key)
        uniq.append(line)
pairs = sorted(uniq)

def lookup_block(name, subs):
    if not subs:
        return ""
    body = chr(10).join(f"    sub {a} by {b};" for a, b in subs)
    return f"lookup {name} {{\n{body}\n}} {name};"


rule_before = (f"    sub [{' '.join(a for a, _ in before_letter)}]' lookup TRUOC_CHU [{' '.join(after_cls)}];\n"
               if before_letter else "")
rule_high = (f"    sub [{' '.join(high_exit)}] [{' '.join(a for a, _ in after_high)}]' lookup SAU_NET_CAO;\n"
             if after_high else "")
fea = f"""
languagesystem DFLT dflt;
languagesystem latn dflt;
lookup CHU_GHEP_O {{
{chr(10).join(lig_lines)}
}} CHU_GHEP_O;
{lookup_block("TRUOC_CHU", before_letter)}
{lookup_block("SAU_NET_CAO", after_high)}
lookup GIUA_TU {{
{chr(10).join(f"    sub {a} by {b};" for a, b in medial)}
}} GIUA_TU;
feature calt {{
    lookup CHU_GHEP_O;
{rule_before}{rule_high}
    sub [{" ".join(before_cls)}] [{" ".join(a for a, _ in medial)}]' lookup GIUA_TU;
}} calt;
feature kern {{
{chr(10).join(pairs)}
}} kern;
"""
for sub in tt["cmap"].tables:
    for ch in "FfJjWwZz":
        sub.cmap.pop(ord(ch), None)
for tag in ("GSUB", "GPOS", "kern"):
    if tag in tt:
        del tt[tag]
addOpenTypeFeaturesFromString(tt, fea)

# ---------- Tên font ----------
name = tt["name"]
VERSION = "Version 1.2; Rèn Chữ: tự nối nét (calt + kern), không cần chuyển mã"
COPY = (
    "Font HP001 gốc: HP Design VN (hpdesignvn.com). Bản sửa của Rèn Chữ: thêm quy tắc "
    "OpenType chọn chữ ghép và kéo sát chỗ nối, dùng trực tiếp với chữ Unicode."
)
full = f"{FAMILY} {STYLE}".replace(" Regular", "")
for rec in list(name.names):
    if rec.nameID in (0, 1, 3, 4, 5, 6, 16, 17):
        name.removeNames(nameID=rec.nameID)
ps = full.replace(" ", "").encode("ascii", "ignore").decode()
for nid, val in [(0, COPY), (1, FAMILY), (2, STYLE), (3, f"{ps};1.2"), (4, full), (5, VERSION), (6, ps)]:
    name.setName(val, nid, 3, 1, 0x409)
    name.setName(unicodedata.normalize("NFKD", val).encode("ascii", "ignore").decode(), nid, 1, 0, 0)
tt.save(OUT)
print(f"{OUT} | chữ ghép: {len(lig_lines)} | giữa từ: {len(medial)} | cặp kéo sát: {len(pairs)} | nới bề rộng: {', '.join(widened)}")
