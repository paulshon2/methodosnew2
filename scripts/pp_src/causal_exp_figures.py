# -*- coding: utf-8 -*-
"""Figures for Causal–Experimental Design DOCX."""
from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams["font.sans-serif"] = ["Malgun Gothic", "DejaVu Sans", "Arial"]
plt.rcParams["axes.unicode_minus"] = False
COLORS = ["#2E5090", "#C44E52", "#55A868", "#8172B3"]


def _save(fig, path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    fig.savefig(path, dpi=180, bbox_inches="tight")
    plt.close(fig)
    return path


def fig_balance(out: Path, title: str, seed: int):
    rng = np.random.default_rng(seed)
    labs = ["age", "female", "baseline", "income", "urban"]
    smd = rng.normal(0.05, 0.04, size=len(labs))
    fig, ax = plt.subplots(figsize=(6.0, 3.6))
    ax.axvline(0.1, color="#999", ls="--", label="|SMD|=0.1")
    ax.axvline(-0.1, color="#999", ls="--")
    ax.scatter(smd, labs, s=80, c="#2E5090", zorder=3)
    ax.set_xlabel("Standardized mean difference")
    ax.set_title(f"Covariate balance — {title[:40]}", fontsize=11, fontweight="bold")
    ax.legend(fontsize=8)
    ax.grid(axis="x", alpha=0.25)
    return _save(fig, out)


def fig_effect(out: Path, title: str, seed: int):
    est = 0.15 + (seed % 20) / 100
    lo, hi = est - 0.08, est + 0.10
    fig, ax = plt.subplots(figsize=(6.0, 2.8))
    ax.errorbar([est], [0], xerr=[[est - lo], [hi - est]], fmt="o", color="#C44E52", capsize=6, markersize=10)
    ax.axvline(0, color="#333", lw=1)
    ax.set_yticks([])
    ax.set_xlabel("Treatment effect (estimate & 95% CI)")
    ax.set_title(f"Causal estimate — {title[:40]}", fontsize=11, fontweight="bold")
    ax.set_xlim(min(-0.05, lo - 0.05), hi + 0.08)
    ax.grid(axis="x", alpha=0.25)
    return _save(fig, out)


def fig_did(out: Path, title: str, seed: int):
    rng = np.random.default_rng(seed)
    t = np.arange(-3, 5)
    treat = 2 + 0.05 * t + np.array([0 if x < 0 else 0.55 for x in t]) + rng.normal(0, 0.04, len(t))
    ctrl = 2 + 0.05 * t + rng.normal(0, 0.04, len(t))
    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    ax.plot(t, treat, "o-", label="Treated", color="#2E5090")
    ax.plot(t, ctrl, "s--", label="Control", color="#C44E52")
    ax.axvline(-0.5, color="#999", ls=":")
    ax.legend()
    ax.set_xlabel("time")
    ax.set_ylabel("outcome")
    ax.set_title(f"DiD / event-study sketch — {title[:35]}", fontsize=11, fontweight="bold")
    ax.grid(alpha=0.25)
    return _save(fig, out)


def fig_rdd(out: Path, title: str, seed: int):
    rng = np.random.default_rng(seed)
    x = np.linspace(-1, 1, 80)
    y = 0.2 * x + np.where(x >= 0, 0.45, 0) + rng.normal(0, 0.08, len(x))
    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    ax.scatter(x, y, s=12, alpha=0.6, c="#2E5090")
    ax.axvline(0, color="#C44E52", ls="--", label="cutoff")
    ax.legend()
    ax.set_xlabel("running variable (centered)")
    ax.set_ylabel("outcome")
    ax.set_title(f"RDD sketch — {title[:40]}", fontsize=11, fontweight="bold")
    ax.grid(alpha=0.25)
    return _save(fig, out)


def fig_consort(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(5.8, 4.2))
    n = 800 + seed % 400
    boxes = [
        (0.5, 0.88, f"Assessed\nn={n}"),
        (0.5, 0.66, f"Randomized\nn={n - 80}"),
        (0.25, 0.40, f"Treat\nn={(n - 80) // 2}"),
        (0.75, 0.40, f"Control\nn={(n - 80) // 2}"),
        (0.5, 0.14, f"Analyzed\nn={n - 120}"),
    ]
    for x, y, t in boxes:
        ax.text(x, y, t, transform=ax.transAxes, ha="center", va="center", fontsize=9,
                bbox=dict(boxstyle="round", fc="#dce6f5", ec="#2E5090"))
    ax.set_title(f"Flow (CONSORT-like) — {title[:35]}", fontsize=11, fontweight="bold")
    ax.axis("off")
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int) -> list[tuple[str, Path]]:
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    a = akey.lower()
    p1 = fig_dir / "figA_balance.png"
    fig_balance(p1, short, seed)
    out = [("그림 A. 공변량 균형성(SMD)", p1)]

    p2 = fig_dir / "figB_design.png"
    if "rdd" in a:
        fig_rdd(p2, short, seed)
        cap2 = "그림 B. RDD 스케치(컷오프)"
    elif "did" in a or a.endswith("_es") or "scm" in a:
        fig_did(p2, short, seed)
        cap2 = "그림 B. DiD/이벤트스터디 추세"
    elif a.startswith(("ct_", "doe_", "fe_", "ci1_po", "ci1_ate")):
        fig_consort(p2, short, seed)
        cap2 = "그림 B. 배정·분석 흐름(CONSORT형)"
    else:
        fig_did(p2, short, seed)
        cap2 = "그림 B. 처치·비교 추세 스케치"
    out.append((cap2, p2))

    p3 = fig_dir / "figC_effect.png"
    fig_effect(p3, short, seed)
    out.append(("그림 C. 처치효과 점추정·95% CI", p3))
    return out
