import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/session";
import { uploadImage } from "@/lib/meta-api";

const MAX_IMAGE_SIZE = 30 * 1024 * 1024; // 30MB (Meta API limit)
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const adAccountIdPattern = /^act_\d+$/;

export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const adAccountId = formData.get("adAccountId") as string;
  const file = formData.get("file") as File;

  if (!file || !adAccountId) {
    return NextResponse.json(
      { error: "Missing file or adAccountId" },
      { status: 400 }
    );
  }

  // Validate adAccountId format
  if (!adAccountIdPattern.test(adAccountId)) {
    return NextResponse.json(
      { error: "Invalid adAccountId format" },
      { status: 400 }
    );
  }

  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}. Allowed: JPG, PNG, GIF, WebP` },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 30MB` },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadImage(accessToken, adAccountId, buffer, file.name);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
