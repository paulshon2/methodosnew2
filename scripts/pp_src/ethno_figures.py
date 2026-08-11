# -*- coding: utf-8 -*-
"""Figures for Ethnography–Participant Observation DOCX."""
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


def fig_site_map(out: Path, title: str):
    fig, ax = plt.subplots(figsize=(6.2, 4.0))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    rects = [
        (1, 5, 3, 2, "Entrance", COLORS[0]),
        (5, 5, 4, 2, "Main floor", COLORS[1]),
        (1, 1.5, 3, 2.5, "Break", COLORS[2]),
        (5, 1.5, 4, 2.5, "Backstage", COLORS[3]),
    ]
    for x, y, w, h, lab, c in rects:
        ax.add_patch(plt.Rectangle((x, y), w, h, fill=True, color=c, alpha=0.35, ec="#333"))
        ax.text(x + w / 2, y + h / 2, lab, ha="center", va="center", fontsize=9, fontweight="bold")
    ax.annotate("", xy=(4.2, 6), xytext=(2.5, 6), arrowprops=dict(arrowstyle="->", color="#333"))
    ax.set_title(title[:55], fontsize=11, fontweight="bold")
    ax.axis("off")
    return _save(fig, out)


def fig_theme_network(out: Path, title: str):
    fig, ax = plt.subplots(figsize=(6.2, 4.0))
    nodes = {
        "Official\nrule": (2, 6),
        "Tacit\nnorm": (8, 6),
        "Space": (2, 2),
        "Hierarchy": (8, 2),
        "Rapport": (5, 4),
    }
    edges = [("Official\nrule", "Tacit\nnorm"), ("Space", "Hierarchy"), ("Rapport", "Tacit\nnorm"), ("Rapport", "Space")]
    for a, b in edges:
        ax.plot([nodes[a][0], nodes[b][0]], [nodes[a][1], nodes[b][1]], color="#888", lw=1.5)
    for i, (lab, (x, y)) in enumerate(nodes.items()):
        ax.scatter([x], [y], s=800, c=COLORS[i % len(COLORS)], zorder=3, edgecolors="#333")
        ax.text(x, y, lab, ha="center", va="center", fontsize=7, color="white", fontweight="bold")
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.axis("off")
    ax.set_title(title[:55], fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_activity_freq(out: Path, seed: int, title: str):
    rng = np.random.default_rng(seed)
    labels = ["Greet", "Handoff", "Rule-talk", "Joke", "Silence"]
    vals = rng.integers(5, 25, size=len(labels))
    fig, ax = plt.subplots(figsize=(6.0, 3.6))
    ax.bar(labels, vals, color=COLORS[:5], edgecolor="#333")
    ax.set_ylabel("Coded scenes (n)")
    ax.set_title(title[:55], fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int) -> list[tuple[str, Path]]:
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_sitemap.png"
    fig_site_map(p1, f"Field sketch — {short}")
    p2 = fig_dir / "figB_themes.png"
    if akey.startswith("meta_"):
        fig_theme_network(p2, f"Synthesis map — {short}")
        cap_b = "그림 B. 메타민족지 주제·번역 연결도"
    else:
        fig_theme_network(p2, f"Concept links — {short}")
        cap_b = "그림 B. 개념·패턴 관계도"
    p3 = fig_dir / "figC_freq.png"
    fig_activity_freq(p3, seed, f"Activity codes — {short}")
    return [
        ("그림 A. 현장 스케치맵(공간·동선)", p1),
        (cap_b, p2),
        ("그림 C. 기술코드 장면 빈도(보조)", p3),
    ]
