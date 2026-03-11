import Papa from "papaparse";
import { bulkCsvRowSchema, type BulkCsvRow } from "./validators";
import type { CampaignInput, AdSetInput, AdInput } from "./meta-types";

export interface ParsedRow {
  rowIndex: number;
  data: Record<string, string>;
  parsed?: BulkCsvRow;
  errors: string[];
}

export interface ParseResult {
  rows: ParsedRow[];
  campaigns: CampaignInput[];
  hasErrors: boolean;
  totalErrors: number;
}

export function parseCsvText(csvText: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const parsedRows: ParsedRow[] = result.data.map((row, index) => {
    const validation = bulkCsvRowSchema.safeParse(row);
    if (validation.success) {
      return { rowIndex: index + 1, data: row, parsed: validation.data, errors: [] };
    }
    return {
      rowIndex: index + 1,
      data: row,
      errors: validation.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      ),
    };
  });

  const validRows = parsedRows.filter((r) => r.parsed);
  const campaigns = buildCampaignTree(validRows.map((r) => r.parsed!));

  return {
    rows: parsedRows,
    campaigns,
    hasErrors: parsedRows.some((r) => r.errors.length > 0),
    totalErrors: parsedRows.reduce((sum, r) => sum + r.errors.length, 0),
  };
}

function buildCampaignTree(rows: BulkCsvRow[]): CampaignInput[] {
  const campaignMap = new Map<string, CampaignInput>();

  for (const row of rows) {
    // Get or create campaign
    let campaign = campaignMap.get(row.campaign_name);
    if (!campaign) {
      campaign = {
        id: crypto.randomUUID(),
        name: row.campaign_name,
        objective: row.campaign_objective,
        dailyBudget: row.campaign_budget,
        specialAdCategories: [],
        status: "PAUSED",
        adSets: [],
      };
      campaignMap.set(row.campaign_name, campaign);
    }

    // Get or create ad set
    let adSet = campaign.adSets.find((as) => as.name === row.adset_name);
    if (!adSet) {
      const countries = row.countries
        .split(";")
        .map((c) => c.trim().toUpperCase());
      adSet = {
        id: crypto.randomUUID(),
        name: row.adset_name,
        campaignName: row.campaign_name,
        dailyBudget: row.adset_budget,
        optimizationGoal: "LINK_CLICKS",
        billingEvent: "IMPRESSIONS",
        startTime: new Date().toISOString(),
        targeting: {
          geo_locations: { countries },
          age_min: row.age_min || 18,
          age_max: row.age_max || 65,
        },
        status: "PAUSED",
        ads: [],
      };
      campaign.adSets.push(adSet);
    }

    // Create ad
    const ad: AdInput = {
      id: crypto.randomUUID(),
      name: row.ad_name,
      adSetName: row.adset_name,
      imageFilename: row.image_filename,
      headline: row.headline,
      bodyText: row.body_text,
      description: row.description || "",
      linkUrl: row.link_url,
      ctaType: row.cta_type,
      status: "PAUSED",
    };
    adSet.ads.push(ad);
  }

  return Array.from(campaignMap.values());
}

export function generateTemplateCsv(): string {
  const headers = [
    "campaign_name",
    "campaign_objective",
    "campaign_budget",
    "adset_name",
    "adset_budget",
    "age_min",
    "age_max",
    "countries",
    "ad_name",
    "image_filename",
    "headline",
    "body_text",
    "description",
    "link_url",
    "cta_type",
  ];
  const exampleRow = [
    "夏セール2026",
    "OUTCOME_SALES",
    "5000",
    "女性25-45",
    "2500",
    "25",
    "45",
    "JP",
    "広告A",
    "summer-1.jpg",
    "50%OFF",
    "夏のコレクションをチェック",
    "送料無料",
    "https://example.com",
    "SHOP_NOW",
  ];
  return [headers.join(","), exampleRow.join(",")].join("\n");
}
