/**
 * 書籤資料存取層（Data Access Layer）
 * 依循 G-01 Schema Design template：cursor-based pagination + race-condition-safe toggle
 */
import { db } from "../db";
import { bookmarks, type Bookmark, type NewBookmark } from "../db/schema/bookmarks";
import { eq, and, desc, count, lt } from "drizzle-orm";

/**
 * 檢查指定使用者是否已書籤某篇文章
 * 直接利用複合唯一索引，O(1) 查詢效率
 */
export async function isBookmarked(
  userId: number,
  articleId: number
): Promise<boolean> {
  const result = await db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(and(eq(bookmarks.user_id, userId), eq(bookmarks.article_id, articleId)))
    .limit(1);

  return result.length > 0;
}

/**
 * 取得使用者的書籤列表（cursor-based 分頁）
 * 使用 cursor（上一頁最後一筆的 created_at）而非 OFFSET，避免大資料集效能衰退
 *
 * @param userId   使用者 ID
 * @param limit    每頁筆數，預設 20
 * @param cursor   游標（上一頁最後一筆書籤的 id），省略時從第一頁開始
 */
export async function getUserBookmarks(
  userId: number,
  limit: number = 20,
  cursor?: number
): Promise<Bookmark[]> {
  // 嚴格比較 undefined：cursor 值為 0 時不應被當成「無 cursor」
  const conditions = cursor !== undefined
    ? and(eq(bookmarks.user_id, userId), lt(bookmarks.id, cursor))
    : eq(bookmarks.user_id, userId);

  // 排序與 cursor 一律使用同一欄位 id DESC，避免 created_at 與 id 不相關導致分頁跳頁或漏筆
  return db
    .select()
    .from(bookmarks)
    .where(conditions)
    .orderBy(desc(bookmarks.id))
    .limit(limit);
}

/**
 * 取得某篇文章的書籤總數
 */
export async function getBookmarkCount(articleId: number): Promise<number> {
  const result = await db
    .select({ total: count() })
    .from(bookmarks)
    .where(eq(bookmarks.article_id, articleId));

  return result[0]?.total ?? 0;
}

/**
 * 切換書籤狀態（race-condition-safe）
 *
 * 關鍵設計：先 INSERT...onConflictDoNothing()，再判斷是否插入成功。
 * 原因：若先 SELECT 後再 INSERT/DELETE（check-then-act），在高並發下
 * 兩個請求可能同時讀到「未書籤」而雙重插入，或同時讀到「已書籤」而重複刪除。
 * onConflictDoNothing 讓資料庫用原子操作解決競爭條件。
 *
 * @returns true  = 已加入書籤（新增）
 *          false = 已移除書籤（刪除）
 */
// Note: INSERT + DELETE are not wrapped in a transaction because neon-http transport
// does not support multi-statement transactions. For production high-concurrency use,
// switch to neon-serverless WebSocket transport and wrap in db.transaction().
export async function toggleBookmark(
  userId: number,
  articleId: number
): Promise<boolean> {
  const newBookmark: NewBookmark = { user_id: userId, article_id: articleId };

  // 嘗試插入；若複合唯一約束衝突則靜默跳過（不拋錯）
  const inserted = await db
    .insert(bookmarks)
    .values(newBookmark)
    .onConflictDoNothing()
    .returning({ id: bookmarks.id });

  if (inserted.length > 0) {
    // 插入成功 → 書籤新增完成
    return true;
  }

  // 插入無效（已存在）→ 刪除書籤
  await db
    .delete(bookmarks)
    .where(
      and(
        eq(bookmarks.user_id, userId),
        eq(bookmarks.article_id, articleId)
      )
    );

  return false;
}
