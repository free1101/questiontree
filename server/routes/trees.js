import { Router } from "express";
import {
  treeRepo,
  nodeRepo,
  treeExists,
  getTreeNodes,
  buildNodeTree,
} from "../db.js";

const router = Router();

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 列表
router.get(
  "/",
  asyncHandler((_req, res) => {
    res.json(treeRepo.list());
  })
);

// 详情（含整棵嵌套树）
router.get(
  "/:id",
  asyncHandler((req, res) => {
    const tree = treeRepo.get(Number(req.params.id));
    if (!tree) {
      return res.status(404).json({ error: "知识树不存在" });
    }
    const flat = getTreeNodes(tree.id);
    res.json({
      ...tree,
      nodes: buildNodeTree(flat),
      nodeCount: flat.length,
    });
  })
);

// 创建
router.post(
  "/",
  asyncHandler((req, res) => {
    const { title, description } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "标题不能为空" });
    }
    const tree = treeRepo.create({
      title: String(title),
      description: String(description || ""),
    });
    res.status(201).json(tree);
  })
);

// 删除
router.delete(
  "/:id",
  asyncHandler((req, res) => {
    const id = Number(req.params.id);
    if (!treeExists(id)) {
      return res.status(404).json({ error: "知识树不存在" });
    }
    treeRepo.remove(id);
    res.json({ ok: true });
  })
);

// 创建根节点
router.post(
  "/:id/roots",
  asyncHandler((req, res) => {
    const treeId = Number(req.params.id);
    if (!treeExists(treeId)) {
      return res.status(404).json({ error: "知识树不存在" });
    }
    const { question } = req.body || {};
    if (!question || !String(question).trim()) {
      return res.status(400).json({ error: "问题不能为空" });
    }
    const node = nodeRepo.create({
      treeId,
      parentId: null,
      question: String(question),
      sortOrder: nodeRepo.maxSortOrder(null) + 1,
    });
    treeRepo.touch(treeId);
    res.status(201).json(node);
  })
);

export default router;
