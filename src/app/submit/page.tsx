"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useBulkStore } from "@/store/bulk-store";
import type { SubmissionProgress } from "@/lib/meta-types";

export default function SubmitPage() {
  const { data: session, status } = useSession();
  const {
    campaigns,
    selectedAdAccountId,
    selectedPageId,
    selectedExistingCampaignId,
    imageFiles,
    submissionProgress,
    isSubmitting,
    setSubmissionProgress,
    setIsSubmitting,
  } = useBulkStore();

  const [error, setError] = useState("");

  if (status === "loading") {
    return (
      <div className="py-20 text-center">
        <p className="text-[var(--muted-foreground)]">読み込み中...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-20 text-center">
        <p className="text-[var(--muted-foreground)]">ログインしてください。</p>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-[var(--muted-foreground)]">
          入稿データがありません。
        </p>
        <Link
          href="/builder"
          className="mt-2 inline-block text-[var(--primary)] hover:underline"
        >
          入稿画面へ
        </Link>
      </div>
    );
  }

  // Check needed image filenames from campaigns
  const neededImages = new Set<string>();
  for (const c of campaigns) {
    for (const as2 of c.adSets) {
      for (const ad of as2.ads) {
        if (ad.imageFilename) neededImages.add(ad.imageFilename);
      }
    }
  }
  const missingImages = Array.from(neededImages).filter(
    (name) => !imageFiles.has(name)
  );

  async function handleSubmit() {
    setIsSubmitting(true);
    setError("");

    try {
      // Re-check images from store at submit time
      const currentImages = useBulkStore.getState().imageFiles;

      const formData = new FormData();
      formData.append("adAccountId", selectedAdAccountId);
      formData.append("pageId", selectedPageId);
      if (selectedExistingCampaignId) {
        formData.append("existingCampaignId", selectedExistingCampaignId);
      }
      formData.append("campaigns", JSON.stringify(campaigns));

      // Attach image files
      for (const [filename, file] of currentImages) {
        formData.append(`image:${filename}`, file);
      }

      const response = await fetch("/api/meta/submit-bulk", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("送信に失敗しました");
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("ストリームの読み取りに失敗");

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const progress: SubmissionProgress = JSON.parse(data);
              setSubmissionProgress(progress);
            } catch {
              // Skip malformed data
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  const progress = submissionProgress;
  const progressPercent = progress
    ? Math.round(
        ((progress.completedItems + progress.failedItems) /
          progress.totalItems) *
          100
      )
    : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">一括送信</h2>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Missing images warning */}
      {missingImages.length > 0 && !progress && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="mb-2 font-medium text-yellow-800">
            画像ファイルが読み込まれていません（{missingImages.length}件）
          </p>
          <p className="mb-3 text-sm text-yellow-700">
            ページを更新すると画像データが失われます。入稿画面に戻って画像を再アップロードしてください。
          </p>
          <Link
            href="/builder"
            className="inline-block rounded bg-yellow-600 px-4 py-2 text-sm text-white hover:opacity-90"
          >
            入稿画面に戻る
          </Link>
        </div>
      )}

      {/* Pre-submit summary */}
      {!progress && (
        <div className="rounded-lg border bg-white p-6 text-center">
          <p className="mb-2 text-lg font-medium">
            {campaigns.length}キャンペーン、
            {campaigns.reduce((s, c) => s + c.adSets.length, 0)}広告セット、
            {campaigns.reduce(
              (s, c) =>
                s + c.adSets.reduce((s2, as2) => s2 + as2.ads.length, 0),
              0
            )}
            広告を送信します
          </p>
          <p className="mb-2 text-sm text-[var(--muted-foreground)]">
            すべての広告はPAUSED（停止中）状態で作成されます。
          </p>
          <p className="mb-4 text-xs text-[var(--muted-foreground)]">
            画像ファイル: {imageFiles.size}件読み込み済み
          </p>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || missingImages.length > 0}
            className="rounded-lg bg-[var(--primary)] px-8 py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "送信中..." : "送信開始"}
          </button>
        </div>
      )}

      {/* Progress */}
      {progress && (
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="rounded-lg border bg-white p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">{progress.currentStep}</span>
              <span className="text-[var(--muted-foreground)]">
                {progressPercent}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-2 flex gap-4 text-sm">
              <span className="text-green-600">
                成功: {progress.completedItems}
              </span>
              <span className="text-red-600">
                失敗: {progress.failedItems}
              </span>
              <span className="text-[var(--muted-foreground)]">
                合計: {progress.totalItems}
              </span>
            </div>
          </div>

          {/* Item list */}
          <div className="rounded-lg border bg-white">
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">種類</th>
                    <th className="px-4 py-2 text-left">名前</th>
                    <th className="px-4 py-2 text-left">状態</th>
                    <th className="px-4 py-2 text-left">Meta ID</th>
                    <th className="px-4 py-2 text-left">エラー</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.items.map((item, i) => (
                    <tr
                      key={i}
                      className={
                        item.status === "error"
                          ? "bg-red-50"
                          : item.status === "success"
                          ? "bg-green-50"
                          : ""
                      }
                    >
                      <td className="px-4 py-2">
                        {item.type === "campaign" && "キャンペーン"}
                        {item.type === "adset" && "広告セット"}
                        {item.type === "image" && "画像"}
                        {item.type === "creative" && "クリエイティブ"}
                        {item.type === "ad" && "広告"}
                      </td>
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2">
                        {item.status === "pending" && (
                          <span className="text-gray-400">待機中</span>
                        )}
                        {item.status === "in_progress" && (
                          <span className="text-blue-600">処理中</span>
                        )}
                        {item.status === "success" && (
                          <span className="text-green-600">成功</span>
                        )}
                        {item.status === "error" && (
                          <span className="text-red-600">失敗</span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">
                        {item.metaId || "-"}
                      </td>
                      <td className="px-4 py-2 text-red-600">
                        {item.error || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export results */}
          {progress.currentStep === "完了" && (
            <div className="flex gap-4">
              <button
                onClick={() => {
                  const csv = [
                    "type,name,status,meta_id,error",
                    ...progress.items.map(
                      (item) =>
                        `${item.type},"${item.name}",${item.status},${
                          item.metaId || ""
                        },"${item.error || ""}"`
                    ),
                  ].join("\n");
                  const blob = new Blob(["\uFEFF" + csv], {
                    type: "text/csv;charset=utf-8",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `submission_results_${Date.now()}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
              >
                結果をCSVでダウンロード
              </button>
              <Link
                href="/builder"
                className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
              >
                新しい入稿を開始
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
