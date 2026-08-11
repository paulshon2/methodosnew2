# -*- coding: utf-8 -*-
"""Publication-style figures for DOCX embed (matplotlib)."""
from __future__ import annotations

import re

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

try:
    plt.rcParams["font.family"] = "Malgun Gothic"
except Exception:
    pass
plt.rcParams["axes.unicode_minus"] = False
# Fallback: avoid missing-glyph warnings in headless export
plt.rcParams["font.sans-serif"] = ["Malgun Gothic", "DejaVu Sans", "Arial"]

COLORS = ["#2E5090", "#C44E52", "#55A868", "#8172B3", "#CCB974"]


def _save(fig, path: Path, caption_seed: int) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    fig.savefig(path, dpi=180, bbox_inches="tight")
    plt.close(fig)
    return path


def fig_group_bar(out: Path, seed: int, title: str, labels: list[str], means: list[float], ylabel: str = "평균 점수"):
    rng = np.random.default_rng(seed)
    se = [0.08 + rng.random() * 0.06 for _ in means]
    fig, ax = plt.subplots(figsize=(6, 3.8))
    x = np.arange(len(labels))
    ax.bar(x, means, yerr=se, capsize=4, color=COLORS[: len(labels)], edgecolor="#333", linewidth=0.6)
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.set_ylabel(ylabel)
    ax.set_title(title, fontsize=11, fontweight="bold")
    ax.set_ylim(0, max(means) + 0.8)
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out, seed)


def fig_histogram(out: Path, seed: int, title: str):
    rng = np.random.default_rng(seed)
    data = rng.normal(3.45, 0.75, 400)
    data = np.clip(data, 1, 5)
    fig, ax = plt.subplots(figsize=(6, 3.8))
    ax.hist(data, bins=15, color="#2E5090", edgecolor="white", alpha=0.85)
    ax.axvline(data.mean(), color="#C44E52", linestyle="--", linewidth=1.5, label=f"M={data.mean():.2f}")
    ax.set_xlabel("Score")
    ax.set_ylabel("Frequency")
    ax.set_title(title, fontsize=11, fontweight="bold")
    ax.legend()
    return _save(fig, out, seed)


def fig_scatter_reg(out: Path, seed: int, title: str):
    rng = np.random.default_rng(seed)
    x = rng.uniform(0, 10, 120)
    y = 1.2 + 0.35 * x + rng.normal(0, 1.2, 120)
    fig, ax = plt.subplots(figsize=(6, 3.8))
    ax.scatter(x, y, alpha=0.55, s=28, color="#2E5090", edgecolors="white", linewidths=0.3)
    coef = np.polyfit(x, y, 1)
    xs = np.linspace(x.min(), x.max(), 50)
    ax.plot(xs, coef[0] * xs + coef[1], color="#C44E52", linewidth=2, label=f"OLS: y={coef[0]:.2f}x+{coef[1]:.2f}")
    ax.set_xlabel("독립변수 (예: 교육·투입)")
    ax.set_ylabel("종속변수 (예: 성과)")
    ax.set_title(title, fontsize=11, fontweight="bold")
    ax.legend(loc="upper left", fontsize=9)
    ax.grid(alpha=0.2)
    return _save(fig, out, seed)


def fig_anova_plot(out: Path, seed: int, title: str):
    labels = ["Group A", "Group B", "Group C"]
    means = [3.12, 3.48, 3.91]
    return fig_group_bar(out, seed, title, labels, means)


def fig_cluster_profiles(out: Path, seed: int, title: str):
    labels = ["Cluster 1", "Cluster 2", "Cluster 3", "Cluster 4"]
    means = [2.81, 3.45, 3.92, 4.21]
    return fig_group_bar(out, seed, title, labels, means)


def fig_sem_path(out: Path, seed: int, title: str):
    fig, ax = plt.subplots(figsize=(6.5, 3.2))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 4)
    ax.axis("off")
    boxes = [(1, 2, "Quality"), (4.5, 2, "Satisfaction"), (8, 2, "Loyalty")]
    for x, y, t in boxes:
        ax.add_patch(plt.Rectangle((x - 0.9, y - 0.4), 1.8, 0.8, fill=True, facecolor="#E8EEF7", edgecolor="#2E5090"))
        ax.text(x, y, t, ha="center", va="center", fontsize=10, fontweight="bold")
    ax.annotate("", xy=(3.4, 2), xytext=(1.9, 2), arrowprops=dict(arrowstyle="->", lw=1.8, color="#C44E52"))
    ax.text(2.65, 2.35, "b=.62***", fontsize=9)
    ax.annotate("", xy=(7.1, 2), xytext=(5.4, 2), arrowprops=dict(arrowstyle="->", lw=1.8, color="#C44E52"))
    ax.text(6.25, 2.35, "b=.48***", fontsize=9)
    ax.set_title(title, fontsize=11, fontweight="bold", pad=12)
    return _save(fig, out, seed)


def fig_forest(out: Path, seed: int, title: str):
    rng = np.random.default_rng(seed)
    studies = [f"Study {i+1}" for i in range(8)]
    g = rng.normal(0.35, 0.12, 8)
    lo = g - 0.15
    hi = g + 0.15
    fig, ax = plt.subplots(figsize=(6, 4))
    y = np.arange(len(studies))
    ax.errorbar(g, y, xerr=[g - lo, hi - g], fmt="o", color="#2E5090", ecolor="#555", capsize=3)
    ax.axvline(0, color="#999", linestyle="--", linewidth=1)
    ax.axvline(g.mean(), color="#C44E52", linestyle="-", linewidth=1.2, label=f"Pooled g={g.mean():.2f}")
    ax.set_yticks(y)
    ax.set_yticklabels(studies, fontsize=8)
    ax.set_xlabel("Hedges g (95% CI)")
    ax.set_title(title, fontsize=11, fontweight="bold")
    ax.legend(fontsize=8)
    return _save(fig, out, seed)


def fig_line_longitudinal(out: Path, seed: int, title: str):
    waves = ["Wave 1", "Wave 2", "Wave 3"]
    means = [3.05, 2.82, 2.61]
    se = [0.09, 0.08, 0.1]
    fig, ax = plt.subplots(figsize=(6, 3.8))
    ax.errorbar(waves, means, yerr=se, marker="o", markersize=8, linewidth=2, color="#2E5090", capsize=4)
    ax.set_ylabel("Outcome score")
    ax.set_title(title, fontsize=11, fontweight="bold")
    ax.grid(alpha=0.25)
    return _save(fig, out, seed)


def figures_for_analysis(akey: str, topic_title: str, fig_dir: Path, seed: int) -> list[tuple[str, Path]]:
    slug = re.sub(r"[^\w\s-]", "", topic_title.split(":")[0])[:40] or "Topic"
    out: list[tuple[str, Path]] = []

    def p(name: str) -> Path:
        return fig_dir / f"{name}.png"

    cap_ko = topic_title.split(":")[0].strip()[:36]

    out.append(
        (
            f"그림 A. {cap_ko} — 종속·핵심 변수 분포",
            fig_histogram(p("fig_hist"), seed, "Fig. A Score distribution"),
        )
    )

    if akey in ("spss_ttest", "ttest"):
        out.append(
            (
                "그림 B. 집단별 평균 비교 (t검정)",
                fig_group_bar(p("fig_ttest"), seed + 1, "Fig. B Group means (t-test)", ["Male", "Female"], [3.28, 3.52]),
            )
        )
    elif akey in ("spss_anova", "anova", "factorial_anova", "ancova", "rct"):
        out.append(("그림 B. 집단별 평균 (ANOVA)", fig_anova_plot(p("fig_anova"), seed + 1, "Fig. B Group means (ANOVA)")))
    elif akey in ("spss_regression", "ols", "regression", "mr", "bayes_reg"):
        out.append(
            (
                "그림 B. 회귀 산점도 및 적합선",
                fig_scatter_reg(p("fig_reg"), seed + 1, "Fig. B Regression fit"),
            )
        )
    elif akey in ("cluster_kmeans", "cluster_hierarchical", "cluster_two_step", "lpa", "lca"):
        out.append(("그림 B. 군집별 프로파일", fig_cluster_profiles(p("fig_clu"), seed + 1, "Fig. B Cluster profiles")))
    elif akey in ("sem_path", "cfa", "lavaan_sem", "sem_mediation"):
        out.append(("그림 B. SEM 경로도", fig_sem_path(p("fig_sem"), seed + 1, "Fig. B SEM path diagram")))
    elif akey in ("meta", "meta_sr"):
        out.append(("그림 B. Forest plot", fig_forest(p("fig_forest"), seed + 1, "Fig. B Forest plot")))
    elif akey in ("longitudinal", "repeated_anova", "lgm", "growth"):
        out.append(("그림 B. 종단 변화", fig_line_longitudinal(p("fig_long"), seed + 1, "Fig. B Longitudinal means")))
    else:
        out.append(
            (
                "그림 B. 주요 결과 요약",
                fig_group_bar(p("fig_main"), seed + 1, "Fig. B Key results", ["Sub1", "Sub2", "Total"], [3.2, 3.5, 3.42]),
            )
        )
    return out
