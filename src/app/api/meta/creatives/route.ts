import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAccessToken } from "@/lib/session";
import { createAdCreative } from "@/lib/meta-api";

const adAccountIdPattern = /^act_\d+$/;

const createCreativeSchema = z.object({
  adAccountId: z.string().regex(adAccountIdPattern, "Invalid adAccountId format"),
  name: z.string().min(1),
  pageId: z.string().min(1),
  imageHash: z.string().min(1),
  linkUrl: z.string().url(),
  message: z.string().min(1),
  headline: z.string().min(1),
  description: z.string().optional().default(""),
  ctaType: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = createCreativeSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: result.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const data = result.data;
    const creativeResult = await createAdCreative(accessToken, data.adAccountId, {
      name: data.name,
      pageId: data.pageId,
      imageHash: data.imageHash,
      linkUrl: data.linkUrl,
      message: data.message,
      headline: data.headline,
      description: data.description,
      ctaType: data.ctaType as Parameters<typeof createAdCreative>[2]["ctaType"],
    });
    return NextResponse.json(creativeResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create creative";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
