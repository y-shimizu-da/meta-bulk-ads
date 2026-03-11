"use client";

import { useState } from "react";
import { useBulkStore } from "@/store/bulk-store";
import type {
  CampaignInput,
  AdSetInput,
  AdInput,
  MetaObjective,
  MetaOptimizationGoal,
  MetaCTA,
} from "@/lib/meta-types";

const OBJECTIVES: { value: MetaObjective; label: string }[] = [
  { value: "OUTCOME_SALES", label: "売上" },
  { value: "OUTCOME_TRAFFIC", label: "トラフィック" },
  { value: "OUTCOME_ENGAGEMENT", label: "エンゲージメント" },
  { value: "OUTCOME_LEADS", label: "リード" },
  { value: "OUTCOME_AWARENESS", label: "認知度" },
  { value: "OUTCOME_APP_PROMOTION", label: "アプリ促進" },
];

const OPTIMIZATION_GOALS: { value: MetaOptimizationGoal; label: string }[] = [
  { value: "LINK_CLICKS", label: "リンククリック" },
  { value: "OFFSITE_CONVERSIONS", label: "コンバージョン" },
  { value: "IMPRESSIONS", label: "インプレッション" },
  { value: "REACH", label: "リーチ" },
  { value: "LANDING_PAGE_VIEWS", label: "LP閲覧" },
  { value: "LEAD_GENERATION", label: "リード獲得" },
];

const CTA_TYPES: { value: MetaCTA; label: string }[] = [
  { value: "SHOP_NOW", label: "購入する" },
  { value: "LEARN_MORE", label: "詳しくはこちら" },
  { value: "SIGN_UP", label: "登録する" },
  { value: "CONTACT_US", label: "お問い合わせ" },
  { value: "DOWNLOAD", label: "ダウンロード" },
  { value: "APPLY_NOW", label: "今すぐ申し込む" },
  { value: "ORDER_NOW", label: "注文する" },
  { value: "SUBSCRIBE", label: "登録" },
];

export function ManualEntry() {
  const { campaigns, addCampaign, addAdSet, addAd, addImageFiles } =
    useBulkStore();
  const [expandedCampaign, setExpandedCampaign] = useState<number | null>(null);
  const [expandedAdSet, setExpandedAdSet] = useState<string | null>(null);

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    objective: "OUTCOME_SALES" as MetaObjective,
    dailyBudget: 5000,
  });

  // Ad Set form state
  const [adSetForm, setAdSetForm] = useState({
    name: "",
    dailyBudget: 2500,
    optimizationGoal: "LINK_CLICKS" as MetaOptimizationGoal,
    startTime: new Date().toISOString().slice(0, 16),
    countries: "JP",
    ageMin: 18,
    ageMax: 65,
  });

  // Ad form state
  const [adForm, setAdForm] = useState({
    name: "",
    headline: "",
    bodyText: "",
    description: "",
    linkUrl: "",
    ctaType: "LEARN_MORE" as MetaCTA,
    imageFilename: "",
  });

  function handleAddCampaign() {
    if (!campaignForm.name) return;
    const campaign: CampaignInput = {
      id: crypto.randomUUID(),
      name: campaignForm.name,
      objective: campaignForm.objective,
      dailyBudget: campaignForm.dailyBudget,
      specialAdCategories: [],
      status: "PAUSED",
      adSets: [],
    };
    addCampaign(campaign);
    setCampaignForm({ name: "", objective: "OUTCOME_SALES", dailyBudget: 5000 });
  }

  function handleAddAdSet(campaignIndex: number) {
    if (!adSetForm.name) return;
    const countries = adSetForm.countries.split(",").map((c) => c.trim().toUpperCase());
    const adSet: AdSetInput = {
      id: crypto.randomUUID(),
      name: adSetForm.name,
      campaignName: campaigns[campaignIndex].name,
      dailyBudget: adSetForm.dailyBudget,
      optimizationGoal: adSetForm.optimizationGoal,
      billingEvent: "IMPRESSIONS",
      startTime: new Date(adSetForm.startTime).toISOString(),
      targeting: {
        geo_locations: { countries },
        age_min: adSetForm.ageMin,
        age_max: adSetForm.ageMax,
      },
      status: "PAUSED",
      ads: [],
    };
    addAdSet(campaignIndex, adSet);
    setAdSetForm({
      name: "",
      dailyBudget: 2500,
      optimizationGoal: "LINK_CLICKS",
      startTime: new Date().toISOString().slice(0, 16),
      countries: "JP",
      ageMin: 18,
      ageMax: 65,
    });
  }

  function handleAddAd(campaignIndex: number, adSetIndex: number) {
    if (!adForm.name || !adForm.headline || !adForm.bodyText || !adForm.linkUrl) return;
    const ad: AdInput = {
      id: crypto.randomUUID(),
      name: adForm.name,
      adSetName: campaigns[campaignIndex].adSets[adSetIndex].name,
      imageFilename: adForm.imageFilename,
      headline: adForm.headline,
      bodyText: adForm.bodyText,
      description: adForm.description,
      linkUrl: adForm.linkUrl,
      ctaType: adForm.ctaType,
      status: "PAUSED",
    };
    addAd(campaignIndex, adSetIndex, ad);
    setAdForm({
      name: "",
      headline: "",
      bodyText: "",
      description: "",
      linkUrl: "",
      ctaType: "LEARN_MORE",
      imageFilename: "",
    });
  }

  return (
    <div className="space-y-6">
      {/* Add Campaign form */}
      <div className="rounded-lg border bg-gray-50 p-4">
        <h3 className="mb-3 font-medium">キャンペーンを追加</h3>
        <div className="grid gap-3 md:grid-cols-4">
          <input
            placeholder="キャンペーン名"
            value={campaignForm.name}
            onChange={(e) =>
              setCampaignForm({ ...campaignForm, name: e.target.value })
            }
            className="rounded border bg-white px-3 py-2"
          />
          <select
            value={campaignForm.objective}
            onChange={(e) =>
              setCampaignForm({
                ...campaignForm,
                objective: e.target.value as MetaObjective,
              })
            }
            className="rounded border bg-white px-3 py-2"
          >
            {OBJECTIVES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="日予算（セント）"
            value={campaignForm.dailyBudget}
            onChange={(e) =>
              setCampaignForm({
                ...campaignForm,
                dailyBudget: Number(e.target.value),
              })
            }
            className="rounded border bg-white px-3 py-2"
          />
          <button
            onClick={handleAddCampaign}
            className="rounded bg-[var(--primary)] px-4 py-2 text-white hover:opacity-90"
          >
            追加
          </button>
        </div>
      </div>

      {/* Campaign list */}
      {campaigns.map((campaign, ci) => (
        <div key={campaign.id || ci} className="rounded-lg border bg-white">
          <button
            onClick={() =>
              setExpandedCampaign(expandedCampaign === ci ? null : ci)
            }
            className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
          >
            <div>
              <span className="font-medium">{campaign.name}</span>
              <span className="ml-3 text-sm text-[var(--muted-foreground)]">
                {OBJECTIVES.find((o) => o.value === campaign.objective)?.label} /
                予算: {campaign.dailyBudget}
              </span>
            </div>
            <span className="text-sm text-[var(--muted-foreground)]">
              {campaign.adSets.length}広告セット /
              {campaign.adSets.reduce((s, as2) => s + as2.ads.length, 0)}広告
            </span>
          </button>

          {expandedCampaign === ci && (
            <div className="border-t p-4">
              {/* Add Ad Set form */}
              <div className="mb-4 rounded bg-gray-50 p-3">
                <h4 className="mb-2 text-sm font-medium">広告セットを追加</h4>
                <div className="grid gap-2 md:grid-cols-3">
                  <input
                    placeholder="広告セット名"
                    value={adSetForm.name}
                    onChange={(e) =>
                      setAdSetForm({ ...adSetForm, name: e.target.value })
                    }
                    className="rounded border bg-white px-3 py-1.5 text-sm"
                  />
                  <select
                    value={adSetForm.optimizationGoal}
                    onChange={(e) =>
                      setAdSetForm({
                        ...adSetForm,
                        optimizationGoal: e.target.value as MetaOptimizationGoal,
                      })
                    }
                    className="rounded border bg-white px-3 py-1.5 text-sm"
                  >
                    {OPTIMIZATION_GOALS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="日予算（セント）"
                    value={adSetForm.dailyBudget}
                    onChange={(e) =>
                      setAdSetForm({
                        ...adSetForm,
                        dailyBudget: Number(e.target.value),
                      })
                    }
                    className="rounded border bg-white px-3 py-1.5 text-sm"
                  />
                  <input
                    placeholder="国コード（例: JP）"
                    value={adSetForm.countries}
                    onChange={(e) =>
                      setAdSetForm({ ...adSetForm, countries: e.target.value })
                    }
                    className="rounded border bg-white px-3 py-1.5 text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="年齢下限"
                      value={adSetForm.ageMin}
                      onChange={(e) =>
                        setAdSetForm({
                          ...adSetForm,
                          ageMin: Number(e.target.value),
                        })
                      }
                      className="w-full rounded border bg-white px-3 py-1.5 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="年齢上限"
                      value={adSetForm.ageMax}
                      onChange={(e) =>
                        setAdSetForm({
                          ...adSetForm,
                          ageMax: Number(e.target.value),
                        })
                      }
                      className="w-full rounded border bg-white px-3 py-1.5 text-sm"
                    />
                  </div>
                  <input
                    type="datetime-local"
                    value={adSetForm.startTime}
                    onChange={(e) =>
                      setAdSetForm({ ...adSetForm, startTime: e.target.value })
                    }
                    className="rounded border bg-white px-3 py-1.5 text-sm"
                  />
                </div>
                <button
                  onClick={() => handleAddAdSet(ci)}
                  className="mt-2 rounded bg-gray-700 px-3 py-1.5 text-sm text-white hover:opacity-90"
                >
                  広告セットを追加
                </button>
              </div>

              {/* Ad Sets */}
              {campaign.adSets.map((adSet, asi) => {
                const adSetKey = `${ci}-${asi}`;
                return (
                  <div key={adSet.id || asi} className="mb-3 rounded border">
                    <button
                      onClick={() =>
                        setExpandedAdSet(
                          expandedAdSet === adSetKey ? null : adSetKey
                        )
                      }
                      className="flex w-full items-center justify-between p-3 text-left text-sm hover:bg-gray-50"
                    >
                      <span className="font-medium">{adSet.name}</span>
                      <span className="text-[var(--muted-foreground)]">
                        {adSet.ads.length}広告
                      </span>
                    </button>

                    {expandedAdSet === adSetKey && (
                      <div className="border-t p-3">
                        {/* Add Ad form */}
                        <div className="mb-3 rounded bg-blue-50 p-3">
                          <h5 className="mb-2 text-sm font-medium">
                            広告を追加
                          </h5>
                          <div className="grid gap-2 md:grid-cols-2">
                            <input
                              placeholder="広告名"
                              value={adForm.name}
                              onChange={(e) =>
                                setAdForm({ ...adForm, name: e.target.value })
                              }
                              className="rounded border bg-white px-3 py-1.5 text-sm"
                            />
                            <input
                              placeholder="画像ファイル名（例: image.jpg）"
                              value={adForm.imageFilename}
                              onChange={(e) =>
                                setAdForm({
                                  ...adForm,
                                  imageFilename: e.target.value,
                                })
                              }
                              className="rounded border bg-white px-3 py-1.5 text-sm"
                            />
                            <input
                              placeholder="見出し（40文字以内）"
                              maxLength={40}
                              value={adForm.headline}
                              onChange={(e) =>
                                setAdForm({
                                  ...adForm,
                                  headline: e.target.value,
                                })
                              }
                              className="rounded border bg-white px-3 py-1.5 text-sm"
                            />
                            <input
                              placeholder="本文（125文字以内）"
                              maxLength={125}
                              value={adForm.bodyText}
                              onChange={(e) =>
                                setAdForm({
                                  ...adForm,
                                  bodyText: e.target.value,
                                })
                              }
                              className="rounded border bg-white px-3 py-1.5 text-sm"
                            />
                            <input
                              placeholder="説明（任意）"
                              value={adForm.description}
                              onChange={(e) =>
                                setAdForm({
                                  ...adForm,
                                  description: e.target.value,
                                })
                              }
                              className="rounded border bg-white px-3 py-1.5 text-sm"
                            />
                            <input
                              placeholder="リンクURL"
                              value={adForm.linkUrl}
                              onChange={(e) =>
                                setAdForm({
                                  ...adForm,
                                  linkUrl: e.target.value,
                                })
                              }
                              className="rounded border bg-white px-3 py-1.5 text-sm"
                            />
                            <select
                              value={adForm.ctaType}
                              onChange={(e) =>
                                setAdForm({
                                  ...adForm,
                                  ctaType: e.target.value as MetaCTA,
                                })
                              }
                              className="rounded border bg-white px-3 py-1.5 text-sm"
                            >
                              {CTA_TYPES.map((c) => (
                                <option key={c.value} value={c.value}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                            <label className="flex cursor-pointer items-center gap-2 rounded border bg-white px-3 py-1.5 text-sm">
                              画像を選択
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    addImageFiles([file]);
                                    setAdForm({
                                      ...adForm,
                                      imageFilename: file.name,
                                    });
                                  }
                                }}
                              />
                            </label>
                          </div>
                          <button
                            onClick={() => handleAddAd(ci, asi)}
                            className="mt-2 rounded bg-[var(--primary)] px-3 py-1.5 text-sm text-white hover:opacity-90"
                          >
                            広告を追加
                          </button>
                        </div>

                        {/* Existing ads */}
                        {adSet.ads.map((ad, ai) => (
                          <div
                            key={ad.id || ai}
                            className="mb-2 rounded bg-gray-50 p-2 text-sm"
                          >
                            <span className="font-medium">{ad.name}</span>
                            <span className="ml-2 text-[var(--muted-foreground)]">
                              {ad.headline} | {ad.imageFilename || "画像なし"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
