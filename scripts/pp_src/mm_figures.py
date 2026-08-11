# -*- coding: utf-8 -*-
"""Figures for Mixed Methods Design DOCX."""
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


def fig_design(out: Path, title: str, mode: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.2, 2.6))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 3)
    ax.axis("off")
    if "설명" in mode:
        boxes = [("QUANT", 1.2, "#4C72B0"), ("→", 4.0, "#888"), ("QUAL", 6.5, "#55A868")]
        subtitle = "Explanatory sequential"
    elif "탐색" in mode:
        boxes = [("QUAL", 1.2, "#55A868"), ("→", 4.0, "#888"), ("QUANT", 6.5, "#4C72B0")]
        subtitle = "Exploratory sequential"
    else:
        boxes = [("QUANT", 1.5, "#4C72B0"), ("QUAL", 5.5, "#55A868")]
        subtitle = "Convergent (parallel)"
        ax.annotate("", xy=(4.6, 1.5), xytext=(3.3, 1.5),
                    arrowprops=dict(arrowstyle="<->", color="#C44E52", lw=1.5))
        ax.text(4.0, 2.1, "merge", ha="center", fontsize=9, color="#C44E52")
    for lab, x, c in boxes:
        if lab == "→":
            ax.text(x, 1.4, "→", fontsize=18, ha="center", color=c)
        else:
            ax.add_patch(plt.Rectangle((x, 0.8), 2.2, 1.2, fill=True, color=c, alpha=0.85))
            ax.text(x + 1.1, 1.4, lab, ha="center", va="center", color="white", fontweight="bold")
    ax.set_title(f"{subtitle} — {title[:26]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_quant(out: Path, title: str, seed: int):
    labs = ["G1", "G2", "G3", "G4"]
    means = np.array([3.2, 3.8, 3.1, 4.0]) + (seed % 5) * 0.05
    se = np.array([0.12, 0.10, 0.14, 0.09])
    fig, ax = plt.subplots(figsize=(5.4, 3.2))
    ax.bar(labs, means, yerr=se, color="#4C72B0", capsize=4)
    ax.set_ylabel("mean score (schematic)")
    ax.set_title(f"Quantitative strand — {title[:28]}", fontsize=11, fontweight="bold")
    ax.set_ylim(0, 5)
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def fig_joint(out: Path, title: str, seed: int):
    themes = ["T01", "T02", "T03", "T04"]
    q_align = [0.85, 0.55, 0.70, 0.40]
    q_align[seed % 4] = min(0.95, q_align[seed % 4] + 0.1)
    fig, ax = plt.subplots(figsize=(5.4, 3.2))
    colors = ["#55A868" if v >= 0.6 else "#C44E52" for v in q_align]
    ax.barh(themes, q_align, color=colors)
    ax.axvline(0.60, color="#888", ls="--", label="convergence≥.60")
    ax.set_xlim(0, 1)
    ax.set_xlabel("quan–qual alignment (schematic)")
    ax.set_title(f"Joint display / convergence — {title[:24]}", fontsize=11, fontweight="bold")
    ax.legend(fontsize=8)
    ax.grid(axis="x", alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, mode: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_design.png"
    fig_design(p1, short, mode, seed)
    p2 = fig_dir / "figB_quant.png"
    fig_quant(p2, short, seed)
    p3 = fig_dir / "figC_joint.png"
    fig_joint(p3, short, seed)
    return [
        ("그림 A. 혼합설계 유형 도식", p1),
        ("그림 B. 양적 가닥 요약(도식)", p2),
        ("그림 C. 합치도·Joint display(도식)", p3),
    ]
