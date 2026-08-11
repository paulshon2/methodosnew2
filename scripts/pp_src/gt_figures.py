# -*- coding: utf-8 -*-
"""Figures for Grounded Theory DOCX."""
from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams["font.sans-serif"] = ["Malgun Gothic", "DejaVu Sans", "Arial"]
plt.rcParams["axes.unicode_minus"] = False


def _save(fig, path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    fig.savefig(path, dpi=180, bbox_inches="tight")
    plt.close(fig)
    return path


def fig_cycle(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(5.8, 5.0))
    labs = ["이론적표집", "수집\n면담·관찰", "개방·축·선택\n코딩", "메모잉", "포화점검"]
    angles = np.linspace(0, 2 * np.pi, len(labs), endpoint=False)
    xs = 0.5 + 0.32 * np.cos(angles)
    ys = 0.5 + 0.32 * np.sin(angles)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    for i, (lab, x, y) in enumerate(zip(labs, xs, ys)):
        ax.text(x, y, lab, ha="center", va="center", fontsize=8,
                bbox=dict(boxstyle="round", fc="#dce6f5", ec="#2E5090"))
        j = (i + 1) % len(labs)
        ax.annotate("", xy=(xs[j], ys[j]), xytext=(x, y),
                    arrowprops=dict(arrowstyle="->", color="#555", lw=1.2))
    ax.text(0.5, 0.5, "GT\n순환", ha="center", va="center", fontsize=11, fontweight="bold")
    ax.set_title(f"수집–분석 순환 — {title[:32]}", fontsize=11, fontweight="bold")
    ax.axis("off")
    return _save(fig, out)


def fig_paradigm(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.4, 3.8))
    boxes = [
        (0.08, 0.55, "인과조건"),
        (0.32, 0.75, "현상/핵심"),
        (0.56, 0.55, "맥락"),
        (0.32, 0.35, "중재조건"),
        (0.56, 0.20, "전략"),
        (0.80, 0.40, "결과"),
    ]
    for x, y, t in boxes:
        ax.text(x, y, t, transform=ax.transAxes, fontsize=9,
                bbox=dict(boxstyle="round", fc="#f5e6dc", ec="#C44E52"))
    ax.annotate("", xy=(0.30, 0.78), xytext=(0.18, 0.60), xycoords=ax.transAxes,
                arrowprops=dict(arrowstyle="->", color="#333"))
    ax.annotate("", xy=(0.54, 0.58), xytext=(0.42, 0.72), xycoords=ax.transAxes,
                arrowprops=dict(arrowstyle="->", color="#333"))
    ax.annotate("", xy=(0.54, 0.28), xytext=(0.40, 0.40), xycoords=ax.transAxes,
                arrowprops=dict(arrowstyle="->", color="#333"))
    ax.annotate("", xy=(0.78, 0.42), xytext=(0.66, 0.25), xycoords=ax.transAxes,
                arrowprops=dict(arrowstyle="->", color="#333"))
    ax.set_title(f"패러다임 모형 — {title[:34]}", fontsize=11, fontweight="bold")
    ax.axis("off")
    return _save(fig, out)


def fig_freq(out: Path, title: str, seed: int):
    cats = ["견딤", "지지", "규범", "협상", "전환"]
    vals = [18 + seed % 5, 14 + seed % 4, 12 + seed % 3, 10 + seed % 4, 8 + seed % 3]
    fig, ax = plt.subplots(figsize=(5.8, 3.4))
    ax.bar(cats, vals, color="#2E5090")
    ax.set_ylabel("코드 출현(보조)")
    ax.set_title(f"범주 빈도(보조) — {title[:34]}", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_cycle.png"
    fig_cycle(p1, short, seed)
    p2 = fig_dir / "figB_paradigm.png"
    fig_paradigm(p2, short, seed)
    p3 = fig_dir / "figC_freq.png"
    fig_freq(p3, short, seed)
    return [
        ("그림 A. 이론적 표집–수집–코딩–메모 순환", p1),
        ("그림 B. 축코딩 패러다임 모형", p2),
        ("그림 C. 범주 출현빈도(보조)", p3),
    ]
