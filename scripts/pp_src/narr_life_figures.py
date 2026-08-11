# -*- coding: utf-8 -*-
"""Figures for Narrative–Life History DOCX."""
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


def fig_timeline(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.4, 2.8))
    xs = [0, 1, 2, 3, 4]
    labs = ["유년", "전환", "위기", "재구성", "현재"]
    ax.plot(xs, [0] * 5, "o-", color="#2E5090", ms=10)
    for x, lab in zip(xs, labs):
        ax.text(x, 0.08, lab, ha="center", fontsize=9)
    ax.set_ylim(-0.3, 0.4)
    ax.axis("off")
    ax.set_title(f"Chronology sketch — {title[:34]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_structure(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.2, 3.2))
    stages = ["시작", "전개", "절정", "결말"]
    y = [0.2, 0.55, 1.0, 0.4]
    ax.fill_between(range(4), y, color="#2E5090", alpha=0.25)
    ax.plot(range(4), y, "o-", color="#C44E52", ms=8)
    ax.set_xticks(range(4))
    ax.set_xticklabels(stages)
    ax.set_ylabel("서사 긴장(스케치)")
    ax.set_title(f"Narrative arc — {title[:34]}", fontsize=11, fontweight="bold")
    ax.grid(alpha=0.25)
    return _save(fig, out)


def fig_types(out: Path, title: str, seed: int):
    labs = ["회복", "저항", "생존", "유예"]
    vals = [3, 2, 2, 1]
    vals[seed % 4] += 1
    fig, ax = plt.subplots(figsize=(5.6, 3.4))
    ax.bar(labs, vals, color="#55A868")
    ax.set_ylabel("참여자 수(예시)")
    ax.set_title(f"Narrative types — {title[:34]}", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_time.png"
    fig_timeline(p1, short, seed)
    p2 = fig_dir / "figB_arc.png"
    fig_structure(p2, short, seed)
    p3 = fig_dir / "figC_types.png"
    fig_types(p3, short, seed)
    return [
        ("그림 A. 생애 연대기 스케치", p1),
        ("그림 B. 서사구조(시작–절정–결말)", p2),
        ("그림 C. 내러티브 유형 분포(예시)", p3),
    ]
