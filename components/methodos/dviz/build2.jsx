/* 기법별 시각화 설계 2 — M13 ~ M26 (매개·분산분석·로지스틱·척도·요인) */
import { Bars, Bullets, Forest, Heat } from "./charts1.jsx";
import { Donut, Lines, PathDiagram, Stack100, Waffle } from "./charts2.jsx";
import { Arc } from "./charts1.jsx";
import { C, BAD, OK, WARN, asmCard, card, ciForest, clip, col, distCard, dtab, eff, effCard, effItem, fmt, fp, has, isNum, kv, L, num, objs, pTone, roleVars, sgn, star, t3, tb, tbs, tcrit, tile } from "./bh.jsx";

const X = {};
const stars3 = (p) => `${fp(p)}${star(p)}`;
const bandsAlpha = [{ to: 0.6, color: "bad", label: t3("미흡", "poor", "差") }, { to: 0.7, color: "warn", label: t3("보통", "fair", "一般") }, { to: 0.8, color: "ok", label: t3("양호", "good", "良好") }, { to: 1, color: "var(--dv-c1)", label: t3("우수", "excellent", "优秀") }];

X.M13 = (R) => {
  const pc = objs(tb(R, /경로 계수/)), ef = objs(tb(R, /효과 분해/)), dl = objs(tb(R, /간접효과 — 델타/))[0]; if (!pc.length) return null;
  const f = (re) => pc.find((r) => re.test(String(r["경로"]))), a = f(/^a/), b = f(/^b/), cp = f(/^c'/), c = f(/^c \(/);
  const xN = roleVars(R, "predictor")[0] || "X", mN = roleVars(R, "mediator")[0] || "M", yN = roleVars(R, "outcome")[0] || "Y";
  const ind = ef.find((r) => /간접/.test(r["효과"])), tot = ef.find((r) => /총/.test(r["효과"]));
  const lo = isNum(ind?.["백분위 CI 하한"]) ? ind["백분위 CI 하한"] : dl?.["CI 하한"], hi = isNum(ind?.["백분위 CI 상한"]) ? ind["백분위 CI 상한"] : dl?.["CI 상한"];
  const share = ind && tot && tot["추정값"] ? (ind["추정값"] / tot["추정값"]) * 100 : null;
  const tiles = [ind && tile(t3("간접효과 a×b", "Indirect effect a×b", "间接效应 a×b"), fmt(ind["추정값"], 3), isNum(lo) ? `95% CI ${fmt(lo, 2)} ~ ${fmt(hi, 2)}` : "", lo * hi > 0 ? "good" : undefined), cp && tile(t3("직접효과 c′", "Direct effect c′", "直接效应 c′"), fmt(cp["B"], 3), fp(cp["p"]), pTone(cp["p"])), share != null && tile(t3("매개된 몫", "Share mediated", "被中介的比例"), `${fmt(share, 0)}%`, t3("간접 ÷ 총효과", "indirect ÷ total", "间接 ÷ 总效应"), "c2")].filter(Boolean);
  const charts = [];
  const lab = (r, n) => (r ? `${n} = ${fmt(r["B"], 3)}${star(r["p"])}` : "");
  charts.push(card("path", t3("매개 경로 그림", "Mediation path diagram", "中介路径图"), t3(`${xN} → ${mN} → ${yN}: 간접 경로(a·b)와 직접 경로(c′)`, `${xN} → ${mN} → ${yN}: indirect (a·b) and direct (c′) paths`, `${xN} → ${mN} → ${yN}:间接路径(a·b)与直接路径(c′)`),
    t3("화살표 위 숫자는 비표준화 계수 B(별표는 유의성)입니다. 두 개의 위쪽 경로(a, b)를 곱한 것이 간접효과이고, 아래 직접 화살표(c′)는 매개변수를 통제한 뒤 남는 직접 효과입니다.", "Numbers on arrows are unstandardised B (stars = significance). a×b through the top path is the indirect effect; c′ below is what remains after controlling for the mediator.", "箭头上的数字为非标准化系数 B(星号表示显著性)。上方路径 a×b 为间接效应;下方 c′ 为控制中介变量后的直接效应。"),
    <PathDiagram nodes={[{ id: "x", label: xN, layer: 0, fy: 0.88 }, { id: "m", label: mN, layer: 1, fy: 0.1 }, { id: "y", label: yN, layer: 2, fy: 0.88 }]} edges={[{ from: "x", to: "m", label: lab(a, "a"), value: Math.min(1, Math.abs(a?.["B"] ?? 0.5)), sig: a ? a["p"] < 0.05 : true }, { from: "m", to: "y", label: lab(b, "b"), value: Math.min(1, Math.abs(b?.["B"] ?? 0.5)), sig: b ? b["p"] < 0.05 : true }, { from: "x", to: "y", label: lab(cp, "c′"), value: Math.min(1, Math.abs(cp?.["B"] ?? 0.2)), sig: cp ? cp["p"] < 0.05 : true, color: "var(--dv-c2)" }]} height={250} />,
    dtab([t3("경로", "Path", "路径"), "B", "SE", "t", "p"], pc.map((r) => [L(r["경로"]), r["B"], r["SE"], r["t"], r["p"]])), { wide: true }));
  const rows = [];
  if (c) rows.push({ label: t3("총효과 c", "Total c", "总效应 c"), est: c["B"], lo: c["B"] - 1.96 * c["SE"], hi: c["B"] + 1.96 * c["SE"], color: C(5) });
  if (cp) rows.push({ label: t3("직접효과 c′", "Direct c′", "直接效应 c′"), est: cp["B"], lo: cp["B"] - 1.96 * cp["SE"], hi: cp["B"] + 1.96 * cp["SE"], color: C(1) });
  if (ind) rows.push({ label: t3("간접효과 a×b", "Indirect a×b", "间接效应 a×b"), est: ind["추정값"], lo, hi, color: C(0), bold: true });
  if (rows.length) charts.push(card("dec", t3("효과 분해 — 총효과 = 직접 + 간접", "Effect decomposition — total = direct + indirect", "效应分解 — 总效应 = 直接 + 间接"), t3("간접효과의 구간이 0을 포함하지 않으면 매개효과가 있다고 봅니다.", "If the indirect effect's interval excludes 0, mediation is supported.", "间接效应的区间不含 0,则认为存在中介效应。"), t3("총·직접효과의 구간은 ±1.96 SE, 간접효과는 부트스트랩(없으면 델타법) 구간입니다.", "Total/direct intervals are ±1.96 SE; the indirect effect uses the bootstrap (or delta-method) interval.", "总/直接效应区间为 ±1.96 SE;间接效应使用 bootstrap(或 delta 法)区间。"),
    <Forest rows={rows} ref0={0} vfmt={(v) => fmt(v, 3)} rowH={42} />, dtab([t3("효과", "Effect", "效应"), "est", "lo", "hi"], rows.map((r) => [r.label, r.est, r.lo, r.hi]))));
  if (share != null && share > 0 && share <= 100) charts.push(card("share", t3("총효과 중 매개로 설명되는 몫", "Share of the total effect that is mediated", "总效应中被中介解释的比例"), null, t3("간접효과 ÷ 총효과입니다(두 효과의 부호가 같을 때 의미가 있습니다).", "Indirect ÷ total (meaningful when both have the same sign).", "间接 ÷ 总效应(二者符号相同时才有意义)。"), <Donut items={[{ label: t3("간접(매개)", "indirect", "间接(中介)"), value: share, color: C(0) }, { label: t3("직접", "direct", "直接"), value: 100 - share, color: C(1) }]} center={`${fmt(share, 0)}%`} sub={t3("매개", "mediated", "中介")} />, null));
  return { tiles, charts };
};

X.M14 = (R) => {
  const an = objs(tb(R, /이원 요인분산분석/)), cells = tb(R, /칸마다의 평균/); if (!an.length || !cells) return null;
  const A = roleVars(R, "factor_a")[0] || "A", B = roleVars(R, "factor_b")[0] || "B", er = an.find((r) => /오차/.test(r["원천"]));
  const nm = (s) => (/요인 A/.test(s) ? A : /요인 B/.test(s) ? B : /A×B/.test(s) ? `${A}×${B}` : L(s));
  const ia = an.find((r) => /A×B/.test(r["원천"])), eP = (R.effect_sizes || []).filter((e) => /부분 η²/.test(e.name));
  const tiles = an.filter((r) => r["F"] !== "" && isNum(r["F"])).map((r) => tile(nm(r["원천"]), `F=${fmt(r["F"], 2)}`, fp(r["p"]), pTone(r["p"])));
  const charts = [];
  const lv = cells.columns.map((c) => /^(.+) 평균$/.exec(c.name)).filter(Boolean).map((m) => m[1]);
  const rowsC = objs(cells), key0 = cells.columns[0].name;
  charts.push(card("int", t3(`상호작용 그림 — ${A} × ${B}`, `Interaction plot — ${A} × ${B}`, `交互作用图 — ${A} × ${B}`), t3(ia && ia["p"] < 0.05 ? "선이 평행하지 않습니다 — 상호작용이 있습니다." : "선이 거의 평행합니다 — 뚜렷한 상호작용은 없습니다.", ia && ia["p"] < 0.05 ? "Lines are not parallel – there is an interaction." : "Lines are roughly parallel – no clear interaction.", ia && ia["p"] < 0.05 ? "线不平行 — 存在交互作用。" : "线基本平行 — 无明显交互作用。"),
    t3("선 하나가 한 수준의 집단 평균을 이은 것입니다. 선들이 평행하면 한 요인의 효과가 다른 요인의 수준과 무관하고, 벌어지거나 교차하면 상호작용입니다.", "Each line connects the means across levels of one factor. Parallel lines mean the effect does not depend on the other factor; fanning or crossing lines mean an interaction.", "每条线连接一个因素各水平的均值;线平行说明效应不依赖另一因素,散开或交叉则说明存在交互作用。"),
    <Lines xCats={lv} series={rowsC.map((r, i) => ({ name: L(r[key0]), color: C(i), points: lv.map((l, k) => ({ x: k, y: r[`${l} 평균`] })) }))} yLabel={L(roleVars(R, "outcome")[0] || "")} xLabel={B} />, dtab([A, ...lv.map((l) => `${l} 평균`)], rowsC.map((r) => [L(r[key0]), ...lv.map((l) => r[`${l} 평균`])])), { wide: true }));
  if (eP.length) charts.push(card("eta", t3("효과별 부분 η²", "Partial η² per effect", "各效应的偏 η²"), t3("각 효과가 설명하는 변동의 비율입니다.", "Share of variance explained by each effect.", "各效应解释的方差比例。"), null,
    <Bullets items={eP.map((e) => ({ ...effItem(e, nm(String(e.name).replace(/^부분 η²\(|\)$/g, "").replace(/^(요인 A|요인 B|A×B)$/, (m) => m))), label: nm(String(e.name).replace(/^부분 η²\(/, "").replace(/\)$/, "")) })).filter((x) => x.max)} />, null));
  if (er) charts.push(card("ss", t3("변동은 어디서 왔나", "Sources of variation", "变异来源"), null, t3("색 조각이 길수록 그 원천(주효과·상호작용·오차)이 총 변동에서 차지하는 비율이 큽니다.", "Longer segments contribute a larger share of the total variation.", "色块越长,该来源占总变异比例越大。"), <Stack100 rows={[{ label: "SS", parts: an.map((r) => ({ name: nm(r["원천"]), value: r["SS"] })) }]} showN={false} />, dtab([t3("원천", "Source", "来源"), "SS", "df", "F", "p"], an.map((r) => [nm(r["원천"]), r["SS"], r["df"], r["F"], r["p"]]))));
  const d = ia && er && distCard("F", "F", ia["F"], ia["df"], er["df"], ia["p"], "right", t3("상호작용 F 의 위치", "Where the interaction F falls", "交互作用 F 的位置")); if (d) charts.push(d);
  return { tiles, charts };
};

X.M15 = (R) => {
  const an = objs(tb(R, /공분산분석/)), adj = objs(tb(R, /조정 전·후/)); if (!an.length || !adj.length) return null;
  const g = an.find((r) => /집단/.test(r["원천"])), er = an.find((r) => /오차/.test(r["원천"])), cv = an.find((r) => /공변량/.test(r["원천"])), eta = eff(R, /η²/);
  const tiles = [g && tile(t3("집단 효과 F", "Group effect F", "组效应 F"), fmt(g["F"], 2), `df ${g["df"]}, ${er?.["df"]} · ${fp(g["p"])}`, pTone(g["p"])), eta && tile("η²p", fmt(eta.value, 3), eta.interpretation_band ? L(String(eta.interpretation_band)) : "", "c2"), cv && tile(t3("공변량 F", "Covariate F", "协变量 F"), fmt(cv["F"], 1), fp(cv["p"]))].filter(Boolean);
  const charts = [];
  charts.push(card("adj", t3("공변량을 통제하면 집단 평균이 어떻게 달라지나", "How do group means change after adjusting for the covariate?", "控制协变量后各组均值如何变化"), t3("‘조정 전’은 단순 평균, ‘조정 후’는 공변량을 같은 수준으로 맞춘 추정 주변평균입니다.", "‘Raw’ = simple means; ‘adjusted’ = estimated marginal means at the same covariate level.", "“调整前”为简单均值,“调整后”为协变量相同水平下的估计边际均值。"),
    t3("두 선이 서로 가까우면 공변량이 집단 차이에 큰 영향을 주지 않았다는 뜻이고, 크게 달라지면 집단 사이에 공변량 차이가 있었다는 뜻입니다. 띠는 조정 후 평균의 95% 구간입니다.", "If the two lines are close the covariate hardly changed the group differences; large shifts mean the groups differed on the covariate. The band is the 95% CI of the adjusted means.", "两条线接近说明协变量对组间差异影响不大;变化大说明各组在协变量上存在差异。色带为调整后均值的 95% 区间。"),
    <Lines xCats={adj.map((r) => L(r["집단"]))} series={[{ name: t3("조정 전", "raw", "调整前"), color: C(5), dash: "5 4", points: adj.map((r, i) => ({ x: i, y: r["조정 전"] })) }, { name: t3("조정 후", "adjusted", "调整后"), color: C(0), points: adj.map((r, i) => ({ x: i, y: r["추정 주변평균"], lo: r["95% 하한"], hi: r["95% 상한"] })) }]} yLabel={L(roleVars(R, "outcome")[0] || "")} />, dtab([t3("집단", "Group", "组"), "raw", "EMM", "lo", "hi"], adj.map((r) => [L(r["집단"]), r["조정 전"], r["추정 주변평균"], r["95% 하한"], r["95% 상한"]])), { wide: true }));
  if (er) charts.push(card("ss", t3("변동의 분해 — 공변량 · 집단 · 오차", "Decomposition — covariate, group, error", "变异分解 — 协变量 · 组 · 误差"), null, null, <Stack100 rows={[{ label: "SS", parts: an.map((r) => ({ name: L(r["원천"]), value: r["SS"] })) }]} showN={false} />, dtab([t3("원천", "Source", "来源"), "SS", "df", "F", "p"], an.map((r) => [L(r["원천"]), r["SS"], r["df"], r["F"], r["p"]]))));
  const d = g && er && distCard("F", "F", g["F"], g["df"], er["df"], g["p"], "right"); if (d) charts.push(d);
  const e = effCard(R); if (e) charts.push(e);
  return { tiles, charts };
};

X.M16 = (R) => {
  const t = objs(tb(R, /반복측정 분산분석/))[0], sp = (R.assumption_results?.items || []).find((a) => a.check_id === "sphericity"); if (!t) return null;
  const tiles = [tile(t3("시점 효과 F", "Time effect F", "时间效应 F"), fmt(t["F"], 2), `df ${t["df"]} · ${fp(t["p"])}`, pTone(t["p"])), sp && tile(t3("구형성 p", "Sphericity p", "球形性 p"), isNum(sp.p_value) ? fp(sp.p_value).replace("p ", "") : "—", sp.signal === "green" ? t3("가정 유지", "assumption holds", "假设成立") : t3("주의", "caution", "注意"), sp.signal === "green" ? "good" : "warn")].filter(Boolean);
  const charts = [];
  const gg = sp?.detail?.gg_epsilon, hf = sp?.detail?.hf_epsilon;
  if (isNum(gg) || isNum(hf)) charts.push(card("eps", t3("구형성 보정계수 ε", "Sphericity correction ε", "球形性校正系数 ε"), t3("1에 가까울수록 구형성이 잘 지켜진 것이고, 작을수록 자유도를 깎는 보정이 필요합니다.", "Close to 1 = sphericity holds; smaller values call for degrees-of-freedom correction.", "越接近 1 越符合球形性;越小越需要校正自由度。"), null,
    <Bullets items={[isNum(gg) && { label: "Greenhouse–Geisser ε", value: gg, min: 0.5, max: 1, bands: [{ to: 0.75, color: "warn", label: t3("보정 필요", "correct", "需校正") }, { to: 1, color: "ok", label: t3("양호", "ok", "良好") }], fmt: (v) => fmt(v, 3) }, isNum(hf) && { label: "Huynh–Feldt ε", value: hf, min: 0.5, max: 1, bands: [{ to: 0.75, color: "warn", label: t3("보정 필요", "correct", "需校正") }, { to: 1, color: "ok", label: t3("양호", "ok", "良好") }], fmt: (v) => fmt(v, 3) }].filter(Boolean)} />, null));
  const a = asmCard(R); if (a) charts.push(a);
  return { tiles, charts };
};

X.M17 = (R) => {
  const an = objs(tb(R, /혼합설계 분산분석/)), mt = tb(R, /집단 × 시점 평균/); if (!an.length || !mt) return null;
  const times = mt.columns.map((c) => c.name).filter((n) => !["집단", "N"].includes(n)), rows = objs(mt);
  const inter = an.find((r) => /집단×시점/.test(r["원천"])), tm = an.find((r) => /— 시점/.test(r["원천"])), gr = an.find((r) => /— 집단$/.test(r["원천"])), er = an.find((r) => /시점×사람/.test(r["원천"]));
  const tiles = [inter && tile(t3("집단×시점 F", "Group×time F", "组×时间 F"), fmt(inter["F"], 2), `${fp(inter["p"])} · η²p ${fmt(inter["부분 η²"], 3)}`, pTone(inter["p"])), tm && tile(t3("시점 F", "Time F", "时间 F"), fmt(tm["F"], 2), fp(tm["p"]), pTone(tm["p"])), gr && tile(t3("집단 F", "Group F", "组 F"), fmt(gr["F"], 2), fp(gr["p"]), pTone(gr["p"]))].filter(Boolean);
  const charts = [];
  charts.push(card("traj", t3("집단별 변화 궤적", "Trajectories by group", "各组变化轨迹"), t3(inter && inter["p"] < 0.05 ? "집단마다 변화 모양이 다릅니다(상호작용 유의)." : "집단 사이 변화 모양에 뚜렷한 차이가 없습니다.", inter && inter["p"] < 0.05 ? "Groups change differently over time (significant interaction)." : "No clear difference in the shape of change between groups.", inter && inter["p"] < 0.05 ? "各组变化方式不同(交互作用显著)。" : "各组变化形状无明显差异。"),
    t3("선이 평행하면 시간에 따른 변화가 집단과 무관하고, 점점 벌어지거나 교차하면 집단 × 시점 상호작용입니다.", "Parallel lines: change over time is the same for all groups; diverging or crossing lines: a group × time interaction.", "线平行说明时间变化与组无关;逐渐分开或交叉说明存在组 × 时间交互作用。"),
    <Lines xCats={times.map(L)} series={rows.map((r, i) => ({ name: `${L(r["집단"])} (n=${r["N"]})`, color: C(i), points: times.map((c, k) => ({ x: k, y: r[c] })) }))} yLabel={L(roleVars(R, "repeated")[0] ? t3("평균", "mean", "均值") : "")} />, dtab([t3("집단", "Group", "组"), "N", ...times], rows.map((r) => [L(r["집단"]), r["N"], ...times.map((c) => r[c])])), { wide: true }));
  const eP = an.filter((r) => isNum(r["부분 η²"]));
  if (eP.length) charts.push(card("eta", t3("효과별 부분 η²", "Partial η² per effect", "各效应的偏 η²"), null, null, <Bullets items={eP.map((r) => { const e = { name: "η²", value: r["부분 η²"] }; const it = effItem(e, L(String(r["원천"]).replace(/^집단 (간|내) — /, ""))); return it; }).filter(Boolean)} />, null));
  if (rows.length === 2) { const d = times.map((c) => ({ label: L(c), value: rows[1][c] - rows[0][c] })); charts.push(card("gap", t3(`시점별 집단 차이 (${L(rows[1]["집단"])} − ${L(rows[0]["집단"])})`, `Group gap by time (${L(rows[1]["집단"])} − ${L(rows[0]["집단"])})`, `各时间点组间差(${L(rows[1]["집단"])} − ${L(rows[0]["집단"])})`), t3("두 집단 평균의 차이가 시간에 따라 어떻게 변하는지 보입니다.", "How the gap between the two group means changes over time.", "显示两组均值之差随时间的变化。"), null, <Bars items={d} colorBySign fmtv={(v) => sgn(v, 2)} />, null)); }
  const dd = inter && er && distCard("F", "F", inter["F"], inter["df"], er["df"], inter["p"], "right", t3("집단×시점 F 의 위치", "Where the group×time F falls", "组×时间 F 的位置")); if (dd) charts.push(dd);
  const a = asmCard(R); if (a) charts.push(a);
  return { tiles, charts };
};

X.M18 = (R) => {
  const mv = objs(tb(R, /다변량 검정/)), dv = objs(tb(R, /결과변수별/)); if (!mv.length) return null;
  const w = mv[0];
  const tiles = [tile("Wilks Λ", fmt(w["통계량"], 3), `F(${w["df1"]}, ${w["df2"]})=${fmt(w["F"], 2)} · ${fp(w["p"])}`, pTone(w["p"])), tile(t3("다변량 η²", "Multivariate η²", "多变量 η²"), fmt(w["부분 η²"], 3), w["부분 η²"] >= 0.14 ? t3("큼", "large", "大") : w["부분 η²"] >= 0.06 ? t3("보통", "medium", "中") : t3("작음", "small", "小"), "c2")];
  const charts = [];
  if (dv.length) charts.push(card("dv", t3("결과변수별로 보면 — 어느 점수가 다른가", "Per outcome — which score differs?", "按结果变量 — 哪个得分不同"), t3("다변량 검정이 유의하면, 어느 결과변수가 집단 차이를 이끄는지 변수별 F로 확인합니다.", "If the multivariate test is significant, per-outcome F values show which outcome drives the difference.", "多变量检验显著后,用各变量的 F 值查看是哪个结果变量驱动了组间差异。"), t3("막대가 길수록 그 변수에서 집단 차이가 뚜렷합니다. 점선은 α=.05에서 F의 대략적 기준(3.84)입니다.", "A longer bar means a clearer group difference on that outcome. The dashed line is the approximate α=.05 F cutoff (3.84).", "柱越长,该变量组间差异越明显;虚线为 α=.05 时 F 的大致临界值(3.84)。"),
    <Bars items={dv.map((r) => ({ label: L(r["결과변수"]), value: r["F"], note: stars3(r["p"]) }))} marks={[{ value: 3.84, label: "3.84" }]} fmtv={(v) => fmt(v, 2)} />, dtab([t3("변수", "Outcome", "变量"), "SS", "df", "F", "p"], dv.map((r) => [L(r["결과변수"]), r["SS"], r["df"], r["F"], r["p"]]))));
  const d = distCard("F", "F", w["F"], w["df1"], w["df2"], w["p"], "right", t3("다변량 검정(Wilks)의 F 위치", "Where the multivariate F falls", "多变量检验 F 的位置")); if (d) charts.push(d);
  charts.push(card("stat", t3("네 가지 다변량 통계량", "Four multivariate statistics", "四种多变量统计量"), t3("검정 방법이 달라도 결론이 같은지 확인합니다.", "Check that the conclusion agrees across the four tests.", "检查四种检验的结论是否一致。"), null, <Bars items={mv.map((r) => ({ label: L(r["검정"]), value: r["통계량"], note: stars3(r["p"]) }))} fmtv={(v) => fmt(v, 3)} />, dtab([t3("검정", "Test", "检验"), t3("통계량", "stat", "统计量"), "F", "p"], mv.map((r) => [L(r["검정"]), r["통계량"], r["F"], r["p"]]))));
  const e = effCard(R, "eff", /윌크스/); if (e) charts.push(e);
  return { tiles, charts };
};

X.M19 = (R) => {
  const t = tb(R, /로지스틱 회귀/), rows = objs(t); if (!rows.length) return null;
  const pr = rows.filter((r) => !/상수|절편/.test(r["항"]) && isNum(r["OR"]));
  const tiles = pr.slice(0, 3).map((r) => tile(`OR · ${L(r["항"])}`, fmt(r["OR"], 3), `95% CI ${fmt(r["OR 95% 하한"], 2)} ~ ${fmt(r["OR 95% 상한"], 2)}`, r["OR 95% 하한"] > 1 || r["OR 95% 상한"] < 1 ? "good" : undefined));
  const charts = [];
  charts.push(card("or", t3("승산비(OR)와 95% 신뢰구간 — 로그 눈금", "Odds ratios with 95% CIs — log scale", "优势比(OR)及 95% 置信区间 — 对数刻度"), t3("OR > 1 이면 예측변수가 클수록 사건이 일어날 승산이 커집니다.", "OR > 1: higher predictor values raise the odds of the event.", "OR > 1:预测变量越大,事件发生的优势越大。"),
    t3("점선(1)은 ‘영향 없음’입니다. 구간이 1을 가로지르지 않으면 그 변수는 사건 발생과 분명히 관련됩니다. 눈금이 로그라서 2배와 1/2배가 같은 거리입니다.", "The dashed line (1) means no effect; an interval not crossing 1 shows a clear association. The axis is logarithmic so ×2 and ×½ are equally far from 1.", "虚线(1)表示无影响;区间不跨 1 表示明确相关。刻度为对数,×2 与 ×½ 距离相等。"),
    <Forest rows={pr.map((r) => ({ label: L(r["항"]), est: r["OR"], lo: r["OR 95% 하한"], hi: r["OR 95% 상한"], color: C(0), note: stars3(r["p"]) }))} ref0={1} log vfmt={(v) => fmt(v, 2)} />, dtab([t3("항", "Term", "项"), "B", "SE", "z", "p", "OR", "lo", "hi"], rows.map((r) => [L(r["항"]), r["B"], r["SE"], r["z"], r["p"], r["OR"], r["OR 95% 하한"], r["OR 95% 상한"]]))));
  charts.push(card("z", t3("각 변수의 기여 — |z|", "Contribution of each term — |z|", "各变量的贡献 — |z|"), t3("1.96을 넘으면 α=.05에서 유의합니다.", "Above 1.96 is significant at α=.05.", "超过 1.96 则在 α=.05 水平显著。"), null, <Bars items={pr.map((r) => ({ label: L(r["항"]), value: Math.abs(r["z"]), color: Math.abs(r["z"]) > 1.96 ? C(0) : "var(--dv-mute)" }))} marks={[{ value: 1.96, label: "1.96" }]} fmtv={(v) => fmt(v, 2)} />, null));
  return { tiles, charts };
};

X.M20 = (R) => {
  const t = tb(R, /계수 회귀/), rows = objs(t), mc = objs(tb(R, /모형 비교/)); if (!rows.length) return null;
  const pr = rows.filter((r) => !/상수|절편/.test(r["항"]) && isNum(r["IRR"]));
  const tiles = pr.slice(0, 3).map((r) => tile(`IRR · ${L(r["항"])}`, fmt(r["IRR"], 3), t3(`1 늘 때 발생률 ×${fmt(r["IRR"], 3)}`, `rate ×${fmt(r["IRR"], 3)} per unit`, `每增加 1,发生率 ×${fmt(r["IRR"], 3)}`), r["IRR 95% 하한"] > 1 || r["IRR 95% 상한"] < 1 ? "good" : undefined));
  const charts = [];
  charts.push(card("irr", t3("발생률비(IRR)와 95% 신뢰구간 — 로그 눈금", "Incidence-rate ratios with 95% CIs — log scale", "发生率比(IRR)及 95% 置信区间 — 对数刻度"), t3("IRR이 1보다 크면 예측변수가 클수록 사건 횟수가 늘어납니다.", "IRR > 1: more events as the predictor rises.", "IRR > 1:预测变量越大事件次数越多。"), t3("점선(1)은 영향 없음입니다. 구간이 1을 가로지르지 않으면 횟수와 분명히 관련됩니다.", "Dashed line (1) = no effect. An interval not crossing 1 shows a clear link to the count.", "虚线(1)表示无影响;区间不跨 1 表示与次数明确相关。"),
    <Forest rows={pr.map((r) => ({ label: L(r["항"]), est: r["IRR"], lo: r["IRR 95% 하한"], hi: r["IRR 95% 상한"], color: C(0), note: stars3(r["p"]) }))} ref0={1} log vfmt={(v) => fmt(v, 3)} />, dtab([t3("항", "Term", "项"), "B", "SE", "z", "p", "IRR", "lo", "hi"], rows.map((r) => [L(r["항"]), r["B (log)"], r["SE"], r["z"], r["p"], r["IRR"], r["IRR 95% 하한"], r["IRR 95% 상한"]]))));
  if (mc.length >= 2) {
    charts.push(card("aic", t3("포아송 vs 음이항 — 어느 모형이 자료에 맞나", "Poisson vs negative binomial — which fits better?", "泊松 vs 负二项 — 哪个模型更合适"), t3(`AIC가 작은 쪽: ${L([...mc].sort((a, b) => a["AIC"] - b["AIC"])[0]["모형"])}`, `Lower AIC: ${L([...mc].sort((a, b) => a["AIC"] - b["AIC"])[0]["모형"])}`, `AIC 较小:${L([...mc].sort((a, b) => a["AIC"] - b["AIC"])[0]["모형"])}`), t3("AIC·BIC는 작을수록 좋은 모형입니다(차이가 2 이상이면 의미 있는 차이).", "Lower AIC/BIC is better (a difference ≥ 2 is meaningful).", "AIC/BIC 越小越好(差值 ≥ 2 有意义)。"),
      <Bars items={mc.flatMap((r, i) => [{ label: `${L(r["모형"])} · AIC`, value: r["AIC"], color: C(i === 0 ? 0 : 2) }, { label: `${L(r["모형"])} · BIC`, value: r["BIC"], color: C(i === 0 ? 0 : 2), note: "" }])} fmtv={(v) => fmt(v, 1)} min={Math.min(...mc.flatMap((r) => [r["AIC"], r["BIC"]])) * 0.97} />, dtab([t3("모형", "Model", "模型"), "logLik", "AIC", "BIC", t3("흩어짐", "dispersion", "离散")], mc.map((r) => [L(r["모형"]), r["로그우도"], r["AIC"], r["BIC"], r["흩어짐"]]))));
    charts.push(card("disp", t3("과대산포 점검 — 흩어짐", "Overdispersion check", "过度离散检查"), t3("1에 가까우면 포아송 가정이 맞고, 1.5보다 크면 과대산포로 음이항을 고려합니다.", "≈ 1 fits Poisson; > 1.5 suggests overdispersion – consider negative binomial.", "接近 1 符合泊松假设;> 1.5 提示过度离散,可考虑负二项。"), null, <Bullets items={mc.map((r) => ({ label: L(r["모형"]), value: r["흩어짐"], min: 0, max: Math.max(2.5, r["흩어짐"] * 1.2), target: 1, bands: [{ to: 1.2, color: "ok", label: t3("양호", "ok", "良好") }, { to: 1.5, color: "warn", label: t3("주의", "caution", "注意") }, { to: 99, color: "bad", label: t3("과대산포", "over", "过度") }], fmt: (v) => fmt(v, 3) }))} />, null));
  }
  const a = asmCard(R); if (a) charts.push(a);
  return { tiles, charts };
};

X.M21 = (R) => {
  const rel = objs(tb(R, /^신뢰도/)), items = objs(tb(R, /문항 분석/)); if (!rel.length) return null;
  const al = rel.find((r) => /α/.test(r["지표"])) || rel[0];
  const tiles = [tile(t3("크론바흐 α", "Cronbach's α", "Cronbach α"), fmt(al["값"], 3), isNum(al["95% 하한"]) ? `95% CI ${fmt(al["95% 하한"], 3)} ~ ${fmt(al["95% 상한"], 3)}` : "", al["값"] >= 0.7 ? "good" : "warn"), ...rel.filter((r) => r !== al && isNum(r["값"])).slice(0, 1).map((r) => tile(L(r["지표"]), fmt(r["값"], 3))), tile(t3("문항 수", "Items", "题数"), String(items.length))];
  const charts = [];
  charts.push(card("alpha", t3("신뢰도 — 값이 어느 수준인가", "Reliability — how good is it?", "信度 — 处于什么水平"), t3(`α = ${fmt(al["값"], 3)} — ${al["값"] >= 0.9 ? "매우 높음" : al["값"] >= 0.8 ? "높음" : al["값"] >= 0.7 ? "수용 가능" : "낮음"}`, `α = ${fmt(al["값"], 3)} — ${al["값"] >= 0.9 ? "excellent" : al["값"] >= 0.8 ? "good" : al["값"] >= 0.7 ? "acceptable" : "low"}`, `α = ${fmt(al["값"], 3)} — ${al["값"] >= 0.9 ? "优秀" : al["값"] >= 0.8 ? "良好" : al["값"] >= 0.7 ? "可接受" : "偏低"}`),
    t3("검은 막대가 추정값, 회색 가는 선이 95% 신뢰구간입니다. 색 띠는 일반적인 해석 기준(0.6 · 0.7 · 0.8)입니다.", "Black bar = estimate, grey line = 95% CI. Bands show common benchmarks (0.6 · 0.7 · 0.8).", "黑色柱为估计值,灰线为 95% 区间;色带为常用标准(0.6 · 0.7 · 0.8)。"),
    <Bullets items={rel.filter((r) => isNum(r["값"])).map((r) => ({ label: L(r["지표"]), value: r["값"], lo: r["95% 하한"], hi: r["95% 상한"], min: 0.5, max: 1, bands: bandsAlpha, fmt: (v) => fmt(v, 3), target: 0.7 }))} />, dtab([t3("지표", "Index", "指标"), t3("값", "value", "值"), "lo", "hi"], rel.map((r) => [L(r["지표"]), r["값"], r["95% 하한"], r["95% 상한"]]))));
  if (items.length) {
    charts.push(card("itc", t3("문항-전체 상관 — 문항이 척도와 얼마나 같은 방향인가", "Corrected item–total correlation", "校正后题总相关"), t3("0.3 미만이면 척도와 잘 맞지 않는 문항입니다.", "Below 0.3 the item fits the scale poorly.", "低于 0.3 表示该题与量表不太吻合。"), null,
      <Bars items={items.map((r) => ({ label: L(r["문항"]), value: r["수정된 문항-전체 상관"], color: r["수정된 문항-전체 상관"] < 0.3 ? BAD : C(0) }))} marks={[{ value: 0.3, label: ".30" }]} fmtv={(v) => fmt(v, 3)} />, dtab([t3("문항", "Item", "题"), "mean", "SD", "r(it)", "α if deleted"], items.map((r) => [L(r["문항"]), r["평균"], r["SD"], r["수정된 문항-전체 상관"], r["제거 시 α"]]))));
    charts.push(card("del", t3("문항을 빼면 α는 어떻게 되나", "What happens to α if an item is deleted?", "删除某题后 α 如何变化"), t3("점선보다 오른쪽(α가 올라감)인 문항은 신뢰도를 깎는 문항일 수 있습니다.", "Items to the right of the dashed line (α rises when removed) may be hurting reliability.", "位于虚线右侧(删除后 α 上升)的题目可能拉低了信度。"),
      t3("점선은 전체 α입니다. 점이 왼쪽에 있으면 그 문항을 빼면 신뢰도가 떨어진다는 뜻이므로 남겨야 합니다.", "The dashed line is the overall α. A point on the left means removing the item lowers reliability, so keep it.", "虚线为总体 α。点在左侧表示删除该题会降低信度,应保留。"),
      <Forest rows={items.map((r) => ({ label: L(r["문항"]), est: r["제거 시 α"], color: r["제거 시 α"] > al["값"] ? C(1) : C(0) }))} ref0={al["값"]} vfmt={(v) => fmt(v, 3)} showVals />, null));
  }
  return { tiles, charts };
};

X.M22 = (R) => {
  const eg = objs(tb(R, /^고유값/)), ld = tb(R, /적재행렬/), ex = objs(tb(R, /설명한 몫/)), nf = objs(tb(R, /요인 수 결정/)); if (!eg.length) return null;
  const k = nf[0] ? nf[0]["제안 요인 수"] : null, loadings = objs(ld), fcols = ld ? ld.columns.map((c) => c.name).filter((n) => /^요인\s*\d+$/.test(n)) : [];
  const kmo = loadings.length ? loadings[0]["KMO"] : null;
  const tiles = [k != null && tile(t3("제안 요인 수", "Suggested factors", "建议因子数"), String(k), L(nf[0]["방법"]), "c2"), ex.length && tile(t3("누적 설명분산", "Cumulative variance", "累计解释方差"), `${fmt(ex[ex.length - 1]["누적(%)"], 1)}%`, `${ex.length} ${t3("요인", "factors", "因子")}`), isNum(kmo) && tile("KMO (MSA)", fmt(kmo, 2), kmo >= 0.8 ? t3("매우 적합", "meritorious", "非常适合") : kmo >= 0.6 ? t3("적합", "adequate", "适合") : t3("부족", "poor", "不足"), kmo >= 0.6 ? "good" : "warn")].filter(Boolean);
  const charts = [];
  charts.push(card("scree", t3("스크리 도표 — 요인은 몇 개인가", "Scree plot — how many factors?", "碎石图 — 有几个因子"), t3(k != null ? `고유값이 1보다 큰 지점까지 ${k}개 요인을 제안합니다.` : "고유값이 급격히 꺾이는 곳까지가 요인 수입니다.", k != null ? `The eigenvalue>1 rule suggests ${k} factors.` : "Keep factors before the elbow.", k != null ? `特征值>1 准则建议 ${k} 个因子。` : "保留拐点之前的因子。"),
    t3("고유값이 급격히 떨어지는 ‘팔꿈치’ 앞까지, 그리고 고유값 1(점선) 위에 있는 성분의 수가 요인 수의 단서입니다.", "Look at the ‘elbow’ where eigenvalues drop sharply and at components above 1 (dashed line).", "观察特征值急剧下降的“拐点”,以及位于 1(虚线)上方的成分数量。"),
    <Lines series={[{ name: t3("고유값", "eigenvalue", "特征值"), color: C(0), area: true, points: eg.map((r) => ({ x: r["성분"], y: r["고유값"] })) }]} refY={1} xLabel={t3("성분", "Component", "成分")} yLabel={t3("고유값", "Eigenvalue", "特征值")} vlines={k != null ? [{ x: k + 0.5, label: t3(`${k}개`, `${k} factors`, `${k} 个`) }] : []} xDomain={[0.7, eg.length + 0.3]} endLabels={false} xFmt={(v) => (Number.isInteger(v) ? String(v) : "")} />, dtab([t3("성분", "Comp", "成分"), t3("고유값", "eigenvalue", "特征值")], eg.map((r) => [r["성분"], r["고유값"]]))));
  if (fcols.length && loadings.length) {
    const flags = new Set(); loadings.forEach((r, i) => fcols.forEach((c, j) => { if (Math.abs(r[c]) >= 0.4) flags.add(`${i},${j}`); }));
    charts.push(card("load", t3("적재행렬 — 문항이 어느 요인에 묶이나", "Loadings — which factor does each item belong to?", "载荷矩阵 — 各题归入哪个因子"), t3("테두리 칸은 |적재값| ≥ 0.40(뚜렷한 소속)입니다.", "Outlined cells have |loading| ≥ 0.40 (clear membership).", "带边框的格子 |载荷| ≥ 0.40(明确归属)。"),
      t3("행은 문항, 열은 요인입니다. 한 문항이 한 요인에만 진하게 칠해지면 구조가 깔끔하고, 두 요인에 걸치면 교차적재입니다.", "Rows are items, columns factors. An item shaded strongly on one factor only gives a clean structure; shading on two factors means cross-loading.", "行为题目,列为因子。题目仅在一个因子上色深说明结构清晰,在两个因子上都深则为交叉载荷。"),
      <Heat rows={loadings.map((r) => L(r["문항"]))} cols={fcols.map(L)} values={loadings.map((r) => fcols.map((c) => r[c]))} diverge domain={[-1, 1]} flags={flags} text={loadings.map((r) => fcols.map((c) => fmt(r[c], 2)))} cellH={34} minCell={70} />, dtab([t3("문항", "Item", "题"), ...fcols, t3("공통성", "h²", "共同度")], loadings.map((r) => [L(r["문항"]), ...fcols.map((c) => r[c]), r["공통성"]])), { wide: true }));
    charts.push(card("h2", t3("공통성 — 요인이 문항을 얼마나 설명하나", "Communalities", "共同度"), t3("0.5 미만이면 요인 구조로 잘 설명되지 않는 문항입니다.", "Below 0.5 the item is poorly explained by the factors.", "低于 0.5 表示该题难以被因子结构解释。"), null, <Bars items={loadings.map((r) => ({ label: L(r["문항"]), value: r["공통성"], color: r["공통성"] < 0.5 ? BAD : C(0) }))} marks={[{ value: 0.5, label: ".50" }]} fmtv={(v) => fmt(v, 2)} />, null));
    if (loadings.every((r) => isNum(r["KMO"]))) charts.push(card("msa", t3("문항별 표본 적합도(MSA)", "Item sampling adequacy (MSA)", "各题抽样适切性(MSA)"), t3("0.6 이상이면 요인분석에 쓸 만한 문항입니다.", "0.6 or above is acceptable for factor analysis.", "0.6 以上适合做因子分析。"), null, <Bars items={loadings.map((r) => ({ label: L(r["문항"]), value: r["KMO"], color: r["KMO"] < 0.6 ? BAD : C(0) }))} marks={[{ value: 0.6, label: ".60" }]} fmtv={(v) => fmt(v, 2)} />, null));
  }
  if (ex.length) charts.push(card("var", t3("요인이 설명한 분산", "Variance explained", "因子解释的方差"), null, null, <Bars items={ex.map((r) => ({ label: L(r["요인"]), value: r["설명분산(%)"], note: `${t3("누적", "cum.", "累计")} ${fmt(r["누적(%)"], 1)}%` }))} fmtv={(v) => fmt(v, 1)} unit="%" />, null));
  const a = asmCard(R); if (a) charts.push(a);
  return { tiles, charts };
};

X.M23 = (R) => {
  const sel = objs(tb(R, /고른 검정/))[0], gt = tbs(R, /^(맨-휘트니|크루스칼|윌콕슨|프리드먼)/).map((t) => ({ t, rows: objs(t) }))[0], te = objs(tb(R, /^검정$/))[0], r = eff(R, /순위양분/);
  if (!gt) return null;
  const tiles = [sel && tile(t3("고른 검정", "Chosen test", "所选检验"), L(sel["검정"]), L(sel["설계"])), te && tile(isNum(te["U"]) ? "U" : "통계량", fmt(te["U"] ?? te["H"] ?? te["W"] ?? te["χ²"], 1), fp(te["p"]), pTone(te["p"])), r && tile(L(r.name), fmt(r.value, 3), r.interpretation_band ? L(String(r.interpretation_band)) : "", "c2")].filter(Boolean);
  const rows = gt.rows, charts = [];
  if (rows.some((x) => isNum(x["평균순위"]))) charts.push(card("rank", t3("집단별 평균 순위", "Mean rank per group", "各组平均秩"), t3("점수 대신 순위로 비교합니다 — 평균 순위가 높을수록 값이 큰 편입니다.", "Groups are compared on ranks – a higher mean rank means larger values.", "以秩次比较 — 平均秩越高,数值越大。"), t3("비모수 검정은 값 자체가 아니라 순위를 비교하므로 이상치에 강합니다.", "Rank-based tests are robust to outliers because they compare ranks, not raw values.", "非参数检验比较的是秩次而非原值,因此对极端值稳健。"), <Bars items={rows.map((x, i) => ({ label: L(x["집단"]), value: x["평균순위"], color: C(i), note: `n=${x["N"]}` }))} fmtv={(v) => fmt(v, 1)} />, dtab([t3("집단", "Group", "组"), "N", t3("중앙값", "median", "中位数"), t3("평균순위", "mean rank", "平均秩")], rows.map((x) => [L(x["집단"]), x["N"], x["중앙값"], x["평균순위"]]))));
  if (rows.some((x) => isNum(x["중앙값"]))) charts.push(card("med", t3("집단별 중앙값", "Median per group", "各组中位数"), null, null, <Bars items={rows.map((x, i) => ({ label: L(x["집단"]), value: x["중앙값"], color: C(i), note: `n=${x["N"]}` }))} fmtv={(v) => fmt(v, 2)} />, null));
  const e = effCard(R); if (e) charts.push(e);
  const a = asmCard(R); if (a) charts.push(a);
  return { tiles, charts };
};

X.M24 = (R) => {
  const k = kv(tb(R, /표본크기/)); if (!Object.keys(k).length) return null;
  const power = num(k["검정력"]), d = num(k["효과크기 (코헨 d)"]), per = num(k["집단당 사례 수"]), total = num(k["전체 사례 수"]), alpha = num(k["유의수준 α"]);
  const tiles = [isNum(total) && tile(t3("필요한 전체 사례", "Total sample needed", "所需总样本"), String(total), isNum(per) ? t3(`집단당 ${per}`, `${per} per group`, `每组 ${per}`) : "", "c2"), isNum(power) && tile(t3("검정력", "Power", "检验力"), fmt(power, 2), `α=${alpha}`), isNum(d) && tile(t3("효과크기 d", "Effect size d", "效应量 d"), fmt(d, 2), d >= 0.8 ? t3("큼", "large", "大") : d >= 0.5 ? t3("보통", "medium", "中") : t3("작음", "small", "小"))].filter(Boolean);
  const charts = [];
  if (isNum(power)) charts.push(card("pow", t3("목표 검정력", "Target power", "目标检验力"), t3(`효과가 실제로 있다면 ${fmt(power * 100, 0)}% 확률로 찾아냅니다.`, `If the effect is real you will detect it ${fmt(power * 100, 0)}% of the time.`, `若效应真实存在,有 ${fmt(power * 100, 0)}% 的概率检出。`), t3("관례는 0.80 이상입니다. 사례 수를 늘리면 검정력이 올라갑니다.", "The convention is ≥ 0.80. More cases raise power.", "惯例为 ≥ 0.80;增加样本量可提高检验力。"), <Arc value={power} min={0} max={1} label={t3("검정력", "power", "检验力")} sub={`α = ${alpha}`} bands={[{ to: 0.5, color: "bad", label: "<.5" }, { to: 0.8, color: "warn", label: "<.8" }, { to: 1, color: "ok", label: "≥.8" }]} fmtv={(v) => fmt(v, 2)} />, null));
  if (isNum(per) && isNum(total)) charts.push(card("n", t3("표본 구성", "Sample composition", "样本构成"), t3(`집단당 ${per}명, 모두 ${total}명`, `${per} per group, ${total} in total`, `每组 ${per},共 ${total}`), t3("100칸 중 칠해진 칸이 각 집단의 몫입니다.", "Of 100 squares, the coloured ones show each group's share.", "100 格中的着色格表示各组占比。"), <Waffle parts={Array.from({ length: Math.round(total / per) || 1 }, (_, i) => ({ label: `${t3("집단", "Group", "组")} ${i + 1}`, value: per }))} />, null));
  if (isNum(d)) charts.push(card("d", t3("가정한 효과크기", "Assumed effect size", "假定效应量"), null, null, <Bullets items={[effItem({ name: "코헨 d", value: d }, "Cohen d")]} />, null));
  charts.push(card("tab", t3("설계 요약", "Design summary", "设计概要"), null, null, <div style={{ fontSize: 13, lineHeight: 1.9 }}>{Object.entries(k).map(([a, b]) => <div key={a} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--dv-edge)", padding: "2px 0" }}><span style={{ color: "var(--dv-mute)" }}>{L(a)}</span><b>{L(b)}</b></div>)}</div>, null));
  return { tiles, charts };
};

X.M25 = (R) => {
  const ld = objs(tb(R, /적재값/)), fit = kv(tb(R, /적합도/)); if (!ld.length) return null;
  const facs = [...new Set(ld.map((r) => String(r["요인"])))];
  const tiles = [isNum(fit["CFI"]) && tile("CFI", fmt(fit["CFI"], 3), fit["CFI"] >= 0.95 ? t3("우수", "good", "优秀") : fit["CFI"] >= 0.9 ? t3("수용", "acceptable", "可接受") : t3("부족", "poor", "不足"), fit["CFI"] >= 0.95 ? "good" : "warn"), isNum(fit["RMSEA"]) && tile("RMSEA", fmt(fit["RMSEA"], 3), fit["RMSEA"] <= 0.06 ? t3("우수", "good", "优秀") : fit["RMSEA"] <= 0.08 ? t3("수용", "acceptable", "可接受") : t3("부족", "poor", "不足"), fit["RMSEA"] <= 0.06 ? "good" : "warn"), isNum(fit["SRMR"]) && tile("SRMR", fmt(fit["SRMR"], 3), fit["SRMR"] <= 0.08 ? t3("우수", "good", "优秀") : t3("부족", "poor", "不足"), fit["SRMR"] <= 0.08 ? "good" : "warn")].filter(Boolean);
  const charts = [];
  charts.push(card("path", t3("측정 모형 — 요인이 문항을 얼마나 이끄는가", "Measurement model — how strongly each factor drives its items", "测量模型 — 因子对各题的驱动程度"), t3("타원은 잠재 요인, 상자는 문항, 화살표 위 숫자는 표준화 적재값입니다.", "Ellipse = latent factor, boxes = items, numbers = standardised loadings.", "椭圆为潜因子,方框为题目,数字为标准化载荷。"),
    t3("화살표가 굵고 숫자가 클수록(0.7 이상이면 강함) 문항이 요인을 잘 대표합니다. 0.5 미만은 약한 문항입니다.", "Thicker arrows and larger numbers (≥ 0.7 is strong) mean the item represents the factor well; < 0.5 is weak.", "箭头越粗、数字越大(≥ 0.7 为强),题目越能代表因子;< 0.5 为弱。"),
    <PathDiagram nodes={[...facs.map((f, i) => ({ id: "F" + f, label: L(f), kind: "latent", layer: 0, fy: facs.length === 1 ? 0.5 : (i + 0.5) / facs.length })), ...ld.map((r) => ({ id: "I" + r["문항"], label: L(r["문항"]), kind: "item", layer: 1 }))]} edges={ld.map((r) => ({ from: "F" + r["요인"], to: "I" + r["문항"], value: r["표준화"], label: fmt(r["표준화"], 2) }))} height={Math.max(280, ld.length * 52)} />, dtab([t3("문항", "Item", "题"), t3("요인", "Factor", "因子"), t3("비표준화", "unstd", "非标准化"), t3("표준화", "std", "标准化"), "SE", "p"], ld.map((r) => [L(r["문항"]), L(r["요인"]), r["비표준화"], r["표준화"], r["SE"], r["p"]])), { wide: true }));
  charts.push(card("ld", t3("표준화 적재값", "Standardised loadings", "标准化载荷"), t3("초록 ≥ .70 · 청록 .50~.70 · 빨강 < .50", "≥ .70 strong · .50–.70 acceptable · < .50 weak", "≥ .70 强 · .50–.70 可接受 · < .50 弱"), null,
    <Bars items={[...ld].sort((a, b) => b["표준화"] - a["표준화"]).map((r) => ({ label: L(r["문항"]), value: r["표준화"], color: r["표준화"] >= 0.7 ? C(0) : r["표준화"] >= 0.5 ? C(5) : BAD }))} marks={[{ value: 0.5, label: ".5" }, { value: 0.7, label: ".7" }]} fmtv={(v) => fmt(v, 3)} />, null));
  const bl = [];
  if (isNum(fit["CFI"])) bl.push({ label: "CFI", value: fit["CFI"], min: 0.8, max: 1, bands: [{ to: 0.9, color: "bad", label: "<.90" }, { to: 0.95, color: "warn", label: "<.95" }, { to: 1, color: "ok", label: "≥.95" }], fmt: (v) => fmt(v, 3) });
  if (isNum(fit["TLI"])) bl.push({ label: "TLI", value: fit["TLI"], min: 0.8, max: 1, bands: [{ to: 0.9, color: "bad", label: "<.90" }, { to: 0.95, color: "warn", label: "<.95" }, { to: 1, color: "ok", label: "≥.95" }], fmt: (v) => fmt(v, 3) });
  if (isNum(fit["RMSEA"])) bl.push({ label: "RMSEA", value: fit["RMSEA"], min: 0, max: 0.15, bands: [{ to: 0.06, color: "ok", label: "≤.06" }, { to: 0.08, color: "warn", label: "≤.08" }, { to: 0.15, color: "bad", label: ">.08" }], fmt: (v) => fmt(v, 3) });
  if (isNum(fit["SRMR"])) bl.push({ label: "SRMR", value: fit["SRMR"], min: 0, max: 0.15, bands: [{ to: 0.08, color: "ok", label: "≤.08" }, { to: 0.15, color: "bad", label: ">.08" }], fmt: (v) => fmt(v, 3) });
  if (bl.length) charts.push(card("fit", t3("모형 적합도 — 자료와 얼마나 맞나", "Model fit indices", "模型拟合指数"), t3(`χ²(${fit["df"]}) = ${fmt(fit["χ²"], 2)}, ${fp(fit["p"])} (p가 크면 모형이 자료와 어긋나지 않음)`, `χ²(${fit["df"]}) = ${fmt(fit["χ²"], 2)}, ${fp(fit["p"])} (a large p = no significant misfit)`, `χ²(${fit["df"]}) = ${fmt(fit["χ²"], 2)},${fp(fit["p"])}(p 大表示无显著失拟)`),
    t3("검은 막대가 내 모형의 값이며, 초록 띠 안에 있으면 널리 쓰는 기준을 충족합니다(CFI·TLI ≥ .95, RMSEA ≤ .06, SRMR ≤ .08).", "The black bar is your model; inside the green band it meets common cut-offs (CFI/TLI ≥ .95, RMSEA ≤ .06, SRMR ≤ .08).", "黑色柱为本模型取值;位于绿色区间即满足常用标准(CFI/TLI ≥ .95,RMSEA ≤ .06,SRMR ≤ .08)。"), <Bullets items={bl} />, null));
  return { tiles, charts };
};

X.M26 = (R) => {
  const st = objs(tb(R, /측정동일성 단계/)); if (st.length < 2) return null;
  const names = st.map((r) => L(String(r["단계"]).replace(/ 동일성$/, "")));
  const dc = st.filter((r) => isNum(r["ΔCFI"])), worst = dc.length ? dc.reduce((m, r) => (Math.abs(r["ΔCFI"]) > Math.abs(m["ΔCFI"]) ? r : m), dc[0]) : null;
  const last = st[st.length - 1];
  const tiles = [tile(t3("마지막 단계", "Last step", "最后一步"), L(last["단계"]), `CFI ${fmt(last["CFI"], 3)} · RMSEA ${fmt(last["RMSEA"], 3)}`), worst && tile(t3("가장 큰 ΔCFI", "Largest ΔCFI", "最大 ΔCFI"), fmt(worst["ΔCFI"], 4), Math.abs(worst["ΔCFI"]) <= 0.01 ? t3("기준(.01) 이내", "within .01", "在 .01 内") : t3("기준 초과", "exceeds .01", "超过 .01"), Math.abs(worst["ΔCFI"]) <= 0.01 ? "good" : "warn")].filter(Boolean);
  const charts = [];
  charts.push(card("cfi", t3("제약을 더할수록 적합도가 유지되는가 — CFI", "Does fit hold as constraints are added? — CFI", "增加约束后拟合是否保持 — CFI"), t3("단계가 올라갈수록 같은 것으로 묶는 모수가 늘어납니다.", "Each step constrains more parameters to be equal across groups.", "每升一步,跨组相等的参数更多。"),
    t3("CFI가 거의 내려가지 않으면(.01 이내) 그 수준의 동일성이 성립합니다. 점선은 ‘형태 동일성 − 0.01’ 기준선입니다.", "If CFI barely drops (within .01) that level of invariance holds. The dashed line is ‘configural − 0.01’.", "CFI 几乎不下降(.01 以内)说明该水平的等值性成立;虚线为“形态等值 − 0.01”基准线。"),
    <Lines xCats={names} series={[{ name: "CFI", color: C(0), points: st.map((r, i) => ({ x: i, y: r["CFI"] })) }, { name: t3("기준(−.01)", "cut-off (−.01)", "基准(−.01)"), color: BAD, dash: "5 4", markers: false, width: 1.8, points: st.map((r, i) => ({ x: i, y: st[0]["CFI"] - 0.01 })) }]} height={250} yFmt={(v) => fmt(v, 3)} />, dtab([t3("단계", "Step", "步骤"), "χ²", "df", "CFI", "RMSEA", "ΔCFI"], st.map((r) => [L(r["단계"]), r["χ²"], r["df"], r["CFI"], r["RMSEA"], r["ΔCFI"]]))));
  charts.push(card("rmsea", "RMSEA", t3("0.06 이하면 우수, 0.08 이하면 수용할 만합니다.", "≤ 0.06 good, ≤ 0.08 acceptable.", "≤ 0.06 优秀,≤ 0.08 可接受。"), null, <Lines xCats={names} series={[{ name: "RMSEA", color: C(1), points: st.map((r, i) => ({ x: i, y: r["RMSEA"] })) }]} refY={0.06} height={230} yFmt={(v) => fmt(v, 3)} endLabels={false} />, null));
  const dd = st.filter((r) => isNum(r["Δp"]));
  if (dd.length) charts.push(card("dp", t3("카이제곱 차이 검정의 p", "p of the χ² difference test", "χ² 差异检验的 p"), t3("p가 .05보다 크면 제약을 더해도 적합이 나빠지지 않은 것입니다.", "p > .05 means adding the constraint did not worsen the fit.", "p > .05 表示增加约束并未使拟合变差。"), null, <Bars items={dd.map((r) => ({ label: L(r["단계"]), value: r["Δp"], color: r["Δp"] > 0.05 ? C(0) : BAD }))} marks={[{ value: 0.05, label: ".05" }]} fmtv={(v) => fmt(v, 3)} />, null));
  return { tiles, charts };
};

export default X;
