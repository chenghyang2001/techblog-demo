/**
 * POST /api/bookmarks — 切換書籤狀態
 * 演示用途：userId 硬編碼為 1；生產環境改從 NextAuth session 讀取
 */
import { toggleBookmark } from "../../../lib/bookmarks";

// 演示用 CORS header，生產環境應限縮為實際 origin
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

export async function POST(request: Request): Promise<Response> {
  try {
    // 解析請求 body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 確認 body 是 JSON 物件（防止 null / 陣列 / 純量被 destructure 時靜默出錯）
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return Response.json(
        { error: "Request body must be a JSON object" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 驗證 articleId：必須存在且為正整數
    const { articleId } = body as { articleId?: unknown };
    if (
      articleId === undefined ||
      articleId === null ||
      typeof articleId !== "number" ||
      !Number.isInteger(articleId) ||
      articleId <= 0
    ) {
      return new Response(
        JSON.stringify({
          error: "articleId is required and must be a positive integer",
        }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Demo: replace with NextAuth session userId in production
    const userId = 1;

    const bookmarked = await toggleBookmark(userId, articleId);

    return new Response(
      JSON.stringify({
        bookmarked,
        articleId,
        message: bookmarked
          ? "Article bookmarked successfully"
          : "Bookmark removed successfully",
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    // 不洩漏內部錯誤細節給客戶端，避免資訊洩露
    console.error("POST /api/bookmarks error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * OPTIONS /api/bookmarks — 回應瀏覽器跨來源 CORS preflight 請求
 * 若缺少此 handler，非同源的 POST 會先送出 OPTIONS 並收到 405，導致請求失敗。
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
