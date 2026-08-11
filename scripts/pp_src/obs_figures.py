# -*- coding: utf-8 -*-
"""Figures for Observation Technique DOCX."""
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


def fig_sampling(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.0, 2.8))
    t = np.arange(0, 30, 1)
    # time sampling marks
    marks = np.zeros_like(t, dtype=float)
    marks[::3] = 1
    ax.stem(t, marks, linefmt="#2E5090", markerfmt="o", basefmt=" ")
    ax.set_xlabel("minute (schematic)")
    ax.set_yticks([])
    ax.set_title(f"Time/event sampling — {title[:28]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_freq(out: Path, title: str, seed: int):
    labs = ["B01", "B02", "B03", "B04", "B05"]
    vals = [42, 28, 18, 15, 8]
    vals[seed % 5] += 5
    fig, ax = plt.subplots(figsize=(5.4, 3.2))
    ax.bar(labs, vals, color="#4C72B0")
    ax.set_ylabel("frequency")
    ax.set_title(f"Category frequencies — {title[:28]}", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def fig_kappa(out: Path, title: str, seed: int):
    cats = ["B01", "B02", "B03", "B04"]
    k = [0.72, 0.61, 0.55, 0.68]
    k[seed % 4] += 0.05
    fig, ax = plt.subplots(figsize=(5.4, 3.2))
    ax.bar(cats, k, color="#55A868")
    ax.axhline(0.60, color="#C44E52", ls="--", label="κ=0.60")
    ax.set_ylim(0, 1)
    ax.set_ylabel("Cohen's κ (schematic)")
    ax.set_title(f"Inter-observer κ — {title[:28]}", fontsize=11, fontweight="bold")
    ax.legend(fontsize=8)
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_samp.png"
    fig_sampling(p1, short, seed)
    p2 = fig_dir / "figB_freq.png"
    fig_freq(p2, short, seed)
    p3 = fig_dir / "figC_kappa.png"
    fig_kappa(p3, short, seed)
    return [
        ("그림 A. 시간/사건표집 도식", p1),
        ("그림 B. 행동범주 빈도", p2),
        ("그림 C. 관찰자간 Kappa(도식)", p3),
    ]
