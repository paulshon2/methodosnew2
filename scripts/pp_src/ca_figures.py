# -*- coding: utf-8 -*-
"""Figures for Conversation Analysis DOCX."""
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


def fig_recording(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.0, 2.8))
    t = np.linspace(0, 10, 400)
    wave = np.sin(2 * np.pi * (1.2 + 0.05 * (seed % 5)) * t) * np.exp(-0.02 * t)
    ax.plot(t, wave, color="#2E5090", lw=1.2)
    ax.axvspan(3.2, 3.8, color="#C44E52", alpha=0.25, label="overlap")
    ax.axvspan(6.0, 6.6, color="#CCB974", alpha=0.35, label="gap")
    ax.set_yticks([])
    ax.set_xlabel("time (s, schematic)")
    ax.set_title(f"Recording timeline — {title[:30]}", fontsize=11, fontweight="bold")
    ax.legend(loc="upper right", fontsize=8)
    return _save(fig, out)


def fig_sequence(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.0, 3.2))
    steps = ["FPP", "SPP", "expansion", "closing"]
    ax.barh(steps[::-1], [1, 1, 1, 1], color=["#4C72B0", "#55A868", "#8172B2", "#CCB974"])
    ax.set_xticks([])
    ax.set_title(f"Sequence skeleton — {title[:30]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_rules(out: Path, title: str, seed: int):
    labs = ["turn", "pair", "repair", "preference"]
    vals = [8, 7, 6, 7]
    vals[seed % 4] += 2
    fig, ax = plt.subplots(figsize=(5.4, 3.2))
    ax.bar(labs, vals, color="#2E5090")
    ax.set_ylabel("analytic weight (schematic)")
    ax.set_title(f"Interaction rules — {title[:28]}", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_rec.png"
    fig_recording(p1, short, seed)
    p2 = fig_dir / "figB_seq.png"
    fig_sequence(p2, short, seed)
    p3 = fig_dir / "figC_rules.png"
    fig_rules(p3, short, seed)
    return [
        ("그림 A. 녹화·중첩·침묵 타임라인(도식)", p1),
        ("그림 B. 시퀀스 골격(FPP–SPP)", p2),
        ("그림 C. 상호작용 규칙 가중(도식)", p3),
    ]
