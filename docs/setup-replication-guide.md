# 把 email-automation-demo 的「設定」快速套到本專案

> 目的：說明 email-automation-demo 那套「開發設定 + 任務模式」由哪些部分組成，
> 哪些 techblog-demo 已經免費繼承、哪些要動手，以及如何快速套用。

---

## 1. 「setting」其實是兩層

| 層 | 內容 | 跨專案可攜？ |
|----|------|:---:|
| **流程/慣例層** | CLAUDE.md 六支柱手冊、三 agent 鐵律、arch-deck 文件+圖表 | ✅ 與技術棧無關 |
| **功能層** | 多管道輸出 pipeline（Notion / Calendar / Telegram / LINE） | ⚠️ 需依本專案技術棧重寫 |

---

## 2. 現況盤點：哪些已經有、哪些要補

| 組成 | 來源 | techblog-demo 現況 | 要做什麼 |
|------|------|------|---------|
| **三 agent 鐵律**（code-writer → code-qa → code-reviewer）| `~/.claude/instructions/writer-qa-iron-rule.md`（**全域**）| ✅ 已自動生效 | 無 — 任何 repo 改 `.ts`/`.py`/`.sql`/`.yml` 等都會觸發 |
| **CLAUDE.md 六支柱**（Overview / Tech Stack / Architecture / Conventions / Testing / Constraints）| 專案各自的 `CLAUDE.md` | ✅ 已是此格式 | 無 — 新增模組時順手更新對應章節 |
| **程式碼品質/防禦規則**（錯誤處理、無硬編碼路徑、機密走環境變數）| `~/.claude/instructions/code-quality.md`（**全域**）| ✅ 已自動生效 | 無 |
| **arch-deck 三件套**（`docs/architecture.md` + Mermaid 圖 + PPTX）| `arch-deck` skill | ❌ 沒有 | 跑一次 `/arch-deck`（見下方 §3） |
| **多管道輸出功能** | email-demo 的 `*_creator.py` / `*_briefer.py` | ❌ 沒有 | 依 Next.js/TS 重寫（見下方 §4） |

> 重點：流程層**幾乎都是全域繼承**，不用複製。真正要動手的只有 arch-deck 與功能層。

---

## 3. 快速套 arch-deck（文件 + 圖表 treatment）

在本專案根目錄對 Claude 說：

```
/arch-deck
```

它會三階段產出（與 email-automation-demo 完全相同的 treatment）：

1. **`docs/architecture.md`** — 六節架構文件（系統概觀 / 組件與角色 / 互動模式 / 資料流 / ADR / 部署拓撲），
   逐檔查證本專案實際的 Next.js App Router + Drizzle + Neon 架構。
2. **`mermaid/<日期>-techblog/`** — 心智圖 / 流程圖 / 系統架構圖 / 序列圖 / 狀態圖（.mmd + 渲染 PNG）。
3. **PPTX 合輯** — 封面 + 每張圖一頁。

產出會跟著 repo 走，並自動更新 CLAUDE.md 目錄樹。

---

## 4. 「similar task」：email 的多管道輸出 → 部落格的對應版本

email-automation-demo 的招牌任務是「**一份內容 → 分發到多個外部管道**」：

```
收信 → 過濾 → AI 摘要 → ┬─ Notion 任務卡片
                        ├─ Google Calendar 全天事件（有截止日才建）
                        └─ Telegram + LINE 晨報（雙管道）
```

對應到 techblog（部落格）最自然的類比是「**新文章發布 → 多管道通知/分發**」：

```
新文章發布 → （可選 AI 摘要）→ ┬─ Notion 內容追蹤條目
                              ├─ Google Calendar「社群推廣」提醒事件
                              └─ Telegram + LINE 發布通知（雙管道）
```

### 可沿用 email-demo 的設計原則（與技術棧無關）

- **多輸出管道一律「選填 + 失敗隔離」**：缺對應環境變數即略過；單一管道失敗不影響其他與整體流程。
- **冪等**：同一篇文章不重複通知（用已通知清單去重，類比 email 的 `processed_ids`）。
- **機密走環境變數**：`TELEGRAM_BOT_TOKEN` / `LINE_CHANNEL_ACCESS_TOKEN` / `NOTION_API_KEY` 等不硬編碼。
- **LINE 用 Messaging API push**（非已停用的 LINE Notify）；重試帶冪等 key。
- **Calendar 全天事件 `end.date` = 目標日 +1 天**（Google exclusive 規則）。

### 與 email-demo 的差異（因技術棧不同）

| 面向 | email-automation-demo | techblog-demo（本專案） |
|------|----------------------|------------------------|
| 語言 | Python | TypeScript |
| 觸發 | GitHub Actions 排程（每日 07:30）| 文章發布事件（API route）或排程腳本 |
| 通路實作 | `*_creator.py` / `*_briefer.py` 各模組 | `lib/notifiers/*.ts` 模組 + API route 或 `scripts/*.ts` |
| HTTP | `requests` | 原生 `fetch` |
| 觸發點 | `run_briefing.py` 協調器 | `app/api/publish/route.ts` 或 `scripts/notify-new-post.ts` |

### 實作骨架（待確認後由三 agent 鐵律產出）

```
lib/notifiers/
├── telegram.ts      # sendTelegram(message)
├── line.ts          # sendLine(message)（X-Line-Retry-Key 冪等）
├── notion.ts        # createNotionEntry(post)
├── calendar.ts      # createCalendarEvent(post)（有目標日才建）
└── index.ts         # notifyAllChannels(post)：選填 + 失敗隔離彙整
app/api/publish/route.ts  # POST：收文章 → notifyAllChannels（含 OPTIONS handler）
```

---

## 5. 一頁總結：最快複製步驟

1. **流程層**：什麼都不用做（三 agent 鐵律 + 慣例 + CLAUDE.md 格式皆已就緒）。
2. **文件層**：跑 `/arch-deck` → 得到 architecture.md + Mermaid + PPTX。
3. **功能層**：確認「新文章發布通知」的觸發方式（API route vs 排程腳本）與要哪幾個管道 →
   走 code-writer → code-qa →（視需要）code-reviewer 產出 `lib/notifiers/*`。
4. **環境變數**：在 `.env.local.example` 補上各管道 token（選填），實際值放 `.env.local`（git 忽略）。
