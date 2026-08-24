# v1.0.0 Release Notes

知识树（TreeMind AI）首个正式版本发布。

## 🌟 核心功能

- **树形追问**：任意节点下继续追问，形成 `A → A.1 → A.1.1` 的知识树；支持新建根问题开启全新分支
- **自动分支摘要**：每次回答完成后，AI 自动汇总该节点下整个子树的核心思想，并沿祖先链逐层刷新上级摘要
- **树形导航**：左侧递归知识树（展开/折叠、当前节点高亮、悬停快捷追问）+ 顶部路径面包屑
- **多知识树管理**：首页按主题管理多棵独立知识树
- **Markdown 渲染**：回答支持小标题、列表、代码块、表格、引用，流式打字体验
- **摘要手动编辑**：编辑后的摘要不会被 AI 自动覆盖
- **双 Key 模式**：服务端集中配置共用 Key（适合部署推广），也支持用户设置页自填火山方舟 Key

## 🧱 技术栈

React 18 + TypeScript + Vite + Tailwind CSS · Node.js + Express · SQLite (better-sqlite3) · 火山方舟 Ark (OpenAI 兼容)

## 🚀 快速开始

```bash
git clone https://github.com/free1101/questiontree.git
cd questiontree
npm install
cp .env.example .env   # 填入 ARK_API_KEY
npm run dev            # 开发模式，打开 http://localhost:5173
```

## ⚠️ 注意事项

- 需要火山方舟 API Key（免费注册：https://console.volcengine.com/ark）
- 所有数据保存在本地 SQLite 文件（`server/data/questiontree.db`），不上传云端
- 默认模型 `deepseek-v4-flash`，可在 `.env` 或设置页切换

## 🤝 欢迎贡献

提 Issue、提 PR、Star 支持都可以！详见 README。
