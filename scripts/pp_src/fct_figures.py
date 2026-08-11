# -*- coding: utf-8 -*-
"""Figures for Foucauldian–Critical Theory DOCX."""
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


def fig_archive_timeline(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.2, 3.0))
    years = [1995, 2005, 2015, 2020, 2025]
    labels = ["규정A", "개정", "지침", "디지털화", "현재"]
    y = [1, 1.2, 0.9, 1.1, 1.0]
    y[seed % 5] += 0.15
    ax.plot(years, y, "-o", color="#2E5090", linewidth=2)
    for x, yy, lab in zip(years, y, labels):
        ax.annotate(lab, (x, yy), textcoords="offset points", xytext=(0, 8), ha="center", fontsize=8)
    ax.set_ylim(0.6, 1.6)
    ax.set_xlabel("year")
    ax.set_yticks([])
    ax.set_title(f"Genealogical archive — {title[:30]}", fontsize=11, fontweight="bold")
    ax.grid(axis="x", alpha=0.25)
    return _save(fig, out)


def fig_apparatus_map(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(5.8, 4.2))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.axis("off")
    nodes = [
        (5, 6.5, "담론", "#4C72B0"),
        (2, 3.5, "제도", "#55A868"),
        (8, 3.5, "물질/기술", "#C44E52"),
        (5, 1.8, "주체화", "#8172B2"),
    ]
    for x, y, lab, c in nodes:
        ax.scatter(x, y, s=900, c=c)
        ax.text(x, y, lab, ha="center", va="center", color="white", fontsize=9, fontweight="bold")
    for a, b in [(0, 1), (0, 2), (1, 3), (2, 3), (0, 3)]:
        ax.plot([nodes[a][0], nodes[b][0]], [nodes[a][1], nodes[b][1]], c="#666", lw=1.2)
    ax.set_title(f"Dispositif map — {title[:30]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_rupture_cont(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(5.6, 3.2))
    cats = ["연속", "변형", "단절", "잔존"]
    vals = [8, 6, 4, 5]
    vals[seed % 4] += 2
    ax.bar(cats, vals, color=["#2E5090", "#55A868", "#C44E52", "#CCB974"])
    ax.set_ylabel("analytic weight (schematic)")
    ax.set_title(f"Rupture / continuity — {title[:28]}", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_timeline.png"
    fig_archive_timeline(p1, short, seed)
    p2 = fig_dir / "figB_apparatus.png"
    fig_apparatus_map(p2, short, seed)
    p3 = fig_dir / "figC_rupture.png"
    fig_rupture_cont(p3, short, seed)
    return [
        ("그림 A. 계보학적 아카이브 연표", p1),
        ("그림 B. 장치(dispositif) 맵", p2),
        ("그림 C. 역사적 단절·연속 가중(도식)", p3),
    ]
