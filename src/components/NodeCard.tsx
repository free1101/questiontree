import { useState } from "react";
import { Copy, Check, Pencil, Save, X, Loader2, MessageCircleQuestion } from "lucide-react";
import type { TreeNode } from "../types";
import { updateNode } from "../lib/api";
import Markdown from "./Markdown";

interface Props {
  node: TreeNode;
  isRoot?: boolean;
  streaming?: boolean;
  onUpdated: (node: TreeNode) => void;
}

export default function NodeCard({ node, isRoot, streaming, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [draftQ, setDraftQ] = useState("");
  const [draftA, setDraftA] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const startEdit = () => {
    setDraftQ(node.question);
    setDraftA(node.answer);
    setEditing(true);
  };

  const save = async () => {
    if (!draftQ.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateNode(node.id, { question: draftQ.trim(), answer: draftA });
      onUpdated(updated as unknown as TreeNode);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(node.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 忽略剪贴板失败 */
    }
  };

  return (
    <div className="card overflow-hidden">
      {/* 问题头 */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <MessageCircleQuestion className="h-4 w-4" />
          </span>
          {editing ? (
            <input
              className="input-base py-1.5 text-sm"
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              autoFocus
            />
          ) : (
            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-snug text-ink">{node.question}</h2>
              {isRoot && (
                <span className="mt-1 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
                  根问题
                </span>
              )}
            </div>
          )}
        </div>
        {!editing && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              className="rounded-md p-1.5 text-ink-secondary transition-colors hover:bg-slate-100 hover:text-ink"
              title="复制回答"
              onClick={copy}
              disabled={!node.answer}
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <button
              className="rounded-md p-1.5 text-ink-secondary transition-colors hover:bg-slate-100 hover:text-ink"
              title="编辑问题与回答"
              onClick={startEdit}
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* 回答体 */}
      {editing ? (
        <div className="px-5 py-4">
          <label className="text-xs font-medium text-ink-secondary">回答内容</label>
          <textarea
            className="input-base mt-1.5 min-h-[200px] resize-y font-mono text-[13px]"
            value={draftA}
            onChange={(e) => setDraftA(e.target.value)}
          />
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
          <div className="mt-3 flex justify-end gap-2">
            <button
              className="btn-ghost px-2.5 py-1.5 text-xs"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              <X className="h-3.5 w-3.5" />
              取消
            </button>
            <button className="btn-primary px-2.5 py-1.5 text-xs" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              保存
            </button>
          </div>
        </div>
      ) : streaming ? (
        <div className="px-5 py-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {node.answer}
            <span className="ml-0.5 inline-block h-4 w-2 animate-blink-caret rounded-sm bg-primary align-text-bottom" />
          </p>
        </div>
      ) : node.answer ? (
        <div className="px-5 py-4">
          <Markdown content={node.answer} />
        </div>
      ) : (
        <div className="px-5 py-8 text-center text-sm text-ink-secondary">
          暂无回答内容
        </div>
      )}
    </div>
  );
}
