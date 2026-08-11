"use client";
// 범용 Q-Sort 보드(V2) — q_sort_tool.html의 React 전환 + 범용화. methodos-f18.
//  · 30~80개(권장) 모든 Q표본 자동 지원, 5·7·9·11·13·15점 척도, 분포 자동생성(표준/완만/중앙집중/평탄/사용자정의)
//  · 합계 자동검증·좌우대칭 자동검사·비대칭 허용 옵션 · Q-sort 보드 자동생성 · 반응형
//  · Excel(확장)·CSV·SPSS용 CSV·PQMethod(.DAT) 내보내기 · 연구자용 설정 저장/불러오기
//  · 프로젝트 연동: 이전 단계 진술문 불러오기(qpfctx.pool), 응답자 저장 → qpfctx.matrix(Q소트 행렬)로
//    7단계 요인분석이 '이전 단계 연동'만으로 이어진다.
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/store/app-store";
import { exportXLSX, exportCSV, downloadBlob } from "@/lib/ca-automation";
import {
  generateDistribution, parseCustomDistribution, distSignature, scoreLabel,
  DIST_TYPES, SCALE_POINTS, type DistType, type DistColumn,
} from "@/lib/q-sort-dist";

interface Respondent { name: string; memo: string; scores: (number | null)[]; at: number; }
interface BoardState {
  total: number; scale: number; distType: DistType; customText: string; allowAsym: boolean;
  stmtText: string; statements: string[]; placements: Record<string, number>; // slotKey -> stmt idx(1-base)
  name: string; memo: string;
}
const DEFAULT_STATE: BoardState = {
  total: 36, scale: 9, distType: "standard", customText: "2-3-4-6-6-6-4-3-2", allowAsym: false,
  stmtText: "", statements: [], placements: {}, name: "", memo: "",
};

const slotKey = (score: number, idx: number) => `${score}_${idx}`;

export default function QSortBoard({ pid }: { pid: string }) {
  const getCa = useStore((s) => s.getCa);
  const setCa = useStore((s) => s.setCa);

  const [st, setSt] = useState<BoardState>(() => ({ ...DEFAULT_STATE, ...(getCa(pid).qsb || {}) }));
  const [sel, setSel] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const patch = (p: Partial<BoardState>) => setSt((s) => { const n = { ...s, ...p }; setCa(pid, { qsb: n }); return n; });

  // 분포(보드) 자동 생성 — 설정이 바뀌면 즉시 재계산
  const dist = useMemo(() => (st.distType === "custom"
    ? parseCustomDistribution(st.customText, st.allowAsym)
    : generateDistribution(st.total, st.scale, st.distType)), [st.total, st.scale, st.distType, st.customText, st.allowAsym]);
  const TOTAL = dist.total;
  const columns: DistColumn[] = dist.columns;
  const range = columns.length ? Math.abs(columns[0].score) : 4;

  const placedCount = Object.keys(st.placements).length;
  const placedIds = new Set(Object.values(st.placements));
  const remaining = st.statements.map((t, i) => ({ id: i + 1, text: t })).filter((s) => !placedIds.has(s.id));
  const saved = (getCa(pid).qsortData?.respondents || []) as Respondent[];

  // 분포 변경으로 유효하지 않게 된 배치 정리
  useEffect(() => {
    const valid = new Set<string>();
    columns.forEach((c) => { for (let i = 0; i < c.count; i++) valid.add(slotKey(c.score, i)); });
    const bad = Object.keys(st.placements).filter((k) => !valid.has(k));
    if (bad.length) { const p = { ...st.placements }; bad.forEach((k) => delete p[k]); patch({ placements: p }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distSignature(columns)]);

  const say = (text: string, ok = true) => setMsg({ text, ok });

  const loadStatements = (raw?: string) => {
    const lines = (raw ?? st.stmtText).split("\n").map((l) => l.trim().replace(/^\d+[.)]\s*/, "")).filter(Boolean);
    if (lines.length !== TOTAL) { say(`⚠ 현재 ${lines.length}개 입력됨 — 선택한 분포에는 정확히 ${TOTAL}개가 필요합니다.`, false); return; }
    patch({ statements: lines, placements: {}, stmtText: lines.join("\n") }); setSel(null);
    say(`✔ ${TOTAL}개 진술문을 불러왔습니다.`);
  };
  const loadFromCtx = () => {
    const ctx = getCa(pid).qpfctx || {};
    const pool: { text: string }[] = ctx.pool || [];
    const texts: string[] = pool.length ? pool.map((p) => p.text) : String(ctx.poolText || "").split("\n").map((l: string) => l.trim()).filter(Boolean);
    if (!texts.length) { say("이전 단계 결과(진술문)가 없습니다. 2~4단계에서 Q표본을 먼저 만들거나 직접 입력하세요.", false); return; }
    patch({ stmtText: texts.join("\n") });
    say(`이전 단계에서 ${texts.length}개 진술문을 가져왔습니다. 개수가 분포(${TOTAL})와 다르면 조정 후 [진술문 확정]을 누르세요.`, texts.length === TOTAL);
    if (texts.length === TOTAL) loadStatements(texts.join("\n"));
  };

  const place = (id: number, key: string) => {
    if (st.placements[key]) return;
    const p = { ...st.placements };
    Object.keys(p).forEach((k) => { if (p[k] === id) delete p[k]; });
    p[key] = id; patch({ placements: p }); setSel(null);
  };
  const onSlotClick = (key: string) => {
    if (st.placements[key]) { const p = { ...st.placements }; delete p[key]; patch({ placements: p }); return; }
    if (sel != null) place(sel, key);
  };

  // 진술문별 점수(id 순) — 미배치는 null
  const scoresByStatement = (): (number | null)[] => {
    const out: (number | null)[] = Array(st.statements.length).fill(null);
    columns.forEach((c) => { for (let i = 0; i < c.count; i++) { const id = st.placements[slotKey(c.score, i)]; if (id) out[id - 1] = c.score; } });
    return out;
  };

  const saveRespondent = () => {
    if (!st.statements.length) return say("먼저 진술문을 확정하세요.", false);
    if (placedCount < TOTAL) return say(`아직 ${TOTAL - placedCount}개가 미배치입니다. 전부 배치 후 저장하세요.`, false);
    const name = st.name.trim() || `P${String(saved.length + 1).padStart(2, "0")}`;
    const rs: Respondent[] = [...saved.filter((r) => r.name !== name), { name, memo: st.memo, scores: scoresByStatement(), at: Date.now() }];
    // qpfctx.matrix(QSortMatrix 호환) 갱신 → 7단계 요인분석이 '이전 단계 연동'으로 소비
    const matrix = {
      participants: rs.map((r, i) => ({ id: "P" + String(i + 1).padStart(2, "0"), label: r.name, source: "Q-Sort 보드" })),
      statements: st.statements.map((t, i) => ({ id: "S" + String(i + 1).padStart(2, "0"), text: t })),
      data: rs.map((r) => r.scores.map((v) => v ?? 0)), range,
    };
    setCa(pid, { qsortData: { statements: st.statements, dist: distSignature(columns), respondents: rs }, qpfctx: { ...(getCa(pid).qpfctx || {}), matrix } });
    say(`✔ 응답자 '${name}' 저장 완료 — 누적 ${rs.length}명. (7단계 요인분석에서 '이전 단계 연동'으로 바로 분석됩니다)`);
    patch({ placements: {}, name: "", memo: "" });
  };

  // ── 내보내기 ──
  const rowsForExport = () => {
    const rows: Record<string, any>[] = [];
    columns.forEach((c) => { for (let i = 0; i < c.count; i++) { const id = st.placements[slotKey(c.score, i)]; rows.push({ "점수": c.score, "칸": i + 1, "진술문 번호": id || "", "진술문 내용": id ? st.statements[id - 1] : "(미배치)" }); } });
    rows.sort((a, b) => b["점수"] - a["점수"] || a["칸"] - b["칸"]);
    return rows;
  };
  const doXLSX = async () => {
    if (!st.statements.length) return say("먼저 진술문을 확정하세요.", false);
    const info = [
      { "항목": "응답자", "값": st.name || "(미입력)" }, { "항목": "비고", "값": st.memo },
      { "항목": "진술문 수", "값": TOTAL }, { "항목": "척도", "값": `${columns.length}점 (−${range}~+${range})` },
      { "항목": "분포 유형", "값": DIST_TYPES.find((d) => d.key === st.distType)?.label || st.distType },
      { "항목": "분류도", "값": distSignature(columns) }, { "항목": "배치 완료", "값": `${placedCount} / ${TOTAL}` },
      { "항목": "내보낸 일시", "값": new Date().toLocaleString("ko-KR") },
    ];
    const qsample = st.statements.map((t, i) => ({ "번호": i + 1, "진술문": t, "점수": scoresByStatement()[i] ?? "" }));
    const sheets = [
      { name: "응답자정보", rows: info }, { name: "Q표본", rows: qsample }, { name: "Q분류결과", rows: rowsForExport() },
      ...(saved.length ? [{ name: "누적응답자행렬", rows: st.statements.map((t, si) => { const row: Record<string, any> = { "진술문": t }; saved.forEach((r) => (row[r.name] = r.scores[si] ?? "")); return row; }) }] : []),
    ];
    await exportXLSX(sheets, `Q분류결과_${st.name || "무기명"}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  const doCSV = () => exportCSV(st.statements.map((t, i) => ({ id: i + 1, statement: t, score: scoresByStatement()[i] ?? "" })), "qsort.csv");
  const doSPSS = () => {
    // SPSS용 wide 형식: 행=응답자, 열=S01..Sn (누적 응답자 포함, 현재 배치는 마지막 행)
    const cur = scoresByStatement();
    const all = [...saved.map((r) => ({ name: r.name, scores: r.scores })), ...(placedCount === TOTAL ? [{ name: st.name || "현재응답", scores: cur }] : [])];
    if (!all.length) return say("저장된 응답자나 완료된 배치가 없습니다.", false);
    exportCSV(all.map((r) => { const row: Record<string, any> = { RESP: r.name }; r.scores.forEach((v, i) => (row["S" + String(i + 1).padStart(2, "0")] = v ?? "")); return row; }), "qsort_spss.csv");
  };
  const doDAT = () => {
    // PQMethod 스타일 .DAT: 1행 제목, 2행 "진술수 응답자수", 이후 응답자별 고정폭 점수
    const all = [...saved.map((r) => ({ name: r.name, scores: r.scores })), ...(placedCount === TOTAL && !saved.some((r) => r.name === (st.name || "")) ? [{ name: st.name || "CUR", scores: scoresByStatement() }] : [])];
    if (!all.length) return say("저장된 응답자나 완료된 배치가 없습니다.", false);
    const lines = [`Q-Sort ${new Date().toISOString().slice(0, 10)}`, `${TOTAL} ${all.length}`,
      ...all.map((r) => r.name.padEnd(8).slice(0, 8) + r.scores.map((v) => String(v ?? 0).padStart(4)).join(""))];
    downloadBlob(lines.join("\r\n"), "qsort_pqmethod.dat", "text/plain;charset=utf-8");
  };
  const doSaveSettings = () => downloadBlob(JSON.stringify({ total: st.total, scale: st.scale, distType: st.distType, customText: st.customText, allowAsym: st.allowAsym, statements: st.statements }, null, 1), "qsort_settings.json", "application/json");
  const doLoadSettings = async (f: File | undefined) => {
    if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      patch({ total: j.total ?? st.total, scale: j.scale ?? st.scale, distType: j.distType ?? st.distType, customText: j.customText ?? st.customText, allowAsym: !!j.allowAsym, statements: j.statements || [], stmtText: (j.statements || []).join("\n"), placements: {} });
      say("설정을 불러왔습니다.");
    } catch { say("설정 파일 형식이 올바르지 않습니다.", false); }
  };

  const inp = "inp text-[13px]";
  // 점수 → 색상(빨강 −극단 · 중립 회색 · 초록 +극단) 그라데이션
  const scoreColor = (score: number) => {
    if (score === 0) return "var(--color-text-tertiary)";
    const t = Math.min(1, Math.abs(score) / (range || 1));
    return score < 0
      ? `color-mix(in srgb, var(--danger) ${35 + t * 55}%, var(--color-text-tertiary))`
      : `color-mix(in srgb, var(--ok) ${35 + t * 55}%, var(--color-text-tertiary))`;
  };
  const colTint = (score: number) => {
    if (score === 0) return "var(--color-background-secondary)";
    const t = Math.min(1, Math.abs(score) / (range || 1));
    return score < 0
      ? `color-mix(in srgb, var(--danger-soft) ${30 + t * 55}%, var(--color-background-secondary))`
      : `color-mix(in srgb, var(--ok-soft) ${30 + t * 55}%, var(--color-background-secondary))`;
  };
  const maxCount = columns.reduce((m, c) => Math.max(m, c.count), 1);
  const pct = TOTAL ? Math.round((placedCount / TOTAL) * 100) : 0;
  const panel = { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10 } as const;

  return (
    <div className="text-[13.5px] leading-relaxed">
      {/* ① 분류판 설계 */}
      <div className="p-3.5 mb-3" style={panel}>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="font-semibold text-[14px]">① 분류판 설계 <span className="text-ink-3 font-normal text-[12px]">— 진술문 수·척도·분포를 고르면 보드가 자동 생성됩니다</span></div>
          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}>범용 Q-Sort · 30~80개 권장</span>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <label className="text-[12.5px] flex items-center gap-1.5">Q 진술문 개수
            <input type="number" min={10} max={120} className={`${inp} w-20`} value={st.total} disabled={st.distType === "custom"}
              onChange={(e) => patch({ total: Math.max(5, Math.min(120, parseInt(e.target.value) || 0)) })} /></label>
          <label className="text-[12.5px] flex items-center gap-1.5">척도
            <select className={inp} value={st.scale} disabled={st.distType === "custom"} onChange={(e) => patch({ scale: parseInt(e.target.value) })}>
              {SCALE_POINTS.map((p) => <option key={p} value={p}>{p}점 (−{(p - 1) / 2}~+{(p - 1) / 2})</option>)}
            </select></label>
          <label className="text-[12.5px] flex items-center gap-1.5">강제분포
            <select className={inp} value={st.distType} onChange={(e) => patch({ distType: e.target.value as DistType })}>
              {DIST_TYPES.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select></label>
          {st.distType === "custom" && (<>
            <input className={`${inp} min-w-[220px]`} placeholder="예: 2-3-4-6-6-6-4-3-2 (합계 자동 계산)" value={st.customText} onChange={(e) => patch({ customText: e.target.value })} />
            <label className="text-[12px] flex items-center gap-1"><input type="checkbox" checked={st.allowAsym} onChange={(e) => patch({ allowAsym: e.target.checked })} /> 비대칭 허용</label>
          </>)}
          <span className="text-[11.5px] text-ink-3">{DIST_TYPES.find((d) => d.key === st.distType)?.desc}</span>
        </div>

        {/* 라이브 분포 미리보기(히스토그램) */}
        {columns.length > 0 && (
          <div className="mt-3 rounded-md p-2.5" style={{ background: "var(--color-background-secondary)" }}>
            <div className="flex items-end justify-center gap-1.5" style={{ height: 96 }}>
              {columns.map((c) => (
                <div key={c.score} className="flex flex-col items-center justify-end" style={{ minWidth: 24 }}>
                  <div className="text-[10px] font-semibold mb-0.5" style={{ color: scoreColor(c.score) }}>{c.count}</div>
                  <div title={`${scoreLabel(c.score)}: ${c.count}칸`} style={{
                    width: 20, height: `${Math.max(6, (c.count / maxCount) * 66)}px`,
                    background: scoreColor(c.score), borderRadius: "3px 3px 0 0", transition: "height .18s ease",
                  }} />
                  <div className="text-[10px] mt-1 font-medium" style={{ color: scoreColor(c.score) }}>{scoreLabel(c.score)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2 text-[12.5px]">
          {dist.issues.length
            ? dist.issues.map((x, i) => <div key={i} style={{ color: "var(--danger)" }}>✗ {x}</div>)
            : <span style={{ color: "var(--ok)" }}>✓ 자동 검증 통과 — 합계 {TOTAL}개 · {columns.length}점 척도 · 분류도 {distSignature(columns)}{dist.symmetric ? " · 좌우대칭" : " · 비대칭(허용됨)"}</span>}
        </div>
      </div>

      {/* ②③ 응답자 + 진술문 */}
      <div className="grid lg:grid-cols-[280px_1fr] gap-3 mb-3">
        <div className="p-3.5" style={panel}>
          <div className="font-semibold mb-2">② 응답자 정보</div>
          <input className={`${inp} w-full mb-2`} placeholder="응답자 이름 / ID" value={st.name} onChange={(e) => patch({ name: e.target.value })} />
          <input className={`${inp} w-full`} placeholder="비고 (선택)" value={st.memo} onChange={(e) => patch({ memo: e.target.value })} />
          <div className="text-[12px] text-ink-3 mt-2.5 flex items-center gap-1.5">
            <span className="inline-grid place-items-center rounded-full text-white text-[11px] font-bold" style={{ width: 20, height: 20, background: "var(--brand)" }}>{saved.length}</span>
            누적 저장 응답자{saved.length ? ` — ${saved.map((r) => r.name).join(", ").slice(0, 48)}` : " 없음"}
          </div>
        </div>
        <div className="p-3.5" style={panel}>
          <div className="font-semibold mb-2">③ 진술문 입력 <span className="text-ink-3 font-normal text-[12px]">(한 줄당 1개 · 현재 분포 기준 정확히 {TOTAL}개)</span></div>
          <textarea className={`${inp} w-full min-h-[90px]`} value={st.stmtText} onChange={(e) => patch({ stmtText: e.target.value })} placeholder={`진술문 ${TOTAL}개를 한 줄에 하나씩 붙여넣으세요.`} />
          <div className="flex gap-2 mt-2 flex-wrap items-center">
            <button className="btn btn-sm btn-primary" onClick={() => loadStatements()}>진술문 확정</button>
            <button className="btn btn-sm" onClick={loadFromCtx}>이전 단계에서 Q표본 가져오기</button>
            <span className="text-[12px]" style={{ color: st.stmtText.split("\n").filter((l) => l.trim()).length === TOTAL ? "var(--ok)" : "var(--color-text-tertiary)" }}>
              입력 {st.stmtText.split("\n").filter((l) => l.trim()).length}개 / 필요 {TOTAL}개</span>
          </div>
        </div>
      </div>

      {msg && <div className="rounded-md p-2.5 mb-3 text-[12.5px]" style={{ background: msg.ok ? "var(--ok-soft)" : "var(--danger-soft)", color: msg.ok ? "var(--ok)" : "var(--danger)" }}>{msg.text}</div>}

      {/* ④ 미배치 카드 풀 */}
      {st.statements.length > 0 && (
        <div className="p-3.5 mb-3" style={panel}>
          <div className="font-semibold mb-2">④ 미배치 진술문 <span className="text-ink-3 font-normal text-[12px]">— 카드를 클릭(선택)하거나 드래그해 아래 칸에 배치 · 채워진 칸 클릭 시 회수</span></div>
          <div className="flex flex-wrap gap-1.5">
            {remaining.length === 0 && <span className="text-[12.5px] font-medium" style={{ color: "var(--ok)" }}>✓ 모든 진술문이 배치되었습니다.</span>}
            {remaining.map((s) => (
              <div key={s.id} draggable onClick={() => setSel(sel === s.id ? null : s.id)}
                onDragStart={(e) => e.dataTransfer.setData("text/plain", String(s.id))}
                className="rounded-md px-2 py-1 text-[12px] cursor-grab select-none transition-shadow"
                style={{ maxWidth: 230, background: "var(--color-background-primary)", boxShadow: sel === s.id ? "0 0 0 2px var(--brand)" : "0 1px 2px rgba(0,0,0,.05)", border: "0.5px solid var(--color-border-tertiary)", borderLeft: "3px solid var(--brand)" }}>
                <b style={{ color: "var(--brand-ink)" }}>{s.id}.</b> {s.text.slice(0, 62)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ⑤ 강제분류 보드 */}
      {st.statements.length > 0 && dist.issues.length === 0 && (
        <div className="p-3.5 mb-3" style={panel}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="font-semibold">⑤ 강제분류도 <span className="text-ink-3 font-normal text-[12px]">(−{range} = 가장 비동의 · +{range} = 가장 동의)</span></div>
            <div className="text-[12px]" style={{ color: placedCount === TOTAL ? "var(--ok)" : "var(--color-text-secondary)" }}>배치 <b>{placedCount}</b> / {TOTAL} · {pct}%</div>
          </div>
          {/* 진행 바 */}
          <div className="rounded-full overflow-hidden mb-3" style={{ height: 6, background: "var(--color-background-tertiary)" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: placedCount === TOTAL ? "var(--ok)" : "var(--g-grad)", transition: "width .2s ease" }} />
          </div>
          <div className="flex gap-2 items-end overflow-x-auto pb-2">
            {columns.map((c) => (
              <div key={c.score} className="flex flex-col rounded-md p-1" style={{ minWidth: 108, background: colTint(c.score) }}>
                <div className="text-center font-bold text-[14px]" style={{ color: scoreColor(c.score) }}>{scoreLabel(c.score)}</div>
                <div className="text-center text-[10.5px] mb-1" style={{ color: "var(--color-text-tertiary)" }}>{c.count}칸</div>
                <div className="flex flex-col-reverse gap-1.5 pt-1.5" style={{ borderTop: `2px solid ${scoreColor(c.score)}` }}>
                  {Array.from({ length: c.count }, (_, i) => {
                    const key = slotKey(c.score, i); const id = st.placements[key];
                    return (
                      <div key={key} onClick={() => onSlotClick(key)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); const d = parseInt(e.dataTransfer.getData("text/plain")); if (d) place(d, key); }}
                        className="rounded text-[11.5px] leading-snug cursor-pointer transition-colors"
                        style={id
                          ? { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderLeft: `3px solid ${scoreColor(c.score)}`, padding: "5px 7px", minHeight: 44 }
                          : { background: "var(--color-background-primary)", border: "1px dashed var(--color-border-secondary)", minHeight: 44, opacity: 0.6 }}>
                        {id ? <><b style={{ color: "var(--brand-ink)" }}>{id}.</b> {st.statements[id - 1].slice(0, 46)}</> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3 flex-wrap items-center">
            <button className="btn btn-sm" onClick={() => { patch({ placements: {} }); setSel(null); }}>전체 초기화</button>
            <button className="btn btn-sm btn-primary" disabled={placedCount < TOTAL} onClick={saveRespondent}>이 응답자 저장(행렬에 추가) ▶</button>
            {placedCount === TOTAL && <span className="text-[12px]" style={{ color: "var(--ok)" }}>✓ 배치 완료 — 저장하면 7단계 요인분석으로 연동됩니다</span>}
          </div>
        </div>
      )}

      {/* ⑥ 내보내기 · 설정 */}
      <div className="p-3.5" style={panel}>
        <div className="font-semibold mb-2">⑥ 내보내기 · 연구자 설정</div>
        <div className="flex gap-1.5 flex-wrap">
          <button className="btn btn-sm" onClick={doXLSX}>Excel(확장)</button>
          <button className="btn btn-sm" onClick={doCSV}>CSV</button>
          <button className="btn btn-sm" onClick={doSPSS}>SPSS용 CSV</button>
          <button className="btn btn-sm" onClick={doDAT}>PQMethod(.DAT)</button>
          <button className="btn btn-sm" onClick={doSaveSettings}>설정 저장(JSON)</button>
          <label className="btn btn-sm cursor-pointer">설정 불러오기<input ref={fileRef} type="file" accept=".json" className="hidden" onChange={(e) => doLoadSettings(e.target.files?.[0])} /></label>
        </div>
        <p className="text-[11.5px] text-ink-3 mt-2">응답자를 2명 이상 저장하면 7단계(자료코딩·요인분석)에서 ‘이전 단계 연동’만으로 실제 요인분석이 실행됩니다. 데이터는 이 기기에만 저장됩니다.</p>
      </div>
    </div>
  );
}
