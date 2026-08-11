# -*- coding: utf-8 -*-
"""Figures for Qualitative Design–Naturalistic DOCX."""
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


def fig_design_align(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(6.2, 3.4))
    boxes = ["연구질문", "설계전통", "자료전략", "표집논리", "신뢰성계획"]
    y = 0.5
    for i, b in enumerate(boxes):
        ax.add_patch(
            plt.Rectangle((i * 1.15, y), 1.0, 0.7, fill=True, color="#2E5090", alpha=0.9)
        )
        ax.text(i * 1.15 + 0.5, y + 0.35, b, ha="center", va="center", color="white", fontsize=9)
        if i < len(boxes) - 1:
            ax.annotate(
                "",
                xy=((i + 1) * 1.15, y + 0.35),
                xytext=(i * 1.15 + 1.0, y + 0.35),
                arrowprops=dict(arrowstyle="->", color="#333"),
            )
    ax.set_xlim(-0.2, 6.0)
    ax.set_ylim(0, 1.8)
    ax.axis("off")
    ax.set_title(f"Design alignment — {title[:32]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def fig_trust_radar(out: Path, title: str, seed: int):
    labels = ["신뢰성", "전이가능성", "확증가능성", "의존가능성"]
    vals = [0.75 + (seed % 5) * 0.03, 0.68, 0.72, 0.70]
    vals = vals + vals[:1]
    ang = np.linspace(0, 2 * np.pi, len(labels), endpoint=False).tolist() + [0]
    fig, ax = plt.subplots(figsize=(5.2, 4.2), subplot_kw=dict(polar=True))
    ax.plot(ang, vals, c="#2E5090", linewidth=2)
    ax.fill(ang, vals, c="#2E5090", alpha=0.25)
    ax.set_xticks(ang[:-1])
    ax.set_xticklabels(labels, fontsize=9)
    ax.set_ylim(0, 1)
    ax.set_title(f"Trustworthiness — {title[:28]}", fontsize=11, fontweight="bold", pad=16)
    return _save(fig, out)


def fig_code_flow(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(5.8, 3.2))
    steps = ["자료", "코딩전략", "동료검토", "해석기준", "설계지침"]
    ax.barh(steps[::-1], [1, 1, 1, 1, 1], color=["#4C72B0", "#55A868", "#C44E52", "#8172B2", "#CCB974"][::1])
    ax.set_xlabel("procedural flow")
    ax.set_xticks([])
    ax.set_title(f"From coding to guideline — {title[:28]}", fontsize=11, fontweight="bold")
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_design.png"
    fig_design_align(p1, short, seed)
    p2 = fig_dir / "figB_trust.png"
    fig_trust_radar(p2, short, seed)
    p3 = fig_dir / "figC_flow.png"
    fig_code_flow(p3, short, seed)
    return [
        ("그림 A. 연구질문–설계–자료–표집–신뢰성 정렬", p1),
        ("그림 B. 신뢰성(trustworthiness) 기준 프로파일", p2),
        ("그림 C. 코딩→동료검토→설계지침 흐름", p3),
    ]
