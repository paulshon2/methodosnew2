"use client";
import type { Registry } from "@/lib/types";
import { useStore } from "@/store/app-store";
import StageRail, { type RailStage } from "./stage-rail";

export default function Dashboard({ reg, nav }: { reg: Registry; nav: (r: string) => void }) {
  const projectsMap = useStore((s) => s.projects);
  const stageRuns = useStore((s) => s.stageRuns);
  const projects = Object.values(projectsMap).sort((a, b) => b.createdAt - a.createdAt);
  const runsForProject = (pid: string) => Object.values(stageRuns).filter((r) => r.projectId === pid);

  const active = projects[0];
  const activeRuns = active ? runsForProject(active.id) : [];
  const method = active ? reg.methods.find((m) => m.id === active.methodId) : null;
  const stageCount = method?.stage_count || method?.stages?.length || 6;
  const doneIds = new Set(activeRuns.map((r) => r.stageId));
  const stages = method?.stages || [];
  const currentIdx = Math.min(doneIds.size, Math.max(0, stageCount - 1));
  const currentStage = stages[currentIdx] || stages[stages.length - 1];
  const rail: RailStage[] = Array.from({ length: Math.min(6, stageCount || 6) }, (_, i) => {
    const st = stages[i];
    const id = st?.id || `s${i + 1}`;
    const label = st?.name || `${i + 1}단계`;
    let status: RailStage["status"] = "todo";
    if (doneIds.has(id) || i < doneIds.size) status = "done";
    else if (i === currentIdx) status = "current";
    return { id, label, status };
  });

  const why = active
    ? currentStage
      ? `「${currentStage.name}」 단계입니다. ${activeRuns.length}개 실행 기록이 있습니다. 이어서 작업을 이어가세요.`
      : `프로젝트 「${active.title}」을 이어서 진행할 수 있습니다.`
    : "아직 진행 중인 프로젝트가 없습니다. 방법 찾기로 후보를 고른 뒤 프로젝트를 시작하세요.";

  return (
    <div>
      <h1 className="ty-title mb-1">홈</h1>
      <p className="ty-small text-ink-3 mb-4">내 연구의 멈춘 지점과 다음 행동만 보여 줍니다.</p>

      <div className="card mb-4" style={{ borderColor: "var(--brand)" }}>
        <div className="ty-label mb-2" style={{ color: "var(--brand-ink)" }}>이어서 하기</div>
        {active ? (
          <>
            <h2 className="ty-section mb-1">{active.title}</h2>
            <p className="ty-small text-ink-2 mb-1">{active.methodName}</p>
            <p className="ty-body text-ink-2 mb-3">{why}</p>
            <StageRail
              stages={rail}
              onSelect={(id) => nav(`project/${active.id}` /* stage deep-link kept simple */)}
            />
            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" className="btn btn-primary" onClick={() => nav(`project/${active.id}`)}>
                이 단계 계속하기
              </button>
              <button type="button" className="btn" onClick={() => nav("projects")}>
                프로젝트 목록
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 ty-small text-ink-2">
              <div className="rounded-[10px] p-3" style={{ background: "var(--wash)" }}>
                <div className="ty-label text-ink-3">실행 기록</div>
                <div className="ty-subhead">{activeRuns.length}</div>
              </div>
              <div className="rounded-[10px] p-3" style={{ background: "var(--wash)" }}>
                <div className="ty-label text-ink-3">완료 단계</div>
                <div className="ty-subhead">{doneIds.size}/{stageCount}</div>
              </div>
              <div className="rounded-[10px] p-3" style={{ background: "var(--wash)" }}>
                <div className="ty-label text-ink-3">마지막 작업</div>
                <div className="ty-subhead" style={{ fontSize: "var(--fs-small)" }}>
                  {new Date(active.createdAt).toLocaleDateString("ko-KR")}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="ty-section mb-2">연구를 시작할 준비가 됐습니다</h2>
            <p className="ty-body text-ink-2 mb-4">{why}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={() => nav("find")}>
                방법 찾기
              </button>
              <button type="button" className="btn" onClick={() => nav("library")}>
                방법 라이브러리
              </button>
            </div>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-3.5 mb-4">
        <div className="card">
          <h3 className="ty-subhead mb-3">내 연구 프로젝트</h3>
          {projects.length ? (
            projects.slice(0, 6).map((p) => {
              const n = runsForProject(p.id).length;
              const m = reg.methods.find((x) => x.id === p.methodId);
              const total = m?.stage_count || 6;
              const pct = Math.min(100, Math.round((n / Math.max(1, total)) * 100));
              return (
                <button
                  key={p.id}
                  type="button"
                  className="w-full text-left py-2.5"
                  style={{ borderBottom: "1px solid var(--line)" }}
                  onClick={() => nav("project/" + p.id)}
                >
                  <div className="flex justify-between gap-2">
                    <strong className="ty-small">{p.title}</strong>
                    <span className="ty-label text-ink-3">{pct}%</span>
                  </div>
                  <div className="ty-label text-ink-3 mt-0.5">{p.methodName}</div>
                  <div className="match-bar mt-1.5"><span style={{ width: `${pct}%` }} /></div>
                </button>
              );
            })
          ) : (
            <p className="ty-small text-ink-3">아직 프로젝트가 없습니다.</p>
          )}
          <button type="button" className="btn btn-sm mt-3" onClick={() => nav("projects")}>
            모두 보기
          </button>
        </div>

        <div className="card">
          <h3 className="ty-subhead mb-3">다음에 할 일</h3>
          <ul className="space-y-2 ty-small text-ink-2">
            <li>
              <button type="button" className="btn w-full justify-start" onClick={() => nav("find")}>
                방법 찾기 — 3문항으로 후보 받기
              </button>
            </li>
            <li>
              <button type="button" className="btn w-full justify-start" onClick={() => nav("library")}>
                방법 라이브러리 — 목록·지도·절차·사례
              </button>
            </li>
            <li>
              <button type="button" className="btn w-full justify-start" onClick={() => nav("tools/charts")}>
                그래프 그리기 — 결과 시각화
              </button>
            </li>
          </ul>
        </div>
      </div>

      <section className="mt-8 max-[767px]:mt-5 flex flex-col items-center w-full pb-2">
        <p className="text-center text-[14px] text-ink-3 max-[767px]:text-[12px] px-2 max-w-[640px]">
          방법 찾기 · 라이브러리 · 설문 · 코딩 · 통계 · 그래프
        </p>
        <p className="mt-2.5 max-[767px]:mt-2 text-center text-[18px] max-[767px]:text-[16px] font-semibold text-ink leading-snug">
          어떤 작업부터 시작할까요?
        </p>
        {/* renew-18: 제목과 오브가 겹치지 않도록 슬롯 위에 충분한 간격 */}
        <div className="mt-8 max-[767px]:mt-6 flex flex-col items-center w-full">
          <div
            data-orb-slot
            aria-hidden
            className="w-[192px] h-[192px] sm:w-[200px] sm:h-[200px] max-[767px]:w-[144px] max-[767px]:h-[144px]"
          />
          <div
            className="h-[40px] max-[767px]:h-[calc(var(--imm-tabbar,62px)+env(safe-area-inset-bottom,0px)+28px)] lg:h-[36px]"
            aria-hidden
          />
        </div>
      </section>
    </div>
  );
}
