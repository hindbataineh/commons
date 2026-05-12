import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { formatDate, formatPrice, formatTime } from "@/lib/utils";
import BookingForm from "./BookingForm";

interface Props {
  params: Promise<{ hostSlug: string; eventSlug: string }>;
}

export default async function EventPage({ params }: Props) {
  const { hostSlug, eventSlug } = await params;
  const supabase = await createClient();

  const { data: community } = await supabase
    .from("communities")
    .select("id, name, location, slug")
    .eq("slug", hostSlug)
    .single();

  if (!community) notFound();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("community_id", community.id)
    .eq("slug", eventSlug)
    .single();

  if (!event || event.status !== "active") notFound();

  const svc = createServiceClient();
  const { count: bookedCount } = await svc
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("event_id", event.id)
    .in("status", ["confirmed", "waitlisted"]);

  const confirmedCount = bookedCount ?? 0;
  const spotsLeft = event.capacity - confirmedCount;
  const isFull = spotsLeft <= 0;
  const fillPercent = Math.min(100, Math.round((confirmedCount / event.capacity) * 100));

  return (
    <main className="min-h-screen bg-off-white px-4 py-10 md:py-16">
      <div className="max-w-lg mx-auto">
        {/* Community name */}
        <p className="text-sm text-muted mb-6 tracking-wide uppercase">
          {community.name}
        </p>

        {/* Event name */}
        <h1 className="font-display text-4xl md:text-5xl font-medium leading-tight text-charcoal mb-6">
          {event.name}
        </h1>

        {/* Meta row */}
        <div className="flex flex-col gap-2 mb-6 text-sm text-muted">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span>{formatDate(event.event_date)} at {formatTime(event.event_time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span>{event.location}</span>
          </div>
        </div>

        {/* Price badge */}
        <div className="mb-6">
          {event.price === 0 ? (
            <span className="inline-block bg-charcoal text-white text-xs font-medium px-3 py-1 rounded-full">
              FREE
            </span>
          ) : (
            <span className="inline-block bg-terracotta text-white text-sm font-medium px-3 py-1.5 rounded-full">
              {formatPrice(event.price, event.currency)}
            </span>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-muted leading-relaxed mb-8">
            {event.description}
          </p>
        )}

        {/* Capacity bar — only shown when ≥70% full or sold out */}
        {(fillPercent >= 70 || isFull) && (
          <div className="mb-8">
            <div className="flex justify-between text-xs text-muted mb-2">
              <span>{confirmedCount} going</span>
              <span>{isFull ? "Full" : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}</span>
            </div>
            <div className="h-1.5 bg-sand rounded-full overflow-hidden">
              <div
                className="h-full bg-terracotta rounded-full transition-all"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Booking form */}
        <div className="border-t border-sand pt-8">
          <h2 className="text-base font-medium text-charcoal mb-6">
            {isFull ? "Join the waitlist" : "Reserve your spot"}
          </h2>
          <BookingForm
            eventId={event.id}
            hostSlug={hostSlug}
            eventSlug={eventSlug}
            isFree={event.price === 0}
            isFull={isFull}
          />
          {isFull && event.price > 0 && (
            <p className="text-xs text-center text-muted mt-3">
              You won&rsquo;t be charged now. If a spot opens, we&rsquo;ll notify you by email before any payment is taken.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
