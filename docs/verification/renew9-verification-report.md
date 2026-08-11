# MethodOS renew-9 통계·입출력 검증 보고서

- 생성: 2026-08-07T10:00:13.562Z
- 기술·추론(classic): 41
- 구조방정식·잠재변수(sem): 12
- PASS 66 · WARN 1 · FAIL 0 / 총 67

## 검증 방법 요약
1. 특수함수·OLS 절대 앵커(해석적 값)
2. 독립표본 t·Pearson r 수작업 공식 대조
3. 설문/코딩/통계/그래프/원고 불러오기·내보내기 라운드트립
4. curriculum classic 41 + sem 12를 예제 CSV로 runBasicStats 실행 후 p·verify·본문 검사

## 모듈별 결과

| 영역 | ID | 기법 | 예제 | 결과 | 방법 | 비고 |
|---|---|---|---|---|---|---|
| core | special-anchors | 특수함수 절대 앵커 | stats-verify-filter.checkSpecialAnchors( | pass | Φ(0), erf(0), betainc(x;1,1)=x, lgamma(5), χ²·t CD | OK 6 anchors |
| core | analytic-self | 해석적 자기검증 | Φ(0)=0.5, erf(0)=0, betainc(0.37;1,1)=0. | pass | normalCdf / erf / betainc / lgamma | Φ=0.5, erf=0, betainc=0.37, lgamma=3.1780538303479453 |
| core | ols-invariants | OLS 불변식 | X=[1..5], y≈2x | pass | QR 분해 · Xᵀe≈0 · SST≈SSR+SSE | r2=0.9973053289009771, xtxeNorm=4.440892098500626e-16, Σe=0 |
| math-check | C-02-hand | 독립표본 t검정 수식 대조 | A:70+(i%5) n=30 vs B:65+(i%5) n=30 | pass | Welch/독립 t = (m1-m2)/√(s1²/n1+s2²/n2), p=Student-t | hand t=13.4629 p=0.000000 / eng t=13.4629 p=0 |
| math-check | D-01-hand | Pearson 상관 수식 대조 | y=2x+1 (완전 선형, r=1) | pass | r = Σ(x-x̄)(y-ȳ) / √(Σ(x-x̄)² Σ(y-ȳ)²) | hand r=1 / eng stats={"pearson":1,"t":null,"p":null,"n":10,"_rowShuffleStable":t |
| io-viz | viz-xlsx-roundtrip | 그래프 그리기 · Excel 왕복 | 수업 방식 세 가지와 성취도 | pass | CSV → XLSX.write → sheet_to_csv → parseCsv | in 5열×120행 → out 5×120; desc="집단 3개 · 숫자 변수 3개 — 세 집단 비교, 두 변수 관계, 한 변" |
| io-viz | viz-sample-desc | 그릴 자료 예제 설명 존재 | 24개 예제 | pass | VIZ_PRACTICE_SETS title+desc 필드 검사 | title+desc 모두 있는 예제 24/24 |
| io-coding | coding-txt-import | 코딩·분류 · 텍스트 불러오기 | flow.txt (4턴) | pass | 연구자/참여자 평문 → Doc 세그먼트 | docs=1, segs=4 |
| io-coding | coding-csv-xlsx | 코딩·분류 · CSV 불러오기→Excel 내보내기 | interview.csv | pass | parseTranscriptTable + codingWorkbookSheets | import segs=4, xlsxBytes=18701, sheets=2 |
| io-survey | survey-xlsx-roundtrip | 설문 만들기 · Excel 왕복 | Q1 단일선택 / Q2 리커트 | pass | AOA → xlsx → sheet_to_json | rows=3, Q1=Q1 |
| io-stats | stats-import-run-export | 통계 계산 · 불러오기→분석→내보내기 | group A/B score n=6 | pass | parseCsv → runBasicStats(C-02) → XLSX | 독립표본 t · A vs B · ✅ 검증통과; p=0.002066; xlsx=16548B |
| io-manuscript | mw-contrast-tokens | 원고 쓰기 · 불러오기 대비(흰글자) 수정 검증 | Excel/CSV/Text insertHTML 스타일 | pass | 불러오기 표 셀이 테마 토큰(--doc-ink) 사용 · 흰 배경 하드코딩 제거 | 새 불러오기 스타일은 var(--doc-ink)/transparent — glass 테마에서 가독성 유지 |
| io-manuscript | mw-source-fix | 원고 쓰기 · 소스 수정 확인 | Excel/CSV/Text import path | pass | method-writing-studio.tsx 정적 검사 | tokenStyles=true, removedHardWhite=true |
| ui | overview-label | 개요 문구 변경 | '이 화면을 쓰는 이유' → '개요' | pass | StudioGuide 제목 정적 검사 | StudioGuide h2 = 개요 |
| classic | A-01 | 빈도분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('A-01') + verify filter | demo=A-01-demo-01; verify=pass |
| classic | A-02 | 기술통계 | 대학생 학습동기 조사 (1) | pass | runBasicStats('A-02') + verify filter | demo=A-02-demo-01; verify=pass |
| classic | A-03 | 데이터 탐색(Explore) | 대학생 학습동기 조사 (1) | pass | runBasicStats('A-03') + verify filter | demo=A-03-demo-01; verify=pass |
| classic | A-04 | Shapiro–Wilk(정규성 검정) · Kolmogorov–Smirnov(분포 적합성 검정 (정규성 포함)) | 대학생 학습동기 조사 (1) | pass | runBasicStats('A-04') + verify filter | demo=A-04-demo-01; verify=pass |
| classic | A-05 | 이상 케이스 식별 | 대학생 학습동기 조사 (1) | pass | runBasicStats('A-05') + verify filter | demo=A-05-demo-01; verify=pass |
| classic | A-08 | 사용자 정의 표 · OLAP 큐브 | 대학생 학습동기 조사 (1) | pass | runBasicStats('A-08') + verify filter | demo=A-08-demo-01; verify=pass |
| classic | A-09 | 다중응답 빈도·교차표 | 대학생 학습동기 조사 (1) | pass | runBasicStats('A-09') + verify filter | demo=A-09-demo-01; verify=pass |
| classic | A-10 | 최적 구간화 · 자동 데이터 준비 | 대학생 학습동기 조사 (1) | pass | runBasicStats('A-10') + verify filter | demo=A-10-demo-01; verify=pass |
| classic | B-02 | 급내상관계수(ICC) | 대학생 학습동기 조사 (1) | pass | runBasicStats('B-02') + verify filter | demo=B-02-demo-01; verify=pass |
| classic | B-05 | Bland–Altman 분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('B-05') + verify filter | demo=B-05-demo-01; verify=pass |
| classic | C-01 | 일표본 t검정 | 대학생 학습동기 조사 (1) | pass | runBasicStats('C-01') + verify filter | demo=C-01-demo-01; verify=pass |
| classic | C-02 | 독립표본 t검정 | 대학생 학습동기 조사 (1) | pass | runBasicStats('C-02') + verify filter | demo=C-02-demo-01; verify=pass |
| classic | C-03 | 대응표본 t검정 | 대학생 학습동기 조사 (1) | pass | runBasicStats('C-03') + verify filter | demo=C-03-demo-01; verify=pass |
| classic | C-04 | 일원배치 분산분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('C-04') + verify filter | demo=C-04-demo-01; verify=pass |
| classic | C-05 | 이원배치 분산분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('C-05') + verify filter | demo=C-05-demo-01; verify=pass |
| classic | C-06 | 다변량 분산분석(MANOVA) | 대학생 학습동기 조사 (1) | pass | runBasicStats('C-06') + verify filter | demo=C-06-demo-01; verify=pass |
| classic | C-07 | 공분산분석(ANCOVA) | 대학생 학습동기 조사 (1) | pass | runBasicStats('C-07') + verify filter | demo=C-07-demo-01; verify=pass |
| classic | C-08 | 반복측정 분산분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('C-08') + verify filter | demo=C-08-demo-01; verify=pass |
| classic | C-09 | 비율검정 · 이항검정 · McNemar | 대학생 학습동기 조사 (1) | pass | runBasicStats('C-09') + verify filter | demo=C-09-demo-01; verify=pass |
| classic | C-10 | 사후검정 | 대학생 학습동기 조사 (1) | pass | runBasicStats('C-10') + verify filter | demo=C-10-demo-01; verify=pass |
| classic | D-01 | 상관분석 (Pearson · Spearman · Kendall) | 대학생 학습동기 조사 (1) | pass | runBasicStats('D-01') + verify filter | demo=D-01-demo-01; verify=pass |
| classic | D-02 | 편상관 · 부분상관 | 대학생 학습동기 조사 (1) | pass | runBasicStats('D-02') + verify filter | demo=D-02-demo-01; verify=pass |
| classic | D-03 | 거리상관(Distance Correlation) | 대학생 학습동기 조사 (1) | pass | runBasicStats('D-03') + verify filter | demo=D-03-demo-01; verify=pass |
| classic | D-04 | 교차분석 · 카이제곱 | 대학생 학습동기 조사 (1) | pass | runBasicStats('D-04') + verify filter | demo=D-04-demo-01; verify=pass |
| classic | D-06 | 대응분석 · 다중대응분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('D-06') + verify filter | demo=D-06-demo-01; verify=pass |
| classic | D-07 | 다차원척도법 · 언폴딩 | 대학생 학습동기 조사 (1) | pass | runBasicStats('D-07') + verify filter | demo=D-07-demo-01; verify=pass |
| classic | E-01 | 단순회귀분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('E-01') + verify filter | demo=E-01-demo-01; verify=pass |
| classic | E-02 | 다중회귀분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('E-02') + verify filter | demo=E-02-demo-01; verify=pass |
| classic | E-03 | 위계적 회귀분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('E-03') + verify filter | demo=E-03-demo-01; verify=pass |
| classic | E-04 | 단계선택 · 전진 · 후진 회귀 | 대학생 학습동기 조사 (1) | pass | runBasicStats('E-04') + verify filter | demo=E-04-demo-01; verify=pass |
| classic | E-05 | 더미변수 회귀 | 대학생 학습동기 조사 (1) | pass | runBasicStats('E-05') + verify filter | demo=E-05-demo-01; verify=pass |
| classic | E-15 | 2단계 최소제곱(2SLS) | 대학생 학습동기 조사 (1) | pass | runBasicStats('E-15') + verify filter | demo=E-15-demo-01; verify=pass |
| classic | G-01 | 군집분석 (계층적 · K-평균 · 2단계) | 대학생 학습동기 조사 (1) | pass | runBasicStats('G-01') + verify filter | demo=G-01-demo-01; verify=pass |
| classic | G-02 | 군집 실루엣 | 대학생 학습동기 조사 (1) | pass | runBasicStats('G-02') + verify filter | demo=G-02-demo-01; verify=pass |
| classic | G-04 | 의사결정나무 | 대학생 학습동기 조사 (1) | pass | runBasicStats('G-04') + verify filter | demo=G-04-demo-01; verify=pass |
| classic | G-06 | ROC 분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('G-06') + verify filter | demo=G-06-demo-01; verify=pass |
| classic | I-01 | 계절분해 · 자기상관 · 스펙트럼 | 대학생 학습동기 조사 (1) | pass | runBasicStats('I-01') + verify filter | demo=I-01-demo-01; verify=pass |
| classic | I-03 | 벡터자기회귀(VAR) · 인과모형 | 대학생 학습동기 조사 (1) | pass | runBasicStats('I-03') + verify filter | demo=I-03-demo-01; verify=pass |
| classic | I-04 | 컨조인트 분석 · TURF | 대학생 학습동기 조사 (1) | pass | runBasicStats('I-04') + verify filter | demo=I-04-demo-01; verify=pass |
| classic | J-01 | 메타분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('J-01') + verify filter | demo=J-01-demo-01; verify=pass |
| classic | J-02 | 출판편향 검정 | 대학생 학습동기 조사 (1) | pass | runBasicStats('J-02') + verify filter | demo=J-02-demo-01; verify=pass |
| sem | cfa | 확인적 요인분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('cfa') + verify filter | demo=cfa-demo-01; verify=n/a |
| sem | path | 경로분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('path') + verify filter | demo=path-demo-01; verify=n/a |
| sem | sem | 구조방정식모델 분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('sem') + verify filter | demo=sem-demo-01; verify=n/a |
| sem | sem_fix | 구조방정식모델 수정 | 대학생 학습동기 조사 (1) | warn | runBasicStats('sem_fix') + verify filter | demo=sem_fix-demo-01; verify=n/a (교육용/경고) |
| sem | sem_mod | 구조방정식모델의 조절효과 분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('sem_mod') + verify filter | demo=sem_mod-demo-01; verify=n/a |
| sem | mg | 다중집단모델 분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('mg') + verify filter | demo=mg-demo-01; verify=n/a |
| sem | B-01 | 신뢰도분석 (Cronbach α · McDonald ω) | 대학생 학습동기 조사 (1) | pass | runBasicStats('B-01') + verify filter | demo=B-01-demo-01; verify=pass |
| sem | B-03 | 탐색적 요인분석(EFA) · 주성분분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('B-03') + verify filter | demo=B-03-demo-01; verify=pass |
| sem | D-05 | 정준상관분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('D-05') + verify filter | demo=D-05-demo-01; verify=pass |
| sem | E-06 | 매개효과 분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('E-06') + verify filter | demo=E-06-demo-01; verify=pass |
| sem | E-07 | 조절효과 분석 | 대학생 학습동기 조사 (1) | pass | runBasicStats('E-07') + verify filter | demo=E-07-demo-01; verify=pass |
| sem | G-03 | 판별분석 · 최근접이웃 | 대학생 학습동기 조사 (1) | pass | runBasicStats('G-03') + verify filter | demo=G-03-demo-01; verify=pass |