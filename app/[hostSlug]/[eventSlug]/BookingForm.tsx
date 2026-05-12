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

const COUNTRY_CODES = [
  { code: "+971", label: "+971 UAE" },
  { code: "+966", label: "+966 Saudi Arabia" },
  { code: "+974", label: "+974 Qatar" },
  { code: "+965", label: "+965 Kuwait" },
  { code: "+973", label: "+973 Bahrain" },
  { code: "+968", label: "+968 Oman" },
  { code: "+44",  label: "+44 UK" },
  { code: "+1",   label: "+1 USA" },
  { code: "+91",  label: "+91 India" },
  { code: "+92",  label: "+92 Pakistan" },
  { code: "+20",  label: "+20 Egypt" },
  { code: "+962", label: "+962 Jordan" },
  { code: "+961", label: "+961 Lebanon" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BookingForm({ eventId, hostSlug, eventSlug, isFree, isFull }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countryCode, setCountryCode] = useState("+971");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const email = (form.elements.namedItem("member_email") as HTMLInputElement).value.trim();
    const rawNumber = (form.elements.namedItem("member_whatsapp_number") as HTMLInputElement).value
      .trim()
      .replace(/\s+/g, "");

    // Email validation
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    // Phone validation
    const digitsOnly = rawNumber.replace(/\D/g, "");
    if (digitsOnly.length < 7) {
      setError("Please enter a valid phone number");
      setLoading(false);
      return;
    }
    if (!/^\d+$/.test(digitsOnly)) {
      setError("Please enter a valid phone number");
      setLoading(false);
      return;
    }

    // Strip leading zero before combining with country code
    const normalised = digitsOnly.replace(/^0+/, "");
    const member_whatsapp = `${countryCode}${normalised}`;

    const data = {
      event_id: eventId,
      member_name: (form.elements.namedItem("member_name") as HTMLInputElement).value.trim(),
      member_email: email,
      member_whatsapp,
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
        const qs = new URLSearchParams({ name: data.member_name, status: json.status ?? "confirmed" });
        router.push(`/${hostSlug}/${eventSlug}/confirmed?${qs}`);
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

      {/* WhatsApp: country code + number */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-charcoal">
          WhatsApp number<span className="text-terracotta ml-0.5">*</span>
        </label>
        <div className="flex gap-2">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-charcoal focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal/20 transition-colors shrink-0"
          >
            {COUNTRY_CODES.map(({ code, label }) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
          <input
            name="member_whatsapp_number"
            type="tel"
            inputMode="numeric"
            placeholder="50 123 4567"
            required
            autoComplete="tel-national"
            className="w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-muted/60 focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal/20 transition-colors"
          />
        </div>
      </div>

      {error && (
        error.toLowerCase().includes("already booked") ? (
          <p className="text-sm text-terracotta bg-terracotta/5 border border-terracotta/30 rounded-lg px-4 py-3">
            You&rsquo;re already registered for this event.
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
