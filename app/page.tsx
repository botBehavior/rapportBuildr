"use client";

import { FormEvent, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Compass, Github, Loader2, MapPin, MessageSquare, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RapportSummary = {
  local_lifestyle_hook: string;
  equity_or_payment_hook: string;
  intent_probe: string;
};

type LocalPlace = {
  name: string;
  category?: string | null;
  distance_miles?: number | null;
  url?: string | null;
  summary?: string | null;
};

type StrategicContext = {
  state_identity: string[];
  state_trends: string[];
  seasonal_rhythms: string[];
  community_traditions: string[];
  iconic_destinations: string[];
  outdoor_showstoppers: string[];
  neighborhood_archetypes: string[];
  home_projects: string[];
  economic_momentum: string[];
  population_growth: string[];
  desirability_factors: string[];
  sports_heat: string[];
  food_and_drink: string[];
  civic_culture: string[];
  housing_signals: string[];
  life_stage_notes: string[];
  positive_news: string[];
  emotional_connectors: string[];
  city_snapshot?: string | null;
};

type KnowledgeBrief = Record<string, string[]>;

type GrokAnchor = {
  category: string;
  name: string;
  summary: string;
};

type RapportResponse = {
  zip: string;
  city: string;
  state: string;
  summary_card: RapportSummary;
  knowledge_brief: KnowledgeBrief;
  grok_anchors: GrokAnchor[];
  raw_supporting_data: {
    strategic_context: StrategicContext;
    local_places: LocalPlace[];
  };
};

const apiBase =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || "";

type ConversationSectionKey = Exclude<keyof StrategicContext, "city_snapshot">;

const conversationSections: Array<{
  key: ConversationSectionKey;
  title: string;
  helper: string;
}> = [
  {
    key: "state_identity",
    title: "State identity",
    helper: "How folks describe the broader state pride.",
  },
  {
    key: "state_trends",
    title: "State vibe",
    helper: "Lifestyle buzz and statewide adventures on everyone's radar.",
  },
  {
    key: "seasonal_rhythms",
    title: "Seasonal rhythms",
    helper: "Weather swings and rituals locals plan around.",
  },
  {
    key: "community_traditions",
    title: "Community traditions",
    helper: "Festivals, markets, and hometown celebrations.",
  },
  {
    key: "iconic_destinations",
    title: "Iconic destinations",
    helper: "Theme parks, arenas, and headline attractions nearby.",
  },
  {
    key: "outdoor_showstoppers",
    title: "Outdoor showstoppers",
    helper: "Where locals head for lakes, mountains, golf, or desert escapes.",
  },
  {
    key: "neighborhood_archetypes",
    title: "Neighborhood vibe",
    helper: "Master-planned gems, historic districts, and up-and-comers.",
  },
  {
    key: "home_projects",
    title: "Home projects",
    helper: "Upgrades neighbors take on and why they matter.",
  },
  {
    key: "economic_momentum",
    title: "Economic momentum",
    helper: "Major employers and developments shaping the area.",
  },
  {
    key: "population_growth",
    title: "Population pulse",
    helper: "Growth snapshots and what draws new neighbors in.",
  },
  {
    key: "desirability_factors",
    title: "Why people move",
    helper: "What makes the area appealing versus nearby cities.",
  },
  {
    key: "sports_heat",
    title: "Sports & rec",
    helper: "Teams, leagues, and outdoor habits everyone chats about.",
  },
  {
    key: "food_and_drink",
    title: "Local flavors",
    helper: "Food, drink, and market finds locals love.",
  },
  {
    key: "civic_culture",
    title: "Culture & civic pride",
    helper: "Museums, arts, and community projects people brag about.",
  },
  {
    key: "housing_signals",
    title: "Housing pulse",
    helper: "Market signals, design styles, and refresh trends.",
  },
  {
    key: "life_stage_notes",
    title: "Life-stage cues",
    helper: "Who’s putting down roots and how they use their homes.",
  },
  {
    key: "positive_news",
    title: "Fresh wins",
    helper: "Feel-good headlines and local momentum.",
  },
  {
    key: "emotional_connectors",
    title: "Emotional connectors",
    helper: "Stories and rituals that make neighbors light up.",
  },
];

const featureHighlights: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Right-fit insights",
    description:
      "Surface the strongest local signals so every conversation starts with something specific and useful.",
    icon: Sparkles,
  },
  {
    title: "Human-first pacing",
    description:
      "A calm layout, roomy line heights, and clear hierarchy keep the view easy to scan between calls.",
    icon: Users,
  },
  {
    title: "Guided call flow",
    description:
      "Highlights lead into deeper sections so you can glide from a hook to supporting detail without hunting around.",
    icon: Compass,
  },
];

export default function HomePage() {
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rapport, setRapport] = useState<RapportResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = zip.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      setError("Enter a valid 5-digit U.S. ZIP code.");
      setRapport(null);
      return;
    }

    setLoading(true);
    setError(null);
    setRapport(null);
    try {
      const base = apiBase || "";
      const response = await fetch(`${base}/api/zip/${trimmed}`, {
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const detail = payload?.detail;
        throw new Error(detail || "Something went wrong reaching the rapport service.");
      }
      const data = (await response.json()) as RapportResponse;
      setRapport(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error fetching rapport insights.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.08),transparent_46%)]"
      />
      <div className="container relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 py-16">
        <header className="mx-auto max-w-3xl space-y-4 text-center md:mx-0 md:space-y-6 md:text-left">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Live Rapport Builder
          </div>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Warm up calls with local talking points in seconds.
          </h1>
          <p className="text-lg text-muted-foreground">
            Punch in a ZIP code and get conversation-ready hooks grounded in parks, activities, and
            housing trends—no static scripts, only fresh intel.
          </p>
        </header>

        <section className="grid gap-4 text-left md:grid-cols-3">
          {featureHighlights.map(({ title, description, icon: Icon }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border/70 bg-white/80 p-5 shadow-sm backdrop-blur transition duration-200 hover:-translate-y-1 hover:shadow-lg supports-[backdrop-filter]:bg-white/45"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{title}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </section>

        <Card className="mx-auto w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Find rapport for a ZIP code</CardTitle>
            <CardDescription>We fetch live context from trusted sources in one shot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={handleSubmit}>
              <div className="flex-1 space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={5}
                  value={zip}
                  onChange={(event) => setZip(event.target.value)}
                  placeholder="e.g. 85260"
                  autoComplete="postal-code"
                  autoFocus
                  aria-describedby="zip-helper"
                  required
                />
                <p id="zip-helper" className="text-xs text-muted-foreground">
                  Works with any U.S. ZIP code. Press enter to submit instantly.
                </p>
              </div>
              <Button
                type="submit"
                className="md:w-44"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Fetching...
                  </>
                ) : (
                  "Get Rapport"
                )}
              </Button>
            </form>
            {error && (
              <p className="mt-3 text-sm text-destructive" role="alert" aria-live="polite">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {rapport && (
          <section className="grid gap-6 md:grid-cols-[2fr,1fr]">
            {(() => {
              const strategic = rapport.raw_supporting_data.strategic_context;
              const snapshot = strategic.city_snapshot;
              if (!snapshot) return null;
              return (
                <Card className="md:col-span-2 border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-base text-primary">City snapshot</CardTitle>
                    <CardDescription>
                      A quick headline you can use to open or reinforce local knowledge.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg leading-relaxed">{snapshot}</p>
                  </CardContent>
                </Card>
              );
            })()}
            {rapport.knowledge_brief && Object.keys(rapport.knowledge_brief).length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Neighbor briefing</CardTitle>
                  <CardDescription>
                    Quick study guide so you sound like you grew up nearby.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {Object.entries(rapport.knowledge_brief).map(([bucket, sentences]) => {
                    if (!sentences || sentences.length === 0) return null;
                    const label = bucket
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (char) => char.toUpperCase());
                    return (
                      <div key={bucket} className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {label}
                        </p>
                        <ul className="space-y-1.5 text-sm leading-relaxed">
                          {sentences.map((sentence, idx) => (
                            <li key={`${bucket}-${idx}`} className="text-muted-foreground">
                              {sentence}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4 text-primary" />
                    Local Anchors
                  </CardTitle>
                  <CardDescription>
                    Must-mention spots the LLM surfaced for quick rapport.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {rapport.grok_anchors && rapport.grok_anchors.length > 0 ? (
                    rapport.grok_anchors.map((anchor) => (
                      <div key={`${anchor.name}-${anchor.category}`} className="space-y-1">
                        <p className="font-medium">{anchor.name}</p>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {anchor.category}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{anchor.summary}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No anchors came back this time, but the knowledge brief still covers the area vibe.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Conversation sparks
                  </CardTitle>
                  <CardDescription>
                    Drop these nuggets in the call when you need quick rapport boosts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {(() => {
                    const strategic = rapport.raw_supporting_data.strategic_context;
                    const hasSections = conversationSections.some(
                      ({ key }) => (strategic[key] ?? []).length > 0
                    );
                    if (!hasSections) {
                      return (
                        <p className="text-muted-foreground">
                          We didn&apos;t surface extra highlights this time, but the summary card is call-ready.
                        </p>
                      );
                    }
                    return conversationSections.map(({ key, title, helper }) => {
                      const items = strategic[key] ?? [];
                      if (!items.length) return null;
                      return (
                        <div key={key} className="space-y-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {title}
                          </p>
                          <p className="text-xs text-muted-foreground">{helper}</p>
                          <ul className="space-y-1.5">
                            {items.map((item, idx) => (
                              <li
                                key={`${key}-${idx}`}
                                className="rounded-md bg-secondary/40 px-3 py-2 leading-relaxed"
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    });
                  })()}
                </CardContent>
              </Card>

              {Array.isArray(rapport.raw_supporting_data.strategic_context.outdoor_showstoppers) &&
                rapport.raw_supporting_data.strategic_context.outdoor_showstoppers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Within an hour</CardTitle>
                    <CardDescription>
                      Quick getaways and day trips neighbors mention when they hop in the car.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm leading-relaxed">
                    {rapport.raw_supporting_data.strategic_context.outdoor_showstoppers.map(
                      (item, idx) => (
                        <p
                          key={`regional-${idx}`}
                          className="rounded-md bg-secondary/30 px-3 py-2"
                        >
                          {item}
                        </p>
                      )
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}

        <footer className="mt-auto flex flex-col items-center gap-3 text-sm text-muted-foreground md:flex-row md:justify-between">
          <span>Built for thoughtful outreach.</span>
          <a
            href="https://github.com/botBehavior"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5 transition hover:border-primary/40 hover:text-primary"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-medium">github.com/botBehavior</span>
            <span className="sr-only">Visit GitHub profile</span>
          </a>
        </footer>
      </div>
    </main>
  );
}
