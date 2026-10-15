# BlackEdge Elite — Counter

Premium casino-style, play-money blackjack simulator with an embedded card-counting academy.

## V25: Guided Table Academy

The main casino now loads `v25-guided.js`. It adds:

- Optional in-table lessons responding to visible player cards and dealer upcard.
- Guided explanation of hard hands, Aces, matching cards and observable information.
- A practice check for counting **currently visible cards** at the table (not the historical running shoe count).
- Local accuracy tracking and accessibility-friendly feedback.
- Preserved V24 emerald/gold visual design and previous counting lessons.

The new coaching module is **basic orientation, not a validated complete basic-strategy recommender**. Existing casino implementation and blackjack variants still require thorough rules testing.

## Remaining planned builds

- **V26:** Comprehensive rule-specific coach, useful progress metrics and accessibility.
- **V27:** Multiplayer hardening, automated rule/browser tests, persistence and security.
- **V28:** Release polish, mobile QA, Cloudflare beta deployment if testing gates pass.

Target: three major planned builds following V25; additional bug-fix iterations may be necessary.

## Local development

```sh
npm install
npm run check
npm run dev
```

The online-room backend is not deployed. GitHub commits confirm source changes, not successful browser testing or production certification. Virtual credits only; no real-money wagering.
