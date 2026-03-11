import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getAccessToken(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return null;
  return session.accessToken;
}
