export interface Tree {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  /** 树内节点总数（列表接口附带） */
  nodeCount: number;
}

export type SummarySource = "ai" | "manual" | "none";

export interface TreeNode {
  id: number;
  treeId: number;
  parentId: number | null;
  question: string;
  answer: string;
  summary: string;
  summarySource: SummarySource;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  children: TreeNode[];
}

export interface TreeNodeFlat extends Omit<TreeNode, "children"> {}

export interface TreeDetail extends Tree {
  nodes: TreeNode[];
  nodeCount: number;
}

/** 继续追问创建子节点的请求体 */
export interface CreateChildPayload {
  question: string;
}

/** 手动生成摘要请求体 */
export interface SummaryPayload {
  force?: boolean;
}

/** 问答请求体 */
export interface ChatPayload {
  question: string;
  /** 可选：前置上下文（父问题链 + 父回答），帮助模型承接上下文 */
  context?: { question: string; answer: string }[];
}

export interface Settings {
  useServerKey: boolean;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface TestConnectionResult {
  ok: boolean;
  message: string;
  model?: string;
}
