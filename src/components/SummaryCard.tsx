import { useState } from "react";
import { Pencil, RefreshCw, Save, X, Loader2, Lightbulb } from "lucide-react";
import type { TreeNode } from "../types";
import { getTree, regenerateSummary, updateNode } from "../lib/api";
import { findNode } from "../lib/tree";
import Markdown from "./Markdown";

interface Props {
  node: TreeNode | null;
  onUpdated: (node: TreeNode) => void;
}

export default function SummaryCard({ node, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [notice, setNotice] = useState("");

  if (!node) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-5 text-sm text-ink-secondary">
        选择一个节点后，这里会展示该分支的核心思想摘要。
      </div>
    );
  }

  const startEdit = () => {
    setDraft(node.summary);
    setEditing(true);
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const updated = await updateNode(node.id, { summary: draft, summarySource: "manual" });
      onUpdated(updated as unknown as TreeNode);
      setEditing(false);
      setNotice("已保存为手动摘要");
      setTimeout(() => setNotice(""), 2000);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const regenerate = async () => {
    if (regenerating) return;
    setRegenerating(true);
    setNotice("正在生成摘要…");
    try {
      await regenerateSummary(node.id, true);
      // 后端异步生成，轮询刷新节点摘要
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        try {
          const tree = await getTree(node.treeId);
          const fresh = findNode(tree.nodes, node.id);
          if (fresh && fresh.summary && fresh.summary !== node.summary) {
            onUpdated(fresh);
            setNotice("摘要已更新");
            setTimeout(() => setNotice(""), 2000);
            return;
          }
        } catch {
          /* 忽略单次轮询错误 */
        }
      }
      setNotice("生成超时，请稍后重试");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "生成失败");
    } finally {
      setRegenerating(false);
    }
  };

  const sourceLabel =
    node.summarySource === "manual" ? "手动编辑" : node.summarySource === "ai" ? "AI 生成" : "未生成";

  return (
    <div className="rounded-xl border-l-4 border-accent bg-white p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-accent">
            <Lightbulb className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-ink">本分支核心思想</span>
          {node.summarySource !== "none" && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600">
              {sourceLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!editing && node.summary && (
            <button
              className="rounded-md p-1.5 text-ink-secondary transition-colors hover:bg-slate-100 hover:text-ink"
              title="编辑摘要"
              onClick={startEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {!editing && (
            <button
              className="rounded-md p-1.5 text-ink-secondary transition-colors hover:bg-slate-100 hover:text-primary disabled:opacity-50"
              title="重新生成摘要"
              onClick={regenerate}
              disabled={regenerating}
            >
              {regenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {notice && <p className="mt-2 text-xs text-ink-secondary">{notice}</p>}

      {editing ? (
        <div className="mt-3">
          <textarea
            className="input-base min-h-[120px] resize-y"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="输入该分支的核心思想要点…"
            autoFocus
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              className="btn-ghost px-2 py-1 text-xs"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              <X className="h-3.5 w-3.5" />
              取消
            </button>
            <button className="btn-primary px-2 py-1 text-xs" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              保存
            </button>
          </div>
        </div>
      ) : node.summary ? (
        <div className="mt-3 max-h-64 overflow-y-auto pr-1">
          <Markdown content={node.summary} />
        </div>
      ) : regenerating ? (
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-4/6 animate-pulse rounded bg-slate-100" />
        </div>
      ) : (
        <p className="mt-3 text-xs text-ink-secondary">
          回答完成后 AI 会自动汇总该分支的核心思想；也可点击右上角手动生成。
        </p>
      )}
    </div>
  );
}
