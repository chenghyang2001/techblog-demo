# Session 1 — techblog-demo 架構交付 + 提示詞範本三件套（PDF / EPUB / 互動 App）

**日期**：2026-06-18
**機器**：NB00547（公司機 B00332）
**分支**：main

---

## 完成事項

### A. techblog-demo 本體（已全部 commit + Vercel 自動部署）

- **架構三件套**（`/arch-deck`，commit `d385157`）：`docs/architecture.md`（六節：概觀/組件/互動/資料流/ADR/部署）+ 5 張 Mermaid 圖（心智圖/流程圖/系統架構/序列/狀態）+ PPTX 合輯，圖表落在 `mermaid/20260618-techblog-架構/`。
- **修正 CLAUDE.md**（`5ec5eb8`）：route.ts 實際只有 `POST + OPTIONS`，**無 GET**，文件原描述有誤已校正（以程式碼為 ground truth）。
- **站名變更**（`7569eed`）：`layout.tsx` 分頁標題 + `page.tsx` 頁首改為「楊政憲-TechBlog」。
- **src/ 重構**（`94825ce`）：所有 source 從 root 搬進 `src/`（Next.js src/ 慣例）；同步更新 `drizzle.config.ts` schema 路徑與 `tsconfig.json` 的 `@/*` alias。原使用者要求建 `code/` 資料夾，因 Next.js App Router 僅支援 root 或 `src/`，經 AskUserQuestion 後改用 `src/`。
- **E-02 DRY 重構**（`2137c67`）：抽出 `byUserAndArticle()` 複合鍵述詞 helper，讀寫路徑共用單一真相來源。
- **E-01 三步法**（`1afab2a`）：`getUserBookmarks` 加 limit 封頂（`MAX_PAGE_SIZE=100`、下限 1、`Math.trunc`）；新增 Vitest 特徵測試（`__tests__/bookmarks.test.ts` 5 支，`vi.hoisted`+`vi.mock` 模擬 Drizzle chain）。

### B. Vercel 部署確認（存入記憶）

- 確認 app **已上線**：<https://techblog-demo.vercel.app>（HTTP 200），main 每次 push 由 vercel[bot] 自動部署。
- 部署綁定在 Vercel 雲端，本機無 `.vercel` 資料夾（gitignored，部署是在家用 PC 設定的）。
- 端對端驗證 production 書籤 API：INSERT→true、DELETE→false，`DATABASE_URL` 已設；每次測試後還原 DB。
- 寫入 `memory/vercel-deployment.md` + `MEMORY.md` 索引。

### C. 提示詞範本三件套（kindle-19-claude-code-pro repo，待 commit）

- `/prompt-pick` 套用 E-09 / E-02 / E-01 模板拆解 `bookmarks.ts`。
- **單頁可列印 PDF**：`提示詞模板-150-合輯.pdf`（16 頁，Chrome headless `--print-to-pdf`）+ 中介 `.html`。
- **EPUB**：`epub/提示詞-150-模板合輯.epub`（248KB，手動 zipfile EPUB 2.0、mimetype STORED first、含封面圖、Google Play Books 相容）。

### D. 互動 prompt 瀏覽器（mermaid-viewer repo，已 commit `71beec5` + GitHub Pages 部署）

- 新建 `prompts-150/index.html`：深色主題比照 mermaid-viewer，側欄 A–N 分類、白卡片舞台、自動輪播（5s）、循環全部/本類切換、一鍵複製、鍵盤導航。
- 整合為 index.html 第 12 分頁（iframe `data-src="prompts-150/index.html"`，四處接線：tab/pane/ACTIVE_CLASS/CSS）。
- 線上驗證：Pages build `71beec5` ✅，分頁載入 A-01 卡片正常。

---

## 關鍵技術筆記

- **Next.js App Router 資料夾限制**：source 只能放 root 或 `src/`，不可用自訂資料夾名（如 `code/`）。
- **mermaid-viewer = iframe 容器架構**：每個分頁是 lazy-load 的 `<iframe data-src>`，新內容放同 repo 子目錄 + 加 iframe 即可，一次 push 連 app 帶分頁部署。`data-src` 用顯式 `index.html` 而非目錄（本機 `file://` 不自動找 index）。
- **EPUB 鐵律**：手動 zipfile（非 ebooklib），mimetype 必須 STORED 且第一個；封面需 `cover.xhtml` 進 spine + `<meta name="cover">` + guide。
- **Windows 踩坑**：複雜 Python 用 heredoc 會因特殊字元 `unexpected EOF`，改寫進 `.txt` 跑 `python file.txt`（python 不看副檔名）。Chrome PDF 的 `file://` 路徑用 `cygpath -m` 直接輸出正斜線。
- **GitHub deployments API**：`?sha=` 需完整 40 字元 SHA，短 SHA 查不到；改 `gh api .../deployments?per_page=N` 比對 `.sha[0:7]`。
- **型別驗證授權給 Vercel build**：本機無 node_modules 時 `npx tsc` 會誤抓 tsc@2.0.4；`next build` 本身跑型別檢查，以 Vercel 部署為權威。

---

## 產出檔案

| 檔案 | repo | 狀態 |
|------|------|------|
| `docs/architecture.md` | techblog-demo | committed `d385157` |
| `mermaid/20260618-techblog-架構/`（5 mmd+png+pptx） | techblog-demo | committed `d385157` |
| `src/**`（全部 source 重構） | techblog-demo | committed `94825ce` |
| `src/lib/bookmarks.ts`（E-01/E-02） | techblog-demo | committed `2137c67`/`1afab2a` |
| `__tests__/bookmarks.test.ts` + `vitest.config.ts` | techblog-demo | committed `1afab2a` |
| `memory/vercel-deployment.md` | ~/.claude projects | 已寫入（非版控 auto-memory） |
| `提示詞模板-150-合輯.pdf` / `.html` | kindle-19 | **未 commit** |
| `epub/提示詞-150-模板合輯.epub` | kindle-19 | **未 commit** |
| `prompts-150/index.html` + index.html 分頁 | mermaid-viewer | committed `71beec5` |

---

## HANDOFF（下次 session 優先處理）

### 立即行動

- [ ] 若本 session 結束時 kindle-19-claude-code-pro 仍有未 commit 產出（PDF/HTML/EPUB）→ 下次補 `git add` + commit（本 session Phase 4 已嘗試一併 commit，請以 `git log` 實際狀態為準）。
- [ ] 使用者先前有「繼續用其他模板」（`/prompt-pick`）的待續意圖，被 PDF/EPUB/web-app 任務打斷；下次可主動重啟模板選單。

### 進行中（需接續）

- 無進行中未完成的程式任務。techblog-demo 本體已穩定（型別/build/部署皆綠），三件套交付完成並驗證上線。

### 注意事項

- techblog-demo 的 6 條絕對禁忌（見 CLAUDE.md）：勿在 page.tsx 加 `'use client'`、勿在 route.ts 直接 import `db`、勿移除 OPTIONS handler、勿在 `src/db/index.ts` 頂層呼叫 `neon()`、勿硬編碼路徑、勿把 `DATABASE_URL` 寫進碼。
- `bash.exe.stackdump` 是 Git Bash 殘留垃圾檔，已在 .gitignore 之外，commit 時勿納入（或加進 .gitignore）。
- mermaid-viewer / kindle-19 與 techblog-demo 是三個獨立 repo，commit 時別搞混工作目錄。
