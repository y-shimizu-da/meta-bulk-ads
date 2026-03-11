import { z } from "zod";

export const campaignSchema = z.object({
  name: z.string().min(1, "キャンペーン名は必須です"),
  objective: z.enum([
    "OUTCOME_TRAFFIC",
    "OUTCOME_ENGAGEMENT",
    "OUTCOME_LEADS",
    "OUTCOME_AWARENESS",
    "OUTCOME_SALES",
    "OUTCOME_APP_PROMOTION",
  ]),
  dailyBudget: z
    .number()
    .min(100, "最低予算は100円（100セント）以上です"),
  specialAdCategories: z.array(z.string()).default([]),
  status: z.enum(["PAUSED", "ACTIVE"]).default("PAUSED"),
});

export const adSetSchema = z.object({
  name: z.string().min(1, "広告セット名は必須です"),
  campaignName: z.string().min(1, "キャンペーン名は必須です"),
  dailyBudget: z.number().min(100, "最低予算は100セント以上です"),
  optimizationGoal: z.enum([
    "OFFSITE_CONVERSIONS",
    "LINK_CLICKS",
    "IMPRESSIONS",
    "REACH",
    "LANDING_PAGE_VIEWS",
    "LEAD_GENERATION",
    "VALUE",
    "THRUPLAY",
    "ENGAGED_USERS",
    "APP_INSTALLS",
  ]),
  billingEvent: z.string().default("IMPRESSIONS"),
  startTime: z.string().min(1, "開始日は必須です"),
  endTime: z.string().optional(),
  targeting: z.object({
    geo_locations: z.object({
      countries: z.array(z.string().length(2)).min(1, "国の指定は必須です"),
    }),
    age_min: z.number().min(13).max(65).optional(),
    age_max: z.number().min(13).max(65).optional(),
    genders: z.array(z.number()).optional(),
    interests: z
      .array(z.object({ id: z.string(), name: z.string() }))
      .optional(),
  }),
  status: z.enum(["PAUSED", "ACTIVE"]).default("PAUSED"),
});

export const adSchema = z.object({
  name: z.string().min(1, "広告名は必須です"),
  adSetName: z.string().min(1, "広告セット名は必須です"),
  imageFilename: z.string().optional(),
  headline: z
    .string()
    .min(1, "見出しは必須です")
    .max(40, "見出しは40文字以内です"),
  bodyText: z
    .string()
    .min(1, "本文は必須です")
    .max(125, "本文は125文字以内です"),
  description: z.string().max(30, "説明は30文字以内です").optional().default(""),
  linkUrl: z.string().url("有効なURLを入力してください"),
  ctaType: z.enum([
    "SHOP_NOW",
    "LEARN_MORE",
    "SIGN_UP",
    "BOOK_TRAVEL",
    "CONTACT_US",
    "DOWNLOAD",
    "GET_OFFER",
    "GET_QUOTE",
    "SUBSCRIBE",
    "APPLY_NOW",
    "ORDER_NOW",
    "WATCH_MORE",
  ]),
  status: z.enum(["PAUSED", "ACTIVE"]).default("PAUSED"),
});

export const bulkCsvRowSchema = z.object({
  campaign_name: z.string().min(1),
  campaign_objective: z.enum([
    "OUTCOME_TRAFFIC",
    "OUTCOME_ENGAGEMENT",
    "OUTCOME_LEADS",
    "OUTCOME_AWARENESS",
    "OUTCOME_SALES",
    "OUTCOME_APP_PROMOTION",
  ]),
  campaign_budget: z.coerce.number().min(100),
  adset_name: z.string().min(1),
  adset_budget: z.coerce.number().min(100),
  age_min: z.coerce.number().min(13).max(65).optional(),
  age_max: z.coerce.number().min(13).max(65).optional(),
  countries: z.string().min(1),
  ad_name: z.string().min(1),
  image_filename: z.string().min(1),
  headline: z.string().min(1).max(40),
  body_text: z.string().min(1).max(125),
  description: z.string().max(30).optional().default(""),
  link_url: z.string().url(),
  cta_type: z.enum([
    "SHOP_NOW",
    "LEARN_MORE",
    "SIGN_UP",
    "BOOK_TRAVEL",
    "CONTACT_US",
    "DOWNLOAD",
    "GET_OFFER",
    "GET_QUOTE",
    "SUBSCRIBE",
    "APPLY_NOW",
    "ORDER_NOW",
    "WATCH_MORE",
  ]),
});

export type BulkCsvRow = z.infer<typeof bulkCsvRowSchema>;
