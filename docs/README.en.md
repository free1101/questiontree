<p align="center">
  <img src="./banner.png" alt="TreeMind AI banner" width="100%" />
</p>

<h1 align="center">🌳 TreeMind AI</h1>

<p align="center">
  <b>Turn linear AI chats into tree-shaped learning — every follow-up question grows a new branch on your knowledge tree.</b>
</p>

<p align="center">
  <a href="https://github.com/free1101/questiontree/stargazers"><img src="https://img.shields.io/github/stars/free1101/questiontree?style=social" alt="stars" /></a>
  <a href="https://github.com/free1101/questiontree/blob/main/LICENSE"><img src="https://img.shields.io/github/license/free1101/questiontree" alt="license" /></a>
  <img src="https://img.shields.io/badge/React-18.3-61dafb?logo=react" alt="react" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript" alt="typescript" />
  <img src="https://img.shields.io/badge/Vite-5-646cff?logo=vite" alt="vite" />
  <img src="https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs" alt="node" />
  <a href="https://github.com/free1101/questiontree/issues"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="prs" /></a>
  <a href="https://github.com/free1101/questiontree"><img src="https://img.shields.io/badge/README-中文-blue" alt="中文版" /></a>
</p>

---

## 💡 Why a knowledge tree?

When you learn by chatting with AI, have you ever felt this way:

- ❌ The longer the chat, the messier it gets — you can never find "that one point" again
- ❌ You keep asking deeper questions, but forget what you've **learned** and **where you are**
- ❌ Connections between concepts only exist in your head — there's no map to see the whole picture

**TreeMind AI** turns every "follow-up question" into a **node** (question + AI answer) on a tree. After each answer, AI automatically distills the branch into a **core-idea summary** and refreshes it along the ancestor chain. Your learning stops being a single line and becomes a tree that grows **deeper and clearer** the more you explore.

## ✨ Features

| Capability | Description |
|---|---|
| 🧭 **Tree-shaped Q&A** | Follow up on any node to grow `A → A.1 → A.1.1`; or start a brand-new root question |
| ✨ **Auto branch summaries** | AI summarizes the whole subtree after each answer and refreshes ancestor summaries — never get lost no matter how deep the tree grows |
| 🌲 **Tree navigation** | Recursive sidebar (expand/collapse, active highlight, hover quick-ask) + breadcrumb path on top |
| 📚 **Multiple trees** | Manage independent trees by topic ("React Deep Dive", "Math Exam Prep"…) |
| 📝 **Markdown rendering** | Headings, lists, code blocks, tables, quotes; smooth streaming output |
| ✏️ **Editable summaries** | Manual edits are never overwritten by AI — your thinking comes first |
| 🔑 **Dual key modes** | Shared server key (great for deploying to many users) or per-user key from the settings page |

## 🖼️ Screenshot

<p align="center">
  <img src="./screen.png" alt="Workspace: tree navigation on the left, Q&A stream in the middle, branch summary on the right" width="92%" />
</p>
<p align="center">
  <i>Workspace: tree navigation (left), Q&A stream (middle), AI-generated branch summary (right), breadcrumb path on top.</i>
</p>

## 🧱 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express (single process serves both UI and API)
- **Database**: SQLite (better-sqlite3, zero-config file-based)
- **LLM**: Volcano Ark OpenAI-compatible endpoint, default `deepseek-v4-flash` (also supports Doubao models / any `ep-xxx` endpoint)

## 🚀 Quick Start (5 minutes)

```bash
# 1. Clone & install
git clone https://github.com/free1101/questiontree.git
cd questiontree
npm install

# 2. Configure your key
cp .env.example .env
# Edit .env and fill in ARK_API_KEY (see below)

# 3. Dev mode (frontend on 5173, backend auto-restarts)
npm run dev
```

Open **http://localhost:5173** and start learning.

### Production mode (single process serves static site + API)

```bash
npm run build
npm start          # default port 3000, override with PORT in .env
```

### Getting a Volcano Ark API Key

1. Open the [Volcano Ark console](https://console.volcengine.com/ark)
2. **API Key Management → Create**, copy the key
3. Put it in `ARK_API_KEY` in `.env`; or let users enter their own key in the app's Settings page

### Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port, default `3000` |
| `ARK_API_KEY` | Shared server key (can be left empty — users can fill their own in Settings) |
| `ARK_BASE_URL` | Ark endpoint: plan channel `/api/plan/v3` or standard key channel `/api/v3` |
| `ARK_MODEL` | Default model ID, e.g. `deepseek-v4-flash`, `doubao-*`, or an `ep-xxx` endpoint |

### Bring your own LLM

TreeMind AI speaks the **OpenAI-compatible protocol**. Point `ARK_BASE_URL` + `ARK_MODEL` at any compatible provider — OpenAI, DeepSeek, SiliconFlow, Moonshot Kimi, Zhipu GLM, local Ollama (`http://localhost:11434/v1`), vLLM deployments, and more. No code changes needed.

## ☁️ Deploy to a Server (multi-user)

All users share the key configured on the server — **no sign-up required**, just use it:

```bash
git clone https://github.com/free1101/questiontree.git
cd questiontree
npm install
cp .env.example .env    # fill in ARK_API_KEY / PORT
npm run build
npm start               # or with a process manager: pm2 start npm --name questiontree -- start
```

Open `http://server-ip:3000`. Data lives in `server/data/questiontree.db` (SQLite file — delete it to reset).

## 📁 Project Structure

```
questiontree/
├── server/                # Backend (Express + SQLite + Ark LLM wrapper)
│   ├── index.js           # Entry: routes + static hosting + error handling
│   ├── db.js              # SQLite data layer (tree/node CRUD, nested assembly)
│   ├── llm.js             # Ark calls (streaming chat / summary / connection test)
│   ├── summary.js         # Subtree collection + summary prompt + ancestor refresh
│   └── routes/            # trees / nodes / chat (SSE streaming)
└── src/                   # Frontend (React)
    ├── pages/             # Home / Workspace / Settings
    ├── components/        # TreeNav, NodeCard, SummaryCard, Breadcrumb, Composer
    └── lib/               # API client (SSE parsing), tree utilities
```

## ❓ FAQ

**Q: Do I need a Volcano Ark account?**
A: The project uses the OpenAI-compatible protocol. Change `ARK_BASE_URL` + model to connect to any compatible endpoint (OpenAI, DeepSeek official, local Ollama, etc.).

**Q: Is my data stored in the cloud?**
A: No. All data stays in your own server/SQLite file — private and secure.

**Q: The summary is in the wrong language/format?**
A: Summaries are generated by the LLM and vary with the model. You can edit them manually (edited summaries are never overwritten by AI).

## 🤝 Contributing

Any contribution is welcome — issues, bug fixes, features, docs:

1. Fork the repo and create a branch
2. Commit your changes (use `feat:` / `fix:` prefixes)
3. Open a Pull Request

Star ⭐ is also the best support!

## 📄 License

[MIT](../LICENSE) © 2026 Lena
