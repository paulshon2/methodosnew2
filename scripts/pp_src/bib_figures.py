# -*- coding: utf-8 -*-
"""Figures for Bibliometrics–Citation Analysis DOCX."""
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


def fig_trend(out: Path, title: str, seed: int):
    years = np.arange(2015, 2026)
    y = 40 + np.cumsum(np.random.RandomState(seed).randint(2, 12, size=len(years)))
    fig, ax = plt.subplots(figsize=(6.0, 3.2))
    ax.plot(years, y, "-o", color="#2E5090", linewidth=2)
    ax.set_xlabel("year")
    ax.set_ylabel("publications (schematic)")
    ax.set_title(f"Publication trend — {title[:30]}", fontsize=11, fontweight="bold")
    ax.grid(alpha=0.25)
    return _save(fig, out)


def fig_network(out: Path, title: str, seed: int):
    rng = np.random.RandomState(seed)
    fig, ax = plt.subplots(figsize=(5.6, 4.2))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.axis("off")
    n = 8
    xy = rng.rand(n, 2) * [8, 6] + [1, 1]
    for i in range(n):
        for j in range(i + 1, n):
            if rng.rand() > 0.65:
                ax.plot([xy[i, 0], xy[j, 0]], [xy[i, 1], xy[j, 1]], c="#99A", lw=0.8, alpha=0.7)
    ax.scatter(xy[:, 0], xy[:, 1], s=180 + 40 * rng.rand(n), c="#2E5090", zorder=3)
    ax.set_title(f"Co-authorship/citation map — {title[:26]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_indicators(out: Path, title: str, seed: int):
    labs = ["N", "Cites", "h", "centrality"]
    vals = [10, 8, 6, 7]
    vals[seed % 4] += 2
    fig, ax = plt.subplots(figsize=(5.4, 3.2))
    ax.bar(labs, vals, color=["#4C72B0", "#55A868", "#C44E52", "#8172B2"])
    ax.set_ylabel("relative (schematic)")
    ax.set_title(f"Indicator profile — {title[:28]}", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_trend.png"
    fig_trend(p1, short, seed)
    p2 = fig_dir / "figB_net.png"
    fig_network(p2, short, seed)
    p3 = fig_dir / "figC_ind.png"
    fig_indicators(p3, short, seed)
    return [
        ("그림 A. 출판·동향 추세그래프", p1),
        ("그림 B. 공저·인용 네트워크 맵(도식)", p2),
        ("그림 C. 계량지표 프로파일", p3),
    ]
