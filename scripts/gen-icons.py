#!/usr/bin/env python3
"""methodos 앱 아이콘 생성기.

public/methodos-logo.png(원래 M 로고)를 브랜드 퍼플 그라디언트 위에 흰색 M으로 올려
데스크탑(작업표시줄/타이틀바) · PWA(안드로이드 홈) · iOS(홈 화면) · 브라우저 탭
전 플랫폼에서 실제 methodos 로고가 표시되도록 아이콘 세트를 만든다.

이전 버전의 "R" 플레이스홀더 아이콘을 대체한다.
사용: python scripts/gen-icons.py   (saas 폴더에서 실행)
"""
import base64
import io
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # saas/
PUBLIC = os.path.join(HERE, "public")
PUB_ICONS = os.path.join(PUBLIC, "icons")
OUT = os.path.join(HERE, "out")
OUT_ICONS = os.path.join(OUT, "icons")

# 브랜드 그라디언트 (theme_color #534AB7 → #7a6fe0), 원래 icon.svg 와 동일
C_TOP = (83, 74, 183)     # #534AB7
C_BOT = (122, 111, 224)   # #7a6fe0


def white_mark():
    """원래 M 마크(mark.png)의 실루엣을 흰색으로 변환해 반환."""
    mark = Image.open(os.path.join(PUBLIC, "methodos-logo.png")).convert("RGBA")
    bbox = mark.split()[3].getbbox()
    if bbox:
        mark = mark.crop(bbox)
    alpha = mark.split()[3]
    solid = Image.new("RGBA", mark.size, (255, 255, 255, 255))
    clear = Image.new("RGBA", mark.size, (255, 255, 255, 0))
    return Image.composite(solid, clear, alpha)


def gradient(size):
    """대각선 퍼플 그라디언트 정사각형 이미지."""
    g = Image.new("RGB", (64, 64))
    px = g.load()
    for y in range(64):
        for x in range(64):
            t = (x + y) / 126.0
            px[x, y] = tuple(int(C_TOP[i] + (C_BOT[i] - C_TOP[i]) * t) for i in range(3))
    return g.resize((size, size), Image.BICUBIC).convert("RGBA")


def compose(size, radius_ratio=0.0, mark_ratio=0.58):
    """아이콘 1장 생성. radius_ratio>0 이면 라운드 사각형."""
    icon = gradient(size)
    if radius_ratio > 0:
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            [0, 0, size - 1, size - 1], radius=int(size * radius_ratio), fill=255
        )
        out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        out.paste(icon, (0, 0), mask)
        icon = out
    m = white_mark()
    target = int(size * mark_ratio)
    scale = target / max(m.size)
    m = m.resize((max(1, int(m.width * scale)), max(1, int(m.height * scale))), Image.LANCZOS)
    icon.alpha_composite(m, ((size - m.width) // 2, (size - m.height) // 2))
    return icon


def save(img, *paths):
    for p in paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        img.save(p)
        print("  ->", os.path.relpath(p, HERE))


def main():
    # PWA / 안드로이드 (풀블리드 정사각 → 런처 마스크 대응)
    icon512 = compose(512, radius_ratio=0.0, mark_ratio=0.56)
    icon192 = compose(192, radius_ratio=0.0, mark_ratio=0.56)
    save(icon512, os.path.join(PUB_ICONS, "icon-512.png"), os.path.join(OUT_ICONS, "icon-512.png"))
    save(icon192, os.path.join(PUB_ICONS, "icon-192.png"), os.path.join(OUT_ICONS, "icon-192.png"))

    # iOS 홈 화면 (iOS가 자체적으로 라운드 처리 → 정사각)
    apple = compose(180, radius_ratio=0.0, mark_ratio=0.58)
    save(apple, os.path.join(PUB_ICONS, "apple-touch-icon.png"), os.path.join(OUT_ICONS, "apple-touch-icon.png"))

    # 데스크탑 타이틀바 / 브라우저 탭 (라운드 배지)
    rounded = compose(256, radius_ratio=0.22, mark_ratio=0.60)
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    save(rounded.resize((32, 32), Image.LANCZOS),
         os.path.join(PUB_ICONS, "favicon-32.png"), os.path.join(OUT_ICONS, "favicon-32.png"))
    for p in (os.path.join(PUBLIC, "favicon.ico"), os.path.join(OUT, "favicon.ico")):
        os.makedirs(os.path.dirname(p), exist_ok=True)
        rounded.save(p, sizes=ico_sizes)
        print("  ->", os.path.relpath(p, HERE))

    # icon.svg — 라운드 사각 그라디언트 + 원래 M 로고(흰색) 임베드
    m = white_mark()
    buf = io.BytesIO(); m.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    mw, mh = m.size
    tw = 512 * 0.60
    th = tw * mh / mw
    if th > 512 * 0.60:
        th = 512 * 0.60; tw = th * mw / mh
    x = (512 - tw) / 2; y = (512 - th) / 2
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
        'viewBox="0 0 512 512" width="512" height="512">\n'
        '  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">\n'
        '    <stop offset="0" stop-color="#534AB7"/><stop offset="1" stop-color="#7a6fe0"/></linearGradient></defs>\n'
        '  <rect width="512" height="512" rx="112" fill="url(#g)"/>\n'
        f'  <image x="{x:.1f}" y="{y:.1f}" width="{tw:.1f}" height="{th:.1f}" '
        f'xlink:href="data:image/png;base64,{b64}"/>\n'
        '</svg>\n'
    )
    for p in (os.path.join(PUB_ICONS, "icon.svg"), os.path.join(OUT_ICONS, "icon.svg")):
        with open(p, "w", encoding="utf-8") as f:
            f.write(svg)
        print("  ->", os.path.relpath(p, HERE))


if __name__ == "__main__":
    print("methodos 아이콘 생성 중...")
    main()
    print("완료.")
