import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  TreePine,
  Plus,
  Settings,
  Trash2,
  ArrowRight,
  Sparkles,
  X,
  Loader2,
  FileQuestion,
} from "lucide-react";
import { createTree, deleteTree, getTrees } from "../lib/api";
import type { Tree } from "../types";

function formatTime(ts: string) {
  if (!ts) return "";
  const d = new Date(ts.includes(" ") ? ts.replace(" ", "T") : ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HomePage() {
  const navigate = useNavigate();
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = async () => {
    try {
      const list = await getTrees();
      setTrees(list);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || creating) return;
    setCreating(true);
    try {
      const tree = await createTree(title, desc);
      setShowCreate(false);
      setTitle("");
      setDesc("");
      navigate(`/tree/${tree.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (deletingId != null) return;
    if (!confirm("确定删除这棵知识树吗？其下所有节点将一并删除，不可恢复。")) return;
    setDeletingId(id);
    try {
      await deleteTree(id);
      setTrees((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* 顶部导航 */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
              <TreePine className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold text-ink">知识树</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/settings" className="btn-ghost">
              <Settings className="h-4 w-4" />
              设置
            </Link>
            <button className="btn-primary" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              新建知识树
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-20">
        {/* 欢迎横幅 */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary-light to-info p-8 text-white shadow-lift">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white/10 blur-xl" />
          <div className="relative max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              树形对话学习
            </span>
            <h1 className="mt-4 text-2xl font-semibold leading-snug">
              从问题开始，让知识长成树
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/85">
              告别直线型聊天的混乱——每次追问都会在树上游走，AI
              自动为每个分支提炼核心思想，你永远知道自己学到哪里。
            </p>
          </div>
        </section>

        {/* 树列表 */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">我的知识树</h2>
            <span className="text-xs text-ink-secondary">{trees.length} 棵</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-ink-secondary">
              <Loader2 className="h-5 w-5 animate-spin" />
              加载中…
            </div>
          ) : error ? (
            <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
              {error}
            </div>
          ) : trees.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 py-20 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <FileQuestion className="h-7 w-7" />
              </span>
              <p className="mt-4 text-base font-medium text-ink">还没有知识树</p>
              <p className="mt-1 max-w-sm text-sm text-ink-secondary">
                新建一棵树，从一个问题开始，AI 会帮你把知识层层展开成树形结构。
              </p>
              <button className="btn-primary mt-6" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" />
                创建第一棵知识树
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {trees.map((t) => (
                <div
                  key={t.id}
                  className="card group relative cursor-pointer p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                  onClick={() => navigate(`/tree/${t.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                      <TreePine className="h-5 w-5" />
                    </span>
                    <button
                      className="rounded-lg p-1.5 text-ink-secondary opacity-0 transition-opacity hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
                      title="删除知识树"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(t.id);
                      }}
                    >
                      {deletingId === t.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <h3 className="mt-3 truncate text-base font-semibold text-ink">
                    {t.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-ink-secondary">
                    {t.description || "暂无描述，点击进入学习。"}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                      {t.nodeCount} 个节点
                    </span>
                    <span className="text-xs text-ink-secondary">
                      更新于 {formatTime(t.updatedAt)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    继续学习
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* 新建对话框 */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => !creating && setShowCreate(false)}
        >
          <div
            className="card w-full max-w-md animate-fade-in p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">新建知识树</h3>
              <button
                className="rounded-lg p-1 text-ink-secondary hover:bg-slate-100"
                onClick={() => setShowCreate(false)}
                disabled={creating}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mt-5 block text-xs font-medium text-ink-secondary">
              主题标题
            </label>
            <input
              className="input-base mt-1.5"
              placeholder="例如：深度学习基础 / 考研高数 / 经济学原理"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <label className="mt-4 block text-xs font-medium text-ink-secondary">
              描述（可选）
            </label>
            <textarea
              className="input-base mt-1.5 min-h-[72px] resize-none"
              placeholder="这棵知识树要学习什么主题？"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="btn-secondary"
                onClick={() => setShowCreate(false)}
                disabled={creating}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleCreate}
                disabled={creating || !title.trim()}
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                创建并开始
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
