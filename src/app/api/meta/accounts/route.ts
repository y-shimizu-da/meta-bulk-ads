import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/session";
import { getAdAccounts } from "@/lib/meta-api";

export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  
  try {
    const accounts = await getAdAccounts(accessToken);
    return NextResponse.json({ accounts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch accounts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
