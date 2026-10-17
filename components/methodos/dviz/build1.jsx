/* 기법별 시각화 설계 1 — M01 ~ M12 (요약·비교·상관·회귀·조절) */
import { Bars, Bullets, Dist, Forest, Heat, Means } from "./charts1.jsx";
import { Donut, Lines, Mosaic, Pareto, RangeBox, Scatter, Stack100, Waterfall } from "./charts2.jsx";
import { C, asmCard, card, col, dtab, eff, effCard, effItem, has, distCard, ciForest, kv, L, num, objs, pTone, roleVars, t3, tb, tbs, tcrit, tile, fmt, fp, isNum, sgn, star, clip, cdfT, qT, pdfNorm, seFromCI } from "./bh.jsx";

const dash = "—";
const X = {};

X.M01 = (R) => {
  const t = tb(R, /기술통계/), rows = objs(t); if (!rows.length) return null;
  const tiles = rows.slice(0, 4).map((r) => tile(L(r["변수"]), `${fmt(r["평균"], 2)} ± ${fmt(r["표준편차"], 2)}`, `N=${r["N"]} · ${t3("결측", "missing", "缺失")} ${r["결측"]}`));
  const charts = [];
  charts.push(card("rng", t3("분포 한눈에 — 범위·사분위·평균", "Distribution at a glance — range, quartiles, mean", "分布一览 — 范围、四分位、均值"),
    t3("변수마다 자기 눈금으로 그렸습니다. 상자는 가운데 50%, 굵은 선은 중위수, 마름모는 평균입니다.", "Each variable has its own scale. Box = middle 50%, thick line = median, diamond = mean.", "每个变量使用自己的刻度。箱为中间 50%,粗线为中位数,菱形为均值。"),
    t3("평균(◇)과 중위수(┃)가 가까우면 분포가 대칭에 가깝고, 평균이 한쪽으로 멀리 떨어지면 치우친 분포이거나 극단값의 영향입니다. 상자가 길수록 가운데 절반이 넓게 퍼져 있습니다.", "If the mean (◇) is close to the median (┃) the distribution is roughly symmetric; a far-off mean suggests skew or outliers. A longer box means a wider middle half.", "均值(◇)与中位数(┃)接近表示分布大致对称;相距较远则提示偏态或极端值。箱越长,中间一半数据越分散。"),
    <RangeBox items={rows.map((r) => ({ label: L(r["변수"]), min: r["최솟값"], q1: r["Q1"], med: r["중위수"], q3: r["Q3"], max: r["최댓값"], mean: r["평균"], n: r["N"] }))} />,
    dtab([t3("변수", "Variable", "变量"), "min", "Q1", "median", "Q3", "max", "mean"], rows.map((r) => [L(r["변수"]), r["최솟값"], r["Q1"], r["중위수"], r["Q3"], r["최댓값"], r["평균"]])), { wide: true }));
  const sS = rows[0]["왜도 SE"], sK = rows[0]["첨도 SE"];
  if (isNum(sS) && isNum(sK)) charts.push(card("sk", t3("분포의 모양 — 왜도와 첨도", "Shape — skewness and kurtosis", "分布形状 — 偏度与峰度"),
    t3("초록 영역(±1.96 SE) 안이면 정규분포에서 크게 벗어나지 않은 모양입니다.", "Inside the green region (±1.96 SE) the shape is not clearly non-normal.", "位于绿色区域(±1.96 SE)内,形状与正态无明显偏离。"),
    t3("가로축은 왜도(좌우 기울기), 세로축은 초과 첨도(꼬리의 두께)입니다. 초록 영역 밖으로 나가면 한쪽으로 치우쳤거나 꼬리가 평소보다 두껍/얇다는 뜻이므로 평균 대신 중위수를 함께 보세요.", "x = skewness (left/right lean), y = excess kurtosis (tail weight). Outside the green region the variable is skewed or has heavy/light tails – consider the median as well.", "横轴为偏度(左右倾斜),纵轴为超额峰度(尾部厚度)。超出绿色区域说明偏斜或尾部异常,建议同时参考中位数。"),
    <Scatter points={rows.map((r, i) => ({ x: r["왜도"], y: r["첨도"], label: L(r["변수"]), r: 8, color: C(i) }))} refX={0} refY={0} region={{ x0: -1.96 * sS, x1: 1.96 * sS, y0: -1.96 * sK, y1: 1.96 * sK, label: t3("정규 범위", "normal range", "正态范围") }} xLabel={t3("왜도", "Skewness", "偏度")} yLabel={t3("첨도", "Excess kurtosis", "超额峰度")} height={290} />,
    dtab([t3("변수", "Variable", "变量"), t3("왜도", "Skew", "偏度"), t3("첨도", "Kurt", "峰度")], rows.map((r) => [L(r["변수"]), r["왜도"], r["첨도"]]))));
  const cv = rows.filter((r) => isNum(r["평균"]) && r["평균"] > 0 && isNum(r["표준편차"]));
  if (cv.length >= 2) charts.push(card("cv", t3("상대적 흩어짐 — 변동계수", "Relative spread — coefficient of variation", "相对离散 — 变异系数"), t3("표준편차 ÷ 평균입니다. 단위가 다른 변수끼리도 흩어짐을 견줄 수 있습니다.", "SD ÷ mean, so variables on different units can be compared.", "标准差 ÷ 均值,可比较单位不同的变量的离散程度。"),
    t3("값이 클수록 평균에 비해 자료가 더 넓게 흩어져 있습니다.", "A larger value means the data are more spread out relative to the mean.", "数值越大,相对均值数据越分散。"),
    <Bars items={cv.map((r) => ({ label: L(r["변수"]), value: (r["표준편차"] / r["평균"]) * 100 }))} fmtv={(v) => fmt(v, 1)} unit="%" />, dtab([t3("변수", "Variable", "变量"), "CV %"], cv.map((r) => [L(r["변수"]), (r["표준편차"] / r["평균"]) * 100]))));
  const miss = rows.filter((r) => r["결측"] > 0 || r["극단값 수"] > 0);
  if (miss.length) charts.push(card("ms", t3("결측과 극단값", "Missing values and outliers", "缺失值与极端值"), t3("결측은 비어 있는 칸의 비율, 극단값은 상자 바깥으로 벗어난 값의 수입니다.", "Missing = share of empty cells; outliers = values beyond the box fences.", "缺失为空单元格比例,极端值为超出箱须范围的数值个数。"), null,
    <Bars items={miss.flatMap((r) => [{ label: `${L(r["변수"])} · ${t3("결측률", "missing", "缺失率")}`, value: (r["결측"] / (r["N"] + r["결측"])) * 100, color: C(1) }, { label: `${L(r["변수"])} · ${t3("극단값", "outliers", "极端值")}`, value: r["극단값 수"], color: C(3) }])} fmtv={(v) => fmt(v, 1)} />, null));
  return { tiles, charts };
};

X.M02 = (R) => {
  const ts = tbs(R, /^빈도\s*—/); if (!ts.length) return null;
  const tiles = [], charts = [];
  ts.slice(0, 5).forEach((t, i) => {
    const name = L(String(t.title).replace(/^빈도\s*—\s*/, "")), rows = objs(t).filter((r) => isNum(r["빈도"]));
    const top = [...rows].sort((a, b) => b["빈도"] - a["빈도"])[0]; if (!top) return;
    tiles.push(tile(name, `${L(top["범주"])} ${fmt(top["백분율"], 1)}%`, `${t3("범주", "categories", "类别")} ${rows.length}`));
    charts.push(card("par" + i, `${name} — ${t3("빈도 순위와 누적", "frequency ranking & cumulative share", "频数排名与累计占比")}`,
      t3(`가장 많은 범주는 ‘${L(top["범주"])}’(${fmt(top["백분율"], 1)}%)입니다.`, `Most frequent: ‘${L(top["범주"])}’ (${fmt(top["백분율"], 1)}%).`, `最多的类别是“${L(top["범주"])}”(${fmt(top["백분율"], 1)}%)。`),
      t3("막대는 빈도(큰 순서), 선은 누적 백분율입니다. 누적선이 가파르게 올라 100%에 빨리 닿을수록 소수 범주에 몰려 있다는 뜻입니다.", "Bars = frequency (descending); line = cumulative %. A steep rise means a few categories dominate.", "柱为频数(降序),线为累计百分比;上升越陡,说明越集中于少数类别。"),
      <Pareto items={[...rows].sort((a, b) => b["빈도"] - a["빈도"]).map((r) => ({ label: L(r["범주"]), value: r["빈도"] }))} />,
      dtab([t3("범주", "Category", "类别"), t3("빈도", "Count", "频数"), "%"], rows.map((r) => [L(r["범주"]), r["빈도"], r["백분율"]]))));
    if (rows.length <= 6) charts.push(card("dn" + i, `${name} — ${t3("구성비", "composition", "构成比")}`, null, t3("조각의 크기가 전체에서 차지하는 비율입니다.", "Slice size is the share of the total.", "扇形大小为占总数的比例。"), <Donut items={rows.map((r) => ({ label: L(r["범주"]), value: r["빈도"] }))} sub="N" />, null));
  });
  return { tiles, charts };
};

X.M03 = (R) => {
  const ct = tb(R, /교차표/), rows = objs(ct); if (!rows.length) return null;
  const rs = [...new Set(rows.map((r) => String(r["행"])))], cs = [...new Set(rows.map((r) => String(r["열"])))];
  const cell = (r, c, k) => (rows.find((x) => String(x["행"]) === r && String(x["열"]) === c) || {})[k];
  const counts = rs.map((r) => cs.map((c) => cell(r, c, "관측") || 0));
  const chi = objs(tb(R, /카이제곱 검정/))[0] || {}, V = eff(R, /크레이머/), OR = eff(R, /오즈비/);
  const tiles = [tile("χ²", `${fmt(chi["카이제곱"], 2)}`, `df ${chi["자유도"]} · ${fp(chi["유의확률"])}`, pTone(chi["유의확률"])), V && tile(L(V.name), fmt(V.value, 3), V.interpretation_band ? L(String(V.interpretation_band)) : "", "c2"), OR && tile(L(OR.name), fmt(OR.value, 2), t3("한쪽 칸의 위험이 몇 배인가", "odds ratio", "优势比"))].filter(Boolean);
  const charts = [];
  charts.push(card("mos", t3("모자이크 — 칸의 넓이가 곧 사례 수", "Mosaic — area equals cell count", "马赛克图 — 面积即频数"), t3("가로 폭은 행 범주의 크기, 세로 높이는 그 행 안의 열 범주 비율입니다.", "Width = size of the row category; height = share of the column category within it.", "宽度为行类别大小,高度为该行内列类别的占比。"),
    t3("같은 색 띠의 높이가 행마다 비슷하면 두 변수는 무관하고, 높이가 뚜렷이 다르면 관련이 있다는 뜻입니다.", "If bands of the same colour have similar heights across rows the variables are unrelated; clearly different heights indicate association.", "同色条带在各行高度相近说明无关联;高度差异明显则说明存在关联。"),
    <Mosaic rows={rs.map(L)} cols={cs.map(L)} counts={counts} rowTitle={roleVars(R, "row")[0]} colTitle={roleVars(R, "col")[0]} />, dtab([t3("행", "Row", "行"), t3("열", "Col", "列"), t3("관측", "Obs", "观测"), t3("기대", "Exp", "期望")], rows.map((r) => [L(r["행"]), L(r["열"]), r["관측"], r["기대"]])), { wide: true }));
  const adj = rs.map((r) => cs.map((c) => cell(r, c, "수정 잔차")));
  if (adj.flat().every(isNum)) {
    const flags = new Set(); adj.forEach((a, i) => a.forEach((v, j) => { if (Math.abs(v) > 1.96) flags.add(`${i},${j}`); }));
    charts.push(card("res", t3("어느 칸이 기대와 다른가 — 수정 잔차", "Which cells deviate — adjusted residuals", "哪个单元格偏离期望 — 调整残差"), t3("테두리가 있는 칸은 |잔차| > 1.96, 즉 우연만으로는 설명하기 어려운 칸입니다.", "Outlined cells have |residual| > 1.96 – hard to explain by chance alone.", "带边框的格子 |残差| > 1.96,难以用偶然解释。"),
      t3("청록은 기대보다 많은 칸, 장밋빛은 기대보다 적은 칸입니다. 칸 안의 숫자가 수정 잔차입니다.", "Teal cells have more cases than expected; rose cells fewer. The number is the adjusted residual.", "青绿色为多于期望,玫红为少于期望;格内数字为调整残差。"),
      <Heat rows={rs.map(L)} cols={cs.map(L)} values={adj} diverge flags={flags} text={adj.map((a, i) => a.map((v, j) => `${sgn(v, 2)}`))} cellH={38} minCell={70} />, dtab([t3("행", "Row", "行"), t3("열", "Col", "列"), t3("수정 잔차", "Adj. residual", "调整残差")], rows.map((r) => [L(r["행"]), L(r["열"]), r["수정 잔차"]]))));
  }
  charts.push(card("stk", t3("행 안의 구성(%)", "Composition within each row (%)", "各行内构成(%)"), null, t3("막대 한 줄이 100%이며 색 조각이 열 범주의 비율입니다.", "Each bar sums to 100%; colours are the column categories.", "每条柱合计 100%,颜色为列类别占比。"),
    <Stack100 rows={rs.map((r, i) => ({ label: L(r), parts: cs.map((c, j) => ({ name: L(c), value: counts[i][j] })) }))} />, null));
  const d = distCard("chi", "chi2", chi["카이제곱"], chi["자유도"], null, chi["유의확률"], "right", t3("카이제곱 분포에서 내 값의 위치", "Where χ² falls", "χ² 在分布中的位置")); if (d) charts.push(d);
  const e = effCard(R, "eff", /크레이머|파이/); if (e) charts.push(e);
  return { tiles, charts };
};

X.M04 = (R) => {
  const r = objs(tb(R, /일표본 t검정/))[0]; if (!r) return null;
  const mu = r["기준값"], tc = tcrit(r["df"]), lo = mu + r["CI 하"], hi = mu + r["CI 상"];
  const tiles = [tile(t3("표본 평균", "Sample mean", "样本均值"), fmt(r["평균"], 3), `n=${r["N"]}`), tile(t3("기준값과의 차이", "Difference", "与基准值之差"), sgn(r["차이"], 3), `95% CI ${fmt(r["CI 하"], 2)} ~ ${fmt(r["CI 상"], 2)}`, pTone(r["p(양측)"])), tile("t", fmt(r["t"], 2), `df ${fmt(r["df"], 0)} · ${fp(r["p(양측)"])}`)];
  const charts = [];
  charts.push(card("mean", t3("표본 평균은 기준값에서 얼마나 떨어져 있나", "How far is the sample mean from the reference?", "样本均值离基准值有多远"), t3(`평균 ${fmt(r["평균"], 3)} [${fmt(lo, 2)}, ${fmt(hi, 2)}] vs 기준값 ${fmt(mu, 2)}`, `Mean ${fmt(r["평균"], 3)} [${fmt(lo, 2)}, ${fmt(hi, 2)}] vs reference ${fmt(mu, 2)}`, `均值 ${fmt(r["평균"], 3)} [${fmt(lo, 2)}, ${fmt(hi, 2)}],基准值 ${fmt(mu, 2)}`),
    t3("점선이 비교 기준값입니다. 평균의 95% 신뢰구간이 점선을 포함하지 않으면 평균은 기준값과 다르다고 볼 수 있습니다.", "The dashed line is the reference value. If the 95% CI of the mean excludes it, the mean differs from the reference.", "虚线为比较基准值;若均值的 95% 置信区间不含该值,则均值与基准值不同。"),
    <Forest rows={[{ label: `${t3("표본 평균", "Sample mean", "样本均值")} (n=${r["N"]})`, est: r["평균"], lo, hi, color: C(0) }]} ref0={mu} xLabel={t3(`기준값 = ${fmt(mu, 2)} (점선)`, `reference = ${fmt(mu, 2)} (dashed)`, `基准值 = ${fmt(mu, 2)}(虚线)`)} rowH={64} vfmt={(v) => fmt(v, 3)} />, dtab(["", "mean", "lo", "hi", "ref"], [[t3("평균", "mean", "均值"), r["평균"], lo, hi, mu]])));
  const d = distCard("t", "t", r["t"], r["df"], null, r["p(양측)"], "two"); if (d) charts.push(d);
  const e = effCard(R); if (e) charts.push(e);
  return { tiles, charts };
};

X.M05 = (R) => {
  const g = objs(tb(R, /집단별 기술통계/)), tt = objs(tb(R, /^독립표본 t검정/)); if (g.length < 2 || !tt.length) return null;
  const eq = tt[0], we = tt[1] || tt[0], d = eff(R, /코헨 d/);
  const means = g.map((r, i) => { const tc = tcrit(r["N"] - 1); return { label: L(r["집단"]), mean: r["평균"], lo: r["평균"] - tc * r["SE"], hi: r["평균"] + tc * r["SE"], n: r["N"], color: C(i) }; });
  const tiles = [tile(t3("평균 차이", "Mean difference", "均值差"), sgn(we["평균차"], 2), `95% CI ${fmt(we["CI 하"], 2)} ~ ${fmt(we["CI 상"], 2)}`, pTone(we["p(양측)"])), tile(t3("Welch t", "Welch t", "Welch t"), fmt(we["t"], 2), `df ${fmt(we["df"], 1)} · ${fp(we["p(양측)"])}`), d && tile(L(d.name), sgn(d.value, 2), d.interpretation_band ? L(String(d.interpretation_band)) : "", "c2")].filter(Boolean);
  const charts = [];
  charts.push(card("means", t3("집단별 평균과 95% 신뢰구간", "Group means with 95% CIs", "各组均值及 95% 置信区间"), t3(`${means[0].label} ${fmt(means[0].mean, 2)} · ${means[1].label} ${fmt(means[1].mean, 2)} — 구간이 겹치는 정도를 보세요.`, `${means[0].label} ${fmt(means[0].mean, 2)} · ${means[1].label} ${fmt(means[1].mean, 2)} — note how much the intervals overlap.`, `${means[0].label} ${fmt(means[0].mean, 2)} · ${means[1].label} ${fmt(means[1].mean, 2)} — 注意区间重叠程度。`),
    t3("점은 집단 평균, 세로선은 평균의 95% 신뢰구간입니다. 구간이 많이 겹치지 않을수록 두 평균이 다르다는 근거가 강합니다(겹침 여부만으로 결론 내리지 말고 오른쪽 차이 그림도 함께 보세요).", "Dots are group means, vertical lines their 95% CIs. The less they overlap, the stronger the evidence of a difference (don't decide by overlap alone – see the difference plot).", "圆点为组均值,竖线为 95% 置信区间。重叠越少,差异证据越强(不要仅凭重叠下结论,请参阅差异图)。"),
    <Means items={means} yLabel={L(roleVars(R, "outcome")[0] || "")} />, dtab([t3("집단", "Group", "组"), "N", "mean", "lo", "hi"], means.map((m) => [m.label, m.n, m.mean, m.lo, m.hi]))));
  const sd = g.filter((r) => isNum(r["SD"]));
  if (sd.length === 2) {
    const lo = Math.min(...sd.map((r) => r["평균"] - 3.4 * r["SD"])), hi = Math.max(...sd.map((r) => r["평균"] + 3.4 * r["SD"])), xs = Array.from({ length: 121 }, (_, i) => lo + ((hi - lo) * i) / 120);
    charts.push(card("curve", t3("두 집단의 점수는 얼마나 겹치나 (평균·SD로 그린 정규 곡선)", "How much do the two groups overlap? (normal curves from mean & SD)", "两组得分重叠多少(由均值与 SD 绘制的正态曲线)"), t3("자료를 그대로 그린 것이 아니라 평균과 SD로 그린 정규 곡선입니다 — 실제 분포는 위의 상자·바이올린 그림을 보세요.", "Model curves drawn from mean and SD (not raw data) – see the engine's box/violin plots for actual distributions.", "这是用均值和 SD 绘制的模型曲线(非原始数据),实际分布请看上方箱线/小提琴图。"),
      t3("겹치는 면적이 작을수록 두 집단이 뚜렷이 다릅니다. 곡선 꼭대기의 세로선이 각 집단의 평균입니다.", "The smaller the overlapping area, the more distinct the groups. The vertical lines mark group means.", "重叠面积越小,两组差异越明显;竖线为各组均值。"),
      <Lines series={sd.map((r, i) => ({ name: L(r["집단"]), color: C(i), area: true, markers: false, points: xs.map((x) => ({ x, y: pdfNorm(x, r["평균"], r["SD"]) })) }))} vlines={sd.map((r, i) => ({ x: r["평균"], label: fmt(r["평균"], 1), color: C(i) }))} yFmt={() => ""} height={230} tip={false} xFmt={(v) => fmt(v, 0)} />, null));
  }
  charts.push(card("diff", t3("평균 차이와 95% 신뢰구간", "Mean difference with 95% CI", "均值差及 95% 置信区间"), t3(`차이 ${sgn(we["평균차"], 2)} — 구간이 0을 ${we["CI 하"] * we["CI 상"] > 0 ? "포함하지 않습니다" : "포함합니다"}.`, `Difference ${sgn(we["평균차"], 2)} — the interval ${we["CI 하"] * we["CI 상"] > 0 ? "excludes" : "includes"} 0.`, `差值 ${sgn(we["평균차"], 2)} — 区间${we["CI 하"] * we["CI 상"] > 0 ? "不含" : "含"} 0。`),
    t3("등분산을 가정한 t와 Welch 보정 t의 결과를 함께 보여 줍니다. 둘이 거의 같으면 등분산 위배가 결론을 흔들지 않는다는 뜻입니다.", "Student's t (equal variances) and Welch's t shown together; if they agree the variance assumption does not drive the conclusion.", "同时显示等方差 t 与 Welch t;二者接近说明方差齐性假设不影响结论。"),
    <Forest rows={tt.map((r, i) => ({ label: L(r["방법"]), est: r["평균차"], lo: r["CI 하"], hi: r["CI 상"], color: C(i === 0 ? 0 : 2), note: fp(r["p(양측)"]) }))} ref0={0} xLabel={t3("평균차 (점선 = 차이 없음)", "mean difference (dashed = no difference)", "均值差(虚线 = 无差异)")} rowH={44} />, dtab([t3("방법", "Method", "方法"), "diff", "lo", "hi", "p"], tt.map((r) => [L(r["방법"]), r["평균차"], r["CI 하"], r["CI 상"], r["p(양측)"]]))));
  const dd = distCard("t", "t", we["t"], we["df"], null, we["p(양측)"], "two"); if (dd) charts.push(dd);
  const e = effCard(R); if (e) charts.push(e);
  return { tiles, charts };
};

X.M06 = (R) => {
  const g = objs(tb(R, /^대응표본 t검정/)), tt = objs(tb(R, /^검정$/))[0]; if (g.length < 2 || !tt) return null;
  const a = g[0], b = g[1], d = eff(R, /코헨 d\(차이\)/) || eff(R, /코헨/);
  const tiles = [tile(t3("평균 변화", "Mean change", "平均变化"), sgn(-tt["평균차"], 2), `95% CI ${fmt(-tt["CI 상"], 2)} ~ ${fmt(-tt["CI 하"], 2)}`, pTone(tt["p"])), tile("t", fmt(tt["t"], 2), `df ${fmt(tt["df"], 0)} · ${fp(tt["p"])}`), d && tile(L(d.name), sgn(d.value, 2), d.interpretation_band ? L(String(d.interpretation_band)) : "", "c2")].filter(Boolean);
  const charts = [];
  charts.push(card("slope", t3("사전 → 사후 평균의 이동", "Pre → post change in the mean", "前测 → 后测均值变化"), t3(`${fmt(a["평균"], 2)} → ${fmt(b["평균"], 2)} (변화 ${sgn(b["평균"] - a["평균"], 2)})`, `${fmt(a["평균"], 2)} → ${fmt(b["평균"], 2)} (change ${sgn(b["평균"] - a["평균"], 2)})`, `${fmt(a["평균"], 2)} → ${fmt(b["평균"], 2)}(变化 ${sgn(b["평균"] - a["평균"], 2)})`),
    t3("같은 사람들의 두 번 측정한 평균을 이었습니다. 선이 오르면 사후 평균이 높다는 뜻이며, 점 옆의 구간은 평균의 95% 신뢰구간입니다.", "The same people's two means are connected. A rising line means a higher post mean; whiskers are 95% CIs of the means.", "连线为同一批人两次测量的均值;线上升表示后测均值更高,须线为均值 95% 置信区间。"),
    <Means items={[a, b].map((r, i) => { const tc = tcrit(r["N"] - 1), se = r["SD"] / Math.sqrt(r["N"]); return { label: L(r["항목"]), mean: r["평균"], lo: r["평균"] - tc * se, hi: r["평균"] + tc * se, n: r["N"], color: C(i) }; })} connect />, dtab(["", "N", "mean", "SD"], g.map((r) => [L(r["항목"]), r["N"], r["평균"], r["SD"]]))));
  charts.push(card("diff", t3("짝 차이(사전−사후)의 95% 신뢰구간", "Paired difference (pre − post) with 95% CI", "配对差值(前−后)的 95% 置信区间"), t3("구간이 0을 포함하지 않으면 변화가 분명합니다.", "If the interval excludes 0 the change is clear.", "区间不含 0 则变化明确。"), null,
    <Forest rows={[{ label: t3("평균 차이 (사전−사후)", "Mean difference (pre − post)", "平均差(前−后)"), est: tt["평균차"], lo: tt["CI 하"], hi: tt["CI 상"], color: C(0), note: fp(tt["p"]) }]} ref0={0} rowH={60} />, null));
  const dd = distCard("t", "t", tt["t"], tt["df"], null, tt["p"], "two"); if (dd) charts.push(dd);
  const e = effCard(R); if (e) charts.push(e);
  return { tiles, charts };
};

X.M07 = (R) => {
  const g = objs(tb(R, /집단별 기술통계/)), an = objs(tb(R, /^일원분산분석/)), ph = objs(tb(R, /사후검정/)); if (!g.length || !an.length) return null;
  const b = an.find((r) => /간/.test(r["원천"])) || an[0], w = an.find((r) => /내/.test(r["원천"])), eta = eff(R, /^η²/);
  const tiles = [tile("F", fmt(b["F"], 2), `df ${b["df"]}, ${w ? w["df"] : ""} · ${fp(b["p"])}`, pTone(b["p"])), eta && tile("η²", fmt(eta.value, 3), t3(`집단이 설명하는 비율 ${fmt(eta.value * 100, 1)}%`, `${fmt(eta.value * 100, 1)}% of variance`, `解释 ${fmt(eta.value * 100, 1)}% 方差`), "c2"), tile(t3("집단 수", "Groups", "组数"), String(g.length), `N=${g.reduce((s, r) => s + r["N"], 0)}`)].filter(Boolean);
  const charts = [];
  charts.push(card("means", t3("집단별 평균", "Group means", "各组均值"), t3("집단 평균을 순서대로 이었습니다.", "Group means connected in order.", "按顺序连接各组均值。"), t3("점의 높이가 집단 평균입니다. 점 아래의 n은 집단 크기입니다. 어느 집단끼리 다른지는 아래 사후검정 그림에서 봅니다.", "Dot height is the group mean; n is group size. See the post-hoc plots below for which groups differ.", "圆点高度为组均值,n 为组大小。哪些组之间有差异请看下方事后检验图。"),
    <Means items={g.map((r, i) => ({ label: L(r["집단"]), mean: r["평균"], n: r["N"], color: C(i) }))} connect yLabel={L(roleVars(R, "outcome")[0] || "")} />, dtab([t3("집단", "Group", "组"), "N", "mean"], g.map((r) => [L(r["집단"]), r["N"], r["평균"]]))));
  if (w) charts.push(card("ss", t3("변동은 어디서 왔나 — 집단 간 vs 집단 내", "Where does the variation come from?", "变异来自哪里 — 组间 vs 组内"), t3(`집단 간 변동이 전체의 ${fmt((b["SS"] / (b["SS"] + w["SS"])) * 100, 1)}%입니다 (η²).`, `Between-group variation is ${fmt((b["SS"] / (b["SS"] + w["SS"])) * 100, 1)}% of the total (η²).`, `组间变异占总变异的 ${fmt((b["SS"] / (b["SS"] + w["SS"])) * 100, 1)}%(η²)。`),
    t3("막대에서 색이 진한 쪽(집단 간)이 길수록 집단 소속이 점수를 더 잘 설명합니다.", "The longer the dark part (between groups), the better group membership explains the scores.", "深色部分(组间)越长,组别对得分的解释力越强。"),
    <Stack100 rows={[{ label: "SS", parts: [{ name: t3("집단 간", "Between", "组间"), value: b["SS"] }, { name: t3("집단 내", "Within", "组内"), value: w["SS"] }] }]} showN={false} />, dtab(["", "SS", "df", "MS", "F", "p"], an.map((r) => [L(r["원천"]), r["SS"], r["df"], r["MS"], r["F"], r["p"]]))));
  const d = distCard("F", "F", b["F"], b["df"], w && w["df"], b["p"], "right"); if (d) charts.push(d);
  if (ph.length) {
    charts.push(card("ph", t3("사후검정 — 어느 두 집단이 다른가", "Post-hoc — which pairs differ?", "事后检验 — 哪两组不同"), t3("보정된 p 값과 95% 신뢰구간으로 짝마다 평균 차이를 보여 줍니다.", "Mean differences per pair with adjusted p-values and 95% CIs.", "显示每对均值差及校正 p 值、95% 置信区间。"),
      t3("구간이 0(점선)을 가로지르지 않는 짝이 다르다고 판단되는 짝입니다. 오른쪽 숫자는 보정된 p 값입니다.", "Pairs whose interval does not cross 0 (dashed) are the ones judged different; the right column shows adjusted p.", "区间不跨 0(虚线)的配对被判定为有差异;右侧为校正 p 值。"),
      <Forest rows={ph.map((r, i) => ({ label: `${L(r["A"])} − ${L(r["B"])}`, est: r["평균차"], lo: r["CI 하"], hi: r["CI 상"], color: r["p(보정)"] < 0.05 ? C(0) : "var(--dv-mute)", note: `${fp(r["p(보정)"])}${star(r["p(보정)"])}` }))} ref0={0} />, dtab(["A", "B", "diff", "lo", "hi", "p(adj)"], ph.map((r) => [L(r["A"]), L(r["B"]), r["평균차"], r["CI 하"], r["CI 상"], r["p(보정)"]]))));
    const names = [...new Set(ph.flatMap((r) => [String(r["A"]), String(r["B"])]))], M = names.map(() => names.map(() => NaN)), S = names.map(() => names.map(() => ""));
    ph.forEach((r) => { const i = names.indexOf(String(r["A"])), j = names.indexOf(String(r["B"])); M[i][j] = r["평균차"]; M[j][i] = -r["평균차"]; S[i][j] = star(r["p(보정)"]); S[j][i] = star(r["p(보정)"]); });
    if (names.length >= 3) charts.push(card("hm", t3("집단 쌍 비교표 (평균 차이)", "Pairwise comparison matrix", "两两比较矩阵"), t3("행 집단 평균 − 열 집단 평균, ★은 보정 p 기준 유의 표시입니다.", "Row mean − column mean; stars mark adjusted-p significance.", "行均值 − 列均值,星号为校正 p 的显著性标记。"), null,
      <Heat rows={names.map(L)} cols={names.map(L)} values={M} diverge stars={S} text={M.map((r) => r.map((v) => (isNum(v) ? sgn(v, 1) : "")))} />, null));
  }
  const e = effCard(R); if (e) charts.push(e);
  return { tiles, charts };
};

X.M08 = (R) => {
  const rows = objs(tb(R, /^상관/)).filter((r) => String(r["X"]) !== String(r["Y"]) && isNum(r["r"])); if (!rows.length) return null;
  const names = [...new Set(objs(tb(R, /^상관/)).flatMap((r) => [String(r["X"]), String(r["Y"])]))], top = [...rows].sort((a, b) => Math.abs(b["r"]) - Math.abs(a["r"]))[0];
  const tiles = [tile(`r (${L(top["X"])}–${L(top["Y"])})`, fmt(top["r"], 3), `${fp(top["p"])} · N=${top["N"]}`, pTone(top["p"])), tile("r²", fmt(top["r"] ** 2, 3), t3(`한 변수가 다른 변수 변동의 ${fmt(top["r"] ** 2 * 100, 1)}%를 설명`, `${fmt(top["r"] ** 2 * 100, 1)}% shared variance`, `共享 ${fmt(top["r"] ** 2 * 100, 1)}% 方差`), "c2"), tile(t3("방법", "Method", "方法"), top["방법"] === "spearman" ? "Spearman ρ" : "Pearson r", `${rows.length} ${t3("쌍", "pairs", "对")}`)];
  const charts = [];
  charts.push(card("forest", t3("상관계수와 95% 신뢰구간 (큰 순서)", "Correlations with 95% CIs (strongest first)", "相关系数及 95% 置信区间(由强到弱)"), t3("−1에서 +1 사이의 값이며 0에서 멀수록 강한 관계입니다.", "Ranges from −1 to +1; the farther from 0 the stronger.", "取值 −1 到 +1,离 0 越远关系越强。"),
    t3("점선(0) 가까이 있으면 관계가 약하고, 구간이 0을 가로지르면 0과 구별되지 않습니다. 상관은 ‘함께 움직임’일 뿐 원인과 결과는 아닙니다.", "Near the dashed line = weak; an interval crossing 0 cannot be distinguished from 0. Correlation is co-movement, not causation.", "接近虚线表示关系弱;区间跨 0 则与 0 无法区分。相关不等于因果。"),
    <Forest rows={[...rows].sort((a, b) => Math.abs(b["r"]) - Math.abs(a["r"])).map((r, i) => ({ label: `${L(r["X"])} – ${L(r["Y"])}`, est: r["r"], lo: r["CI 하"], hi: r["CI 상"], color: r["r"] >= 0 ? C(0) : C(3), note: `${fp(r["p"])}${star(r["p"])}` }))} ref0={0} domain={[-1, 1]} vfmt={(v) => fmt(v, 3)} />, dtab(["X", "Y", "N", "r", "p", "lo", "hi"], rows.map((r) => [L(r["X"]), L(r["Y"]), r["N"], r["r"], r["p"], r["CI 하"], r["CI 상"]]))));
  if (names.length >= 3) {
    const all = objs(tb(R, /^상관/)), M = names.map((a) => names.map((b) => { const f = all.find((r) => (String(r["X"]) === a && String(r["Y"]) === b) || (String(r["X"]) === b && String(r["Y"]) === a)); return a === b ? 1 : f ? f["r"] : NaN; }));
    charts.push(card("hm", t3("상관 행렬", "Correlation matrix", "相关矩阵"), null, t3("청록은 양의 상관, 장밋빛은 음의 상관이며 진할수록 강합니다.", "Teal = positive, rose = negative; darker = stronger.", "青绿为正相关,玫红为负相关,越深越强。"), <Heat rows={names.map(L)} cols={names.map(L)} values={M} diverge domain={[-1, 1]} text={M.map((r) => r.map((v) => (isNum(v) ? fmt(v, 2).replace(/^(-?)0\./, "$1.") : "")))} cellH={36} />, null));
  }
  charts.push(card("r2", t3(`${L(top["X"])}–${L(top["Y"])} : 공유하는 변동`, `${L(top["X"])}–${L(top["Y"])}: shared variance`, `${L(top["X"])}–${L(top["Y"])}:共享方差`), t3("r²는 한 변수로 다른 변수의 변동을 설명하는 비율입니다.", "r² is the share of variance explained by the other variable.", "r² 为一个变量对另一变量方差的解释比例。"), null,
    <Donut items={[{ label: t3("공유(r²)", "shared (r²)", "共享(r²)"), value: top["r"] ** 2 * 100, color: C(0) }, { label: t3("나머지", "rest", "其余"), value: (1 - top["r"] ** 2) * 100, color: "var(--dv-grid)" }]} center={`${fmt(top["r"] ** 2 * 100, 0)}%`} sub="r²" />, null));
  const e = effCard(R); if (e) charts.push(e);
  return { tiles, charts };
};

function regressionBase(R, opt = {}) {
  const ms = objs(tb(R, /모형 요약/))[0], co = objs(tb(R, /^계수/)), an = objs(tb(R, /분산분석/)), outcome = roleVars(R, "outcome")[0] || "";
  const dfres = (an.find((r) => /잔차|오차/.test(r["원천"])) || {})["df"], tc = tcrit(dfres);
  const charts = [], tiles = [];
  if (ms) { tiles.push(tile("R²", fmt(ms["R²"], 3), t3(`수정 R² ${fmt(ms["수정 R²"], 3)}`, `adj. R² ${fmt(ms["수정 R²"], 3)}`, `调整 R² ${fmt(ms["수정 R²"], 3)}`), "c2"), tile("F", fmt(ms["F"], 1), fp(ms["p(F)"]), pTone(ms["p(F)"]))); }
  const pred = co.filter((r) => !/상수|절편|intercept/i.test(String(r["항"])));
  return { ms, co, an, outcome, dfres, tc, pred, charts, tiles };
}

X.M09 = (R) => {
  const b = regressionBase(R); if (!b.co.length) return null;
  const sl = b.pred[0], icp = b.co.find((r) => /상수|절편/.test(r["항"]));
  if (sl) b.tiles.unshift(tile(t3(`기울기 (${L(sl["항"])})`, `Slope (${L(sl["항"])})`, `斜率(${L(sl["항"])})`), fmt(sl["B"], 3), `95% CI ${fmt(sl["CI 하"], 2)} ~ ${fmt(sl["CI 상"], 2)}`, pTone(sl["p"])));
  if (icp && sl) b.charts.push(card("eq", t3("회귀식", "Regression equation", "回归方程"), t3(`${b.outcome} = ${fmt(icp["B"], 2)} + ${fmt(sl["B"], 3)} × ${L(sl["항"])}`, `${b.outcome} = ${fmt(icp["B"], 2)} + ${fmt(sl["B"], 3)} × ${L(sl["항"])}`, `${b.outcome} = ${fmt(icp["B"], 2)} + ${fmt(sl["B"], 3)} × ${L(sl["항"])}`), t3("기울기는 예측변수가 1 늘 때 결과변수가 평균적으로 얼마나 변하는지, 절편은 예측변수가 0일 때의 예측값입니다.", "The slope is the average change in the outcome per unit of the predictor; the intercept is the prediction at predictor = 0.", "斜率为预测变量每增加 1 个单位结果变量的平均变化;截距为预测变量为 0 时的预测值。"),
    <Forest rows={b.co.map((r, i) => ({ label: L(r["항"]), est: r["B"], lo: r["CI 하"], hi: r["CI 상"], color: i === 0 ? "var(--dv-mute)" : C(0), note: `${fp(r["p"])}${star(r["p"])}` }))} ref0={0} vfmt={(v) => fmt(v, 3)} />, dtab([t3("항", "Term", "项"), "B", "SE", "t", "p", "lo", "hi"], b.co.map((r) => [L(r["항"]), r["B"], r["SE"], r["t"], r["p"], r["CI 하"], r["CI 상"]]))));
  const ss = b.an; if (ss.length >= 2) b.charts.push(card("ss", t3("변동의 분해 — 회귀 vs 잔차", "Variance decomposition — regression vs residual", "变异分解 — 回归 vs 残差"), t3(`모형이 ${fmt(b.ms["R²"] * 100, 1)}%를 설명합니다.`, `The model explains ${fmt(b.ms["R²"] * 100, 1)}%.`, `模型解释 ${fmt(b.ms["R²"] * 100, 1)}%。`), t3("전체 변동 중 회귀(색 진한 쪽)가 차지하는 비율이 R²입니다.", "R² is the share of total variation captured by the regression (dark part).", "R² 为回归(深色部分)占总变异的比例。"),
    <Stack100 rows={[{ label: "SS", parts: [{ name: t3("회귀", "Regression", "回归"), value: ss.find((r) => /회귀/.test(r["원천"]))?.["SS"] }, { name: t3("잔차", "Residual", "残差"), value: ss.find((r) => /잔차/.test(r["원천"]))?.["SS"] }] }]} showN={false} />, null));
  b.charts.push(card("arc", "R²", t3("모형의 설명력", "Explanatory power", "模型解释力"), t3("반원이 찬 만큼이 R²입니다(0~1).", "The filled arc is R² (0–1).", "弧线填充比例为 R²(0–1)。"), <ArcR2 v={b.ms["R²"]} adj={b.ms["수정 R²"]} />, null));
  const a = asmCard(R); if (a) b.charts.push(a);
  return { tiles: b.tiles, charts: b.charts };
};

function ArcR2({ v, adj }) {
  return <Bullets items={[{ label: "R²", value: v, min: 0, max: 1, bands: [{ to: 0.02, color: "var(--dv-mute)", label: "<.02" }, { to: 0.13, color: "var(--dv-c6)", label: t3("작음", "small", "小") }, { to: 0.26, color: "var(--dv-c1)", label: t3("보통", "medium", "中") }, { to: 1, color: "var(--dv-c2)", label: t3("큼", "large", "大") }], note: t3("코헨 기준", "Cohen's bands", "Cohen 标准") }, { label: t3("수정 R²", "Adj. R²", "调整 R²"), value: adj, min: 0, max: 1 }]} />;
}

X.M10 = (R) => {
  const b = regressionBase(R); if (!b.co.length) return null;
  const beta = b.pred.filter((r) => isNum(r["β"]));
  if (beta.length) b.charts.push(card("beta", t3("어느 예측변수의 영향이 큰가 — 표준화 계수 β", "Which predictor matters most — standardised β", "哪个预测变量影响最大 — 标准化系数 β"), t3(`가장 큰 영향: ${L([...beta].sort((a, c) => Math.abs(c["β"]) - Math.abs(a["β"]))[0]["항"])}`, `Largest: ${L([...beta].sort((a, c) => Math.abs(c["β"]) - Math.abs(a["β"]))[0]["항"])}`, `影响最大:${L([...beta].sort((a, c) => Math.abs(c["β"]) - Math.abs(a["β"]))[0]["항"])}`),
    t3("단위가 다른 변수도 견줄 수 있게 표준화한 계수입니다. 막대가 길수록 다른 변수를 통제하고도 결과에 더 큰 몫을 합니다.", "Standardised so different units are comparable. A longer bar = a larger unique contribution after controlling for the others.", "已标准化,可比较不同单位的变量。柱越长,控制其他变量后的独立贡献越大。"),
    <Bars items={[...beta].sort((a, c) => Math.abs(c["β"]) - Math.abs(a["β"])).map((r) => ({ label: L(r["항"]), value: r["β"], note: `${fp(r["유의확률"])}${star(r["유의확률"])}` }))} colorBySign fmtv={(v) => sgn(v, 3)} />, dtab([t3("항", "Term", "项"), "β", "p"], beta.map((r) => [L(r["항"]), r["β"], r["유의확률"]]))));
  b.charts.push(card("B", t3("비표준화 계수 B와 95% 구간 (원래 단위)", "Unstandardised B with 95% CI (original units)", "非标准化系数 B 及 95% 区间(原单位)"), t3("예측변수가 1 늘 때 결과변수가 변하는 양입니다.", "Change in the outcome per one-unit change in the predictor.", "预测变量每增加 1 个单位,结果变量的变化量。"), t3("구간이 점선(0)을 가로지르지 않으면 그 변수의 효과가 분명합니다.", "If the interval does not cross the dashed zero line the effect is clear.", "区间不跨虚线(0)则该变量效应明确。"),
    <Forest rows={b.co.map((r, i) => ({ label: L(r["항"]), est: r["B"], lo: r["B"] - b.tc * r["표준오차"], hi: r["B"] + b.tc * r["표준오차"], color: i === 0 ? "var(--dv-mute)" : C(0), note: `${fp(r["유의확률"])}${star(r["유의확률"])}` }))} ref0={0} vfmt={(v) => fmt(v, 3)} />, dtab([t3("항", "Term", "项"), "B", "SE", "p"], b.co.map((r) => [L(r["항"]), r["B"], r["표준오차"], r["유의확률"]]))));
  if (b.an.length >= 2) b.charts.push(card("ss", t3("변동의 분해", "Variance decomposition", "变异分解"), null, t3("진한 쪽이 모형이 설명한 몫(R²)입니다.", "The dark part is what the model explains (R²).", "深色部分为模型解释的比例(R²)。"), <Stack100 rows={[{ label: "SS", parts: [{ name: t3("회귀", "Regression", "回归"), value: b.an.find((r) => /회귀/.test(r["원천"]))?.["SS"] }, { name: t3("잔차", "Residual", "残差"), value: b.an.find((r) => /잔차/.test(r["원천"]))?.["SS"] }] }]} showN={false} />, null));
  b.charts.push(card("arc", "R²", null, null, <ArcR2 v={b.ms["R²"]} adj={b.ms["수정 R²"]} />, null));
  const a = asmCard(R); if (a) b.charts.push(a);
  return { tiles: b.tiles, charts: b.charts };
};

X.M11 = (R) => {
  const st = objs(tb(R, /단계별 R²/)), co = objs(tb(R, /^계수/)); if (!st.length) return null;
  const last = st[st.length - 1];
  const tiles = [tile(t3("최종 R²", "Final R²", "最终 R²"), fmt(last["R²"], 3), t3(`${st.length}단계`, `${st.length} steps`, `${st.length} 步`), "c2"), tile(t3("마지막 단계 ΔR²", "Last-step ΔR²", "末步 ΔR²"), sgn(last["ΔR²"], 3), `${fp(last["p"])} · f²=${fmt(last["Cohen f²"], 2)}`, pTone(last["p"]))];
  const charts = [];
  charts.push(card("wf", t3("단계마다 설명력은 얼마나 늘었나 — ΔR² 폭포", "How much each step adds — ΔR² waterfall", "每一步增加多少解释力 — ΔR² 瀑布图"), t3(`${st.map((r) => `${r["단계"]}단계 +${fmt(r["ΔR²"], 3)}`).join(" · ")}`, `${st.map((r) => `step ${r["단계"]} +${fmt(r["ΔR²"], 3)}`).join(" · ")}`, `${st.map((r) => `第 ${r["단계"]} 步 +${fmt(r["ΔR²"], 3)}`).join(" · ")}`),
    t3("막대 하나가 한 단계에서 새로 더해진 설명량입니다. 위쪽 글자의 p는 그 증가가 우연이 아닌지의 검정입니다.", "Each bar is the explained variance added at that step; p above is the test that the increase is not chance.", "每个柱为该步新增的解释量;上方 p 为该增加是否为偶然的检验。"),
    <Waterfall steps={st.map((r) => ({ label: `${r["단계"]}. ${L(r["추가된 변수"])}`, delta: r["ΔR²"], note: fp(r["p"]), color: r["p"] < 0.05 ? undefined : "var(--dv-mute)" }))} yLabel="R²" />, dtab([t3("단계", "Step", "步"), t3("변수", "Added", "变量"), "R²", "ΔR²", "ΔF", "p", "f²"], st.map((r) => [r["단계"], L(r["추가된 변수"]), r["R²"], r["ΔR²"], r["ΔF"], r["p"], r["Cohen f²"]]))));
  charts.push(card("f2", t3("단계별 효과크기 f²", "Step effect size f²", "各步效应量 f²"), t3("0.02 작음 · 0.15 보통 · 0.35 큼", "0.02 small · 0.15 medium · 0.35 large", "0.02 小 · 0.15 中 · 0.35 大"), null,
    <Bars items={st.map((r) => ({ label: `${r["단계"]}. ${clip(L(r["추가된 변수"]), 14)}`, value: r["Cohen f²"] }))} marks={[{ value: 0.02, label: ".02" }, { value: 0.15, label: ".15" }, { value: 0.35, label: ".35" }]} fmtv={(v) => fmt(v, 3)} />, null));
  const beta = co.filter((r) => isNum(r["β"]));
  if (beta.length) charts.push(card("beta", t3("최종 모형의 표준화 계수 β", "Standardised β in the final model", "最终模型的标准化系数 β"), null, null, <Bars items={beta.map((r) => ({ label: L(r["항"]), value: r["β"], note: `${fp(r["유의확률"])}${star(r["유의확률"])}` }))} colorBySign fmtv={(v) => sgn(v, 3)} />, null));
  return { tiles, charts };
};

X.M12 = (R) => {
  const co = objs(tb(R, /^계수/)), ss = objs(tb(R, /단순기울기/)); if (!co.length) return null;
  const it = co.find((r) => /×/.test(r["항"])), x = roleVars(R, "predictor")[0] || t3("독립변수", "predictor", "自变量"), m = roleVars(R, "moderator")[0] || t3("조절변수", "moderator", "调节变量");
  const tiles = [it && tile(t3("상호작용 B", "Interaction B", "交互作用 B"), fmt(it["B"], 3), `${fp(it["유의확률"])}`, pTone(it["유의확률"])), ss.length && tile(t3("단순 기울기 범위", "Simple-slope range", "简单斜率范围"), `${fmt(ss[0]["기울기"], 2)} → ${fmt(ss[ss.length - 1]["기울기"], 2)}`, t3(`${m} 낮음 → 높음`, `${m} low → high`, `${m} 低 → 高`))].filter(Boolean);
  const charts = [];
  if (ss.length) charts.push(card("slopes", t3(`${m} 수준에 따라 ${x}의 효과가 달라지는가`, `Does the effect of ${x} change with ${m}?`, `${x} 的效应随 ${m} 水平变化吗?`), t3(`기울기 ${fmt(ss[0]["기울기"], 2)} → ${fmt(ss[ss.length - 1]["기울기"], 2)}: 조절변수가 높을수록 효과가 ${ss[ss.length - 1]["기울기"] > ss[0]["기울기"] ? "커집니다" : "작아집니다"}.`, `Slope ${fmt(ss[0]["기울기"], 2)} → ${fmt(ss[ss.length - 1]["기울기"], 2)}: the effect ${ss[ss.length - 1]["기울기"] > ss[0]["기울기"] ? "grows" : "shrinks"} as the moderator rises.`, `斜率 ${fmt(ss[0]["기울기"], 2)} → ${fmt(ss[ss.length - 1]["기울기"], 2)}:调节变量越高效应${ss[ss.length - 1]["기울기"] > ss[0]["기울기"] ? "越大" : "越小"}。`),
    t3("조절변수를 낮음(−1SD)·평균·높음(+1SD)으로 놓았을 때 독립변수의 기울기입니다. 띠는 ±1.96 SE 범위이고, 선이 평평하지 않으면 조절효과가 있다는 뜻입니다.", "Slope of the predictor at low (−1 SD), mean and high (+1 SD) moderator values. The band is ±1.96 SE; a non-flat line indicates moderation.", "调节变量取低(−1SD)、均值、高(+1SD)时自变量的斜率;色带为 ±1.96 SE,线不水平即存在调节效应。"),
    <Lines xCats={ss.map((r) => L(r["조절변수 수준"]))} series={[{ name: t3("기울기", "slope", "斜率"), color: C(0), points: ss.map((r, i) => ({ x: i, y: r["기울기"], lo: r["기울기"] - 1.96 * r["SE"], hi: r["기울기"] + 1.96 * r["SE"] })) }]} refY={0} yLabel={t3(`${x}의 기울기`, `slope of ${x}`, `${x} 的斜率`)} endLabels={false} />, dtab([t3("수준", "Level", "水平"), t3("기울기", "slope", "斜率"), "SE", "t", "p"], ss.map((r) => [L(r["조절변수 수준"]), r["기울기"], r["SE"], r["t"], r["p"]]))));
  charts.push(card("coef", t3("회귀계수 B와 95% 구간", "Coefficients B with 95% CI", "回归系数 B 及 95% 区间"), t3("상호작용 항(×)이 조절효과를 나타냅니다.", "The × term carries the moderation effect.", "× 项代表调节效应。"), null,
    <Forest rows={co.map((r, i) => ({ label: L(r["항"]), est: r["B"], lo: r["B"] - 1.96 * r["표준오차"], hi: r["B"] + 1.96 * r["표준오차"], color: /×/.test(r["항"]) ? C(1) : i === 0 ? "var(--dv-mute)" : C(0), bold: /×/.test(r["항"]), note: `${fp(r["유의확률"])}${star(r["유의확률"])}` }))} ref0={0} vfmt={(v) => fmt(v, 3)} />, dtab([t3("항", "Term", "项"), "B", "SE", "p"], co.map((r) => [L(r["항"]), r["B"], r["표준오차"], r["유의확률"]]))));
  return { tiles, charts };
};

export default X;
