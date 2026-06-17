/**
 * Drizzle ORM schema：書籤功能
 * 包含 mock users / articles 表（避免跨檔案 import 依賴）與主要 bookmarks 表
 */
import {
  pgTable,
  serial,
  integer,
  timestamp,
  unique,
  text,
} from "drizzle-orm/pg-core";

// ── mock users 表（演示用；生產環境應從 auth schema 引入）
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});

// ── mock articles 表（演示用；生產環境應從 content schema 引入）
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  // slug 作為人類可讀的唯一識別碼，避免直接暴露數字 ID 於 URL
  slug: text("slug").notNull().unique(),
  author_id: integer("author_id").references(() => users.id, {
    onDelete: "cascade",
  }),
});

// ── 書籤主表
export const bookmarks = pgTable(
  "bookmarks",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    article_id: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    // withTimezone 確保跨時區正確儲存；defaultNow 由 DB 端生成避免時鐘偏移
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // 複合唯一約束：同一使用者對同一文章只能有一筆書籤
    unique("bookmarks_user_article_unique").on(table.user_id, table.article_id),
  ]
);

// ── TypeScript 推導型別
export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;
