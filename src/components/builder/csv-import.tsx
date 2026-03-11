"use client";

import { useCallback, useState } from "react";
import { parseCsvText, generateTemplateCsv, type ParseResult } from "@/lib/csv-parser";
import { useBulkStore } from "@/store/bulk-store";

export function CsvImport() {
  const { setCampaigns, addImageFiles, imageFiles } = useBulkStore();
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [imageDragOver, setImageDragOver] = useState(false);

  const handleCsvFile = useCallback(
    async (file: File) => {
      const text = await file.text();
      const result = parseCsvText(text);
      setParseResult(result);
      if (!result.hasErrors) {
        setCampaigns(result.campaigns);
      }
    },
    [setCampaigns]
  );

  const handleCsvDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".csv") || file.name.endsWith(".xlsx"))) {
        handleCsvFile(file);
      }
    },
    [handleCsvFile]
  );

  const handleImageDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setImageDragOver(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length > 0) {
        addImageFiles(files);
      }
    },
    [addImageFiles]
  );

  const downloadTemplate = () => {
    const csv = generateTemplateCsv();
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meta_ads_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalAds = parseResult?.campaigns.reduce(
    (sum, c) => sum + c.adSets.reduce((s, as2) => s + as2.ads.length, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* CSV Drop zone */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-medium">CSVファイル</h3>
          <button
            onClick={downloadTemplate}
            className="text-sm text-[var(--primary)] hover:underline"
          >
            テンプレートをダウンロード
          </button>
        </div>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleCsvDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition ${
            dragOver
              ? "border-[var(--primary)] bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <p className="text-[var(--muted-foreground)]">
            CSVファイルをドラッグ&ドロップ
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            または
          </p>
          <label className="mt-2 cursor-pointer rounded bg-[var(--primary)] px-4 py-2 text-sm text-white hover:opacity-90">
            ファイルを選択
            <input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCsvFile(file);
              }}
            />
          </label>
        </div>
      </div>

      {/* Parse result */}
      {parseResult && (
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-3 flex items-center gap-4">
            <h3 className="font-medium">解析結果</h3>
            <span className="text-sm text-[var(--muted-foreground)]">
              {parseResult.campaigns.length}キャンペーン /{" "}
              {parseResult.campaigns.reduce((s, c) => s + c.adSets.length, 0)}
              広告セット / {totalAds}広告
            </span>
            {parseResult.hasErrors && (
              <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                {parseResult.totalErrors}件のエラー
              </span>
            )}
          </div>

          <div className="max-h-64 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left">行</th>
                  <th className="px-2 py-1 text-left">状態</th>
                  <th className="px-2 py-1 text-left">キャンペーン</th>
                  <th className="px-2 py-1 text-left">広告セット</th>
                  <th className="px-2 py-1 text-left">広告名</th>
                  <th className="px-2 py-1 text-left">エラー</th>
                </tr>
              </thead>
              <tbody>
                {parseResult.rows.map((row) => (
                  <tr
                    key={row.rowIndex}
                    className={
                      row.errors.length > 0 ? "bg-red-50" : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-2 py-1">{row.rowIndex}</td>
                    <td className="px-2 py-1">
                      {row.errors.length > 0 ? (
                        <span className="text-red-600">&#10005;</span>
                      ) : (
                        <span className="text-green-600">&#10003;</span>
                      )}
                    </td>
                    <td className="px-2 py-1">
                      {row.data.campaign_name || "-"}
                    </td>
                    <td className="px-2 py-1">
                      {row.data.adset_name || "-"}
                    </td>
                    <td className="px-2 py-1">{row.data.ad_name || "-"}</td>
                    <td className="px-2 py-1 text-red-600">
                      {row.errors.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Image drop zone */}
      <div>
        <h3 className="mb-2 font-medium">
          画像ファイル
          {imageFiles.size > 0 && (
            <span className="ml-2 text-sm font-normal text-[var(--muted-foreground)]">
              ({imageFiles.size}ファイル)
            </span>
          )}
        </h3>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setImageDragOver(true);
          }}
          onDragLeave={() => setImageDragOver(false)}
          onDrop={handleImageDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition ${
            imageDragOver
              ? "border-[var(--primary)] bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <p className="text-[var(--muted-foreground)]">
            広告画像をドラッグ&ドロップ
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            JPG / PNG（推奨: 1080x1080px）
          </p>
          <label className="mt-2 cursor-pointer rounded bg-gray-600 px-4 py-2 text-sm text-white hover:opacity-90">
            画像を選択
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) addImageFiles(files);
              }}
            />
          </label>
        </div>

        {/* Image file list */}
        {imageFiles.size > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Array.from(imageFiles.entries()).map(([name, file]) => (
              <div
                key={name}
                className="flex items-center gap-2 rounded bg-gray-100 px-3 py-1 text-sm"
              >
                <span>{name}</span>
                <span className="text-[var(--muted-foreground)]">
                  ({(file.size / 1024).toFixed(0)}KB)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
