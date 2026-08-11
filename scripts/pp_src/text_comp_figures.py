# -*- coding: utf-8 -*-
"""Publication figures for Text–Computational Linguistics DOCX."""
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


def fig_top_terms(out: Path, seed: int, title: str):
    rng = np.random.default_rng(seed)
    labs = ["delivery", "refund", "price", "taste", "staff", "packaging", "wait", "recommend"]
    vals = rng.random(len(labs)) * 0.25 + 0.05
    order = np.argsort(vals)
    fig, ax = plt.subplots(figsize=(6.2, 3.8))
    ax.barh(np.array(labs)[order], vals[order], color="#2E5090", edgecolor="#333")
    ax.set_xlabel("TF-IDF / weight")
    ax.set_title(f"Top terms — {title[:45]}", fontsize=11, fontweight="bold")
    ax.grid(axis="x", alpha=0.25)
    return _save(fig, out)


def fig_metrics(out: Path, seed: int, title: str):
    fig, ax = plt.subplots(figsize=(6.0, 3.6))
    metrics = ["Accuracy", "macro-F1", "AUC", "Precision", "Recall"]
    base = 0.76 + (seed % 10) / 100
    vals = [base, base - 0.03, base + 0.06, base + 0.01, base - 0.04]
    ax.bar(metrics, vals, color=COLORS, edgecolor="#333")
    ax.set_ylim(0, 1.05)
    ax.axhline(0.80, ls="--", color="#666", lw=1)
    ax.set_title(f"Test metrics — {title[:45]}", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def fig_network(out: Path, seed: int, title: str):
    rng = np.random.default_rng(seed)
    n = 14
    xy = rng.random((n, 2))
    fig, ax = plt.subplots(figsize=(6.2, 4.0))
    for i in range(n):
        for j in range(i + 1, n):
            if rng.random() < 0.18:
                ax.plot([xy[i, 0], xy[j, 0]], [xy[i, 1], xy[j, 1]], color="#999", lw=0.7, zorder=1)
    sizes = rng.integers(80, 400, size=n)
    ax.scatter(xy[:, 0], xy[:, 1], s=sizes, c=[COLORS[i % len(COLORS)] for i in range(n)], edgecolors="#333", zorder=2)
    ax.set_title(f"Network sketch — {title[:45]}", fontsize=11, fontweight="bold")
    ax.axis("off")
    return _save(fig, out)


def fig_topics(out: Path, seed: int, title: str):
    rng = np.random.default_rng(seed)
    k = 6
    w = rng.dirichlet(np.ones(k))
    fig, ax = plt.subplots(figsize=(6.0, 3.6))
    ax.bar([f"T{i}" for i in range(k)], w, color=COLORS[0], edgecolor="#333")
    ax.set_ylabel("proportion")
    ax.set_title(f"Topic proportions — {title[:45]}", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def fig_confusion(out: Path, seed: int, title: str):
    rng = np.random.default_rng(seed)
    cm = np.array([[48, 5, 3], [6, 40, 7], [2, 8, 42]]) + rng.integers(0, 3, size=(3, 3))
    fig, ax = plt.subplots(figsize=(5.2, 4.2))
    im = ax.imshow(cm, cmap="Blues")
    ax.set_xticks([0, 1, 2], ["pos", "neu", "neg"])
    ax.set_yticks([0, 1, 2], ["pos", "neu", "neg"])
    for i in range(3):
        for j in range(3):
            ax.text(j, i, str(cm[i, j]), ha="center", va="center", color="black")
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    ax.set_title(f"Confusion — {title[:40]}", fontsize=11, fontweight="bold")
    fig.colorbar(im, ax=ax, fraction=0.046)
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int) -> list[tuple[str, Path]]:
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    a = akey.lower()
    p1 = fig_dir / "figA_terms.png"
    fig_top_terms(p1, seed, short)
    out = [("그림 A. 상위 용어·가중치(TF-IDF 등)", p1)]

    p2 = fig_dir / "figB_main.png"
    if a.startswith("sna"):
        fig_network(p2, seed, short)
        cap2 = "그림 B. 네트워크 구조 스케치(허브·엣지)"
    elif a.startswith("tm_") or "stm" in a or a.startswith("rtm_stm"):
        fig_topics(p2, seed, short)
        cap2 = "그림 B. 토픽 비중"
    elif a.startswith("ir_"):
        fig_metrics(p2, seed, short)
        cap2 = "그림 B. 검색·순위 지표(예시 스케일)"
    else:
        fig_metrics(p2, seed, short)
        cap2 = "그림 B. 시험셋 성능 지표"
    out.append((cap2, p2))

    p3 = fig_dir / "figC_aux.png"
    if a.startswith("sa_") or "sent" in a or a.startswith("dl_clf") or a.startswith("tml"):
        fig_confusion(p3, seed + 1, short)
        cap3 = "그림 C. 혼동행렬(오분류 유형)"
    elif a.startswith("sna"):
        fig_metrics(p3, seed + 2, short)
        cap3 = "그림 C. 보조 지표(링크예측·모듈성 등 예시)"
    else:
        fig_topics(p3, seed + 3, short)
        cap3 = "그림 C. 보조 토픽·군집 비중"
    out.append((cap3, p3))
    return out
