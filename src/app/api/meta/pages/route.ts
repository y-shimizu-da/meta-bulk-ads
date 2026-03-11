import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/session";
import { getPages } from "@/lib/meta-api";

export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  
  try {
    const pages = await getPages(accessToken);
    return NextResponse.json({ pages });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch pages";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
