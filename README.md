# BlackEdge Elite — V27 Reliability

Virtual-credit blackjack simulator and training academy.

## V27 changes

- Hide the dealer hole card during the insurance decision and ordinary player turns.
- Forbid new room joins while insurance is in progress.
- Prevent dealer drawing extra cards after an initial natural blackjack.
- Add `tests/v27-regression.test.js` with five focused regression scenarios.
- Set the package version to `0.27.0`.

## Verification

Source commits have been verified. End-to-end browser tests and passing automated CI have NOT yet been confirmed. A direct local clone could not run because network DNS resolution was unavailable in the execution environment. Run `npm run check` in GitHub Actions or locally before any deployment. Cloudflare online multiplayer remains unverified and undeployed.

## Next milestone

V28 is the final *planned* beta-readiness phase: run all tests, repair any failures, check mobile layouts, validate casino rules, review seat-token security, and perform an authorized staging deployment. V28 is a target, not a guarantee of release approval.

No real-money wagering or prizes.
