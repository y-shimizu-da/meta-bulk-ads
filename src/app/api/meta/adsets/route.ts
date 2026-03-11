import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAccessToken } from "@/lib/session";
import { createAdSet } from "@/lib/meta-api";

const adAccountIdPattern = /^act_\d+$/;

const createAdSetSchema = z.object({
  adAccountId: z.string().regex(adAccountIdPattern, "Invalid adAccountId format"),
  name: z.string().min(1),
  campaignId: z.string().min(1),
  dailyBudget: z.number().min(0),
  optimizationGoal: z.string().min(1),
  billingEvent: z.string().default("IMPRESSIONS"),
  startTime: z.string().min(1),
  endTime: z.string().optional(),
  targeting: z.object({
    geo_locations: z.object({ countries: z.array(z.string()) }),
    age_min: z.number().optional(),
    age_max: z.number().optional(),
    genders: z.array(z.number()).optional(),
    interests: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
  }),
  status: z.enum(["PAUSED", "ACTIVE"]).default("PAUSED"),
});

export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = createAdSetSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: result.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const data = result.data;
    const adSetResult = await createAdSet(accessToken, data.adAccountId, {
      name: data.name,
      campaignId: data.campaignId,
      dailyBudget: data.dailyBudget,
      optimizationGoal: data.optimizationGoal as Parameters<typeof createAdSet>[2]["optimizationGoal"],
      billingEvent: data.billingEvent,
      startTime: data.startTime,
      endTime: data.endTime,
      targeting: data.targeting,
      status: data.status,
    });
    return NextResponse.json(adSetResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create ad set";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
