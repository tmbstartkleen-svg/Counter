# BlackEdge Elite — V28 Beta Readiness Audit

BlackEdge Elite is a virtual-credit blackjack practice and counting academy.

## V28 source changes

- Improved multiplayer disconnect handling: when a seated player drops during insurance, their undecided insurance choice is automatically declined so the other players are not indefinitely blocked.
- Added two regression scenarios in `tests/v28-disconnect.test.js`.
- Bumped package version to `0.28.0`.
- V24 visual theme, V25 in-table lessons, V26 progress module and V27 dealer-card security fixes remain in the repository.

## Release gate: NOT YET PASSED

This milestone is **not a production certification or deployment**. GitHub source changes are verified; full test execution is not verified in this environment. A local GitHub clone attempt failed because github.com DNS could not resolve.

Remaining before public beta:

1. Confirm `npm run check` succeeds on the exact main commit; repair every failing test.
2. Complete WebSocket and Durable Object restart/integration tests, including multiple clients, disconnects, rejoin and transactional checkpointing.
3. Audit seat recovery bearer tokens, token expiry/rotation, abandoned-seat cleanup, stale connections and host handoff.
4. Fix and verify casino-rule edge cases (dealer peek, double after splitting, insurance eligibility, configurable wagers, resplit policy, partial-hand crash refunds).
5. Confirm the V24–V26 modules operate in the rendered pages and perform responsive mobile and accessibility QA.
6. Deploy an authorized Cloudflare staging environment only after checks pass, then conduct real cross-device beta sessions.

### Developer commands

```sh
npm install
npm run check
npm run dev
```

The remaining tasks are release blockers, not optional stretch features. Development iterations may extend beyond V28. All credits are fictional; no real-money bets or prizes.
