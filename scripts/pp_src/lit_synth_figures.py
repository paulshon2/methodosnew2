# -*- coding: utf-8 -*-
"""Figures for Literature Review–Evidence Synthesis DOCX."""
from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams["font.sans-serif"] = ["Malgun Gothic", "DejaVu Sans", "Arial"]
plt.rcParams["axes.unicode_minus"] = False
COLORS = ["#2E5090", "#C44E52", "#55A868", "#8172B3", "#CCB974"]


def _save(fig, path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    fig.savefig(path, dpi=180, bbox_inches="tight")
    plt.close(fig)
    return path


def fig_prisma(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.0, 4.4))
    identified = 900 + seed % 400
    screened = identified - 150
    fulltext = 90 + seed % 50
    included = 18 + seed % 20
    boxes = [
        (0.5, 0.88, f"Identified\nn={identified}"),
        (0.5, 0.66, f"After duplicates\nn={screened}"),
        (0.5, 0.44, f"Full-text assessed\nn={fulltext}"),
        (0.5, 0.20, f"Included\nn={included}"),
    ]
    for x, y, t in boxes:
        ax.text(x, y, t, transform=ax.transAxes, ha="center", va="center", fontsize=10,
                bbox=dict(boxstyle="round,pad=0.4", fc="#dce6f5", ec="#2E5090"))
    for y1, y2 in [(0.82, 0.72), (0.60, 0.50), (0.38, 0.26)]:
        ax.annotate("", xy=(0.5, y2), xytext=(0.5, y1), xycoords=ax.transAxes,
                    arrowprops=dict(arrowstyle="->", color="#333"))
    ax.set_title(f"PRISMA-like flow — {title[:40]}", fontsize=11, fontweight="bold")
    ax.axis("off")
    return _save(fig, out)


def fig_forest(out: Path, title: str, seed: int):
    rng = np.random.default_rng(seed)
    k = 7
    es = rng.normal(-0.25, 0.15, size=k)
    se = rng.uniform(0.08, 0.18, size=k)
    y = np.arange(k)
    fig, ax = plt.subplots(figsize=(6.2, 3.8))
    ax.errorbar(es, y, xerr=1.96 * se, fmt="o", color="#2E5090", capsize=3)
    pooled = float(np.average(es, weights=1 / se**2))
    ax.axvline(pooled, color="#C44E52", ls="--", label=f"pooled~{pooled:.2f}")
    ax.axvline(0, color="#999", lw=0.8)
    ax.set_yticks(y)
    ax.set_yticklabels([f"S{i+1:02d}" for i in y])
    ax.set_xlabel("Effect size")
    ax.legend(loc="lower right", fontsize=8)
    ax.set_title(f"Forest-style — {title[:40]}", fontsize=11, fontweight="bold")
    ax.grid(axis="x", alpha=0.25)
    return _save(fig, out)


def fig_themes(out: Path, title: str, seed: int):
    rng = np.random.default_rng(seed)
    labs = ["Autonomy", "Barriers", "Stigma", "Support", "Access"]
    vals = rng.integers(5, 18, size=len(labs))
    fig, ax = plt.subplots(figsize=(6.0, 3.6))
    ax.barh(labs, vals, color=COLORS[:5], edgecolor="#333")
    ax.set_xlabel("Coded excerpts (n)")
    ax.set_title(f"Theme frequencies — {title[:40]}", fontsize=11, fontweight="bold")
    ax.grid(axis="x", alpha=0.25)
    return _save(fig, out)


def fig_rob(out: Path, title: str, seed: int):
    cats = ["Randomiz.", "Deviations", "Missing", "Measurement", "Selection"]
    low = [40, 35, 50, 45, 55]
    some = [35, 40, 30, 35, 30]
    high = [25, 25, 20, 20, 15]
    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    x = np.arange(len(cats))
    ax.bar(x, low, label="Low", color="#55A868")
    ax.bar(x, some, bottom=low, label="Some", color="#CCB974")
    ax.bar(x, high, bottom=np.array(low) + np.array(some), label="High", color="#C44E52")
    ax.set_xticks(x)
    ax.set_xticklabels(cats, rotation=15, ha="right")
    ax.set_ylabel("% of studies")
    ax.legend(fontsize=8)
    ax.set_title(f"RoB summary — {title[:40]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int) -> list[tuple[str, Path]]:
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    a = akey.lower()
    p1 = fig_dir / "figA_prisma.png"
    fig_prisma(p1, short, seed)
    out = [("그림 A. 선정 흐름(PRISMA형)", p1)]

    p2 = fig_dir / "figB_main.png"
    if a.startswith(("nr_", "sc_", "ilr_", "ca_qual", "lrm_", "ebm_")) and not a.startswith("sr_"):
        fig_themes(p2, short, seed)
        cap2 = "그림 B. 주제·개념 빈도(서술·스코핑형)"
    else:
        fig_forest(p2, short, seed)
        cap2 = "그림 B. 숲그림(Forest) 스타일 합성"
    out.append((cap2, p2))

    p3 = fig_dir / "figC_rob.png"
    fig_rob(p3, short, seed + 1)
    out.append(("그림 C. 비뚤림 위험 요약(영역별)", p3))
    return out
