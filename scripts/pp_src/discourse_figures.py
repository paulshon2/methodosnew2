# -*- coding: utf-8 -*-
"""Figures for Discourse–Critical Discourse DOCX."""
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


def fig_strategy(out: Path, title: str, seed: int):
    labs = ["정당화", "타자화", "책임전가", "결속", "기타"]
    vals = np.array([28, 24, 18, 16, 14]) + (seed % 4)
    fig, ax = plt.subplots(figsize=(5.8, 3.4))
    ax.bar(labs, vals, color="#2E5090")
    ax.set_ylabel("coded instances (example)")
    ax.set_title(f"Discourse strategies — {title[:32]}", fontsize=11, fontweight="bold")
    ax.tick_params(axis="x", rotation=15)
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def fig_layers(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.0, 3.6))
    layers = ["텍스트 징후", "담화전략", "담론실천", "사회·권력"]
    y = [0.8, 0.6, 0.4, 0.2]
    for lab, yy in zip(layers, y):
        ax.text(0.5, yy, lab, transform=ax.transAxes, ha="center", fontsize=10,
                bbox=dict(boxstyle="round", fc="#f5e6dc", ec="#C44E52"))
    ax.annotate("", xy=(0.5, 0.28), xytext=(0.5, 0.72), xycoords=ax.transAxes,
                arrowprops=dict(arrowstyle="->", color="#555"))
    ax.axis("off")
    ax.set_title(f"CDA interpretive layers — {title[:30]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_colloc(out: Path, title: str, seed: int):
    words = ["불가피", "그들", "우리", "당연히", "책임"]
    freq = [40 + seed % 10, 35, 30, 22, 18]
    fig, ax = plt.subplots(figsize=(5.6, 3.4))
    ax.barh(words[::-1], freq[::-1], color="#55A868")
    ax.set_xlabel("frequency (aux)")
    ax.set_title(f"Key lemmas (aux) — {title[:32]}", fontsize=11, fontweight="bold")
    ax.grid(axis="x", alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_strat.png"
    fig_strategy(p1, short, seed)
    p2 = fig_dir / "figB_layers.png"
    fig_layers(p2, short, seed)
    p3 = fig_dir / "figC_freq.png"
    fig_colloc(p3, short, seed)
    return [
        ("그림 A. 담화전략 범주 분포(예시)", p1),
        ("그림 B. 텍스트–전략–사회 해석 층위", p2),
        ("그림 C. 핵심어 빈도(보조)", p3),
    ]
