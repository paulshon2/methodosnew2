# -*- coding: utf-8 -*-
"""Figures for Symbolic Interactionism DOCX."""
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


def fig_scene_flow(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.0, 3.0))
    steps = ["진입", "개시의례", "상징교환", "의미협상", "종료"]
    ax.barh(steps[::-1], [1] * 5, color="#2E5090")
    ax.set_xticks([])
    ax.set_xlabel("interaction episode")
    ax.set_title(f"Scene flow — {title[:32]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_ritual_chain(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(5.8, 4.0))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.axis("off")
    nodes = [(2, 6, "공동초점"), (8, 6, "정서에너지"), (5, 3.2, "연대/도덕"), (5, 1.2, "상징재생산")]
    colors = ["#4C72B0", "#C44E52", "#55A868", "#8172B2"]
    for (x, y, lab), c in zip(nodes, colors):
        ax.scatter(x, y, s=900, c=c)
        ax.text(x, y, lab, ha="center", va="center", color="white", fontsize=8, fontweight="bold")
    for a, b in [(0, 1), (0, 2), (1, 2), (2, 3)]:
        ax.plot([nodes[a][0], nodes[b][0]], [nodes[a][1], nodes[b][1]], c="#666", lw=1.2)
    ax.set_title(f"Ritual chain — {title[:30]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_negotiate(out: Path, title: str, seed: int):
    labs = ["초기정의", "도전", "재정의", "타협", "잔여갈등"]
    vals = [7, 6, 8, 5, 3]
    vals[seed % 5] += 2
    fig, ax = plt.subplots(figsize=(5.6, 3.2))
    ax.plot(labs, vals, "-o", color="#2E5090", linewidth=2)
    ax.set_ylabel("analytic weight (schematic)")
    ax.set_title(f"Meaning negotiation — {title[:28]}", fontsize=11, fontweight="bold")
    ax.tick_params(axis="x", rotation=15)
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_scene.png"
    fig_scene_flow(p1, short, seed)
    p2 = fig_dir / "figB_ritual.png"
    fig_ritual_chain(p2, short, seed)
    p3 = fig_dir / "figC_negotiate.png"
    fig_negotiate(p3, short, seed)
    return [
        ("그림 A. 상호작용 장면 흐름", p1),
        ("그림 B. 상호작용 의례 사슬(도식)", p2),
        ("그림 C. 의미협상 과정(도식)", p3),
    ]
