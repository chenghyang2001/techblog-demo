import { defineConfig } from "vitest/config";

// 最小 Vitest 設定：node 環境即可（不需 jsdom，受測函式為純資料存取層）
export default defineConfig({
  test: {
    environment: "node",
  },
});
