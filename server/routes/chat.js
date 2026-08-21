import { Router } from "express";
import { nodeRepo, treeRepo, treeExists } from "../db.js";
import { resolveConfig, streamChat, testConnection } from "../llm.js";
import { collectAncestors, regenerateNodeSummaryChain } from "../summary.js";

const router = Router();

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const SUMMARY_TIMEOUT = 30000;

function sse(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

/** 构造问答消息：system + 祖先脉络上下文 + 当前问题 */
function buildChatMessages(node) {
  const sys =
    "你是一位知识渊博、表达清晰的学习导师。用户通过「问题-回答」方式深入学习一个主题，" +
    "你会看到当前问题及其所属知识脉络（祖先问答）作为背景。请针对当前问题给出准确、有条理、易理解的中文回答，" +
    "尽量用 Markdown 组织内容（小标题、列表、代码块）。回答完整但不过度冗长。";
  const messages = [{ role: "system", content: sys }];
  const ancestors = collectAncestors(node.id, 6);
  if (ancestors.length) {
    const ctx = ancestors
      .map((a) => `【上级问题】${a.question}\n【上级回答要点】${a.answer?.slice(0, 800) || "（无）"}`)
      .join("\n\n");
    messages.push({
      role: "user",
      content: `以下是该问题所处的知识脉络背景，供你参考、不必复述：\n\n${ctx}`,
    });
    messages.push({ role: "assistant", content: "好的，我已了解上下文背景，请提出具体问题。" });
  }
  messages.push({ role: "user", content: node.question });
  return messages;
}

// POST /api/chat/test  连接测试（供设置页使用）
router.post(
  "/test",
  asyncHandler(async (req, res) => {
    const config = resolveConfig(req);
    if (!config.apiKey) {
      return res.status(401).json({ error: "未配置 API Key" });
    }
    const text = await testConnection(config);
    res.json({ ok: true, model: config.model, message: text });
  })
);

// POST /api/chat  SSE 流式问答
// body: { question, nodeId? }   有 nodeId → 在该节点下继续追问（创建子节点）
// body: { question, treeId? }   无 nodeId → 为树创建根节点
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { question, nodeId, treeId } = req.body || {};
    const q = String(question || "").trim();
    if (!q) {
      return res.status(400).json({ error: "问题不能为空" });
    }

    let treeIdFinal;
    let parentId = null;
    if (nodeId != null) {
      const parent = nodeRepo.get(Number(nodeId));
      if (!parent) return res.status(404).json({ error: "父节点不存在" });
      treeIdFinal = parent.treeId;
      parentId = parent.id;
    } else {
      treeIdFinal = Number(treeId);
      if (!treeIdFinal || !treeExists(treeIdFinal)) {
        return res.status(404).json({ error: "知识树不存在" });
      }
    }

    const node = nodeRepo.create({
      treeId: treeIdFinal,
      parentId,
      question: q,
      sortOrder: parentId == null ? 0 : nodeRepo.maxSortOrder(parentId) + 1,
    });
    treeRepo.touch(treeIdFinal);

    const config = resolveConfig(req);
    const messages = buildChatMessages(node);

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    let full = "";
    let failed = null;
    try {
      for await (const { text } of streamChat(messages, { config })) {
        full += text;
        sse(res, { type: "delta", text });
      }
    } catch (err) {
      failed = err;
      sse(res, { type: "error", error: err.message });
    }

    // 保存回答（失败时保留已生成的部分内容）
    if (full.trim()) {
      nodeRepo.update(node.id, { answer: full });
    } else {
      nodeRepo.update(node.id, { answer: "" });
    }

    if (failed) {
      res.end();
      return;
    }

    // 摘要链刷新：带整体超时保护，失败不阻塞主流程
    let finalNode = nodeRepo.get(node.id);
    try {
      finalNode = await Promise.race([
        (async () => {
          await regenerateNodeSummaryChain(treeIdFinal, node.id, { config });
          return nodeRepo.get(node.id);
        })(),
        new Promise((resolve) => setTimeout(() => resolve(nodeRepo.get(node.id)), SUMMARY_TIMEOUT)),
      ]);
    } catch (err) {
      console.error("[chat] 摘要刷新异常:", err.message);
      finalNode = nodeRepo.get(node.id);
    }
    sse(res, { type: "done", node: finalNode });
    res.end();
  })
);

export default router;
