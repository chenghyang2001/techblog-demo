@AGENTS.md

# techblog-演練-網站 — AI 專案入職手冊

> 第三章六大核心支柱格式。一次寫入，全局載入。

---

## 1. Project Overview（專案目標與受眾定義）

**專案名稱**：techblog-演練-網站

**目的**：示範《Claude Code Pro》書籍附錄提示詞範本（Appendix A）的實際產出成果。以書籤（Bookmark）功能為核心，展示 Next.js 16 App Router + Drizzle ORM + Neon PostgreSQL 全端整合流程。

**目標受眾**：

- 閱讀《Claude Code Pro》的開發者，想看「提示詞範本真的能生出什麼」
- 學習 Next.js 16 App Router 的工程師

**目前實作範圍**：

- 首頁：3 篇模擬文章卡片 + 書籤按鈕（Optimistic Update）
- API：`POST /api/bookmarks`（切換書籤）+ `OPTIONS`（CORS preflight）。注意：**無 GET endpoint** — 列表查詢函式 `getUserBookmarks` 已實作於 `src/lib/bookmarks.ts`，但尚未對外暴露為路由
- DB schema：users / articles / bookmarks 三張表（Neon PostgreSQL）
- Demo 模式：userId = 1 硬編碼，無真實登入系統

---

## 2. Tech Stack（核心技術棧與精確版本號）

| 技術 | 版本 | 備註 |
|------|------|------|
| Next.js | 16.2.6 | App Router，**不是 Pages Router** |
| React | 19.2.4 | Server Components 為主 |
| TypeScript | 5.x | strict mode |
| Tailwind CSS | 4.x | PostCSS 配置 |
| Drizzle ORM | 0.45.x | neon-http transport |
| @neondatabase/serverless | 1.1.x | neon-http，不支援 multi-statement transaction |
| drizzle-kit | 0.31.x | schema push / migration |

**執行方式**：

```bash
# 開發
npm run dev          # http://localhost:3000

# 建置（需有效 DATABASE_URL）
npm run build

# 測試（Vitest，不連真實 DB）
npm test                          # 跑全部
npx vitest run __tests__/bookmarks.test.ts   # 跑單一檔
npx vitest                        # watch 模式

# DB schema 推送
npx drizzle-kit push
```

**環境變數**（`.env.local`）：

```
DATABASE_URL=postgresql://...  # Neon PostgreSQL 連線字串
```

---

## 3. Architecture（資料夾結構與設計模式）

```
techblog-演練-網站/
├── src/                      # 所有 source 集中於此（Next.js src/ 慣例）
│   ├── app/
│   │   ├── page.tsx          # Server Component：首頁文章列表
│   │   ├── layout.tsx        # 根 layout
│   │   └── api/bookmarks/
│   │       └── route.ts      # REST API：POST + OPTIONS（無 GET）
│   ├── components/
│   │   └── BookmarkButton.tsx # Client Component：Optimistic Update
│   ├── db/
│   │   ├── index.ts          # Lazy init + Proxy export（避免 build 時拋錯）
│   │   └── schema/
│   │       └── bookmarks.ts  # Drizzle pgTable 定義
│   └── lib/
│       └── bookmarks.ts      # DB 操作邏輯（toggleBookmark / getUserBookmarks）
├── docs/
│   └── architecture.md       # 系統架構文件（arch-deck Phase 1 產出）
├── mermaid/
│   └── 20260618-techblog-架構/  # Mermaid 圖表合輯（mmd/ + png/ + .pptx）
└── drizzle.config.ts         # Drizzle Kit 設定（schema 指向 ./src/db/...）
```

**設計模式**：

- Server Component 負責資料讀取，Client Component 僅負責互動（BookmarkButton）
- API route 統一處理 auth 驗證、參數驗證（400）、錯誤回應（500 不洩漏細節）
- DB export 用 Lazy Init + Proxy：`neon()` 只在第一次查詢時呼叫，避免 Next.js build 期間拋錯

---

## 4. Code Conventions（程式碼撰寫慣例）

- **Server vs Client**：預設 Server Component；只有需要 `useState`/`useEffect`/事件處理才加 `'use client'`
- **API 回應格式**：`{ data }` 成功 / `{ error: "..." }` 失敗（不洩漏 stack trace 或 SQL）
- **DB 查詢**：一律透過 `src/lib/bookmarks.ts` 的函式，不在 route.ts 直接呼叫 `db`
- **錯誤處理**：try/catch 包住所有 DB 操作；catch 區塊 `console.error` + 回傳 500
- **Null 檢查**：用 `=== undefined` / `=== null`，不用 `!value`（避免 0 / "" 誤判）
- **Cursor pagination**：`ORDER BY` 欄位必須與 `WHERE < cursor` 欄位一致（目前用 `id`）
- **非同步**：一律 `async/await`，不用 `.then().catch()` 鏈
- **命名**：元件 PascalCase、函式/變數 camelCase、DB 欄位 snake_case（Drizzle 慣例）

---

## 5. Testing Approach（測試框架與執行規範）

**框架**：Vitest（node 環境，設定見 `vitest.config.ts`）。測試檔放 `__tests__/`，**不**混在 `src/` 內。

| 驗證層 | 方法 |
|--------|------|
| 單元/特徵測試 | `npm test`（= `vitest run`）。現有 `__tests__/bookmarks.test.ts` 是 `getUserBookmarks` 的**特徵測試（characterization tests）**：用 `vi.mock("../src/db")` 攔截 Drizzle 鏈式呼叫、捕捉傳給 `.limit()` 的值，**全程不連真實 DB** |
| 型別 | `npx tsc --noEmit`（無 node_modules 時可能誤抓舊版 tsc；以 `next build` 自帶型別檢查為準） |
| Build | `npm run build` — 必須乾淨通過 |
| 手動 smoke | `npm run dev` → 瀏覽器點書籤按鈕確認狀態切換 |
| API | `curl -X POST http://localhost:3000/api/bookmarks -H 'Content-Type: application/json' -d '{"articleId":1}'`（無 GET handler，勿用 GET 驗證） |

**改 `src/lib/bookmarks.ts` 行為時**：特徵測試會變紅，代表既有行為被改動 — 確認是預期變更後才更新測試，別反射性改測試遷就程式碼。mock 用 `vi.hoisted` 提升共享狀態，避免 TDZ。

---

## 6. Standing Constraints（絕對禁忌與強制規則）

### 🔴 絕對禁止

- **禁止在 Server Component 加 `'use client'`**：`src/app/page.tsx` 是 Server Component，不可改為 Client Component
- **禁止在 API route 直接 import `db` 做 DB 操作**：一律透過 `src/lib/bookmarks.ts` 的函式
- **禁止移除 OPTIONS handler**：`src/app/api/bookmarks/route.ts` 的 OPTIONS 是 CORS preflight 必要項，移除會導致跨域請求失敗
- **禁止在 `src/db/index.ts` 模組頂層呼叫 `neon()`**：會在 `npm run build` 時拋錯（neon-http 在建構期驗證 URL）
- **禁止硬編碼路徑**：不可出現 `C:\Users\...` 等絕對路徑，一律用 `process.env` 或相對路徑
- **禁止把 `DATABASE_URL` 寫進程式碼**：只能從 `process.env.DATABASE_URL` 讀取

### 🟡 強制規範

- cursor pagination 的 `orderBy` 欄位必須與 `WHERE` cursor 欄位一致（目前都用 `id`）
- 新增 API endpoint 必須同時加 OPTIONS handler（CORS）
- DB schema 異動必須跑 `npx drizzle-kit push`，不可手動改 DB
- `BookmarkButton.tsx` 的 Optimistic Update 邏輯（先更新 UI → 失敗才 revert）不可改為先等 API 回應
