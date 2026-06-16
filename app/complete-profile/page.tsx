"use client";

import { useState, useEffect } from "react";

const COMMUNITY_TYPES = [
  { value: "run_club", label: "Run club" },
  { value: "fitness", label: "Fitness & gym" },
  { value: "yoga", label: "Yoga" },
  { value: "pilates", label: "Pilates" },
  { value: "wellness", label: "Wellness" },
  { value: "tennis", label: "Tennis" },
  { value: "padel", label: "Padel" },
  { value: "ladies_only", label: "Ladies only" },
  { value: "creative", label: "Creative workshop" },
  { value: "social", label: "Social club" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" },
];

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const baseInput =
  "w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-muted/50 focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal/20 transition-colors";
const baseLabel = "text-sm font-medium text-charcoal";

export default function CompleteProfilePage() {
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [ready, setReady] = useState(false);

  const [communityName, setCommunityName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState("run_club");
  const [customType, setCustomType] = useState("");
  const [location, setLocation] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Only runs on client — no SSR window access, no hydration mismatch
    const params = new URLSearchParams(window.location.search);
    const uidParam = params.get("uid") || "";
    const emailParam = params.get("email") || "";
    console.log("[profile] uid:", uidParam, "email:", emailParam);
    setUid(uidParam);
    setEmail(emailParam);
    setReady(true);
  }, []);

  // Render nothing until client has read params — avoids SSR/client mismatch
  if (!ready) return null;

  // Params were missing in the URL
  if (!uid || !email) {
    return (
      <main className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4 px-4">
        <span className="font-display text-2xl text-charcoal">Commons</span>
        <p className="text-sm text-muted text-center">
          Something went wrong with your signup link.
        </p>
        <a
          href="/signup"
          className="bg-charcoal text-cream rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-charcoal/90 transition-colors"
        >
          Go to signup
        </a>
      </main>
    );
  }

  function handleNameChange(val: string) {
    setCommunityName(val);
    setSlug(generateSlug(val));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[submit] uid:", uid, "email:", email);
    console.log("[submit] form:", { communityName, type, location, instagram, description: description.length });
    setError("");

    if (!communityName || !location || !instagram || description.length < 50) {
      setError("Please fill in all required fields. Description needs at least 50 characters.");
      return;
    }
    if (type === "other" && !customType) {
      setError("Please tell us your community type.");
      return;
    }

    let normalisedWebsite = website.trim();
    if (normalisedWebsite && !/^https?:\/\//i.test(normalisedWebsite)) {
      normalisedWebsite = "https://" + normalisedWebsite;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/setup-community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: uid,
          email,
          name: communityName,
          slug,
          type,
          custom_type: customType,
          location,
          description,
          instagram_handle: instagram,
          website: normalisedWebsite,
        }),
      });
      const json = await res.json();
      console.log("[submit] response:", json);
      if (!res.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      console.error("[submit] error:", err);
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="mb-10">
          <span className="font-display text-2xl text-charcoal">Commons</span>
          <p className="text-sm text-muted mt-1">Tell us about your community.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="community-name" className={baseLabel}>
              Club / community name
            </label>
            <input
              id="community-name"
              name="community-name"
              className={baseInput}
              placeholder="Kite Beach Run Club"
              value={communityName}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="community-type" className={baseLabel}>
              Type of community
            </label>
            <select
              id="community-type"
              name="community-type"
              className={baseInput}
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setCustomType("");
              }}
            >
              {COMMUNITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {type === "other" && (
              <input
                id="custom-type"
                name="custom-type"
                className={baseInput}
                placeholder="e.g. Cycling club"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="location" className={baseLabel}>
              Location
            </label>
            <input
              id="location"
              name="location"
              className={baseInput}
              placeholder="Dubai, UAE"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="instagram" className={baseLabel}>
              Instagram handle
            </label>
            <input
              id="instagram"
              name="instagram"
              className={baseInput}
              placeholder="@yourcommunity"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="website" className={baseLabel}>
              Website{" "}
              <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              id="website"
              name="website"
              type="text"
              className={baseInput}
              placeholder="www.yourwebsite.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className={baseLabel}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className={`${baseInput} resize-none`}
              rows={3}
              maxLength={300}
              placeholder="Tell people what your community is about…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p
              className={`text-xs text-right ${
                description.length < 50 || description.length > 300
                  ? "text-red-500"
                  : "text-muted"
              }`}
            >
              {description.length} / 300 characters
            </p>
          </div>

          {slug && (
            <div className="bg-charcoal/5 rounded-lg px-4 py-3">
              <p className="text-xs text-muted mb-1">Your booking URL</p>
              <p className="text-sm text-charcoal font-medium">
                commons.ae/<span className="text-terracotta">{slug}</span>
              </p>
              <div className="flex flex-col gap-1 mt-2">
                <label htmlFor="slug" className="text-xs text-muted">
                  Edit URL
                </label>
                <input
                  id="slug"
                  name="slug"
                  className="text-sm border border-sand rounded-md px-2 py-1 bg-white text-charcoal focus:outline-none focus:border-charcoal"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-charcoal text-cream rounded-lg px-5 py-3 text-sm font-medium hover:bg-charcoal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {submitting ? "Creating your community…" : "Create my community"}
          </button>
        </form>
      </div>
    </main>
  );
}
