import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db;

export function initDb() {
  const dataDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  db = new Database(path.join(dataDir, "questiontree.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS trees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tree_id INTEGER NOT NULL REFERENCES trees(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES nodes(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      answer TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      summary_source TEXT NOT NULL DEFAULT 'none',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_nodes_tree ON nodes(tree_id);
    CREATE INDEX IF NOT EXISTS idx_nodes_parent ON nodes(parent_id);
  `);
  return db;
}

export function getDb() {
  if (!db) initDb();
  return db;
}

/** 行转节点对象 */
export function rowToNode(row) {
  return {
    id: row.id,
    treeId: row.tree_id,
    parentId: row.parent_id,
    question: row.question,
    answer: row.answer,
    summary: row.summary,
    summarySource: row.summary_source,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 行转树对象 */
function rowToTree(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 树是否存在的快捷断言（供路由使用，返回 boolean） */
export function treeExists(treeId) {
  return !!getDb().prepare("SELECT 1 FROM trees WHERE id = ?").get(treeId);
}

/** 读取整棵树（扁平节点列表） */
export function getTreeNodes(treeId) {
  return getDb()
    .prepare(
      `SELECT * FROM nodes WHERE tree_id = ? ORDER BY sort_order ASC, id ASC`
    )
    .all(treeId)
    .map(rowToNode);
}

/** 将扁平节点列表组装为嵌套树 */
export function buildNodeTree(flatNodes) {
  const map = new Map();
  const roots = [];
  for (const n of flatNodes) {
    map.set(n.id, { ...n, children: [] });
  }
  for (const node of map.values()) {
    if (node.parentId != null && map.has(node.parentId)) {
      map.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/** 树 CRUD */
export const treeRepo = {
  list() {
    const rows = getDb()
      .prepare(
        `SELECT t.*, (SELECT COUNT(*) FROM nodes n WHERE n.tree_id = t.id) AS node_count
         FROM trees t ORDER BY t.updated_at DESC`
      )
      .all();
    return rows.map((r) => ({
      ...rowToTree(r),
      nodeCount: r.node_count,
    }));
  },

  get(id) {
    const row = getDb().prepare("SELECT * FROM trees WHERE id = ?").get(id);
    return row ? rowToTree(row) : null;
  },

  create({ title, description = "" }) {
    const info = getDb()
      .prepare(
        "INSERT INTO trees (title, description) VALUES (?, ?)"
      )
      .run(title.trim(), description.trim());
    return this.get(info.lastInsertRowid);
  },

  touch(id) {
    getDb()
      .prepare("UPDATE trees SET updated_at = datetime('now','localtime') WHERE id = ?")
      .run(id);
  },

  remove(id) {
    getDb().prepare("DELETE FROM trees WHERE id = ?").run(id);
  },
};

/** 节点 CRUD */
export const nodeRepo = {
  get(id) {
    const row = getDb().prepare("SELECT * FROM nodes WHERE id = ?").get(id);
    return row ? rowToNode(row) : null;
  },

  create({ treeId, parentId = null, question, sortOrder = 0 }) {
    const info = getDb()
      .prepare(
        `INSERT INTO nodes (tree_id, parent_id, question, sort_order)
         VALUES (?, ?, ?, ?)`
      )
      .run(treeId, parentId, question.trim(), sortOrder);
    return this.get(info.lastInsertRowid);
  },

  update(id, fields) {
    const allowed = {
      question: "question",
      answer: "answer",
      summary: "summary",
      summarySource: "summary_source",
    };
    const entries = Object.entries(fields).filter(([k]) => allowed[k]);
    if (!entries.length) return this.get(id);

    const sets = entries.map(([k]) => `${allowed[k]} = ?`);
    const values = entries.map(([, v]) => v);
    values.push(id);
    getDb()
      .prepare(
        `UPDATE nodes SET ${sets.join(", ")}, updated_at = datetime('now','localtime') WHERE id = ?`
      )
      .run(...values);
    return this.get(id);
  },

  /** 删除节点（级联删除其全部子树） */
  remove(id) {
    getDb().prepare("DELETE FROM nodes WHERE id = ?").run(id);
  },

  /** 指定父节点下的最大 sortOrder */
  maxSortOrder(parentId) {
    const row = getDb()
      .prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM nodes WHERE parent_id = ?")
      .get(parentId);
    return row ? row.m : -1;
  },
};
