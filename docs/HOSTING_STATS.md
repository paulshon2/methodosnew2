# 「서버(대)」 호스팅 요건 — stats compute / jobs

MethodOS SaaS(`next start`)에서 통계 **서버(대)** 경로를 쓰려면 아래를 지키세요.
정적 `node serve.js`(export `out/`)만으로는 `/api/stats/*`가 동작하지 않습니다.

## 필수

| 항목 | 내용 |
| --- | --- |
| 런타임 | `npm run build` 후 **`npm run start`** (Node 서버). Edge Runtime에 stats 라우트를 두지 말 것. |
| API | `POST /api/stats/compute` — 짧은 QR/SVD/PCA (동기, `maxDuration=60`) |
| Jobs | `POST /api/stats/jobs` + `GET /api/stats/jobs/[id]` — E-06 부트스트랩 등 장시간 |
| 코어 | `saas/lib/stats-core/` — 브라우저·Node **동일** TypeScript |
| 게이트 | `saas/lib/stats-runtime.ts` — `browser` / `server-sync` / `server-async` |
| DB | Supabase `0004_stats_jobs.sql` 적용(없으면 메모리 Map 폴백, 단일 인스턴스만) |

## Vercel을 쓸 때

- **짧은 동기**(`server-sync`)만 compute 라우트에 허용.
- **E-06·대량 리샘플**은 반드시 **비동기 잡**. HTTP 한 요청에 수만 회 부트스트랩을 넣지 말 것.
- `export const runtime = "nodejs"` 유지. Edge 금지.
- 플랜별 `maxDuration` 확인. 부족하면 잡을 외부 워커(`scripts/stats-worker` 예정)로 분리.

## 로컬 / VM

```bash
cd saas
npm install
npm run build
NODE_OPTIONS=--max-old-space-size=4096 npm run start
```

Clerk 키가 없으면 미들웨어가 패스스루하고 stats API는 `local-user`로 동작합니다.

## 검증 스모크

```bash
cd saas
npx --yes tsx scripts/stats-core-selftest.ts
```

특수함수 앵커(Φ(0), betainc(x;1,1), …)와 OLS `‖Xᵀe‖≈0`을 확인합니다.

## 워크벤치

- `basic-stats-studio` / `ss-stats-workbench`는 CSV 크기·기법 코드로 게이트를 돌린 뒤,
  stats-core에 이식된 코드(E-01/E-02/E-06/B-03)만 서버로 보내고, 나머지는 브라우저 폴백합니다.
