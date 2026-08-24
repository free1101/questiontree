# 推广文案

> 面向不同社区/平台的分享文案，选择适合的平台直接复制发布。

---

## 版本一：技术社区帖（掘金 / V2EX / CSDN）—— 长文分享

### 标题选项
- 《我把和 AI 的聊天变成了一棵知识树，越学越深、永不迷路》
- 《开源一个树形 AI 学习工具：用追问生长出你自己的知识图谱》

### 正文

> 和 AI 聊天学东西，你是不是也遇到过这些问题？
>
> - 聊天记录越长越乱，翻半天找不到「当时讲的那个点」
> - 顺着话题越问越深，回头却忘了自己学到了什么、学到哪了
> - 概念之间的关联只能靠脑补，没有一张能看清全貌的图
>
> 于是我做了个开源工具——**知识树（TreeMind AI）**。
>
> 核心思路很简单：**把每一次「追问」变成树上的一颗节点（问题 + AI 回答）**。你顺着一个话题往下问，它就长成一棵 `A → A.1 → A.1.1` 的知识树。而更关键的是，AI 会在每次回答完成后，**自动为这个分支提炼「核心思想」摘要，并沿祖先链逐层刷新上级摘要**——所以无论这棵树长多深，你永远知道每个分支在讲什么。
>
> ✨ 功能一览：
> - 🧭 树形追问：任意节点下继续追问，也可新建根问题开启全新分支
> - ✨ 自动分支摘要：子树核心思想自动提炼，沿祖先链逐层刷新
> - 🌲 树形导航：左侧递归树 + 顶部面包屑，点击任意节点回到上下文
> - 📚 多知识树：按主题管理（「React 深入」「考研数学」……）
> - ✏️ 摘要可编辑：手动编辑后 AI 不再覆盖，你的思考优先
> - 🔑 双 Key 模式：服务端共用 Key 部署，或用户设置页自填
>
> 🧱 技术栈：React 18 + TS + Vite + Tailwind · Express + SQLite · 火山方舟 Ark（OpenAI 兼容，默认 deepseek）
>
> 5 分钟就能跑起来：`git clone` → `npm install` → 填 Key → `npm run dev`
>
> 📦 开源地址：https://github.com/free1101/questiontree
>
> 所有数据都存在你自己的 SQLite 文件里，隐私安全，也可以部署到服务器给团队/朋友一起用。
>
> 如果你也觉得「直线型聊天」学得浅、忘得快，欢迎 Star、提 Issue、贡献代码。你的任何反馈都会让这棵树长得更好 🌳

---

## 版本二：朋友圈 / 即刻 / 小红书 —— 短文案

### 标题
**我把和 AI 的聊天变成了一棵「知识树」🌳**

### 正文

学东西总感觉「聊过就忘」？我做了个开源小工具：

和 AI 对话时，**每一次追问都会长成树上的一颗节点**，AI 还会自动给每个分支提炼核心摘要。树越长越深，你却永远不会迷路。

- 追问成树，越学越深
- 分支摘要自动生成
- 多主题知识树随便建
- 数据本地存储，隐私安全

开源 & 免费：https://github.com/free1101/questiontree

喜欢的话点个 ⭐ 支持一下，让这棵树长得更茂盛～

---

## 版本三：英文版（Hacker News / Reddit / X）

### Title
**I built an open-source tool that turns AI chats into a knowledge tree**

### Body

Tired of losing track in long AI conversations? I built **TreeMind AI**, an open-source learning tool where every follow-up question grows into a node on a knowledge tree.

- 🧭 Tree-shaped conversations: keep asking "why" and watch your knowledge grow deeper
- ✨ Auto summaries: after each answer, AI summarizes the whole branch and refreshes ancestor nodes — you'll never get lost in a deep dive
- 🌲 Tree navigation with breadcrumbs
- 📚 Multiple trees for different topics
- ✏️ Manual summary editing (AI won't overwrite your edits)
- 🔑 Shared server key or per-user key modes

Stack: React 18 + TS + Vite + Tailwind · Express + SQLite · OpenAI-compatible (works with any endpoint)

All data stays in your own SQLite file — private by default. Deployable to a server for multi-user use.

GitHub: https://github.com/free1101/questiontree

Star ⭐ and PRs welcome!
