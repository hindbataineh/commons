import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDashboardOverview } from "@/lib/queries";
import { formatPrice, formatRevenue, formatShortDate, formatTime } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getDashboardOverview(supabase, user.id);
  if (!data) redirect("/complete-profile");

  const { community, stats, quietMembersCount, nextEvents, recentMembers, totalEvents } = data;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-[34px] font-semibold tracking-tight text-carbon">Dashboard</h1>
        <p className="text-[15px] text-stone mt-1">{community.name}</p>
      </div>

      {/* Welcome state — shown when no events have been created yet */}
      {totalEvents === 0 && (
        <div className="mb-8 bg-white border border-[#D8D2C6] rounded-xl px-8 py-12 text-center">
          <h2 className="text-[20px] font-semibold text-carbon mb-2">Welcome to Commons</h2>
          <p className="text-[15px] text-stone mb-6 max-w-xs mx-auto">
            Your community is set up. Create your first event to get your booking link.
          </p>
          <Link
            href="/dashboard/events/new"
            className="inline-block bg-carbon text-cream text-sm font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            + Create your first event
          </Link>
        </div>
      )}

      {/* Alert banner */}
      {quietMembersCount > 0 && (
        <div className="mb-6 bg-mint border border-[#2A6B4D] rounded-xl px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-[15px] text-carbon">
            <strong>{quietMembersCount} regular{quietMembersCount !== 1 ? "s" : ""}</strong>{" "}
            have missed your last 3 events.
          </p>
          <Link
            href="/dashboard/members?filter=at-risk"
            className="text-sm text-sea-green font-medium hover:underline whitespace-nowrap"
          >
            View members →
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total members" value={stats.totalMembers.toString()} />
        <StatCard
          label="Revenue this month"
          value={formatRevenue(stats.revenueThisMonth)}
        />
        <StatCard
          label="Avg fill rate"
          value={nextEvents.length === 0 ? "—" : `${Math.round(stats.avgFillRate * 100)}%`}
        />
        <StatCard
          label="Return rate"
          value={stats.totalMembers === 0 ? "—" : `${Math.round(stats.returnRate * 100)}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Upcoming events */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-medium text-stone uppercase tracking-wide">Upcoming events</h2>
            <Link href="/dashboard/events" className="text-xs text-sea-green hover:underline">
              All events →
            </Link>
          </div>

          {nextEvents.length === 0 ? (
            <div className="bg-white border border-[#D8D2C6] rounded-xl px-5 py-8 text-center">
              <p className="text-[15px] text-stone">No upcoming events.</p>
              <Link
                href="/dashboard/events/new"
                className="mt-3 inline-block text-sm text-sea-green hover:underline"
              >
                Create one →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {nextEvents.map((event) => {
                const fillPct = Math.min(100, Math.round((event.confirmedCount / event.capacity) * 100));
                return (
                  <Link key={event.id} href={`/dashboard/events/${event.id}`} className="block bg-white border border-[#D8D2C6] rounded-xl px-5 py-4 hover:border-carbon/30 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-carbon text-sm">{event.name}</p>
                        <p className="text-[13px] text-stone mt-0.5">
                          {formatShortDate(event.event_date)} · {formatTime(event.event_time)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] text-stone">Revenue</p>
                        <p className="text-sm font-semibold text-carbon">
                          {formatRevenue(event.revenue)}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between text-[13px] text-stone mb-1.5">
                      <span>{event.confirmedCount}/{event.capacity} going</span>
                      {event.waitlistedCount > 0 && (
                        <span className="text-stone">{event.waitlistedCount} waitlisted</span>
                      )}
                    </div>
                    <div className="h-1 bg-[#D8D2C6] rounded-full overflow-hidden">
                      <div className="h-full bg-carbon rounded-full" style={{ width: `${fillPct}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Booking link panel */}
        <div>
          <h2 className="text-[13px] font-medium text-stone uppercase tracking-wide mb-4">Booking link</h2>
          <BookingLinkPanel
            path={`/${community.slug}`}
            bookingsThisMonth={stats.bookingsThisMonth}
          />
        </div>
      </div>

      {/* Recent members */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-medium text-stone uppercase tracking-wide">Recent members</h2>
          <Link href="/dashboard/members" className="text-xs text-sea-green hover:underline">
            All members →
          </Link>
        </div>

        {recentMembers.length === 0 ? (
          <div className="bg-white border border-[#D8D2C6] rounded-xl px-5 py-8 text-center">
            <p className="text-[15px] text-stone">No members yet. Share your booking link to get started.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#D8D2C6] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D8D2C6]">
                  <th className="text-left px-5 py-3 text-[13px] text-stone font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-[13px] text-stone font-medium">Email</th>
                  <th className="text-center px-4 py-3 text-[13px] text-stone font-medium">Bookings</th>
                  <th className="text-left px-5 py-3 text-[13px] text-stone font-medium">Last attended</th>
                </tr>
              </thead>
              <tbody>
                {recentMembers.map((m, i) => (
                  <tr key={m.id} className={i < recentMembers.length - 1 ? "border-b border-[#D8D2C6]/60" : ""}>
                    <td className="px-5 py-3 font-semibold text-carbon">{m.name}</td>
                    <td className="px-5 py-3 text-stone">{m.email}</td>
                    <td className="px-4 py-3 text-center text-carbon">{m.total_bookings}</td>
                    <td className="px-5 py-3 text-stone">
                      {m.last_attended ? formatShortDate(m.last_attended) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-[#D8D2C6] rounded-xl px-5 py-5">
      <p className="text-[13px] text-stone mb-2">{label}</p>
      <p className="text-2xl font-semibold text-carbon">{value}</p>
    </div>
  );
}

import BookingLinkPanel from "./BookingLinkPanel";
