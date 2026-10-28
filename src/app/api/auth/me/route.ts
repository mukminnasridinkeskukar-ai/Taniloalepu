import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

// GET /api/auth/me — informasi pengguna yang sedang masuk
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  return NextResponse.json({ user });
}
