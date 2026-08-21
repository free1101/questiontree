import type {
  Settings,
  TestConnectionResult,
  Tree,
  TreeDetail,
  TreeNode,
  TreeNodeFlat,
} from "../types";

const SETTINGS_KEY = "qt-settings";

export function getSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { useServerKey: true, apiKey: "", model: "", baseUrl: "", ...JSON.parse(raw) };
  } catch {
    /* 忽略损坏数据 */
  }
  return { useServerKey: true, apiKey: "", model: "", baseUrl: "" };
}

export function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const resp = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!resp.ok) {
    let msg = `请求失败（${resp.status}）`;
    try {
      const data = await resp.json();
      if (data?.error) msg = data.error;
    } catch {
      /* 忽略 */
    }
    throw new Error(msg);
  }
  return resp.json() as Promise<T>;
}

// ---- 知识树 ----
export const getTrees = () => request<Tree[]>("/trees");
export const getTree = (id: number) => request<TreeDetail>(`/trees/${id}`);
export const createTree = (title: string, description = "") =>
  request<Tree>("/trees", { method: "POST", body: JSON.stringify({ title, description }) });
export const deleteTree = (id: number) =>
  request<{ ok: boolean }>(`/trees/${id}`, { method: "DELETE" });

// ---- 节点 ----
export const createRootNode = (treeId: number, question: string) =>
  request<TreeNodeFlat>(`/trees/${treeId}/roots`, {
    method: "POST",
    body: JSON.stringify({ question }),
  });
export const createChildNode = (parentId: number, question: string) =>
  request<TreeNodeFlat>(`/nodes/${parentId}/children`, {
    method: "POST",
    body: JSON.stringify({ question }),
  });
export const updateNode = (id: number, fields: Partial<Pick<TreeNode, "question" | "answer" | "summary" | "summarySource">>) =>
  request<TreeNodeFlat>(`/nodes/${id}`, { method: "PUT", body: JSON.stringify(fields) });
export const deleteNode = (id: number) =>
  request<{ ok: boolean }>(`/nodes/${id}`, { method: "DELETE" });
export const regenerateSummary = (id: number, force = false) =>
  request<{ ok: boolean }>(`/nodes/${id}/summary`, {
    method: "POST",
    body: JSON.stringify({ force }),
  });

// ---- 设置 / 连接测试 ----
export async function testConnection(): Promise<TestConnectionResult> {
  const s = getSettings();
  try {
    const resp = await fetch("/api/chat/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(s.useServerKey ? {} : {
          ...(s.apiKey ? { "x-ark-api-key": s.apiKey } : {}),
          ...(s.model ? { "x-ark-model": s.model } : {}),
          ...(s.baseUrl ? { "x-ark-base-url": s.baseUrl } : {}),
        }),
      },
    });
    const data = await resp.json();
    if (!resp.ok) return { ok: false, message: data?.error || `连接失败（${resp.status}）` };
    return { ok: true, message: "连接成功", model: data.model };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "网络错误" };
  }
}

// ---- SSE 流式问答 ----
export interface ChatStreamHandlers {
  onDelta: (text: string) => void;
  onError: (message: string) => void;
  onDone: (node: TreeNodeFlat) => void;
}

export async function chatStream(
  payload: { question: string; nodeId?: number; treeId?: number },
  handlers: ChatStreamHandlers
) {
  const s = getSettings();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!s.useServerKey) {
    if (s.apiKey) headers["x-ark-api-key"] = s.apiKey;
    if (s.model) headers["x-ark-model"] = s.model;
    if (s.baseUrl) headers["x-ark-base-url"] = s.baseUrl;
  }

  let resp: Response;
  try {
    resp = await fetch("/api/chat", { method: "POST", headers, body: JSON.stringify(payload) });
  } catch (err) {
    handlers.onError(err instanceof Error ? err.message : "无法连接服务器");
    return;
  }
  if (!resp.ok) {
    let msg = `请求失败（${resp.status}）`;
    try {
      const d = await resp.json();
      if (d?.error) msg = d.error;
    } catch {
      /* 忽略 */
    }
    handlers.onError(msg);
    return;
  }

  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      for (const line of raw.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const str = line.slice(5).trim();
        if (!str) continue;
        try {
          const msg = JSON.parse(str);
          if (msg.type === "delta") handlers.onDelta(msg.text as string);
          else if (msg.type === "error") handlers.onError(msg.error as string);
          else if (msg.type === "done") handlers.onDone(msg.node as TreeNodeFlat);
        } catch {
          /* 跳过无法解析的帧 */
        }
      }
    }
  }
}
