import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAccessToken } from "@/lib/session";
import { createCampaign } from "@/lib/meta-api";

const adAccountIdPattern = /^act_\d+$/;

const createCampaignSchema = z.object({
  adAccountId: z.string().regex(adAccountIdPattern, "Invalid adAccountId format"),
  name: z.string().min(1),
  objective: z.string().min(1),
  dailyBudget: z.number(),
  specialAdCategories: z.array(z.string()).default([]),
  status: z.enum(["PAUSED", "ACTIVE"]).default("PAUSED"),
});

export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = createCampaignSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: result.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const data = result.data;
    const campaignResult = await createCampaign(accessToken, data.adAccountId, {
      name: data.name,
      objective: data.objective as Parameters<typeof createCampaign>[2]["objective"],
      dailyBudget: data.dailyBudget,
      specialAdCategories: data.specialAdCategories,
      status: data.status,
    });
    return NextResponse.json(campaignResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create campaign";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
