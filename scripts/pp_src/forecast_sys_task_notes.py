# -*- coding: utf-8 -*-
"""Step annotations for Forecasting–System Modeling DOCX."""
from __future__ import annotations

import re

TERM_HINTS: list[tuple[str, str]] = [
    (r"시계열|time series", "「시계열」은 시간 순으로 이어진 자료입니다. 순서를 섞으면 예측이 틀어집니다."),
    (r"패널|종단|longitudinal", "「패널·종단」은 같은 대상을 여러 시점에 반복 측정한 자료입니다."),
    (r"시뮬레이션|ABM|행위자|시스템다이내믹스|SD", "「시뮬레이션」은 규칙을 넣어 컴퓨터로 시스템을 흉내 내는 것입니다. ABM은 개인, SD는 피드백 루프 중심입니다."),
    (r"결측|보간|이상치", "「결측 보간」은 빈칸을 채우고, 「이상치」는 유난히 튀는 값을 점검·처리하는 일입니다."),
    (r"정규화|스케일|표준화", "「스케일링」은 변수 단위를 맞춰 학습·최적화가 한쪽에 치우치지 않게 합니다."),
    (r"훈련|검증|테스트|분할|leak", "「훈련/검증/테스트」로 나눕니다. 미래 정보가 과거에 섞이면(누수) 성능이 가짜로 좋아집니다."),
    (r"기저|baseline|ARIMA|회귀", "「기저모형」은 비교 기준이 되는 단순 모형입니다. 복잡한 모형은 이것보다 나아야 합니다."),
    (r"랜덤포레스트|머신러닝|GBM|Prophet", "「머신러닝 예측모형」은 자료에서 패턴을 학습해 미래·미지수 값을 예측합니다."),
    (r"RMSE|MAE|정확도|교차검증", "「RMSE·MAE」는 예측 오차 크기, 「교차검증」은 데이터를 나눠 번갈아 성능을 확인하는 방법입니다."),
    (r"민감도|최적모형|적합도", "「민감도」는 가정·파라미터를 바꿔도 결론이 비슷한지 보는 점검입니다."),
    (r"코딩|해당없음", "이 아키타입의 ③코딩은 질적 코딩이 아닙니다. 변수·피처·파라미터 정의만 문서화합니다."),
]


def _terms(text: str) -> list[str]:
    found, seen = [], set()
    for pat, expl in TERM_HINTS:
        if re.search(pat, text, re.I):
            k = expl[:40]
            if k not in seen:
                seen.add(k)
                found.append(expl)
    return found


STEP_NOTE_BANK: dict[tuple[int, int], list[str]] = {
    (0, 0): [
        "【자료형】시계열·패널·시뮬레이션 입력 중 무엇을 쓰는지 확정합니다.",
        "【기간·단위】관측 빈도(일/주/월)와 예측 지평을 적습니다.",
        "【출처】공공통계·로그·설문·파라미터 문헌을 로그로 남깁니다.",
        "【재현】원자료 버전·다운로드일을 고정합니다.",
    ],
    (0, 1): [
        "【변수정의】타깃·예측인자·외생변수·시뮬 파라미터를 조작적으로 정의합니다.",
        "【소스】관측자료 vs 교정(calibration) 파라미터를 구분합니다.",
        "【단위·결측코드】측정단위와 결측 코드를 코드북에 적습니다.",
    ],
    (1, 0): [
        "【결측】시계열은 보간·전후값, 패널은 다중대체 등 규칙을 정합니다.",
        "【이상치】도메인 불가능값·급변을 표시하고 제거/윈저화합니다.",
        "【보고】처리 전후 n·요약통계를 남깁니다.",
    ],
    (1, 1): [
        "【스케일】z-score, min-max, log 중 모형에 맞는 변환을 선택합니다.",
        "【누수금지】스케일러는 훈련셋에만 fit 합니다.",
        "【역변환】보고 시 원래 단위로 되돌리는 절차를 적습니다.",
    ],
    (1, 2): [
        "【분할】시계열은 시간순 hold-out, 패널은 개체/시간 누수를 막습니다.",
        "【비율】예: 70/15/15 또는 walk-forward.",
        "【시뮬】ABM/SD는 난수시드·반복(run) 설계를 분할에 대응시킵니다.",
    ],
    (2, 0): [
        "【해당없음】질적 주제코딩은 수행하지 않습니다.",
        "【대체】피처·상태변수·에이전트 속성·스톡-플로 이름을 코딩(명명)합니다.",
        "【코드북】변수명·정의·단위·역할을 표로 고정합니다.",
    ],
    (3, 0): [
        "【기저】평균·나이브·회귀·ARIMA/ETS 등 단순 기준모형을 적합합니다.",
        "【목적】이후 복잡한 모형이 이길 ‘바닥’을 만듭니다.",
        "【진단】잔차·자기상관·적합도를 점검합니다.",
    ],
    (3, 1): [
        "【주모형】ML(RF/GBM 등) 또는 ABM/SD 구축.",
        "【튜닝】검증셋·교차검증으로 하이퍼파라미터/규칙 교정.",
        "【문서】알고리즘·가정·시드·소프트웨어를 명시합니다.",
    ],
    (3, 2): [
        "【지표】RMSE, MAE, MAPE, 정확도/AUC 등 과제에 맞게 선택.",
        "【CV】k-fold 또는 time-series CV.",
        "【보고】훈련·검증·테스트 성능을 분리 보고합니다.",
    ],
    (4, 0): [
        "【비교표】기저 vs 후보모형의 테스트 성능을 나란히 둡니다.",
        "【유의】작은 개선이 실질적으로 의미 있는지 판단합니다.",
        "【그래프】실측 vs 예측, 학습곡선, 시뮬 궤적을 제시합니다.",
    ],
    (4, 1): [
        "【선정】사전 기준(성능·해석·비용)으로 최적모형을 고릅니다.",
        "【민감도】파라미터·가정·표본을 바꿔 재실행합니다.",
        "【한계】외삽·구조변화·에이전트 가정 한계를 적습니다.",
    ],
    (5, 0): [
        "【산출물】예측모형·시뮬 결과·성능표·코드·데이터사전.",
        "【운영】재학습 주기·모니터링 지표를 제안합니다.",
        "【패키지】model.pkl / .mdl / NetLogo·Vensim 파일 등.",
    ],
}


def task_step_annotations(stage_i, task_i, proc_paras, analysis_key, topic, method_name=""):
    n = max(len(proc_paras), 1)
    bank = STEP_NOTE_BANK.get((stage_i, task_i), [])
    out = []
    for i in range(n):
        step = proc_paras[i] if i < len(proc_paras) else ""
        note = bank[i] if i < len(bank) else (
            f"이 단계({stage_i+1}단계·태스크 {task_i+1}의 {i+1}번째 절차)를 문서화해 재현합니다."
        )
        parts = [note]
        if i == 0 and topic.get("title"):
            parts.append(
                f"본 주제 「{topic['title']}」(자료: {topic.get('data_type','')}, "
                f"모형: {topic.get('model_family','')})에 맞춰 읽습니다."
            )
        extra = _terms(step)
        if extra:
            parts.append(" ".join(extra[:3]))
        key = analysis_key.lower()
        if i == 0:
            if key.startswith(("bd_",)) or "sd" in topic.get("model_family", "").lower():
                parts.append("비즈니스 다이내믹스/SD는 스톡·플로·피드백 루프 다이어그램을 반드시 첨부합니다.")
            elif key.startswith(("as_", "abm_")):
                parts.append("ABM·인공사회는 에이전트 규칙·스케일·난수시드·반복 횟수를 보고합니다.")
            elif key.startswith("ld_"):
                parts.append("종단분석은 개체 내 상관·결측 패턴·시간 코딩을 전처리에서 명시합니다.")
            elif key.startswith(("pm_", "af_", "edu_")):
                parts.append("예측모형은 시간 누수 방지와 테스트셋 성능 분리가 핵심입니다.")
        out.append("\n".join(parts))
    return out
