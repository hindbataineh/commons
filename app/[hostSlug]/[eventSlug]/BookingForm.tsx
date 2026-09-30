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
  { code: '+971', label: '+971 UAE 🇦🇪' },
  { code: '+966', label: '+966 Saudi Arabia 🇸🇦' },
  { code: '+974', label: '+974 Qatar 🇶🇦' },
  { code: '+965', label: '+965 Kuwait 🇰🇼' },
  { code: '+973', label: '+973 Bahrain 🇧🇭' },
  { code: '+968', label: '+968 Oman 🇴🇲' },
  { code: '+93', label: '+93 Afghanistan 🇦🇫' },
  { code: '+355', label: '+355 Albania 🇦🇱' },
  { code: '+213', label: '+213 Algeria 🇩🇿' },
  { code: '+376', label: '+376 Andorra 🇦🇩' },
  { code: '+244', label: '+244 Angola 🇦🇴' },
  { code: '+54', label: '+54 Argentina 🇦🇷' },
  { code: '+374', label: '+374 Armenia 🇦🇲' },
  { code: '+61', label: '+61 Australia 🇦🇺' },
  { code: '+43', label: '+43 Austria 🇦🇹' },
  { code: '+994', label: '+994 Azerbaijan 🇦🇿' },
  { code: '+1242', label: '+1242 Bahamas 🇧🇸' },
  { code: '+880', label: '+880 Bangladesh 🇧🇩' },
  { code: '+375', label: '+375 Belarus 🇧🇾' },
  { code: '+32', label: '+32 Belgium 🇧🇪' },
  { code: '+501', label: '+501 Belize 🇧🇿' },
  { code: '+229', label: '+229 Benin 🇧🇯' },
  { code: '+975', label: '+975 Bhutan 🇧🇹' },
  { code: '+591', label: '+591 Bolivia 🇧🇴' },
  { code: '+387', label: '+387 Bosnia 🇧🇦' },
  { code: '+267', label: '+267 Botswana 🇧🇼' },
  { code: '+55', label: '+55 Brazil 🇧🇷' },
  { code: '+673', label: '+673 Brunei 🇧🇳' },
  { code: '+359', label: '+359 Bulgaria 🇧🇬' },
  { code: '+226', label: '+226 Burkina Faso 🇧🇫' },
  { code: '+257', label: '+257 Burundi 🇧🇮' },
  { code: '+855', label: '+855 Cambodia 🇰🇭' },
  { code: '+237', label: '+237 Cameroon 🇨🇲' },
  { code: '+1', label: '+1 Canada 🇨🇦' },
  { code: '+238', label: '+238 Cape Verde 🇨🇻' },
  { code: '+236', label: '+236 Central African Rep. 🇨🇫' },
  { code: '+235', label: '+235 Chad 🇹🇩' },
  { code: '+56', label: '+56 Chile 🇨🇱' },
  { code: '+86', label: '+86 China 🇨🇳' },
  { code: '+57', label: '+57 Colombia 🇨🇴' },
  { code: '+269', label: '+269 Comoros 🇰🇲' },
  { code: '+242', label: '+242 Congo 🇨🇬' },
  { code: '+506', label: '+506 Costa Rica 🇨🇷' },
  { code: '+385', label: '+385 Croatia 🇭🇷' },
  { code: '+53', label: '+53 Cuba 🇨🇺' },
  { code: '+357', label: '+357 Cyprus 🇨🇾' },
  { code: '+420', label: '+420 Czech Republic 🇨🇿' },
  { code: '+45', label: '+45 Denmark 🇩🇰' },
  { code: '+253', label: '+253 Djibouti 🇩🇯' },
  { code: '+1809', label: '+1809 Dominican Republic 🇩🇴' },
  { code: '+593', label: '+593 Ecuador 🇪🇨' },
  { code: '+20', label: '+20 Egypt 🇪🇬' },
  { code: '+503', label: '+503 El Salvador 🇸🇻' },
  { code: '+240', label: '+240 Equatorial Guinea 🇬🇶' },
  { code: '+291', label: '+291 Eritrea 🇪🇷' },
  { code: '+372', label: '+372 Estonia 🇪🇪' },
  { code: '+251', label: '+251 Ethiopia 🇪🇹' },
  { code: '+679', label: '+679 Fiji 🇫🇯' },
  { code: '+358', label: '+358 Finland 🇫🇮' },
  { code: '+33', label: '+33 France 🇫🇷' },
  { code: '+241', label: '+241 Gabon 🇬🇦' },
  { code: '+220', label: '+220 Gambia 🇬🇲' },
  { code: '+995', label: '+995 Georgia 🇬🇪' },
  { code: '+49', label: '+49 Germany 🇩🇪' },
  { code: '+233', label: '+233 Ghana 🇬🇭' },
  { code: '+30', label: '+30 Greece 🇬🇷' },
  { code: '+502', label: '+502 Guatemala 🇬🇹' },
  { code: '+224', label: '+224 Guinea 🇬🇳' },
  { code: '+592', label: '+592 Guyana 🇬🇾' },
  { code: '+509', label: '+509 Haiti 🇭🇹' },
  { code: '+504', label: '+504 Honduras 🇭🇳' },
  { code: '+852', label: '+852 Hong Kong 🇭🇰' },
  { code: '+36', label: '+36 Hungary 🇭🇺' },
  { code: '+354', label: '+354 Iceland 🇮🇸' },
  { code: '+91', label: '+91 India 🇮🇳' },
  { code: '+62', label: '+62 Indonesia 🇮🇩' },
  { code: '+98', label: '+98 Iran 🇮🇷' },
  { code: '+964', label: '+964 Iraq 🇮🇶' },
  { code: '+353', label: '+353 Ireland 🇮🇪' },
  { code: '+39', label: '+39 Italy 🇮🇹' },
  { code: '+1876', label: '+1876 Jamaica 🇯🇲' },
  { code: '+81', label: '+81 Japan 🇯🇵' },
  { code: '+962', label: '+962 Jordan 🇯🇴' },
  { code: '+7', label: '+7 Kazakhstan 🇰🇿' },
  { code: '+254', label: '+254 Kenya 🇰🇪' },
  { code: '+686', label: '+686 Kiribati 🇰🇮' },
  { code: '+82', label: '+82 South Korea 🇰🇷' },
  { code: '+383', label: '+383 Kosovo 🇽🇰' },
  { code: '+996', label: '+996 Kyrgyzstan 🇰🇬' },
  { code: '+856', label: '+856 Laos 🇱🇦' },
  { code: '+371', label: '+371 Latvia 🇱🇻' },
  { code: '+961', label: '+961 Lebanon 🇱🇧' },
  { code: '+266', label: '+266 Lesotho 🇱🇸' },
  { code: '+231', label: '+231 Liberia 🇱🇷' },
  { code: '+218', label: '+218 Libya 🇱🇾' },
  { code: '+423', label: '+423 Liechtenstein 🇱🇮' },
  { code: '+370', label: '+370 Lithuania 🇱🇹' },
  { code: '+352', label: '+352 Luxembourg 🇱🇺' },
  { code: '+261', label: '+261 Madagascar 🇲🇬' },
  { code: '+265', label: '+265 Malawi 🇲🇼' },
  { code: '+60', label: '+60 Malaysia 🇲🇾' },
  { code: '+960', label: '+960 Maldives 🇲🇻' },
  { code: '+223', label: '+223 Mali 🇲🇱' },
  { code: '+356', label: '+356 Malta 🇲🇹' },
  { code: '+222', label: '+222 Mauritania 🇲🇷' },
  { code: '+230', label: '+230 Mauritius 🇲🇺' },
  { code: '+52', label: '+52 Mexico 🇲🇽' },
  { code: '+373', label: '+373 Moldova 🇲🇩' },
  { code: '+976', label: '+976 Mongolia 🇲🇳' },
  { code: '+382', label: '+382 Montenegro 🇲🇪' },
  { code: '+212', label: '+212 Morocco 🇲🇦' },
  { code: '+258', label: '+258 Mozambique 🇲🇿' },
  { code: '+264', label: '+264 Namibia 🇳🇦' },
  { code: '+977', label: '+977 Nepal 🇳🇵' },
  { code: '+31', label: '+31 Netherlands 🇳🇱' },
  { code: '+64', label: '+64 New Zealand 🇳🇿' },
  { code: '+505', label: '+505 Nicaragua 🇳🇮' },
  { code: '+227', label: '+227 Niger 🇳🇪' },
  { code: '+234', label: '+234 Nigeria 🇳🇬' },
  { code: '+389', label: '+389 North Macedonia 🇲🇰' },
  { code: '+47', label: '+47 Norway 🇳🇴' },
  { code: '+92', label: '+92 Pakistan 🇵🇰' },
  { code: '+507', label: '+507 Panama 🇵🇦' },
  { code: '+675', label: '+675 Papua New Guinea 🇵🇬' },
  { code: '+595', label: '+595 Paraguay 🇵🇾' },
  { code: '+51', label: '+51 Peru 🇵🇪' },
  { code: '+63', label: '+63 Philippines 🇵🇭' },
  { code: '+48', label: '+48 Poland 🇵🇱' },
  { code: '+351', label: '+351 Portugal 🇵🇹' },
  { code: '+1787', label: '+1787 Puerto Rico 🇵🇷' },
  { code: '+40', label: '+40 Romania 🇷🇴' },
  { code: '+7', label: '+7 Russia 🇷🇺' },
  { code: '+250', label: '+250 Rwanda 🇷🇼' },
  { code: '+1869', label: '+1869 Saint Kitts and Nevis 🇰🇳' },
  { code: '+1758', label: '+1758 Saint Lucia 🇱🇨' },
  { code: '+685', label: '+685 Samoa 🇼🇸' },
  { code: '+239', label: '+239 Sao Tome and Principe 🇸🇹' },
  { code: '+221', label: '+221 Senegal 🇸🇳' },
  { code: '+381', label: '+381 Serbia 🇷🇸' },
  { code: '+248', label: '+248 Seychelles 🇸🇨' },
  { code: '+232', label: '+232 Sierra Leone 🇸🇱' },
  { code: '+65', label: '+65 Singapore 🇸🇬' },
  { code: '+421', label: '+421 Slovakia 🇸🇰' },
  { code: '+386', label: '+386 Slovenia 🇸🇮' },
  { code: '+677', label: '+677 Solomon Islands 🇸🇧' },
  { code: '+252', label: '+252 Somalia 🇸🇴' },
  { code: '+27', label: '+27 South Africa 🇿🇦' },
  { code: '+211', label: '+211 South Sudan 🇸🇸' },
  { code: '+34', label: '+34 Spain 🇪🇸' },
  { code: '+94', label: '+94 Sri Lanka 🇱🇰' },
  { code: '+249', label: '+249 Sudan 🇸🇩' },
  { code: '+597', label: '+597 Suriname 🇸🇷' },
  { code: '+268', label: '+268 Swaziland 🇸🇿' },
  { code: '+46', label: '+46 Sweden 🇸🇪' },
  { code: '+41', label: '+41 Switzerland 🇨🇭' },
  { code: '+963', label: '+963 Syria 🇸🇾' },
  { code: '+886', label: '+886 Taiwan 🇹🇼' },
  { code: '+992', label: '+992 Tajikistan 🇹🇯' },
  { code: '+255', label: '+255 Tanzania 🇹🇿' },
  { code: '+66', label: '+66 Thailand 🇹🇭' },
  { code: '+228', label: '+228 Togo 🇹🇬' },
  { code: '+676', label: '+676 Tonga 🇹🇴' },
  { code: '+1868', label: '+1868 Trinidad and Tobago 🇹🇹' },
  { code: '+216', label: '+216 Tunisia 🇹🇳' },
  { code: '+90', label: '+90 Turkey 🇹🇷' },
  { code: '+993', label: '+993 Turkmenistan 🇹🇲' },
  { code: '+256', label: '+256 Uganda 🇺🇬' },
  { code: '+380', label: '+380 Ukraine 🇺🇦' },
  { code: '+44', label: '+44 UK 🇬🇧' },
  { code: '+1', label: '+1 USA 🇺🇸' },
  { code: '+598', label: '+598 Uruguay 🇺🇾' },
  { code: '+998', label: '+998 Uzbekistan 🇺🇿' },
  { code: '+678', label: '+678 Vanuatu 🇻🇺' },
  { code: '+58', label: '+58 Venezuela 🇻🇪' },
  { code: '+84', label: '+84 Vietnam 🇻🇳' },
  { code: '+967', label: '+967 Yemen 🇾🇪' },
  { code: '+260', label: '+260 Zambia 🇿🇲' },
  { code: '+263', label: '+263 Zimbabwe 🇿🇼' },
];

const BIRTH_YEARS = Array.from({ length: 2010 - 1950 + 1 }, (_, i) => 2010 - i);

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
    const gender = (form.elements.namedItem("member_gender") as HTMLSelectElement).value;
    const birthYearRaw = (form.elements.namedItem("member_birth_year") as HTMLSelectElement).value;

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

    if (!gender) {
      setError("Please select your gender");
      setLoading(false);
      return;
    }

    if (!birthYearRaw) {
      setError("Please select your year of birth");
      setLoading(false);
      return;
    }

    const member_whatsapp = `${countryCode}${normalised}`;

    const data = {
      event_id: eventId,
      member_name: (form.elements.namedItem("member_name") as HTMLInputElement).value.trim(),
      member_email: email,
      member_whatsapp,
      gender,
      birth_year: parseInt(birthYearRaw, 10),
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
        const qs = new URLSearchParams({
          name: data.member_name,
          status: json.status ?? "confirmed",
          email: data.member_email,
          ...(json.ref ? { ref: json.ref } : {}),
        });
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

  const selectCls = "w-full rounded-lg border border-[#D8D2C6] bg-white px-4 py-2.5 text-[15px] text-carbon focus:outline-none focus:border-carbon focus:ring-1 focus:ring-carbon/20 transition-colors appearance-none";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        name="member_name"
        label="Your name"
        placeholder="Your full name"
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
        <label className="text-[13px] font-medium text-carbon">
          WhatsApp number<span className="text-red-500 ml-0.5">*</span>
        </label>
        <div className="flex gap-2">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="rounded-lg border border-[#D8D2C6] bg-white px-3 py-2.5 text-[15px] text-carbon focus:outline-none focus:border-carbon focus:ring-1 focus:ring-carbon/20 transition-colors shrink-0"
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
            className="w-full rounded-lg border border-[#D8D2C6] bg-white px-4 py-2.5 text-[15px] text-carbon placeholder:text-stone/50 focus:outline-none focus:border-carbon focus:ring-1 focus:ring-carbon/20 transition-colors"
          />
        </div>
      </div>

      {/* Gender */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-carbon">
          Gender<span className="text-red-500 ml-0.5">*</span>
        </label>
        <select name="member_gender" defaultValue="" className={selectCls}>
          <option value="" disabled>Select gender</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      </div>

      {/* Year of birth */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-carbon">
          Year of birth<span className="text-red-500 ml-0.5">*</span>
        </label>
        <select name="member_birth_year" defaultValue="" className={selectCls}>
          <option value="" disabled>Select year</option>
          {BIRTH_YEARS.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {error && (
        error.toLowerCase().includes("already booked") ? (
          <p className="text-sm text-carbon bg-mint border border-[#2A6B4D]/30 rounded-lg px-4 py-3">
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
        <p className="text-xs text-center text-stone">
          Secure payment via Stripe
        </p>
      )}
    </form>
  );
}
