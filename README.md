# BlackEdge Elite — Counter

BlackEdge Elite is an educational **play-money** blackjack and card-counting training platform.

## V14 Lite (GitHub edition)

Open `index.html` in a modern browser or use `python3 -m http.server 8000`.

### Available

- Casino practice with finite shuffled shoe and three simulated tablemates.
- Hi-Lo running and true-count practice, hidden count, timed drills and academy levels.
- V13 discard-tray estimation and true-count exercises.
- **V14 Shared-table Practice Room:** 1–4 human participants on **one shared device**, pass-and-play seating, one shoe, face-down dealer hole card, hit/stand/double, virtual bankrolls, per-round results and count visibility toggle. No real-money betting.

### Not yet available

- **Internet multiplayer is NOT implemented.** V14 is local pass-and-play only. Online room creation, authentication, server-authoritative shuffling, WebSocket sync, disconnect/rejoin, reconnection and security testing are still needed.
- The comprehensive standalone V13 casino features have not all been merged into GitHub. This repository's casino remains Lite (e.g., split and surrender are still missing here).
- Browser end-to-end regression testing, exhaustive rules testing, and Cloudflare deployment.

### Notes on casino rules

The V14 room is a training prototype: fixed 25-chip virtual wagers, dealer stands on all 17s, standard blackjack pays 3:2, no insurance or splitting, no surrender. Blackjack payouts assume natural hands only, and simultaneous naturals push. Chips have no monetary value.

## Deployment

For simple static preview, enable GitHub Pages from **Settings → Pages → Deploy from a branch → main / (root)**. Online multiplayer requires a suitable backend, such as Cloudflare Workers with Durable Objects, and explicit integration tests.

## Safety

Educational simulation only. Card counting is not a guarantee of winning and may be restricted by individual casinos.
