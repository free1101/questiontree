import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Settings,
  TreePine,
  Plus,
  Loader2,
  Sparkles,
  Layers,
  Clock,
} from "lucide-react";
import { chatStream, getTree } from "../lib/api";
import { countNodes, findNode, getPath, upsertNode } from "../lib/tree";
import type { TreeDetail, TreeNode } from "../types";
import TreeNav from "../components/TreeNav";
import NodeCard from "../components/NodeCard";
import SummaryCard from "../components/SummaryCard";
import ChatComposer from "../components/ChatComposer";
import Breadcrumb from "../components/Breadcrumb";

interface StreamingState {
  parentId: number | null;
  question: string;
  answer: string;
}

export default function WorkspacePage() {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const [tree, setTree] = useState<TreeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [mode, setMode] = useState<"root" | "child">("child");
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState<StreamingState | null>(null);

  const load = useCallback(async () => {
    const t = await getTree(Number(treeId));
    setTree(t);
    setCurrentId((prev) => prev ?? t.nodes[0]?.id ?? null);
    setError("");
  }, [treeId]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [load]);

  const handleSend = async (question: string) => {
    if (!tree || sending) return;
    const parentId = mode === "child" && currentId != null ? currentId : null;
    setSending(true);
    setStreaming({ parentId, question, answer: "" });
    setError("");
    try {
      await chatStream(
        parentId != null ? { question, nodeId: parentId } : { question, treeId: tree.id },
        {
          onDelta: (text) => setStreaming((s) => (s ? { ...s, answer: s.answer + text } : s)),
          onError: (msg) => setError(msg),
          onDone: (node) => {
            setTree((prev) => {
              if (!prev) return prev;
              const nodes = upsertNode(prev.nodes, node);
              return { ...prev, nodes, nodeCount: countNodes(nodes) };
            });
            setCurrentId(node.id);
            setMode("child");
            setStreaming(null);
          },
        }
      );
    } finally {
      setSending(false);
    }
  };

  const handleNodeUpdated = (updated: TreeNode) => {
    setTree((prev) => {
      if (!prev) return prev;
      const nodes = upsertNode(prev.nodes, updated);
      return { ...prev, nodes, nodeCount: countNodes(nodes) };
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-surface text-ink-secondary">
        <Loader2 className="h-5 w-5 animate-spin" />
        加载知识树…
      </div>
    );
  }

  if (error && !tree) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface">
        <p className="text-sm text-danger">{error}</p>
        <button className="btn-secondary" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </button>
      </div>
    );
  }

  if (!tree) return null;

  const current = currentId != null ? findNode(tree.nodes, currentId) : null;
  const path = getPath(tree.nodes, currentId);
  const effectiveMode = currentId == null ? "root" : mode;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* 顶部栏 */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-ink-secondary transition-colors hover:bg-slate-100 hover:text-ink"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <TreePine className="h-4 w-4" />
          </span>
          <Breadcrumb
            treeTitle={tree.title}
            path={path}
            currentId={currentId}
            onNavigate={(id) => {
              setCurrentId(id);
              setMode(id == null ? "root" : "child");
            }}
          />
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              className="btn-ghost px-2.5 py-1.5 text-xs"
              onClick={() => {
                setMode("root");
                setCurrentId(null);
              }}
              title="新建一个根问题，开启全新分支"
            >
              <Plus className="h-3.5 w-3.5" />
              新建根问题
            </button>
            <Link to="/settings" className="btn-ghost px-2.5 py-1.5 text-xs">
              <Settings className="h-3.5 w-3.5" />
              设置
            </Link>
          </div>
        </div>
      </header>

      {/* 三栏主体 */}
      <div className="mx-auto grid w-full max-w-[1440px] flex-1 gap-4 px-4 pb-8 pt-[72px] lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        {/* 左：树导航 */}
        <aside className="hidden lg:block">
          <div className="sticky top-[72px] max-h-[calc(100vh-88px)] overflow-y-auto rounded-xl border border-slate-200/70 bg-white p-3 shadow-card">
            <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold text-ink">
              <Layers className="h-3.5 w-3.5 text-primary" />
              知识树导航
              <span className="ml-auto text-[11px] font-normal text-ink-secondary">
                {tree.nodeCount} 节点
              </span>
            </div>
            <TreeNav
              nodes={tree.nodes}
              currentId={currentId}
              onSelect={(id) => {
                setCurrentId(id);
                setMode("child");
              }}
              onAsk={(id) => {
                setCurrentId(id);
                setMode("child");
              }}
            />
          </div>
        </aside>

        {/* 中：问答区 */}
        <main className="min-w-0 space-y-4">
          {/* 移动端树导航折叠入口 */}
          <div className="lg:hidden">
            <details className="rounded-xl border border-slate-200/70 bg-white shadow-card">
              <summary className="flex cursor-pointer items-center gap-1.5 px-3 py-2 text-xs font-semibold text-ink">
                <Layers className="h-3.5 w-3.5 text-primary" />
                知识树导航（{tree.nodeCount} 节点）
              </summary>
              <div className="max-h-72 overflow-y-auto px-2 pb-2">
                <TreeNav
                  nodes={tree.nodes}
                  currentId={currentId}
                  onSelect={(id) => {
                    setCurrentId(id);
                    setMode("child");
                  }}
                  onAsk={(id) => {
                    setCurrentId(id);
                    setMode("child");
                  }}
                />
              </div>
            </details>
          </div>

          {current ? (
            <NodeCard node={current} isRoot={current.parentId == null} onUpdated={handleNodeUpdated} />
          ) : (
            <div className="card flex flex-col items-center px-6 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <Sparkles className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-ink">从一个问题开始</h2>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-secondary">
                输入你想学习的内容，AI 会给出回答；之后你可以在任意回答下继续追问，让知识长成一棵树。
              </p>
            </div>
          )}

          {/* 流式回答中的临时卡片 */}
          {streaming && (
            <NodeCard
              node={
                {
                  id: -1,
                  treeId: tree.id,
                  parentId: streaming.parentId,
                  question: streaming.question,
                  answer: streaming.answer,
                  summary: "",
                  summarySource: "none",
                  sortOrder: 0,
                  createdAt: "",
                  updatedAt: "",
                  children: [],
                } as TreeNode
              }
              streaming
              onUpdated={handleNodeUpdated}
            />
          )}

          <ChatComposer
            mode={effectiveMode}
            parentQuestion={current?.question}
            sending={sending}
            onSend={handleSend}
          />

          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
              {error}
            </div>
          )}
        </main>

        {/* 右：摘要区 */}
        <aside className="hidden lg:block">
          <div className="sticky top-[72px] space-y-4">
            <SummaryCard node={current} onUpdated={handleNodeUpdated} />
            <div className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-card">
              <h3 className="text-sm font-semibold text-ink">{tree.title}</h3>
              {tree.description && (
                <p className="mt-1 text-xs leading-relaxed text-ink-secondary">{tree.description}</p>
              )}
              <div className="mt-3 space-y-1.5 text-xs text-ink-secondary">
                <p className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary/70" />
                  共 {tree.nodeCount} 个节点
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary/70" />
                  创建于 {tree.createdAt}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
