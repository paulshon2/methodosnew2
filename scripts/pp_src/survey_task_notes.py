# -*- coding: utf-8 -*-
"""Plain-language annotations (■ 각테스크별 주석) — one block per procedure step."""
from __future__ import annotations

import re
from typing import Any

# ---------------------------------------------------------------------------
# Term explanations (plain language; triggered when term appears in step text)
# ---------------------------------------------------------------------------
TERM_HINTS: list[tuple[str, str]] = [
    (r"모집단", "「모집단」은 연구 결과를 적용하고 싶은 ‘전체 대상’입니다. 예를 들어 ‘전국 성인’처럼 범위를 글로 정해 두면, 나중에 ‘누구에게 말하는 연구인지’가 분명해집니다."),
    (r"operationalize|조작적", "「조작적 정의」는 추상적인 개념(예: 만족)을 실제로 재는 방법(설문 문항·점수)으로 바꾸는 일입니다. 같은 단어를 써도 측정 방법이 다르면 숫자의 뜻이 달라질 수 있습니다."),
    (r"표본|표집|sample", "「표본」은 전체(모집단) 중에서 실제로 조사한 사람들입니다. 표본이 너무 작거나 한쪽으로 치우치면, 전체에 대한 추측이 빗나갈 수 있어 ‘어떻게 뽑았는지’를 꼭 적습니다."),
    (r"표본틀|frame", "「표본틀」은 ‘뽑을 수 있는 이름·연락처 목록’입니다. 목록이 빠진 사람은 조사에 들어올 기회가 없으므로, 틀의 출처와 한계를 함께 적습니다."),
    (r"층|strat", "「층화표집」은 성별·연령처럼 중요한 그룹 비율을 맞추려고, 그룹별로 나눠서 뽑는 방법입니다. ‘전체와 비슷한 구성’으로 표본을 만들려는 목적이 있습니다."),
    (r"무응답|응답률|RR", "「응답률」은 초대한 사람 중 설문을 끝까지 한 비율입니다. 응답하지 않은 사람의 의견이 다를 수 있어, 응답률이 낮으면 결과 해석에 주의가 필요합니다."),
    (r"Likert|평정척도(등간형)|척도", "「평정척도(등간형) 척도」는 ‘전혀 그렇지 않다’부터 ‘매우 그렇다’까지 같은 간격의 선택지로 태도를 숫자로 바꾸는 방식입니다. 문항마다 선택지 문구가 같아야 비교가 공정합니다."),
    (r"Pilot|예비조사|pilot", "「예비조사(Pilot)」은 본조사 전에 소수에게만 해보는 연습입니다. 문장이 어렵거나 시간이 너무 길면 여기서 고칩니다."),
    (r"Cognitive interview", "「인지면접」은 응답자가 질문을 어떻게 이해하는지 듣는 짧은 대화입니다. ‘내가 의도한 뜻’과 ‘응답자가 이해한 뜻’이 같은지 확인합니다."),
    (r"IRB|동의", "「연구윤리·동의」는 조사 전에 목적·소요 시간·개인정보 사용을 알리고 참여 동의를 받는 절차입니다. 동의 없이 모은 자료는 보고서·논문에서 문제가 될 수 있습니다."),
    (r"CAWI|온라인|대면", "「조사 방식」은 대면·전화·인터넷(CAWI) 등 접촉 방법입니다. 방식에 따라 응답하는 사람의 구성이 달라질 수 있어, 방법을 결과와 함께 적습니다."),
    (r"결측|missing|MCAR|imputation", "「결측」은 비어 있는 답입니다. 아예 안 적었는지, 중간에 그만뒀는지에 따라 처리 방법이 달라집니다. MCAR 검정은 ‘빈칸이 무작위인지’를 대략 보는 도구입니다."),
    (r"이상치|outlier|winsorize", "「이상치」는 다른 사람과 너무 다른 값입니다. 오타일 수도 있고 진짜 극단값일 수도 있어, 삭제·캡(winsorize) 등 규칙을 정하고 그 규칙을 문서에 남깁니다."),
    (r"역채점|\(R\)|6-x", "「역채점」은 ‘긍정 문장’과 ‘부정 문장’이 섞일 때, 점수 방향을 맞추기 위해 일부 문항 점수를 뒤집는 것입니다(예: 5점 척도에서 1↔5)."),
    (r"하위척도|composite|척도점수", "「하위척도·종합점수」는 여러 문항을 묶어 하나의 점수로 만든 것입니다. ‘여러 질문의 평균’이 한 개념(예: 만족)을 대표한다고 가정합니다."),
    (r"Cronbach|α|알파", "「크론바흐 α(알파)」는 같은 척도 문항들이 서로 얼마나 일관되게 답해지는지 보는 지표입니다. 보통 0.70 이상이면 ‘묶어서 쓰기 괜찮다’고 많이 봅니다."),
    (r"KMO|Bartlett|타당도|신뢰도", "「신뢰도」는 측정의 안정성, 「타당도」는 정말 그 개념을 재는지입니다. KMO·바틀렛 검정은 요인분석 전에 ‘문항 묶음이 의미 있을지’ 가늠하는 절차입니다."),
    (r"코딩|codebook|더미|dummy", "「코딩」은 ‘남/여’ 같은 글자 답을 분석 프로그램용 숫자(1, 2)로 바꾸는 것입니다. 「코드북」은 숫자와 라벨의 대응표로, 나중에 표를 읽을 때 필요합니다."),
    (r"가변수화", "「가변수화」는 범주(예: 지역 이름)를 0/1 여러 칼럼(더미)으로 나누어 회귀·ANOVA에 넣기 쉽게 만드는 작업입니다."),
    (r"개방형|OE|범주코딩", "「개방형 문항」은 자유 서술입니다. 양적 분석에서는 보통 ‘몇 명이 어떤 키워드를 썼는지’처럼 단순 범주·빈도로만 옮기고, 긴 글 전체를 해석하는 질적 분석과는 구분합니다."),
    (r"기술통계|평균|표준편차|빈도|M\b|SD\b|Skew|Kurt", "「기술통계」는 데이터의 첫 요약입니다. 평균(M)은 중심, 표준편차(SD)는 퍼짐, 빈도는 ‘몇 명’인지, Skew·Kurt는 분포 모양이 한쪽으로 기울었는지 등을 숫자로 보여 줍니다."),
    (r"가중치|weight", "「가중치」는 표본이 모집단과 다르게 구성됐을 때, 각 사람의 표를 모집단 비율에 맞게 보정하는 숫자입니다. 1보다 크면 ‘이 사람을 조금 더 반영’하는 뜻입니다."),
    (r"Shapiro|정규성|Q–Q", "「정규성」은 값들이 종 모양( bell )에 가깝게 퍼져 있는지입니다. t검정·ANOVA 등은 정규성에 민감할 수 있어, Shapiro–Wilk 검정이나 Q–Q 그림으로 확인합니다."),
    (r"Levene|등분산|Welch", "「등분산」은 비교하는 집단마다 퍼짐(SD)이 비슷한지입니다. 다르면 일반 t 대신 Welch t처럼 조금 다른 공식을 씁니다."),
    (r"VIF|다중공선성|tolerance", "「VIF」는 회귀에서 설명 변수들이 서로 너무 비슷할 때(다중공선성) 숫자가 커집니다. VIF가 크면 ‘누가 진짜 영향을 주는지’ 구분이 어려워집니다."),
    (r"잔차|Durbin", "「잔차」는 모형이 예측한 값과 실제 값의 차이입니다. 잔차 그림으로 ‘예측이 체계적으로 틀리는지’·‘분산이 일정한지’를 봅니다."),
    (r"t-test|t검정|ANOVA|F\b", "「t검정」은 두 집단 평균 차이, 「ANOVA」는 세 집단 이상을 한 번에 비교합니다. F·t는 ‘차이가 우연보다 큰가’를 보는 통계량이고, p와 함께 봅니다."),
    (r"회귀|OLS|Predictor|β\b|R²", "「회귀분석」은 여러 요인이 결과 점수에 얼마나 연관되는지 선을 맞춰 보는 방법입니다. β(베타)는 표준화된 기울기, R²는 설명된 비율입니다."),
    (r"χ²|chi|Crosstab", "「카이제곱(χ²)」은 두 범주 변수(예: 학력×찬반)가 서로 독립인지, 연관이 있는지 보는 검정입니다."),
    (r"EFA|요인|eigenvalue|varimax", "「탐색적 요인분석(EFA)」은 많은 문항을 몇 개의 ‘잠재 요인’으로 묶을 수 있는지 찾는 방법입니다. eigenvalue>1 규칙은 ‘설명력이 충분한 요인만 남긴다’는 실무 기준 중 하나입니다."),
    (r"SEM|CFI|RMSEA|경로|lavaan|Amos", "「SEM(구조방정식)」은 ‘보이지 않는 개념(잠재변수)’과 ‘문항’·‘변수 간 영향’을 화살표 모형으로 동시에 봅니다. CFI·RMSEA는 ‘그림이 데이터와 잘 맞는지’ 보는 적합도 지수입니다."),
    (r"K-means|군집|Silhouette|cluster", "「K-means 군집」은 비슷한 점수를 가진 사람을 k개 그룹으로 나눕니다. Silhouette는 ‘그룹 나누기가 잘 됐는지’ 0~1로 대략 봅니다."),
    (r"Cohen|η²|효과크기|effect", "「효과크기」는 ‘유의한가(p)’와 별개로 ‘차이·관계가 실제로 얼마나 큰가’를 나타냅니다. 표본이 크면 작은 차이도 p<.05가 될 수 있어, 효과크기를 함께 적는 것이 좋습니다."),
    (r"p값|p<|유의|α=.05|Bonferroni", "「p값」은 ‘차이가 없다고 가정했을 때, 지금처럼 큰 결과가 우연히 나올 확률’입니다. α=.05는 그 확률이 5% 미만이면 ‘우연이 아닐 가능성이 크다’고 보는 관용적 기준입니다. Bonferroni는 검정을 여러 번 할 때 기준을 더 엄하게 조정합니다."),
    (r"신뢰구간|95% CI|CI\b", "「95% 신뢰구간(CI)」은 ‘진짜 값이 이 범위 안에 있을 가능성이 높다’고 말하는 구간입니다. p만보다 ‘얼마나 큰지·어느 방향인지’ 이해에 도움이 됩니다."),
    (r"meta|Hedges|I²|Random-effects", "「메타분석」은 여러 연구의 효과크기를 합쳐 전체 경향을 봅니다. I²는 ‘연구 간 차이가 얼마나 큰지’를 나타내는 지표입니다."),
    (r"logistic|OR\b|오즈", "「로지스틱 회귀」는 결과가 예/아니오일 때 쓰입니다. OR(오즈비)는 ‘기준 집단 대비 사건이 일어날 배율’을 뜻합니다."),
    (r"mediation|간접|PROCESS|bootstrap", "「매개분석」은 X→Y 관계가 Z를 거치는지 봅니다. bootstrap은 표본을 반복 재추출해 간접효과 구간을 만드는 방법입니다."),
    (r"MDS|stress|RSQ", "「QT-007(MDS)」는 ‘비슷한 것끼리 가깝게’ 2D·3D 지도를 만듭니다. stress는 ‘지도가 원래 거리 관계를 얼마나 잘 지키는지’ 낮을수록 좋습니다."),
    (r"panel|고정효과|FE|cluster SE", "「패널·고정효과(FE)」는 같은 대상을 여러 번 관측할 때, 개인별 고유 특성을 통제하며 변화만 비교합니다. cluster SE는 ‘같은 사람끼리 오차가 달라질 수 있음’을 반영한 표준오차입니다."),
    (r"Abstract|재현|syntax|audit", "「초록(Abstract)」은 연구 한 줄 요약, 「재현 패키지」는 데이터·코드·표·그림을 묶어 다른 사람이 같은 분석을 다시 할 수 있게 한 것입니다. audit trail은 ‘무엇을 언제 바꿨는지’ 기록입니다."),
]


def _terms_from_step(step_text: str) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()
    for pattern, expl in TERM_HINTS:
        if re.search(pattern, step_text, re.I):
            key = expl[:40]
            if key not in seen:
                seen.add(key)
                found.append(expl)
    return found


def _pad_notes(notes: list[str], n: int, stage_i: int, task_i: int, proc_paras: list[str], analysis_key: str) -> list[str]:
    out = list(notes)
    while len(out) < n:
        idx = len(out)
        text = proc_paras[idx] if idx < len(proc_paras) else ""
        out.append(_fallback_step(stage_i, task_i, idx, text, analysis_key))
    return out[:n]


def _fallback_step(stage_i: int, task_i: int, step_i: int, step_text: str, analysis_key: str) -> str:
    terms = _terms_from_step(step_text)
    head = (
        f"이 단계({stage_i + 1}단계·태스크 {task_i + 1}의 {step_i + 1}번째 절차)에서는 위에 적힌 문장·표에 나온 작업을 그대로 수행합니다. "
        "아래는 그 절차 안에 등장하는 말과 숫자가 무엇을 뜻하는지 풀어 쓴 설명입니다."
    )
    if not terms:
        terms = [
            "「입력·출력」: 이전 단계에서 만든 파일(예: 설문 raw data)을 받아, 이 단계 결과물(표·로그·코딩된 파일)을 다음 단계로 넘깁니다.",
            "「재현」: 같은 순서·같은 옵션으로 다시 실행했을 때 비슷한 표가 나와야 하므로, 사용한 프로그램 메뉴·명령·버전을 적어 두는 것이 좋습니다.",
        ]
    if stage_i == 3 and task_i == 2 and analysis_key:
        terms.append(
            f"「분석 키({analysis_key})」: 이 주제에 맞게 선택된 대표 분석 종류입니다. 표 4·그림 B는 이 분석의 핵심 숫자(평균 차, F, β, 군집 비율 등)를 한눈에 보여 줍니다."
        )
    body = " ".join(terms)
    return f"{head}\n{body}"


# Fixed multi-sentence notes per (stage, task, step_index) — templates use {title}, {population}, etc.
STEP_NOTE_BANK: dict[tuple[int, int], list[str]] = {
    (0, 0): [
        "【모집단 정의】 ‘모집단’은 결론을 말하고 싶은 전체 집단입니다. ‘포함·제외 기준’은 설문에 들어올 사람의 조건을 정해, 나중에 ‘누구 말인지’가 흐려지지 않게 합니다. ‘오염 응답’은 조사 주제와 이해관계가 있어 답을 왜곡할 수 있는 사람(예: 해당 업종 종사자)을 빼는 것을 뜻합니다.",
        "【표본틀·리스트】 표본틀은 ‘뽑을 후보 명단’입니다. respondent_id는 사람마다 붙인 번호, stratum_code는 층(성별·연령 등), weight는 나중에 보정할 가중치, contact_status는 ‘아직 안 함/거절/완료’처럼 진행 상태입니다. 이 표가 있어야 ‘몇 명에게 연락했고 몇 명이 끝냈는지’ 추적할 수 있습니다.",
        "【표본설계】 ‘확률표집’은 모든 사람이 뽑힐 기회가 정해진 방식, ‘비확률표집’은 편의·할당 등으로 뽑는 방식입니다. 무응답 대체는 거절·미완료 자리를 같은 층에서 다시 채우는 방법입니다. ‘설계효과’는 ‘이렇게 뽑으면 오차가 단순 무작위보다 얼마나 커지는지’를 말합니다.",
    ],
    (0, 1): [
        "【측정도구】 ‘구조화 설문’은 모든 응답자에게 같은 문항·같은 선택지를 주는 방식입니다. Likert 5점은 보통 1=전혀 ~ 5=매우처럼 라벨을 붙입니다. constructs는 ‘이번에 재려는 개념 이름(예: 만족·신뢰)’이고, analysis_key에 맞는 변수 구조를 문항으로 만든다는 뜻입니다.",
        "【문항 개발】 문항은 한 번에 완성되지 않고, 정의→문헌→초안→전문가→인지면접→수정 순으로 다듬습니다. r_it(item-total)은 ‘한 문항이 척도 전체와 잘 맞는지’, α 미달 문항은 척도 전체 신뢰도를 깎을 수 있어 pilot에서 빼기도 합니다.",
        "【Pilot】 예비조사 기간·인원(n=30 등)을 적어 두면, ‘본조사와 문항이 같다’는 근거가 됩니다. 문항코드(Q01…)는 데이터 파일 칼럼 이름과 같아야 분석 시 헷갈리지 않습니다.",
    ],
    (0, 2): [
        "【본조사】 조사 기간·방식(CAWI=웹 설문)을 적는 것은 ‘언제 모은 데이터인지’를 밝히기 위함입니다. QC(품질관리)·재연락은 답이 성의 없거나 모순일 때 걸러 내기 위한 절차입니다.",
        "【자료 형태】 ‘1행=1응답자’는 스프레드시트에서 가로 한 줄이 한 사람의 모든 답이라는 뜻입니다. duration_min은 소요 시간(너무 짧으면 대충 한 답일 수 있음), D01–D04는 인구통계, OE01은 개방형입니다.",
        "【방법 연계】 raw data는 아직 가공 전 원본입니다. 이후 전처리·통계 단계에서 같은 파일명·변수명을 쓰면, {method_name} 실습이나 논문 방법란과 연결하기 쉽습니다.",
    ],
    (1, 0): [
        "결측 비율은 ‘답이 비어 있는 칸’이 전체 중 몇 %인지입니다. Little MCAR 검정은 ‘빈칸이 특정 그룹에만 몰리지 않았는지’ 대략 보는 도구이며, p가 크면 ‘무작위에 가깝다’고 해석하는 경우가 많습니다. listwise는 ‘하나라도 빈칸 있으면 그 사람 전체 분석에서 제외’, imputation은 ‘추정값으로 채움’입니다.",
        "이상치 처리에서 z>|3|는 ‘평균에서 표준편차 3배 이상 멀리 있는 값’입니다. winsorize는 극단값을 잘라 상·하위 1%만 경계값으로 바꿔, 한두 명이 평균을 과도하게 끌어당기지 않게 합니다. 모든 규칙은 로그 파일에 남겨 재현합니다.",
    ],
    (1, 1): [
        "역채점 문항은 ‘나는 ~하지 않는다’처럼 점수 방향이 반대인 문항입니다. (6-x)는 5점 척도에서 1↔5, 2↔4로 뒤집는 식입니다. 하위척도 mean은 해당 문항들의 산술평균, composite는 여러 하위척도를 다시 평균 낸 ‘종합 점수’입니다.",
        "변수 산식 표(att_mean, comp_score)는 ‘어떤 Q번호를 어떻게 합쳤는지’ 공식입니다. 나중에 표를 읽는 사람이 같은 점수를 다시 계산할 수 있어야 하므로, analysis_scored.sav에 이 변수들이 저장됩니다.",
    ],
    (1, 2): [
        "Cronbach α는 ‘같은 척도 문항들이 서로 얼마나 비슷하게 답해지는지’입니다. 0.70 이상이면 실무에서 ‘묶어서 쓰자’고 자주 봅니다. KMO는 요인분석에 적합한지, Bartlett p<.001은 ‘문항들 사이에 상관이 있다’는 전제가 타당한지 가늠합니다.",
        "수렴·판별 타당도는 SEM/CFA에서 ‘같은 개념 문항은 서로, 다른 개념 문항은 덜’ 묶이는지 보는 검토입니다. EFA 사전 검토는 요인분석 전에 문항 수를 줄이거나 구조를 정하는 데 씁니다.",
    ],
    (1, 3): [
        "gender 1=남 2=여처럼 ‘숫자↔의미’ 대응을 정합니다. region 17개 더미는 시·도마다 0/1 칼럼을 만들어 ‘어느 지역인지’를 회귀에 넣기 쉽게 합니다. education_3처럼 범주를 줄이면(4단계→3단계) 표본이 작은 칸이 비지 않게 할 수 있습니다.",
        "codebook.xlsx는 논문·공유용 ‘사전’입니다. analysis_coded.sav는 코딩·가중·척도 점수가 반영된 분석용 최종 데이터 파일 이름(慣例)입니다.",
    ],
    (2, 0): [
        "개방형 OE01 답은 길 수 있어, ‘키워드 12범주’처럼 미리 정한 주제 칸에 몇 번 나왔는지만 셉니다. 질적 ‘주제분석’처럼 문장 전체 의미를 깊게 읽지 않고, 양적 보조 변수로만 쓰겠다는 뜻입니다.",
        "dummy 12개는 ‘가격 언급=1, 아니면 0’처럼 만든 칼럼입니다. 본 분석에 꼭 넣지 않아도 되지만, 회귀·교차표에 넣을 때는 빈도가 너무 작은 범주는 합치는 것이 좋습니다.",
    ],
    (3, 0): [
        "Table 1 기술통계는 본격 검정 전 ‘데이터가 어떻게 생겼는지’ 보여 줍니다. M·SD·Min·Max·Skew·Kurt는 분포 모양을 숫자로 요약합니다. 집단별(성별·연령)로 나누면 ‘누가 더 높은 점수인지’를 눈으로 비교할 수 있습니다.",
        "composite_score 한 줄은 ‘이 주제의 핵심 결과 변수’ 요약입니다. 95% CI는 ‘진짜 평균이 이 구간 안에 있을 가능성이 높다’는 뜻으로, 표 4·그림 A와 같은 변수를 가리킵니다.",
        "빈도표는 D01 성별 등 ‘범주 변수’마다 몇 명(%)인지입니다. weight 적용 빈도는 표본을 모집단 구성에 맞게 보정한 숫자입니다.",
        "Descriptive Statistics 메뉴는 SPSS 등에서 ‘평균·빈도·그림’을 만드는 기본 기능입니다. Explore는 정규성·이상치를 함께 볼 때 자주 씁니다.",
    ],
    (3, 1): [
        "Shapiro–Wilk W는 정규성 검정 통계량입니다. p가 .05보다 크면 ‘정규성 위반이 크지 않다’고 보고 t·ANOVA를 진행하는 경우가 많습니다(표본이 매우 크면 다른 기준도 함께 봅니다).",
        "Q–Q plot은 ‘정규분포라면 점들이 직선 위에 모여야 한다’는 그림입니다. 부록에 저장해 두면 심사·재현 시 근거가 됩니다.",
        "Levene F는 집단 간 분산(퍼짐)이 같은지 봅니다. p가 작으면 등분산 위반 → Welch t·Games–Howell을 대안으로 적습니다.",
        "VIF·tolerance·Durbin–Watson은 회귀·잔차 가정 점검입니다. VIF>5(또는 10)면 변수 선택·결합을 검토하고, DW는 2 근처가 이상적이라고 배웁니다.",
    ],
    (3, 3): [
        "Cohen's d는 두 평균 차이의 크기, η²(partial η²)는 ANOVA·회귀에서 설명된 분산 비율, OR·RR은 범주 결과의 배율입니다. p가 작아도 d가 0.2 미만이면 ‘통계적으로는 차이지만 체감은 작을 수 있다’고 씁니다.",
        "‘통계적 유의’와 ‘실무적 의미’를 나누어 쓰라는 것은, p<.05만 강조하지 말고 ‘점수가 몇 점 차이인지·정책·현장에서 무엇을 바꿀 만한지’를 함께 적으라는 뜻입니다.",
    ],
    (4, 0): [
        "가설별 판정 표는 연구 시작 때 세운 문장(예: ‘A가 B보다 높다’)마다 데이터가 찬성·반대인지 적는 것입니다. Bonferroni k=3은 가설이 3개면 유의 기준 α를 0.05/3처럼 더 엄하게 쓰겠다는 뜻으로, ‘우연히 하나 걸리는 것’을 줄입니다.",
    ],
    (4, 1): [
        "CFI·TLI·RMSEA·SRMR은 SEM/CFA에서 ‘그린 모형이 데이터와 잘 맞는지’ 보는 지수입니다. CFI·TLI≥.90, RMSEA≤.08 정도를 ‘무난한 적합’으로 많이 봅니다. t검정만 한 주제는 이 태스크가 해당 없음(N/A)일 수 있습니다.",
    ],
    (4, 2): [
        "Figure 1·Table 2는 논문 Results에 들어갈 ‘그림·표’ 초안입니다. mean±SE 막대그래프는 집단별 평균과 ‘평균의 불확실성(표준오차)’를 함께 보여 줍니다.",
        "한계(단면·자기보고·표본)는 ‘한 시점만 물어봤다·스스로 답했다·표본이 특정 지역/연령에 치우쳤다’처럼, 결과를 과대 해석하지 말라는 설명입니다.",
    ],
    (5, 0): [
        "Abstract(요약)는 제목·대상·표본·방법·핵심 결과·표·그림 번호를 한 단락으로 모읍니다. journal 투고 시 글자 수 제한이 있으므로 숫자 하나(예: n, p, 효과크기)를 꼭 넣습니다.",
        "본문 1–6절 구조는 학술 보고서 관용입니다. 방법에 ‘표본·도구·분석’을 넣으면 재현성이 올라가고, 부록에 설문·syntax·윤리 서류를 두면 심사 대응이 쉽습니다.",
        "재현 패키지는 data·code·output 폴더로 나누고, 300dpi PNG는 인쇄·확대해도 깨지지 않는 그림 해상도입니다. .sps/.R syntax는 클릭 한 번이 아니라 ‘명령 전체’가 담긴 텍스트 파일입니다.",
        "IRB·동의서·audit trail은 ‘윤리 승인·참여 동의·데이터 처리 기록’입니다. 표본설계서는 ①단계 표집 계획과 실제 완료 n·응답률을 연결해 줍니다.",
    ],
}


def _analysis_step_notes(analysis_key: str, step_i: int, step_text: str) -> str | None:
    """Extra paragraphs for stage 4 (index 3) task 3 — main analysis."""
    key = analysis_key.lower()
    blocks: list[tuple[str, list[str]]] = [
        (
            "spss_ttest|ttest",
            [
                "【분석 설계·t검정】 두 집단(예: 남·여)의 평균 점수 차이를 검사합니다. ‘차이가 0이 아니다’는 귀무가설 아래 t·p를 구하고, Levene 결과에 따라 equal/Welch t를 고릅니다.",
                "【보고 항목】 n, M, SD, t, df, p, Cohen's d, 평균 차 95% CI를 표 4에 넣습니다. d≈0.2 작음, 0.5 중간, 0.8 큼으로 해석하는 관용이 있습니다.",
                "【재현】 syntax에 GROUP BY 변수, FILTER, WEIGHT를 주석으로 남깁니다. listwise n은 ‘분석에 실제 들어간 사람 수’입니다.",
            ],
        ),
        (
            "spss_anova|anova|factorial",
            [
                "【ANOVA】 세 집단 이상의 평균을 한 번에 비교합니다. F가 크고 p가 작으면 ‘적어도 한 집단 평균은 다르다’는 뜻이며, 어느 집단끼리 다른지는 Tukey HSD 등 사후검정으로 봅니다.",
                "【표 해석】 SS(제곱합)·df(자유도)는 분산을 쪼갠 표의 칸 이름입니다. Between=집단 간, Within=집단 내 오차입니다.",
                "【재현】 집단 변수는 명목·서열 수준을 명시하고, 가정 위반 시 Welch ANOVA·비모수 대안을 부록에 적습니다.",
            ],
        ),
        (
            "spss_regression|ols|regression|mr",
            [
                "【OLS 회귀】 결과 점수(Y)를 여러 설명 변수(X)로 예측하는 직선을 맞춥니다. B는 ‘X가 1단위 오를 때 Y가 몇 점 변하는지’, β는 단위를 맞춘 상대적 기여입니다.",
                "【표 4】 constant(절편), 각 Predictor의 B·SE·β·p를 적습니다. VIF는 ①단계 가정 검토와 연결됩니다.",
                "【재현】 더미 변수·기준 범주(reference)를 syntax 주석에 적어, OR·β 부호 해석이 바뀌지 않게 합니다.",
            ],
        ),
        (
            "spss_chi|poll_crosstab|chi",
            [
                "【교차표·χ²】 두 범주(행·열)가 독립인지 검정합니다. V(크래머 V)는 연관 강도(0~1에 가깝게)입니다.",
                "【해석】 p<.05면 ‘두 변수가 서로 연관 있다’고 보고, 셀 빈도가 5 미만이면 Fisher 등 대안을 검토합니다.",
            ],
        ),
        (
            "spss_factor|efa",
            [
                "【EFA】 문항을 잠재 요인 몇 개로 묶을지 탐색합니다. eigenvalue>1은 ‘설명력이 1문항 이상인 요인만’ 남기는 흔한 규칙입니다.",
                "【varimax】 요인을 돌려 해석하기 쉽게 합니다. 분산 %는 ‘전체 문항 변동 중 요인이 설명한 비율’입니다.",
            ],
        ),
        (
            "cluster",
            [
                "【K-means】 k개 중심을 두고 사람을 가장 가까운 중심에 배정합니다. random start 여러 번은 ‘다른 시작점에서도 비슷한 군집이 나오는지’ 확인합니다.",
                "【Silhouette·ANOVA】 군집 품질·군집 간 점수 차이 유무를 봅니다. Cluster 1~4 표는 각 그룹 인원·비율·평균 점수입니다.",
            ],
        ),
        (
            "sem_path|cfa|lavaan",
            [
                "【SEM/CFA】 원형·사각형은 잠재변수·관측문항, 화살표는 영향·적재(loading)입니다. ML(최대우도)은 ‘데이터에 가장 잘 맞는 계수’를 찾는 추정법입니다.",
                "【경로 β】 표준화 계수로, ‘다른 변수를 통제한 채 한 단계 영향’을 비교합니다. 표 4와 그림 B(경로도)를 함께 봅니다.",
            ],
        ),
        (
            "logistic|logit",
            [
                "【로지스틱】 Y가 0/1(사건/비사건)일 때 씁니다. OR>1이면 사건 확률이 올라가는 방향, B는 로그 오즈(log-odds) 단위입니다.",
            ],
        ),
        (
            "meta",
            [
                "【메타】 여러 연구의 g(또는 d)를 가중 합칩니다. Random-effects는 ‘연구마다 진짜 효과가 다를 수 있다’고 가정합니다. I²는 그 heterogeneity 크기입니다.",
            ],
        ),
        (
            "panel|did|iv",
            [
                "【패널/인과】 시간·개체 고정효과는 ‘관측하지 못한 개인·시기 특성’을 통제합니다. cluster SE는 ‘같은 단위 반복 관측’에 맞는 표준오차입니다.",
            ],
        ),
        (
            "mediation",
            [
                "【매개】 X→M→Y 경로를 봅니다. indirect effect CI가 0을 포함하지 않으면 ‘간접 경로가 있다’고 많이 해석합니다. bootstrap 5000은 재표본 반복 횟수입니다.",
            ],
        ),
        (
            "mds",
            [
                "【MDS】 ‘거리·유사도’ 행렬에서 2D 좌표를 찾습니다. stress 낮을수록, RSQ 높을수록 잘 맞는 지도입니다.",
            ],
        ),
    ]
    for pattern, notes in blocks:
        if re.search(pattern, key):
            if step_i < len(notes):
                return notes[step_i]
            return notes[-1]
    generic = [
        "【분석 설계】 연구 질문·가설에 맞는 방법을 {analysis_key}로 실행합니다. 표 4의 주 통계량(F, t, β, χ² 등)이 ‘핵심 답’입니다.",
        "【추정·소프트웨어】 listwise n은 결측 제외 후 인원, α=.05(양측)는 ‘양쪽 꼬리’ 검정 기준입니다. WEIGHT·MISSING 옵션을 syntax에 남깁니다.",
        "【재현성】 FILTER(분석 대상), MEASUREMENT(명목/연속) 수준을 주석에 적으면, 다른 사람이 같은 표를 재현하기 쉽습니다.",
    ]
    if step_i < len(generic):
        return generic[step_i].replace("{analysis_key}", analysis_key)
    return generic[-1].replace("{analysis_key}", analysis_key)


def _format_topic(template: str, topic: dict[str, Any], method_name: str) -> str:
    safe = {k: str(v) for k, v in topic.items()}
    safe.setdefault("title", "")
    safe.setdefault("population", "")
    safe.setdefault("hypothesis", "")
    safe["method_name"] = method_name
    return template.format(**safe)


def task_step_annotations(
    stage_i: int,
    task_i: int,
    proc_paras: list[str],
    analysis_key: str,
    topic: dict[str, Any],
    method_name: str = "",
) -> list[str]:
    """One detailed annotation string per procedure paragraph."""
    n = max(len(proc_paras), 1)
    bank = STEP_NOTE_BANK.get((stage_i, task_i), [])
    out: list[str] = []
    for i in range(n):
        step_text = proc_paras[i] if i < len(proc_paras) else ""
        if stage_i == 3 and task_i == 2:
            note = _analysis_step_notes(analysis_key, i, step_text)
            if note:
                extra = _terms_from_step(step_text)
                if extra:
                    note = note + "\n" + " ".join(extra[:3])
                out.append(note)
                continue
        if i < len(bank):
            note = _format_topic(bank[i], topic, method_name)
        else:
            note = _fallback_step(stage_i, task_i, i, step_text, analysis_key)
        extra = _terms_from_step(step_text)
        if extra and i >= len(bank):
            note = note + "\n" + " ".join(extra[:4])
        elif extra and stage_i not in (3,):
            add = [e for e in extra if e not in note][:2]
            if add:
                note = note + "\n" + " ".join(add)
        out.append(note)
    return out


def task_note(stage_i: int, task_i: int, analysis_key: str) -> str:
    """Legacy single-block note — prefer task_step_annotations."""
    ann = task_step_annotations(stage_i, task_i, [""], analysis_key, {}, "")
    return ann[0] if ann else ""
