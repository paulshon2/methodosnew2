"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Target,
  Workflow,
  BookOpen,
  Network,
  Shapes,
  BarChart3,
  FolderKanban,
  Settings,
  Sparkles,
  Shield,
  FlaskConical,
  PenLine,
  Search,
  Calendar,
  LayoutDashboard,
  Cloud,
  HardDrive,
  ChevronDown,
  Check,
} from "lucide-react";
import { LandingNav } from "./landing-nav";
import { BrandLogo } from "./brand-logo";

const SOURCES = ["CrossRef", "OpenAlex", "Semantic Scholar", "GROBID", "ORCID", "DOI"];

const HERO_TAGS = [
  "연구방법 추천",
  "프로세스 허브",
  "11단계 워크벤치",
  "카탈로그",
  "체계 맵",
  "시각화",
  "프로젝트",
  "AI 연동",
];

const WORKSPACE = [
  { icon: Target, color: "#534ab7", ko: "연구방법 추천", en: "Method Recommend", desc: "연구 질문·자료 유형에 맞는 연구방법을 AI·규칙으로 추천합니다." },
  { icon: Workflow, color: "#0d9488", ko: "연구방법별 프로세스", en: "Process Hub", desc: "표준 방법 단계 상세와 아키타입 공통절차를 한 흐름으로 탐색합니다." },
  { icon: BookOpen, color: "#059669", ko: "연구방법 카탈로그", en: "Methods Catalog", desc: "조사·질적·양적·텍스트·평가·인과·역사·합성 계열을 체계적으로 탐색합니다." },
  { icon: Shapes, color: "#7c3aed", ko: "방법론적 아키타입", en: "Methodological Archetype", desc: "31개 아키타입 프로세스와 소속 연구방법을 탐색합니다." },
  { icon: PenLine, color: "#4f46e5", ko: "11단계 워크벤치", en: "Stage Workbench", desc: "단계·세부 태스크 실행, 설문·통계·코딩 워크벤치를 제공합니다." },
  { icon: Shield, color: "#dc2626", ko: "검토·검증", en: "Review & Validation", desc: "단계 산출물의 입력·검증·재현 기록을 남깁니다." },
  { icon: Calendar, color: "#d97706", ko: "연구 진행 관리", en: "Research Progress", desc: "프로젝트 단계·실행 이력·아티팩트를 추적합니다." },
  { icon: FlaskConical, color: "#ea580c", ko: "데이터 시각화", en: "Data Visualization", desc: "차트 유형 선택부터 스튜디오까지 시각화 파이프라인을 제공합니다." },
];

const FLOW_ROW = [
  { n: "01", icon: Target, label: "연구방법 추천", color: "#534ab7" },
  { n: "02", icon: Workflow, label: "프로세스", color: "#0d9488" },
  { n: "03", icon: BookOpen, label: "연구방법", color: "#4f46e5" },
  { n: "04", icon: Shapes, label: "아키타입", color: "#7c3aed" },
  { n: "05", icon: Calendar, label: "프로젝트", color: "#d97706" },
];

const AI_ROW = [
  { n: "01", icon: Sparkles, label: "AI 워크벤치", color: "#534ab7" },
  { n: "02", icon: FlaskConical, label: "통계·설문 분석", color: "#ea580c" },
  { n: "03", icon: BarChart3, label: "시각화 스튜디오", color: "#4f46e5" },
];

const SYS_ROW = [
  { n: "01", icon: FolderKanban, label: "맞춤 라이브러리", color: "#059669" },
  { n: "02", icon: Settings, label: "설정", color: "#6b7280" },
  { n: "03", icon: LayoutDashboard, label: "대시보드", color: "#2563eb" },
];

const ACCORDION = [
  {
    id: "01",
    title: "연구방법 추천",
    icon: Target,
    color: "#534ab7",
    steps: ["질문·자료 유형 입력", "계열·방법 후보 제시", "적합도 비교", "프로젝트로 연결"],
    blurb: "추천 → 방법 상세 → 프로젝트 생성",
  },
  {
    id: "02",
    title: "연구방법별 프로세스",
    icon: Workflow,
    color: "#0d9488",
    steps: ["프로세스 요약", "단계별 상세", "공통절차", "워크벤치 실행"],
    blurb: "요약 · 단계 · 공통절차 · 실행",
  },
  {
    id: "03",
    title: "연구방법 · 체계",
    icon: Network,
    color: "#4f46e5",
    steps: ["카탈로그 탐색", "방법 상세", "체계 맵", "참고문헌 안내"],
    blurb: "카탈로그와 체계를 한 화면에서",
  },
  {
    id: "04",
    title: "데이터 시각화",
    icon: BarChart3,
    color: "#ea580c",
    steps: ["차트 유형", "데이터 연결", "스튜디오 편집", "내보내기"],
    blurb: "유형 선택 → 스튜디오 → 산출",
  },
];

const PLANS = [
  {
    name: "Free",
    desc: "연구방법 2개와 기본그래프 제공",
    features: [
      "연구방법 2개 (설문조사 작성·사회과학 통계방법)",
      "기본 그래프 (막대·선·원) · 10종",
      "대시보드·추천·프로세스",
      "프로젝트 저장",
    ],
    cta: "무료로 시작",
    href: "/signup",
    popular: false,
  },
  {
    name: "Basic",
    desc: "연구방법 5개와 기본·분포·관계 그래프 제공",
    features: [
      "연구방법 5개 (+QL-044·QL-041·코딩매뉴얼)",
      "기본 10 + 분포·통계 8 + 관계·고급 8",
      "Free 전체 메뉴",
      "내보내기",
    ],
    cta: "Basic 시작하기",
    href: "/signup",
    popular: false,
  },
  {
    name: "Scholar",
    desc: "준비중",
    features: ["준비중 — 전체 연구방법", "준비중 — 전체 데이터 시각화", "고급 프로세스", "우선 지원"],
    cta: "준비중",
    href: "/signup",
    popular: true,
  },
  {
    name: "University",
    desc: "기관·연구팀",
    features: ["팀 협업", "기관 라이선스", "우선 지원", "전담 문의"],
    cta: "문의하기",
    href: "/signup",
    popular: false,
  },
];

export default function LandingPage() {
  const [open, setOpen] = useState("01");

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] antialiased" data-page="landing">
      <LandingNav />

      {/* Hero — white → light blue */}
      <section
        id="hero"
        className="scroll-mt-20 relative overflow-hidden border-b border-[#dbeafe] bg-gradient-to-b from-white via-[#f0f7ff] to-[#e0effe]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,_rgba(37,99,235,0.12),_transparent_50%),radial-gradient(ellipse_at_85%_35%,_rgba(56,189,248,0.1),_transparent_45%)]" />
        <div className="relative mx-auto flex max-w-[920px] flex-col items-center px-4 py-16 text-center md:py-24">
          <BrandLogo variant="hero" />
          <p className="mt-8 text-[11px] font-medium tracking-[0.22em] text-[#64748b] uppercase">
            Method Research Operating System
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[#0f172a] md:text-[2.55rem] md:leading-[1.2]">
            표준 프로토콜과 절차적 AI 연구방법과 협업
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#475569]">
            “연구자의 통찰과 AI의 협업 — 연구방법 선택부터 연구 프로세스 실행·연구결과까지 전 과정을 지원”
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-[#2563eb] px-6 py-3 text-[14px] font-semibold text-white shadow-sm shadow-[#2563eb]/25 hover:bg-[#1d4ed8]"
            >
              무료로 시작하기 →
            </Link>
            <a
              href="#features"
              className="rounded-full border border-[#bfdbfe] bg-white/90 px-6 py-3 text-[14px] font-medium text-[#334155] backdrop-blur-sm hover:border-[#2563eb] hover:text-[#2563eb]"
            >
              기능 살펴보기
            </a>
          </div>
          <div className="mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-2">
            {HERO_TAGS.map((t) => (
              <span
                key={t}
                className="rounded-full border border-[#bfdbfe] bg-white/80 px-3 py-1 text-[11.5px] text-[#475569] backdrop-blur-sm"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Track — white */}
      <section id="track" className="scroll-mt-20 border-b border-[#e2e8f0] bg-white py-16 md:py-20">
        <div className="mx-auto max-w-[900px] px-4 text-center">
          <p className="text-[11px] font-medium tracking-[0.2em] text-[#94a3b8] uppercase">Choose your track</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">MethodOS</h2>
          <p className="mt-2 text-[14px] text-[#64748b]">
            회원가입 후 MethodOS 워크스페이스에서 연구방법 추천·프로세스·프로젝트를 바로 실행합니다.
          </p>
          <div className="mx-auto mt-10 max-w-lg">
            <div className="rounded-2xl border border-[#dbeafe] bg-[#f0f7ff] p-6 text-left shadow-sm md:p-8">
              <div className="text-[17px] font-semibold">연구자 플랜</div>
              <div className="mt-1 text-[13px] font-medium text-[#2563eb]">MethodOS — Research Methods OS</div>
              <p className="mt-4 text-[13px] leading-relaxed text-[#64748b]">
                박사·연구자·논문 저자·교수·연구직을 위한 실전 연구방법 워크벤치. 방법 선택부터 단계 실행·시각화·내보내기까지
                한 흐름으로 수행합니다.
              </p>
              <ul className="mt-4 space-y-2 text-[12.5px] text-[#334155]">
                {["연구방법 추천 · 카탈로그 · 체계", "프로세스 요약·단계·공통절차", "11단계 워크벤치 · 시각화", "로컬 우선 프로젝트 저장"].map(
                  (x) => (
                    <li key={x} className="flex items-start gap-2">
                      <Check size={14} className="mt-0.5 shrink-0 text-[#2563eb]" />
                      {x}
                    </li>
                  )
                )}
              </ul>
              <Link
                href="/app"
                className="mt-6 flex w-full items-center justify-center rounded-full bg-[#2563eb] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#1d4ed8]"
              >
                MethodOS 입장 →
              </Link>
            </div>
          </div>
          <a href="#pricing" className="mt-6 inline-block text-[12.5px] text-[#64748b] hover:text-[#2563eb]">
            플랜 상세 비교 · 요금 보기 →
          </a>
        </div>
      </section>

      {/* Sources — light blue strip */}
      <section className="border-b border-[#bfdbfe] bg-[#dbeafe] py-6">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-4 px-4">
          <p className="text-[11px] tracking-wide text-[#1e40af]">통합 학술 데이터 소스 · MethodOS 워크플로 연계</p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-[13px] font-medium text-[#1e3a8a]">
            {SOURCES.map((s) => (
              <span key={s} className="rounded-full border border-white/70 bg-white/70 px-3 py-1">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Workspace — soft blue-gray */}
      <section id="features" className="scroll-mt-20 bg-[#f0f7ff] py-16 md:py-20">
        <div className="mx-auto max-w-[1100px] px-4">
          <p className="text-center text-[13px] text-[#64748b]">연구 단계별 전문 워크스페이스</p>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight md:text-4xl">논문·연구를 위한 모든 단계</h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {WORKSPACE.map((c) => (
              <div key={c.ko} className="rounded-2xl border border-[#dbeafe] bg-white p-5 shadow-sm">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full" style={{ background: c.color + "18" }}>
                  <c.icon size={18} style={{ color: c.color }} />
                </div>
                <div className="text-[15px] font-semibold">{c.ko}</div>
                <div className="text-[11px] text-[#94a3b8]">{c.en}</div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-[#64748b]">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Menus — white */}
      <section id="menus" className="scroll-mt-20 border-t border-[#e2e8f0] bg-white py-16">
        <div className="mx-auto max-w-[1100px] px-4">
          <p className="flex items-center gap-2 text-[12px] text-[#2563eb]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2563eb]" /> all menus &amp; features
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">원스톱 학술 연구 환경</h2>
          <p className="mt-2 text-[14px] text-[#64748b]">연구 프로세스 흐름을 담은 MethodOS 메뉴를 한눈에</p>

          <Row label="연구 흐름" num="01" items={FLOW_ROW} />
          <Row label="AI · 도구" num="02" items={AI_ROW} />
          <Row label="시스템" num="03" items={SYS_ROW} />
        </div>
      </section>

      {/* Accordion — light blue */}
      <section className="border-t border-[#bfdbfe] bg-gradient-to-b from-[#eff6ff] to-[#e0effe] py-16">
        <div className="mx-auto max-w-[1100px] px-4">
          <p className="flex items-center gap-2 text-[12px] text-[#2563eb]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2563eb]" /> menu flows in action
          </p>
          <h2 className="mt-3 max-w-3xl text-2xl font-bold tracking-tight md:text-3xl">
            학문적 탐구의 맥락이 유기적으로 연결된 메뉴와 기능, 지금 경험해보십시오
          </h2>
          <div className="mt-8 divide-y divide-[#dbeafe] rounded-2xl border border-[#bfdbfe] bg-white px-4 shadow-sm md:px-6">
            {ACCORDION.map((a) => {
              const expanded = open === a.id;
              return (
                <div key={a.id}>
                  <button type="button" onClick={() => setOpen(expanded ? "" : a.id)} className="flex w-full items-center gap-3 py-4 text-left">
                    <span className="w-8 text-[13px] text-[#94a3b8]">{a.id}</span>
                    <a.icon size={18} style={{ color: a.color }} />
                    <span className="flex-1 text-[15px] font-medium">{a.title}</span>
                    <ChevronDown size={16} className={`text-[#94a3b8] transition ${expanded ? "rotate-180" : ""}`} />
                  </button>
                  {expanded && (
                    <div className="grid gap-4 pb-6 pl-11 md:grid-cols-2">
                      <div className="rounded-xl border border-[#dbeafe] bg-[#f0f7ff] p-4 text-[12.5px] text-[#64748b]">
                        <div className="mb-2 font-medium text-[#0f172a]">{a.blurb}</div>
                      </div>
                      <div>
                        <ol className="space-y-2">
                          {a.steps.map((s, i) => (
                            <li key={s} className="flex items-center gap-2 text-[13px] text-[#334155]">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#dbeafe] text-[10px] text-[#2563eb]">
                                {i + 1}
                              </span>
                              {s}
                            </li>
                          ))}
                        </ol>
                        <Link href="/app" className="mt-4 inline-block text-[13px] text-[#2563eb] hover:underline">
                          {a.title} 기능 전체보기 →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture — white */}
      <section id="architecture" className="scroll-mt-20 border-t border-[#e2e8f0] bg-white py-16">
        <div className="mx-auto max-w-[1100px] px-4">
          <h2 className="text-2xl font-bold md:text-3xl">로컬 우선 · 클라우드 메타데이터 보안 체계</h2>
          <p className="mt-2 max-w-2xl text-[14px] text-[#64748b]">
            연구 산출물은 브라우저·로컬에 우선 저장하고, 계정·협업 메타만 Clerk + Supabase로 동기화합니다.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#dbeafe] bg-[#f0f7ff] p-6 shadow-sm">
              <div className="mb-1 flex items-center gap-2 text-[#0d9488]">
                <HardDrive size={18} />
                <span className="text-[13px] font-medium">Local Storage Layer</span>
              </div>
              <p className="text-[12px] text-[#94a3b8]">Browser · Zustand · Export .methodos</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Projects", "Stage Runs", "Workbench", "Viz", "AI Cache", "Versions"].map((t) => (
                  <span key={t} className="rounded-md border border-[#0d9488]/35 bg-white px-2 py-1 text-[11px] text-[#0d9488]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#dbeafe] bg-[#f0f7ff] p-6 shadow-sm">
              <div className="mb-1 flex items-center gap-2 text-[#2563eb]">
                <Cloud size={18} />
                <span className="text-[13px] font-medium">Cloud Metadata Layer</span>
              </div>
              <p className="text-[12px] text-[#94a3b8]">Clerk · Supabase PostgreSQL</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Account", "Sync Index", "Activity", "Citations"].map((t) => (
                  <span key={t} className="rounded-md border border-[#2563eb]/35 bg-white px-2 py-1 text-[11px] text-[#2563eb]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to — soft blue */}
      <section id="howto" className="scroll-mt-20 border-t border-[#bfdbfe] bg-[#f0f7ff] py-16">
        <div className="mx-auto max-w-[1100px] px-4">
          <h2 className="text-2xl font-bold md:text-3xl">시작은 간단합니다</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["01", "회원가입", "Google · GitHub · 이메일 (Clerk)"],
              ["02", "워크스페이스", "MethodOS /app 진입"],
              ["03", "API 연결", "설정에서 AI API 키 입력"],
              ["04", "연구 시작", "추천 → 프로세스 → 프로젝트"],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-2xl border border-[#dbeafe] bg-white p-5 shadow-sm">
                <div className="text-[12px] text-[#94a3b8]">{n}</div>
                <div className="mt-1 text-[15px] font-semibold">{t}</div>
                <p className="mt-2 text-[12px] text-[#64748b]">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-[#dbeafe] bg-white p-4 shadow-sm">
            <div className="flex min-w-[720px] items-center gap-2 text-[11px] text-[#64748b]">
              {["Landing", "회원가입/로그인", "/app", "프로젝트", "AI 워크플로", "Export"].map((s, i, arr) => (
                <span key={s} className="flex items-center gap-2">
                  <span className="rounded-full border border-[#dbeafe] bg-[#f0f7ff] px-2.5 py-1 whitespace-nowrap">{s}</span>
                  {i < arr.length - 1 && <span className="text-[#cbd5e1]">→</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing — white */}
      <section id="pricing" className="scroll-mt-20 border-t border-[#e2e8f0] bg-white py-16">
        <div className="mx-auto max-w-[1100px] px-4">
          <p className="text-center text-[12px] tracking-wide text-[#2563eb]">PRICING – METHODOS</p>
          <h2 className="mt-2 text-center text-2xl font-bold md:text-3xl">연구에 맞는 플랜을 선택하세요</h2>
          <p className="mt-2 text-center text-[13px] text-[#64748b]">MethodOS 연구자 플랜</p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl p-5 shadow-sm ${
                  p.popular
                    ? "border-2 border-[#2563eb] bg-[#eff6ff]"
                    : "border border-[#dbeafe] bg-[#f8fafc]"
                }`}
              >
                {p.popular && (
                  <span className="mb-2 inline-block rounded-full bg-[#2563eb] px-2 py-0.5 text-[10px] font-bold text-white">
                    MOST POPULAR
                  </span>
                )}
                <div className="text-lg font-bold">{p.name}</div>
                <p className="text-[12px] text-[#64748b]">{p.desc}</p>
                <ul className="mt-4 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[12.5px]">
                      <Check size={14} className="mt-0.5 text-[#2563eb]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className={`mt-5 block rounded-full py-2 text-center text-[13px] font-semibold ${
                    p.popular
                      ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                      : "border border-[#cbd5e1] bg-white text-[#0f172a] hover:border-[#2563eb]"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="docs" className="sr-only" aria-hidden>
        문서
      </section>

      {/* CTA — light blue wash */}
      <section className="relative overflow-hidden border-t border-[#bfdbfe] bg-gradient-to-b from-[#eff6ff] to-[#dbeafe] py-20 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(37,99,235,0.1),_transparent_60%)]" />
        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight">지금 바로 연구를 시작하세요</h2>
          <p className="mt-3 text-[14px] text-[#64748b]">무료로 가입하고 MethodOS 워크벤치로 연구방법을 실행하세요.</p>
          <Link
            href="/signup"
            className="mt-8 inline-flex rounded-full bg-[#2563eb] px-6 py-3 text-[14px] font-semibold text-white shadow-sm shadow-[#2563eb]/25 hover:bg-[#1d4ed8]"
          >
            무료로 시작하기 →
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#bfdbfe] bg-white py-12">
        <div className="mx-auto grid max-w-[1100px] gap-8 px-4 md:grid-cols-4">
          <div>
            <BrandLogo variant="footer" />
            <p className="mt-2 text-[12px] text-[#64748b]">Local-first research methods operating system</p>
            <p className="mt-4 text-[11px] text-[#94a3b8]">© 2026 methodos. All rights reserved.</p>
          </div>
          {[
            ["제품", ["기능", "요금", "로드맵"]],
            ["리소스", ["문서", "블로그", "문의"]],
            ["법적 사항", ["이용약관", "개인정보", "보안"]],
          ].map(([h, items]) => (
            <div key={h as string}>
              <div className="text-[12px] font-medium text-[#334155]">{h as string}</div>
              <ul className="mt-3 space-y-1.5 text-[12px] text-[#94a3b8]">
                {(items as string[]).map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

function Row({
  label,
  num,
  items,
}: {
  label: string;
  num: string;
  items: { n: string; icon: any; label: string; color: string }[];
}) {
  return (
    <div className="mt-10">
      <div className="mb-3 flex items-center justify-between border-b border-[#e2e8f0] pb-2">
        <span className="text-[12px] text-[#64748b]">{label}</span>
        <span className="text-[12px] text-[#94a3b8]">{num}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl border border-[#dbeafe] bg-[#f0f7ff] p-4 shadow-sm">
            <div className="mb-2 text-[10px] text-[#94a3b8]">{it.n}</div>
            <it.icon size={20} style={{ color: it.color }} />
            <div className="mt-2 text-[13px] font-medium">{it.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
