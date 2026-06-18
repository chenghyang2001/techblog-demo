# Session 2 — 2026-06-18

跨三個工作流的雜項 session：techblog-demo 文件校準、新建 calendar-notify 全域 skill、執行 mmd-gen-20。

## 完成事項

### A. techblog-demo 文件/設定校準

- **CLAUDE.md 修掉 3 處漂移**（對齊實際程式碼）：移除不存在的 `GET /api/bookmarks`（route.ts 實際只有 POST+OPTIONS）、補 Vitest 測試指令、第 5 節從「無測試框架」改寫為 Vitest 特徵測試實況。commit `10b4c19`
- `.gitignore` 加 `*.stackdump`（Git Bash crash dump 不再污染 status）。commit `86c6d4b`
- 建 `.claude/settings.json` 最小骨架（順帶建出 `.claude/` 資料夾）。commit `6b838fa`

### B. 新建 calendar-notify 全域 skill（本 session 主產出）

- `~/.claude/skills/calendar-notify/SKILL.md` + `references/vps-notify.md`。commit `8ff0edd`（chenghyang2001/.claude）
- 功能：建 Google Calendar 事件 + 四管道提醒。管道分工：**Gmail + popup 走 Calendar 原生 overrideReminders**；**Telegram + LINE 走 VPS**。
- VPS 部署耐久參數化 `~/scheduled-notifies/notify.py`（自包含、標準庫、`--message`/`--channels`）。
- **端對端測試通過**（人肉確認 14:45 收到 TG+LINE）。

### C. 真實提醒任務

- Uber Costco 16:05（台北）四管道提醒：Calendar 事件 + VPS `at` job #16（08:05 UTC）。已用修正後寫法重排。

### D. mmd-gen-20 執行

- 輸入 `freelancer-dashboard/doc/claude-code-startup-files.md` → 20 種 Mermaid 圖（4 平行 subagent）+ 20 PNG + 20 頁 PPTX。
- 上傳 Google Drive，改名 `ClaudeCode啟動檔案-20圖合輯.pptx`（本機 + 雲端一致）。

## 關鍵技術筆記（可複用）

- 🔴 **`at` job 的 dash/`source` 陷阱**：`at` 用 `/bin/sh`=dash，dash 無 `source` builtin → 裸 `source ~/.env_vars` exit 127 靜默失敗。**必用 `bash -lc "source ... && ..."`**。症狀：手動 bash 測會過、`at` 卻不送。
- **VPS 是 UTC、台北 UTC+8 無 DST**：排程一律換算 + `atq`/`at -c` 回推驗證。
- 🔴 **rclone（Windows 原生 binary）路徑**：用 `cygpath -w` 給 Windows 路徑；**不要**用 `MSYS_NO_PATHCONV=1`（會讓 rclone 收到 `/c/...` 再自加 `//?/C:/` 變爛路徑）。
- **`git -C <git-bash路徑>` 在此環境失效** → 改用 `cd <path> && git`。
- **Calendar MCP**：用 `mcp__claude_ai_Google_Calendar__create_event`（`mcp__google-docs__createEvent` 無 calendar.events scope）。
- **mmdc 11.14.0**：`architecture-beta` 禁用→`block-beta`；`quadrantChart`/`sankey-beta` 的 CJK→Pillow。

## 產出檔案

| 檔案 | repo | 說明 |
|------|------|------|
| `CLAUDE.md` / `.gitignore` / `.claude/settings.json` | techblog-demo | 文件校準 + 設定骨架（已 push）|
| `skills/calendar-notify/SKILL.md` + `references/vps-notify.md` | ~/.claude | 新 skill（已 push 8ff0edd）|
| `~/scheduled-notifies/notify.py` | VPS | 耐久通知後端（遠端部署）|
| `doc/{mmd,png}/01..20` + `ClaudeCode啟動檔案-20圖合輯.pptx` | freelancer-dashboard | mmd-gen-20 產出（多為 gitignore 的 artifact；PPTX 已上 Drive）|

## HANDOFF（下次 session 優先處理）

### 立即行動

- [ ] 確認 16:05（台北）Uber Costco 四管道提醒實際收到（VPS `at` job #16 @ 08:05 UTC）。
- [ ] 若想讓 mmd-gen-20 輸出進版控：freelancer-dashboard `doc/` 的 PNG/PPTX 目前多被 gitignore，未 commit（刻意，artifact 已在 Drive）。
- [ ] calendar-notify：SKILL 已加「lead 提醒落在過去要跳過」硬規則，但 notify.py 流程未自動實作此 guard，未來短 lead 事件手動注意。

### 進行中（需接續）

- 無重大未完成項。Uber Costco 提醒在 VPS 等待 08:05 UTC 觸發（自跑、不需介入）。

### 注意事項

- 本環境 `git -C` 對 git-bash 路徑失效，一律 `cd && git`。
- VPS 任何 `at`/cron 排程，env 一律 `bash -lc "source ..."` 包；rclone 一律 `cygpath -w`。
