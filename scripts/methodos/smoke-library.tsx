/**
 * 라이브러리 예제 전부(548) 실행 + 설계된 그림(dviz) 렌더 점검.
 *   NODE_OPTIONS="--require ./scripts/methodos/css-stub.cjs" npx --yes tsx scripts/methodos/smoke-library.tsx [기법코드 ...]
 * 크래시·빈 그림이 없는지 본다(수치 정답 대조는 verify.ts 의 몫).
 */
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import { runMethodos } from "../../lib/methodos/run";
import { toEngineResult } from "../../lib/methodos/adapt";
// @ts-ignore JSX 모듈
import Panel from "../../components/methodos/dviz/Panel.jsx";

(globalThis as any).React = React; // dviz JSX 는 React 를 import 하지 않는 고전 방식
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "../../public/methodos");
const lib: Record<string, any[]> = JSON.parse(fs.readFileSync(path.join(ROOT, "library.json"), "utf8"));
const only = new Set(process.argv.slice(2));
let n = 0, runFail = 0, vizFail = 0, noSvg = 0;
const bad: string[] = [];
const perCode: Record<string, { ex: number; svg: number }> = {};
for (const [code, list] of Object.entries(lib)) {
  if (only.size && !only.has(code)) continue;
  for (const e of list) {
    n++;
    const csv = fs.readFileSync(path.join(ROOT, "data", e.csv), "utf8");
    let res: any;
    try { res = runMethodos(code, csv, e.slots, e.options); } catch (x: any) { runFail++; bad.push(`${e.id} 실행: ${String(x.message).slice(0, 90)}`); continue; }
    try {
      const html = renderToString(React.createElement(Panel, { result: toEngineResult(res, e.slots) }));
      const P = (perCode[code] ??= { ex: 0, svg: 0 }); P.ex++;
      if (/<svg/.test(html)) P.svg++; else noSvg++;
      if (/undefined|NaN/.test(html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").slice(0, 100000)) && /NaN/.test(html.replace(/<[^>]+>/g, " "))) bad.push(`${e.id} 그림에 NaN`);
    } catch (x: any) { vizFail++; bad.push(`${e.id} 그림: ${String(x.message).slice(0, 90)}`); }
  }
}
const codesNoViz = Object.entries(perCode).filter(([, v]) => v.svg === 0).map(([c]) => c);
console.log(`예제 ${n}건 · 실행 실패 ${runFail} · 그림 렌더 오류 ${vizFail} · 그림(svg) 없는 예제 ${noSvg}`);
if (codesNoViz.length) console.log("그림이 전혀 없는 기법:", codesNoViz.join(" "));
for (const b of bad.slice(0, 40)) console.log(" -", b);
process.exit(runFail + vizFail ? 1 : 0);
