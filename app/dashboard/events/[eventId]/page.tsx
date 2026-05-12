import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCommunityForHost } from "@/lib/queries";
import EventDetailClient from "./EventDetailClient";

interface Props {
  params: Promise<{ eventId: string }>;
}

export default async function EventAttendeesPage({ params }: Props) {
  const { eventId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const community = await getCommunityForHost(supabase, user.id);
  if (!community) redirect("/onboarding");

  const svc = createServiceClient();

  const { data: event } = await svc
    .from("events")
    .select("id, name, event_date, event_time, location, slug, description, capacity, price, status")
    .eq("id", eventId)
    .eq("community_id", community.id)
    .single();

  if (!event) notFound();

  const { data: bookings } = await svc
    .from("bookings")
    .select("id, member_name, member_email, member_whatsapp, status, created_at")
    .eq("event_id", eventId)
    .in("status", ["confirmed", "waitlisted"])
    .order("created_at", { ascending: true });

  return (
    <EventDetailClient
      event={event}
      bookings={bookings ?? []}
    />
  );
}
