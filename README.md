# BlackEdge Elite — Counter

A casino-style, play-money blackjack simulator and card-counting academy.

## V24 — Premium Casino UI

- `public/v24-casino.css` introduces dark emerald, gold, elegant typography, high-contrast controls, readable cards and more spacious tables.
- Main casino and online-room interfaces load the same theme.
- Navigation emphasizes **Play Casino, Learn Blackjack, Card Counting, My Progress**.
- Responsive layouts and reduced-motion accessibility preferences are supported.
- The same stylesheet and page markup are retained at repo root for local standalone use.

### Development status

V24 is a **styling and usability pass**, not a fully illustrated 3D casino. There is no real-time dealer avatar yet. JavaScript and browser end-to-end checks, mobile layout QA, blackjack rules regression, and online multiplayer infrastructure validation must pass before launch.

### Remaining roadmap

- **V25:** In-table tutorials and guided card-counting practice.
- **V26:** Personalized coaching, exam progress, session history and accessibility.
- **V27:** Multiplayer hardening, automated end-to-end and rule correctness tests.
- **V28:** Final polish, deployment and beta verification.

### Local development
```sh
npm install
npm run check
npm run dev
```

Online rooms require a Cloudflare Worker and Durable Object; GitHub Pages does not provide the multiplayer server. No production deployment has been performed. Virtual credits only—no wagering or prizes.
