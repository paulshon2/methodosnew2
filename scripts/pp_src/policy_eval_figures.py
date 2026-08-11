# -*- coding: utf-8 -*-
"""Figures for Policy–Program Evaluation DOCX."""
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


def fig_weights(out: Path, title: str, seed: int):
    rng = np.random.default_rng(seed)
    crit = ["Effect", "Equity", "Feasib.", "Cost", "Accept."]
    w = rng.dirichlet(np.ones(len(crit)))
    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    ax.bar(crit, w, color=COLORS, edgecolor="#333")
    ax.set_ylabel("weight (sum=1)")
    ax.set_ylim(0, max(w) + 0.15)
    ax.set_title(f"Criteria weights — {title[:40]}", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def fig_ranking(out: Path, title: str, seed: int):
    rng = np.random.default_rng(seed)
    alts = ["A1", "A2", "A3", "A4"]
    scores = np.sort(rng.random(4))[::-1]
    scores = scores / scores.sum() * 0.95
    fig, ax = plt.subplots(figsize=(6.0, 3.6))
    ax.barh(alts[::-1], scores[::-1], color="#8172B3", edgecolor="#333")
    ax.set_xlabel("priority score")
    ax.set_title(f"Alternative ranking — {title[:40]}", fontsize=11, fontweight="bold")
    ax.grid(axis="x", alpha=0.25)
    return _save(fig, out)


def fig_delphi(out: Path, title: str):
    rounds = [1, 2, 3]
    fig, ax = plt.subplots(figsize=(6.0, 3.6))
    ax.plot(rounds, [1.4, 0.9, 0.55], "o-", color="#2E5090", label="IQR")
    ax.plot(rounds, [1.0, 0.7, 0.45], "s--", color="#C44E52", label="SD")
    ax.set_xlabel("Delphi round")
    ax.set_ylabel("dispersion")
    ax.legend()
    ax.set_title(f"Consensus trajectory — {title[:40]}", fontsize=11, fontweight="bold")
    ax.grid(alpha=0.25)
    return _save(fig, out)


def fig_cba(out: Path, title: str):
    fig, ax = plt.subplots(figsize=(5.6, 3.6))
    ax.bar(["PV Cost", "PV Benefit"], [100, 135], color=["#C44E52", "#55A868"], edgecolor="#333")
    ax.set_ylabel("index")
    ax.set_title(f"CBA (BCR~1.35) — {title[:35]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_impact(out: Path, title: str, seed: int):
    rng = np.random.default_rng(seed)
    t = np.arange(-3, 5)
    treat = 2 + 0.1 * t + np.array([0 if x < 0 else 0.8 for x in t]) + rng.normal(0, 0.05, size=len(t))
    ctrl = 2 + 0.1 * t + rng.normal(0, 0.05, size=len(t))
    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    ax.plot(t, treat, "o-", label="Treated", color="#2E5090")
    ax.plot(t, ctrl, "s--", label="Comparison", color="#C44E52")
    ax.axvline(-0.5, color="#999", ls=":")
    ax.legend()
    ax.set_xlabel("time")
    ax.set_ylabel("outcome (index)")
    ax.set_title(f"Impact sketch (DiD-like) — {title[:35]}", fontsize=11, fontweight="bold")
    ax.grid(alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int) -> list[tuple[str, Path]]:
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    a = akey.lower()
    p1 = fig_dir / "figA_weights.png"
    fig_weights(p1, short, seed)
    out = [("그림 A. 평가기준 가중치(또는 중요도)", p1)]

    p2 = fig_dir / "figB_main.png"
    if a.startswith("delphi"):
        fig_delphi(p2, short)
        cap2 = "그림 B. 델파이 라운드별 합의(분산 감소)"
    elif a.startswith("cba"):
        fig_cba(p2, short)
        cap2 = "그림 B. 비용·편익(현재가치) 비교"
    elif a.startswith("ie_"):
        fig_impact(p2, short, seed)
        cap2 = "그림 B. 영향평가 추세 스케치"
    else:
        fig_ranking(p2, short, seed)
        cap2 = "그림 B. 대안 우선순위"
    out.append((cap2, p2))

    p3 = fig_dir / "figC_rank.png"
    fig_ranking(p3, short, seed + 3)
    out.append(("그림 C. 민감도·대안점수(보조)", p3))
    return out
