# -*- coding: utf-8 -*-
"""Figures for Epidemiology Research DOCX."""
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


def fig_design(out: Path, title: str, mode: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.0, 2.6))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 3)
    ax.axis("off")
    if "환자" in mode:
        boxes = [("Cases", 1.0, "#C44E52"), ("Controls", 5.5, "#4C72B0")]
        sub = "Case–control"
    elif "단면" in mode:
        boxes = [("Sample (t0)", 3.5, "#55A868")]
        sub = "Cross-sectional"
        ax.text(5.0, 2.2, "Exposure & Outcome at same time", ha="center", fontsize=9)
    else:
        boxes = [("Exposure", 0.8, "#4C72B0"), ("Follow-up", 4.0, "#888"), ("Outcome", 7.0, "#C44E52")]
        sub = "Cohort (follow-up)"
        ax.annotate("", xy=(3.8, 1.4), xytext=(2.9, 1.4),
                    arrowprops=dict(arrowstyle="->", color="#333"))
        ax.annotate("", xy=(6.8, 1.4), xytext=(5.9, 1.4),
                    arrowprops=dict(arrowstyle="->", color="#333"))
    for lab, x, c in boxes:
        ax.add_patch(plt.Rectangle((x, 0.8), 2.4, 1.2, fill=True, color=c, alpha=0.85))
        ax.text(x + 1.2, 1.4, lab, ha="center", va="center", color="white", fontweight="bold", fontsize=10)
    ax.set_title(f"{sub} — {title[:26]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_rr_or(out: Path, title: str, seed: int, use_or: bool):
    labs = ["Crude", "Adj-1", "Adj-2", "StratumA", "StratumB"]
    est = np.array([1.55, 1.42, 1.38, 1.70, 1.15]) + (seed % 5) * 0.02
    lo = est - 0.18
    hi = est + 0.22
    fig, ax = plt.subplots(figsize=(5.6, 3.4))
    y = np.arange(len(labs))
    ax.errorbar(est, y, xerr=[est - lo, hi - est], fmt="o", color="#4C72B0", capsize=3)
    ax.axvline(1.0, color="#C44E52", ls="--")
    ax.set_yticks(y)
    ax.set_yticklabels(labs)
    ax.set_xlabel("OR" if use_or else "RR / HR (schematic)")
    ax.set_title(f"Association estimates — {title[:24]}", fontsize=11, fontweight="bold")
    ax.grid(axis="x", alpha=0.25)
    return _save(fig, out)


def fig_km(out: Path, title: str, seed: int):
    t = np.linspace(0, 60, 61)
    s0 = np.exp(-0.012 * t)
    s1 = np.exp(-0.008 * t) - (seed % 3) * 0.01
    fig, ax = plt.subplots(figsize=(5.4, 3.2))
    ax.step(t, s0, where="post", label="Unexposed / Ref", color="#C44E52")
    ax.step(t, np.clip(s1, 0.4, 1), where="post", label="Exposed / Interv", color="#4C72B0")
    ax.set_xlabel("months")
    ax.set_ylabel("survival (schematic)")
    ax.set_ylim(0.4, 1.05)
    ax.legend(fontsize=8)
    ax.set_title(f"Survival / follow-up — {title[:24]}", fontsize=11, fontweight="bold")
    ax.grid(alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, mode: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    use_or = "환자" in mode or "단면" in mode
    p1 = fig_dir / "figA_design.png"
    fig_design(p1, short, mode, seed)
    p2 = fig_dir / "figB_assoc.png"
    fig_rr_or(p2, short, seed, use_or)
    p3 = fig_dir / "figC_surv.png"
    fig_km(p3, short, seed)
    return [
        ("그림 A. 역학 연구설계 도식", p1),
        ("그림 B. RR/OR/HR 추정치(도식)", p2),
        ("그림 C. 추적·생존 곡선(도식)", p3),
    ]
