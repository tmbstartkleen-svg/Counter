# V15 online rooms

Cloudflare Worker + Durable Object proof-of-concept. WebSockets use `/api/rooms/{code}/ws`. Do not deploy as a production-grade multiplayer service yet. The in-memory room state, shoe, and balances are lost when the object is restarted or hibernated. Names are self-selected and room codes are not passwords. Add persistence, reconnection, request limits, room expiration, seat authorization, independent fair-play tests, split/surrender rule coverage, and privacy controls before production.

Run locally with `npm install`, `npm run dev`. Wrangler serves static files from `public/`; the GitHub root copies are retained for local opening and review. Deploy with `npm run deploy` only after configuring an authorized Cloudflare account.
