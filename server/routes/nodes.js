import { Router } from "express";
import { nodeRepo, treeRepo } from "../db.js";
import { resolveConfig } from "../llm.js";
import { regenerateNodeSummaryChain } from "../summary.js";

const router = Router();

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function loadNodeOr404(id) {
  const node = nodeRepo.get(id);
  if (!node) {
    const err = new Error("节点不存在");
    err.status = 404;
    throw err;
  }
  return node;
}

// 继续追问：在当前节点下创建子节点
router.post(
  "/:id/children",
  asyncHandler(async (req, res) => {
    const parent = loadNodeOr404(Number(req.params.id));
    const { question } = req.body || {};
    if (!question || !String(question).trim()) {
      return res.status(400).json({ error: "问题不能为空" });
    }
    const node = nodeRepo.create({
      treeId: parent.treeId,
      parentId: parent.id,
      question: String(question),
      sortOrder: nodeRepo.maxSortOrder(parent.id) + 1,
    });
    treeRepo.touch(parent.treeId);
    res.status(201).json(node);
  })
);

// 节点详情
router.get(
  "/:id",
  asyncHandler((req, res) => {
    res.json(loadNodeOr404(Number(req.params.id)));
  })
);

// 编辑节点（question / answer / summary / summarySource）
router.put(
  "/:id",
  asyncHandler((req, res) => {
    const id = Number(req.params.id);
    loadNodeOr404(id);
    const { question, answer, summary, summarySource } = req.body || {};
    const fields = {};
    if (question !== undefined) fields.question = String(question);
    if (answer !== undefined) fields.answer = String(answer);
    if (summary !== undefined) fields.summary = String(summary);
    if (summarySource !== undefined) fields.summarySource = String(summarySource);
    if (!Object.keys(fields).length) {
      return res.status(400).json({ error: "没有可更新的字段" });
    }
    const node = nodeRepo.update(id, fields);
    treeRepo.touch(node.treeId);
    res.json(node);
  })
);

// 删除节点（级联删除子树）
router.delete(
  "/:id",
  asyncHandler((req, res) => {
    const id = Number(req.params.id);
    const node = loadNodeOr404(id);
    nodeRepo.remove(id);
    treeRepo.touch(node.treeId);
    res.json({ ok: true });
  })
);

// 手动触发重新生成该节点（及祖先链）的分支摘要
router.post(
  "/:id/summary",
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const node = loadNodeOr404(id);
    const { force } = req.body || {};
    const config = resolveConfig(req);

    // 异步生成，不阻塞响应；失败时静默记录
    regenerateNodeSummaryChain(node.treeId, id, { force: !!force, config }).catch((err) => {
      console.error(`[summary] 节点 ${id} 摘要生成失败:`, err.message);
    });

    res.json({ ok: true, message: "摘要生成已启动，稍后自动刷新" });
  })
);

export default router;
