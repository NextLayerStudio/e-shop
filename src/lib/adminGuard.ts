import { NextResponse } from "next/server";
import { getSession } from "./auth";

/**
 * Returns null if authorized; otherwise a 401 response. Use in API routes:
 *
 *   const unauth = await requireAdmin();
 *   if (unauth) return unauth;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Neautorizovaný prístup." },
      { status: 401 }
    );
  }
  return null;
}
