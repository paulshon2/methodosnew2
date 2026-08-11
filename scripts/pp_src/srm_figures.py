# -*- coding: utf-8 -*-
"""Figures for Survey Research Method DOCX."""
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


def fig_flow(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.2, 2.8))
    steps = ["모집단·표본", "설문·예비", "본조사", "정제·α", "검정", "보고"]
    ax.barh(steps[::-1], [1] * 6, color="#2E5090")
    ax.set_xticks([])
    ax.set_title(f"Survey workflow — {title[:30]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_desc(out: Path, title: str, seed: int):
    labs = ["예측", "결과", "통제A", "통제B"]
    vals = [3.4, 3.1, 2.8, 3.0]
    vals[seed % 4] += 0.3
    err = [0.12, 0.15, 0.10, 0.11]
    fig, ax = plt.subplots(figsize=(5.4, 3.2))
    ax.bar(labs, vals, yerr=err, color="#4C72B0", capsize=4)
    ax.set_ylim(1, 5)
    ax.set_ylabel("mean (1–5)")
    ax.set_title(f"Descriptives — {title[:30]}", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def fig_scatter(out: Path, title: str, seed: int):
    rng = np.random.RandomState(seed)
    x = rng.normal(3.2, 0.7, 80)
    y = 0.45 * x + rng.normal(0, 0.5, 80) + 1.5
    fig, ax = plt.subplots(figsize=(5.4, 3.4))
    ax.scatter(x, y, alpha=0.55, c="#2E5090")
    b, a = np.polyfit(x, y, 1)
    xs = np.linspace(x.min(), x.max(), 50)
    ax.plot(xs, a + b * xs, c="#C44E52", lw=2)
    ax.set_xlabel("predictor")
    ax.set_ylabel("outcome")
    ax.set_title(f"Association — {title[:28]}", fontsize=11, fontweight="bold")
    ax.grid(alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_flow.png"
    fig_flow(p1, short, seed)
    p2 = fig_dir / "figB_desc.png"
    fig_desc(p2, short, seed)
    p3 = fig_dir / "figC_assoc.png"
    fig_scatter(p3, short, seed)
    return [
        ("그림 A. 조사연구 절차 흐름", p1),
        ("그림 B. 주요 변수 기술통계(도식)", p2),
        ("그림 C. 예측–결과 연관(도식)", p3),
    ]
