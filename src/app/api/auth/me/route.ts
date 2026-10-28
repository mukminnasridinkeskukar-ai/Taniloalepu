import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { getSessionUser, publicUser } from "@/lib/auth";

// GET /api/auth/me — informasi pengguna yang sedang masuk
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ user: null });
  const full = await store.users.byId(user.id);
  return NextResponse.json({ user: publicUser(full) });
}
