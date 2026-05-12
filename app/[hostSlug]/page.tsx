import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { formatDate, formatPrice, formatTime } from "@/lib/utils";

interface Props {
  params: Promise<{ hostSlug: string }>;
}

const communityTypeLabel: Record<string, string> = {
  run_club: "Run Club",
  fitness: "Fitness",
  yoga: "Yoga",
  creative: "Creative",
  social: "Social",
  sports: "Sports",
  other: "Community",
};

export default async function CommunityPage({ params }: Props) {
  const { hostSlug } = await params;
  const supabase = await createClient();

  const { data: community } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", hostSlug)
    .single();

  if (!community) notFound();

  const today = new Date().toISOString().split("T")[0];

  const { data: events } = await supabase
    .from("events")
    .select("id, name, slug, event_date, event_time, location, price, currency, capacity")
    .eq("community_id", community.id)
    .eq("status", "active")
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true });

  const upcomingEvents = events ?? [];

  // Fetch confirmed booking counts for all events in one query
  const eventIds = upcomingEvents.map((e) => e.id);
  let bookedCounts: Record<string, number> = {};

  if (eventIds.length > 0) {
    const svc = createServiceClient();
    const { data: bookingRows } = await svc
      .from("bookings")
      .select("event_id")
      .in("event_id", eventIds)
      .in("status", ["confirmed"]);

    if (bookingRows) {
      bookedCounts = bookingRows.reduce<Record<string, number>>((acc, row) => {
        acc[row.event_id] = (acc[row.event_id] ?? 0) + 1;
        return acc;
      }, {});
    }
  }

  const typeLabel = communityTypeLabel[community.type] ?? "Community";

  return (
    <main className="min-h-screen bg-off-white px-4 py-10 md:py-16">
      <div className="max-w-lg mx-auto">
        {/* Community header */}
        <div className="mb-10">
          <span className="inline-block text-xs font-medium text-terracotta bg-terracotta/10 px-2.5 py-1 rounded-full mb-4">
            {typeLabel}
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-medium leading-tight text-charcoal mb-3">
            {community.name}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted mb-4">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span>{community.location}</span>
          </div>
          {community.description && (
            <p className="text-sm text-muted leading-relaxed">{community.description}</p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-sand mb-8" />

        {/* Events section */}
        <h2 className="text-xs font-medium text-muted tracking-widest uppercase mb-6">
          Upcoming Events
        </h2>

        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-muted">
            No upcoming events right now — check back soon.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {upcomingEvents.map((event) => {
              const booked = bookedCounts[event.id] ?? 0;
              const spotsLeft = event.capacity - booked;
              const isFull = spotsLeft <= 0;
              const fillPercent = Math.min(100, Math.round((booked / event.capacity) * 100));

              return (
                <Link
                  key={event.id}
                  href={`/${hostSlug}/${event.slug}`}
                  className="block group"
                >
                  <div className="bg-white border border-sand rounded-xl p-5 transition-colors group-hover:border-charcoal/30 group-hover:bg-cream/40">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-medium text-charcoal group-hover:text-terracotta transition-colors">
                        {event.name}
                      </h3>
                      {event.price === 0 ? (
                        <span className="shrink-0 inline-block bg-charcoal text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                          FREE
                        </span>
                      ) : (
                        <span className="shrink-0 inline-block bg-terracotta text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {formatPrice(event.price, event.currency)}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs text-muted mb-4">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <span>{formatDate(event.event_date)} at {formatTime(event.event_time)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span>{event.location}</span>
                      </div>
                    </div>

                    {/* Capacity */}
                    <div>
                      <div className="flex justify-between text-xs text-muted mb-1.5">
                        <span>{booked} going</span>
                        <span className={isFull ? "text-terracotta font-medium" : ""}>
                          {isFull ? "Full — join waitlist" : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
                        </span>
                      </div>
                      <div className="h-1 bg-sand rounded-full overflow-hidden">
                        <div
                          className="h-full bg-terracotta rounded-full"
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
