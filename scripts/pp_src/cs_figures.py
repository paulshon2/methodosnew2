# -*- coding: utf-8 -*-
"""Figures for Case Study DOCX."""
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


def fig_case_design(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.0, 3.2))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis("off")
    # nested / multiple schematic
    ax.add_patch(plt.Rectangle((0.5, 1.5), 9, 3.5, fill=False, lw=2, edgecolor="#2E5090"))
    ax.text(5, 4.6, "Case boundary", ha="center", fontsize=10, fontweight="bold")
    boxes = [(1.2, 2.2, "면담"), (3.5, 2.2, "문서"), (5.8, 2.2, "관찰"), (7.8, 2.2, "기록/설문")]
    for x, y, lab in boxes:
        ax.add_patch(plt.Rectangle((x, y), 1.5, 1.2, fill=True, color="#4C72B0", alpha=0.85))
        ax.text(x + 0.75, y + 0.6, lab, ha="center", va="center", color="white", fontsize=8)
    ax.set_title(f"Case & sources — {title[:30]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_cross_matrix(out: Path, title: str, seed: int):
    data = np.array([[3, 2, 1], [2, 3, 2], [1, 2, 3], [2, 1, 2]], dtype=float)
    data[seed % 4, seed % 3] += 1
    fig, ax = plt.subplots(figsize=(5.4, 3.6))
    im = ax.imshow(data, cmap="Blues", vmin=0, vmax=4)
    ax.set_xticks([0, 1, 2])
    ax.set_xticklabels(["C1", "C2", "C3"])
    ax.set_yticks([0, 1, 2, 3])
    ax.set_yticklabels(["P1", "P2", "P3", "P4"])
    ax.set_title(f"Cross-case matrix — {title[:28]}", fontsize=11, fontweight="bold")
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    return _save(fig, out)


def fig_propositions(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(5.8, 3.4))
    labs = ["within", "cross", "match", "prop.", "analytic\ngen."]
    vals = [1, 1, 1, 1, 1]
    colors = ["#4C72B0", "#55A868", "#C44E52", "#8172B2", "#CCB974"]
    ax.bar(labs, vals, color=colors)
    ax.set_ylim(0, 1.4)
    ax.set_yticks([])
    ax.set_title(f"From cases to propositions — {title[:26]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_design.png"
    fig_case_design(p1, short, seed)
    p2 = fig_dir / "figB_cross.png"
    fig_cross_matrix(p2, short, seed)
    p3 = fig_dir / "figC_prop.png"
    fig_propositions(p3, short, seed)
    return [
        ("그림 A. 사례 경계·복수자료원", p1),
        ("그림 B. 사례 간 패턴 행렬", p2),
        ("그림 C. 사례→명제·분석적 일반화 흐름", p3),
    ]
