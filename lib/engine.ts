// 단계 실행기 (원칙2: 3모드) + 다중 AI 공급자 — engine.js TS 이식.
import type { Method, Stage } from "@/lib/types";

export interface Provider {
  id: string; name: string; free: boolean; type: "openai" | "gemini" | "anthropic" | "cohere" | "ollama";
  base?: string; keyUrl: string; console: string; models: [string, string, boolean][];
}
export const PROVIDERS: Provider[] = [
  { id: "google", name: "Google", free: true, type: "gemini", keyUrl: "https://aistudio.google.com/app/apikey", console: "Google AI Studio", models: [["gemini-2.5-flash", "Gemini 2.5 Flash", true], ["gemini-2.5-pro", "Gemini 2.5 Pro", false], ["gemini-2.0-flash", "Gemini 2.0 Flash", true]] },
  { id: "groq", name: "Groq", free: true, type: "openai", base: "https://api.groq.com/openai/v1", keyUrl: "https://console.groq.com/keys", console: "Groq Console", models: [["llama-3.3-70b-versatile", "Llama 3.3 70B", true], ["llama-3.1-8b-instant", "Llama 3.1 8B", true]] },
  { id: "mistral", name: "Mistral AI", free: false, type: "openai", base: "https://api.mistral.ai/v1", keyUrl: "https://console.mistral.ai/api-keys", console: "Mistral Console", models: [["mistral-large-latest", "Mistral Large", false], ["open-mistral-nemo", "Mistral Nemo", true]] },
  { id: "huggingface", name: "Hugging Face", free: true, type: "openai", base: "https://router.huggingface.co/v1", keyUrl: "https://huggingface.co/settings/tokens", console: "Hugging Face", models: [["meta-llama/Llama-3.1-8B-Instruct", "Llama 3.1 8B", true]] },
  { id: "openrouter", name: "OpenRouter", free: true, type: "openai", base: "https://openrouter.ai/api/v1", keyUrl: "https://openrouter.ai/keys", console: "OpenRouter", models: [["deepseek/deepseek-chat", "DeepSeek Chat", true], ["google/gemini-flash-1.5", "Gemini Flash", true]] },
  { id: "github", name: "GitHub", free: true, type: "openai", base: "https://models.inference.ai.azure.com", keyUrl: "https://github.com/settings/tokens", console: "GitHub Models", models: [["gpt-4o-mini", "GPT-4o mini", true], ["Phi-3.5-mini-instruct", "Phi-3.5 mini", true]] },
  { id: "cloudflare", name: "Cloudflare", free: true, type: "openai", base: "", keyUrl: "https://dash.cloudflare.com/profile/api-tokens", console: "Cloudflare Workers AI", models: [["@cf/meta/llama-3.1-8b-instruct", "Llama 3.1 8B", true]] },
  { id: "nvidia", name: "NVIDIA", free: true, type: "openai", base: "https://integrate.api.nvidia.com/v1", keyUrl: "https://build.nvidia.com/", console: "NVIDIA Build", models: [["meta/llama-3.1-8b-instruct", "Llama 3.1 8B", true]] },
  { id: "openai", name: "OpenAI", free: false, type: "openai", base: "https://api.openai.com/v1", keyUrl: "https://platform.openai.com/api-keys", console: "OpenAI Platform", models: [["gpt-4o-mini", "GPT-4o mini", false], ["gpt-4o", "GPT-4o", false]] },
  { id: "anthropic", name: "Anthropic", free: false, type: "anthropic", keyUrl: "https://console.anthropic.com/settings/keys", console: "Anthropic API", models: [["claude-sonnet-4-6", "Claude Sonnet 4.6", false], ["claude-haiku-4-5-20251001", "Claude Haiku 4.5", false]] },
  { id: "cohere", name: "Cohere", free: false, type: "cohere", keyUrl: "https://dashboard.cohere.com/api-keys", console: "Cohere", models: [["command-r-plus", "Command R+", false], ["command-r", "Command R", false]] },
  { id: "together", name: "Together AI", free: false, type: "openai", base: "https://api.together.xyz/v1", keyUrl: "https://api.together.ai/settings/api-keys", console: "Together AI", models: [["meta-llama/Llama-3.3-70B-Instruct-Turbo", "Llama 3.3 70B", false]] },
  { id: "deepseek", name: "DeepSeek", free: false, type: "openai", base: "https://api.deepseek.com", keyUrl: "https://platform.deepseek.com/api_keys", console: "DeepSeek Platform", models: [["deepseek-chat", "DeepSeek Chat", false], ["deepseek-reasoner", "DeepSeek Reasoner", false]] },
  { id: "ollama", name: "Ollama (로컬)", free: true, type: "ollama", keyUrl: "https://ollama.com/download", console: "Ollama (로컬 설치)", models: [["llama3.1", "Llama 3.1 (로컬)", true], ["qwen2.5", "Qwen 2.5 (로컬)", true]] },
];
export const provById = (id: string) => PROVIDERS.find((p) => p.id === id);

function buildPrompt(method: Method, stage: Stage, inputs: Record<string, any>) {
  const base = stage.modes?.ai?.raw?.prompt || `[${method.name} / ${stage.name}] 입력을 분석해 단계 산출물을 생성하라.`;
  const ctx = Object.entries(inputs || {}).map(([k, v]) => `- ${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`).join("\n");
  return `당신은 연구방법 "${method.name}"의 "${stage.name}" 단계를 수행하는 연구 자동화 엔진이다.\n목적: ${stage.explain?.why || stage.goal || ""}\n\n${base}\n\n[입력]\n${ctx || "(없음)"}\n\n출력: 산출물(${(stage.io?.outputs || []).join(", ") || "결과"})을 한국어로 간결히 생성하라.`;
}
function simulate(method: Method, stage: Stage, inputs: Record<string, any>) {
  const o: Record<string, any> = {};
  (stage.io?.outputs || ["result"]).forEach((k) => o[k] = { _simulated: true, summary: `${stage.name} 단계 산출물(시뮬레이션). 설정에서 AI 키를 지정하면 실제 추론으로 대체됩니다.`, derived_from: Object.keys(inputs || {}), guidance: stage.explain?.expert || stage.goal || "" });
  return o;
}
function ruleValidate(stage: Stage, inputs: Record<string, any>) {
  const items: any[] = [];
  (stage.io?.inputs || []).forEach((k) => items.push({ label: `입력 제공: ${k}`, ok: inputs?.[k] != null && String(inputs[k]).trim() !== "" }));
  const checklist = stage.modes?.rule?.raw?.checklist || [];
  checklist.forEach((c: string) => items.push({ label: c, ok: true, manual: true }));
  const hardFail = items.some((i) => !i.ok && !i.manual);
  return { status: hardFail ? "error" : checklist.length ? "warn" : "pass", items };
}

async function dispatch(p: Provider, opts: any): Promise<string> {
  const { prompt, model, apiKey, baseUrl } = opts;
  const maxTokens = Math.max(256, Number(opts.maxTokens) || 1200);
  if (p.type === "gemini") {
    const body: any = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    };
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error("gemini " + r.status + " " + (await r.text().catch(() => "")).slice(0, 200));
    const j = await r.json();
    const text = j.candidates?.[0]?.content?.parts?.map((x: any) => x.text).join("") || "";
    if (!text && j.promptFeedback) throw new Error("gemini blocked: " + JSON.stringify(j.promptFeedback).slice(0, 180));
    return text;
  }
  if (p.type === "anthropic") {
    const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }, body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }) });
    if (!r.ok) throw new Error("anthropic " + r.status + " " + (await r.text().catch(() => "")).slice(0, 200));
    const j = await r.json(); return (j.content || []).map((c: any) => c.text || "").join("");
  }
  if (p.type === "cohere") {
    const r = await fetch("https://api.cohere.com/v2/chat", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey }, body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] }) });
    if (!r.ok) throw new Error("cohere " + r.status);
    const j = await r.json(); return j.message?.content?.map((c: any) => c.text).join("") || "";
  }
  if (p.type === "ollama") {
    const r = await fetch((baseUrl || "http://localhost:11434") + "/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: model || "llama3.1", prompt, stream: false }) });
    if (!r.ok) throw new Error("ollama " + r.status);
    const j = await r.json(); return j.response || "";
  }
  const base = baseUrl || p.base;
  if (!base) throw new Error(p.id + ": base URL 없음");
  const r = await fetch(base.replace(/\/$/, "") + "/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey }, body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.3, max_tokens: maxTokens }) });
  if (!r.ok) throw new Error(p.id + " " + r.status + " " + (await r.text().catch(() => "")).slice(0, 200));
  const j = await r.json(); return j.choices?.[0]?.message?.content || "";
}

async function callAI(method: Method, stage: Stage, inputs: any, settings: any) {
  const provId = settings.provider || "google";
  const p = provById(provId) || provById("google")!;
  const apiKey = (settings.keys && settings.keys[provId]) || settings.apiKey || "";
  const model = settings.model || p.models[0]?.[0];
  try {
    if (p.type !== "ollama" && !apiKey) throw new Error("no-api-key");
    const text = await dispatch(p, { prompt: buildPrompt(method, stage, inputs), model, apiKey, baseUrl: settings.baseUrl });
    const out: Record<string, any> = {}; (stage.io?.outputs || ["result"]).forEach((k) => out[k] = { text, provider: p.name, model });
    return { outputs: out, simulated: false, log: `AI(${p.name} · ${model}) 호출 성공` };
  } catch (e: any) {
    return { outputs: simulate(method, stage, inputs), simulated: true, log: `AI 폴백(시뮬레이션) — ${p.name}: ${e.message}. 설정에서 키를 입력하면 실제 추론을 수행합니다.` };
  }
}

// 범용 AI 완성 — TX-002 자동화의 AI기반 기능(주제·범주·해석·보고서)용.
// 키가 없거나 실패하면 null을 돌려 호출부가 규칙기반으로 폴백한다.
// settings.preferErrorText=true 이면 null 대신 짧은 오류 문자열을 돌려 UI에 표시할 수 있다.
// settings.maxTokens 로 출력 길이 상한을 올린다(작업표 50행+ 등).
export async function aiComplete(prompt: string, settings: any = {}): Promise<string | null> {
  const provId = settings.provider || "google";
  const p = provById(provId) || provById("google")!;
  const apiKey = (settings.keys && settings.keys[provId]) || settings.apiKey || "";
  try {
    if (p.type !== "ollama" && !apiKey) {
      return settings.preferErrorText
        ? `AI API 키가 없습니다. 설정 → ${p.name} 키를 입력한 뒤 다시 요청하세요.`
        : null;
    }
    const model = settings.model || p.models[0]?.[0];
    const text = await dispatch(p, {
      prompt,
      model,
      apiKey,
      baseUrl: settings.baseUrl,
      maxTokens: settings.maxTokens,
    });
    if ((!text || !String(text).trim()) && settings.preferErrorText) {
      return `AI(${p.name} · ${model})가 빈 응답을 반환했습니다. 모델·프롬프트를 바꿔 다시 시도하세요.`;
    }
    return text;
  } catch (e: any) {
    if (settings.preferErrorText) {
      return `AI 호출 실패(${p.name}): ${e?.message || e}`;
    }
    return null;
  }
}

export async function runStage(method: Method, stage: Stage, mode: string, inputs: any, settings: any = {}) {
  let outputs: any = {}, validation: any, simulated = false, log = "";
  if (mode === "rule") {
    validation = ruleValidate(stage, inputs);
    const o: any = {}; (stage.io?.outputs || ["result"]).forEach((k) => o[k] = { _rule: true, inputs_echo: inputs, checklist: stage.modes?.rule?.raw?.checklist || [], note: "규칙기반 결정적 산출물" });
    outputs = o; log = "규칙기반(결정적) 실행 완료";
  } else if (mode === "ai") {
    const r = await callAI(method, stage, inputs, settings);
    outputs = r.outputs; simulated = r.simulated; log = r.log;
    validation = { status: "pass", items: [{ label: "출력 스키마 존재", ok: Object.keys(outputs).length > 0 }] };
  } else {
    const gate = ruleValidate(stage, inputs);
    if (gate.status === "error") { validation = gate; outputs = {}; log = "하이브리드 중단: 규칙 게이트 실패(필수 입력 누락)"; }
    else {
      const r = await callAI(method, stage, inputs, settings);
      outputs = r.outputs; simulated = r.simulated;
      validation = { status: Object.keys(outputs).length ? "pass" : "error", items: [...gate.items, { label: "AI 산출물 비어있지 않음", ok: Object.keys(outputs).length > 0 }] };
      log = `하이브리드: 규칙 게이트 통과 → ${r.log} → 규칙 사후검증`;
    }
  }
  return { mode, outputs, validation, simulated, log };
}
