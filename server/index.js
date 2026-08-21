import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { initDb } from "./db.js";
import treesRouter from "./routes/trees.js";
import nodesRouter from "./routes/nodes.js";
import chatRouter from "./routes/chat.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);

initDb();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/api/trees", treesRouter);
app.use("/api/nodes", nodesRouter);
app.use("/api/chat", chatRouter);

// 静态托管前端构建产物
const distDir = path.join(__dirname, "..", "dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

// 统一错误处理
app.use((err, _req, res, _next) => {
  console.error("[server error]", err.message);
  res.status(err.status || 500).json({
    error: err.message || "服务器内部错误",
  });
});

export function startServer(port = PORT) {
  const server = app.listen(port, () => {
    console.log(`知识树服务已启动: http://localhost:${port}`);
  });
  return server;
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) startServer();
