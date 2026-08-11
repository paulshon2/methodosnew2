# -*- coding: utf-8 -*-
"""Figures for Action–Participatory Research DOCX."""
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
    fig, ax = plt.subplots(figsize=(5.6, 5.0))
    labs = ["계획", "실행", "관찰", "반성"]
    ang = np.linspace(0, 2 * np.pi, 4, endpoint=False)
    xs, ys = 0.5 + 0.28 * np.cos(ang), 0.5 + 0.28 * np.sin(ang)
    for i, (lab, x, y) in enumerate(zip(labs, xs, ys)):
        ax.text(x, y, lab, ha="center", va="center", fontsize=10,
                bbox=dict(boxstyle="round", fc="#dce6f5", ec="#2E5090"))
        j = (i + 1) % 4
        ax.annotate("", xy=(xs[j], ys[j]), xytext=(x, y),
                    arrowprops=dict(arrowstyle="->", color="#555"))
    ax.text(0.5, 0.5, "AR\nCycle", ha="center", va="center", fontweight="bold")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    ax.set_title(f"Action cycle — {title[:34]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_outcomes(out: Path, title: str, seed: int):
    cyc = ["C1", "C2", "C3"]
    y = [42 + seed % 5, 50 + seed % 4, 58 + seed % 3]
    fig, ax = plt.subplots(figsize=(5.6, 3.4))
    ax.plot(cyc, y, "o-", color="#2E5090", ms=8, label="key indicator")
    ax.set_ylabel("indicator (example scale)")
    ax.set_title(f"Outcome by cycle — {title[:34]}", fontsize=11, fontweight="bold")
    ax.legend(fontsize=8)
    ax.grid(alpha=0.25)
    return _save(fig, out)


def fig_prepost(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(5.2, 3.4))
    pre, post = 3.1 + (seed % 5) / 20, 3.6 + (seed % 5) / 20
    ax.bar(["Pre", "Post"], [pre, post], color=["#999", "#C44E52"])
    ax.set_ylim(1, 5)
    ax.set_ylabel("survey mean (1–5)")
    ax.set_title(f"Pre–post (aux) — {title[:34]}", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_cycle.png"
    fig_cycle(p1, short, seed)
    p2 = fig_dir / "figB_out.png"
    fig_outcomes(p2, short, seed)
    p3 = fig_dir / "figC_prepost.png"
    fig_prepost(p3, short, seed)
    return [
        ("그림 A. 계획–실행–관찰–반성 사이클", p1),
        ("그림 B. 사이클별 성과지표 변화", p2),
        ("그림 C. 사전–사후 설문(보조)", p3),
    ]
