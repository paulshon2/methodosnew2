/**
 * Methodos 작업 상태 — 분석 실행 · 그래프 그리기 · 통계분석결과 · 통계방법 라이브러리가 함께 쓴다.
 * 불러온 자료는 메모리에만 두고(서버로 보내지 않는다), 결과 기록은 이 브라우저(localStorage)에 남긴다.
 */
import { create } from "zustand";
import type { MResult } from "./types";

export interface RunRecord {
  id: string;
  at: string;
  code: string;
  name: string;
  source: string; // 자료 이름 또는 예제 이름
  ms: number;
  slots: Record<string, string[]>;
  options: Record<string, any>;
  result: MResult;
}

interface MethodosSession {
  csv: string;
  fileLabel: string;
  current: RunRecord | null;
  history: RunRecord[];
  setData: (csv: string, label: string) => void;
  addRun: (r: Omit<RunRecord, "id" | "at">) => RunRecord;
  open: (id: string) => void;
  remove: (id: string) => void;
  clearHistory: () => void;
}

const KEY = "methodos.web.history.v1";
const MAX = 30;

function load(): RunRecord[] {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function save(h: RunRecord[]) {
  try {
    let list = h;
    for (;;) {
      try { localStorage.setItem(KEY, JSON.stringify(list)); return; } catch (e) { if (list.length <= 1) return; list = list.slice(0, Math.floor(list.length / 2)); void e; }
    }
  } catch { /* 저장 공간이 막힌 브라우저 — 이번 접속에서만 유지 */ }
}

export const useMethodosSession = create<MethodosSession>((set, get) => ({
  csv: "",
  fileLabel: "",
  current: null,
  history: [],
  setData: (csv, label) => set({ csv, fileLabel: label }),
  addRun: (r) => {
    const rec: RunRecord = { ...r, id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString() };
    const history = [rec, ...get().history].slice(0, MAX);
    save(history);
    set({ current: rec, history });
    return rec;
  },
  open: (id) => { const rec = get().history.find((h) => h.id === id); if (rec) set({ current: rec }); },
  remove: (id) => { const history = get().history.filter((h) => h.id !== id); save(history); set({ history, current: get().current?.id === id ? history[0] ?? null : get().current }); },
  clearHistory: () => { save([]); set({ history: [], current: null }); },
}));

/** 브라우저에 남은 기록을 불러온다(서버 렌더와 어긋나지 않게 마운트 뒤에 한 번). */
export function hydrateMethodosHistory() {
  const h = load();
  if (h.length && useMethodosSession.getState().history.length === 0) useMethodosSession.setState({ history: h, current: useMethodosSession.getState().current ?? h[0] });
}
