import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCommunityForHost, getAllEventsWithStats } from "@/lib/queries";
import { formatPrice, formatShortDate, formatTime } from "@/lib/utils";

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const community = await getCommunityForHost(supabase, user.id);
  if (!community) redirect("/onboarding");

  const events = await getAllEventsWithStats(supabase, community.id);
  const upcoming = events.filter((e) => !e.isPast);
  const past = events.filter((e) => e.isPast);

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Events</h1>
          <p className="text-sm text-muted mt-1">{community.name}</p>
        </div>
        <Link
          href="/dashboard/events/new"
          className="bg-terracotta text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-terracotta/90 transition-colors"
        >
          + New event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-white border border-sand rounded-xl px-6 py-12 text-center">
          <p className="text-muted mb-3">No events yet.</p>
          <Link href="/dashboard/events/new" className="text-sm text-terracotta hover:underline">
            Create your first event →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {upcoming.length > 0 && (
            <section>
              <p className="text-xs text-muted uppercase tracking-wide mb-3">Upcoming</p>
              <EventTable events={upcoming} communitySlug={community.slug} />
            </section>
          )}
          {past.length > 0 && (
            <section>
              <p className="text-xs text-muted uppercase tracking-wide mb-3">Past</p>
              <EventTable events={past} communitySlug={community.slug} faded />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

type EventWithStats = Awaited<ReturnType<typeof getAllEventsWithStats>>[number];

function EventTable({
  events,
  communitySlug,
  faded = false,
}: {
  events: EventWithStats[];
  communitySlug: string;
  faded?: boolean;
}) {
  return (
    <div className={`bg-white border border-sand rounded-xl overflow-hidden ${faded ? "opacity-70" : ""}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sand">
            <th className="text-left px-5 py-3 text-xs text-muted font-medium">Event</th>
            <th className="text-left px-5 py-3 text-xs text-muted font-medium">Date</th>
            <th className="text-center px-4 py-3 text-xs text-muted font-medium">Booked</th>
            <th className="text-left px-5 py-3 text-xs text-muted font-medium">Revenue</th>
            <th className="text-left px-5 py-3 text-xs text-muted font-medium">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {events.map((event, i) => {
            const fillPct = Math.min(100, Math.round((event.confirmedCount / event.capacity) * 100));
            return (
              <tr key={event.id} className={i < events.length - 1 ? "border-b border-sand/60" : ""}>
                <td className="px-5 py-4">
                  <p className="font-medium text-charcoal">{event.name}</p>
                  {event.waitlistedCount > 0 && (
                    <p className="text-xs text-terracotta mt-0.5">{event.waitlistedCount} waitlisted</p>
                  )}
                </td>
                <td className="px-5 py-4 text-muted">
                  {formatShortDate(event.event_date)}
                  <span className="block text-xs">{formatTime(event.event_time)}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-charcoal font-medium">
                      {event.confirmedCount}/{event.capacity}
                    </span>
                    <div className="w-16 h-1 bg-sand rounded-full overflow-hidden">
                      <div className="h-full bg-terracotta rounded-full" style={{ width: `${fillPct}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-charcoal">
                  {event.revenue === 0 ? (
                    <span className="text-muted">—</span>
                  ) : (
                    formatPrice(event.revenue)
                  )}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={event.status} isPast={event.isPast} />
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="text-xs text-muted hover:text-terracotta transition-colors"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status, isPast }: { status: string; isPast: boolean }) {
  if (isPast) return <span className="text-xs text-muted bg-sand/50 px-2 py-0.5 rounded-full">Past</span>;
  if (status === "cancelled") return <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Cancelled</span>;
  return <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Active</span>;
}
