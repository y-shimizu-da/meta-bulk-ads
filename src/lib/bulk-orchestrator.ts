import {
  createCampaign,
  createAdSet,
  uploadImage,
  createAdCreative,
  createAd,
  getCampaigns,
} from "./meta-api";
import { RateLimiter } from "./rate-limiter";
import type {
  CampaignInput,
  SubmissionProgress,
  SubmissionItemProgress,
} from "./meta-types";

export type ProgressCallback = (progress: SubmissionProgress) => void;

interface SubmissionContext {
  accessToken: string;
  adAccountId: string;
  pageId: string;
  existingCampaignId?: string; // If set, skip campaign creation and use this ID
  imageBuffers: Map<string, Buffer>; // filename -> buffer
}

export async function executeBulkSubmission(
  context: SubmissionContext,
  campaigns: CampaignInput[],
  onProgress: ProgressCallback
): Promise<SubmissionProgress> {
  const rateLimiter = new RateLimiter(2000);
  const items: SubmissionItemProgress[] = [];

  // Count total items
  let totalItems = 0;
  for (const campaign of campaigns) {
    if (!context.existingCampaignId) totalItems++; // campaign (skip if using existing)
    for (const adSet of campaign.adSets) {
      totalItems++; // adSet
      for (const ad of adSet.ads) {
        totalItems += 3; // image + creative + ad
      }
    }
  }

  const progress: SubmissionProgress = {
    totalItems,
    completedItems: 0,
    failedItems: 0,
    currentStep: "開始中...",
    items,
  };

  const campaignIdMap = new Map<string, string>();
  const adSetIdMap = new Map<string, string>();

  // Step 1: Create campaigns (or use existing)
  if (context.existingCampaignId) {
    // Use existing campaign for all
    for (const campaign of campaigns) {
      campaignIdMap.set(campaign.name, context.existingCampaignId);
    }
    const item: SubmissionItemProgress = {
      type: "campaign",
      name: "既存キャンペーンを使用",
      status: "success",
      metaId: context.existingCampaignId,
    };
    items.push(item);
    onProgress({ ...progress });
  } else {
    // Fetch existing campaigns to check for name match
    let existingCampaignsList: { id: string; name: string }[] = [];
    try {
      progress.currentStep = "既存キャンペーンを検索中...";
      onProgress({ ...progress });
      existingCampaignsList = await getCampaigns(
        context.accessToken,
        context.adAccountId
      );
    } catch {
      // If fetch fails, proceed with creation
    }

    for (const campaign of campaigns) {
      const item: SubmissionItemProgress = {
        type: "campaign",
        name: campaign.name,
        status: "in_progress",
      };
      items.push(item);

      // Check if campaign with same name already exists
      const existing = existingCampaignsList.find(
        (c) => c.name === campaign.name
      );

      if (existing) {
        campaignIdMap.set(campaign.name, existing.id);
        item.status = "success";
        item.metaId = existing.id;
        item.name = `${campaign.name}（既存を使用）`;
        progress.completedItems++;
        onProgress({ ...progress });
        continue;
      }

      progress.currentStep = `キャンペーン作成: ${campaign.name}`;
      onProgress({ ...progress });

      try {
        await rateLimiter.waitForSlot();
        const result = await createCampaign(
          context.accessToken,
          context.adAccountId,
          {
            name: campaign.name,
            objective: campaign.objective,
            dailyBudget: campaign.dailyBudget,
            specialAdCategories: campaign.specialAdCategories,
            status: campaign.status,
          }
        );
        campaignIdMap.set(campaign.name, result.id);
        item.status = "success";
        item.metaId = result.id;
        progress.completedItems++;
      } catch (err) {
        item.status = "error";
        item.error = err instanceof Error ? err.message : "Unknown error";
        progress.failedItems++;
      }
      onProgress({ ...progress });
    }
  }

  // Step 2: Create ad sets
  for (const campaign of campaigns) {
    const campaignId = campaignIdMap.get(campaign.name);
    if (!campaignId) continue;

    for (const adSet of campaign.adSets) {
      const item: SubmissionItemProgress = {
        type: "adset",
        name: adSet.name,
        status: "in_progress",
      };
      items.push(item);
      progress.currentStep = `広告セット作成: ${adSet.name}`;
      onProgress({ ...progress });

      try {
        await rateLimiter.waitForSlot();
        const result = await createAdSet(
          context.accessToken,
          context.adAccountId,
          {
            name: adSet.name,
            campaignId,
            dailyBudget: adSet.dailyBudget,
            optimizationGoal: adSet.optimizationGoal,
            billingEvent: adSet.billingEvent,
            startTime: adSet.startTime,
            endTime: adSet.endTime,
            targeting: adSet.targeting,
            status: adSet.status,
          }
        );
        adSetIdMap.set(adSet.name, result.id);
        item.status = "success";
        item.metaId = result.id;
        progress.completedItems++;
      } catch (err) {
        item.status = "error";
        item.error = err instanceof Error ? err.message : "Unknown error";
        progress.failedItems++;
      }
      onProgress({ ...progress });
    }
  }

  // Step 3: Create ads (image -> creative -> ad)
  for (const campaign of campaigns) {
    for (const adSet of campaign.adSets) {
      const adSetId = adSetIdMap.get(adSet.name);
      if (!adSetId) continue;

      for (const ad of adSet.ads) {
        // Upload image
        const imageItem: SubmissionItemProgress = {
          type: "image",
          name: ad.imageFilename || ad.name,
          status: "in_progress",
        };
        items.push(imageItem);
        progress.currentStep = `画像アップロード: ${ad.imageFilename || ad.name}`;
        onProgress({ ...progress });

        let imageHash: string | null = null;
        try {
          const imageBuffer = context.imageBuffers.get(
            ad.imageFilename || ""
          );
          if (!imageBuffer) throw new Error("画像ファイルが見つかりません");

          await rateLimiter.waitForSlot();
          const imageResult = await uploadImage(
            context.accessToken,
            context.adAccountId,
            imageBuffer,
            ad.imageFilename || "image.jpg"
          );
          imageHash = imageResult.hash;
          imageItem.status = "success";
          progress.completedItems++;
        } catch (err) {
          imageItem.status = "error";
          imageItem.error =
            err instanceof Error ? err.message : "Unknown error";
          progress.failedItems++;
          // Skip creative and ad creation
          progress.failedItems += 2;
          onProgress({ ...progress });
          continue;
        }
        onProgress({ ...progress });

        // Create creative
        const creativeItem: SubmissionItemProgress = {
          type: "creative",
          name: `${ad.name} クリエイティブ`,
          status: "in_progress",
        };
        items.push(creativeItem);
        progress.currentStep = `クリエイティブ作成: ${ad.name}`;
        onProgress({ ...progress });

        let creativeId: string | null = null;
        try {
          await rateLimiter.waitForSlot();
          const result = await createAdCreative(
            context.accessToken,
            context.adAccountId,
            {
              name: `${ad.name} - Creative`,
              pageId: context.pageId,
              imageHash,
              linkUrl: ad.linkUrl,
              message: ad.bodyText,
              headline: ad.headline,
              description: ad.description,
              ctaType: ad.ctaType,
            }
          );
          creativeId = result.id;
          creativeItem.status = "success";
          creativeItem.metaId = result.id;
          progress.completedItems++;
        } catch (err) {
          creativeItem.status = "error";
          creativeItem.error =
            err instanceof Error ? err.message : "Unknown error";
          progress.failedItems++;
          progress.failedItems++; // Skip ad
          onProgress({ ...progress });
          continue;
        }
        onProgress({ ...progress });

        // Create ad
        const adItem: SubmissionItemProgress = {
          type: "ad",
          name: ad.name,
          status: "in_progress",
        };
        items.push(adItem);
        progress.currentStep = `広告作成: ${ad.name}`;
        onProgress({ ...progress });

        try {
          await rateLimiter.waitForSlot();
          const result = await createAd(
            context.accessToken,
            context.adAccountId,
            {
              name: ad.name,
              adSetId,
              creativeId,
              status: ad.status,
            }
          );
          adItem.status = "success";
          adItem.metaId = result.id;
          progress.completedItems++;
        } catch (err) {
          adItem.status = "error";
          adItem.error =
            err instanceof Error ? err.message : "Unknown error";
          progress.failedItems++;
        }
        onProgress({ ...progress });
      }
    }
  }

  progress.currentStep = "完了";
  onProgress({ ...progress });
  return progress;
}
