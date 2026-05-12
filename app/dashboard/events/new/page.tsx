"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RepeatOption = "one-off" | "weekly" | "biweekly";


const baseInput =
  "w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-muted/50 focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal/20 transition-colors";
const baseLabel = "text-sm font-medium text-charcoal";

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      router.push("/dashboard/events");
    } catch (err) {
      console.error("create-event unexpected error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
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
          <button
            onClick={() => router.back()}
            className="flex-1 bg-cream border border-sand text-charcoal rounded-lg px-5 py-3 text-sm font-medium hover:bg-sand/40 transition-colors"
          >
            Cancel
          </button>
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
