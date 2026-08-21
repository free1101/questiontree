import "dotenv/config";

const DEFAULT_TIMEOUT = 60000;

/** 从请求头（用户自填）或服务端环境变量解析 LLM 配置 */
export function resolveConfig(req) {
  const h = req?.headers || {};
  return {
    apiKey: h["x-ark-api-key"] || process.env.ARK_API_KEY || "",
    model: h["x-ark-model"] || process.env.ARK_MODEL || "deepseek-v4-flash",
    baseUrl:
      h["x-ark-base-url"] ||
      process.env.ARK_BASE_URL ||
      "https://ark.cn-beijing.volces.com/api/plan/v3",
  };
}

export class LlmError extends Error {
  constructor(message, { status = 400, code = "" } = {}) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** 将 Ark 返回的错误映射为明确的中文提示 */
function mapArkError(status, body) {
  const code = body?.error?.code || "";
  const msg = body?.error?.message || "";
  if (status === 401) {
    return new LlmError("API Key 无效或未授权，请在设置页检查 Key", { status: 401, code });
  }
  if (status === 403) {
    return new LlmError("当前 Key 无权访问该模型（可能未开通或未绑定套餐）", { status: 403, code });
  }
  if (status === 429) {
    return new LlmError("请求过于频繁（触发限流），请稍后再试", { status: 429, code });
  }
  if (status === 404 || /model/i.test(msg)) {
    return new LlmError(`模型不存在或不可用：${msg || "请检查模型 ID"}`, { status: 404, code });
  }
  return new LlmError(`大模型服务错误（${status}）：${msg || "未知错误"}`, { status, code });
}

/** 统一请求 Ark chat/completions（流式/非流式） */
async function requestArk({ messages, config, stream = false, temperature = 0.7, maxTokens }) {
  if (!config.apiKey) {
    throw new LlmError(
      "未配置 API Key：请在服务端 .env 设置 ARK_API_KEY，或在「设置」页填写自己的 Key",
      { status: 401 }
    );
  }
  const url = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream,
        temperature,
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
      }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      let body = {};
      try {
        body = await resp.json();
      } catch {
        /* 忽略解析失败 */
      }
      throw mapArkError(resp.status, body);
    }
    return resp;
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new LlmError("请求超时（60s），请重试或更换模型", { status: 504 });
    }
    if (err instanceof LlmError) throw err;
    throw new LlmError(`无法连接大模型服务：${err?.message || "网络错误"}`, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}

/** 非流式完整调用（用于摘要生成、连接测试） */
export async function chatComplete(messages, { config, temperature = 0.3, maxTokens } = {}) {
  const resp = await requestArk({ messages, config, stream: false, temperature, maxTokens });
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : "";
}

/** 流式调用：yield { text } 内容片段 */
export async function* streamChat(messages, { config, temperature = 0.7 } = {}) {
  const resp = await requestArk({ messages, config, stream: true, temperature });
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield { text: delta };
      } catch {
        /* 跳过无法解析的帧 */
      }
    }
  }
}

/** 测试连接：让模型回复极短内容验证 Key/模型可用 */
export async function testConnection(config) {
  const text = await chatComplete(
    [{ role: "user", content: "请只回复两个字：正常" }],
    { config, maxTokens: 16 }
  );
  return text;
}
