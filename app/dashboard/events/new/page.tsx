"use client";

import { useState } from "react";
import Link from "next/link";

type RepeatOption = "one-off" | "weekly" | "biweekly";

interface SuccessData {
  eventName: string;
  eventDate: string;
  bookingUrl: string;
}

const baseInput =
  "w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-muted/50 focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal/20 transition-colors";
const baseLabel = "text-sm font-medium text-charcoal";

export default function NewEventPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    name: "",
    date: "",
    time: "",
    location: "",
    priceAed: "0",
    capacity: "20",
    repeat: "one-off" as RepeatOption,
  });

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  const priceNum = parseFloat(form.priceAed || "0");
  const isFree = isNaN(priceNum) || priceNum === 0;

  async function handleSave() {
    if (!form.name || !form.date || !form.time || !form.location) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/create-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          date: form.date,
          time: form.time,
          location: form.location,
          priceAed: form.priceAed,
          capacity: form.capacity,
          repeat: form.repeat,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("create-event error:", json);
        setError(json.error || "Failed to create event. Please try again.");
        setLoading(false);
        return;
      }

      const bookingUrl = `${window.location.origin}/${json.communitySlug}/${json.eventSlug}`;
      setSuccess({ eventName: form.name, eventDate: form.date, bookingUrl });
      setLoading(false);
    } catch (err) {
      console.error("create-event unexpected error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (success) {
    const waText = `Join ${success.eventName} on Commons: ${success.bookingUrl}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;

    return (
      <div className="p-8 max-w-lg">
        {/* Checkmark */}
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-charcoal mb-1">Event created!</h1>
        <p className="text-sm text-muted mb-8">
          <span className="text-charcoal font-medium">{success.eventName}</span>
          {" · "}
          {new Date(success.eventDate).toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          })}
        </p>

        {/* Booking link box */}
        <div className="bg-white border border-sand rounded-xl p-5 mb-4">
          <p className="text-xs text-muted mb-2 uppercase tracking-wide">Booking link</p>
          <p className="text-sm font-mono text-charcoal break-all mb-4">{success.bookingUrl}</p>
          <button
            onClick={() => copyLink(success.bookingUrl)}
            className="w-full bg-charcoal text-cream rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-charcoal/90 transition-colors"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>

        {/* WhatsApp share */}
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-[#22c05e] transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Share on WhatsApp
        </a>

        <Link
          href="/dashboard/events"
          className="block text-center text-sm text-muted hover:text-charcoal transition-colors"
        >
          View all events →
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-charcoal">New event</h1>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className={baseLabel}>Event name *</label>
          <input
            className={baseInput}
            placeholder="Saturday Morning Run"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={baseLabel}>Date *</label>
            <input
              type="date"
              className={baseInput}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={baseLabel}>Time *</label>
            <input
              type="time"
              className={baseInput}
              value={form.time}
              onChange={(e) => set("time", e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={baseLabel}>Location *</label>
          <input
            className={baseInput}
            placeholder="Kite Beach, Dubai"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={baseLabel}>Price (AED)</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                className={baseInput}
                placeholder="0"
                value={form.priceAed}
                onChange={(e) => set("priceAed", e.target.value)}
              />
              {isFree && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-charcoal bg-sand px-1.5 py-0.5 rounded">
                  FREE
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={baseLabel}>Capacity</label>
            <input
              type="number"
              min="1"
              className={baseInput}
              value={form.capacity}
              onChange={(e) => set("capacity", e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={baseLabel}>Repeats</label>
          <select
            className={baseInput}
            value={form.repeat}
            onChange={(e) => set("repeat", e.target.value)}
          >
            <option value="one-off">One-off</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every two weeks</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/dashboard/events"
            className="flex-1 text-center bg-cream border border-sand text-charcoal rounded-lg px-5 py-3 text-sm font-medium hover:bg-sand/40 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-terracotta text-white rounded-lg px-5 py-3 text-sm font-medium hover:bg-terracotta/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save event"}
          </button>
        </div>
      </div>
    </div>
  );
}
