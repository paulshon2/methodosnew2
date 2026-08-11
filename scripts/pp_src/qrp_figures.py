# -*- coding: utf-8 -*-
"""Figures for Q Methodology–Research Programme DOCX."""
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


def fig_qgrid(out: Path, title: str, seed: int):
    # quasi-normal forced distribution schematic
    cols = list(range(-4, 5))
    heights = [2, 3, 4, 5, 6, 5, 4, 3, 2]
    heights[seed % 9] += 1
    fig, ax = plt.subplots(figsize=(6.2, 3.0))
    ax.bar([str(c) for c in cols], heights, color="#2E5090")
    ax.set_xlabel("agree ← score → disagree (schematic)")
    ax.set_ylabel("# statements")
    ax.set_title(f"Q-sort grid — {title[:30]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_scree(out: Path, title: str, seed: int):
    ev = np.array([4.8, 2.6, 1.4, 0.9, 0.6, 0.4])
    ev[seed % 3] += 0.3
    fig, ax = plt.subplots(figsize=(5.4, 3.2))
    ax.plot(range(1, len(ev) + 1), ev, "-o", color="#C44E52", lw=2)
    ax.axhline(1.0, color="#888", ls="--", lw=1)
    ax.set_xlabel("factor")
    ax.set_ylabel("eigenvalue (schematic)")
    ax.set_title(f"Factor scree — {title[:30]}", fontsize=11, fontweight="bold")
    ax.grid(alpha=0.25)
    return _save(fig, out)


def fig_types(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(5.6, 3.6))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.axis("off")
    nodes = [(2.5, 5.5, "F1"), (7.5, 5.5, "F2"), (5, 2.2, "F3")]
    colors = ["#4C72B0", "#55A868", "#8172B2"]
    for (x, y, lab), c in zip(nodes, colors):
        ax.scatter(x, y, s=1200, c=c)
        ax.text(x, y, lab, ha="center", va="center", color="white", fontweight="bold")
    ax.set_title(f"Viewpoint types — {title[:28]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_grid.png"
    fig_qgrid(p1, short, seed)
    p2 = fig_dir / "figB_scree.png"
    fig_scree(p2, short, seed)
    p3 = fig_dir / "figC_types.png"
    fig_types(p3, short, seed)
    return [
        ("그림 A. Q-sort 정규분포 그리드(도식)", p1),
        ("그림 B. 요인 고유값 스크리(도식)", p2),
        ("그림 C. 주관적 관점 유형(F1–F3)", p3),
    ]
