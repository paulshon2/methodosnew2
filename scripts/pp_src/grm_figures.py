# -*- coding: utf-8 -*-
"""Figures for General Methodology DOCX."""
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


def fig_pipeline(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.4, 2.4))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 3)
    ax.axis("off")
    steps = ["Strategy", "Plan", "Prep", "Code", "Analyze", "Guide"]
    colors = ["#4C72B0", "#55A868", "#64B5CD", "#8172B2", "#C44E52", "#CCB974"]
    for i, (lab, c) in enumerate(zip(steps, colors)):
        x = 0.3 + i * 2.0
        ax.add_patch(plt.Rectangle((x, 0.9), 1.6, 1.1, fill=True, color=c, alpha=0.9))
        ax.text(x + 0.8, 1.45, lab, ha="center", va="center", color="white", fontsize=8, fontweight="bold")
        if i < len(steps) - 1:
            ax.annotate("", xy=(x + 1.85, 1.45), xytext=(x + 1.65, 1.45),
                        arrowprops=dict(arrowstyle="->", color="#555"))
    ax.set_title(f"Methodology pipeline — {title[:26]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_strategy(out: Path, title: str, mode: str, seed: int):
    labs = ["Literature", "Interview", "Survey", "Secondary"]
    vals = np.array([0.7, 0.5, 0.6, 0.3], dtype=float)
    if "면담" in mode and "설문" not in mode:
        vals = np.array([0.6, 0.95, 0.2, 0.2])
    elif "2차" in mode or "양적" in mode:
        vals = np.array([0.7, 0.15, 0.35, 0.9])
    elif "설문+면담" in mode or "혼합" in mode:
        vals = np.array([0.5, 0.75, 0.85, 0.25])
    else:
        vals = np.array([0.65, 0.35, 0.9, 0.3])
    vals[seed % 4] = min(1.0, vals[seed % 4] + 0.05)
    fig, ax = plt.subplots(figsize=(5.4, 3.2))
    ax.bar(labs, vals, color="#4C72B0")
    ax.set_ylim(0, 1.1)
    ax.set_ylabel("relative weight (schematic)")
    ax.set_title(f"Data strategy mix — {title[:26]}", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    plt.setp(ax.get_xticklabels(), rotation=15, ha="right")
    return _save(fig, out)


def fig_checklist(out: Path, title: str, seed: int):
    items = ["RQ align", "Ethics", "Sampling", "Instruments", "Analysis", "Report"]
    done = [1, 1, 1, 1, 0.7, 0.5]
    done[seed % 6] = 1.0
    fig, ax = plt.subplots(figsize=(5.4, 3.2))
    ax.barh(items[::-1], done[::-1], color="#55A868")
    ax.set_xlim(0, 1.1)
    ax.set_xlabel("completeness (schematic)")
    ax.set_title(f"Methodology checklist — {title[:24]}", fontsize=11, fontweight="bold")
    ax.grid(axis="x", alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, mode: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_pipe.png"
    fig_pipeline(p1, short, seed)
    p2 = fig_dir / "figB_strat.png"
    fig_strategy(p2, short, mode, seed)
    p3 = fig_dir / "figC_check.png"
    fig_checklist(p3, short, seed)
    return [
        ("그림 A. 연구방법론 절차 파이프라인", p1),
        ("그림 B. 자료수집 전략 비중(도식)", p2),
        ("그림 C. 방법론 지침 체크리스트(도식)", p3),
    ]
