import { ChevronRight, Home } from "lucide-react";
import type { TreeNodeFlat } from "../types";

interface Props {
  treeTitle: string;
  path: TreeNodeFlat[];
  currentId: number | null;
  onNavigate: (nodeId: number | null) => void;
}

export default function Breadcrumb({ treeTitle, path, currentId, onNavigate }: Props) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto whitespace-nowrap text-sm">
      <button
        className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 font-medium text-ink transition-colors hover:bg-slate-100"
        onClick={() => onNavigate(null)}
        title="回到树根（新建根问题）"
      >
        <Home className="h-3.5 w-3.5" />
        {treeTitle}
      </button>
      {path.map((n) => (
        <span key={n.id} className="flex shrink-0 items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <button
            className={
              n.id === currentId
                ? "rounded-md bg-primary-soft px-2 py-1 font-medium text-primary"
                : "max-w-[180px] truncate rounded-md px-2 py-1 text-ink-secondary transition-colors hover:bg-slate-100 hover:text-ink"
            }
            onClick={() => onNavigate(n.id)}
          >
            {n.question}
          </button>
        </span>
      ))}
    </nav>
  );
}
