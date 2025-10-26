import { NextResponse } from "next/server";

export const runtime = "nodejs";

type DuckDuckGoResponse = {
  Abstract?: string;
  AbstractText?: string;
  Heading?: string;
  Answer?: string;
  AnswerType?: string;
  Infobox?: {
    content?: Array<{ label?: string; value?: string }>;
  };
  RelatedTopics?: Array<
    | { Text?: string }
    | { Topics?: Array<{ Text?: string }> }
  >;
};

type LocalPlace = {
  name: string;
  category?: string;
  distance_miles?: number | null;
  url?: string | null;
  summary?: string | null;
};

type StrategicContextBuckets = {
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

type GrokAnchor = {
  category: string;
  name: string;
  summary: string;
};

type ContextBucketKey =
  | "state_identity"
  | "state_trends"
  | "seasonal_rhythms"
  | "community_traditions"
  | "iconic_destinations"
  | "outdoor_showstoppers"
  | "neighborhood_archetypes"
  | "home_projects"
  | "economic_momentum"
  | "population_growth"
  | "desirability_factors"
  | "sports_heat"
  | "food_and_drink"
  | "civic_culture"
  | "housing_signals"
  | "life_stage_notes"
  | "positive_news"
  | "emotional_connectors";

type StrategicQueryConfig = {
  key: ContextBucketKey;
  templates: string[];
  limit?: number;
};

type RapportSummary = {
  local_lifestyle_hook: string;
  equity_or_payment_hook: string;
  intent_probe: string;
};

type KnowledgeBrief = {
  [category: string]: string[];
};

type GrokSynthesis = {
  knowledge: KnowledgeBrief;
  anchors: GrokAnchor[];
};

type ZipRapportResponse = {
  zip: string;
  city: string;
  state: string;
  summary_card: RapportSummary;
  knowledge_brief: KnowledgeBrief;
  grok_anchors: GrokAnchor[];
  raw_supporting_data: {
    strategic_context: StrategicContextBuckets;
    local_places: LocalPlace[];
  };
};

const CACHE_TTL_MS =
  (Number(process.env.CACHE_TTL_SECONDS) || 6 * 60 * 60) * 1000;
const cache = new Map<string, { timestamp: number; payload: ZipRapportResponse }>();

const CONTACT_USER_AGENT =
  process.env.OSM_USER_AGENT?.trim() || "RapportBuilder/1.0 (contact@rapportbuilder.com)";

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (!items.length) {
    return [];
  }

  const results = new Array<R>(items.length);
  let cursor = 0;

  const worker = async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) {
        break;
      }
      results[index] = await mapper(items[index], index);
    }
  };

  const workerCount = Math.min(limit, items.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return results;
}

const STRATEGIC_QUERIES: StrategicQueryConfig[] = [
  {
    key: "state_identity",
    templates: [
      "How do residents describe the character of {state}? Mention pride points or what makes living there special.",
      "Signature cultural traits or statewide identity markers people associate with {state}.",
      "What do long-time residents love telling newcomers about {state}?",
    ],
    limit: 2,
  },
  {
    key: "state_trends",
    templates: [
      "What lifestyle or outdoor trends are residents across {state} excited about lately? Share vivid activities locals mention.",
      "Popular weekend adventures {state} homeowners rave about lately.",
      "Seasonal highlights or statewide events people across {state} keep talking about.",
    ],
    limit: 3,
  },
  {
    key: "seasonal_rhythms",
    templates: [
      "What seasonal rhythms define life in {state}? Mention weather extremes and how locals adapt.",
      "Traditions or rituals people in {state} follow as seasons shift (snowbirds, monsoon storms, summer nights).",
      "How do homeowners in {state} prep their homes for upcoming seasons?",
    ],
    limit: 3,
  },
  {
    key: "community_traditions",
    templates: [
      "Signature annual events, markets, or traditions in {city}, {state} that locals celebrate.",
      "Upcoming community events or festivals residents in {city}, {state} are buzzing about.",
      "Family-friendly or foodie-focused traditions unique to {city}, {state}.",
    ],
    limit: 3,
  },
  {
    key: "iconic_destinations",
    templates: [
      "Iconic attractions or major destinations in or near {city}, {state} that locals brag about (theme parks, stadiums, landmarks).",
      "Bucket-list spots around {city}, {state} that friends and family visit when they come to town.",
      "Within an hour of {city}, {state}, what well-known attractions draw the biggest crowds?",
    ],
    limit: 3,
  },
  {
    key: "outdoor_showstoppers",
    templates: [
      "Scenic drives, lakes, mountains, or outdoor escapes near {city}, {state} that locals love for day trips.",
      "Where do residents of {city}, {state} head when they want nature or a change of scenery without flying?",
      "Popular golf courses, resorts, or hiking loops people in {city}, {state} keep talking about this season.",
    ],
    limit: 3,
  },
  {
    key: "neighborhood_archetypes",
    templates: [
      "Iconic neighborhoods or master-planned communities around {city}, {state} and what they are known for.",
      "Up-and-coming corridors or historic districts near {city}, {state} that locals love to brag about.",
      "Describe the vibe locals associate with neighborhoods near ZIP {zip}.",
    ],
    limit: 3,
  },
  {
    key: "home_projects",
    templates: [
      "Homeowners in ZIP {zip} near {city}, {state}: what improvement or renovation projects are trending or commonly discussed?",
      "What kinds of home upgrades or backyard projects are popular in ZIP {zip} these days, and why?",
      "Any incentives or local contractors people mention when tackling projects around {city}, {state}?",
    ],
    limit: 2,
  },
  {
    key: "economic_momentum",
    templates: [
      "Major employers, new campuses, or infrastructure projects shaping {city}, {state} right now.",
      "What big developments (factories, tech hubs, hospitals) are in the pipeline around {city}, {state}?",
      "Any headline-making investments or revitalization efforts near {city}, {state} that residents keep mentioning?",
    ],
    limit: 3,
  },
  {
    key: "population_growth",
    templates: [
      "Summarize population or growth trends for {city}, {state} or ZIP {zip}. Why are people moving there?",
      "Recent migration or growth stats that show how {city}, {state} is changing.",
      "How has the population around {city}, {state} shifted over the past few years?",
    ],
    limit: 2,
  },
  {
    key: "desirability_factors",
    templates: [
      "Top reasons people choose to move to {city}, {state}—schools, lifestyle, cost of living, climate, etc.",
      "What makes {city}, {state} desirable compared with surrounding areas?",
      "Awards or rankings that highlight {city}, {state} as a great place to live.",
    ],
    limit: 3,
  },
  {
    key: "sports_heat",
    templates: [
      "Sports teams, youth leagues, or game-day traditions people in {city}, {state} rally around lately.",
      "Which local teams, rec leagues, or outdoor sports keep {city}, {state} residents fired up?",
      "Any big wins, rivalry games, or upcoming tournaments locals are buzzing about in {city}, {state}.",
    ],
    limit: 3,
  },
  {
    key: "food_and_drink",
    templates: [
      "Beloved local restaurants, cafes, or breweries in {city}, {state} that residents rave about.",
      "Signature dishes or food experiences people insist visitors try in {city}, {state}.",
      "Popular farmers markets, craft beverage spots, or foodie events in {city}, {state}.",
    ],
    limit: 3,
  },
  {
    key: "civic_culture",
    templates: [
      "Museums, performing arts centers, or cultural institutions that define {city}, {state}.",
      "Recent civic projects or community centers locals are excited about in {city}, {state}.",
      "Where do people gather for arts, libraries, or community programs near {city}, {state}?",
    ],
    limit: 2,
  },
  {
    key: "housing_signals",
    templates: [
      "Housing market signals around ZIP {zip}: home ages, new builds, or design styles locals mention.",
      "Any chatter about inventory, price trends, or neighborhood transitions in {city}, {state}.",
      "How are neighbors around {city}, {state} leveraging equity or refreshing older homes?",
    ],
    limit: 2,
  },
  {
    key: "life_stage_notes",
    templates: [
      "What life stages dominate neighborhoods near ZIP {zip}? Mention families, retirees, or young professionals without using sensitive statistics.",
      "Any signs of multigenerational living, downsizing, or move-up buyers in {city}, {state}.",
      "How do locals describe the mix of people settling into {city}, {state} neighborhoods lately?",
    ],
    limit: 2,
  },
  {
    key: "positive_news",
    templates: [
      "Recent good news stories around {city}, {state}—new parks, business expansions, or community wins.",
      "Infrastructure improvements or openings locals near {city}, {state} are excited about.",
      "Feel-good headlines or local achievements people in {city}, {state} are proud of.",
    ],
    limit: 2,
  },
  {
    key: "emotional_connectors",
    templates: [
      "Where do locals in {city}, {state} show pride or nostalgia—longstanding restaurants, charity events, volunteer traditions?",
      "Beloved community rituals, memorials, or volunteer efforts that bring neighbors together in {city}, {state}.",
      "What stories make residents of {city}, {state} light up when they talk about home?",
    ],
    limit: 2,
  },
];

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search.php";
const grokApiUrl = process.env.GROK_API_BASE_URL || process.env.GROK_API_URL;
const grokApiPath = process.env.GROK_API_PATH || "/v1/chat/completions";
const grokModel = process.env.GROK_MODEL || "grok-3";

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit = {},
  timeoutMs = 8000
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    throw error;
  } finally {
    clearTimeout(id);
  }
}

async function lookupZip(zip: string) {
  const res = await fetchWithTimeout(
    `https://api.zippopotam.us/us/${zip}`,
    {},
    8000
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Zippopotam lookup failed with status ${res.status}`);
  }

  const data: any = await res.json();
  const places = Array.isArray(data?.places) ? data.places : [];

  if (places.length === 0) {
    return null;
  }

  const first = places[0] || {};
  const latitude = parseFloat(first["latitude"]);
  const longitude = parseFloat(first["longitude"]);
  return {
    zip: data["post code"] ?? zip,
    city: first["place name"] ?? "",
    state: first["state abbreviation"] ?? first["state"] ?? "",
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
  };
}

function normalizeBlurb(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function extractRelatedTopics(raw: DuckDuckGoResponse) {
  const results: string[] = [];
  const related = Array.isArray(raw?.RelatedTopics) ? raw.RelatedTopics : [];
  for (const item of related) {
    if (!item) continue;
    if ("Text" in item && typeof item.Text === "string") {
      const blurb = normalizeBlurb(item.Text);
      if (blurb) results.push(blurb);
    } else if ("Topics" in item && Array.isArray(item.Topics)) {
      for (const nested of item.Topics) {
        if (nested?.Text) {
          const blurb = normalizeBlurb(nested.Text);
          if (blurb) results.push(blurb);
        }
      }
    }
  }
  return results;
}

function ensureSentence(text: string) {
  const trimmed = normalizeBlurb(text);
  if (!trimmed) return "";
  const clipped = trimmed.length > 220 ? `${trimmed.slice(0, 217).trim()}…` : trimmed;
  return /[.!?]$/.test(clipped) ? clipped : `${clipped}.`;
}

async function queryDuckDuckGoSnippets(query: string, limit = 3) {
  const url = new URL("https://api.duckduckgo.com/");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("no_html", "1");
  url.searchParams.set("no_redirect", "1");

  try {
    const response = await fetchWithTimeout(
      url.toString(),
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": CONTACT_USER_AGENT,
        },
      },
      8000
    );
    if (!response.ok) return [];
    const raw = await response.text();
    if (!raw) return [];
    let data: DuckDuckGoResponse | null = null;
    try {
      data = JSON.parse(raw) as DuckDuckGoResponse;
    } catch (parseError) {
      console.warn("DuckDuckGo JSON parse failed:", parseError);
      return [];
    }

    const candidates: string[] = [];
    if ((data as any).Heading) {
      candidates.push(`${(data as any).Heading}`);
    }
    if (data.AbstractText) candidates.push(data.AbstractText);
    if (data.Abstract) candidates.push(data.Abstract);
    if ((data as any).Answer) candidates.push((data as any).Answer as string);
    if (data.Infobox?.content?.length) {
      for (const item of data.Infobox.content) {
        if (item?.value) {
          candidates.push(`${item.label ? `${item.label}: ` : ""}${item.value}`);
        }
      }
    }
    candidates.push(...extractRelatedTopics(data));

    const snippets: string[] = [];
    const seen = new Set<string>();
    for (const candidate of candidates) {
      const sentence = ensureSentence(candidate);
      if (!sentence) continue;
      const key = sentence.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      snippets.push(sentence);
      if (snippets.length >= limit) break;
    }
    return snippets;
  } catch (error) {
    console.warn("DuckDuckGo query failed:", error);
    return [];
  }
}

function emptyStrategicBuckets(): StrategicContextBuckets {
  return {
    state_identity: [],
    state_trends: [],
    seasonal_rhythms: [],
    community_traditions: [],
    iconic_destinations: [],
    outdoor_showstoppers: [],
    neighborhood_archetypes: [],
    home_projects: [],
    economic_momentum: [],
    population_growth: [],
    desirability_factors: [],
    sports_heat: [],
    food_and_drink: [],
    civic_culture: [],
    housing_signals: [],
    life_stage_notes: [],
    positive_news: [],
    emotional_connectors: [],
    city_snapshot: null,
  };
}

async function fetchStrategicContext(city: string, state: string, zip: string) {
  if (!state) {
    return emptyStrategicBuckets();
  }

  const replacements = {
    city: city || state,
    state,
    zip,
  };

  const entries = await mapWithConcurrency(
    STRATEGIC_QUERIES,
    4,
    async ({ key, templates, limit = 3 }) => {
      const bucket: string[] = [];
      const queries = templates.map((template) =>
        template
          .replace("{city}", replacements.city)
          .replace("{state}", replacements.state)
          .replace("{zip}", zip)
      );

      const responses = await Promise.allSettled(
        queries.map((query) => queryDuckDuckGoSnippets(query, limit))
      );

      for (const response of responses) {
        if (response.status !== "fulfilled") {
          continue;
        }
        for (const snippet of response.value) {
          if (bucket.includes(snippet)) continue;
          bucket.push(snippet);
          if (bucket.length >= limit) {
            break;
          }
        }
        if (bucket.length >= limit) {
          break;
        }
      }

      return [key, bucket] as const;
    }
  );

  const buckets = emptyStrategicBuckets();
  for (const [key, values] of entries) {
    buckets[key] = values;
  }

  buckets.city_snapshot =
    buckets.state_identity[0] ||
    buckets.state_trends[0] ||
    buckets.community_traditions[0] ||
    buckets.iconic_destinations[0] ||
    buckets.outdoor_showstoppers[0] ||
    buckets.neighborhood_archetypes[0] ||
    buckets.food_and_drink[0] ||
    buckets.emotional_connectors[0] ||
    buckets.positive_news[0] ||
    null;

  return buckets;
}

function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = 6371 * c;
  return km * 0.621371;
}

function buildViewbox(lat: number, lon: number, delta = 0.15) {
  return `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`;
}

async function fetchLocalPlaces(
  latitude: number | null,
  longitude: number | null,
  limit = 5
) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return [];
  }

  const queries: Array<[string, string]> = [
    ["park", "Park"],
    ["trail", "Trail"],
    ["lake", "Lake"],
    ["stadium", "Stadium"],
    ["recreation center", "Rec Center"],
    ["community center", "Community Hub"],
    ["museum", "Museum"],
    ["farmers market", "Market"],
    ["shopping center", "Shopping Destination"],
    ["brewery", "Brewery"],
  ];

  const viewbox = buildViewbox(latitude, longitude);
  const seen = new Set<string>();
  const results: LocalPlace[] = [];

  const queryResults = await mapWithConcurrency(
    queries,
    3,
    async ([query, label]) => {
      try {
        const url = new URL(NOMINATIM_URL);
        url.searchParams.set("q", query);
        url.searchParams.set("format", "json");
        url.searchParams.set("limit", String(limit));
        url.searchParams.set("viewbox", viewbox);
        url.searchParams.set("bounded", "1");
        const response = await fetchWithTimeout(
          url.toString(),
          {
            headers: {
              "User-Agent": CONTACT_USER_AGENT,
            },
          },
          8000
        );
        if (!response.ok) {
          return [];
        }
        const data = (await response.json()) as Array<any>;
        const places: LocalPlace[] = [];
        for (const item of data) {
          const name = typeof item?.display_name === "string" ? item.display_name : null;
          if (!name) continue;

          const placeLat = Number.parseFloat(item.lat);
          const placeLon = Number.parseFloat(item.lon);
          const distance =
            Number.isFinite(placeLat) && Number.isFinite(placeLon)
              ? Math.round(
                  haversineMiles(latitude, longitude, placeLat, placeLon) * 10
                ) / 10
              : null;
          places.push({
            name: name.split(",")[0] ?? name,
            category: label,
            distance_miles: distance,
            url: (item.wikipedia as string) || (item.website as string) || null,
          });
        }
        return places;
      } catch (error) {
        console.warn("OSM query failed:", error);
        return [];
      }
    }
  );

  for (const placeList of queryResults) {
    for (const place of placeList) {
      const normalized = place.name.toLowerCase();
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      results.push(place);
    }
  }

  return results;
}

function summarizePlace(place: LocalPlace) {
  const descriptors: string[] = [];
  if (place.category) {
    descriptors.push(place.category.toLowerCase());
  }
  if (typeof place.distance_miles === "number") {
    descriptors.push(`${place.distance_miles} miles from the ZIP center`);
  }
  const descriptorText = descriptors.length ? descriptors.join(", ") : "local favorite";
  return `${place.name} is a ${descriptorText}${place.url ? " that residents often mention online." : "."}`;
}

async function enrichLocalPlaces(
  places: LocalPlace[],
  city: string,
  state: string
) {
  const tasks = places.map(async (place, index) => {
    let summary = summarizePlace(place);
    if (city && state && index < 3) {
      const highlightQueries = [
        `Why do locals love ${place.name} in ${city}, ${state}?`,
        `${place.name} ${city} ${state} popular activities`,
      ];
      for (const query of highlightQueries) {
        const [highlight] = await queryDuckDuckGoSnippets(query, 1);
        if (highlight) {
          summary = highlight;
          break;
        }
      }
    }
    return { ...place, summary };
  });
  return Promise.all(tasks);
}

async function callGrok(context: Record<string, unknown>): Promise<GrokSynthesis> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    throw new Error("GROK_API_KEY is not configured.");
  }
  if (!grokApiUrl) {
    throw new Error("GROK_API_URL (or GROK_API_BASE_URL) is not configured.");
  }

  let endpoint: URL;
  try {
    endpoint = new URL(grokApiUrl);
  } catch (err) {
    throw new Error("GROK_API_URL is not a valid URL.");
  }
  if (!endpoint.pathname || endpoint.pathname === "/") {
    endpoint.pathname = grokApiPath.startsWith("/")
      ? grokApiPath
      : `/${grokApiPath}`;
  }
  const resolvedEndpoint = endpoint.toString();

  const systemPrompt = [
    "You are preparing a knowledge brief so a mortgage loan officer can sound like a genuine neighbor.",
    "",
    "INPUT JSON is a light scaffolding:",
    "- location: {city, state, zip, coordinates}",
    "- strategic_context: bucket hints (state_identity, state_trends, seasonal_rhythms, community_traditions, iconic_destinations, outdoor_showstoppers, neighborhood_archetypes, home_projects, economic_momentum, population_growth, desirability_factors, sports_heat, food_and_drink, civic_culture, housing_signals, life_stage_notes, positive_news, emotional_connectors, city_snapshot)",
    "- anchor_spots: notable venues with metadata",
    "",
    "Bring your own knowledge of geography, attractions, sports, economy, population, and culture. Use the hints as anchors when they’re helpful, but feel free to supplement or expand with what you already know about the region. Accuracy matters more than repeating the provided blurbs.",
    "",
    "TASK:",
    "Create a concise knowledge brief organized by bucket so the officer understands:",
    "- Iconic attractions and day trips (theme parks, stadiums, scenic drives)",
    "- Seasonal lifestyle patterns and outdoor highlights",
    "- Major employers, developments, and growth stats",
    "- Reasons people move there (schools, cost of living, amenities)",
    "- Food, sports, culture, and emotional pride points",
    "",
    "First, suggest 5-6 diverse local anchors using the format ANCHOR|Category|Name|Why it matters. Categories can include ICONIC_DESTINATIONS, OUTDOOR_SHOWSTOPPERS, FOOD_AND_DRINK, SPORTS_HEAT, ECONOMIC_MOMENTUM, COMMUNITY_TRADITIONS, etc.",
    "After the anchor lines, provide the knowledge brief: for each bucket that has insight, start a new line with the bucket name in uppercase followed by a colon, then list one or two sentences. Example:",
    "ANCHOR|FOOD_AND_DRINK|Joe's Farm Grill|Farm-to-table courtyard in Agritopia where locals gather for live music nights.",
    "STATE_IDENTITY: Arizona blends desert living with booming tech corridors.",
    "ICONIC_DESTINATIONS: Phoenix sits less than 30 minutes from Camelback Mountain and the Desert Botanical Garden.",
    "",
    "Guidance:",
    "- Provide 5-6 anchor lines before the bucket summary.",
    "- Provide 1–2 sentences per bucket; combine related buckets when appropriate.",
    "- Blend provided anchors with your broader knowledge (e.g., mention Disneyland, State Farm Stadium playoff runs, Intel fabs, fast population growth).",
    "- Avoid repeating the same fact in multiple places; make each sentence additive.",
    "- Keep language educational, friendly, and non-salesy.",
    "- If you truly know nothing about a bucket, skip it rather than inventing specifics.",
    "",
    "Compliance:",
    "- No mention of crime, demographics, income levels, or politics.",
    "- Do not assume personal finances, debt, credit, job status, or family situation.",
    "- Do not promise rates or savings.",
  ].join("\n");

  let response;
  try {
    response = await fetchWithTimeout(
      resolvedEndpoint,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(context) },
          ],
          model: grokModel,
          temperature: 0.7,
          max_tokens: 550,
        }),
      },
      45000
    );
  } catch (error) {
    console.warn("Grok request aborted or failed:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Grok request failed before a response was returned."
    );
  }

  if (!response.ok) {
    const errorPreview = await response
      .text()
      .then((text) => text.slice(0, 500))
      .catch(() => "");
    console.warn(
      `Grok response status ${response.status} (POST ${resolvedEndpoint})${
        errorPreview ? `: ${errorPreview}` : ""
      }`
    );
    const message = errorPreview
      ? `Grok responded with status ${response.status}: ${errorPreview}`
      : `Grok responded with status ${response.status}`;
    throw new Error(message);
  }

  const json = (await response.json()) as any;
  let content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Grok returned invalid content payload.");
  }

  // Extract JSON from fenced blocks or surrounding prose.
  const fenced =
    content.match(/```json([\s\S]*?)```/i) ??
    content.match(/```([\s\S]*?)```/i);
  if (fenced) {
    content = fenced[1];
  }

  content = content.trim();

  const knowledge: KnowledgeBrief = {};
  const anchors: GrokAnchor[] = [];
  const lines = content
    .split(/\r?\n/)
    .map((line: string) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (line.startsWith("ANCHOR|")) {
      const parts = line.split("|").map((part: string) => part.trim());
      if (parts.length >= 4) {
        anchors.push({
          category: parts[1],
          name: parts[2],
          summary: parts.slice(3).join(" "),
        });
      }
      continue;
    }
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;
    const bucket = line.slice(0, separatorIndex).trim().toLowerCase();
    const sentence = line.slice(separatorIndex + 1).trim();
    if (!bucket || !sentence) continue;
    if (!knowledge[bucket]) {
      knowledge[bucket] = [];
    }
    knowledge[bucket].push(sentence);
  }

  if (Object.keys(knowledge).length === 0 && anchors.length === 0) {
    throw new Error("Grok returned an empty synthesis payload.");
  }

  return { knowledge, anchors };
}

function validateZip(zip: string) {
  return /^\d{5}$/.test(zip);
}

export async function GET(
  _: Request,
  { params }: { params: { zip: string } }
) {
  const zip = params?.zip;

  if (!zip || !validateZip(zip)) {
    return NextResponse.json(
      { detail: "ZIP code must be 5 digits." },
      { status: 400 }
    );
  }

  const cached = cache.get(zip);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    const strategic = (cached.payload as any)?.raw_supporting_data?.strategic_context;
    if (strategic && Array.isArray(strategic.iconic_destinations)) {
      const cachedPayload = cached.payload as ZipRapportResponse;
      if (!cachedPayload.grok_anchors) {
        cachedPayload.grok_anchors = [];
      }
      return NextResponse.json(cachedPayload);
    }
  }

  try {
    const geo = await withTimeout(
      lookupZip(zip),
      8000,
      "Geo lookup timed out."
    );
    if (!geo) {
      return NextResponse.json(
        { detail: `ZIP ${zip} not found.` },
        { status: 404 }
      );
    }

    const [strategicContext, places] = await Promise.all([
      withTimeout(
        fetchStrategicContext(geo.city, geo.state, geo.zip),
        20000,
        "Strategic context lookup timed out."
      ).catch((error) => {
        console.warn(error);
        return emptyStrategicBuckets();
      }),
      withTimeout(
        fetchLocalPlaces(geo.latitude, geo.longitude),
        20000,
        "OSM lookup timed out."
      ).catch((error) => {
        console.warn(error);
        return [];
      }),
    ]);

    const enhancedPlaces = await enrichLocalPlaces(
      places,
      geo.city,
      geo.state
    );

    const anchorSpots = enhancedPlaces.slice(0, 6).map((place) => ({
      name: place.name,
      category: place.category,
      distance_miles: place.distance_miles,
      url: place.url,
      summary: place.summary,
    }));

    const context = {
      location: {
        zip: geo.zip,
        city: geo.city,
        state: geo.state,
        coordinates:
          typeof geo.latitude === "number" && typeof geo.longitude === "number"
            ? { latitude: geo.latitude, longitude: geo.longitude }
            : null,
      },
      strategic_context: strategicContext,
      anchor_spots: anchorSpots,
    };

    const { knowledge, anchors } = await callGrok(context);

    const payload: ZipRapportResponse = {
      zip: geo.zip,
      city: geo.city,
      state: geo.state,
      summary_card: {
        local_lifestyle_hook: "",
        equity_or_payment_hook: "",
        intent_probe: "",
      },
      knowledge_brief: knowledge,
      grok_anchors: anchors,
      raw_supporting_data: {
        strategic_context: strategicContext,
        local_places: enhancedPlaces,
      },
    };

    cache.set(zip, { timestamp: now, payload });
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Failed to build rapport payload:", error);
    const message =
      error instanceof Error ? error.message : "Unknown upstream failure.";
    const status = message.includes("GROK_API_KEY")
      ? 503
      : 502;
    return NextResponse.json(
      {
        detail: message,
      },
      { status }
    );
  }
}
