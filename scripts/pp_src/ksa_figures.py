# -*- coding: utf-8 -*-
"""Figures for Keyword Salience Analysis DOCX."""
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


def fig_corpus(out: Path, title: str, seed: int):
    fig, ax = plt.subplots(figsize=(5.4, 3.0))
    labs = ["Target", "Reference"]
    sizes = [0.8 + (seed % 5) * 0.05, 2.0 + (seed % 4) * 0.1]
    ax.bar(labs, sizes, color=["#4C72B0", "#55A868"])
    ax.set_ylabel("tokens (M, schematic)")
    ax.set_title(f"Corpus sizes — {title[:28]}", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def fig_keyness(out: Path, title: str, seed: int):
    words = ["전환", "위기", "책임", "성장", "대기", "현안"]
    ll = np.array([86, 72, 61, 48, 39, 28], dtype=float)
    ll[seed % 6] += 8
    order = np.argsort(ll)
    fig, ax = plt.subplots(figsize=(5.6, 3.4))
    ax.barh([words[i] for i in order], ll[order], color="#4C72B0")
    ax.axvline(15.13, color="#C44E52", ls="--", label="LL~15.13 (p<.001)")
    ax.set_xlabel("Log-likelihood (schematic)")
    ax.set_title(f"Keyword keyness — {title[:26]}", fontsize=11, fontweight="bold")
    ax.legend(fontsize=8)
    ax.grid(axis="x", alpha=0.25)
    return _save(fig, out)


def fig_effect(out: Path, title: str, seed: int):
    words = ["W1", "W2", "W3", "W4", "W5"]
    pct = np.array([180, 95, 60, 40, -25], dtype=float)
    pct[seed % 5] += 15
    colors = ["#55A868" if v >= 0 else "#C44E52" for v in pct]
    fig, ax = plt.subplots(figsize=(5.4, 3.2))
    ax.bar(words, pct, color=colors)
    ax.axhline(0, color="#333", lw=0.8)
    ax.set_ylabel("%DIFF (schematic)")
    ax.set_title(f"Effect size — {title[:28]}", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int):
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    p1 = fig_dir / "figA_corpus.png"
    fig_corpus(p1, short, seed)
    p2 = fig_dir / "figB_keyness.png"
    fig_keyness(p2, short, seed)
    p3 = fig_dir / "figC_effect.png"
    fig_effect(p3, short, seed)
    return [
        ("그림 A. 대상·참조 코퍼스 규모(도식)", p1),
        ("그림 B. 키워드 keyness(LL) 상위어", p2),
        ("그림 C. 효과크기(%DIFF) 도식", p3),
    ]
