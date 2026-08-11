"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Calculator,
  ClipboardList,
  Crown,
  FolderKanban,
  Home,
  Menu,
  PenLine,
  Settings as Cog,
  Tags,
  Target,
} from "lucide-react";
import { useRegistry } from "@/lib/use-registry";
import { useStore } from "@/store/app-store";
import { routeAllowed } from "@/lib/menu-catalog";
import { clerkConfiguredClient } from "@/lib/clerk-client";
import { isSuperAdminEmail } from "@/lib/admin-config";
import MethodOrbitAssistant from "@/components/assistant/method-orbit-assistant";
import Dashboard from "./dashboard";
import Methods from "./methods";
import MethodDetail from "./method-detail";
import MethodSystem from "./method-system";
import Recommend from "./recommend";
import ProjectStage from "./project-stage";
import SettingsView from "./settings";
import VizView from "./viz";
import VizType from "./viz-type";
import VizStudio from "./viz-studio";
import DataVizStudio from "./viz/VizStudio";
import Projects from "./projects";
import MethodProcessHub from "./method-process-hub";
import MethodProcessStages from "./method-process-stages";
import MethodProcessCommon from "./method-process-common";
import AdminMembers from "./admin-members";
import SrmSurveyStudio from "./srm-survey-studio";
import SurveyStudio from "./survey/SurveyStudio";
import CmqCodingStudio from "./cmq-coding-studio";
import CodingStudio from "./coding/CodingStudio";
import BasicStatsStudio from "./basic-stats-studio";
import GoalStatsStudio from "./stats/BasicStatsStudio";
import MethodWritingStudio from "./method-writing-studio";
import ArchetypeHub from "./archetype-hub";
import ArchetypeOverview from "./archetype-overview";
import ArchetypeGlossary from "./archetype-glossary";
import ArchetypeProjects from "./archetype-projects";
import ArchetypePractice from "./archetype-practice";
import ArchetypePracticeArchetype from "./archetype-practice-archetype";
import ArchetypePracticeMethod from "./archetype-practice-method";
import ArchetypePracticeTopic from "./archetype-practice-topic";
import ArchetypeDetail from "./archetype-detail";
import ArchetypeStageView from "./archetype-stage";
import ArchetypeTaskView from "./archetype-task";
import ProjectSavePanel from "./project-save-panel";
import { ClerkIdentityBridge } from "./clerk-identity-bridge";
import { useAnnotation, AnnotationPanel } from "./annotations";
import Breadcrumb from "./breadcrumb";
import LibraryLensTabs from "./library-lens";
import { LockedPanel, NotFoundPanel, PageSkeleton } from "./ui-states";

type NavLeaf = { id: string; label: string; icon: typeof Home };
type NavSec = { sec: string };
type Gate = { title: string; howToUnlock: string; availableNow: string };

const NAV: (NavLeaf | NavSec)[] = [
  { sec: "내 연구" },
  { id: "home", label: "홈", icon: Home },
  { id: "projects", label: "내 연구 프로젝트", icon: FolderKanban },
  { sec: "방법 정하기" },
  { id: "find", label: "방법 찾기", icon: Target },
  { id: "library", label: "방법 라이브러리", icon: BookOpen },
  { sec: "작업하기" },
  { id: "tools/survey", label: "설문 만들기", icon: ClipboardList },
  { id: "tools/coding", label: "코딩·분류", icon: Tags },
  { id: "tools/stats", label: "통계 계산", icon: Calculator },
  { id: "tools/charts", label: "그래프 그리기", icon: BarChart3 },
  { id: "tools/writing", label: "원고 쓰기", icon: PenLine },
  { sec: "계정" },
  { id: "settings", label: "설정", icon: Cog },
];

const TABS = [
  ["home", Home, "홈"],
  ["projects", FolderKanban, "프로젝트"],
  ["library", BookOpen, "라이브러리"],
  ["tools/charts", BarChart3, "그래프"],
  ["settings", Cog, "설정"],
] as const;

/** 기본 테마. 설정을 저장한 적이 없는 사용자는 이 값으로 본다. */
export const DEFAULT_THEME = "glass";

export function applyTheme(t?: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  ["theme-glass", "theme-midnight", "theme-charcoal", "theme-black"].forEach((c) => root.classList.remove(c));
  const name = t || DEFAULT_THEME;
  if (name !== "light") root.classList.add("theme-" + name);
}

export function normalizeRoute(route: string): string {
  const raw = route.replace(/^#\/?/, "").trim().replace(/^\/+|\/+$/g, "");
  if (!raw || raw === "index" || raw === "index.html" || raw === "dashboard" || raw === "home") return "home";
  if (raw === "recommend") return "find";
  if (raw === "methods") return "library";
  if (raw === "system") return "library/map";
  if (raw === "process" || raw.startsWith("process/")) return `library/flow${raw.slice("process".length)}`;
  if (raw === "archetype" || raw.startsWith("archetype/")) return `library/cases${raw.slice("archetype".length)}`;
  if (raw.startsWith("method/")) return `library/method/${raw.slice("method/".length)}`;
  if (raw === "survey" || raw.startsWith("survey/")) return `tools/survey${raw.slice("survey".length)}`;
  if (raw === "coding" || raw.startsWith("coding/")) return `tools/coding${raw.slice("coding".length)}`;
  if (raw === "basic-stats" || raw.startsWith("basic-stats/")) return `tools/stats${raw.slice("basic-stats".length)}`;
  if (raw === "viz") return "tools/charts";
  if (raw.startsWith("viztype/")) return `tools/charts/type/${raw.slice("viztype/".length)}`;
  if (raw.startsWith("vizmake/")) return `tools/charts/make/${raw.slice("vizmake/".length)}`;
  if (raw === "viztype") return "tools/charts";
  if (raw === "vizmake") return "tools/charts";
  if (raw === "method-writing" || raw.startsWith("method-writing/")) return `tools/writing${raw.slice("method-writing".length)}`;
  return raw;
}

function routeFromHash(): string {
  if (typeof window === "undefined") return "home";
  return normalizeRoute(decodeURIComponent(window.location.hash || ""));
}

export default function AppShell() {
  const reg = useRegistry();
  const theme = useStore((s) => s.settings.theme);
  const [route, setRoute] = useState("home");
  const [navOpen, setNavOpen] = useState(false);
  const [gate, setGate] = useState<Gate | null>(null);
  const { clear } = useAnnotation();
  const [allowed, setAllowed] = useState<Set<string> | null>(null);
  const [allowedMethods, setAllowedMethods] = useState<Set<string> | null>(null);
  const [allowedCharts, setAllowedCharts] = useState<Set<string> | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [identity, setIdentity] = useState({ name: "사용자", email: "", id: "" });

  const onClerkIdentity = useCallback((info: { email: string; name: string; userId: string; isAdmin: boolean }) => {
    setIdentity({ name: info.name || "사용자", email: info.email, id: info.userId });
    if (info.isAdmin || isSuperAdminEmail(info.email)) setIsAdmin(true);
    else if (clerkConfiguredClient()) setIsAdmin(false);
  }, []);

  useEffect(() => applyTheme(theme), [theme]);
  useEffect(() => {
    const sync = () => {
      setRoute(routeFromHash());
      setGate(null);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  useEffect(() => {
    fetch("/api/permissions/me")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.menus)) setAllowed(new Set(d.menus));
        else if (Array.isArray(d.allowed)) setAllowed(new Set(d.allowed.filter((c: string) => String(c).startsWith("menu."))));
        if (Array.isArray(d.methods)) setAllowedMethods(new Set(d.methods));
        setAllowedCharts(Array.isArray(d.charts) && d.charts.length > 0 ? new Set(d.charts) : null);
        if (typeof d.isAdmin === "boolean") setIsAdmin(d.isAdmin);
        if (d.email || d.userId) {
          setIdentity({ name: d.name || d.email?.split("@")[0] || "사용자", email: d.email || "", id: d.userId || "" });
        }
      })
      .catch(() => {
        setAllowed(null);
        setAllowedMethods(null);
        setAllowedCharts(null);
      });
  }, []);

  const canMethod = (id: string) =>
    !allowedMethods ||
    (id.startsWith("V61-") && ![...allowedMethods].some((x) => String(x).startsWith("V61-"))) ||
    allowedMethods.has(id);
  const canChart = (id: string) => !allowedCharts || allowedCharts.size === 0 || allowedCharts.has(id);
  const showLocked = (title: string) =>
    setGate({
      title,
      howToUnlock: "관리자·상위 등급에서 메뉴를 허용해야 합니다.",
      availableNow: "홈 · 설정은 사용할 수 있습니다.",
    });

  const nav = (target: string) => {
    clear();
    const next = normalizeRoute(target);
    const parts = next.split("/");
    if (parts[0] === "admin" && !isAdmin) return showLocked("관리자");
    if (!routeAllowed(next, allowed)) return showLocked("요청한 메뉴");
    if (parts[0] === "library" && parts[1] === "method" && parts[2] && !canMethod(decodeURIComponent(parts[2]))) {
      return showLocked("연구방법");
    }
    if (parts[0] === "tools" && parts[1] === "charts" && ["type", "make"].includes(parts[2] || "") && parts[3] && !canChart(decodeURIComponent(parts[3]))) {
      return showLocked("그래프");
    }
    setGate(null);
    setRoute(next);
    setNavOpen(false);
    if (typeof window !== "undefined") {
      const hash = `#/${next}`;
      if (window.location.hash !== hash) window.location.hash = hash;
      window.scrollTo(0, 0);
    }
  };

  const parts = route.split("/");
  const [top, arg] = parts;
  // 주석용어(AnnotationPanel)는 프로젝트 화면만 남긴다.
  // 방법 찾기·라이브러리·작업(tools)은 레일을 빼고, 그 폭(약 280px)만큼만 본문을 넓힌다.
  // 이전 tools 의 max-w-[1840px] 는 과도하게 넓어 1480으로 되돌린다.
  const showAnnot = top === "project";
  const contentWide = ["find", "library", "tools"].includes(top);
  const isActive = (itemRoute: string) => {
    const itemParts = itemRoute.split("/");
    if (itemParts[0] === "library") return top === "library";
    return route === itemRoute || route.startsWith(`${itemRoute}/`);
  };
  if (!reg) return <div className="p-10"><PageSkeleton /></div>;

  const lockedView = (
    <LockedPanel
      title={gate?.title || "요청한 메뉴"}
      howToUnlock={gate?.howToUnlock || "관리자·상위 등급에서 메뉴를 허용해야 합니다."}
      availableNow={gate?.availableNow || "홈 · 설정은 사용할 수 있습니다."}
      onGoAvailable={() => nav("settings")}
      onHome={() => nav("home")}
    />
  );
  let view: React.ReactNode;
  if (gate || (!routeAllowed(route, allowed) && top !== "admin")) view = lockedView;
  else if (top === "admin") view = isAdmin ? <AdminMembers preAuthorized={true} /> : lockedView;
  else if (top === "home") view = <Dashboard reg={reg} nav={nav} />;
  else if (top === "find") view = <Recommend reg={reg} nav={nav} allowedMethods={allowedMethods} />;
  else if (top === "projects") view = <Projects reg={reg} nav={nav} />;
  else if (top === "project") view = <ProjectStage reg={reg} pid={arg} nav={nav} />;
  else if (top === "settings") view = <SettingsView nav={nav} />;
  else if (top === "library") {
    const libraryView = parts[1] || "";
    if (!libraryView) view = <Methods reg={reg} nav={nav} allowedMethods={allowedMethods} />;
    else if (libraryView === "map") view = <MethodSystem nav={nav} />;
    else if (libraryView === "method" && parts[2]) {
      const id = decodeURIComponent(parts[2]);
      view = canMethod(id) ? <MethodDetail reg={reg} id={id} nav={nav} /> : lockedView;
    } else if (libraryView === "flow") {
      const flowView = parts[2] || "";
      const process = flowView === "stages" ? <MethodProcessStages nav={nav} /> : flowView === "common" ? <MethodProcessCommon nav={nav} /> : <MethodProcessHub nav={nav} />;
      view = <><LibraryLensTabs active="flow" nav={nav} />{process}</>;
    } else if (libraryView === "cases") {
      const [a1 = "", a2 = "", a3 = "", a4 = "", a5 = "", a6 = ""] = parts.slice(2);
      let cases: React.ReactNode;
      if (a1 === "overview") cases = <ArchetypeOverview nav={nav} />;
      else if (a1 === "glossary") cases = <ArchetypeGlossary nav={nav} />;
      else if (a1 === "projects") cases = <ArchetypeProjects nav={nav} />;
      else if (a1 === "practice" && a2 && a3 === "method" && a4 && a5 === "topic" && a6) {
        cases = <ArchetypePracticeTopic archetypeId={Number(decodeURIComponent(a2))} methodNo={Number(decodeURIComponent(a4))} topicIndex={Number(decodeURIComponent(a6))} nav={nav} />;
      } else if (a1 === "practice" && a2 && a3 === "method" && a4) {
        cases = <ArchetypePracticeMethod archetypeId={Number(decodeURIComponent(a2))} methodNo={Number(decodeURIComponent(a4))} nav={nav} />;
      } else if (a1 === "practice" && a2) cases = <ArchetypePracticeArchetype archetypeId={Number(decodeURIComponent(a2))} nav={nav} />;
      else if (a1 === "practice") cases = <ArchetypePractice nav={nav} />;
      else if (a1 === "project" && a2 && a3 === "stage" && a4) cases = <ArchetypeStageView archetypeId={Number(decodeURIComponent(a2))} stageId={decodeURIComponent(a4)} nav={nav} />;
      else if (a1 === "project" && a2 && a3 === "task" && a4) cases = <ArchetypeTaskView archetypeId={Number(decodeURIComponent(a2))} taskId={decodeURIComponent(a4)} nav={nav} />;
      else if (a1 === "project" && a2) cases = <ArchetypeDetail id={Number(decodeURIComponent(a2))} nav={nav} />;
      else cases = <ArchetypeHub nav={nav} />;
      view = <><LibraryLensTabs active="cases" nav={nav} />{cases}</>;
    } else view = <NotFoundPanel route={route} onHome={() => nav("home")} />;
  } else if (top === "tools") {
    const tool = parts[1] || "";
    const id = parts[3] ? decodeURIComponent(parts[3]) : "";
    // 하위 경로가 없으면 새 설문지 편집 화면, classic은 문항 은행·AI 검토가 붙은 기존 화면.
    if (tool === "survey" && !parts[2]) view = <SurveyStudio nav={nav} />;
    else if (tool === "survey") view = <SrmSurveyStudio nav={nav} />;
    // 하위 경로가 없으면 문장 단위 코딩 화면, classic은 1차·2차 절차와 AI 보조가 붙은 기존 화면.
    else if (tool === "coding" && !parts[2]) view = <CodingStudio nav={nav} />;
    else if (tool === "coding") view = <CmqCodingStudio nav={nav} />;
    // 하위 경로가 없으면 목적 기반 화면, 있으면 검정 코드별 기존 워크벤치.
    else if (tool === "stats" && !parts[2]) view = <GoalStatsStudio nav={nav} />;
    else if (tool === "stats") view = <BasicStatsStudio nav={nav} sub={decodeURIComponent(parts[2])} />;
    else if (tool === "charts" && parts[2] === "type" && id) view = canChart(id) ? <VizType id={id} nav={nav} /> : lockedView;
    else if (tool === "charts" && parts[2] === "make" && id) view = canChart(id) ? <VizStudio id={id} nav={nav} /> : lockedView;
    // 기본은 새 시각화 워크벤치, 그래프 종류 설명 목록은 list 하위 경로.
    else if (tool === "charts" && parts[2] === "list") view = <VizView nav={nav} allowedCharts={allowedCharts} />;
    else if (tool === "charts" && !parts[2]) view = <DataVizStudio nav={nav} />;
    else if (tool === "writing") view = <MethodWritingStudio />;
    else view = <NotFoundPanel route={route} onHome={() => nav("home")} />;
  } else view = <NotFoundPanel route={route} onHome={() => nav("home")} />;

  return (
    <div className="grid min-h-screen lg:grid-cols-[256px_1fr]">
      <ClerkIdentityBridge onIdentity={onClerkIdentity} />
      {navOpen && <div className="fixed inset-0 z-40 bg-black/35 lg:hidden" onClick={() => setNavOpen(false)} />}
      <aside className={`app-aside fixed lg:sticky top-0 z-50 flex h-screen w-[256px] flex-col overflow-y-auto p-4 transition-transform ${navOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center gap-2.5 px-2 pb-3.5">
          <img src="/methodos-logo.png" alt="methodos" className="h-9 w-9 rounded-lg object-contain" style={{ background: "var(--plate)", padding: 2 }} />
          <div><div className="font-semibold text-[16px]" style={{ fontFamily: "var(--font-gothic)", letterSpacing: "-0.01em" }}>methodos</div></div>
        </div>
        <nav className="mt-1.5 flex flex-col gap-0.5">
          {NAV.map((item, index) => "sec" in item ? (
            <div key={index} className="px-2.5 pb-1.5 pt-3.5 text-[10px] uppercase tracking-wider text-ink-3">{item.sec}</div>
          ) : (
            <button key={item.id} type="button" onClick={() => nav(item.id)} className={`flex items-center gap-3 rounded-md px-2.5 py-2.5 text-left text-[13.5px] ${!routeAllowed(item.id, allowed) ? "opacity-40" : ""} ${isActive(item.id) ? "font-semibold" : "text-ink-2"}`} style={isActive(item.id) ? { background: "var(--brand-soft)", color: "var(--brand-ink)" } : {}}>
              <item.icon size={18} /><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-3">
          {isAdmin && <button type="button" onClick={() => nav("admin")} className={`mb-1 flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left text-[13.5px] ${top === "admin" ? "font-semibold" : "text-ink-2"}`}><Crown size={18} className="text-amber-500" /><span>관리자</span></button>}
          <ProjectSavePanel userName={identity.name} userEmail={identity.email} userId={identity.id} loggedIn={!!identity.email} />
          <div className="mt-2 px-2 text-[10.5px] text-ink-3">{reg.method_count}개 방법 · {reg.families.length}계열</div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="app-topbar sticky top-0 z-30 flex items-center gap-3 px-4 py-3 lg:hidden">
          <button type="button" aria-label="메뉴 열기" onClick={() => setNavOpen(true)} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center"><Menu size={22} /></button><strong>methodos</strong>
        </header>
        {showAnnot ? (
          <div className="mx-auto w-full max-w-[1480px] px-4 py-6 pb-24 sm:px-6"><Breadcrumb route={route} nav={nav} /><div className="grid items-start gap-5 xl:grid-cols-[280px_1fr]"><AnnotationPanel /><div className="min-w-0">{view}</div></div></div>
        ) : contentWide ? (
          <div className="mx-auto w-full max-w-[1480px] px-4 py-6 pb-24 sm:px-6"><Breadcrumb route={route} nav={nav} />{view}</div>
        ) : top === "settings" ? (
          <div className="w-full max-w-[1180px] pl-3 pr-5 py-6 pb-28 sm:pl-4 sm:pr-7 lg:mr-auto">
            <Breadcrumb route={route} nav={nav} />
            {view}
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[1180px] px-4 py-6 pb-24 sm:px-8"><Breadcrumb route={route} nav={nav} />{view}</div>
        )}
      </div>
      <nav className="app-tabbar fixed bottom-0 left-0 right-0 z-40 flex justify-around px-1 pt-1.5 lg:hidden" style={{ paddingBottom: "calc(6px + env(safe-area-inset-bottom))" }}>
        {TABS.map(([id, Icon, label]) => <button key={id} type="button" onClick={() => nav(id)} className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[12px] min-h-[52px] ${!routeAllowed(id, allowed) ? "opacity-35" : ""}`} style={{ color: isActive(id) ? "var(--brand)" : "var(--color-text-tertiary)" }}><Icon size={19} aria-hidden="true" /><span>{label}</span></button>)}
      </nav>

      {/* 연구방법 어시스턴트 (음성/텍스트 → 설정에 저장된 AI 공급자 직접 호출) */}
      <MethodOrbitAssistant
        sidebarWidth={256}
        contentMaxWidth={contentWide ? 1480 : 1180}
        centered={top === "home"}
        onNavigate={nav}
        pageTop={top}
      />
    </div>
  );
}
