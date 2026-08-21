import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  MessageCircleQuestion,
  CornerDownRight,
  Sparkles,
} from "lucide-react";
import type { TreeNode } from "../types";

interface Props {
  nodes: TreeNode[];
  currentId: number | null;
  onSelect: (id: number) => void;
  onAsk: (id: number) => void;
  defaultExpanded?: boolean;
}

interface ItemProps {
  node: TreeNode;
  depth: number;
  currentId: number | null;
  onSelect: (id: number) => void;
  onAsk: (id: number) => void;
  defaultExpanded?: boolean;
}

function TreeItem({ node, depth, currentId, onSelect, onAsk, defaultExpanded }: ItemProps) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? true);
  const hasChildren = node.children.length > 0;
  const active = node.id === currentId;
  const hasSummary = !!node.summary;

  return (
    <div>
      <div
        className={
          "group flex cursor-pointer items-center gap-1.5 rounded-lg py-1.5 pr-2 text-[13px] transition-colors " +
          (active
            ? "bg-primary text-white"
            : "text-ink-secondary hover:bg-slate-100 hover:text-ink")
        }
        style={{ paddingLeft: depth * 14 + 6 }}
        onClick={() => onSelect(node.id)}
      >
        <button
          className={
            "shrink-0 rounded p-0.5 transition-colors " +
            (hasChildren ? "opacity-100" : "opacity-0")
          }
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
        <MessageCircleQuestion
          className={"h-4 w-4 shrink-0 " + (active ? "text-white/80" : "text-primary/70")}
        />
        <span className="min-w-0 flex-1 truncate">{node.question}</span>
        {hasSummary && (
          <span title="已有分支摘要">
            <Sparkles
              className={"h-3 w-3 shrink-0 " + (active ? "text-white/70" : "text-accent")}
            />
          </span>
        )}
        {hasChildren && (
          <span
            className={
              "shrink-0 rounded-full px-1.5 text-[10px] leading-4 " +
              (active ? "bg-white/20 text-white" : "bg-slate-100 text-ink-secondary")
            }
          >
            {node.children.length}
          </span>
        )}
        <button
          className={
            "shrink-0 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 " +
            (active ? "text-white hover:bg-white/20" : "text-primary hover:bg-primary-soft")
          }
          title="在此继续追问"
          onClick={(e) => {
            e.stopPropagation();
            onAsk(node.id);
          }}
        >
          <CornerDownRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {expanded && hasChildren && (
        <div className="relative ml-[9px] border-l border-slate-200">
          {node.children.map((c) => (
            <TreeItem
              key={c.id}
              node={c}
              depth={depth + 1}
              currentId={currentId}
              onSelect={onSelect}
              onAsk={onAsk}
              defaultExpanded={defaultExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** 递归树形导航 */
export default function TreeNav({ nodes, currentId, onSelect, onAsk, defaultExpanded }: Props) {
  if (!nodes.length) {
    return (
      <p className="px-4 py-8 text-center text-xs text-ink-secondary">
        还没有节点，先在中间输入第一个问题吧
      </p>
    );
  }
  return (
    <div className="space-y-0.5">
      {nodes.map((n) => (
        <TreeItem
          key={n.id}
          node={n}
          depth={0}
          currentId={currentId}
          onSelect={onSelect}
          onAsk={onAsk}
          defaultExpanded={defaultExpanded}
        />
      ))}
    </div>
  );
}
