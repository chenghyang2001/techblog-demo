/**
 * getUserBookmarks 特徵測試（Characterization Tests）
 *
 * 目的：E-01 Phase 2「保護」— 在重構前用測試鎖住「現有」行為，
 * 而非「應該」的行為。任何一條測試變紅，代表行為被改動，需確認是否預期。
 *
 * 策略：mock `../src/db` 模組，攔截 `db.select().from().where().orderBy().limit()`
 * 呼叫鏈，捕捉傳給 `.limit()` 的值並回傳可控資料 —— 全程不連真實資料庫。
 * 不 mock drizzle-orm 與 schema：conditions 會建出真實 SQL 物件，對本測試無害。
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock 會被 hoist 到檔案頂端，先於 import 執行；
// 因此 mock factory 需要的共享狀態必須用 vi.hoisted 一併提升，否則會踩到 TDZ。
const h = vi.hoisted(() => {
  const limitSpy = vi.fn(); // 捕捉傳給 .limit(n) 的 n
  const whereSpy = vi.fn(); // 斷言 .where(conditions) 確實被呼叫
  const state = { rows: [] as unknown[] }; // 可變回傳列，逐案調整

  // 鏈式物件：from/where/orderBy 回傳自己，limit 結束鏈並回傳 thenable
  const chain: Record<string, unknown> = {};
  chain.from = () => chain;
  chain.where = (...args: unknown[]) => {
    whereSpy(...args);
    return chain;
  };
  chain.orderBy = () => chain;
  // 受測函式對 .limit() 的回傳值做 await，故回傳 Promise 模擬 Drizzle thenable
  chain.limit = (n: number) => {
    limitSpy(n);
    return Promise.resolve(state.rows);
  };

  return { limitSpy, whereSpy, state, chain };
});

// 受測碼內部 `import { db } from "../db"` 解析為 <root>/src/db，
// 與此處 mock 的 "../src/db" 為同一解析路徑，mock 生效。
vi.mock("../src/db", () => ({ db: { select: () => h.chain } }));

// 受測函式須在 vi.mock 之後 import（hoist 後 mock 已就位）
import { getUserBookmarks } from "../src/lib/bookmarks";

beforeEach(() => {
  // 每案獨立：清空 spy 呼叫記錄與回傳列，避免測試間共享狀態互相污染
  h.limitSpy.mockClear();
  h.whereSpy.mockClear();
  h.state.rows = [];
});

describe("getUserBookmarks 特徵測試", () => {
  it("特徵 A — 省略 limit 時套用預設值 20", async () => {
    await getUserBookmarks(1);
    expect(h.limitSpy).toHaveBeenCalledWith(20);
  });

  it("特徵 B — 明確傳入 limit 時原樣下傳給 .limit()", async () => {
    await getUserBookmarks(1, 50);
    expect(h.limitSpy).toHaveBeenCalledWith(50);
  });

  // 特徵 2：Phase 3 已加 limit 封頂上限 100，超大值被夾到 MAX_PAGE_SIZE
  it("特徵 C — 超大 limit 封頂到上限 100", async () => {
    await getUserBookmarks(1, 999999);
    expect(h.limitSpy).toHaveBeenCalledWith(100);
  });

  it("特徵 D — 回傳值原樣透傳，且 where 被呼叫一次", async () => {
    h.state.rows = [{ id: 5 }, { id: 3 }];
    const result = await getUserBookmarks(1, 20, 5);
    expect(result).toEqual([{ id: 5 }, { id: 3 }]);
    expect(h.whereSpy).toHaveBeenCalledTimes(1);
  });

  // 特徵 3：limit ≤ 0 封到下限 1，避免 Postgres LIMIT 負數/零拋錯
  it("特徵 E — limit ≤ 0 封頂到下限 1", async () => {
    await getUserBookmarks(1, 0);
    expect(h.limitSpy).toHaveBeenCalledWith(1);

    h.limitSpy.mockClear();

    await getUserBookmarks(1, -5);
    expect(h.limitSpy).toHaveBeenCalledWith(1);
  });
});
