/* 기법별 시각화 설계 3 — M27 ~ M43 (IRT·경로·성장·유형·다층·생존·시계열·인과·메타·베이지안) */
import { Arc, Bars, Bullets, Forest, Heat } from "./charts1.jsx";
import { Donut, Funnel, Lines, Network, PathDiagram, Scatter, Stack100, Waffle } from "./charts2.jsx";
import { C, BAD, OK, WARN, Pills, asmCard, card, ciForest, clip, col, dtab, eff, effCard, effItem, fmt, fp, isNum, kv, L, num, objs, pTone, pdfNorm, roleVars, sgn, star, t3, tb, tbs, tile } from "./bh.jsx";

const X = {};
const stars3 = (p) => `${fp(p)}${star(p)}`;
const nums = (s) => (String(s ?? "").match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/gi) || []).map(Number);

X.M27 = (R) => {
  const it = objs(tb(R, /문항 모수/)), fit = kv(tb(R, /모형 적합/)); if (!it.length) return null;
  const th = Array.from({ length: 81 }, (_, i) => -4 + i * 0.1);
  const P = (r, x) => (r["추측 c"] || 0) + (1 - (r["추측 c"] || 0)) / (1 + Math.exp(-r["변별도 a"] * (x - r["곤란도 b"])));
  const info = th.map((x) => it.reduce((s, r) => { const p = P(r, x), c = r["추측 c"] || 0; return s + r["변별도 a"] ** 2 * ((1 - p) / p) * (((p - c) / (1 - c)) ** 2); }, 0));
  const peak = info.indexOf(Math.max(...info));
  const mb = it.reduce((s, r) => s + r["곤란도 b"], 0) / it.length, ma = it.reduce((s, r) => s + r["변별도 a"], 0) / it.length;
  const tiles = [tile(t3("문항 수", "Items", "题数"), String(it.length), isNum(fit["사례 수"]) ? `N=${fit["사례 수"]}` : ""), tile(t3("평균 곤란도 b", "Mean difficulty b", "平均难度 b"), fmt(mb, 2), t3("높을수록 어려움", "higher = harder", "越高越难"), "c2"), tile(t3("평균 변별도 a", "Mean discrimination a", "平均区分度 a"), fmt(ma, 2), ma >= 1 ? t3("변별 좋음", "good", "区分良好") : t3("낮음", "low", "偏低"), ma >= 1 ? "good" : "warn"), isNum(fit["최대 검사정보"]) && tile(t3("최대 검사정보", "Max test information", "最大测验信息量"), fmt(fit["최대 검사정보"], 1), `θ≈${fmt(th[peak], 1)}`)].filter(Boolean);
  const charts = [];
  charts.push(card("icc", t3("문항특성곡선 — 능력이 오를 때 정답 확률", "Item characteristic curves — P(correct) vs ability", "题目特征曲线 — 能力与答对概率"), t3("곡선이 왼쪽에 있을수록 쉬운 문항, 가파를수록 변별력이 큽니다.", "Curves further left are easier; steeper curves discriminate better.", "曲线越靠左题越容易,越陡区分度越高。"),
    t3("가로축은 능력(θ), 세로축은 정답 확률입니다. 곡선이 50%를 지나는 지점이 곤란도 b이고, 그 지점의 기울기가 변별도 a입니다.", "x = ability θ, y = probability of a correct answer. The point where a curve crosses 50% is the difficulty b; its slope is the discrimination a.", "横轴为能力 θ,纵轴为答对概率;曲线穿过 50% 的位置为难度 b,该处斜率为区分度 a。"),
    <Lines series={it.map((r, i) => ({ name: L(r["문항"]), color: C(i), markers: false, width: 2.2, points: th.map((x) => ({ x, y: P(r, x) })) }))} refY={0.5} yDomain={[0, 1]} xLabel="θ" yLabel={t3("정답 확률", "P(correct)", "答对概率")} xDomain={[-4, 4]} height={300} xFmt={(v) => fmt(v, 0)} yFmt={(v) => fmt(v, 1)} />, dtab([t3("문항", "Item", "题"), "b", "a", "c"], it.map((r) => [L(r["문항"]), r["곤란도 b"], r["변별도 a"], r["추측 c"]])), { wide: true }));
  charts.push(card("tif", t3("검사정보곡선 — 어떤 능력 수준을 가장 정밀하게 재나", "Test information — where does the test measure best?", "测验信息曲线 — 在哪个能力水平测得最准"), t3(`정보량이 가장 큰 곳은 θ ≈ ${fmt(th[peak], 1)} 입니다.`, `Information peaks near θ ≈ ${fmt(th[peak], 1)}.`, `信息量在 θ ≈ ${fmt(th[peak], 1)} 附近最大。`),
    t3("각 문항의 정보량(변별도²×확률의 변동)을 모두 더한 곡선입니다. 높을수록 그 능력 수준의 사람을 더 정밀하게 구별합니다.", "The sum of item information over ability. The higher the curve, the more precisely that ability level is measured.", "为各题信息量之和;曲线越高,该能力水平测得越精确。"),
    <Lines series={[{ name: t3("검사정보", "information", "信息量"), color: C(1), area: true, markers: false, points: th.map((x, i) => ({ x, y: info[i] })) }]} vlines={[{ x: th[peak], label: `θ=${fmt(th[peak], 1)}`, color: C(1) }]} xLabel="θ" xDomain={[-4, 4]} endLabels={false} height={250} xFmt={(v) => fmt(v, 0)} />, null));
  charts.push(card("sc", t3("문항의 위치 — 곤란도 × 변별도", "Item map — difficulty × discrimination", "题目分布 — 难度 × 区分度"), t3("오른쪽 위(어렵고 변별력 큼)와 왼쪽 위(쉽고 변별력 큼) 문항이 좋은 문항입니다.", "Items in the upper part (high discrimination) are the best; those near the bottom discriminate poorly.", "上方(区分度高)的题目较好;靠下的区分度较差。"), null,
    <Scatter points={it.map((r, i) => ({ x: r["곤란도 b"], y: r["변별도 a"], label: L(r["문항"]), r: 7, color: C(i) }))} refY={1} xLabel={t3("곤란도 b", "difficulty b", "难度 b")} yLabel={t3("변별도 a", "discrimination a", "区分度 a")} />, null));
  charts.push(card("lad", t3("곤란도 사다리 (b ± 1.96 SE)", "Difficulty ladder (b ± 1.96 SE)", "难度阶梯(b ± 1.96 SE)"), null, null, <Forest rows={[...it].sort((a, b) => a["곤란도 b"] - b["곤란도 b"]).map((r, i) => ({ label: L(r["문항"]), est: r["곤란도 b"], lo: r["곤란도 b"] - 1.96 * r["SE(b)"], hi: r["곤란도 b"] + 1.96 * r["SE(b)"], color: C(i) }))} ref0={0} vfmt={(v) => fmt(v, 2)} />, null));
  return { tiles, charts };
};

function pathNodes(rows, latent = false) {
  const names = [...new Set(rows.flatMap((r) => [String(r["From"]), String(r["To"])]))];
  return names.map((n) => ({ id: n, label: L(n), kind: latent ? "latent" : "obs" }));
}

X.M28 = (R) => {
  const pc = objs(tb(R, /경로 계수/)), ef = objs(tb(R, /직·간접/)), ft = kv(tb(R, /모형 적합도/)); if (!pc.length) return null;
  const tiles = pc.map((r) => tile(`${L(r["From"])} → ${L(r["To"])}`, `β ${fmt(r["β"], 2)}`, stars3(r["p"]), pTone(r["p"]))).slice(0, 4);
  const charts = [];
  charts.push(card("path", t3("경로 모형 — 변수 사이의 영향 방향", "Path model — directions of influence", "路径模型 — 变量间的影响方向"), t3("화살표가 굵을수록 표준화 계수(β)가 큽니다. 점선은 유의하지 않은 경로입니다.", "Thicker arrows = larger standardised β; dashed arrows are non-significant.", "箭头越粗,标准化系数 β 越大;虚线为不显著路径。"),
    t3("화살표 위 숫자는 표준화 계수 β입니다. 한 변수에서 다른 변수로 이어지는 연쇄(A→B→C)는 간접효과를 만들며, 아래의 효과 분해에서 수치로 확인합니다.", "Numbers on arrows are standardised β. Chains (A→B→C) create indirect effects, quantified in the decomposition below.", "箭头上的数字为标准化系数 β。链式路径(A→B→C)产生间接效应,见下方效应分解。"),
    <PathDiagram nodes={pathNodes(pc)} edges={pc.map((r) => ({ from: String(r["From"]), to: String(r["To"]), value: r["β"], label: `${fmt(r["β"], 2)}${star(r["p"])}`, sig: r["p"] < 0.05 }))} />, dtab(["From", "To", "B", "SE", "p", "β"], pc.map((r) => [L(r["From"]), L(r["To"]), r["B"], r["SE"], r["p"], r["β"]])), { wide: true }));
  if (ef.length) charts.push(card("dec", t3("총효과 = 직접효과 + 간접효과", "Total = direct + indirect effect", "总效应 = 直接效应 + 间接效应"), null, t3("원래 단위(B)의 효과입니다. 간접효과가 크다면 중간 변수를 거쳐 영향이 전달됩니다.", "Effects in original units (B). A large indirect effect means influence travels through the intermediate variable.", "为原单位(B)的效应;间接效应大说明影响通过中间变量传递。"),
    <Bars items={ef.flatMap((r) => [{ label: `${L(r["From"])}→${L(r["To"])} ${t3("직접", "direct", "直接")}`, value: r["직접"], color: C(1) }, { label: `${t3("간접", "indirect", "间接")}`, value: r["간접"], color: C(0) }, { label: `${t3("총", "total", "总")}`, value: r["총"], color: C(5) }])} fmtv={(v) => fmt(v, 3)} />, dtab(["From", "To", t3("직접", "direct", "直接"), t3("간접", "indirect", "间接"), t3("총", "total", "总")], ef.map((r) => [L(r["From"]), L(r["To"]), r["직접"], r["간접"], r["총"]]))));
  if (isNum(ft["자유도"]) && ft["자유도"] === 0) charts.push(card("sat", t3("모형 적합도", "Model fit", "模型拟合"), t3("자유도가 0인 포화 모형이라 적합도 지수를 해석하지 않습니다(항상 완벽하게 맞음).", "A saturated model (df = 0): fit indices are not interpretable (the model always fits perfectly).", "自由度为 0 的饱和模型,拟合指数无需解释(总是完美拟合)。"), null, <p className="dv-note">χ² = 0, df = 0</p>, null));
  else if (Object.keys(ft).length) charts.push(card("fit", t3("모형 적합도", "Model fit", "模型拟合"), null, null, <Bullets items={[isNum(ft["RMSEA"]) && { label: "RMSEA", value: ft["RMSEA"], min: 0, max: 0.15, bands: [{ to: 0.06, color: "ok", label: "≤.06" }, { to: 0.08, color: "warn", label: "≤.08" }, { to: 0.15, color: "bad", label: ">.08" }], fmt: (v) => fmt(v, 3) }, isNum(ft["SRMR"]) && { label: "SRMR", value: ft["SRMR"], min: 0, max: 0.15, bands: [{ to: 0.08, color: "ok", label: "≤.08" }, { to: 0.15, color: "bad", label: ">.08" }], fmt: (v) => fmt(v, 3) }].filter(Boolean)} />, null));
  return { tiles, charts };
};

X.M29 = (R) => {
  const sp = objs(tb(R, /구조 경로/)); if (!sp.length) return null;
  const tiles = sp.map((r) => tile(`${L(r["From"])} → ${L(r["To"])}`, `β ${fmt(r["표준화"], 2)}`, stars3(r["p"]), pTone(r["p"]))).slice(0, 4);
  const charts = [];
  charts.push(card("path", t3("구조 모형 — 잠재변수 사이의 경로", "Structural model — paths between latent variables", "结构模型 — 潜变量间路径"), t3("타원은 잠재변수입니다. 청록은 양(+), 장밋빛은 음(−)의 경로입니다.", "Ellipses are latent variables. Teal = positive, rose = negative paths.", "椭圆为潜变量;青绿为正路径,玫红为负路径。"),
    t3("화살표 위 숫자는 표준화 경로계수입니다. 굵을수록 영향이 큽니다. 점선은 5% 수준에서 유의하지 않은 경로입니다.", "Numbers are standardised path coefficients; thicker = stronger. Dashed paths are not significant at 5%.", "数字为标准化路径系数,越粗影响越大;虚线为 5% 水平不显著的路径。"),
    <PathDiagram nodes={pathNodes(sp, true)} edges={sp.map((r) => ({ from: String(r["From"]), to: String(r["To"]), value: r["표준화"], label: `${fmt(r["표준화"], 2)}${star(r["p"])}`, sig: r["p"] < 0.05 }))} />, dtab(["From", "To", "B", "SE", "p", "β"], sp.map((r) => [L(r["From"]), L(r["To"]), r["B"], r["SE"], r["p"], r["표준화"]])), { wide: true }));
  charts.push(card("beta", t3("경로계수 크기 순서 (표준화)", "Path coefficients ranked (standardised)", "路径系数排序(标准化)"), null, null, <Bars items={[...sp].sort((a, b) => Math.abs(b["표준화"]) - Math.abs(a["표준화"])).map((r) => ({ label: `${L(r["From"])} → ${L(r["To"])}`, value: r["표준화"], note: stars3(r["p"]) }))} colorBySign fmtv={(v) => sgn(v, 3)} />, null));
  charts.push(card("B", t3("비표준화 계수 B ± 1.96 SE", "Unstandardised B ± 1.96 SE", "非标准化 B ± 1.96 SE"), null, null, <Forest rows={sp.map((r) => ({ label: `${L(r["From"])} → ${L(r["To"])}`, est: r["B"], lo: r["B"] - 1.96 * r["SE"], hi: r["B"] + 1.96 * r["SE"], color: r["B"] >= 0 ? C(0) : C(3) }))} ref0={0} vfmt={(v) => fmt(v, 3)} />, null));
  const a = asmCard(R); if (a) charts.push(a);
  return { tiles, charts };
};

X.M30 = (R) => {
  const pr = objs(tb(R, /잠재성장 모수/)); if (pr.length < 2) return null;
  const I = pr[0], S = pr[1], rr = pr.find((r) => /r$/.test(String(r["모수"]))), tv = roleVars(R, "time"), T = Math.max(tv.length, 3);
  const vi = I["분산"], vs = S["분산"], cov = isNum(rr?.["평균"]) ? rr["평균"] * Math.sqrt(vi * vs) : 0;
  const pts = Array.from({ length: T }, (_, t) => ({ x: t, y: I["평균"] + S["평균"] * t, sd: Math.sqrt(Math.max(0, vi + t * t * vs + 2 * t * cov)) }));
  const tiles = [tile(t3("초기값 평균", "Mean intercept", "初始值均值"), fmt(I["평균"], 2), t3(`개인차 SD ${fmt(Math.sqrt(vi), 2)}`, `SD ${fmt(Math.sqrt(vi), 2)}`, `个体 SD ${fmt(Math.sqrt(vi), 2)}`)), tile(t3("변화율 평균", "Mean slope", "变化率均值"), sgn(S["평균"], 2), t3(`시점당 · 개인차 SD ${fmt(Math.sqrt(vs), 2)}`, `per wave · SD ${fmt(Math.sqrt(vs), 2)}`, `每波 · 个体 SD ${fmt(Math.sqrt(vs), 2)}`), "c2"), isNum(rr?.["평균"]) && tile(t3("초기값–변화율 상관", "Intercept–slope r", "初值-变化率相关"), fmt(rr["평균"], 2), rr["평균"] < 0 ? t3("처음 높을수록 덜 늘어남", "higher start, slower growth", "起点越高增长越慢") : t3("처음 높을수록 더 늘어남", "higher start, faster growth", "起点越高增长越快"))].filter(Boolean);
  const charts = [];
  charts.push(card("traj", t3("성장 궤적 — 평균 변화와 개인차", "Growth trajectory — mean change and individual differences", "成长轨迹 — 平均变化与个体差异"), t3(`평균 궤적은 시점마다 ${sgn(S["평균"], 2)}씩 변합니다. 띠는 개인 궤적의 퍼짐(±1 SD)입니다.`, `The mean trajectory changes by ${sgn(S["평균"], 2)} per wave; the band is the spread of individual trajectories (±1 SD).`, `平均轨迹每波变化 ${sgn(S["평균"], 2)};色带为个体轨迹的离散(±1 SD)。`),
    t3("굵은 선이 평균 성장선이고, 띠의 폭은 초기값·변화율의 분산(과 둘의 상관)으로 계산한 개인 궤적의 퍼짐입니다(측정 오차는 제외). 띠가 시간이 지날수록 넓어지면 사람마다 변화 속도가 다르다는 뜻입니다.", "The thick line is the mean growth line; the band is the spread of individual trajectories computed from the intercept/slope variances and their correlation (measurement error excluded). A widening band means people change at different rates.", "粗线为平均成长线;色带宽度由初始值/变化率方差及其相关计算(不含测量误差)。色带随时间变宽说明个体变化速度不同。"),
    <Lines xCats={Array.from({ length: T }, (_, t) => (tv[t] ? L(tv[t]) : `t${t + 1}`))} series={[{ name: t3("평균", "mean", "均值"), color: C(0), width: 3.4, points: pts.map((p) => ({ x: p.x, y: p.y, lo: p.y - p.sd, hi: p.y + p.sd })) }]} height={280} endLabels={false} />, dtab([t3("시점", "Wave", "波"), t3("평균", "mean", "均值"), "SD"], pts.map((p) => [p.x + 1, p.y, p.sd])), { wide: true }));
  charts.push(card("var", t3("개인차의 크기 — 분산", "Individual differences — variances", "个体差异 — 方差"), t3("분산이 클수록 사람마다 초기값(또는 변화 속도)이 크게 다릅니다.", "A larger variance means people differ more in starting level (or rate of change).", "方差越大,个体间初始值(或变化速度)差异越大。"), null,
    <Bars items={pr.filter((r) => isNum(r["분산"])).map((r, i) => ({ label: L(r["모수"]), value: r["분산"], color: C(i) }))} fmtv={(v) => fmt(v, 2)} />, dtab([t3("모수", "Parameter", "参数"), t3("평균", "mean", "均值"), t3("분산", "variance", "方差")], pr.map((r) => [L(r["모수"]), r["평균"], r["분산"]]))));
  return { tiles, charts };
};

X.M31 = (R) => {
  const kt = objs(tb(R, /유형 수 비교/)), pf = tb(R, /유형별 프로파일/); if (!kt.length) return null;
  const best = kt.reduce((m, r) => (r["BIC"] < m["BIC"] ? r : m), kt[0]);
  const prof = objs(pf), inds = pf ? pf.columns.map((c) => c.name).filter((n) => !["유형", "비율(%)"].includes(n)) : [];
  const tiles = [tile(t3("BIC가 고른 유형 수", "Classes chosen by BIC", "BIC 选择的类别数"), String(best["유형 수 K"]), `BIC ${fmt(best["BIC"], 0)}`, "c2"), tile(t3("엔트로피", "Entropy", "熵"), fmt(best["엔트로피"], 3), best["엔트로피"] >= 0.8 ? t3("분류 명확", "clear", "分类清晰") : t3("분류 모호", "fuzzy", "分类模糊"), best["엔트로피"] >= 0.8 ? "good" : "warn"), tile(t3("가장 작은 유형", "Smallest class", "最小类别"), `${fmt(best["가장 작은 유형(%)"], 1)}%`, "")];
  const charts = [];
  charts.push(card("ic", t3("유형 수를 몇 개로 할까 — 정보기준", "How many classes? — information criteria", "取几个类别 — 信息准则"), t3(`BIC는 ${best["유형 수 K"]}개에서 가장 작습니다.`, `BIC is lowest at ${best["유형 수 K"]} classes.`, `BIC 在 ${best["유형 수 K"]} 个类别时最小。`), t3("AIC·BIC·aBIC는 작을수록 좋습니다. 곡선이 더 이상 크게 내려가지 않는 ‘팔꿈치’ 지점이 적절한 유형 수입니다.", "Lower AIC/BIC/aBIC is better; the ‘elbow’ where the curves stop dropping marks an adequate number of classes.", "AIC/BIC/aBIC 越小越好;曲线不再明显下降的“拐点”即合适的类别数。"),
    <Lines xCats={kt.map((r) => `K=${r["유형 수 K"]}`)} series={[{ name: "AIC", color: C(0), points: kt.map((r, i) => ({ x: i, y: r["AIC"] })) }, { name: "BIC", color: C(1), width: 3.2, points: kt.map((r, i) => ({ x: i, y: r["BIC"] })) }, { name: "aBIC", color: C(2), dash: "5 4", points: kt.map((r, i) => ({ x: i, y: r["aBIC"] })) }]} height={260} yFmt={(v) => fmt(v, 0)} />, dtab(["K", "logLik", "AIC", "BIC", "aBIC", t3("엔트로피", "entropy", "熵")], kt.map((r) => [r["유형 수 K"], r["로그우도"], r["AIC"], r["BIC"], r["aBIC"], r["엔트로피"]]))));
  if (prof.length && inds.length) charts.push(card("prof", t3("유형별 프로파일 — 어떤 사람들인가", "Class profiles — who are they?", "各类别轮廓 — 是怎样的人"), t3("선마다 하나의 잠재 유형이며, 괄호의 숫자는 그 유형이 차지하는 비율입니다.", "Each line is one latent class; the number in brackets is its size.", "每条线为一个潜类别,括号内为其占比。"),
    t3("선들이 서로 멀리 떨어지고 교차하는 지표가 많을수록 유형이 뚜렷이 구분됩니다. 선이 평행하게 위아래로만 벌어지면 ‘높음/낮음’의 수준 차이일 뿐 다른 모양의 유형은 아닙니다.", "The more the lines are separated and cross, the more distinct the classes. Parallel lines that differ only in level suggest ‘high vs low’ rather than different patterns.", "各线分离、交叉越多,类别区分越明显;若只是平行地高低错开,则只是水平差异而非不同模式。"),
    <Lines xCats={inds.map(L)} series={prof.map((r, i) => ({ name: `${L(r["유형"])} (${fmt(r["비율(%)"], 0)}%)`, color: C(i), width: 2 + (r["비율(%)"] / 100) * 4, points: inds.map((c, k) => ({ x: k, y: r[c] })) }))} height={280} />, dtab([t3("유형", "Class", "类别"), "%", ...inds], prof.map((r) => [L(r["유형"]), r["비율(%)"], ...inds.map((c) => r[c])])), { wide: true }));
  if (prof.length) charts.push(card("size", t3("유형의 크기", "Class sizes", "类别规模"), null, null, <Donut items={prof.map((r, i) => ({ label: L(r["유형"]), value: r["비율(%)"], color: C(i) }))} center={`${prof.length}`} sub={t3("유형", "classes", "类别")} />, null));
  charts.push(card("ent", t3("분류의 명확성 — 엔트로피", "Classification clarity — entropy", "分类清晰度 — 熵"), t3("0.8 이상이면 사람을 유형에 비교적 분명하게 배정할 수 있습니다.", "≥ 0.8 means people can be assigned to classes fairly clearly.", "≥ 0.8 表示可较清晰地将个体归类。"), null, <Bars items={kt.filter((r) => r["유형 수 K"] > 1).map((r) => ({ label: `K=${r["유형 수 K"]}`, value: r["엔트로피"], color: r["엔트로피"] >= 0.8 ? C(0) : C(5) }))} marks={[{ value: 0.8, label: ".8" }]} fmtv={(v) => fmt(v, 3)} />, null));
  return { tiles, charts };
};

X.M32 = (R) => {
  const ic = objs(tb(R, /급내상관/))[0], fe = objs(tb(R, /고정효과/)), vc = kv(tb(R, /분산성분/)); if (!ic) return null;
  const tiles = [tile("ICC", fmt(ic["ICC"], 3), t3(`변동의 ${fmt(ic["ICC"] * 100, 0)}%가 군집 간 차이`, `${fmt(ic["ICC"] * 100, 0)}% between clusters`, `${fmt(ic["ICC"] * 100, 0)}% 来自群间差异`), ic["ICC"] >= 0.1 ? "warn" : "good"), tile(t3("설계효과", "Design effect", "设计效应"), fmt(ic["설계효과"], 2), t3(`군집 ${ic["군집 수"]}개`, `${ic["군집 수"]} clusters`, `${ic["군집 수"]} 个群`), "c2"), tile(t3("실질 표본", "Effective n", "有效样本"), fmt(ic["실질 표본"], 0), isNum(vc["관측 수"]) ? t3(`관측 ${vc["관측 수"]}명에서 줄어듦`, `of ${vc["관측 수"]} observed`, `观测 ${vc["관측 수"]}`) : "")];
  const charts = [];
  charts.push(card("icc", t3("변동의 출처 — 군집 간 vs 군집 내", "Where the variation lies — between vs within clusters", "变异来源 — 群间 vs 群内"), t3(`ICC = ${fmt(ic["ICC"], 3)}: 같은 군집의 사람들은 그만큼 서로 닮았습니다.`, `ICC = ${fmt(ic["ICC"], 3)}: people in the same cluster resemble each other that much.`, `ICC = ${fmt(ic["ICC"], 3)}:同一群内的人相似程度。`),
    t3("군집 간 몫(진한 색)이 클수록 학급·병원처럼 묶음의 영향이 큽니다. 이때 개인을 독립으로 보면 표준오차가 작게 나오므로 다층모형이 필요합니다.", "A large between-cluster share (dark part) means the grouping (class, hospital …) matters; treating people as independent would understate standard errors, hence the multilevel model.", "群间部分(深色)越大,班级/医院等分组的影响越大;此时将个体视为独立会低估标准误,因此需要多层模型。"),
    <Stack100 rows={[{ label: t3("분산", "Variance", "方差"), parts: [{ name: t3("군집 간 τ²", "between τ²", "群间 τ²"), value: ic["군집 간 τ²"] }, { name: t3("군집 내 σ²", "within σ²", "群内 σ²"), value: ic["군집 내 σ²"] }] }]} showN={false} />, dtab(["ICC", "τ²", "σ²", t3("군집 수", "clusters", "群数"), "DE"], [[ic["ICC"], ic["군집 간 τ²"], ic["군집 내 σ²"], ic["군집 수"], ic["설계효과"]]])));
  if (fe.length) charts.push(card("fe", t3("고정효과와 95% 구간", "Fixed effects with 95% CI", "固定效应及 95% 区间"), null, t3("구간이 0(점선)을 가로지르지 않으면 효과가 분명합니다.", "If the interval does not cross the dashed zero line the effect is clear.", "区间不跨虚线(0)则效应明确。"),
    <Forest rows={fe.filter((r) => !/상수|절편/.test(r["항"])).map((r) => ({ label: L(r["항"]), est: r["계수"], lo: r["95% 하한"], hi: r["95% 상한"], color: C(0), note: stars3(r["p"]) }))} ref0={0} vfmt={(v) => fmt(v, 3)} />, dtab([t3("항", "Term", "项"), t3("계수", "coef", "系数"), "SE", "df", "p", "lo", "hi"], fe.map((r) => [L(r["항"]), r["계수"], r["SE"], r["df"], r["p"], r["95% 하한"], r["95% 상한"]]))));
  if (isNum(vc["관측 수"]) && isNum(ic["실질 표본"])) charts.push(card("n", t3("군집이 있어 줄어든 표본", "Sample size lost to clustering", "分群导致减少的样本"), t3(`${vc["관측 수"]}명이 사실상 ${fmt(ic["실질 표본"], 0)}명 몫의 정보만 줍니다.`, `${vc["관측 수"]} cases carry the information of about ${fmt(ic["실질 표본"], 0)}.`, `${vc["관측 수"]} 个观测仅相当于约 ${fmt(ic["실질 표본"], 0)} 的信息量。`), null,
    <Waffle parts={[{ label: t3("실질 표본", "effective n", "有效样本"), value: ic["실질 표본"], color: C(0) }, { label: t3("군집으로 겹친 몫", "overlap lost", "因分群重叠"), value: Math.max(0, vc["관측 수"] - ic["실질 표본"]), color: "var(--dv-grid)" }]} />, null));
  return { tiles, charts };
};

X.M33 = (R) => {
  const km = objs(tb(R, /카플란-마이어/)), lr = tb(R, /로그순위/), lro = objs(lr), cox = kv(tb(R, /콕스/)); if (!km.length) return null;
  const med = (() => { const r = km.find((x) => x["생존율"] <= 0.5); return r ? r["시간"] : null; })();
  const lrP = (/p=([\d.e-]+)/i.exec(String(lr?.title)) || [])[1], chi = (/χ²=([\d.]+)/.exec(String(lr?.title)) || [])[1];
  const nE = km.reduce((s, r) => s + (r["사건"] || 0), 0), nC = km.reduce((s, r) => s + (r["중도절단"] || 0), 0);
  const tiles = [tile(t3("사건 수", "Events", "事件数"), String(nE), t3(`중도절단 ${nC}`, `${nC} censored`, `删失 ${nC}`)), tile(t3("중앙 생존시간", "Median survival", "中位生存时间"), med != null ? fmt(med, 1) : t3("도달 안 함", "not reached", "未达到"), t3("생존율 50% 지점", "where S(t) ≤ 50%", "生存率 ≤ 50% 处"), "c2"), isNum(cox["위험비 HR"]) && tile("HR", fmt(cox["위험비 HR"], 2), `95% CI ${fmt(cox["HR 95% 하한"], 2)} ~ ${fmt(cox["HR 95% 상한"], 2)} · ${fp(cox["p"])}`, pTone(cox["p"])), lrP && tile("Log-rank", `χ²=${chi}`, `p=${lrP}`)].filter(Boolean);
  const charts = [];
  charts.push(card("km", t3("생존곡선 — 시간이 지나도 살아 있는 비율", "Survival curve — proportion still event-free over time", "生存曲线 — 随时间仍未发生事件的比例"), t3(med != null ? `절반이 사건을 겪는 데 걸린 시간은 약 ${fmt(med, 1)}입니다.` : "관찰 기간 안에 생존율이 50% 아래로 내려가지 않았습니다.", med != null ? `Half experienced the event by about ${fmt(med, 1)}.` : "Survival did not fall below 50% during follow-up.", med != null ? `约在 ${fmt(med, 1)} 时一半个体发生事件。` : "随访期内生存率未降至 50% 以下。"),
    t3("계단 하나하나가 사건이 일어난 시점입니다. 색 띠는 95% 신뢰구간이고, 오른쪽으로 갈수록 남은 사람이 적어 띠가 넓어집니다. 점선(50%)과 만나는 가로 위치가 중앙 생존시간입니다.", "Each step is an event. The band is the 95% CI and widens to the right as fewer people remain. Where the curve meets the 50% dashed line is the median survival time.", "每一级台阶为一次事件;色带为 95% 置信区间,越往右人数越少色带越宽;曲线与 50% 虚线相交处为中位生存时间。"),
    <Lines series={[{ name: "S(t)", color: C(0), step: true, area: true, markers: false, width: 2.8, points: km.map((r) => ({ x: r["시간"], y: r["생존율"], lo: r["95% 하한"], hi: r["95% 상한"] })) }]} yDomain={[0, 1.02]} refY={0.5} xLabel={t3("시간", "Time", "时间")} yLabel={t3("생존율", "Survival", "生存率")} height={290} endLabels={false} yFmt={(v) => `${Math.round(v * 100)}%`} vlines={med != null ? [{ x: med, label: `${t3("중앙", "median", "中位")} ${fmt(med, 1)}`, color: C(1) }] : []} tip />, dtab([t3("시간", "t", "时间"), "S(t)", "lo", "hi", t3("위험집단", "at risk", "风险集"), t3("사건", "events", "事件")], km.filter((_, i) => i % Math.ceil(km.length / 25) === 0).map((r) => [r["시간"], r["생존율"], r["95% 하한"], r["95% 상한"], r["위험집단"], r["사건"]])), { wide: true }));
  charts.push(card("risk", t3("남아 있는 사람 수(위험집단)", "Number still at risk", "仍在风险中的人数"), t3("사건과 중도절단으로 시간이 갈수록 줄어듭니다 — 오른쪽 끝의 곡선은 소수의 사람에 기댄 값이라 불안정합니다.", "It shrinks with events and censoring – the right-hand end of the curve rests on few people and is unstable.", "随事件与删失而减少 — 曲线右端依赖少数人,较不稳定。"), null,
    <Lines series={[{ name: t3("위험집단", "at risk", "风险集"), color: C(2), step: true, area: true, markers: false, points: km.map((r) => ({ x: r["시간"], y: r["위험집단"] })) }]} height={200} xLabel={t3("시간", "Time", "时间")} endLabels={false} yFmt={(v) => fmt(v, 0)} />, null));
  if (lro.length) charts.push(card("lr", t3("집단별 관측 사건 vs 기대 사건", "Observed vs expected events by group", "各组观测事件 vs 期望事件"), t3("관측이 기대보다 크면 그 집단의 사건이 더 자주(빠르게) 일어납니다.", "Observed > expected means the group has events more often/sooner.", "观测 > 期望说明该组事件发生更频繁/更早。"), null,
    <Bars items={lro.flatMap((r, i) => [{ label: `${L(r["집단"])} · ${t3("관측", "obs", "观测")}`, value: r["관측 사건(O)"], color: C(i === 0 ? 1 : 0) }, { label: `${L(r["집단"])} · ${t3("기대", "exp", "期望")}`, value: r["기대 사건(E)"], color: "var(--dv-mute)" }])} fmtv={(v) => fmt(v, 1)} />, dtab([t3("집단", "Group", "组"), "O", "E", "O/E"], lro.map((r) => [L(r["집단"]), r["관측 사건(O)"], r["기대 사건(E)"], r["O/E"]]))));
  if (isNum(cox["위험비 HR"])) charts.push(card("hr", t3("위험비(HR) — 사건 위험이 몇 배인가", "Hazard ratio — how many times the event risk", "风险比(HR) — 事件风险的倍数"), t3("1보다 작으면 위험이 낮아집니다(보호 효과).", "Below 1 the risk is lower (protective).", "小于 1 表示风险降低(保护作用)。"), null,
    <Forest rows={[{ label: "HR", est: cox["위험비 HR"], lo: cox["HR 95% 하한"], hi: cox["HR 95% 상한"], color: C(0), note: fp(cox["p"]) }]} ref0={1} log rowH={56} vfmt={(v) => fmt(v, 2)} />, null));
  return { tiles, charts };
};

X.M34 = (R) => {
  const fc = objs(tb(R, /예측값/)), dg = kv(tb(R, /시계열 진단/)); if (!fc.length) return null;
  const tiles = [tile(t3("예측 시점", "Horizon", "预测期"), `+1 ~ +${fc.length}`, t3(`첫 예측 ${fmt(fc[0]["예측"], 1)}`, `first ${fmt(fc[0]["예측"], 1)}`, `首个预测 ${fmt(fc[0]["예측"], 1)}`)), isNum(dg["AR 차수 p"]) && tile("ARIMA", `(${dg["AR 차수 p"]}, ${dg["ARIMA 차분 d"]}, ${dg["MA 차수 q"]})`, `AIC ${fmt(dg["AIC"], 1)}`, "c2"), tile(t3("마지막 시점 95% 구간 폭", "95% band width at the end", "末期 95% 区间宽度"), fmt(fc[fc.length - 1]["95% 상한"] - fc[fc.length - 1]["95% 하한"], 1), t3("첫 시점의 " + fmt((fc[fc.length - 1]["95% 상한"] - fc[fc.length - 1]["95% 하한"]) / (fc[0]["95% 상한"] - fc[0]["95% 하한"]), 1) + "배", "x" + fmt((fc[fc.length - 1]["95% 상한"] - fc[fc.length - 1]["95% 하한"]) / (fc[0]["95% 상한"] - fc[0]["95% 하한"]), 1) + " of the first", "为首期的 " + fmt((fc[fc.length - 1]["95% 상한"] - fc[fc.length - 1]["95% 하한"]) / (fc[0]["95% 상한"] - fc[0]["95% 하한"]), 1) + " 倍"))].filter(Boolean);
  const charts = [];
  charts.push(card("fc", t3("예측과 95% 불확실성 띠", "Forecast with 95% uncertainty band", "预测及 95% 不确定性色带"), t3("먼 미래일수록 띠가 넓어집니다 — 예측이 그만큼 불확실합니다.", "The band widens into the future – forecasts get more uncertain.", "预测越远色带越宽 — 不确定性越大。"),
    t3("선은 점 예측, 색 띠는 95% 예측구간입니다. 띠가 빠르게 벌어지면 먼 시점 예측을 믿기 어렵다는 뜻입니다.", "The line is the point forecast; the band is the 95% prediction interval. A band that fans out quickly means distant forecasts are hard to trust.", "线为点预测,色带为 95% 预测区间;色带迅速扩大说明远期预测不可靠。"),
    <Lines xCats={fc.map((r) => L(r["예측 시점"]))} series={[{ name: t3("예측", "forecast", "预测"), color: C(0), width: 3, points: fc.map((r, i) => ({ x: i, y: r["예측"], lo: r["95% 하한"], hi: r["95% 상한"] })) }]} height={280} endLabels={false} yFmt={(v) => fmt(v, 0)} />, dtab([t3("시점", "Step", "期"), t3("예측", "forecast", "预测"), "lo", "hi"], fc.map((r) => [L(r["예측 시점"]), r["예측"], r["95% 하한"], r["95% 상한"]])), { wide: true }));
  charts.push(card("w", t3("불확실성의 성장 — 구간 폭", "Growth of uncertainty — interval width", "不确定性增长 — 区间宽度"), null, null, <Bars items={fc.map((r) => ({ label: L(r["예측 시점"]), value: r["95% 상한"] - r["95% 하한"] }))} fmtv={(v) => fmt(v, 1)} />, null));
  const pills = [isNum(dg["ADF p"]) && { title: t3("정상성(ADF)", "Stationarity (ADF)", "平稳性(ADF)"), signal: dg["ADF p"] < 0.05 ? "green" : "yellow", p: dg["ADF p"], rationale: t3("p<.05 면 정상 시계열로 봅니다.", "p<.05 → stationary.", "p<.05 视为平稳。") }, isNum(dg["Ljung-Box p"]) && { title: t3("잔차 무상관(Ljung-Box)", "Residual whiteness (Ljung–Box)", "残差白噪声(Ljung–Box)"), signal: dg["Ljung-Box p"] > 0.05 ? "green" : "red", p: dg["Ljung-Box p"], rationale: t3("p>.05 면 잔차에 남은 구조가 없습니다.", "p>.05 → no structure left in residuals.", "p>.05 表示残差无剩余结构。") }].filter(Boolean);
  if (pills.length) charts.push(card("dg", t3("모형 진단", "Model diagnostics", "模型诊断"), t3("두 점검이 모두 초록이면 예측 모형이 자료의 구조를 잘 잡았습니다.", "Both green means the model captured the structure of the series.", "两项均为绿色说明模型较好地捕捉了序列结构。"), null, <Pills items={pills} />, null));
  const a = asmCard(R); if (a) charts.push(a);
  return { tiles, charts };
};

X.M35 = (R) => {
  const t = objs(tb(R, /직선 대비/)); if (t.length < 2) return null;
  const a = t[0], b = t[1], d = b["R²"] - a["R²"];
  const tiles = [tile(t3("직선 R²", "Linear R²", "线性 R²"), fmt(a["R²"], 3), ""), tile("GAM R²", fmt(b["R²"], 3), "", "c2"), tile("ΔR²", sgn(d, 3), d > 0.05 ? t3("비선형이 뚜렷이 더 잘 맞음", "clearly better fit", "明显更优") : t3("차이 작음", "small gain", "提升较小"), d > 0.05 ? "good" : undefined)];
  const charts = [];
  charts.push(card("cmp", t3("직선보다 곡선이 얼마나 더 잘 맞나", "How much better does the curve fit than a straight line?", "曲线比直线拟合好多少"), t3(`설명력이 ${fmt(a["R²"] * 100, 1)}% → ${fmt(b["R²"] * 100, 1)}%로 늘었습니다.`, `Explained variance rises from ${fmt(a["R²"] * 100, 1)}% to ${fmt(b["R²"] * 100, 1)}%.`, `解释力由 ${fmt(a["R²"] * 100, 1)}% 提高到 ${fmt(b["R²"] * 100, 1)}%。`),
    t3("두 모형의 R²를 나란히 놓았습니다. 격차가 크면 관계가 직선이 아니라는 뜻이며, 엔진이 그린 평활 곡선 그림에서 모양을 확인하세요.", "R² of the two models side by side. A large gap means the relation is not a straight line – see the engine's smooth-curve plot for its shape.", "并列显示两个模型的 R²;差距大说明关系不是直线,曲线形状请看引擎绘制的平滑曲线图。"),
    <Bullets items={[{ label: t3("직선", "Linear", "线性"), value: a["R²"], min: 0, max: 1 }, { label: "GAM", value: b["R²"], min: 0, max: 1 }, { label: t3("직선 (수정)", "Linear (adj.)", "线性(调整)"), value: a["adj R²"], min: 0, max: 1 }, { label: t3("GAM (수정)", "GAM (adj.)", "GAM(调整)"), value: b["adj R²"], min: 0, max: 1 }]} />, dtab([t3("모형", "Model", "模型"), "R²", "adj R²"], t.map((r) => [L(r["모형"]), r["R²"], r["adj R²"]]))));
  return { tiles, charts };
};

X.M36 = (R) => {
  const q = objs(tb(R, /^분위회귀/)); if (!q.length) return null;
  const lo = q[0], hi = q[q.length - 1];
  const tiles = [tile(t3("가장 낮은 분위 기울기", "Lowest-quantile slope", "最低分位斜率"), fmt(lo["기울기"], 2), `τ = ${lo["τ"]}`), tile(t3("가장 높은 분위 기울기", "Highest-quantile slope", "最高分位斜率"), fmt(hi["기울기"], 2), `τ = ${hi["τ"]}`, "c2"), tile(t3("분위 간 차이", "Spread across quantiles", "分位间差异"), sgn(hi["기울기"] - lo["기울기"], 2), hi["기울기"] > lo["기울기"] ? t3("상위 분위일수록 효과 큼", "stronger at the top", "高分位效应更大") : t3("상위 분위일수록 효과 작음", "weaker at the top", "高分位效应更小"))];
  const charts = [];
  charts.push(card("qr", t3("분포의 어느 지점에서 효과가 큰가 — 분위별 기울기", "Where in the distribution is the effect larger? — slope by quantile", "分布哪个位置效应更大 — 分位斜率"), t3(`기울기가 ${fmt(lo["기울기"], 1)}(τ=${lo["τ"]}) → ${fmt(hi["기울기"], 1)}(τ=${hi["τ"]})로 변합니다.`, `The slope moves from ${fmt(lo["기울기"], 1)} (τ=${lo["τ"]}) to ${fmt(hi["기울기"], 1)} (τ=${hi["τ"]}).`, `斜率由 ${fmt(lo["기울기"], 1)}(τ=${lo["τ"]})变为 ${fmt(hi["기울기"], 1)}(τ=${hi["τ"]})。`),
    t3("평균만 보는 회귀와 달리, 결과의 낮은 쪽·중간·높은 쪽에서 예측변수의 효과가 어떻게 다른지 보여 줍니다. 띠는 95% 신뢰구간이며 선이 기울면 분위에 따라 효과가 다릅니다.", "Unlike mean regression this shows how the predictor's effect differs at the low, middle and high parts of the outcome. The band is the 95% CI; a tilted line means the effect varies by quantile.", "与均值回归不同,此图显示预测变量在结果低、中、高位置的效应差异;色带为 95% 区间,线倾斜说明效应随分位变化。"),
    <Lines xCats={q.map((r) => `τ=${r["τ"]}`)} series={[{ name: t3("기울기", "slope", "斜率"), color: C(0), width: 3, points: q.map((r, i) => ({ x: i, y: r["기울기"], lo: r["CI 하"], hi: r["CI 상"] })) }]} height={270} endLabels={false} />, dtab(["τ", t3("기울기", "slope", "斜率"), "SE", "p", "lo", "hi"], q.map((r) => [r["τ"], r["기울기"], r["SE"], r["p"], r["CI 하"], r["CI 상"]])), { wide: true }));
  charts.push(card("fr", t3("분위별 기울기와 95% 구간", "Slopes by quantile with 95% CI", "各分位斜率及 95% 区间"), null, null, <Forest rows={q.map((r, i) => ({ label: `τ = ${r["τ"]}`, est: r["기울기"], lo: r["CI 하"], hi: r["CI 상"], color: C(i), note: stars3(r["p"]) }))} vfmt={(v) => fmt(v, 1)} ref0={0} />, null));
  return { tiles, charts };
};

X.M37 = (R) => {
  const ms = objs(tb(R, /변수별 결측/)), pt = objs(tb(R, /결측 무늬/)), im = objs(tb(R, /다중대체 통합/)); if (!ms.length && !im.length) return null;
  const worst = [...ms].sort((a, b) => b["결측률(%)"] - a["결측률(%)"])[0];
  const tiles = [worst && tile(t3("가장 많이 빠진 변수", "Most missing", "缺失最多的变量"), L(worst["변수"]), `${fmt(worst["결측률(%)"], 1)}% (${worst["빠진 수"]})`, worst["결측률(%)"] > 10 ? "warn" : undefined), pt.length && tile(t3("완전한 사례", "Complete cases", "完整样本"), `${fmt(pt.find((r) => /^1+$/.test(String(r["무늬"])))?.["비율(%)"] ?? NaN, 1)}%`, ""), im.length && tile(t3("대체 개수", "Imputations", "插补次数"), (/m=(\d+)/.exec(String(tb(R, /다중대체 통합/)?.title)) || [])[1] || "—", "c2")].filter(Boolean);
  const charts = [];
  if (ms.length) charts.push(card("miss", t3("변수별 결측률", "Missing rate by variable", "各变量缺失率"), t3(worst && worst["결측률(%)"] > 0 ? `${L(worst["변수"])}에서 ${fmt(worst["결측률(%)"], 1)}%가 비어 있습니다.` : "빠진 값이 없습니다.", worst && worst["결측률(%)"] > 0 ? `${fmt(worst["결측률(%)"], 1)}% of ${L(worst["변수"])} is missing.` : "No missing values.", worst && worst["결측률(%)"] > 0 ? `${L(worst["변수"])} 缺失 ${fmt(worst["결측률(%)"], 1)}%。` : "无缺失值。"), t3("5%가 넘으면 결측 처리 방법이 결과에 영향을 줄 수 있으므로 다중대체·FIML을 권합니다.", "Above ~5% the handling method can affect results – multiple imputation or FIML is recommended.", "超过约 5% 时处理方法会影响结果,建议使用多重插补或 FIML。"),
    <Bars items={ms.map((r) => ({ label: L(r["변수"]), value: r["결측률(%)"], color: r["결측률(%)"] > 5 ? C(1) : C(0), note: `${r["빠진 수"]}` }))} fmtv={(v) => fmt(v, 1)} unit="%" marks={[{ value: 5, label: "5%" }]} />, dtab([t3("변수", "Variable", "变量"), t3("빠진 수", "missing", "缺失数"), "%"], ms.map((r) => [L(r["변수"]), r["빠진 수"], r["결측률(%)"]]))));
  if (pt.length) charts.push(card("pat", t3("결측 무늬 — 어떤 조합으로 빠졌나", "Missing-data patterns", "缺失模式"), t3("1은 값이 있음, 0은 빠짐입니다.", "1 = observed, 0 = missing.", "1 = 有值,0 = 缺失。"), null, <Bars items={pt.map((r) => ({ label: `${t3("무늬", "pattern", "模式")} ${r["무늬"]}`, value: r["비율(%)"], note: `n=${r["줄 수"]}`, color: /^1+$/.test(String(r["무늬"])) ? C(0) : C(1) }))} fmtv={(v) => fmt(v, 1)} unit="%" />, null));
  if (im.length) {
    charts.push(card("pool", t3("다중대체로 합친 추정값 (±1.96 SE)", "Pooled estimates after multiple imputation (±1.96 SE)", "多重插补合并的估计(±1.96 SE)"), t3("대체 사이의 변동까지 반영한 ‘전체 SE’를 썼습니다.", "Uses the total SE that includes between-imputation variation.", "使用包含插补间变异的总标准误。"), null,
      <Forest rows={im.map((r, i) => ({ label: L(r["항"]), est: r["추정"], lo: r["추정"] - 1.96 * r["SE(전체)"], hi: r["추정"] + 1.96 * r["SE(전체)"], color: i === 0 ? "var(--dv-mute)" : C(0) }))} ref0={0} vfmt={(v) => fmt(v, 3)} />, dtab([t3("항", "Term", "项"), t3("추정", "est", "估计"), "SE", "FMI %"], im.map((r) => [L(r["항"]), r["추정"], r["SE(전체)"], r["결측정보비율(%)"]]))));
    charts.push(card("fmi", t3("결측정보비율 — 결측이 추정을 얼마나 흔드나", "Fraction of missing information", "缺失信息比例"), null, t3("값이 클수록 결측 때문에 그 추정에서 잃어버린 정보가 많습니다.", "Larger values mean more information about that estimate was lost to missingness.", "数值越大,该估计因缺失而损失的信息越多。"), <Bars items={im.map((r) => ({ label: L(r["항"]), value: r["결측정보비율(%)"], color: C(2) }))} fmtv={(v) => fmt(v, 1)} unit="%" />, null));
    charts.push(card("var", t3("불확실성의 구성 — 대체 안 vs 대체 간", "Uncertainty — within vs between imputations", "不确定性构成 — 插补内 vs 插补间"), null, null, <Stack100 rows={im.map((r) => ({ label: L(r["항"]), parts: [{ name: t3("대체 안", "within", "插补内"), value: r["SE(대체내)"] ** 2 }, { name: t3("대체 간", "between", "插补间"), value: r["SE(대체간)"] ** 2 }] }))} showN={false} />, null));
  }
  return { tiles, charts };
};

X.M38 = (R) => {
  const ate = objs(tb(R, /처치효과/)), bal = objs(tb(R, /공변량 균형/)), dg = kv(tb(R, /성향점수 진단/)); if (!ate.length) return null;
  const a = ate[0];
  const tiles = [tile(t3("처치효과(ATE)", "Treatment effect", "处理效应"), sgn(a["효과"], 2), `95% CI ${fmt(a["CI 하"], 2)} ~ ${fmt(a["CI 상"], 2)}`, a["CI 하"] * a["CI 상"] > 0 ? "good" : undefined), dg["공통지지 밖이라 뺀 사례"] != null && tile(t3("공통지지 밖 제외", "Off-support dropped", "共同支持域外剔除"), String(dg["공통지지 밖이라 뺀 사례"]), t3(`성향점수 ${dg["성향점수 범위"]}`, `PS ${dg["성향점수 범위"]}`, `倾向得分 ${dg["성향점수 범위"]}`))].filter(Boolean);
  const charts = [];
  charts.push(card("ate", t3("처치효과와 95% 신뢰구간", "Treatment effect with 95% CI", "处理效应及 95% 置信区间"), t3("구간이 0을 포함하지 않으면 처치가 결과를 바꾼다는 근거가 됩니다.", "An interval excluding 0 is evidence that the treatment changes the outcome.", "区间不含 0 是处理改变结果的证据。"), null, <Forest rows={ate.map((r, i) => ({ label: `${L(r["방법"])} (${L(r["추정량"])})`, est: r["효과"], lo: r["CI 하"], hi: r["CI 상"], color: C(i) }))} ref0={0} rowH={50} vfmt={(v) => fmt(v, 2)} />, dtab([t3("방법", "Method", "方法"), t3("효과", "effect", "效应"), "SE", "lo", "hi"], ate.map((r) => [L(r["방법"]), r["효과"], r["SE"], r["CI 하"], r["CI 상"]]))));
  if (bal.length) charts.push(card("love", t3("균형 점검(Love plot) — 맞춘 뒤 두 집단이 비슷해졌나", "Balance check (Love plot) — are the groups comparable after matching?", "平衡检查(Love 图)— 匹配后两组是否相近"), t3("점이 ±0.1 점선 안으로 들어오면 두 집단이 그 공변량에서 균형을 이룬 것입니다.", "Points inside the ±0.1 dashed lines mean the groups are balanced on that covariate.", "点落在 ±0.1 虚线内表示两组在该协变量上已平衡。"),
    t3("주황은 맞추기 전, 청록은 맞춘 뒤의 표준화 평균차입니다. 청록 점이 0 근처로 옮겨 갈수록 선택편의가 줄어든 것입니다.", "Orange = standardised mean difference before adjustment, teal = after. Teal points near 0 mean selection bias was reduced.", "橙色为调整前标准化均值差,青绿为调整后;青绿点越接近 0,选择偏倚减少越多。"),
    <Forest rows={bal.flatMap((r) => [{ label: `${L(r["공변량"])} · ${t3("전", "before", "前")}`, est: r["맞추기 전"], color: C(1) }, { label: `${L(r["공변량"])} · ${t3("후", "after", "后")}`, est: r["맞춘 뒤"], color: C(0), bold: true }])} ref0={0} marks={[{ x: -0.1, label: "−0.1" }, { x: 0.1, label: "+0.1" }]} vfmt={(v) => fmt(v, 3)} />, dtab([t3("공변량", "Covariate", "协变量"), t3("전", "before", "前"), t3("후", "after", "后")], bal.map((r) => [L(r["공변량"]), r["맞추기 전"], r["맞춘 뒤"]])), { wide: true }));
  const used = num(dg["효과 계산에 쓴 사례"]), drop = num(dg["공통지지 밖이라 뺀 사례"]);
  if (isNum(used)) charts.push(card("n", t3("분석에 쓴 사례", "Cases used", "分析使用的样本"), t3(`처치받은 사례 ${dg["처치받은 사례"]}명`, `${dg["처치받은 사례"]} treated`, `处理组 ${dg["처치받은 사례"]}`), null, <Waffle parts={[{ label: t3("효과 계산에 쓴 사례", "used", "用于计算"), value: used, color: C(0) }, { label: t3("공통지지 밖이라 뺀 사례", "off support", "共同支持域外"), value: isNum(drop) ? drop : 0, color: C(1) }]} />, null));
  return { tiles, charts };
};

X.M39 = (R) => {
  const kk = kv(tb(R, /이중차분/)), cells = objs(tb(R, /네 칸/)), pre = objs(tb(R, /처치 전 흐름/)); if (!Object.keys(kk).length) return null;
  const ef = kk["처치효과 (T×Post)"], lo = kk["95% 하한"], hi = kk["95% 상한"];
  const tiles = [tile(t3("이중차분 효과", "Difference-in-differences", "双重差分效应"), sgn(ef, 2), `95% CI ${fmt(lo, 2)} ~ ${fmt(hi, 2)} · ${fp(kk["p"])}`, pTone(kk["p"])), cells.length === 2 && tile(t3("처치집단 변화", "Treated change", "处理组变化"), sgn(cells[0]["변화"], 2), t3(`통제집단 ${sgn(cells[1]["변화"], 2)}`, `control ${sgn(cells[1]["변화"], 2)}`, `对照组 ${sgn(cells[1]["변화"], 2)}`))].filter(Boolean);
  const charts = [];
  if (cells.length === 2) {
    const tr = cells[0], ct = cells[1], cf = tr["처치 전 평균"] + ct["변화"];
    charts.push(card("did", t3("두 집단의 전·후 변화와 반사실 선", "Before/after change with the counterfactual line", "前后变化与反事实线"), t3(`처치집단은 ${sgn(tr["변화"], 1)}, 통제집단은 ${sgn(ct["변화"], 1)} 변했고, 그 차이 ${sgn(ef, 1)}가 처치효과입니다.`, `Treated changed ${sgn(tr["변화"], 1)}, control ${sgn(ct["변화"], 1)}; the difference ${sgn(ef, 1)} is the effect.`, `处理组变化 ${sgn(tr["변화"], 1)},对照组 ${sgn(ct["변화"], 1)};差值 ${sgn(ef, 1)} 即处理效应。`),
      t3("점선은 ‘처치를 받지 않았다면’ 처치집단이 통제집단과 똑같이 변했을 것이라는 반사실 선입니다. 실제 처치집단 선과 점선 사이의 간격이 처치효과입니다.", "The dashed line is the counterfactual: how the treated group would have changed had it moved like the control group. The gap between it and the actual treated line is the treatment effect.", "虚线为反事实线:若处理组与对照组变化相同的情形。实际处理组线与虚线之间的间隔即处理效应。"),
      <Lines xCats={[t3("처치 전", "Before", "处理前"), t3("처치 후", "After", "处理后")]} series={[{ name: L(tr["집단"]), color: C(0), width: 3.2, points: [{ x: 0, y: tr["처치 전 평균"] }, { x: 1, y: tr["처치 후 평균"] }] }, { name: L(ct["집단"]), color: C(5), width: 3.2, points: [{ x: 0, y: ct["처치 전 평균"] }, { x: 1, y: ct["처치 후 평균"] }] }, { name: t3("반사실", "counterfactual", "反事实"), color: C(1), dash: "6 4", width: 2.2, points: [{ x: 0, y: tr["처치 전 평균"] }, { x: 1, y: cf }] }]} height={290} />, dtab([t3("집단", "Group", "组"), t3("전", "pre", "前"), t3("후", "post", "后"), t3("변화", "change", "变化")], cells.map((r) => [L(r["집단"]), r["처치 전 평균"], r["처치 후 평균"], r["변화"]])), { wide: true }));
  }
  charts.push(card("ef", t3("처치효과와 95% 신뢰구간", "Treatment effect with 95% CI", "处理效应及 95% 置信区间"), null, null, <Forest rows={[{ label: t3("이중차분 (T×Post)", "DiD (T×Post)", "双重差分(T×Post)"), est: ef, lo, hi, color: C(0), note: fp(kk["p"]) }]} ref0={0} rowH={56} />, null));
  if (pre.length >= 2) charts.push(card("pre", t3("처치 전에 두 집단이 나란히 움직였나 — 평행추세", "Were groups moving in parallel before the treatment? — parallel trends", "处理前两组是否平行 — 平行趋势"), t3("선이 나란하면 이중차분의 핵심 가정이 지켜진 것입니다.", "Parallel lines support the key assumption of difference-in-differences.", "两线平行支持双重差分的核心假设。"), null,
    <Lines series={[{ name: t3("처치집단", "treated", "处理组"), color: C(0), points: pre.map((r) => ({ x: r["시점"], y: r["처치집단 평균"] })) }, { name: t3("통제집단", "control", "对照组"), color: C(5), points: pre.map((r) => ({ x: r["시점"], y: r["통제집단 평균"] })) }]} xLabel={t3("처치 전 시점", "Pre-treatment wave", "处理前时点")} height={250} xFmt={(v) => fmt(v, 0)} />, dtab([t3("시점", "wave", "时点"), t3("처치", "treated", "处理"), t3("통제", "control", "对照")], pre.map((r) => [r["시점"], r["처치집단 평균"], r["통제집단 평균"]]))));
  if (cells.length === 2) charts.push(card("chg", t3("집단별 변화량", "Change by group", "各组变化量"), null, null, <Bars items={cells.map((r, i) => ({ label: L(r["집단"]), value: r["변화"], color: i === 0 ? C(0) : C(5) }))} fmtv={(v) => sgn(v, 2)} />, null));
  const a = asmCard(R); if (a) charts.push(a);
  return { tiles, charts };
};

X.M40 = (R) => {
  const pool = objs(tb(R, /합성효과/)), st = objs(tb(R, /연구별/)), het = kv(tb(R, /이질성/)); if (!st.length) return null;
  const rnd = pool.find((r) => /임의/.test(r["모형"])) || pool[0], fix = pool.find((r) => /고정/.test(r["모형"]));
  const I2 = nums(het["I2"])[0], Q = nums(het["Q"]), pi = nums(het["예측구간(95%)"]), egg = het["Egger 절편"];
  const tiles = [rnd && tile(t3("합성효과(임의)", "Pooled effect (random)", "合并效应(随机)"), fmt(rnd["추정"], 3), `95% CI ${fmt(rnd["CI 하"], 2)} ~ ${fmt(rnd["CI 상"], 2)}`, rnd["CI 하"] > 0 || rnd["CI 상"] < 0 ? "good" : undefined), isNum(I2) && tile("I²", `${fmt(I2, 0)}%`, I2 >= 75 ? t3("높은 이질성", "high heterogeneity", "高异质性") : I2 >= 50 ? t3("중간", "moderate", "中等") : t3("낮음", "low", "低"), I2 >= 75 ? "bad" : I2 >= 50 ? "warn" : "good"), tile(t3("연구 수", "Studies", "研究数"), String(st.length), isNum(Q[0]) ? `Q=${fmt(Q[0], 1)}` : ""), egg && tile("Egger", fmt(nums(egg)[0], 2), t3("출판편향 점검", "publication bias", "发表偏倚"), "c2")].filter(Boolean);
  const maxW = Math.max(...st.map((r) => r["임의 가중%"] || 0), 1e-9);
  const rows = st.map((r) => ({ label: L(r["연구"]), est: r["효과크기"], lo: r["CI 하"], hi: r["CI 상"], w: (r["임의 가중%"] || 0) / maxW, color: C(0) }));
  const pooled = [fix && { label: t3("고정효과 합성", "Fixed-effect pooled", "固定效应合并"), est: fix["추정"], lo: fix["CI 하"], hi: fix["CI 상"], pooled: true, color: C(5) }, rnd && { label: t3("임의효과 합성", "Random-effects pooled", "随机效应合并"), est: rnd["추정"], lo: rnd["CI 하"], hi: rnd["CI 상"], pooled: true, color: C(1), bold: true }, pi.length >= 2 && { label: t3("예측구간(95%)", "Prediction interval", "预测区间"), est: rnd["추정"], lo: pi[0], hi: pi[1], color: C(2) }].filter(Boolean);
  const charts = [];
  charts.push(card("forest", t3("숲 그림 — 연구마다의 효과와 합성값", "Forest plot — each study and the pooled effect", "森林图 — 各研究效应与合并值"), t3(rnd ? `합성효과 ${fmt(rnd["추정"], 3)} [${fmt(rnd["CI 하"], 2)}, ${fmt(rnd["CI 상"], 2)}]` : "", rnd ? `Pooled ${fmt(rnd["추정"], 3)} [${fmt(rnd["CI 하"], 2)}, ${fmt(rnd["CI 상"], 2)}]` : "", rnd ? `合并 ${fmt(rnd["추정"], 3)} [${fmt(rnd["CI 하"], 2)}, ${fmt(rnd["CI 상"], 2)}]` : ""),
    t3("사각형 하나가 연구 하나이며 크기는 합성에 주는 가중치입니다. 가로선은 95% 신뢰구간, 아래 마름모는 합성효과입니다. 연구들이 점선(0)의 한쪽에 몰려 있고 마름모가 0에서 떨어져 있으면 일관된 효과입니다.", "Each square is a study, sized by its weight; lines are 95% CIs and the diamonds are pooled effects. Studies lying on one side of zero with the diamond clear of it indicate a consistent effect.", "每个方块为一项研究,大小为权重;横线为 95% 区间,菱形为合并效应。研究集中于 0 的一侧且菱形远离 0 表明效应一致。"),
    <Forest rows={[...rows, ...pooled]} ref0={0} rowH={26} xLabel={t3("효과크기", "Effect size", "效应量")} vfmt={(v) => fmt(v, 2)} />, dtab([t3("연구", "Study", "研究"), t3("효과", "effect", "效应"), "SE", "lo", "hi", t3("가중%", "w%", "权重%")], st.map((r) => [L(r["연구"]), r["효과크기"], r["SE"], r["CI 하"], r["CI 상"], r["임의 가중%"]])), { wide: true }));
  if (rnd) charts.push(card("funnel", t3("깔때기 그림 — 출판편향이 있는가", "Funnel plot — publication bias?", "漏斗图 — 是否存在发表偏倚"), t3(egg ? `Egger 검정: ${L(egg)}` : "", egg ? `Egger test: ${L(egg)}` : "", egg ? `Egger 检验:${L(egg)}` : ""),
    t3("정밀한 연구(표준오차가 작은 위쪽)는 합성효과 주위에 좁게 모이고, 작은 연구는 아래에서 넓게 퍼지는 대칭 깔때기가 이상적입니다. 한쪽이 비어 있으면 출판편향을 의심합니다.", "Precise studies (low SE, top) cluster tightly around the pooled effect and small studies fan out below – a symmetric funnel is ideal. A missing corner suggests publication bias.", "精确的研究(SE 小,位于上方)紧密聚集于合并效应周围,小研究在下方散开,对称漏斗最理想;一侧缺失提示发表偏倚。"),
    <Funnel points={st.map((r) => ({ x: r["효과크기"], y: r["SE"], label: L(r["연구"]) }))} center={rnd["추정"]} />, null));
  if (isNum(I2)) charts.push(card("i2", t3("이질성 I² — 연구 사이 차이가 우연 이상인가", "Heterogeneity I²", "异质性 I²"), t3(Q.length ? `Q = ${fmt(Q[0], 2)}${Q[1] != null ? ` (df=${Q[1]}, p=${Q[2]})` : ""}` : "", Q.length ? `Q = ${fmt(Q[0], 2)}` : "", Q.length ? `Q = ${fmt(Q[0], 2)}` : ""), t3("25·50·75%를 낮음·중간·높음의 눈금으로 씁니다. 높으면 연구마다 효과가 다르다는 뜻이므로 조절변수를 찾아보세요.", "25 · 50 · 75% mark low · moderate · high. High values mean effects differ across studies – look for moderators.", "25·50·75% 为低·中·高。高值说明各研究效应不同,宜寻找调节变量。"),
    <Bullets items={[{ label: "I²", value: I2, min: 0, max: 100, bands: [{ to: 25, color: "ok", label: t3("낮음", "low", "低") }, { to: 50, color: "var(--dv-c5)", label: t3("중간", "mod.", "中") }, { to: 75, color: "warn", label: t3("높음", "high", "高") }, { to: 100, color: "bad", label: t3("매우 높음", "v. high", "很高") }], fmt: (v) => `${fmt(v, 1)}%` }]} />, null));
  const w = [...st].sort((a, b) => (b["임의 가중%"] || 0) - (a["임의 가중%"] || 0)).slice(0, 12);
  charts.push(card("w", t3("합성에 많이 기여한 연구 (임의효과 가중%)", "Studies contributing most (random-effects weight %)", "贡献最大的研究(随机效应权重%)"), null, null, <Bars items={w.map((r) => ({ label: L(r["연구"]), value: r["임의 가중%"] }))} fmtv={(v) => fmt(v, 1)} unit="%" />, null));
  return { tiles, charts };
};

X.M41 = (R) => {
  const ef = objs(tb(R, /대비 효과/)), dc = objs(tb(R, /직접 비교/)); if (!ef.length) return null;
  const ref = ef.find((r) => r["비고"] === "기준")?.["처치"] || "A", rows = ef.filter((r) => r["비고"] !== "기준");
  const best = [...rows].sort((a, b) => b["효과"] - a["효과"])[0];
  const tiles = [best && tile(t3("기준 대비 가장 큰 효과", "Largest effect vs reference", "相对参照最大效应"), `${L(best["처치"])}: ${sgn(best["효과"], 2)}`, `95% CI ${fmt(best["CI 하"], 2)} ~ ${fmt(best["CI 상"], 2)}`, best["CI 하"] > 0 ? "good" : undefined), tile(t3("처치 수", "Treatments", "处理数"), String(ef.length), t3(`기준 ${L(ref)}`, `reference ${L(ref)}`, `参照 ${L(ref)}`)), dc.length && tile(t3("직접 비교", "Direct comparisons", "直接比较"), String(dc.length), t3(`연구 ${dc.reduce((s, r) => s + (r["연구 수"] || 0), 0)}개`, `${dc.reduce((s, r) => s + (r["연구 수"] || 0), 0)} study contrasts`, `${dc.reduce((s, r) => s + (r["연구 수"] || 0), 0)} 项`))].filter(Boolean);
  const charts = [];
  charts.push(card("fr", t3(`${L(ref)} 대비 각 처치의 효과`, `Effect of each treatment vs ${L(ref)}`, `各处理相对 ${L(ref)} 的效应`), t3("직접 비교가 없는 처치도 공통 비교자를 통해 간접 비교합니다.", "Treatments without direct comparison are compared indirectly through the common comparator.", "没有直接比较的处理通过共同对照进行间接比较。"), t3("점선(0)은 기준 처치와 같은 효과입니다. 구간이 점선의 오른쪽에 있으면 기준보다 효과가 큽니다.", "The dashed line (0) is the reference treatment; an interval to its right means a larger effect than the reference.", "虚线(0)为参照处理;区间在其右侧表示效应大于参照。"),
    <Forest rows={rows.map((r, i) => ({ label: L(r["처치"]), est: r["효과"], lo: r["CI 하"], hi: r["CI 상"], color: C(i) }))} ref0={0} vfmt={(v) => fmt(v, 3)} />, dtab([t3("처치", "Treatment", "处理"), t3("효과", "effect", "效应"), "SE", "lo", "hi"], rows.map((r) => [L(r["처치"]), r["효과"], r["SE"], r["CI 하"], r["CI 상"]]))));
  if (dc.length) {
    const nodes = [...new Set(dc.flatMap((r) => [String(r["처치 A"]), String(r["처치 B"])]))].map((n) => ({ id: n, label: L(n), size: dc.filter((r) => String(r["처치 A"]) === n || String(r["처치 B"]) === n).reduce((s, r) => s + (r["연구 수"] || 0), 0) }));
    charts.push(card("net", t3("근거 관계망 — 어떤 처치끼리 직접 비교됐나", "Evidence network — which treatments were compared directly?", "证据网络 — 哪些处理被直接比较"), t3(`${nodes.length}개 처치, ${dc.length}개 직접 비교`, `${nodes.length} treatments, ${dc.length} direct comparisons`, `${nodes.length} 个处理,${dc.length} 个直接比较`), null, <Network nodes={nodes} edges={dc.map((r) => ({ a: String(r["처치 A"]), b: String(r["처치 B"]), w: r["연구 수"], eff: r["효과"] }))} />, null));
    if (nodes.length >= 3) { const M = nodes.map((a) => nodes.map((b) => { const r = dc.find((x) => (String(x["처치 A"]) === a.id && String(x["처치 B"]) === b.id)); const r2 = dc.find((x) => String(x["처치 A"]) === b.id && String(x["처치 B"]) === a.id); return r ? r["효과"] : r2 ? -r2["효과"] : NaN; })); charts.push(card("hm", t3("직접 비교 효과표 (행 − 열)", "Direct-comparison effects (row − column)", "直接比较效应表(行 − 列)"), null, null, <Heat rows={nodes.map((n) => n.label)} cols={nodes.map((n) => n.label)} values={M} diverge text={M.map((r) => r.map((v) => (isNum(v) ? sgn(v, 2) : "")))} />, null)); }
  }
  return { tiles, charts };
};

X.M42 = (R) => {
  const k = kv(tb(R, /사후분포/)); const m = k["μ 사후 평균"], sd = k["μ 사후 표준편차"], lo = k["μ 2.5% 분위"], hi = k["μ 97.5% 분위"]; if (!isNum(m) || !isNum(sd)) return null;
  const pr = /N\(\s*(-?[\d.]+)\s*,\s*([\d.]+)/.exec(String(k["사전분포"] || "")), pm = pr ? Number(pr[1]) : null, ps = pr ? Number(pr[2]) : null;
  const tiles = [tile(t3("사후 평균 μ", "Posterior mean μ", "后验均值 μ"), fmt(m, 3), `SD ${fmt(sd, 3)}`, "c2"), tile(t3("95% 신용구간", "95% credible interval", "95% 可信区间"), `${fmt(lo, 2)} ~ ${fmt(hi, 2)}`, lo * hi > 0 ? t3("0을 포함하지 않음", "excludes 0", "不含 0") : t3("0을 포함", "includes 0", "含 0"), lo * hi > 0 ? "good" : undefined), isNum(k["표본 크기"]) && tile("N", String(k["표본 크기"]), L(k["모형"] || ""))].filter(Boolean);
  const x0 = Math.min(m - 4.2 * sd, isNum(pm) ? pm - 3 * ps : Infinity), x1 = Math.max(m + 4.2 * sd, isNum(pm) ? pm + 3 * ps : -Infinity), xs = Array.from({ length: 161 }, (_, i) => x0 + ((x1 - x0) * i) / 160);
  const charts = [];
  charts.push(card("post", t3("사전분포가 자료를 만나 사후분포가 되다", "Prior meets data: the posterior", "先验遇到数据成为后验"), t3(`사후분포는 ${fmt(m, 3)} 주변에 좁게 모입니다(SD ${fmt(sd, 3)}).`, `The posterior concentrates around ${fmt(m, 3)} (SD ${fmt(sd, 3)}).`, `后验集中在 ${fmt(m, 3)} 附近(SD ${fmt(sd, 3)})。`),
    t3("넓고 낮은 곡선이 분석 전의 믿음(사전분포), 좁고 높은 곡선이 자료를 반영한 믿음(사후분포)입니다. 점선 사이가 95% 신용구간 — 모수가 그 안에 있을 확률이 95%입니다.", "The wide low curve is the belief before seeing data (prior); the narrow tall curve is the belief after (posterior). Between the dashed lines is the 95% credible interval – the parameter lies there with 95% probability.", "宽而低的曲线为数据前信念(先验),窄而高的曲线为数据后信念(后验);虚线之间为 95% 可信区间 — 参数落在其中的概率为 95%。"),
    <Lines series={[...(isNum(pm) ? [{ name: t3("사전", "prior", "先验"), color: C(5), area: true, markers: false, dash: "5 4", points: xs.map((x) => ({ x, y: pdfNorm(x, pm, ps) })) }] : []), { name: t3("사후", "posterior", "后验"), color: C(0), area: true, markers: false, width: 3, points: xs.map((x) => ({ x, y: pdfNorm(x, m, sd) })) }]} vlines={[{ x: lo, label: fmt(lo, 2), color: C(1) }, { x: hi, label: fmt(hi, 2), color: C(1) }]} xLabel="μ" yFmt={() => ""} height={280} xFmt={(v) => fmt(v, 2)} tip={false} />, dtab([t3("항목", "Item", "项目"), t3("값", "value", "值")], Object.entries(k).map(([a, b]) => [L(a), isNum(b) ? b : L(b)])), { wide: true }));
  charts.push(card("ci", t3("사후 평균과 95% 신용구간", "Posterior mean with 95% credible interval", "后验均值及 95% 可信区间"), null, null, <Forest rows={[{ label: "μ", est: m, lo, hi, color: C(0), note: `SD ${fmt(sd, 3)}` }]} ref0={0} rowH={56} vfmt={(v) => fmt(v, 3)} />, null));
  return { tiles, charts };
};

X.M43 = (R) => {
  const co = objs(tb(R, /^계수/)), ms = kv(tb(R, /모형 요약/)); if (!co.length) return null;
  const r2 = num(ms["R²(설명 비율)"]), sdr = num(ms["잔차 표준편차"]);
  const tiles = [isNum(r2) && tile("R²", fmt(r2, 4), t3("곡선이 설명하는 몫", "variance explained", "曲线解释的比例"), r2 >= 0.9 ? "good" : "c2"), isNum(sdr) && tile(t3("잔차 SD", "Residual SD", "残差 SD"), fmt(sdr, 3), L(ms["모형"] || "")), ...co.slice(0, 2).map((r) => tile(L(r["모수"]), fmt(r["추정값"], 4), `95% CI ${fmt(r["CI 하"], 3)} ~ ${fmt(r["CI 상"], 3)}`))].filter(Boolean);
  const charts = [];
  charts.push(card("par", t3("모수 추정값과 95% 구간 (시작값과 비교)", "Parameter estimates with 95% CI (vs start values)", "参数估计及 95% 区间(与初值比较)"), t3(`모형: ${L(ms["모형식"] || ms["모형"] || "")}`, `Model: ${L(ms["모형식"] || ms["모형"] || "")}`, `模型:${L(ms["모형식"] || ms["모형"] || "")}`),
    t3("검은 막대가 추정값, 회색 선이 95% 신뢰구간, 붉은 점선이 반복 계산을 시작한 값입니다. 추정값이 시작값에서 멀리 갔다면 시작값이 부정확했거나 여러 해 중 하나에 수렴한 것일 수 있습니다.", "The black bar is the estimate, the grey line its 95% CI and the red dashed line the starting value of the iteration. A large move from the start may mean a poor start or convergence to one of several solutions.", "黑色柱为估计值,灰线为 95% 区间,红色虚线为迭代初值;估计值远离初值可能说明初值欠佳或收敛到多个解之一。"),
    <Bullets items={co.map((r) => { const lo = Math.min(r["CI 하"], r["시작값"] ?? Infinity), hi = Math.max(r["CI 상"], r["시작값"] ?? -Infinity), pad = (hi - lo) * 0.25 || 1; return { label: L(r["모수"]), value: r["추정값"], lo: r["CI 하"], hi: r["CI 상"], target: r["시작값"], min: lo - pad, max: hi + pad, fmt: (v) => fmt(v, 4), note: `SE ${fmt(r["SE"], 4)} · ${fp(r["p"])}` }; })} rowH={54} />, dtab([t3("모수", "Param", "参数"), t3("추정", "est", "估计"), "SE", "p", "lo", "hi", t3("시작값", "start", "初值")], co.map((r) => [L(r["모수"]), r["추정값"], r["SE"], r["p"], r["CI 하"], r["CI 상"], r["시작값"]])), { wide: true }));
  if (isNum(r2)) charts.push(card("r2", t3("곡선의 설명력", "Explanatory power of the curve", "曲线的解释力"), null, null, <Arc value={r2} min={0} max={1} label="R²" sub={t3("설명 비율", "variance explained", "解释比例")} bands={[{ to: 0.5, color: "bad", label: "<.5" }, { to: 0.8, color: "warn", label: "<.8" }, { to: 1, color: "ok", label: "≥.8" }]} fmtv={(v) => fmt(v, 4)} />, null));
  charts.push(card("t", t3("모수별 |t| — 얼마나 분명히 0이 아닌가", "|t| per parameter", "各参数 |t|"), null, null, <Bars items={co.map((r) => ({ label: L(r["모수"]), value: Math.abs(r["t"]) }))} marks={[{ value: 1.96, label: "1.96" }]} fmtv={(v) => fmt(v, 1)} />, null));
  const a = asmCard(R); if (a) charts.push(a);
  return { tiles, charts };
};

export default X;
