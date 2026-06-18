/**
 * 資料庫連線：Neon Serverless PostgreSQL + Drizzle ORM
 * 懶初始化：Next.js build 階段執行模組時不建立連線，
 * 首次查詢時才初始化（DATABASE_URL 缺失時在執行期報錯）。
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema/bookmarks";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDb | null = null;

export function getDb(): DrizzleDb {
  if (_db) return _db;
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "Missing DATABASE_URL environment variable. Copy .env.local.example to .env.local and fill in your Neon connection string."
    );
  }
  const sql = neon(process.env.DATABASE_URL);
  _db = drizzle(sql, { schema });
  return _db;
}

// Proxy 讓現有的 `import { db }` 繼續運作，無需修改 lib/bookmarks.ts
export const db = new Proxy({} as DrizzleDb, {
  get(_, prop: string | symbol) {
    return Reflect.get(getDb(), prop);
  },
});
