import { NextRequest } from "next/server";
import { z } from "zod";
import { getAccessToken } from "@/lib/session";
import { executeBulkSubmission } from "@/lib/bulk-orchestrator";
import type { CampaignInput } from "@/lib/meta-types";

const adAccountIdPattern = /^act_\d+$/;

const submitSchema = z.object({
  adAccountId: z.string().regex(adAccountIdPattern, "Invalid adAccountId format"),
  pageId: z.string().min(1, "pageId is required"),
  existingCampaignId: z.string().optional(),
  campaigns: z.array(
    z.object({
      name: z.string().min(1),
      objective: z.string().min(1),
      dailyBudget: z.number(),
      specialAdCategories: z.array(z.string()),
      status: z.enum(["PAUSED", "ACTIVE"]),
      adSets: z.array(
        z.object({
          name: z.string().min(1),
          campaignName: z.string().min(1),
          dailyBudget: z.number().min(0),
          optimizationGoal: z.string().min(1),
          billingEvent: z.string().min(1),
          startTime: z.string().min(1),
          endTime: z.string().optional(),
          targeting: z.object({
            geo_locations: z.object({ countries: z.array(z.string()) }),
            age_min: z.number().optional(),
            age_max: z.number().optional(),
            genders: z.array(z.number()).optional(),
            interests: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
          }),
          status: z.enum(["PAUSED", "ACTIVE"]),
          ads: z.array(
            z.object({
              name: z.string().min(1),
              adSetName: z.string().min(1),
              imageFilename: z.string().optional(),
              headline: z.string().min(1),
              bodyText: z.string().min(1),
              description: z.string().optional().default(""),
              linkUrl: z.string().url(),
              ctaType: z.string().min(1),
              status: z.enum(["PAUSED", "ACTIVE"]),
            })
          ),
        })
      ),
    })
  ),
});

export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const formData = await request.formData();

  const adAccountId = formData.get("adAccountId") as string;
  const pageId = formData.get("pageId") as string;
  const existingCampaignId = (formData.get("existingCampaignId") as string) || undefined;
  const campaignsJson = formData.get("campaigns") as string;

  // Validate input with Zod
  let campaigns: CampaignInput[];
  try {
    const parsed = JSON.parse(campaignsJson);
    const result = submitSchema.safeParse({
      adAccountId,
      pageId,
      existingCampaignId: existingCampaignId || undefined,
      campaigns: parsed,
    });
    if (!result.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request data", details: result.error.flatten() }),
        { status: 400 }
      );
    }
    campaigns = result.data.campaigns as CampaignInput[];
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON in campaigns field" }),
      { status: 400 }
    );
  }

  // Collect image buffers (use Blob check for Node.js compatibility)
  const imageBuffers = new Map<string, Buffer>();
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("image:") && typeof value !== "string") {
      const filename = key.replace("image:", "");
      const buffer = Buffer.from(await (value as Blob).arrayBuffer());
      imageBuffers.set(filename, buffer);
    }
  }

  // Use SSE for progress streaming
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await executeBulkSubmission(
          { accessToken, adAccountId, pageId, existingCampaignId, imageBuffers },
          campaigns,
          (progress) => {
            const data = `data: ${JSON.stringify(progress)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
