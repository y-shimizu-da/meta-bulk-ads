"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useBulkStore } from "@/store/bulk-store";

export default function ReviewPage() {
  const { data: session, status } = useSession();
  const { campaigns, imageFiles } = useBulkStore();

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

  const totalAdSets = campaigns.reduce((s, c) => s + c.adSets.length, 0);
  const totalAds = campaigns.reduce(
    (s, c) => s + c.adSets.reduce((s2, as2) => s2 + as2.ads.length, 0),
    0
  );

  // Check for missing images
  const missingImages: string[] = [];
  for (const campaign of campaigns) {
    for (const adSet of campaign.adSets) {
      for (const ad of adSet.ads) {
        if (ad.imageFilename && !imageFiles.has(ad.imageFilename)) {
          missingImages.push(ad.imageFilename);
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">レビュー & プレビュー</h2>
        <Link
          href="/submit"
          className={`rounded px-4 py-2 text-sm text-white ${
            missingImages.length > 0
              ? "cursor-not-allowed bg-gray-400"
              : "bg-[var(--primary)] hover:opacity-90"
          }`}
          onClick={(e) => {
            if (missingImages.length > 0) e.preventDefault();
          }}
        >
          送信画面へ
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[var(--primary)]">
            {campaigns.length}
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">キャンペーン</p>
        </div>
        <div className="rounded-lg border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[var(--primary)]">
            {totalAdSets}
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">広告セット</p>
        </div>
        <div className="rounded-lg border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[var(--primary)]">
            {totalAds}
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">広告</p>
        </div>
        <div className="rounded-lg border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[var(--primary)]">
            {imageFiles.size}
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">画像</p>
        </div>
      </div>

      {/* Warnings */}
      {missingImages.length > 0 && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <p className="font-medium text-yellow-800">
            以下の画像ファイルが見つかりません：
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-yellow-700">
            {[...new Set(missingImages)].map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-yellow-700">
            <Link
              href="/builder"
              className="text-[var(--primary)] hover:underline"
            >
              入稿画面
            </Link>
            で画像をアップロードしてください。
          </p>
        </div>
      )}

      {/* Campaign tree */}
      {campaigns.map((campaign, ci) => (
        <div key={ci} className="rounded-lg border bg-white">
          <div className="border-b p-4">
            <h3 className="font-bold">{campaign.name}</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              目的: {campaign.objective} / 日予算: {campaign.dailyBudget} /
              ステータス: {campaign.status}
            </p>
          </div>

          {campaign.adSets.map((adSet, asi) => (
            <div key={asi} className="border-b last:border-b-0">
              <div className="bg-gray-50 px-4 py-2">
                <p className="text-sm font-medium">{adSet.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  最適化: {adSet.optimizationGoal} / 国:{" "}
                  {adSet.targeting.geo_locations.countries.join(", ")} / 年齢:{" "}
                  {adSet.targeting.age_min}-{adSet.targeting.age_max}
                </p>
              </div>

              <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
                {adSet.ads.map((ad, ai) => (
                  <div
                    key={ai}
                    className="overflow-hidden rounded-lg border shadow-sm"
                  >
                    {/* Ad preview card */}
                    <div className="aspect-square bg-gray-200 p-4">
                      {ad.imageFilename && imageFiles.has(ad.imageFilename) ? (
                        <img
                          src={URL.createObjectURL(
                            imageFiles.get(ad.imageFilename)!
                          )}
                          alt={ad.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
                          {ad.imageFilename || "画像なし"}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {ad.name}
                      </p>
                      <p className="mt-1 font-medium">{ad.headline}</p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {ad.bodyText}
                      </p>
                      {ad.description && (
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          {ad.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {ad.linkUrl}
                        </span>
                        <span className="rounded bg-[var(--primary)] px-2 py-0.5 text-xs text-white">
                          {ad.ctaType.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
