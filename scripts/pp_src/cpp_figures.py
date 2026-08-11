# -*- coding: utf-8 -*-
"""Figures for Comparative Politics–Pattern Analysis DOCX."""
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
    fig, ax = plt.subplots(figsize=(6.2, 3.0))
    years = [1987, 1997, 2004, 2012, 2020]
    y = [1, 1.2, 0.9, 1.3, 1.1]
    y[seed % 5] += 0.2
    ax.plot(years, y, "-o", color="#2E5090", lw=2)
    for x, yy, lab in zip(years, y, ["이행", "개혁", "위기", "재편", "현재"]):
        ax.annotate(lab, (x, yy), textcoords="offset points", xytext=(0, 8), ha="center", fontsize=8)
    ax.set_ylim(0.5, 1.8)
    ax.set_yticks([])
    ax.set_xlabel("year")
    ax.set_title(f"Comparative chronology — {title[:28]}", fontsize=11, fontweight="bold")
    ax.grid(axis="x", alpha=0.25)
    return _save(fig, out)


def fig_pattern_matrix(out: Path, title: str, seed: int):
    data = np.array([[3, 1, 2], [2, 3, 1], [1, 2, 3], [2, 1, 2]], dtype=float)
    data[seed % 4, seed % 3] += 1
    fig, ax = plt.subplots(figsize=(5.2, 3.6))
    im = ax.imshow(data, cmap="Blues", vmin=0, vmax=4)
    ax.set_xticks([0, 1, 2])
    ax.set_xticklabels(["CaseA", "CaseB", "CaseC"])
    ax.set_yticks([0, 1, 2, 3])
    ax.set_yticklabels(["Inst.", "Coal.", "Crisis", "Reform"])
    ax.set_title(f"Pattern matrix — {title[:28]}", fontsize=11, fontweight="bold")
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    return _save(fig, out)


def fig_props(out: Path, title: str, seed: int):
    labs = ["P1", "P2", "P3"]
    vals = [8, 6, 7]
    vals[seed % 3] += 2
    fig, ax = plt.subplots(figsize=(5.2, 3.0))
    ax.bar(labs, vals, color=["#4C72B0", "#55A868", "#C44E52"])
    ax.set_ylabel("support weight (schematic)")
    ax.set_title(f"Comparative propositions — {title[:26]}", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_chrono.png"
    fig_timeline(p1, short, seed)
    p2 = fig_dir / "figB_matrix.png"
    fig_pattern_matrix(p2, short, seed)
    p3 = fig_dir / "figC_prop.png"
    fig_props(p3, short, seed)
    return [
        ("그림 A. 비교 연대기(도식)", p1),
        ("그림 B. 사례×범주 패턴 행렬", p2),
        ("그림 C. 비교명제 지지(도식)", p3),
    ]
