# Methodos 43기법 웹판 (Expert 모드)

사이드바 「통계 계산」 → Expert 모드(`#/tools/stats/hub`)의 옛 목록(기술·추론 분석 41종, 구조방정식·잠재변수 모형 12종)을 없애고,
Methodos Basic R19 파이썬 엔진의 **43기법(M01~M43)** 을 TypeScript 로 옮겨 넣었다.

## 계산은 어디서 하나
- **사용자의 브라우저 안(웹 워커)** 에서 한다. 올린 자료는 서버로 전송되지 않는다. Vercel 은 화면과 정적 파일(`public/methodos/`)만 준다.
- 파이썬·서버 함수가 필요 없다. `/api/stats/*` 는 이 기능과 무관하다(목적 중심 화면이 계속 쓴다).

## 구성
| 위치 | 내용 |
|---|---|
| `lib/methodos/core.ts` `core2.ts` | 분포(t·F·χ²·비중심 t/F/χ²·스튜던트화 범위), 선형대수, OLS, 최적화(BFGS·Nelder–Mead), SVD |
| `lib/methodos/nprng.ts` | numpy `default_rng`(PCG64) 와 같은 난수열 — 부트스트랩을 엔진과 같은 번호열로 재현 |
| `lib/methodos/t1~t7.ts`, `irt.ts` | M01~M43 계산 (`registry.ts` 가 코드→함수) |
| `lib/methodos/run.ts` `client.ts` `worker.ts` | 옵션 정리·오류 문구 / 워커 호출 / 워커 본체 |
| `components/app/stats/Methodos{Hub,Studio,Result}.tsx` | 목록 · 자료→변수·옵션→결과 화면 |
| `public/methodos/catalog.json`, `examples/` | 기법 목록·옵션·예제 자료(엔진의 카탈로그에서 생성: `scripts/methodos/build-catalog.py`) |

옛 모듈 번호(`A-01`, `cfa` …)로 들어오면 같은 일을 하는 기법으로 보낸다(`LEGACY_TO_METHODOS`).

## 검증
```
npm run verify:methodos        # scripts/methodos/reference 의 엔진 결과표와 칸마다 견줌, public/methodos/verification.json 갱신
```
- 기준 묶음(`reference/cases.json`, 636사례): 예제 43 + 엔진의 다양한 자료 예제 + 옵션 갈래 사례(무절편, 다항·순서형 로지스틱, 프로멕스, 프리드먼, 경로모형 비교, ARIMA 차수, 회귀불연속·도구변수, 층화·짝짓기 …).
- 결과: 예제 2,404칸 전부 일치, 다양한 자료·옵션 사례 593/593 일치. 최대 상대오차는 대부분 1e-6 이하, 최적화 기법(M25·M27·M30·M32)은 1e-4, 분위회귀 부트스트랩은 7e-4(선형계획 해가 여럿인 표본).
- 난수: M13·M36 은 numpy 난수열을 그대로 재현해 값이 같다. M31(유형 번호·시작 횟수)과 M37(다중대체)은 난수 흐름이 달라 통계적으로만 견줬다(M37: 추정은 3·SE 안, 대체내 SE 25% 안).
- 기준 묶음을 엔진에서 다시 뽑으려면 `scripts/methodos/build-reference.py <v19-Ngraph-SaaS 폴더>`.

## 한계(엔진과 다른 점)
- 사례 가중·설문 설계 가중(층·군집)은 없다. 엔진의 가중 계산 경로는 옮기지 않았다.
- M29 구조방정식: 엔진 정의 그대로 **측정모형이 있으면 요인점수(문항 평균)로 경로분석**하는 근사이며 잠재변수 ML-SEM 이 아니다. M25 CFA·M26 측정동일성·M28 경로분석은 ML/OLS 로 실제 추정한다.
- M39 의 처치·시점을 숫자 목록으로 주는 옛 방식은 없고 열 배정만 받는다. M40 의 효과·SE 숫자 직접 입력도 없다(열 배정).
- M43 에서 자료가 모수를 정하지 못하는 경우(평평한 자료) 추정값이 엔진과 다를 수 있다(표준오차는 비움 처리가 같다).
- 파일 형식은 CSV·Excel. SPSS·R 파일, PDF 내보내기는 없다. 결과는 표 복사·엑셀·JSON.
- 큰 자료에서 M25·M26·M27 은 수 초 걸릴 수 있다(워커에서 돌아 화면은 멈추지 않는다).

## 네 화면 (renew-20) — 데스크톱판과 같은 흐름, 화면은 Expert 모드 방식
데스크톱 Methodos Basic 의 네 화면을 같은 순서·같은 일로 옮기고, 겉모양은 사이트의 Expert 모드(유리 카드·Stepper 톤)로 맞췄다. 화면 위의 탭으로 오간다.

| 화면 | 주소 | 하는 일 | 데스크톱 대응 |
|---|---|---|---|
| 통계방법 라이브러리 | `#/tools/stats/hub` | 43기법 카드(수준·갈래·검색) → 설명·필요한 변수·**분야별 예제(548건)** 고르기 → 「예제 실행」 | 예제 실습실(`Examples.jsx`) |
| 분석 실행 | `#/tools/stats/M01~M43` | 기법 고르기 · 자료(올리기·붙여넣기·예제) · **자료 준비**(사례 선택·역코딩·재부호화·중심화·표준화·로그·문항 평균) · 변수·옵션 · 실행 | `Workbench.jsx` + `DataPrep.jsx` |
| 그래프 그리기 | `#/tools/stats/charts` | 최근 결과를 **기법별로 설계한 그림**(`components/methodos/dviz/*`, 데스크톱 Ngraph 와 같은 코드)으로 · 읽는 법 · 표로 보기 · PNG/SVG | `Charts.jsx` + `dviz` |
| 통계분석결과 | `#/tools/stats/results` | 결과 기록(최근 30건, 브라우저 `localStorage`) 열기·지우기, 결과표 + 그림 | `Results.jsx` |

네 화면은 `lib/methodos/session.ts`(zustand)로 자료·최근 결과를 함께 쓴다. 결과는 서버로 가지 않는다.
- 라이브러리 예제: `public/methodos/library.json` + `public/methodos/data/*.csv` (`scripts/methodos/build-catalog.py` 가 엔진의 `multi_examples.json` 에서 생성).
- 그림 어댑터: `lib/methodos/adapt.ts` 가 웹 결과(`MResult`)를 dviz 가 읽는 엔진 결과꼴로 바꾼다.
- 점검: `NODE_OPTIONS="--require ./scripts/methodos/css-stub.cjs" npx tsx scripts/methodos/smoke-library.tsx` — 예제 548건 전부 실행 + 그림 렌더(실행 실패 0, 렌더 오류 0).

### 네 화면의 한계
- 엔진이 만드는 matplotlib 그림·가정 점검 카드(`assumption_results`)는 없다. 그림은 결과표 값으로 그린 설계 그림뿐이다.
- 설계 그림이 없는 기법(M02·M16·M20·M26·M27)은 결과표만 나온다(데스크톱에서도 엔진 그림에 기대던 기법).
- 자료 준비는 가중·유형 편집을 뺀 가벼운 변환 7종이다.
