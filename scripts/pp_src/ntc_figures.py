# -*- coding: utf-8 -*-
"""Figures for Nursing Theory Construction DOCX."""
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


def fig_sources(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(5.6, 3.2))
    labs = ["면담", "관찰", "문서"]
    vals = [12, 8, 5]
    vals[seed % 3] += 2
    ax.bar(labs, vals, color=["#4C72B0", "#55A868", "#C44E52"])
    ax.set_ylabel("units (schematic)")
    ax.set_title(f"Data sources — {title[:30]}", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def fig_theory(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(5.8, 4.0))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.axis("off")
    nodes = [
        (5, 6.5, "조건", "#8172B2"),
        (2.5, 3.8, "과정", "#4C72B0"),
        (7.5, 3.8, "맥락", "#55A868"),
        (5, 1.5, "결과/이론", "#C44E52"),
    ]
    for x, y, lab, c in nodes:
        ax.scatter(x, y, s=900, c=c)
        ax.text(x, y, lab, ha="center", va="center", color="white", fontsize=9, fontweight="bold")
    for a, b in [(0, 1), (0, 2), (1, 3), (2, 3)]:
        ax.plot([nodes[a][0], nodes[b][0]], [nodes[a][1], nodes[b][1]], c="#666", lw=1.2)
    ax.set_title(f"Middle-range sketch — {title[:26]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_themes(out: Path, title: str, seed: int):
    labs = ["T1", "T2", "T3", "T4"]
    vals = [9, 8, 7, 6]
    vals[seed % 4] += 2
    fig, ax = plt.subplots(figsize=(5.4, 3.2))
    ax.barh(labs[::-1], vals[::-1], color="#2E5090")
    ax.set_xlabel("analytic weight (schematic)")
    ax.set_title(f"Themes — {title[:30]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_src.png"
    fig_sources(p1, short, seed)
    p2 = fig_dir / "figB_theory.png"
    fig_theory(p2, short, seed)
    p3 = fig_dir / "figC_themes.png"
    fig_themes(p3, short, seed)
    return [
        ("그림 A. 복수자료원(면담·관찰·문서)", p1),
        ("그림 B. 중범위 이론 스케치(조건–과정–결과)", p2),
        ("그림 C. 주제 가중(도식)", p3),
    ]
