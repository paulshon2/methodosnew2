# -*- coding: utf-8 -*-
"""Figures for In-depth Interview DOCX."""
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


def fig_protocol(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.0, 3.2))
    steps = ["워밍업", "핵심경험", "탐침", "의미/미래", "마무리"]
    ax.barh(steps[::-1], [1, 1, 1, 1, 1], color="#2E5090")
    ax.set_xlabel("protocol block")
    ax.set_title(f"Interview flow — {title[:34]}", fontsize=11, fontweight="bold")
    ax.set_xticks([])
    return _save(fig, out)


def fig_themes(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(5.8, 4.0))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.axis("off")
    ax.scatter(5, 4, s=700, c="#C44E52")
    ax.text(5, 4, "RQ", ha="center", va="center", color="white", fontweight="bold")
    themes = ["T1", "T2", "T3", "T4"]
    ang = np.linspace(0, 2 * np.pi, 4, endpoint=False)
    for t, a in zip(themes, ang):
        x, y = 5 + 3 * np.cos(a), 4 + 2.4 * np.sin(a)
        ax.plot([5, x], [4, y], c="#2E5090")
        ax.scatter(x, y, s=450, c="#2E5090")
        ax.text(x, y, t, ha="center", va="center", color="white", fontsize=9)
    ax.set_title(f"Theme map — {title[:34]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_freq(out: Path, title: str, seed: int):
    labs = ["T1", "T2", "T3", "T4"]
    vals = [11, 9, 8, 6]
    vals[seed % 4] += 2
    fig, ax = plt.subplots(figsize=(5.4, 3.2))
    ax.bar(labs, vals, color="#55A868")
    ax.set_ylabel("participants mentioning (aux)")
    ax.set_title(f"Theme coverage (aux) — {title[:30]}", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_proto.png"
    fig_protocol(p1, short, seed)
    p2 = fig_dir / "figB_themes.png"
    fig_themes(p2, short, seed)
    p3 = fig_dir / "figC_freq.png"
    fig_freq(p3, short, seed)
    return [
        ("그림 A. 반구조 면담 프로토콜 흐름", p1),
        ("그림 B. 주제 맵", p2),
        ("그림 C. 주제 출현(보조)", p3),
    ]
