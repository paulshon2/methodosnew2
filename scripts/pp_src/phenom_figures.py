# -*- coding: utf-8 -*-
"""Figures for Phenomenology–Lived Experience DOCX."""
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


def fig_sample_flow(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.0, 3.4))
    stages = ["목적표집", "심층면담", "epoché", "전사·정독"]
    y = [0.9, 0.65, 0.4, 0.15]
    for i, (lab, yy) in enumerate(zip(stages, y)):
        ax.text(0.2 + i * 0.2, yy, lab, transform=ax.transAxes, ha="center", fontsize=10,
                bbox=dict(boxstyle="round", fc="#dce8f5", ec="#2E5090"))
        if i < 3:
            ax.annotate("", xy=(0.32 + i * 0.2, y[i + 1] + 0.05), xytext=(0.28 + i * 0.2, yy - 0.02),
                        xycoords=ax.transAxes, arrowprops=dict(arrowstyle="->", color="#555"))
    ax.set_title(f"수집·괄호넣기 흐름 — {title[:36]}", fontsize=11, fontweight="bold")
    ax.axis("off")
    return _save(fig, out)


def fig_theme_map(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.2, 4.0))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.axis("off")
    center = (5, 4)
    ax.scatter(*center, s=800, c="#C44E52", zorder=3)
    ax.text(5, 4, "본질", ha="center", va="center", color="white", fontweight="bold")
    themes = ["몸", "시간", "낯섦", "관계", "초점"]
    angles = np.linspace(0, 2 * np.pi, len(themes), endpoint=False)
    for lab, ang in zip(themes, angles):
        x, y = 5 + 3 * np.cos(ang), 4 + 2.5 * np.sin(ang)
        ax.plot([5, x], [4, y], c="#2E5090", lw=1.5, alpha=0.7)
        ax.scatter(x, y, s=500, c="#2E5090", zorder=3)
        ax.text(x, y, lab, ha="center", va="center", color="white", fontsize=9)
    ax.set_title(f"주제→본질 구조 — {title[:36]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_textural_structural(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.0, 3.6))
    ax.barh([1, 0], [6 + seed % 3, 5 + seed % 2], color=["#55A868", "#8172B3"], height=0.5)
    ax.set_yticks([1, 0])
    ax.set_yticklabels(["직물적(결·느낌)", "구조적(조건·뼈대)"])
    ax.set_xlabel("서술 비중(예시 스케일)")
    ax.set_title(f"직물적·구조적 기술 — {title[:36]}", fontsize=11, fontweight="bold")
    ax.set_xlim(0, 10)
    ax.grid(axis="x", alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int) -> list[tuple[str, Path]]:
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_flow.png"
    fig_sample_flow(p1, short, seed)
    p2 = fig_dir / "figB_themes.png"
    fig_theme_map(p2, short, seed)
    p3 = fig_dir / "figC_tex_str.png"
    fig_textural_structural(p3, short, seed)
    return [
        ("그림 A. 목적표집·면담·판단중지 흐름", p1),
        ("그림 B. 주제 군집과 본질 구조", p2),
        ("그림 C. 직물적·구조적 기술 균형", p3),
    ]
