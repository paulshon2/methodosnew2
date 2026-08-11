# -*- coding: utf-8 -*-
"""Figures for Content Analysis–Coding DOCX."""
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


def fig_freq(out: Path, title: str, seed: int):
    labs = ["C1", "C2", "C3", "C4", "Other"]
    vals = np.array([34, 28, 22, 12, 4]) + (seed % 5)
    fig, ax = plt.subplots(figsize=(5.8, 3.4))
    ax.bar(labs, vals, color="#2E5090")
    ax.set_ylabel("% of units")
    ax.set_title(f"Category frequencies — {title[:34]}", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def fig_kappa(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(5.6, 3.2))
    k = 0.74 + (seed % 10) / 100
    ax.barh(["Cohen κ", "Krippendorff α"], [k, k - 0.03], color=["#2E5090", "#C44E52"])
    ax.axvline(0.70, color="#999", ls="--", label="κ≈.70 ref")
    ax.set_xlim(0, 1)
    ax.legend(fontsize=8)
    ax.set_title(f"Inter-coder reliability — {title[:32]}", fontsize=11, fontweight="bold")
    ax.grid(axis="x", alpha=0.25)
    return _save(fig, out)


def fig_heatmap(out: Path, title: str, seed: int):
    rng = np.random.default_rng(seed)
    m = rng.integers(5, 40, size=(4, 3))
    fig, ax = plt.subplots(figsize=(5.8, 3.6))
    im = ax.imshow(m, cmap="Blues")
    ax.set_xticks([0, 1, 2])
    ax.set_xticklabels(["Period1", "Period2", "Period3"])
    ax.set_yticks([0, 1, 2, 3])
    ax.set_yticklabels(["C1", "C2", "C3", "C4"])
    fig.colorbar(im, ax=ax, fraction=0.046)
    ax.set_title(f"Category × time — {title[:32]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_freq.png"
    fig_freq(p1, short, seed)
    p2 = fig_dir / "figB_kappa.png"
    fig_kappa(p2, short, seed)
    p3 = fig_dir / "figC_heat.png"
    fig_heatmap(p3, short, seed)
    return [
        ("그림 A. 범주별 빈도(%)", p1),
        ("그림 B. 코더간 신뢰도(κ/α)", p2),
        ("그림 C. 범주×시기 교차(히트맵)", p3),
    ]
