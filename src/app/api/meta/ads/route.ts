import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAccessToken } from "@/lib/session";
import { createAd } from "@/lib/meta-api";

const adAccountIdPattern = /^act_\d+$/;

const createAdSchema = z.object({
  adAccountId: z.string().regex(adAccountIdPattern, "Invalid adAccountId format"),
  name: z.string().min(1, "Ad name is required"),
  adSetId: z.string().min(1, "adSetId is required"),
  creativeId: z.string().min(1, "creativeId is required"),
  status: z.enum(["PAUSED", "ACTIVE"]).default("PAUSED"),
});

export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = createAdSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: result.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const data = result.data;
    const adResult = await createAd(accessToken, data.adAccountId, {
      name: data.name,
      adSetId: data.adSetId,
      creativeId: data.creativeId,
      status: data.status,
    });
    return NextResponse.json(adResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create ad";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
