import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return NextResponse.json({ error: "Server nicht konfiguriert" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uid = userData.user.id;

  const tables = ["meal_entries", "daily_notes", "favorite_meals", "profiles"] as const;
  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq("user_id", uid);
    if (error) {
      return NextResponse.json(
        { error: `Daten konnten nicht gelöscht werden: ${error.message}` },
        { status: 500 },
      );
    }
  }

  const { error: deleteUserError } = await admin.auth.admin.deleteUser(uid);
  if (deleteUserError) {
    return NextResponse.json(
      { error: `Konto konnte nicht gelöscht werden: ${deleteUserError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
