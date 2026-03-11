import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/session";
import { getCampaigns } from "@/lib/meta-api";

export async function GET(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adAccountId = request.nextUrl.searchParams.get("adAccountId");
  if (!adAccountId) {
    return NextResponse.json({ error: "Missing adAccountId" }, { status: 400 });
  }
  if (!/^act_\d+$/.test(adAccountId)) {
    return NextResponse.json({ error: "Invalid adAccountId format" }, { status: 400 });
  }

  try {
    const campaigns = await getCampaigns(accessToken, adAccountId);
    return NextResponse.json({ campaigns });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch campaigns";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
