import type { TreeNode, TreeNodeFlat } from "../types";

/** 嵌套树 → 扁平列表（先序） */
export function flattenTree(nodes: TreeNode[]): TreeNodeFlat[] {
  const result: TreeNodeFlat[] = [];
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      const { children, ...rest } = n;
      result.push(rest);
      walk(children);
    }
  };
  walk(nodes);
  return result;
}

/** 在整树中查找节点 */
export function findNode(nodes: TreeNode[], id: number | null): TreeNode | null {
  if (id == null) return null;
  for (const n of nodes) {
    if (n.id === id) return n;
    const hit = findNode(n.children, id);
    if (hit) return hit;
  }
  return null;
}

/** 获取从根到 targetId 的路径（含自身），用于面包屑 */
export function getPath(nodes: TreeNode[], targetId: number | null): TreeNodeFlat[] {
  if (targetId == null) return [];
  const flat = flattenTree(nodes);
  const byId = new Map(flat.map((n) => [n.id, n]));
  const chain: TreeNodeFlat[] = [];
  let cur = byId.get(targetId);
  while (cur) {
    chain.unshift(cur);
    cur = cur.parentId != null ? byId.get(cur.parentId) : undefined;
  }
  return chain;
}

/** 统计节点总数 */
export function countNodes(nodes: TreeNode[]): number {
  let count = 0;
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      count += 1;
      walk(n.children);
    }
  };
  walk(nodes);
  return count;
}

/** 递归替换指定 id 的节点（整树不可变更新） */
export function replaceNode(nodes: TreeNode[], target: TreeNode): TreeNode[] {
  return nodes.map((n) => {
    if (n.id === target.id) return target;
    if (n.children.length) return { ...n, children: replaceNode(n.children, target) };
    return n;
  });
}

/** 将新节点插入父节点 children 末尾（父不存在则视为根追加） */
export function insertChild(nodes: TreeNode[], parentId: number, node: TreeNode): TreeNode[] {
  if (parentId == null) return [...nodes, node];
  return nodes.map((n) => {
    if (n.id === parentId) return { ...n, children: [...n.children, node] };
    if (n.children.length) return { ...n, children: insertChild(n.children, parentId, node) };
    return n;
  });
}

/** 新增或更新节点：已存在则替换，否则按 parentId 插入 */
export function upsertNode(nodes: TreeNode[], incoming: TreeNode | TreeNodeFlat): TreeNode[] {
  const node: TreeNode = {
    ...incoming,
    children: "children" in incoming && incoming.children ? (incoming.children as TreeNode[]) : [],
  };
  if (findNode(nodes, node.id)) return replaceNode(nodes, node);
  return insertChild(nodes, node.parentId as number, node);
}
