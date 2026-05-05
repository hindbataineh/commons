"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Props {
  eventId: string;
  hostSlug: string;
  eventSlug: string;
  isFree: boolean;
  isFull: boolean;
}

export default function BookingForm({ eventId, hostSlug, eventSlug, isFree, isFull }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const data = {
      event_id: eventId,
      member_name: (form.elements.namedItem("member_name") as HTMLInputElement).value,
      member_email: (form.elements.namedItem("member_email") as HTMLInputElement).value,
      member_whatsapp: (form.elements.namedItem("member_whatsapp") as HTMLInputElement).value || null,
    };

    try {
      if (isFree || isFull) {
        const res = await fetch("/api/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Booking failed");
        router.push(`/${hostSlug}/${eventSlug}/confirmed?name=${encodeURIComponent(data.member_name)}`);
      } else {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Checkout failed");
        window.location.href = json.url;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        name="member_name"
        label="Your name"
        placeholder="Sarah Al Mazrouei"
        required
        autoComplete="name"
      />
      <Input
        name="member_email"
        type="email"
        label="Email"
        placeholder="sarah@email.com"
        required
        autoComplete="email"
      />
      <Input
        name="member_whatsapp"
        type="tel"
        label="WhatsApp number"
        placeholder="+971 50 123 4567"
        hint="Optional — for event updates"
        autoComplete="tel"
      />

      {error && (
        error.toLowerCase().includes("already booked") ? (
          <p className="text-sm text-terracotta bg-terracotta/5 border border-terracotta/30 rounded-lg px-4 py-3">
            You&rsquo;re already booked for this event.
          </p>
        ) : (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )
      )}

      <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
        {loading
          ? isFull ? "Joining waitlist..." : "Booking..."
          : isFull
          ? "Join waitlist"
          : isFree
          ? "Book my spot — Free"
          : "Continue to payment"}
      </Button>

      {!isFree && !isFull && (
        <p className="text-xs text-center text-muted">
          Secure payment via Stripe
        </p>
      )}
    </form>
  );
}
