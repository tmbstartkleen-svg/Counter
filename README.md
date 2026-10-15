# BlackEdge Elite — Counter

BlackEdge Elite is an **educational play-money** blackjack training app.

## V16 reliability checkpoint (committed)

### Casino and counting academy
- `index.html` includes the browser casino game, Hi-Lo practice and timed drills.
- `v13-academy.js` includes discard-tray and true-count calculations.
- `v14-practice-room.js` includes 1–4 player same-device, pass-and-play practice.

### V15/V16 online room prototype
- `online.html` is a cross-device WebSocket room UI.
- `src/worker.js` implements server-controlled shared shoe, dealer cards, virtual bankroll, round settlement, room host and turn order using a Cloudflare Durable Object.
- `wrangler.jsonc` configures the Worker and Durable Object.
- `public/` contains assets served by the Worker.

The online service is **not deployed** or browser-regression-tested. A plain GitHub Pages site will not run the WebSocket backend.

### Develop with Cloudflare

1. Install Node.js 20+ and run `npm install`.
2. Run `npm run dev` to start a local Cloudflare Worker + static assets.
3. Open `/online.html` on two browser tabs or devices to test joining the same room code.
4. Configure a Cloudflare account and deploy with `npm run deploy` once ready.

### V16 reliability changes
- Reject new WebSocket seats while a round is underway.
- Correct seat-index advancement when a participant disconnects.
- Guard the dealer hole-card counting update so it occurs once per round.
- Update the health endpoint version to V16.

### Known limitations and required hardening

- V16 still uses **in-memory** room state and should not be trusted to survive Durable Object restarts. Add persistent storage and WebSocket hibernation handling before production.
- No verified user identities, anti-abuse controls, room access passwords, secure reconnection or invite expiry.
- Mid-round admission is blocked, but full seat identity/rejoin persistence is not yet available.
- No complete configurable blackjack rule matrix. Online practice currently uses hit, stand, double, 3:2 natural blackjack and dealer stand-on-17.
- Previous full standalone editions had features (including split and surrender) not fully ported into this GitHub release.
- End-to-end multiplayer browser testing and independent rules-engine correctness tests are still needed.
- No payments or real-money wagering.

## Source status

The GitHub repo is the V16 **development edition on main**, not a production-certified release. V16 GitHub commits were verified, but Cloudflare deployment has not occurred.
