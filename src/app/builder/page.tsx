"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useBulkStore } from "@/store/bulk-store";
import type { CampaignInput, AdSetInput, AdInput } from "@/lib/meta-types";

export default function BuilderPage() {
  const { data: session, status } = useSession();
  const {
    selectedAdAccountId,
    selectedPageId,
    selectedExistingCampaignId,
    addImageFiles,
    imageFiles,
    removeImageFile,
    setCampaigns,
    setSubmissionProgress,
    campaigns,
  } = useBulkStore();

  const [bodyText, setBodyText] = useState("");
  const [headline, setHeadline] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [urlParams, setUrlParams] = useState("utm_source=meta&utm_medium=paid");
  const [dragOver, setDragOver] = useState(false);
  const router = useRouter();

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
        <p className="text-[var(--muted-foreground)]">
          ログインしてください。
        </p>
        <Link
          href="/"
          className="mt-2 inline-block text-[var(--primary)] hover:underline"
        >
          ホームに戻る
        </Link>
      </div>
    );
  }

  if (!selectedAdAccountId || !selectedPageId) {
    return (
      <div className="py-20 text-center">
        <p className="text-[var(--muted-foreground)]">
          広告アカウントとFacebookページを選択してください。
        </p>
        <Link
          href="/"
          className="mt-2 inline-block text-[var(--primary)] hover:underline"
        >
          設定画面へ
        </Link>
      </div>
    );
  }

  function handleFiles(files: FileList | File[]) {
    const imageFileList = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (imageFileList.length > 0) {
      addImageFiles(imageFileList);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleBuild() {
    // Reset previous submission progress
    setSubmissionProgress(null);

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;

    const filenames = Array.from(imageFiles.keys());

    // Build one ad per image, all in one ad set, one campaign
    const ads: AdInput[] = filenames.map((filename) => {
      const adName = filename.replace(/\.[^.]+$/, "");
      // Build full URL with parameters
      const separator = linkUrl.includes("?") ? "&" : "?";
      const creativeParam = `utm_creative=${encodeURIComponent(adName)}`;
      const extraParams = urlParams.trim() ? `&${urlParams.trim()}` : "";
      const fullUrl = `${linkUrl}${separator}${creativeParam}${extraParams}`;

      return {
        name: adName,
        adSetName: "テスト広告セット",
        imageFilename: filename,
        headline,
        bodyText,
        description: "",
        linkUrl: fullUrl,
        ctaType: "LEARN_MORE" as const,
        status: "PAUSED" as const,
      };
    });

    // start_time: tomorrow at 00:00 JST, formatted for Meta API
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const campaignName = "DA‐入稿用キャンペーン";

    const adSet: AdSetInput = {
      name: `広告セット_${dateStr}`,
      campaignName,
      dailyBudget: 2000, // ¥2,000
      optimizationGoal: "LINK_CLICKS",
      billingEvent: "IMPRESSIONS",
      startTime: tomorrow.toISOString(),
      targeting: {
        geo_locations: { countries: ["JP"] },
        age_min: 18,
        age_max: 65,
      },
      status: "PAUSED",
      ads,
    };

    const campaign: CampaignInput = {
      name: campaignName,
      objective: "OUTCOME_TRAFFIC",
      dailyBudget: 0, // Budget at ad set level, not campaign level
      specialAdCategories: [],
      status: "PAUSED",
      adSets: [adSet],
    };

    setCampaigns([campaign]);
    router.push("/submit");
  }

  const isValid =
    imageFiles.size > 0 &&
    bodyText.trim() !== "" &&
    headline.trim() !== "" &&
    linkUrl.trim() !== "";

  const imageEntries = Array.from(imageFiles.entries());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">広告作成</h2>
        {selectedExistingCampaignId && (
          <span className="rounded bg-blue-100 px-3 py-1 text-xs text-blue-700">
            既存キャンペーンに追加
          </span>
        )}
      </div>

      <div className="rounded-lg border bg-white p-6 space-y-6">
        {/* Image upload */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            画像ファイル（複数可）
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`rounded-lg border-2 border-dashed p-8 text-center transition cursor-pointer ${
              dragOver
                ? "border-[var(--primary)] bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <p className="text-sm text-[var(--muted-foreground)]">
              ここに画像をドラッグ＆ドロップ、またはクリックして選択
            </p>
            <p className="mt-1 text-xs text-gray-400">
              JPG, PNG対応 / 複数選択可
            </p>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {/* Image preview list */}
          {imageEntries.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium">
                {imageEntries.length}枚の画像が選択されています
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {imageEntries.map(([filename, file]) => (
                  <ImagePreview
                    key={filename}
                    filename={filename}
                    file={file}
                    onRemove={() => removeImageFile(filename)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ad text */}
        <div>
          <label className="mb-1 block text-sm font-medium">広告文</label>
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            rows={3}
            placeholder="広告の本文テキストを入力..."
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none"
          />
        </div>

        {/* Headline */}
        <div>
          <label className="mb-1 block text-sm font-medium">見出し</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="広告の見出しを入力..."
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none"
          />
        </div>

        {/* Link URL */}
        <div>
          <label className="mb-1 block text-sm font-medium">リンク先URL</label>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none"
          />
        </div>

        {/* URL Parameters */}
        <div>
          <label className="mb-1 block text-sm font-medium">URLパラメータ</label>
          <input
            type="text"
            value={urlParams}
            onChange={(e) => setUrlParams(e.target.value)}
            placeholder="utm_source=meta&utm_medium=paid"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-[var(--primary)] focus:outline-none"
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            自動付与: ?utm_creative=[広告名（画像名）]&amp;上記パラメータ
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between rounded-lg border bg-white p-4">
        <div className="text-sm text-[var(--muted-foreground)]">
          {imageFiles.size > 0 ? (
            <span>
              画像{imageFiles.size}枚 → 広告{imageFiles.size}件を入稿
            </span>
          ) : (
            <span>画像をアップロードしてください</span>
          )}
        </div>
        <button
          onClick={handleBuild}
          disabled={!isValid}
          className="rounded-lg bg-[var(--primary)] px-8 py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          送信画面へ
        </button>
      </div>
    </div>
  );
}

function ImagePreview({
  filename,
  file,
  onRemove,
}: {
  filename: string;
  file: File;
  onRemove: () => void;
}) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="group relative rounded border bg-gray-50 p-1">
      {src && (
        <img
          src={src}
          alt={filename}
          className="h-24 w-full rounded object-cover"
        />
      )}
      <p className="mt-1 truncate text-xs text-gray-500">{filename}</p>
      <button
        onClick={onRemove}
        className="absolute right-1 top-1 hidden rounded-full bg-red-500 px-1.5 text-xs text-white group-hover:block"
      >
        ×
      </button>
    </div>
  );
}
