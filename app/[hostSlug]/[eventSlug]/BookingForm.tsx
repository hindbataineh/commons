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

function validatePhone(code: string, digits: string): string | null {
  switch (code) {
    case "+971":
    case "+966":
      if (digits.length !== 9 || !digits.startsWith("5"))
        return `${code === "+971" ? "UAE" : "Saudi Arabia"} numbers must be 9 digits starting with 5 (e.g. 50 123 4567)`;
      break;
    case "+974":
      if (digits.length !== 8)
        return "Qatar numbers must be 8 digits";
      break;
    case "+965":
      if (digits.length !== 8 || !/^[4569]/.test(digits))
        return "Kuwait numbers must be 8 digits starting with 4, 5, 6, or 9";
      break;
    case "+973":
      if (digits.length !== 8)
        return "Bahrain numbers must be 8 digits";
      break;
    case "+968":
      if (digits.length !== 8)
        return "Oman numbers must be 8 digits";
      break;
    case "+44":
      if (digits.length !== 10)
        return "UK numbers must be 10 digits (e.g. 7700 123456)";
      break;
    case "+1":
      if (digits.length !== 10)
        return "US numbers must be 10 digits";
      break;
    case "+91":
      if (digits.length !== 10)
        return "India numbers must be 10 digits";
      break;
    case "+92":
      if (digits.length !== 10)
        return "Pakistan numbers must be 10 digits";
      break;
    default:
      if (digits.length < 7 || digits.length > 12)
        return "Please enter a valid phone number (7–12 digits)";
  }
  return null;
}

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
    const rawNumber = (form.elements.namedItem("member_whatsapp_number") as HTMLInputElement).value;

    // Email validation
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    // Strip spaces, dashes, parentheses — then leading zeros
    const digitsOnly = rawNumber.replace(/[\s\-()]/g, "").replace(/\D/g, "");
    const normalised = digitsOnly.replace(/^0+/, "");

    const phoneError = validatePhone(countryCode, normalised);
    if (phoneError) {
      setError(phoneError);
      setLoading(false);
      return;
    }

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
