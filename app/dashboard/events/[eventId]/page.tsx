import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCommunityForHost } from "@/lib/queries";
import { formatDate, formatTime } from "@/lib/utils";

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
    .select("id, name, event_date, event_time, location, slug")
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

  const confirmed = (bookings ?? []).filter((b) => b.status === "confirmed");
  const waitlisted = (bookings ?? []).filter((b) => b.status === "waitlisted");

  return (
    <div className="p-8 max-w-4xl">
      {/* Back + header */}
      <Link
        href="/dashboard/events"
        className="text-xs text-muted hover:text-charcoal transition-colors mb-6 inline-flex items-center gap-1"
      >
        ← Back to events
      </Link>

      <div className="mb-8 mt-2">
        <h1 className="text-2xl font-semibold text-charcoal">{event.name}</h1>
        <p className="text-sm text-muted mt-1">
          {formatDate(event.event_date)} at {formatTime(event.event_time)} · {event.location}
        </p>
      </div>

      {/* Confirmed */}
      <section className="mb-10">
        <p className="text-xs text-muted uppercase tracking-wide mb-3">
          Confirmed ({confirmed.length})
        </p>
        {confirmed.length === 0 ? (
          <p className="text-sm text-muted bg-white border border-sand rounded-xl px-6 py-8 text-center">
            No confirmed bookings yet.
          </p>
        ) : (
          <AttendeeTable rows={confirmed} />
        )}
      </section>

      {/* Waitlist */}
      {waitlisted.length > 0 && (
        <section>
          <p className="text-xs text-muted uppercase tracking-wide mb-3">
            Waitlist ({waitlisted.length})
          </p>
          <AttendeeTable rows={waitlisted} />
        </section>
      )}
    </div>
  );
}

type BookingRow = {
  id: string;
  member_name: string;
  member_email: string;
  member_whatsapp: string | null;
  status: string;
  created_at: string;
};

function AttendeeTable({ rows }: { rows: BookingRow[] }) {
  return (
    <div className="bg-white border border-sand rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-sand">
            <th className="text-left px-5 py-3 text-xs text-muted font-medium">Name</th>
            <th className="text-left px-5 py-3 text-xs text-muted font-medium">Email</th>
            <th className="text-left px-5 py-3 text-xs text-muted font-medium">WhatsApp</th>
            <th className="text-left px-5 py-3 text-xs text-muted font-medium">Booked at</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} className={i < rows.length - 1 ? "border-b border-sand/60" : ""}>
              <td className="px-5 py-3 text-charcoal font-medium">{row.member_name}</td>
              <td className="px-5 py-3 text-muted">{row.member_email}</td>
              <td className="px-5 py-3 text-muted">{row.member_whatsapp ?? "—"}</td>
              <td className="px-5 py-3 text-muted">
                {new Date(row.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
