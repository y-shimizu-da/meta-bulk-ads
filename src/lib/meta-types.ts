// Meta Marketing API type definitions

export type MetaObjective =
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_LEADS"
  | "OUTCOME_AWARENESS"
  | "OUTCOME_SALES"
  | "OUTCOME_APP_PROMOTION";

export type MetaCTA =
  | "SHOP_NOW"
  | "LEARN_MORE"
  | "SIGN_UP"
  | "BOOK_TRAVEL"
  | "CONTACT_US"
  | "DOWNLOAD"
  | "GET_OFFER"
  | "GET_QUOTE"
  | "SUBSCRIBE"
  | "APPLY_NOW"
  | "ORDER_NOW"
  | "WATCH_MORE";

export type MetaOptimizationGoal =
  | "OFFSITE_CONVERSIONS"
  | "LINK_CLICKS"
  | "IMPRESSIONS"
  | "REACH"
  | "LANDING_PAGE_VIEWS"
  | "LEAD_GENERATION"
  | "VALUE"
  | "THRUPLAY"
  | "ENGAGED_USERS"
  | "APP_INSTALLS";

export type AdStatus = "PAUSED" | "ACTIVE";

export interface TargetingSpec {
  geo_locations: {
    countries: string[];
  };
  age_min?: number;
  age_max?: number;
  genders?: number[]; // 1=male, 2=female
  interests?: { id: string; name: string }[];
}

// Input types for bulk creation
export interface CampaignInput {
  id?: string; // temp id for internal reference
  name: string;
  objective: MetaObjective;
  dailyBudget: number; // in cents
  specialAdCategories: string[];
  status: AdStatus;
  adSets: AdSetInput[];
}

export interface AdSetInput {
  id?: string;
  name: string;
  campaignName: string; // reference to parent campaign
  dailyBudget: number;
  optimizationGoal: MetaOptimizationGoal;
  billingEvent: string;
  startTime: string; // ISO 8601
  endTime?: string;
  targeting: TargetingSpec;
  status: AdStatus;
  ads: AdInput[];
}

export interface AdInput {
  id?: string;
  name: string;
  adSetName: string; // reference to parent ad set
  imageFile?: File;
  imageFilename?: string;
  imagePreviewUrl?: string;
  headline: string;
  bodyText: string;
  description: string;
  linkUrl: string;
  ctaType: MetaCTA;
  status: AdStatus;
}

// Meta API response types
export interface MetaAdAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
}

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
}

export interface MetaImageUploadResult {
  hash: string;
  url: string;
}

export interface MetaCreatedObject {
  id: string;
}

// Bulk submission tracking
export type SubmissionItemStatus =
  | "pending"
  | "in_progress"
  | "success"
  | "error";

export interface SubmissionProgress {
  totalItems: number;
  completedItems: number;
  failedItems: number;
  currentStep: string;
  items: SubmissionItemProgress[];
}

export interface SubmissionItemProgress {
  type: "campaign" | "adset" | "image" | "creative" | "ad";
  name: string;
  status: SubmissionItemStatus;
  metaId?: string;
  error?: string;
}

// Bulk store state
export interface BulkState {
  adAccountId: string;
  pageId: string;
  pageAccessToken: string;
  campaigns: CampaignInput[];
}
