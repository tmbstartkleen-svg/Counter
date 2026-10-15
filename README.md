# BlackEdge Elite — Counter

Professional **play-money** blackjack practice and card-counting academy.

## V22 development milestone

### Available code
- Solo casino, counting academy, drills, same-device table, and online multiplayer prototype
- Server-side rules engine for hit/stand/double, blackjack settlement and dealer S17
- V22 multiplayer actions for two-hand splitting and late surrender, with hand-by-hand settlement
- V22 insurance calculations and controls are **experimental and not yet casino-accurate**: the current dealer-blackjack peek occurs before players can purchase insurance. Do not rely on insurance practice until the opening-deal insurance phase is corrected.
- Unit tests in `tests/`, including split/surrender regression scenarios, are committed but not yet confirmed passing by CI.

### Simple product scope for the remaining builds
1. **V23:** Correct game rules, proper insurance phase, split-ace restrictions, 3:2 payouts, configurable shoe and automated tests.
2. **V24:** One intuitive casino table with premium visual design, animated cards/chips, large readable controls and responsive phone layout.
3. **V25:** Guided tutorials inside the simulator, beginner-to-advanced counting exercises and exam mode.
4. **V26:** Analytics, coaching accuracy, history, progress persistence and accessibility.
5. **V27:** Multiplayer reliability, load/security and regression testing; only keep online play if stability meets criteria.
6. **V28:** Final QA, bug fixes, release documentation, deployment and beta verification.

These are targets, not release guarantees. Online play and Cloudflare deployment are not yet production-certified.

### Local developer workflow
```sh
npm install
npm run check
npm run dev
```

The Cloudflare Worker and Durable Object service are not deployed. No real-money wagering or prizes.
