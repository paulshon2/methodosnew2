# -*- coding: utf-8 -*-
"""Figures for Historical–Comparative Source Archetype DOCX."""
from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams["font.sans-serif"] = ["Malgun Gothic", "DejaVu Sans", "Arial"]
plt.rcParams["axes.unicode_minus"] = False

COLORS = ["#2E5090", "#C44E52", "#55A868", "#8172B3", "#CCB974"]


def _save(fig, path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    fig.savefig(path, dpi=180, bbox_inches="tight")
    plt.close(fig)
    return path


def fig_timeline(out: Path, seed: int, title: str):
    rng = np.random.default_rng(seed)
    years = list(range(1945, 1991, 5))
    events = ["Liberation", "War", "Armistice", "April", "Coup", "Yushin", "Gwangju", "June", "Election", "Reform"]
    fig, ax = plt.subplots(figsize=(7.2, 2.8))
    ax.hlines(0, years[0], years[-1], color="#333", linewidth=1.2)
    for i, y in enumerate(years):
        ax.plot(y, 0, "o", color=COLORS[i % len(COLORS)], markersize=8)
        ax.text(y, 0.12 if i % 2 == 0 else -0.18, f"{y}\n{events[i % len(events)]}", ha="center", fontsize=7)
    ax.set_ylim(-0.45, 0.45)
    ax.axis("off")
    ax.set_title(title[:60], fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_process_trace(out: Path, seed: int, title: str):
    steps = ["Trigger", "Coalition", "Agenda", "Decision", "Outcome"]
    fig, ax = plt.subplots(figsize=(7.2, 2.6))
    xs = np.arange(len(steps))
    ax.plot(xs, np.zeros(len(steps)), "-o", color="#2E5090", linewidth=2, markersize=12)
    for i, s in enumerate(steps):
        ax.text(i, 0.15, s, ha="center", fontsize=9, fontweight="bold")
        ax.text(i, -0.22, f"E{i+1}", ha="center", fontsize=8, color="#C44E52")
    ax.set_ylim(-0.5, 0.5)
    ax.axis("off")
    ax.set_title(title[:60], fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_event_freq(out: Path, seed: int, title: str):
    rng = np.random.default_rng(seed)
    years = np.arange(1980, 1991)
    counts = rng.integers(2, 18, size=len(years))
    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    ax.bar(years, counts, color="#2E5090", edgecolor="white")
    ax.set_xlabel("Year")
    ax.set_ylabel("Event count (coded)")
    ax.set_title(title[:60], fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def fig_compare_bars(out: Path, seed: int, title: str):
    labels = ["Case A", "Case B", "Case C"]
    vals = [3.2, 4.1, 2.7]
    fig, ax = plt.subplots(figsize=(5.8, 3.6))
    ax.bar(labels, vals, color=COLORS[:3], edgecolor="#333")
    ax.set_ylabel("Index (illustrative)")
    ax.set_title(title[:60], fontsize=11, fontweight="bold")
    ax.set_ylim(0, 5)
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def fig_growth_curve(out: Path, seed: int, title: str):
    years = np.arange(1900, 2001, 10)
    y = 10 * (1.35 ** ((years - 1900) / 10))
    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    ax.plot(years, y, "-o", color="#2E5090")
    ax.set_xlabel("Year")
    ax.set_ylabel("Publications (index)")
    ax.set_title(title[:60], fontsize=11, fontweight="bold")
    ax.grid(alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int) -> list[tuple[str, Path]]:
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    a = akey.lower()
    out: list[tuple[str, Path]] = []
    p1 = fig_dir / "figA_timeline.png"
    fig_timeline(p1, seed, f"Timeline — {short}")
    out.append(("그림 A. 연대기(Chronology) 타임라인", p1))

    p2 = fig_dir / "figB_main.png"
    if a.startswith("pt_") or "process" in a:
        fig_process_trace(p2, seed, f"Process tracing — {short}")
        cap = "그림 B. 과정추적 인과기제 도식"
    elif a.startswith("lsb_"):
        fig_growth_curve(p2, seed, f"Growth — {short}")
        cap = "그림 B. 문헌·규모 성장곡선(보조)"
    elif a.startswith("comp") or a.startswith("cha"):
        fig_compare_bars(p2, seed, f"Comparison — {short}")
        cap = "그림 B. 사례 간 비교 지표(예시)"
    else:
        fig_event_freq(p2, seed + 1, f"Event frequency — {short}")
        cap = "그림 B. 사건 빈도(보조 기초통계)"
    out.append((cap, p2))
    return out
