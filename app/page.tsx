/**
 * TechBlog 示範首頁 — Server Component
 * 展示 BookmarkButton 元件與樂觀更新互動效果
 * 文章資料為靜態 Mock，不需要 DB 查詢（純 UI 示範用途）
 */
import BookmarkButton from "../components/BookmarkButton";

type MockArticle = {
  id: number;
  title: string;
  author: string;
  tags: string[];
  initialBookmarked: boolean;
};

const mockArticles: MockArticle[] = [
  {
    id: 1,
    title: "Claude Code 實戰：用 AI 加速開發流程",
    author: "Peter Yang",
    tags: ["AI", "開發工具"],
    initialBookmarked: false,
  },
  {
    id: 2,
    title: "Next.js 16 App Router 完整指南",
    author: "Jane Chen",
    tags: ["Next.js", "React"],
    initialBookmarked: true,
  },
  {
    id: 3,
    title: "PostgreSQL 效能調優：索引策略詳解",
    author: "Tom Liu",
    tags: ["資料庫", "效能"],
    initialBookmarked: false,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頁首 */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center gap-3">
          <span className="text-2xl font-bold text-blue-600 tracking-tight">
            TechBlog
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-sm text-gray-500">工程師的技術分享平台</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 示範說明 Banner */}
        <div className="mb-8 rounded-lg bg-blue-50 border border-blue-200 px-5 py-4">
          <p className="text-sm text-blue-800 font-medium">
            🎯 這是使用 Prompt Library 模板建立的 Bookmark 功能示範
          </p>
          <p className="mt-1 text-xs text-blue-600">
            本頁面展示 BookmarkButton 元件如何整合至文章列表，Mock 資料直接定義於 Server Component，無需資料庫查詢。
          </p>
        </div>

        {/* 文章區塊標題 */}
        <h2 className="text-xl font-semibold text-gray-800 mb-5">精選文章</h2>

        {/* 文章格線：手機單欄、平板雙欄、桌面三欄 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockArticles.map((article) => (
            <article
              key={article.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200"
            >
              {/* 標籤列 */}
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 文章標題 */}
              <h3 className="text-base font-semibold text-gray-900 leading-snug line-clamp-2">
                {article.title}
              </h3>

              {/* 作者 */}
              <p className="text-sm text-gray-500">
                作者：{article.author}
              </p>

              {/* 書籤按鈕（Client Component，含樂觀更新） */}
              <div className="mt-auto pt-2">
                <BookmarkButton
                  articleId={article.id}
                  initialBookmarked={article.initialBookmarked}
                  articleTitle={article.title}
                />
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* 頁尾說明 */}
      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-5 text-center text-xs text-gray-400">
          BookmarkButton 元件支援 Optimistic Update — 點擊立即反映 UI，API 確認後同步
        </div>
      </footer>
    </div>
  );
}
