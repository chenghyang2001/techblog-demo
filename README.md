# TechBlog Demo

> 使用 **Claude Code Pro 提示詞模板庫**建立的 Next.js 全端應用示範

這個專案展示了如何用 Prompt Library 模板，在一個真實專案中產生可運行的程式碼。

---

## 使用到的模板

| 步驟 | 模板 | 產出 |
|------|------|------|
| 1 | B-01 新功能鷹架 | 檔案清單規劃 |
| 2 | G-01 Schema 設計 | `db/schema/bookmarks.ts` |
| 3 | G-01 Schema 設計 | `lib/bookmarks.ts`（含 race condition 修正） |
| 4 | H-01 REST API 客戶端封裝 | `app/api/bookmarks/route.ts` |
| 5 | I-01 React 元件生成 | `components/BookmarkButton.tsx` |
| 6 | D-05 API 端點測試 | 測試案例（見 `../claude-code-pro-resources/demo-1/`） |
| 7 | C-01 標準除錯協議 | Race condition 診斷 + 修復 |

---

## 專案結構

```
techblog-demo/
├── app/
│   ├── api/bookmarks/
│   │   └── route.ts          # POST /api/bookmarks（來自 H-01 模板）
│   ├── layout.tsx
│   └── page.tsx              # 示範首頁（3 篇文章 + BookmarkButton）
├── components/
│   └── BookmarkButton.tsx    # 樂觀更新書籤按鈕（來自 I-01 模板）
├── db/
│   ├── index.ts              # Neon PostgreSQL + Drizzle 連線
│   └── schema/
│       └── bookmarks.ts      # 資料庫 Schema（來自 G-01 模板）
├── lib/
│   └── bookmarks.ts          # CRUD 資料存取層（含 race condition 修正）
├── drizzle.config.ts         # Drizzle Kit 遷移設定
└── .env.local.example        # 環境變數範本
```

---

## 快速啟動

### 1. 設定環境變數

```bash
cp .env.local.example .env.local
# 編輯 .env.local，填入 Neon PostgreSQL 連線字串
```

取得 Neon 連線字串：前往 [neon.tech](https://neon.tech) → 建立專案 → Connection String

### 2. 推送資料庫 Schema

```bash
npx drizzle-kit push
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000) 查看示範頁面。

---

## Bookmark 功能說明

### API 端點

```
POST /api/bookmarks
Body: { "articleId": 1 }
Response: { "bookmarked": true, "articleId": 1, "message": "Article bookmarked successfully" }
```

### Race Condition 修正（來自 C-01 模板診斷）

`lib/bookmarks.ts` 的 `toggleBookmark` 使用 `INSERT ... ON CONFLICT DO NOTHING` 而非「先查再寫」：

```typescript
// 錯誤做法（有 race condition）
const exists = await isBookmarked(userId, articleId)  // 兩個請求都通過這裡
if (!exists) await db.insert(...)                      // 兩個都試圖 INSERT → UniqueConstraint 報錯

// 正確做法（PostgreSQL 原子操作）
const inserted = await db.insert(...).onConflictDoNothing().returning({ id: ... })
```

### 樂觀更新（Optimistic Update）

`BookmarkButton.tsx` 在 API 回應前就更新 UI 狀態，失敗時自動還原。

---

## 生產環境注意事項

1. **認證**：`route.ts` 的 `userId = 1` 為 Demo 用途，生產環境替換為 NextAuth `getServerSession()`
2. **CORS**：`Access-Control-Allow-Origin: *` 需限縮為特定 origin
3. **Transaction**：高並發場景需切換 `drizzle-orm/neon-serverless` WebSocket transport

---

## 相關資源

- 完整模板庫：`../prompt-library/`
- 模板使用示範：`../demo-1/`
- 填值範例：`../prompt-library-with-dummy-example-value/`
