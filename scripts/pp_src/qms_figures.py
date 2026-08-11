# -*- coding: utf-8 -*-
"""Figures for Qualitative Meta-Synthesis DOCX."""
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


def fig_prisma(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(5.8, 4.0))
    ax.axis("off")
    boxes = [
        (0.35, 0.82, f"식별 n={800+seed%200}"),
        (0.35, 0.62, f"선별 n={120+seed%40}"),
        (0.35, 0.42, f"적격 n={40+seed%15}"),
        (0.35, 0.22, f"포함 n={18+seed%10}"),
    ]
    for x, y, lab in boxes:
        ax.add_patch(plt.Rectangle((x, y), 0.3, 0.12, fill=True, color="#2E5090", transform=ax.transAxes))
        ax.text(x + 0.15, y + 0.06, lab, ha="center", va="center", color="white", fontsize=9, transform=ax.transAxes)
        if y > 0.22:
            ax.annotate(
                "",
                xy=(x + 0.15, y - 0.02),
                xytext=(x + 0.15, y),
                xycoords=ax.transAxes,
                textcoords=ax.transAxes,
                arrowprops=dict(arrowstyle="->", color="#333"),
            )
    ax.set_title(f"Selection flow — {title[:30]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_translation(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(5.8, 3.6))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis("off")
    ax.add_patch(plt.Circle((2.5, 3.5), 1.2, color="#4C72B0", alpha=0.85))
    ax.add_patch(plt.Circle((7.5, 3.5), 1.2, color="#55A868", alpha=0.85))
    ax.text(2.5, 3.5, "Study A\nconcepts", ha="center", va="center", color="white", fontsize=8)
    ax.text(7.5, 3.5, "Study B\nconcepts", ha="center", va="center", color="white", fontsize=8)
    ax.annotate("", xy=(6.2, 3.5), xytext=(3.8, 3.5), arrowprops=dict(arrowstyle="<->", color="#C44E52", lw=2))
    ax.text(5, 4.6, "translation", ha="center", color="#C44E52", fontweight="bold")
    ax.set_title(f"Reciprocal translation — {title[:28]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_loa(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(5.8, 3.4))
    themes = ["T1", "T2", "T3", "T4"]
    ax.barh(themes[::-1], [1, 1, 1, 1], color="#8172B2")
    ax.axvline(0.5, color="#C44E52", lw=2)
    ax.text(0.52, 3.2, "line of argument", color="#C44E52", fontsize=9, fontweight="bold")
    ax.set_xticks([])
    ax.set_title(f"Themes → LoA — {title[:30]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_prisma.png"
    fig_prisma(p1, short, seed)
    p2 = fig_dir / "figB_trans.png"
    fig_translation(p2, short, seed)
    p3 = fig_dir / "figC_loa.png"
    fig_loa(p3, short, seed)
    return [
        ("그림 A. 문헌 선별 흐름(도식)", p1),
        ("그림 B. 상호번역(translation) 도식", p2),
        ("그림 C. 주제→논증선(line of argument)", p3),
    ]
