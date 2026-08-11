"use client";
/**
 * 방법 라이브러리 · 지도로 보기
 *
 * "내 연구에는 어떤 방법이 맞는가, 그리고 그건 어디쯤 있는 방법인가"에 답한다.
 * 데이터 로딩과 상태는 여기(컨테이너)에만 두고, 표현은 method-map/* 로 내린다.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import Workspace from "@/components/ui/Workspace";
import { useKeyboard } from "@/hooks/useKeyboard";
import { EMPTY_FILTERS, applyFilters, matchesQuery, type Filters } from "@/lib/method-filter";
import { METHOD_BY_ID, type Method } from "@/lib/method-map-catalog";
import { LAYERS, parseSysDoc, type Layer, type NormalizedSystem } from "@/lib/method-system-normalize";
import LibraryLensTabs from "./library-lens";
import { ErrorRetry, PageSkeleton } from "./ui-states";
import ApproachView from "./method-map/ApproachView";
import CompareTray from "./method-map/CompareTray";
import GenealogyView from "./method-map/GenealogyView";
import MethodFilterRail from "./method-map/MethodFilterRail";
import MethodInspector from "./method-map/MethodInspector";
import ProcessView from "./method-map/ProcessView";
import SystemMapView from "./method-map/SystemMapView";
import ValidityView from "./method-map/ValidityView";

export default function MethodSystem({ nav }: { nav: (r: string) => void }) {
  const [doc, setDoc] = useState<NormalizedSystem | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [layer, setLayer] = useState<Layer>("map");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [cmp, setCmp] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(() => {
    setErr(null);
    setDoc(null);
    fetch("method-system.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((raw) => {
        const parsed = parseSysDoc(raw);
        if (!parsed) {
          setErr("방법 지도 파일의 형식이 예상과 다릅니다. version · source · intro · sections 네 키가 필요합니다.");
          return;
        }
        setDoc(parsed);
      })
      .catch(() => setErr("방법 지도 데이터를 불러오지 못했습니다."));
  }, []);

  useEffect(() => { load(); }, [load]);

  const methods: Method[] = doc?.methods ?? [];
  const shown = useMemo(() => applyFilters(methods, filters), [methods, filters]);
  const shownIds = useMemo(() => new Set(shown.map((m) => m.id)), [shown]);
  const dimmed = useMemo(() => new Set(methods.filter((m) => !shownIds.has(m.id)).map((m) => m.id)), [methods, shownIds]);
  const hits = useMemo(() => new Set(q.trim() ? methods.filter((m) => matchesQuery(m, q)).map((m) => m.id) : []), [methods, q]);
  const selected = sel ? METHOD_BY_ID[sel] ?? null : null;

  const select = useCallback((id: string) => setSel(id), []);
  const toggleCompare = useCallback((id: string) => {
    setCmp((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 3 ? c : [...c, id]));
  }, []);

  const move = useCallback(
    (delta: number) => {
      const list = shown.length ? shown : methods;
      if (list.length === 0) return;
      const i = list.findIndex((m) => m.id === sel);
      const next = i < 0 ? 0 : (i + delta + list.length) % list.length;
      setSel(list[next].id);
    },
    [shown, methods, sel]
  );

  useKeyboard({
    ArrowDown: (e) => { e.preventDefault(); move(1); },
    ArrowUp: (e) => { e.preventDefault(); move(-1); },
    c: () => { if (sel) toggleCompare(sel); },
    C: () => { if (sel) toggleCompare(sel); },
    Escape: () => setSel(null),
    "/": (e) => { e.preventDefault(); searchRef.current?.focus(); },
  });

  if (err) return <ErrorRetry message={err} onRetry={load} onHome={() => nav("home")} />;
  if (!doc) return <PageSkeleton />;

  const topbar = (
    <div className="card flex flex-wrap items-center gap-3 py-3">
      <div className="relative min-w-[220px] flex-1">
        <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          ref={searchRef}
          className="inp pl-9"
          type="search"
          placeholder="방법 이름·영문명·정의로 찾기  (단축키 /)"
          aria-label="방법 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {(q || dimmed.size > 0) && (
        <button type="button" className="btn btn-sm" onClick={() => { setQ(""); setFilters(EMPTY_FILTERS); }}>
          검색·필터 초기화
        </button>
      )}
      <button type="button" className="btn btn-sm btn-primary" onClick={() => nav("library")}>
        방법 목록으로
      </button>
    </div>
  );

  const tabs = (
    <div role="tablist" aria-label="방법 지도 단계" className="mb-4 flex gap-1 overflow-x-auto" style={{ borderBottom: "1px solid var(--color-border-tertiary)" }}>
      {LAYERS.map((l) => {
        const on = l.id === layer;
        return (
          <button
            key={l.id}
            id={`layer-tab-${l.id}`}
            role="tab"
            type="button"
            aria-selected={on}
            aria-controls={`layer-panel-${l.id}`}
            onClick={() => setLayer(l.id)}
            className="flex items-center gap-2 whitespace-nowrap px-3 pb-2.5 pt-2"
            style={{
              borderBottom: `2px solid ${on ? "var(--brand)" : "transparent"}`,
              color: on ? "var(--brand-ink)" : "var(--color-text-tertiary)",
              fontSize: "var(--fs-small)",
              fontWeight: on ? 800 : 600,
            }}
          >
            <span
              className={on ? "g-fill grid h-5 w-5 place-items-center rounded-full text-[11px] font-extrabold text-white" : "grid h-5 w-5 place-items-center rounded-full text-[11px] font-extrabold"}
              style={on ? undefined : { background: "var(--color-background-tertiary)", color: "var(--color-text-secondary)" }}
            >
              {l.n}
            </span>
            {l.label}
          </button>
        );
      })}
    </div>
  );

  const current = LAYERS.find((l) => l.id === layer)!;
  const body =
    layer === "lineage" ? (
      <GenealogyView methods={methods} selected={sel} dimmed={dimmed} onSelect={select} sections={doc.byLayer.lineage} />
    ) : layer === "map" ? (
      <SystemMapView methods={methods} selected={sel} dimmed={dimmed} hits={hits} onSelect={select} sections={doc.byLayer.map} />
    ) : layer === "approach" ? (
      <ApproachView sections={doc.byLayer.approach} />
    ) : layer === "process" ? (
      <ProcessView
        method={selected}
        sourceSteps={sel ? doc.sourceProcess[sel] ?? [] : []}
        auxSections={doc.byLayer.process.filter((s) => !s.id.startsWith("04_"))}
        onGoMap={() => setLayer("map")}
      />
    ) : (
      <ValidityView sections={doc.byLayer.validity} />
    );

  const main = (
    <div>
      <h1 className="ty-title mb-1">지도로 보기</h1>
      <p className="ty-body mb-4 text-ink-2 prose-w">{doc.intro}</p>
      {tabs}
      <section id={`layer-panel-${layer}`} role="tabpanel" aria-labelledby={`layer-tab-${layer}`} className="anim-panel">
        <p className="ty-small mb-3 text-ink-3">{current.question}</p>
        {body}
      </section>
    </div>
  );

  return (
    <div>
      <LibraryLensTabs active="map" nav={nav} />
      <Workspace
        topbar={topbar}
        rail={<MethodFilterRail filters={filters} onChange={setFilters} shown={shown.length} total={methods.length} />}
        railTitle="조건으로 좁히기"
        main={main}
        inspector={
          <MethodInspector
            method={selected}
            inCompare={!!sel && cmp.includes(sel)}
            onToggleCompare={() => sel && toggleCompare(sel)}
            onSelect={select}
            onGoProcess={() => setLayer("process")}
          />
        }
        inspectorTitle="방법 상세"
        statusbar={
          <>
            <span>
              섹션 <strong className="num">{doc.counts.sections}</strong>개 · 행 <strong className="num">{doc.counts.rows}</strong>개 전부 표시
            </span>
            <span>
              조건 통과 <strong className="num">{shown.length}</strong> / {methods.length}
            </span>
            {q ? <span>검색 일치 <strong className="num">{hits.size}</strong></span> : null}
            <span className="text-ink-3">↑↓ 이동 · Enter 선택 · C 비교함 · Esc 해제 · / 검색</span>
          </>
        }
      />
      <CompareTray ids={cmp} onRemove={(id) => setCmp((c) => c.filter((x) => x !== id))} onClear={() => setCmp([])} />
    </div>
  );
}
