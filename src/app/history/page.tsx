"use client";

import { useSession } from "next-auth/react";

export default function HistoryPage() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="py-20 text-center">
        <p className="text-[var(--muted-foreground)]">ログインしてください。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">送信履歴</h2>
      <div className="rounded-lg border bg-white p-8 text-center">
        <p className="text-[var(--muted-foreground)]">
          送信履歴はブラウザのセッション中のみ保持されます。
        </p>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          送信結果のCSVエクスポートは送信完了画面からダウンロードできます。
        </p>
      </div>
    </div>
  );
}
