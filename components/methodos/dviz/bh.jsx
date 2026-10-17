/* 빌더 공통 도우미 — 결과 객체에서 표·열을 집고, 흔한 카드(검정 분포·효과크기·조건 점검)를 만든다. */
import { localizeEngineText } from "./locale-ko.js";
import { getLocale } from "./locale-ko.js";
import { Bars, Bullets, Dist, Forest } from "./charts1.jsx";
import { BAD, C, DCard, MUTE, OK, WARN, cdfT, clip, fmt, fp, isNum, pdfNorm, qT, seFromCI, sgn, star, t3, tw } from "./core.jsx";

export const L = (s) => localizeEngineText(String(s ?? ""), getLocale());
export const tb = (R, re) => (R.tables || []).find((t) => re.test(String(t.title)));
export const tbs = (R, re) => (R.tables || []).filter((t) => re.test(String(t.title)));
/** 표 → 열 이름이 키인 행 객체들 */
export const objs = (t) => (t ? t.rows.map((r) => Object.fromEntries(t.columns.map((c, j) => [c.name, r[j]]))) : []);
export const col = (t, name) => { const j = t ? t.columns.findIndex((c) => (name instanceof RegExp ? name.test(c.name) : c.name === name)) : -1; return j < 0 ? [] : t.rows.map((r) => r[j]); };
export const has = (t, name) => !!t && t.columns.some((c) => (name instanceof RegExp ? name.test(c.name) : c.name === name));
/** 「항·값」 표 → {항: 값} */
export const kv = (t) => (t ? Object.fromEntries(t.rows.map((r) => [String(r[0]), r[1]])) : {});
export const eff = (R, re) => (R.effect_sizes || []).find((e) => re.test(String(e.name)));
export const roleVars = (R, role) => (R.variables_used || []).filter((v) => (Array.isArray(role) ? role.includes(v.role) : v.role === role)).map((v) => v.name);
export const num = (v) => (isNum(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : NaN);
export const dtab = (columns, rows) => ({ columns, rows });
export const pOf = (x) => (isNum(x) ? x : NaN);

/** 카드 한 장 서술자 */
export const card = (key, title, take, guide, node, data, extra = {}) => ({ key, title, take, guide, node, data, ...extra });

// ─────────── 효과크기 눈금(코헨의 관례) ───────────
const EFF_SCALES = [
  { re: /(코헨 d|헤지스 g|cohen|hedges|d\()/i, cuts: [0.2, 0.5, 0.8], max: 1.4, key: "d" },
  { re: /(부분 η²|partial|η²|ω²|eta)/i, cuts: [0.01, 0.06, 0.14], max: 0.3, key: "eta" },
  { re: /(f²)/i, cuts: [0.02, 0.15, 0.35], max: 0.7, key: "f2" },
  { re: /(크레이머|φ|파이|cramer|상관 r|순위양분상관|^r$|rank)/i, cuts: [0.1, 0.3, 0.5], max: 0.8, key: "r" },
];
export const effScale = (name) => EFF_SCALES.find((s) => s.re.test(String(name)));
export function effItem(e, labelOverride) {
  const sc = effScale(e.name); if (!sc || !isNum(e.value)) return null;
  const v = Math.abs(e.value), [a, b, c] = sc.cuts, mx = Math.max(sc.max, v * 1.15);
  return { label: labelOverride || L(e.name), value: v, min: 0, max: mx, fmt: () => sgn(e.value, 3),
    bands: [{ to: a, color: MUTE, label: t3("작음 미만", "negligible", "可忽略") }, { to: b, color: "var(--dv-c6)", label: t3("작음", "small", "小") }, { to: c, color: "var(--dv-c1)", label: t3("보통", "medium", "中") }, { to: mx, color: "var(--dv-c2)", label: t3("큼", "large", "大") }],
    note: e.interpretation_band ? L(String(e.interpretation_band)) : "" };
}
export function effCard(R, key = "eff", re = /./) {
  const items = (R.effect_sizes || []).filter((e) => re.test(String(e.name))).map((e) => effItem(e)).filter(Boolean);
  if (!items.length) return null;
  return card(key, t3("효과크기 — 얼마나 큰 차이·관계인가", "Effect size — how large is it?", "效应量 — 差异/关系有多大"),
    t3("바늘이 가리키는 위치가 코헨의 관례 눈금에서 어디인지 봅니다(부호는 방향일 뿐, 크기는 절대값).", "Where the marker falls on Cohen's conventional bands (sign = direction; size uses the absolute value).", "标记在 Cohen 惯例区间中的位置(符号仅表示方向,大小取绝对值)。"),
    t3("회색 띠는 ‘작음 미만’, 파랑은 작음, 초록은 보통, 주황은 큼입니다. p 값은 우연이 아님을, 효과크기는 얼마나 큰지를 알려 주므로 둘을 함께 읽습니다.", "Grey = below small, blue = small, green = medium, orange = large. p tells whether it is chance; the effect size tells how large.", "灰色低于小效应,蓝色小,绿色中,橙色大。p 值说明是否偶然,效应量说明有多大,应一起阅读。"),
    <Bullets items={items} />, dtab([t3("지표", "Measure", "指标"), t3("값", "Value", "值")], (R.effect_sizes || []).filter((e) => isNum(e.value)).map((e) => [L(e.name), e.value])));
}

/** 검정통계량 분포 카드 */
export function distCard(key, kind, stat, df1, df2, p, tails, title, take) {
  if (!isNum(stat) || !isNum(df1) || (kind === "F" && !isNum(df2))) return null;
  return card(key, title || t3("검정 분포에서 내 값의 위치", "Where the statistic falls in its null distribution", "统计量在零分布中的位置"),
    take || t3("귀무가설이 맞다고 할 때 통계량이 따르는 분포입니다. 주황색 꼬리 넓이가 p 값입니다.", "The distribution of the statistic if the null were true; the orange tail area is the p-value.", "零假设成立时统计量的分布;橙色尾部面积即 p 值。"),
    t3("곡선은 ‘차이가 없다’고 가정했을 때 이 통계량이 나올 수 있는 값들의 분포입니다. 점선은 α=.05 기각값이며, 내 값(주황 선)이 점선보다 바깥에 있고 꼬리가 좁을수록 우연으로 보기 어렵습니다.", "The curve shows the values the statistic could take if there were no effect. Dashed = α=.05 critical value; the farther outside the dashed line your value (orange) lies, the less likely it is chance.", "曲线表示无效应时该统计量可能取的值;虚线为 α=.05 临界值,橙色线越在虚线外侧,越不可能是偶然。"),
    <Dist kind={kind} df1={df1} df2={df2} stat={stat} p={p} tails={tails} />,
    dtab([t3("항목", "Item", "项目"), t3("값", "Value", "值")], [["stat", stat], ["df1", df1], ["df2", df2 ?? ""], ["p", p]]));
}

/** 조건 점검 알약 */
export function Pills({ items }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {items.map((a, i) => {
        const c = a.signal === "green" ? OK : a.signal === "red" ? BAD : WARN;
        return (
          <div key={i} title={a.rationale} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: `1.5px solid ${c}`, background: "var(--dv-card2)", fontSize: 12.5 }}>
            <i style={{ width: 10, height: 10, borderRadius: 99, background: c, display: "inline-block" }} />
            <b>{a.title}</b>
            {isNum(a.p) && <span style={{ color: "var(--dv-mute)" }}>{fp(a.p)}</span>}
          </div>
        );
      })}
    </div>
  );
}
export function asmCard(R) {
  const items = (R.assumption_results?.items || []).filter((a) => a.signal).map((a) => ({ title: L(a.title), signal: a.signal, p: a.p_value, rationale: L(a.rationale) }));
  if (!items.length) return null;
  const bad = items.filter((a) => a.signal !== "green").length;
  return card("asm", t3("전제 조건 신호등", "Assumption checks", "前提条件信号灯"),
    bad ? t3(`${bad}개 조건에 주의 표시가 있습니다 — 아래 설명을 확인하세요.`, `${bad} check(s) need attention — see the notes.`, `${bad} 项条件需注意 — 请看说明。`) : t3("모든 전제 조건이 양호합니다.", "All assumption checks look fine.", "所有前提条件良好。"),
    t3("초록은 이 검정을 그대로 써도 된다는 뜻, 노랑·빨강은 결과를 조심해서 읽거나 다른 방법을 함께 보라는 뜻입니다. 알약에 마우스를 올리면 이유가 나옵니다.", "Green = fine to proceed; yellow/red = read with care or consider an alternative. Hover for the reason.", "绿色表示可直接使用;黄/红表示需谨慎解读或考虑替代方法。悬停可见原因。"),
    <Pills items={items} />, dtab([t3("조건", "Check", "条件"), t3("신호", "Signal", "信号"), "p"], items.map((a) => [a.title, a.signal, a.p ?? ""])));
}

/** 95% 구간 포레스트(결과 객체의 confidence_intervals) */
export function ciForest(R, key = "ci", opt = {}) {
  const rs = (R.confidence_intervals || []).filter((c) => isNum(c.estimate) && isNum(c.low) && isNum(c.high) && (!opt.re || opt.re.test(String(c.parameter))));
  if (!rs.length) return null;
  return card(key, opt.title || t3("추정값과 95% 신뢰구간", "Estimates with 95% confidence intervals", "估计值及 95% 置信区间"),
    opt.take || t3("점은 추정값, 가로선은 신뢰구간입니다. 점선(0)을 가로지르면 0과 구별되지 않습니다.", "Dot = estimate, line = confidence interval. Crossing the dashed zero line means it cannot be told apart from 0.", "圆点为估计值,横线为置信区间;跨过虚线(0)表示与 0 无法区分。"),
    t3("구간이 좁을수록 추정이 정밀합니다. 구간 전체가 점선의 한쪽에 있으면 방향이 분명한 효과입니다.", "A narrower interval means a more precise estimate. If the whole interval is on one side of the dashed line, the direction is clear.", "区间越窄,估计越精确;若整个区间位于虚线一侧,则方向明确。"),
    <Forest rows={rs.map((c, i) => ({ label: L(c.parameter), est: c.estimate, lo: c.low, hi: c.high, group: i % 3 === 0 ? 0 : i % 3 }))} ref0={opt.ref ?? 0} log={!!opt.log} />,
    dtab([t3("모수", "Parameter", "参数"), t3("추정", "Estimate", "估计"), "lo", "hi"], rs.map((c) => [L(c.parameter), c.estimate, c.low, c.high])));
}

/** t 임계값(자유도가 없으면 정규) */
export const tcrit = (df) => (isNum(df) && df > 0 ? qT(0.975, df) : 1.96);
export const tile = (k, v, sub, tone) => ({ k, v, sub, tone });
export const pTone = (p) => (!isNum(p) ? undefined : p < 0.05 ? "good" : undefined);
export { Bars, Bullets, Dist, Forest, C, DCard, MUTE, OK, WARN, BAD, fmt, fp, isNum, sgn, star, t3, tw, cdfT, clip, pdfNorm, qT, seFromCI };
