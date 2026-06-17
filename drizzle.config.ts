/**
 * Drizzle Kit 資料庫遷移設定
 * 目標：Neon Serverless PostgreSQL（DATABASE_URL 由環境變數提供）
 *
 * 執行遷移：npx drizzle-kit push
 * 生成遷移 SQL：npx drizzle-kit generate
 */
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema/bookmarks.ts",
  out: "./drizzle",
  dbCredentials: {
    // DATABASE_URL 必須在 .env.local 或 Vercel 環境變數中設定
    // 格式：postgresql://user:password@host/database?sslmode=require
    url: process.env.DATABASE_URL!,
  },
});
