import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, slug, type, custom_type, location, description, instagram_handle, website } = body;

  if (!name || !slug || !type || !location || !description || !instagram_handle) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const svc = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: hostError } = await (svc.from("hosts") as any).upsert({
    id: user.id,
    email: user.email,
    name,
    onboarding_complete: false,
  });

  if (hostError) {
    return NextResponse.json({ error: hostError.message }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: communityError } = await (svc.from("communities") as any).insert({
    host_id: user.id,
    name,
    slug,
    type,
    custom_type: type === "other" ? custom_type || null : null,
    location,
    description,
    instagram_handle,
    website: website || null,
  });

  if (communityError) {
    if (communityError.message.includes("unique") || communityError.code === "23505") {
      return NextResponse.json(
        { error: `The URL "${slug}" is already taken. Please choose another.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: communityError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
