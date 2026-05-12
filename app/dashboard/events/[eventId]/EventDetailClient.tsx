"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type BookingRow = {
  id: string;
  member_name: string;
  member_email: string;
  member_whatsapp: string | null;
  status: string;
  created_at: string;
};

type EventData = {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  location: string;
  slug: string;
  description: string | null;
  capacity: number;
  price: number;
  status: string;
};

const baseInput =
  "w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-muted/50 focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal/20 transition-colors";
const baseLabel = "text-sm font-medium text-charcoal";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });
}
function formatTime(t: string) {
  const [h, m] = t.split(":");
  const d = new Date();
  d.setHours(parseInt(h), parseInt(m));
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function EventDetailClient({
  event,
  bookings,
}: {
  event: EventData;
  bookings: BookingRow[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState("");
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [promoteErrors, setPromoteErrors] = useState<Record<string, string>>({});
  const [promotedIds, setPromotedIds] = useState<Set<string>>(new Set());
  const [overCapacityConfirm, setOverCapacityConfirm] = useState<{ id: string; name: string } | null>(null);

  const [editForm, setEditForm] = useState({
    name: event.name,
    date: event.event_date,
    time: event.event_time,
    location: event.location,
    description: event.description ?? "",
    capacity: String(event.capacity),
    priceAed: String(event.price / 100),
  });

  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const waitlisted = bookings.filter((b) => b.status === "waitlisted");

  async function handleSaveEdit() {
    setSaving(true);
    setActionError("");
    const res = await fetch("/api/update-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: event.id, ...editForm }),
    });
    const json = await res.json();
    if (!res.ok) {
      setActionError(json.error || "Failed to update event");
      setSaving(false);
      return;
    }
    setEditing(false);
    setSaving(false);
    router.refresh();
  }

  async function handleCancel() {
    setCancelling(true);
    setActionError("");
    const res = await fetch("/api/cancel-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: event.id }),
    });
    const json = await res.json();
    if (!res.ok) {
      setActionError(json.error || "Failed to cancel event");
      setCancelling(false);
      setShowCancelConfirm(false);
      return;
    }
    router.push("/dashboard/events");
  }

  async function handlePromote(bookingId: string, force = false) {
    setPromotingId(bookingId);
    setOverCapacityConfirm(null);
    setPromoteErrors((p) => ({ ...p, [bookingId]: "" }));
    const res = await fetch("/api/promote-from-waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, force }),
    });
    const json = await res.json();
    setPromotingId(null);
    if (!res.ok) {
      if (json.code === "OVER_CAPACITY") {
        const row = waitlisted.find((b) => b.id === bookingId);
        setOverCapacityConfirm({ id: bookingId, name: row?.member_name ?? "this member" });
        return;
      }
      setPromoteErrors((p) => ({ ...p, [bookingId]: json.error || "Failed to promote" }));
      return;
    }
    setPromotedIds((p) => new Set(p).add(bookingId));
    router.refresh();
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Back */}
      <Link
        href="/dashboard/events"
        className="text-xs text-muted hover:text-charcoal transition-colors mb-6 inline-flex items-center gap-1"
      >
        ← Back to events
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8 mt-2">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">{event.name}</h1>
          <p className="text-sm text-muted mt-1">
            {formatDate(event.event_date)} at {formatTime(event.event_time)} · {event.location}
          </p>
          {event.status === "cancelled" && (
            <span className="inline-block mt-2 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Cancelled</span>
          )}
        </div>
        {event.status !== "cancelled" && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => { setEditing((v) => !v); setActionError(""); }}
              className="text-xs border border-sand text-charcoal rounded-lg px-3 py-1.5 hover:bg-sand/30 transition-colors"
            >
              {editing ? "Discard" : "Edit"}
            </button>
            <button
              onClick={() => { setShowCancelConfirm(true); setActionError(""); }}
              className="text-xs border border-red-200 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
            >
              Cancel event
            </button>
          </div>
        )}
      </div>

      {actionError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
          {actionError}
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="bg-white border border-sand rounded-xl p-6 mb-8">
          <h2 className="text-sm font-medium text-charcoal mb-4">Edit event</h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={baseLabel}>Event name</label>
              <input className={baseInput} value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={baseLabel}>Date</label>
                <input type="date" className={baseInput} value={editForm.date}
                  onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={baseLabel}>Time</label>
                <input type="time" className={baseInput} value={editForm.time}
                  onChange={(e) => setEditForm((p) => ({ ...p, time: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={baseLabel}>Location</label>
              <input className={baseInput} value={editForm.location}
                onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={baseLabel}>Description <span className="text-muted font-normal">(optional)</span></label>
              <textarea className={`${baseInput} resize-none`} rows={3} maxLength={500}
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={baseLabel}>Price (AED)</label>
                <input type="number" min="0" step="1" className={baseInput} value={editForm.priceAed}
                  onChange={(e) => setEditForm((p) => ({ ...p, priceAed: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={baseLabel}>Capacity</label>
                <input type="number" min="1" className={baseInput} value={editForm.capacity}
                  onChange={(e) => setEditForm((p) => ({ ...p, capacity: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditing(false)}
                className="flex-1 border border-sand text-charcoal rounded-lg px-4 py-2.5 text-sm hover:bg-sand/30 transition-colors">
                Discard
              </button>
              <button onClick={handleSaveEdit} disabled={saving}
                className="flex-1 bg-charcoal text-cream rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-charcoal/90 transition-colors disabled:opacity-50">
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirmation */}
      {showCancelConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-8">
          <p className="text-sm font-medium text-red-800 mb-1">Cancel this event?</p>
          <p className="text-xs text-red-700 mb-2">Members will not be notified automatically.</p>
          {event.price > 0 && (
            <p className="text-xs text-red-700 mb-4">
              This event has paid bookings. You will need to refund members manually through your Stripe dashboard at{" "}
              <span className="font-medium">dashboard.stripe.com</span>
            </p>
          )}
          {event.price === 0 && <div className="mb-4" />}
          <div className="flex gap-3">
            <button onClick={() => setShowCancelConfirm(false)}
              className="flex-1 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm hover:bg-red-100 transition-colors">
              Keep event
            </button>
            <button onClick={handleCancel} disabled={cancelling}
              className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
              {cancelling ? "Cancelling…" : "Yes, cancel event"}
            </button>
          </div>
        </div>
      )}

      {/* Over-capacity promote confirmation */}
      {overCapacityConfirm && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
          <p className="text-sm font-medium text-amber-900 mb-1">Event is currently full</p>
          <p className="text-xs text-amber-800 mb-4">
            Are you sure you want to move <strong>{overCapacityConfirm.name}</strong> to confirmed? This will exceed your set capacity.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setOverCapacityConfirm(null)}
              className="flex-1 border border-amber-300 text-amber-800 rounded-lg px-4 py-2 text-sm hover:bg-amber-100 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => handlePromote(overCapacityConfirm.id, true)}
              disabled={promotingId === overCapacityConfirm.id}
              className="flex-1 bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50">
              {promotingId === overCapacityConfirm.id ? "Moving…" : "Yes, confirm anyway"}
            </button>
          </div>
        </div>
      )}

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
          <div className="bg-white border border-sand rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand">
                  <th className="text-left px-5 py-3 text-xs text-muted font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-xs text-muted font-medium">Email</th>
                  <th className="text-left px-5 py-3 text-xs text-muted font-medium">WhatsApp</th>
                  <th className="text-left px-5 py-3 text-xs text-muted font-medium">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {waitlisted.map((row, i) => {
                  const promoted = promotedIds.has(row.id);
                  return (
                    <tr key={row.id} className={i < waitlisted.length - 1 ? "border-b border-sand/60" : ""}>
                      <td className="px-5 py-3 text-charcoal font-medium">{row.member_name}</td>
                      <td className="px-5 py-3 text-muted">{row.member_email}</td>
                      <td className="px-5 py-3 text-muted">{row.member_whatsapp ?? "—"}</td>
                      <td className="px-5 py-3 text-muted">
                        {new Date(row.created_at).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {promoted ? (
                          <span className="text-xs text-green-600">Confirmed ✓</span>
                        ) : (
                          <div className="flex flex-col items-end gap-1">
                            <button
                              onClick={() => handlePromote(row.id)}
                              disabled={promotingId === row.id}
                              className="text-xs text-terracotta hover:underline disabled:opacity-50 whitespace-nowrap"
                            >
                              {promotingId === row.id ? "Moving…" : "Move to confirmed"}
                            </button>
                            {promoteErrors[row.id] && (
                              <span className="text-xs text-red-500">{promoteErrors[row.id]}</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

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
                  day: "numeric", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
