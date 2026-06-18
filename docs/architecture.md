# techblog-demo — 系統架構文件

**版本基準**：Next.js 16.2.6 / React 19.2.4 / Drizzle ORM 0.45.2（2026-06-18）

> 本文件以實際程式碼查證為準。凡與 `CLAUDE.md` 描述不一致處，以程式碼為 ground truth，並在對應章節標註落差。

---

## 1. 系統概觀

techblog-demo 是一個展示《Claude Code Pro》提示詞範本產出成果的全端小專案，核心功能是文章「書籤」切換。採 Next.js 16 App Router，前端以 Server Component 渲染靜態文章卡片，互動交給單一 Client Component，後端透過一條 REST 端點操作 Neon PostgreSQL。

```
                 瀏覽器（Client）
        ┌──────────────────────────────────┐
        │  Home (Server Component)         │  ← 靜態 Mock 文章，無 DB
        │   └─ BookmarkButton ×3           │  ← 'use client'，樂觀更新
        └─────────────────┬────────────────┘
                          │ fetch POST /api/bookmarks
                          ▼
        ┌──────────────────────────────────┐
        │  src/app/api/bookmarks/route.ts  │  ← 驗證 + CORS + 錯誤處理
        │   POST / OPTIONS                 │
        └─────────────────┬────────────────┘
                          │ toggleBookmark(userId, articleId)
                          ▼
        ┌──────────────────────────────────┐
        │  src/lib/bookmarks.ts (DAL)      │  ← Drizzle 查詢邏輯
        └─────────────────┬────────────────┘
                          │ db (Proxy → lazy neon-http)
                          ▼
        ┌──────────────────────────────────┐
        │  Neon Serverless PostgreSQL      │  ← users / articles / bookmarks
        └──────────────────────────────────┘
```

定位：**教學示範**。無真實登入系統（`userId` 硬編碼為 1），無自動化測試框架，DB 僅在書籤切換路徑被觸發。

---

## 2. 組件與角色

| 層級 | 檔案 | 行數 | 角色 |
|------|------|:---:|------|
| 進入點（前端） | `src/app/page.tsx` | 118 | Server Component；定義 3 篇靜態 Mock 文章並渲染卡片格線（手機單欄 / 平板雙欄 / 桌面三欄） |
| 根 layout | `src/app/layout.tsx` | 33 | HTML 骨架 + Geist 字型；`lang="en"`、全高 flex 容器 |
| 互動元件 | `src/components/BookmarkButton.tsx` | 115 | Client Component（`'use client'`）；樂觀更新 + 失敗還原 + ARIA（`aria-pressed` / `aria-label`） |
| 進入點（後端） | `src/app/api/bookmarks/route.ts` | 89 | REST 端點；**僅 `POST` + `OPTIONS`**（無 `GET`）。負責 JSON 解析、`articleId` 正整數驗證、CORS、500 不洩漏細節 |
| 資料存取層 | `src/lib/bookmarks.ts` | 108 | 4 個 DAL 函式：`toggleBookmark`（已接線）、`isBookmarked` / `getUserBookmarks` / `getBookmarkCount`（已實作但尚未被 route 呼叫） |
| DB 連線 | `src/db/index.ts` | 31 | Lazy Init + `Proxy`；`neon()` 只在首次查詢時呼叫，避免 build 期驗證 URL 拋錯 |
| Schema | `src/db/schema/bookmarks.ts` | 56 | Drizzle `pgTable` 定義 3 張表 + 推導型別 |
| 遷移設定 | `drizzle.config.ts` | 19 | dialect postgresql，schema 指向 bookmarks.ts，`drizzle-kit push` 推送 |
| 框架設定 | `next.config.ts` | 7 | 空白預設設定 |
| 外部服務 | Neon Serverless PostgreSQL | — | 透過 `@neondatabase/serverless` 的 neon-http transport 連線（不支援多語句 transaction） |

### 資料表結構（`src/db/schema/bookmarks.ts`）

| 表 | 關鍵欄位 | 約束 |
|----|---------|------|
| `users` | `id` (serial PK), `name`, `email` | `email` unique |
| `articles` | `id` (serial PK), `title`, `slug`, `author_id` | `slug` unique；`author_id` → users（cascade） |
| `bookmarks` | `id` (serial PK), `user_id`, `article_id`, `created_at` (tz) | 複合唯一 `(user_id, article_id)`；兩外鍵皆 cascade |

---

## 3. 組件互動模式

### 渲染模型（Server / Client 邊界）

```
Server Component (page.tsx) ── 渲染靜態 HTML ──▶ 瀏覽器
        │ 以 props 傳遞 articleId / initialBookmarked
        ▼
Client Component (BookmarkButton) ── useState 管理互動狀態
```

- **邊界規則**：`page.tsx` 預設 Server Component，**禁止**加 `'use client'`；只有需要 `useState` / 事件處理的 `BookmarkButton` 才標記為 Client。

### 狀態管理（BookmarkButton 樂觀更新）

```
點擊 ──▶ 立即翻轉 isBookmarked（樂觀）──▶ setIsLoading(true)
          │
          ├─ fetch POST 成功 ──▶ 以 API 回傳 data.bookmarked 為最終狀態
          └─ fetch 失敗 ──────▶ revert 回 previousState / previousCount
```

三個 state：`isBookmarked`、`isLoading`（防重複點擊）、`displayCount`（可選徽章）。

### 關鍵約束

- **DB 連線懶初始化**：`src/db/index.ts` 用 `Proxy` 包裝，`getDb()` 在首次屬性存取時才呼叫 `neon()`，確保 `npm run build` 期間不因缺 `DATABASE_URL` 而失敗。
- **route 不直接碰 db**：`route.ts` 一律透過 `src/lib/bookmarks.ts` 的函式，不 import `db`。
- **CORS preflight**：`OPTIONS` handler 為跨來源 `POST` 必要項，移除會導致跨域請求收到 405。

---

## 4. 使用者操作觸發的資料流

### 流程 A：載入首頁（無 DB）

```
GET / 
  └─ page.tsx 渲染 mockArticles（靜態陣列）
       └─ 每篇文章掛一個 BookmarkButton（initialBookmarked 來自 Mock）
  ⇒ 完全不觸發資料庫
```

### 流程 B：切換書籤（核心路徑）

```
使用者點 BookmarkButton
  1. 樂觀翻轉 UI 狀態
  2. fetch POST /api/bookmarks  body={ articleId }
       3. route.ts 解析 JSON → 驗證 articleId 為正整數
       4. userId = 1（硬編碼）
       5. toggleBookmark(1, articleId)
            6. INSERT ... onConflictDoNothing().returning()
                 ├─ 有回傳列 ⇒ 新增成功，return true
                 └─ 無回傳列 ⇒ 已存在，DELETE 後 return false
       7. route 回 { bookmarked, articleId, message }, 200
  8. BookmarkButton 以 data.bookmarked 校正最終狀態
  （任一步驟失敗 ⇒ revert 樂觀更新）
```

### 流程 C：錯誤路徑

```
壞 JSON body ──▶ 400 "Invalid JSON body"
非物件 / 陣列 ──▶ 400 "Request body must be a JSON object"
articleId 缺失 / 非正整數 ──▶ 400 "...must be a positive integer"
DB 例外 ──▶ console.error + 500 "Internal server error"（不洩漏細節）
```

---

## 5. 關鍵架構決策（ADR 摘要）

| 決策 | 理由 | 代價 |
|------|------|------|
| DB 連線用 Lazy Init + Proxy | neon-http 在建構期驗證 URL，模組頂層呼叫 `neon()` 會讓 `npm run build` 失敗 | 每次屬性存取多一層 Proxy 間接；錯誤延後到執行期才浮現 |
| `toggleBookmark` 採 INSERT onConflictDoNothing 而非 check-then-act | 高並發下先 SELECT 再 INSERT/DELETE 會有競爭條件（雙重插入 / 重複刪除）；交給 DB 原子操作 | INSERT + DELETE 未包 transaction（neon-http 不支援多語句 transaction），極端並發下仍有殘餘風險 |
| cursor 分頁用 `id DESC` 而非 OFFSET | 大資料集下 OFFSET 效能線性衰退；排序與 WHERE cursor 同欄位避免跳頁 / 漏筆 | 不支援跳頁到任意頁碼 |
| Server / Client Component 明確分層 | 靜態內容走 Server 減少 JS bundle，互動才上 Client | 開發者須謹守邊界，誤加 `'use client'` 會破壞 RSC 優勢 |
| `userId` 硬編碼為 1 | 教學示範，省去 auth 系統 | 非真實多使用者；生產須改接 NextAuth session |

---

## 6. 部署與測試拓撲

```
開發            打包                  發佈              驗證
─────          ─────                ─────             ─────
npm run dev ─▶ npm run build ───▶  Vercel        ─▶  npx tsc --noEmit（0 錯誤）
(:3000)        (需有效            (push main         npm run build（乾淨通過）
               DATABASE_URL)      自動部署)          手動 smoke：點書籤看狀態切換
                                                     curl /api/bookmarks
                  │
                  └─ DB schema：npx drizzle-kit push（不手改 DB）
```

- **環境變數**：`DATABASE_URL`（Neon 連線字串）置於 `.env.local`（本機）/ Vercel Secrets（線上）。
- **測試現況**：無 Jest / Vitest。驗證靠型別檢查 + build + 手動 smoke + curl。若加測試，置於 `__tests__/`。
- **CI/CD**：Vercel 連結 git，push main 自動部署、PR 自動預覽。
