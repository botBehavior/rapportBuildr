# Rapport Builder 9000

Fast, conversational rapport hooks for mortgage loan officers. Enter a U.S. ZIP code, receive live-sourced talking points, and keep calls personal without spreadsheets or scripts.

## Success Metrics
- **Zip Lookup Latency**: P95 end-to-end response time under 2.5s for cold cache requests; under 600ms for cache hits.
- **Context Coverage**: ≥90% of resolved ZIP codes return at least two strategic context buckets plus a local place anchor in `raw_supporting_data`.
- **Prompt Compliance**: 100% automated schema validation; <5% human QA rejections for tone/compliance across a rolling 50-call sample.
- **Error Resilience**: Graceful fallback responses for ≥99% of requests even when one upstream API fails.
- **Frontend Conversion**: ≥85% of first-time users reach a successful summary card render after entering a ZIP (measured via optional analytics hooks).

## Getting Started
1. Duplicate `.env.example` to `.env` and fill in required keys:
   - `GROK_API_KEY` (XAI/Grok token)
   - `GROK_API_BASE_URL` (e.g. `https://api.x.ai`) and optional `GROK_API_PATH` (defaults to `/v1/chat/completions`)
   - `GROK_MODEL` (defaults to `grok-3`)
   - `OSM_USER_AGENT` (contact string for OpenStreetMap requests)
   - `CACHE_TTL_SECONDS` (defaults to 6 hours for strategic context cache)
   - `BASIC_AUTH_USER` / `BASIC_AUTH_PASSWORD` (credentials required to load the UI)
2. Install dependencies from the Next.js project root:
   ```bash
   cd frontend
   npm install
   ```
   Example Grok config for xAI:
   ```env
   GROK_API_BASE_URL=https://api.x.ai
   GROK_API_PATH=/v1/chat/completions
   GROK_MODEL=grok-3
   ```

   By default the app protects every route with Basic Auth. When running locally you can use the credentials from `.env.example` (`rapport` / `builder9000`) or set your own values before deploying.

## Running Locally
- **Dev server**: `npm run dev` (served at `http://localhost:3000`)
- **Production build**: `npm run build && npm run start`

Set `NEXT_PUBLIC_BACKEND_URL` in `.env` only if the API route will live on a separate origin; otherwise the route handler uses the same Vercel deployment.

The Grok integration enforces a 45-second timeout per request; make sure your upstream account tier supports that latency budget when testing with cold ZIP codes.

## Interface Philosophy
- **Right-fit insights**: the hero highlight cards call out the most actionable benefits so users know what to expect before they submit a ZIP.
- **Human-first pacing**: typography, whitespace, and conversational helper copy keep the briefing scannable between calls.
- **Guided call flow**: summary, anchors, and supporting sections align in a single column so it’s easy to move from hook to deeper context on any device.

## Deployment
- Deploy the `frontend` directory as the Vercel project root.
- Ensure `GROK_API_KEY`, `GROK_API_BASE_URL`, `GROK_API_PATH`, `GROK_MODEL`, `OSM_USER_AGENT`, and `CACHE_TTL_SECONDS` are configured in Vercel project settings.
- Leave `NEXT_PUBLIC_BACKEND_URL` unset unless you split API/UI across different hosts.

## Context Pillars
- **State identity** – how locals describe statewide pride and culture.
- **State vibe** – lifestyle trends and standout adventures across the state.
- **Seasonal rhythms** – weather swings and rituals neighbors prep for.
- **Community traditions** – festivals, markets, and hometown celebrations.
- **Iconic destinations** – headline attractions locals brag about.
- **Outdoor showstoppers** – lakes, mountains, resort golf, scenic drives.
- **Neighborhood vibe** – master-planned gems, historic districts, and up-and-comers.
- **Home projects** – upgrades residents tackle and why they matter.
- **Economic momentum** – major employers, developments, and growth stories.
- **Population pulse** – who’s moving in and how quickly things are growing.
- **Desirability factors** – why people choose the area (schools, climate, value).
- **Sports heat** – teams, venues, and fan rituals lighting up the community.
- **Local flavors** – restaurants, markets, and craft spots neighbors rave about.
- **Culture & civic pride** – museums, arts, and community projects people brag about.
- **Housing pulse** – inventory trends, design styles, and refresh signals.
- **Life-stage cues** – how different households are settling into the area.
- **Fresh wins & emotional connectors** – headlines, traditions, and stories that make residents proud.

Each API response includes a `knowledge_brief` covering these pillars and a `grok_anchors` list—LLM-curated venues and experiences to reference during calls.

## Smoke Tests
- Start the dev server, open `http://localhost:3000`, enter a ZIP (e.g. `85260`), and confirm the neighbor briefing plus supporting context render without errors.
- Try a handful of random ZIP codes to confirm multiple context pillars populate with meaningful snippets.
- To validate Grok credentials independently, run:
  ```bash
  curl -X POST "$GROK_API_BASE_URL${GROK_API_PATH:-/v1/chat/completions}" \
    -H "Authorization: Bearer $GROK_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"model": "'"${GROK_MODEL:-grok-3}"'","messages":[{"role":"user","content":"ping"}]}'
  ```

Always run the smoke check before sharing a build for review.
