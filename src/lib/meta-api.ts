import type {
  MetaAdAccount,
  MetaPage,
  MetaImageUploadResult,
  MetaCreatedObject,
  MetaObjective,
  MetaOptimizationGoal,
  MetaCTA,
  AdStatus,
  TargetingSpec,
} from "./meta-types";

const API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

class MetaApiError extends Error {
  constructor(
    public statusCode: number,
    public errorBody: Record<string, unknown>
  ) {
    const err = errorBody.error as Record<string, unknown> | undefined;
    const msg = err?.error_user_msg || err?.message || "Meta API error";
    const title = err?.error_user_title || "";
    const detail = title ? `${title}: ${msg}` : String(msg);
    super(detail);
    this.name = "MetaApiError";
  }
}

async function metaFetch(
  url: string,
  options: RequestInit = {}
): Promise<Record<string, unknown>> {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new MetaApiError(res.status, data);
  }
  return data;
}

// Ad Accounts (with pagination)
export async function getAdAccounts(
  accessToken: string
): Promise<MetaAdAccount[]> {
  const allAccounts: MetaAdAccount[] = [];
  let url: string | null =
    `${BASE_URL}/me/adaccounts?fields=id,name,account_status,currency&limit=100&access_token=${accessToken}`;

  while (url) {
    const data = await metaFetch(url);
    const accounts = (data.data as MetaAdAccount[]) || [];
    allAccounts.push(...accounts);
    const paging = data.paging as { next?: string } | undefined;
    url = paging?.next || null;
  }
  return allAccounts;
}

// Facebook Pages (with pagination)
export async function getPages(accessToken: string): Promise<MetaPage[]> {
  const allPages: MetaPage[] = [];
  let url: string | null =
    `${BASE_URL}/me/accounts?fields=id,name,access_token&limit=100&access_token=${accessToken}`;

  while (url) {
    const data = await metaFetch(url);
    const pages = (data.data as MetaPage[]) || [];
    allPages.push(...pages);
    const paging = data.paging as { next?: string } | undefined;
    url = paging?.next || null;
  }
  return allPages;
}

// Existing Campaigns (for selecting target campaign)
export interface MetaCampaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  daily_budget?: string;
}

export async function getCampaigns(
  accessToken: string,
  adAccountId: string
): Promise<MetaCampaign[]> {
  const allCampaigns: MetaCampaign[] = [];
  let url: string | null =
    `${BASE_URL}/${adAccountId}/campaigns?fields=id,name,objective,status,daily_budget&limit=100&access_token=${accessToken}`;

  while (url) {
    const data = await metaFetch(url);
    const campaigns = (data.data as MetaCampaign[]) || [];
    allCampaigns.push(...campaigns);
    const paging = data.paging as { next?: string } | undefined;
    url = paging?.next || null;
  }
  return allCampaigns;
}

// Campaign
export async function createCampaign(
  accessToken: string,
  adAccountId: string,
  params: {
    name: string;
    objective: MetaObjective;
    dailyBudget: number;
    specialAdCategories: string[];
    status: AdStatus;
  }
): Promise<MetaCreatedObject> {
  const formData = new URLSearchParams();
  formData.append("name", params.name);
  formData.append("objective", params.objective);
  formData.append(
    "special_ad_categories",
    JSON.stringify(params.specialAdCategories)
  );
  formData.append("status", params.status);
  if (params.dailyBudget > 0) {
    formData.append("daily_budget", params.dailyBudget.toString());
  } else {
    formData.append("is_adset_budget_sharing_enabled", "false");
  }
  formData.append("access_token", accessToken);

  const data = await metaFetch(`${BASE_URL}/${adAccountId}/campaigns`, {
    method: "POST",
    body: formData,
  });
  return { id: data.id as string };
}

// Ad Set
export async function createAdSet(
  accessToken: string,
  adAccountId: string,
  params: {
    name: string;
    campaignId: string;
    dailyBudget: number;
    optimizationGoal: MetaOptimizationGoal;
    billingEvent: string;
    startTime: string;
    endTime?: string;
    targeting: TargetingSpec;
    status: AdStatus;
  }
): Promise<MetaCreatedObject> {
  const formData = new URLSearchParams();
  formData.append("name", params.name);
  formData.append("campaign_id", params.campaignId);
  formData.append("daily_budget", params.dailyBudget.toString());
  formData.append("optimization_goal", params.optimizationGoal);
  formData.append("billing_event", params.billingEvent);
  formData.append("bid_strategy", "LOWEST_COST_WITHOUT_CAP");
  formData.append("start_time", params.startTime);
  if (params.endTime) formData.append("end_time", params.endTime);
  formData.append("targeting", JSON.stringify(params.targeting));
  formData.append("status", params.status);
  formData.append("access_token", accessToken);

  const data = await metaFetch(`${BASE_URL}/${adAccountId}/adsets`, {
    method: "POST",
    body: formData,
  });
  return { id: data.id as string };
}

// Image Upload
export async function uploadImage(
  accessToken: string,
  adAccountId: string,
  imageBuffer: Buffer,
  filename: string
): Promise<MetaImageUploadResult> {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(imageBuffer)]);
  formData.append("filename", blob, filename);
  formData.append("access_token", accessToken);

  const data = await metaFetch(`${BASE_URL}/${adAccountId}/adimages`, {
    method: "POST",
    body: formData,
  });

  const images = data.images as Record<
    string,
    { hash: string; url: string }
  >;
  const imageData = Object.values(images)[0];
  return { hash: imageData.hash, url: imageData.url };
}

// Ad Creative
export async function createAdCreative(
  accessToken: string,
  adAccountId: string,
  params: {
    name: string;
    pageId: string;
    imageHash: string;
    linkUrl: string;
    message: string;
    headline: string;
    description: string;
    ctaType: MetaCTA;
  }
): Promise<MetaCreatedObject> {
  const objectStorySpec = {
    page_id: params.pageId,
    link_data: {
      image_hash: params.imageHash,
      link: params.linkUrl,
      message: params.message,
      name: params.headline,
      description: params.description,
      call_to_action: {
        type: params.ctaType,
        value: { link: params.linkUrl },
      },
    },
  };

  const formData = new URLSearchParams();
  formData.append("name", params.name);
  formData.append("object_story_spec", JSON.stringify(objectStorySpec));
  formData.append("access_token", accessToken);

  const data = await metaFetch(`${BASE_URL}/${adAccountId}/adcreatives`, {
    method: "POST",
    body: formData,
  });
  return { id: data.id as string };
}

// Ad
export async function createAd(
  accessToken: string,
  adAccountId: string,
  params: {
    name: string;
    adSetId: string;
    creativeId: string;
    status: AdStatus;
  }
): Promise<MetaCreatedObject> {
  // Disable all Advantage+ creative enhancements at ad level
  const creativeDof = {
    creative_features_spec: {
      image_enhancement: { enroll_status: "OPT_OUT" },
      text_optimizations: { enroll_status: "OPT_OUT" },
      inline_comment: { enroll_status: "OPT_OUT" },
      image_templates: { enroll_status: "OPT_OUT" },
      image_touchups: { enroll_status: "OPT_OUT" },
      image_brightness_and_contrast: { enroll_status: "OPT_OUT" },
      image_uncrop: { enroll_status: "OPT_OUT" },
      adapt_to_placement: { enroll_status: "OPT_OUT" },
      site_extensions: { enroll_status: "OPT_OUT" },
      description_automation: { enroll_status: "OPT_OUT" },
    },
  };

  const formData = new URLSearchParams();
  formData.append("name", params.name);
  formData.append("adset_id", params.adSetId);
  formData.append("creative", JSON.stringify({ creative_id: params.creativeId }));
  formData.append("status", params.status);
  formData.append(
    "creative_degrees_of_freedom_spec",
    JSON.stringify(creativeDof)
  );
  formData.append("access_token", accessToken);

  const data = await metaFetch(`${BASE_URL}/${adAccountId}/ads`, {
    method: "POST",
    body: formData,
  });
  return { id: data.id as string };
}

export { MetaApiError };
