# BlackEdge Elite — Counter

Educational, play-money blackjack and card-counting simulator.

## V19 online room verification milestone

- `index.html` / `public/index.html`: casino, counting drills, and navigation.
- `v13-academy.js`: advanced count and discard-tray drills.
- `v14-practice-room.js`: local pass-and-play practice.
- `src/worker.js`: Cloudflare Worker and Durable Object multiplayer game server.
- `online.html` / `public/online.html`: cross-device WebSocket client.

### V18–V19 changes

The Durable Object now checkpoints **player seat IDs, names, recovery tokens, practice bankrolls, shoe and round counts**. A new WebSocket connection sends `resume` with the token saved in that browser's **sessionStorage**, or `join` to reserve a new seat. Connections cannot impersonate an active seat merely by choosing the same name. Offline seats no longer place new bets. On server restart, active hands are canceled and the shoe reshuffled; this is **not** a continuation of a half-completed hand.

### V19 test automation

- `tests/rooms.test.js` adds eight Node.js regression tests for joining, invalid/resumed tokens, seat limits, hidden-card counting, host rules and durable snapshots.
- `.github/workflows/verify.yml` runs `npm run check` on pushes and pull requests.
- These are **unit-level state tests**. Cloudflare Durable Object integration, persistence after restart, real WebSocket concurrency, and browser end-to-end tests are still required.

### Run locally

```sh
npm install
npm run check
npm run dev
```

Open `/online.html` under Wrangler's local URL. Online play needs Cloudflare Workers and Durable Objects; GitHub Pages only serves static content.

### Known limitations

**V19 is a development prototype; it has not been deployed or browser-regression-tested.**
- Tokens are bearer credentials kept in sessionStorage: there is no authenticated user identity, token rotation, encrypted session management, or recovery if the tab's session storage is lost. Possession of a room code does not provide security.
- Each room allows four reserved seats; expired/abandoned seats cannot yet be freed through a secure leave/timeout operation.
- Player bankroll updates and active rounds do not have complete crash-safe, atomic recovery; actions and checkpoints need serialization and idempotency tests.
- Socket reattachment is not hibernation-based. Validate Cloudflare object lifecycle, concurrency, and disconnect behavior before launch.
- Online rules do not yet include splits, surrender, insurance or a verified full strategy matrix.
- The standalone full V13 HTML included features not yet merged into the GitHub Lite casino.
- Virtual practice only: no money, prizes or cash-out.

No production deployment has been performed. Production signoff requires server state-machine tests, reconnect tests, WebSocket integration tests, and security review.
