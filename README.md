# 知识树 · 树形 AI 对话学习工具

把「直线型聊天」变成「树形学习」。每个节点是一次「问题 + AI 回答」，可以任意深度继续追问；AI 自动为每个分支提炼「核心思想」摘要，配合树形导航与路径面包屑，你永远知道自己学到哪里。

## 功能特性

- **树形对话**：任意节点下继续追问，形成 A → A.1 → A.1.1 的知识树；也支持新建根问题开启全新分支
- **分支摘要**：每次回答完成后，AI 自动汇总该节点下整个子树的核心思想，并沿祖先链逐层刷新上级摘要；摘要可手动编辑（编辑后 AI 不再自动覆盖）
- **树形导航**：左侧递归知识树（展开/折叠、当前节点高亮、悬停快捷追问）+ 顶部路径面包屑，点击任意节点回到对应上下文
- **多知识树**：首页按主题管理多棵独立知识树
- **Markdown 渲染**：回答支持小标题、列表、代码块、表格等完整格式
- **双 Key 模式**：服务端集中配置共用 Key（适合部署推广），也支持用户设置页自填自己的火山方舟 Key

## 技术栈

- 前端：React 18 + TypeScript + Vite + Tailwind CSS
- 后端：Node.js + Express（前后端一体）
- 数据库：SQLite（better-sqlite3，文件型免安装）
- LLM：火山方舟（Ark）OpenAI 兼容端点，默认 `deepseek-v4-flash`

## 快速开始

```bash
npm install
npm run dev        # 开发模式（自动起后端 3000 + 前端 5173）
```

打开 http://localhost:5173 即可使用。

## 生产运行（本地自用 / 服务器部署）

```bash
npm install
npm run build      # 构建前端产物到 dist/
npm start          # 单进程托管静态页面 + API，默认端口 3000
```

打开 http://localhost:3000 即可使用。

### 环境变量

复制 `.env.example` 为 `.env` 并按需修改：

| 变量 | 说明 |
|---|---|
| `PORT` | 服务端口，默认 `3000` |
| `ARK_API_KEY` | 服务端共用 Key（可留空，让用户自行在设置页填写） |
| `ARK_BASE_URL` | 火山方舟端点：套餐通道 `/api/plan/v3` 或标准 Key 通道 `/api/v3` |
| `ARK_MODEL` | 默认模型 ID，如 `deepseek-v4-flash`、豆包系列或 `ep-xxx` 接入点 |

### 获取火山方舟 API Key

1. 打开 [火山方舟控制台](https://console.volcengine.com/ark)
2. 创建 API Key（API Key 管理 → 创建）
3. 将 Key 填入 `.env` 的 `ARK_API_KEY`，或在应用「设置」页关闭「使用服务端 Key」后自行填写

## 数据存储

所有数据保存在服务器目录 `server/data/questiontree.db`（SQLite 文件，WAL 模式）。个人本地运行时即保存在本机；删除该文件即清空全部数据。

## 部署到服务器（多人试用）

```bash
# 服务器上执行
git clone <仓库地址> && cd questiontree
npm install
cp .env.example .env    # 编辑填写 ARK_API_KEY / PORT
npm run build
npm start               # 或用 pm2/systemd 守护：pm2 start npm --name questiontree -- start
```

打开 `http://服务器IP:3000` 即可，所有用户共享服务器配置的 Key，无需各自注册。

## 目录结构

```
questiontree/
├── server/                # 后端（Express + SQLite + Ark LLM 封装）
│   ├── index.js           # 入口：路由挂载 + 静态托管 + 错误处理
│   ├── db.js              # SQLite 数据层（树/节点 CRUD、嵌套组装）
│   ├── llm.js             # Ark OpenAI 兼容调用（流式问答 / 摘要 / 连接测试）
│   ├── summary.js         # 子树收集 + 摘要 prompt + 祖先链刷新
│   └── routes/            # trees / nodes / chat（SSE 流式）
└── src/                   # 前端（React）
    ├── pages/             # 首页 / 工作台 / 设置
    ├── components/        # 树导航、节点卡片、摘要卡片、面包屑、输入框
    └── lib/               # API 客户端（含 SSE 解析）、树工具函数
```
