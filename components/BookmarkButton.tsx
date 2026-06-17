"use client";

/**
 * BookmarkButton — 書籤切換按鈕元件
 * 依循 I-01 React Component template：樂觀更新 + 錯誤還原 + ARIA 無障礙設計
 */
import { useState } from "react";

export interface BookmarkButtonProps {
  articleId: number;
  initialBookmarked?: boolean;
  articleTitle?: string;
  /** 傳入時顯示書籤數量徽章 */
  bookmarkCount?: number;
}

export default function BookmarkButton({
  articleId,
  initialBookmarked = false,
  articleTitle,
  bookmarkCount,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState<boolean>(initialBookmarked);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // 顯示用的計數（樂觀更新同步調整）
  const [displayCount, setDisplayCount] = useState<number | undefined>(
    bookmarkCount
  );

  const handleToggle = async () => {
    // 防止重複點擊
    if (isLoading) return;

    // 樂觀更新：先即時反映 UI，再等 API 回應
    const previousState = isBookmarked;
    const previousCount = displayCount;
    setIsBookmarked(!isBookmarked);
    if (displayCount !== undefined) {
      setDisplayCount(isBookmarked ? displayCount - 1 : displayCount + 1);
    }
    setIsLoading(true);

    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });

      if (!response.ok) {
        // API 失敗時還原樂觀更新，避免 UI 狀態與後端不一致
        throw new Error(`API error: ${response.status}`);
      }

      const data = (await response.json()) as { bookmarked: boolean };
      // 以 API 回傳值為最終狀態（修正樂觀更新可能的偏差）
      setIsBookmarked(data.bookmarked);
    } catch (error) {
      // 還原至操作前的狀態
      console.error("Bookmark toggle failed:", error);
      setIsBookmarked(previousState);
      setDisplayCount(previousCount);
    } finally {
      setIsLoading(false);
    }
  };

  // 依狀態套用不同視覺樣式：已書籤為藍色填滿，未書籤為灰色淡底
  const baseClasses =
    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const stateClasses = isBookmarked
    ? "bg-blue-500 hover:bg-blue-600 text-white focus-visible:outline-blue-500"
    : "bg-gray-100 hover:bg-gray-200 text-gray-700 focus-visible:outline-gray-400";
  const loadingClasses = isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  const ariaLabel = articleTitle
    ? isBookmarked
      ? `移除「${articleTitle}」的書籤`
      : `將「${articleTitle}」加入書籤`
    : isBookmarked
    ? "移除書籤"
    : "加入書籤";

  return (
    <button
      type="button"
      role="button"
      aria-label={ariaLabel}
      aria-pressed={isBookmarked}
      disabled={isLoading}
      onClick={handleToggle}
      className={`${baseClasses} ${stateClasses} ${loadingClasses}`}
    >
      {/* 書籤圖示：已書籤用實心星號，未書籤用空心星號 */}
      <span aria-hidden="true" className="text-base leading-none">
        {isBookmarked ? "★" : "☆"}
      </span>
      <span>{isBookmarked ? "已書籤" : "書籤"}</span>

      {/* 書籤數量徽章：僅在有傳入計數時顯示 */}
      {displayCount !== undefined && (
        <span
          aria-label={`${displayCount} 人書籤`}
          className={`ml-1 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
            isBookmarked
              ? "bg-blue-400 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {displayCount}
        </span>
      )}
    </button>
  );
}
