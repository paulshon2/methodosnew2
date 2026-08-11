// Global Store — Zustand (RDOS-v14 패턴). store.js 의 projects/stageRuns/settings 를 이식.
// Supabase 미설정 시 localStorage 영속(오프라인 우선 · Hybrid Sync).
// v57: 전체 메뉴 분석·결과(menuArtifacts)를 .mos / 자동저장에 포함
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Project, StageRun, Settings } from "@/lib/types";
import {
  emptyMenuArtifacts,
  type MenuArtifacts,
  type BasicStatsSession,
  type SurveySession,
  type VizSession,
  type RecommendSession,
  type MethodWritingDoc,
} from "@/lib/menu-artifacts";

function hash(obj: any): string {
  const s = JSON.stringify(obj || {});
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return "k" + (h >>> 0).toString(36);
}
const uid = () => "p_" + Math.random().toString(36).slice(2, 10);

/** localStorage QuotaExceeded 방어 + 초대형 raw 축약 */
function safeLocalStorage(): Storage {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as Storage;
  }
  const raw = window.localStorage;
  return {
    getItem: (k) => raw.getItem(k),
    setItem: (k, v) => {
      try {
        raw.setItem(k, v);
      } catch (e: any) {
        // QuotaExceeded: 코딩 원자료·세그먼트를 축약한 재시도
        if (e?.name === "QuotaExceededError" || e?.code === 22) {
          try {
            const parsed = JSON.parse(v);
            const state = parsed?.state || parsed;
            if (state?.cmqProject) {
              const cmq = { ...state.cmqProject };
              if (typeof cmq.raw === "string" && cmq.raw.length > 80000) {
                cmq.raw = cmq.raw.slice(0, 80000) + "\n…[자동저장: 용량 초과로 원자료 축약]";
              }
              if (Array.isArray(cmq.segments) && cmq.segments.length > 800) {
                cmq.segments = cmq.segments.slice(0, 800);
              }
              if (Array.isArray(cmq.coded) && cmq.coded.length > 800) {
                cmq.coded = cmq.coded.slice(0, 800);
              }
              state.cmqProject = cmq;
              const slim = parsed?.state ? { ...parsed, state } : state;
              raw.setItem(k, JSON.stringify(slim));
              return;
            }
          } catch { /* fall through */ }
          try { raw.removeItem("methodos.autosave.v1"); } catch { /* noop */ }
          console.warn("[MethodOS] localStorage quota — autosave trimmed");
        } else {
          throw e;
        }
      }
    },
    removeItem: (k) => raw.removeItem(k),
    clear: () => raw.clear(),
    key: (i) => raw.key(i),
    get length() { return raw.length; },
  } as Storage;
}

interface AppState {
  projects: Record<string, Project>;
  stageRuns: Record<string, StageRun>;
  settings: Settings;
  // TX-002 자동화 파이프라인 산출물 (projectId → {corpus,units,sample,codebook,coding,...})
  caPipelines: Record<string, Record<string, any>>;
  // v48: 저장된 프로젝트의 표시 이름(나의 워크스페이스 옆에 노출)
  currentProjectName?: string;
  // v48: 코딩 스튜디오 프로젝트(경량 스냅샷 — 저장/불러오기 대상)
  cmqProject?: any;
  // v57: 전체 메뉴 분석·결과 (기본통계·설문·시각화·추천·연구방법작성)
  menuArtifacts: MenuArtifacts;
  // v50: 자동저장 상태
  lastAutoSavedAt?: number;
  autoSaveEnabled?: boolean;
  /** v57: .mos 불러오기 시 증가 — UI hydrate 트리거 */
  workspaceEpoch?: number;

  createProject: (methodId: string, methodName: string, title?: string) => Project;
  listProjects: () => Project[];
  getProject: (id: string) => Project | undefined;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  getCa: (pid: string) => Record<string, any>;
  setCa: (pid: string, patch: Record<string, any>) => void;
  clearCa: (pid: string) => void;

  recordRun: (projectId: string, stageId: string, mode: string, inputs: any, outputs: any, validation: any) => StageRun;
  runsForProject: (pid: string) => StageRun[];
  runsForStage: (pid: string, sid: string) => StageRun[];
  latestRun: (pid: string, sid: string) => StageRun | null;
  artifacts: (pid: string) => any[];

  setSetting: (k: keyof Settings, v: any) => void;
  setCurrentProjectName: (name: string) => void;
  setCmqProject: (proj: any) => void;
  setMenuArtifacts: (patch: Partial<MenuArtifacts>) => void;
  setBasicStatsSession: (moduleId: string, session: BasicStatsSession) => void;
  setSurveySession: (session: SurveySession) => void;
  setVizSession: (key: string, session: VizSession) => void;
  setRecommendSession: (session: RecommendSession) => void;
  setMethodWriting: (doc: MethodWritingDoc) => void;
  touchAutoSave: () => void;
  setAutoSaveEnabled: (on: boolean) => void;
  reset: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: {},
      stageRuns: {},
      caPipelines: {},
      settings: { theme: "glass", provider: "google", model: "gemini-2.5-flash", keys: {} },
      currentProjectName: "",
      cmqProject: undefined,
      menuArtifacts: emptyMenuArtifacts(),
      lastAutoSavedAt: undefined,
      autoSaveEnabled: true,
      workspaceEpoch: 0,

      createProject(methodId, methodName, title) {
        const id = uid();
        const p: Project = { id, methodId, methodName, title: title || methodName, status: "active", createdAt: Date.now(), currentStage: 0 };
        set((s) => ({ projects: { ...s.projects, [id]: p }, currentProjectName: p.title }));
        return p;
      },
      listProjects() { return Object.values(get().projects).sort((a, b) => b.createdAt - a.createdAt); },
      getProject(id) { return get().projects[id]; },
      updateProject(id, patch) { set((s) => ({ projects: { ...s.projects, [id]: { ...s.projects[id], ...patch } } })); },
      deleteProject(id) {
        set((s) => {
          const projects = { ...s.projects }; delete projects[id];
          const stageRuns = { ...s.stageRuns };
          Object.keys(stageRuns).forEach((k) => { if (stageRuns[k].projectId === id) delete stageRuns[k]; });
          const caPipelines = { ...s.caPipelines }; delete caPipelines[id];
          return { projects, stageRuns, caPipelines };
        });
      },
      getCa(pid) { return get().caPipelines[pid] || {}; },
      setCa(pid, patch) { set((s) => ({ caPipelines: { ...s.caPipelines, [pid]: { ...(s.caPipelines[pid] || {}), ...patch } } })); },
      clearCa(pid) { set((s) => { const caPipelines = { ...s.caPipelines }; delete caPipelines[pid]; return { caPipelines }; }); },
      recordRun(projectId, stageId, mode, inputs, outputs, validation) {
        const ik = hash({ stageId, inputs });
        const key = `${projectId}::${stageId}::${ik}`;
        const prev = get().stageRuns[key];
        const version = prev ? prev.version : get().runsForStage(projectId, stageId).length + 1;
        const run: StageRun = { id: key, projectId, stageId, mode, idempotencyKey: ik, inputs, outputs, validation, version, createdAt: Date.now() };
        set((s) => ({ stageRuns: { ...s.stageRuns, [key]: run } }));
        return run;
      },
      runsForProject(pid) { return Object.values(get().stageRuns).filter((r) => r.projectId === pid); },
      runsForStage(pid, sid) { return Object.values(get().stageRuns).filter((r) => r.projectId === pid && r.stageId === sid); },
      latestRun(pid, sid) { return get().runsForStage(pid, sid).sort((a, b) => b.createdAt - a.createdAt)[0] || null; },
      artifacts(pid) {
        const out: any[] = [];
        get().runsForProject(pid).forEach((r) =>
          Object.entries(r.outputs || {}).forEach(([k, v]) =>
            out.push({ stageId: r.stageId, key: k, value: v, mode: r.mode, version: r.version, at: r.createdAt })));
        return out;
      },
      setSetting(k, v) { set((s) => ({ settings: { ...s.settings, [k]: v } })); },
      setCurrentProjectName(name) { set({ currentProjectName: String(name || "") }); },
      setCmqProject(proj) { set({ cmqProject: proj }); },
      setMenuArtifacts(patch) {
        set((s) => ({
          menuArtifacts: {
            ...emptyMenuArtifacts(),
            ...(s.menuArtifacts || {}),
            ...patch,
            basicStats: patch.basicStats ?? s.menuArtifacts?.basicStats ?? {},
            viz: patch.viz ?? s.menuArtifacts?.viz ?? {},
            misc: patch.misc ?? s.menuArtifacts?.misc ?? {},
          },
        }));
      },
      setBasicStatsSession(moduleId, session) {
        set((s) => {
          const ma = s.menuArtifacts || emptyMenuArtifacts();
          return {
            menuArtifacts: {
              ...ma,
              basicStats: { ...ma.basicStats, [moduleId]: { ...session, moduleId, updatedAt: session.updatedAt || Date.now() } },
            },
          };
        });
      },
      setSurveySession(session) {
        set((s) => {
          const ma = s.menuArtifacts || emptyMenuArtifacts();
          return { menuArtifacts: { ...ma, survey: { ...session, updatedAt: session.updatedAt || Date.now() } } };
        });
      },
      setVizSession(key, session) {
        set((s) => {
          const ma = s.menuArtifacts || emptyMenuArtifacts();
          return {
            menuArtifacts: {
              ...ma,
              viz: { ...ma.viz, [key]: { ...session, updatedAt: session.updatedAt || Date.now() } },
            },
          };
        });
      },
      setRecommendSession(session) {
        set((s) => {
          const ma = s.menuArtifacts || emptyMenuArtifacts();
          return { menuArtifacts: { ...ma, recommend: { ...session, updatedAt: session.updatedAt || Date.now() } } };
        });
      },
      setMethodWriting(doc) {
        set((s) => {
          const ma = s.menuArtifacts || emptyMenuArtifacts();
          return { menuArtifacts: { ...ma, methodWriting: { ...doc, updatedAt: doc.updatedAt || Date.now() } } };
        });
      },
      touchAutoSave() { set({ lastAutoSavedAt: Date.now() }); },
      setAutoSaveEnabled(on) { set({ autoSaveEnabled: !!on }); },
      reset() {
        // v48: 완전 초기화 — 로컬 스토리지의 지속 상태까지 제거해 재로드 시에도 유지
        try {
          if (typeof window !== "undefined") {
            localStorage.removeItem("methodos.v1");
            localStorage.removeItem("methodos.autosave.v1");
            ["methodos.cmq", "methodos.srm"].forEach((k) => {
              try { localStorage.removeItem(k); } catch { /* noop */ }
            });
          }
        } catch { /* noop */ }
        set({
          projects: {},
          stageRuns: {},
          caPipelines: {},
          currentProjectName: "",
          cmqProject: undefined,
          menuArtifacts: emptyMenuArtifacts(),
          lastAutoSavedAt: undefined,
          autoSaveEnabled: true,
          settings: { theme: "glass", provider: "google", model: "gemini-2.5-flash", keys: {} } as Settings,
        });
      },
    }),
    {
      name: "methodos.v1",
      storage: createJSONStorage(() => safeLocalStorage()),
      partialize: (s) => ({
        projects: s.projects,
        stageRuns: s.stageRuns,
        caPipelines: s.caPipelines,
        settings: s.settings,
        currentProjectName: s.currentProjectName,
        cmqProject: s.cmqProject,
        menuArtifacts: s.menuArtifacts,
        lastAutoSavedAt: s.lastAutoSavedAt,
        autoSaveEnabled: s.autoSaveEnabled,
      }),
    }
  )
);
