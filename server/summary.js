import { getTreeNodes, nodeRepo } from "./db.js";
import { chatComplete } from "./llm.js";

const MAX_NODE_CHARS = 1200; // 单节点截断长度
const MAX_TOTAL_CHARS = 12000; // 整个子树参与摘要的总长度上限

/** 收集以 nodeId 为根的子树全部节点（含自身），先序遍历、子级按 sortOrder 排序 */
export function collectSubtree(treeId, nodeId) {
  const all = getTreeNodes(treeId);
  const byId = new Map();
  const byParent = new Map();
  for (const n of all) {
    byId.set(n.id, n);
    const key = n.parentId == null ? "root" : n.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(n);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  }

  const result = [];
  const stack = [nodeId];
  const visited = new Set();
  while (stack.length) {
    const id = stack.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    const node = byId.get(id);
    if (!node) continue;
    result.push(node);
    for (const c of byParent.get(id) || []) stack.push(c.id);
  }
  return result;
}

/** 从节点出发沿 parentId 向上收集祖先链（不含自身，从根到父） */
export function collectAncestors(nodeId, maxCount = 8) {
  const chain = [];
  let current = nodeRepo.get(nodeId);
  while (current && current.parentId != null && chain.length < maxCount) {
    const parent = nodeRepo.get(current.parentId);
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

function truncate(text, max) {
  const s = String(text || "").trim();
  return s.length > max ? `${s.slice(0, max)}…（已截断）` : s;
}

/** 构造"子树核心思想"摘要 prompt */
export function buildSummaryPrompt(subtreeNodes) {
  const parts = [];
  let total = 0;
  for (const n of subtreeNodes) {
    const q = truncate(n.question, MAX_NODE_CHARS);
    const a = truncate(n.answer, MAX_NODE_CHARS);
    const block = `### 问题：${q}\n回答：${a}\n`;
    if (total + block.length > MAX_TOTAL_CHARS) {
      parts.push("（以下子节点因篇幅过长省略）");
      break;
    }
    parts.push(block);
    total += block.length;
  }
  return [
    {
      role: "system",
      content:
        "你是一位知识整理助手。用户通过「问题-回答」的不断追问形成一棵知识树，下面是一个分支（子树）中所有问题和回答的完整内容。" +
        "请提炼出该分支的【核心思想】：用 3-8 条简明要点概括最重要的结论与知识点，每条一句话、用 - 开头，按重要程度排序。" +
        "要求：只输出要点本身，不要任何前言结尾；不要复述问题；条理清晰、信息密集。",
    },
    {
      role: "user",
      content: `以下是该分支的全部问答内容：\n\n${parts.join("\n")}`,
    },
  ];
}

/** 为单个节点生成/更新摘要（manual 摘要不覆盖，除非 force） */
async function regenerateOne(treeId, nodeId, { force = false, config }) {
  const node = nodeRepo.get(nodeId);
  if (!node) return;
  if (!force && node.summarySource === "manual") return;
  const subtree = collectSubtree(treeId, nodeId);
  if (!subtree.length) return;
  const text = await chatComplete(buildSummaryPrompt(subtree), {
    config,
    temperature: 0.3,
  });
  if (text) {
    nodeRepo.update(nodeId, { summary: text, summarySource: "ai" });
  }
}

/**
 * 摘要链刷新：更新当前节点摘要后，沿 parentId 链向上逐层更新所有祖先的摘要。
 * 仅影响祖先链，不做全树刷新；单层失败不影响后续层（内部捕获记录）。
 */
export async function regenerateNodeSummaryChain(treeId, nodeId, { force = false, config } = {}) {
  const chain = [nodeId];
  let current = nodeRepo.get(nodeId);
  const seen = new Set([nodeId]);
  while (current && current.parentId != null && !seen.has(current.parentId)) {
    seen.add(current.parentId);
    chain.push(current.parentId);
    current = nodeRepo.get(current.parentId);
  }
  for (const id of chain) {
    try {
      await regenerateOne(treeId, id, { force, config });
    } catch (err) {
      console.error(`[summary] 节点 ${id} 摘要生成失败:`, err.message);
    }
  }
}
