"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useBulkStore } from "@/store/bulk-store";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { MetaPage } from "@/lib/meta-types";

export default function HomePage() {
  const { data: session, status } = useSession();
  const {
    adAccounts,
    selectedAdAccountId,
    pages,
    selectedPageId,
    existingCampaigns,
    selectedExistingCampaignId,
    setAdAccounts,
    setSelectedAdAccount,
    setPages,
    setSelectedPage,
    setExistingCampaigns,
    setSelectedExistingCampaign,
  } = useBulkStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetchAccounts();
      fetchPages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (selectedAdAccountId) {
      fetchExistingCampaigns();
    } else {
      setExistingCampaigns([]);
      setSelectedExistingCampaign("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAdAccountId]);

  async function fetchAccounts() {
    try {
      setLoading(true);
      const res = await fetch("/api/meta/accounts");
      const data = await res.json();
      if (data.accounts) {
        setAdAccounts(data.accounts);
      } else {
        setError(data.error || "アカウントの取得に失敗しました");
      }
    } catch {
      setError("アカウントの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPages() {
    try {
      const res = await fetch("/api/meta/pages");
      const data = await res.json();
      if (data.pages) {
        setPages(data.pages);
      }
    } catch {
      // non-critical
    }
  }

  async function fetchExistingCampaigns() {
    try {
      const res = await fetch(
        `/api/meta/existing-campaigns?adAccountId=${selectedAdAccountId}`
      );
      const data = await res.json();
      if (data.campaigns) {
        setExistingCampaigns(data.campaigns);
      }
    } catch {
      // non-critical
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--muted-foreground)]">読み込み中...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="max-w-md rounded-lg border bg-white p-8 text-center shadow-sm">
          <h2 className="mb-2 text-2xl font-bold">ログイン</h2>
          <p className="mb-6 text-[var(--muted-foreground)]">
            Facebookアカウントでログインして、広告の一括入稿を始めましょう。
          </p>
          <button
            onClick={() => signIn("facebook")}
            className="rounded-lg bg-[var(--primary)] px-6 py-3 font-medium text-white hover:opacity-90"
          >
            Facebookでログイン
          </button>
        </div>
      </div>
    );
  }

  const accountOptions = adAccounts.map((a) => ({
    value: a.id,
    label: a.name,
    sublabel: `${a.id} - ${a.currency}`,
  }));

  const pageOptions = pages.map((p) => ({
    value: p.id,
    label: p.name,
    sublabel: p.id,
  }));

  const campaignOptions = existingCampaigns.map((c) => ({
    value: c.id,
    label: c.name,
    sublabel: `${c.objective} / ${c.status}${c.daily_budget ? ` / 予算:${c.daily_budget}` : ""}`,
  }));

  return (
    <div className="space-y-8">
      {/* User info */}
      <div className="flex items-center justify-between rounded-lg border bg-white p-4">
        <div>
          <p className="font-medium">{session.user?.name}</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            {session.user?.email}
          </p>
        </div>
        <button
          onClick={() => signOut()}
          className="rounded border px-4 py-2 text-sm hover:bg-[var(--secondary)]"
        >
          ログアウト
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Settings */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-bold">設定</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              広告アカウント
            </label>
            {loading ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                読み込み中...
              </p>
            ) : (
              <SearchableSelect
                options={accountOptions}
                value={selectedAdAccountId}
                onChange={setSelectedAdAccount}
                placeholder="広告アカウントを選択"
                searchPlaceholder="アカウント名またはIDで検索..."
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Facebookページ
            </label>
            <SearchableSelect
              options={pageOptions}
              value={selectedPageId}
              onChange={(id) => {
                const page = pages.find((p: MetaPage) => p.id === id);
                if (page) {
                  setSelectedPage(page.id, page.access_token);
                }
              }}
              placeholder="Facebookページを選択"
              searchPlaceholder="ページ名で検索..."
            />
          </div>

          {selectedAdAccountId && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                入稿先キャンペーン（既存キャンペーンに追加する場合）
              </label>
              <SearchableSelect
                options={[
                  { value: "", label: "新規キャンペーンを作成", sublabel: "CSVまたは手動入力で新規作成" },
                  ...campaignOptions,
                ]}
                value={selectedExistingCampaignId}
                onChange={setSelectedExistingCampaign}
                placeholder="新規キャンペーンを作成"
                searchPlaceholder="キャンペーン名で検索..."
              />
              {selectedExistingCampaignId && (
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  選択したキャンペーンに広告セット・広告を追加します。
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick start */}
      <div className="flex justify-center">
        <Link
          href="/builder"
          className="rounded-lg border bg-white p-6 transition hover:border-[var(--primary)] hover:shadow-md text-center w-full max-w-md"
        >
          <h3 className="mb-2 text-lg font-bold">広告を入稿する</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            画像をアップロードして広告を一括入稿します。
          </p>
        </Link>
      </div>
    </div>
  );
}
