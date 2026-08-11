"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/store/app-store";
import { chartById } from "@/lib/charts";
import { useAnnotation } from "./annotations";
import VizPlot from "./viz-plot";

// 그래프 만들기 화면에 자주 나오는 데이터 영어 용어(주석 패널용)
const VIZ_TERMS = [
  { term: "X (가로축)", def: "가로 방향 축 — 보통 이름·날짜·그룹을 놓습니다" },
  { term: "Y (세로축)", def: "세로 방향 축 — 보통 숫자·값을 놓습니다" },
  { term: "group", def: "그룹 — 색으로 구분할 분류 항목" },
  { term: "stage", def: "단계 — 연구방법의 각 진행 단계" },
  { term: "outputs", def: "산출물 — 그 단계에서 나온 결과물 수" },
  { term: "version", def: "버전 — 같은 단계를 다시 실행한 회차" },
  { term: "size", def: "크기 — 점·항목의 크기로 쓰는 값" },
  { term: "CSV", def: "CSV — 엑셀처럼 쉼표로 구분한 표 형식" },
];

// 시각화 — ③ 직접 만들기: 연구결과 연동 / 직접 선택 모드 + React VizPlot (no iframe)
export default function VizStudio({ id, nav }: { id: string; nav: (r: string) => void }) {
  const found = chartById(id);
  const projectsMap = useStore((s) => s.projects);
  const getProject = useStore((s) => s.getProject);
  const artifacts = useStore((s) => s.artifacts);
  const projects = Object.values(projectsMap).sort((a, b) => b.createdAt - a.createdAt);
  const [mode, setMode] = useState<"research" | "self">(projects.length ? "research" : "self");
  const [pid, setPid] = useState<string>(projects[0]?.id || "");
  const name = found?.chart.name || "그래프";
  const { register } = useAnnotation();
  useEffect(() => { register(VIZ_TERMS); }, [register]);

  const projectData = mode === "research" && pid
    ? { project: getProject(pid), artifacts: artifacts(pid) }
    : null;

  return (
    <div className="text-[14px]">
      <button className="btn btn-sm mb-2.5" onClick={() => nav("viztype/" + id)}>← {name} 설명</button>
      <h1 className="text-[22px] font-semibold">{name} 만들기</h1>
      <p className="text-[14px] text-ink-2 mb-3">왼쪽 예시를 보고 → 오른쪽에서 ①②③ 순서대로 누르면 그래프가 완성됩니다.</p>

      <div className="card mb-3">
        <div className="text-[14px] font-semibold mb-2">먼저, 어떤 자료로 그릴까요?</div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="inline-flex rounded-md p-0.5 gap-0.5" style={{ background: "var(--color-background-secondary)" }}>
            <button onClick={() => setMode("research")} className="rounded px-4 py-2 text-[14px]"
              style={mode === "research" ? { background: "var(--color-background-primary)", color: "var(--brand-ink)", fontWeight: 600, boxShadow: "var(--shadow)" } : { color: "var(--color-text-secondary)" }}>
              📂 내 연구 결과로 그리기</button>
            <button onClick={() => setMode("self")} className="rounded px-4 py-2 text-[14px]"
              style={mode === "self" ? { background: "var(--color-background-primary)", color: "var(--brand-ink)", fontWeight: 600, boxShadow: "var(--shadow)" } : { color: "var(--color-text-secondary)" }}>
              ✏️ 내가 직접 자료 넣기</button>
          </div>
          {mode === "research" && (
            <select className="inp max-w-[320px] text-[14px]" value={pid} onChange={(e) => setPid(e.target.value)}>
              {projects.length === 0 && <option value="">진행한 프로젝트가 없어요 — ‘직접 넣기’를 쓰세요</option>}
              {projects.map((p) => <option key={p.id} value={p.id}>{p.title} · 결과 {artifacts(p.id).length}개</option>)}
            </select>
          )}
        </div>
        <p className="text-[13px] text-ink-3 mt-2">{mode === "research"
          ? "고른 프로젝트에서 나온 결과가 자동으로 그래프 자료로 들어갑니다."
          : "연습용 예시 자료로 먼저 해 보거나, 엑셀 표를 복사해 붙여넣을 수 있어요."}</p>
      </div>

      {/* React VizPlot — 기존 iframe(/viz/index.html?...) 대체 */}
      <VizPlot chartId={id} mode={mode} projectData={projectData} />
    </div>
  );
}
