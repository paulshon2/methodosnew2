# -*- coding: utf-8 -*-
"""Feature/parameter coding tables for Forecasting–System stage ③ (N/A qualitative)."""
from __future__ import annotations


def feature_codebook(topic: dict) -> list[list[str]]:
    akey = topic.get("analysis_key", "")
    rows = [
        ["이름", "역할", "정의/단위", "출처"],
        ["y_target", "타깃", topic.get("target", ""), "관측/시뮬출력"],
        ["t", "시간인덱스", "일/주/월/tick", "캘린더·시뮬시계"],
        ["x_features", "예측인자", "공변량·상태·로그피처", "데이터사전"],
    ]
    if akey.startswith(("bd_",)):
        rows += [
            ["stock_*", "스톡", "수준변수", "SD 다이어그램"],
            ["flow_*", "플로", "변화율", "SD"],
            ["delay", "파라미터", "정보/물류 지연", "문헌·교정"],
        ]
    elif akey.startswith(("as_", "abm_")):
        rows += [
            ["agent_id", "에이전트", "개별 행위자", "초기화"],
            ["rule_*", "행동규칙", "이동·상호작용", "모형명세"],
            ["seed", "난수시드", "정수", "재현"],
        ]
    elif akey.startswith("ld_"):
        rows += [
            ["id", "개체", "학생/환자/기업", "패널키"],
            ["wave", "조사파", "1..T", "종단"],
            ["time_c", "시간코딩", "0 시작 중심화", "성장모형"],
        ]
    else:
        rows += [
            ["lag_y", "피처", "과거 y", "시계열"],
            ["season", "피처", "계절더미/푸리에", "캘린더"],
            ["exog", "외생", "기온·캠페인 등", "외부"],
        ]
    rows.append(["split", "메타", "train/val/test", "전처리"])
    return rows


def coding_proc_na(topic: dict, method_name: str) -> list[str]:
    return [
        "【해당없음】질적 개방·주제코딩은 수행하지 않는다(아키타입 규정).",
        f"【대체】모형 입력 변수·피처·스톡/플로·에이전트 속성을 명명·정의한다. 주제 「{topic['title']}」.",
        f"【코드북】역할(타깃/피처/파라미터)과 단위를 표로 고정. ({method_name})",
        "【QC】이름 충돌·단위 혼용·미래정보 누수 변수를 점검한다.",
    ]


def metrics_rows(seed: int, kind: str = "forecast") -> list[list[str]]:
    rmse = 1.2 + (seed % 20) / 10
    mae = 0.9 + (seed % 15) / 10
    if kind == "class":
        return [
            ["모형", "Accuracy", "AUC", "F1", "셋"],
            ["기저(로지스틱)", f"{0.72 + seed/2000:.3f}", f"{0.70:.2f}", f"{0.68:.2f}", "test"],
            ["RF/GBM", f"{0.78 + seed/2500:.3f}", f"{0.81:.2f}", f"{0.76:.2f}", "test"],
            ["선택모형", f"{0.79 + seed/3000:.3f}", f"{0.82:.2f}", f"{0.77:.2f}", "test"],
        ]
    if kind == "sim":
        return [
            ["시나리오", "출력지표", "기준런", "민감±10%", "판정"],
            ["Base", topic_safe_metric(seed), f"{100 + seed % 30}", f"{100 + seed % 30}±", "기준"],
            ["정책A", "동일지표", f"{90 + seed % 20}", "변화", "개선"],
            ["정책B", "동일지표", f"{110 + seed % 15}", "변화", "악화/중립"],
        ]
    return [
        ["모형", "RMSE", "MAE", "MAPE%", "셋"],
        ["나이브/기저", f"{rmse + 0.4:.2f}", f"{mae + 0.3:.2f}", f"{12 + seed % 5}", "test"],
        ["주모형", f"{rmse:.2f}", f"{mae:.2f}", f"{8 + seed % 4}", "test"],
        ["앙상블(선택)", f"{rmse - 0.1:.2f}", f"{mae - 0.05:.2f}", f"{7 + seed % 3}", "test"],
    ]


def topic_safe_metric(seed: int) -> str:
    return ["감염정점", "분리지수", "재고진동폭", "협력률", "통행시간"][seed % 5]
