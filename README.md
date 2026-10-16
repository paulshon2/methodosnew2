# MethodOS (renew-19)

연구방법 가상 학습·자동화 웹앱(Next.js 15 · React 19, Clerk · Supabase 선택).

```
cd <이 폴더>
npm install
npm run dev          # http://localhost:3000/app   (Clerk 키가 없으면 로컬 모드)
```

## 이번 판 — 통계 계산 Expert 모드 = Methodos 43기법
옛 목록을 지우고 Methodos 파이썬 엔진(R19)의 43기법을 TypeScript 로 옮겨 브라우저 안에서 계산한다(자료는 서버로 가지 않음).
구조·검증 결과·한계는 [docs/METHODOS_WEB.md](docs/METHODOS_WEB.md). 엔진 대조는 `npm run verify:methodos`.

환경변수는 `.env.example` 참고(비밀값은 저장소에 두지 않는다).
