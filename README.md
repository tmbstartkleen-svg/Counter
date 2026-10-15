# BlackEdge Elite — Counter

BlackEdge Elite is a virtual-credit blackjack simulator and interactive card-counting academy.

## V21: rule-engine integration

The Cloudflare Durable Object multiplayer server now imports `dealerShouldHit` and `settleHand` from `src/blackjack-rules.js`, so live table dealer drawing and hand settlement use the same shared rules functions exercised by `tests/blackjack-rules.test.js`. Current multiplayer settings stand on soft 17, pay natural blackjack 3:2, and use hit/stand/double.

### Verification
- `npm run check` includes the rules module syntax check and both Node test suites.
- GitHub Actions runs `npm run check` on pushes and pull requests.
- GitHub commits have been verified; automated passing CI status and browser WebSocket end-to-end behavior must still be confirmed.

### Run
```sh
npm install
npm run check
npm run dev
```
Open `/online.html` at the local Wrangler address to test online rooms. Cloudflare deployment has **not** occurred.

### Project parts
- `public/index.html`, `public/v13-academy.js`, `public/v14-practice-room.js`: browser-based table and counting lessons.
- `public/online.html`: WebSocket multiplayer room client.
- `src/worker.js`: multiplayer Durable Object server with saved seat, shoe, and bankroll checkpoints.
- `src/blackjack-rules.js`: pure scoring, payouts, surrender/insurance calculation, split eligibility and dealer behavior.
- `tests/*.test.js`: multiplayer state and blackjack rules tests.

### Pending release blockers
1. Integrate actual split-hand UI and full multi-hand settlement; surrender and insurance actions remain unimplemented on the live multiplayer table.
2. Validate room restart consistency, token rotation and expiry, seat cleanup, atomic state updates, reconnect security and real WebSocket concurrency.
3. Run end-to-end tests and check all CI results.
4. Complete a full casino-rule matrix, strategy references, accessibility and browser QA.
5. Deploy to an authorized Cloudflare account only after release gates pass.

**This is a development build using virtual chips only. No real-money wagering.**
