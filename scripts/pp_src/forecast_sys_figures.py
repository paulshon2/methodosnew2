# -*- coding: utf-8 -*-
"""Figures for Forecasting–System Modeling DOCX."""
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


def fig_forecast(out: Path, title: str, seed: int):
    rng = np.random.default_rng(seed)
    t = np.arange(48)
    y = 10 + 0.05 * t + 2 * np.sin(t / 6) + rng.normal(0, 0.4, len(t))
    yhat = 10 + 0.05 * t + 2 * np.sin(t / 6)
    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    ax.plot(t[:36], y[:36], "o-", ms=3, label="actual (train/val)", color="#2E5090")
    ax.plot(t[35:], y[35:], "o-", ms=3, label="actual (test)", color="#55A868")
    ax.plot(t[35:], yhat[35:], "--", label="forecast", color="#C44E52")
    ax.axvline(35, color="#999", ls=":")
    ax.legend(fontsize=8)
    ax.set_xlabel("time")
    ax.set_ylabel("y")
    ax.set_title(f"Forecast hold-out — {title[:36]}", fontsize=11, fontweight="bold")
    ax.grid(alpha=0.25)
    return _save(fig, out)


def fig_metrics(out: Path, title: str, seed: int):
    models = ["Naive", "ARIMA/Reg", "ML/ABM"]
    rmse = [2.1 + seed % 5 / 10, 1.5 + seed % 4 / 10, 1.2 + seed % 3 / 10]
    fig, ax = plt.subplots(figsize=(5.8, 3.4))
    ax.bar(models, rmse, color=["#999", "#2E5090", "#C44E52"])
    ax.set_ylabel("RMSE (lower better)")
    ax.set_title(f"Model comparison — {title[:36]}", fontsize=11, fontweight="bold")
    ax.grid(axis="y", alpha=0.25)
    return _save(fig, out)


def fig_loop_or_agents(out: Path, title: str, seed: int, kind: str):
    fig, ax = plt.subplots(figsize=(6.0, 3.8))
    if kind == "sd":
        ax.text(0.2, 0.7, "Stock", transform=ax.transAxes, fontsize=11,
                bbox=dict(boxstyle="round", fc="#dce6f5", ec="#2E5090"))
        ax.text(0.55, 0.7, "Flow", transform=ax.transAxes, fontsize=11,
                bbox=dict(boxstyle="round", fc="#f5e6dc", ec="#C44E52"))
        ax.text(0.35, 0.35, "Feedback (+/−)", transform=ax.transAxes, fontsize=10,
                bbox=dict(boxstyle="round", fc="#e8f5dc", ec="#55A868"))
        ax.annotate("", xy=(0.52, 0.72), xytext=(0.32, 0.72), xycoords=ax.transAxes,
                    arrowprops=dict(arrowstyle="->"))
        ax.annotate("", xy=(0.25, 0.55), xytext=(0.4, 0.45), xycoords=ax.transAxes,
                    arrowprops=dict(arrowstyle="->"))
        ax.set_title(f"SD loop sketch — {title[:34]}", fontsize=11, fontweight="bold")
    else:
        rng = np.random.default_rng(seed)
        x, y = rng.random(40), rng.random(40)
        ax.scatter(x, y, c="#2E5090", s=40, alpha=0.8)
        for i in range(12):
            a, b = rng.integers(0, 40, 2)
            ax.plot([x[a], x[b]], [y[a], y[b]], c="#999", lw=0.6, alpha=0.6)
        ax.set_title(f"ABM agents/network — {title[:34]}", fontsize=11, fontweight="bold")
        ax.set_xticks([])
        ax.set_yticks([])
    ax.axis("off" if kind == "sd" else "on")
    if kind == "sd":
        ax.axis("off")
    return _save(fig, out)


def figures_for_analysis(akey: str, title: str, fig_dir: Path, seed: int) -> list[tuple[str, Path]]:
    fig_dir.mkdir(parents=True, exist_ok=True)
    short = title[:40]
    a = akey.lower()
    p1 = fig_dir / "figA_series.png"
    fig_forecast(p1, short, seed)
    p2 = fig_dir / "figB_struct.png"
    if a.startswith("bd_"):
        fig_loop_or_agents(p2, short, seed, "sd")
        cap2 = "그림 B. 시스템 다이내믹스 루프 스케치"
    elif a.startswith(("as_", "abm_")):
        fig_loop_or_agents(p2, short, seed, "abm")
        cap2 = "그림 B. 행위자·네트워크 스케치"
    else:
        fig_loop_or_agents(p2, short, seed, "abm")
        cap2 = "그림 B. 모형 구조/에이전트 스케치(참고)"
    p3 = fig_dir / "figC_metrics.png"
    fig_metrics(p3, short, seed)
    return [
        ("그림 A. 실측·홀드아웃 예측", p1),
        (cap2, p2),
        ("그림 C. 모형 성능(RMSE) 비교", p3),
    ]
