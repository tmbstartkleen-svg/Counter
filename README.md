# BlackEdge Elite — Counter

BlackEdge Elite is a play-money blackjack simulator and card-counting education project.

## Repository version (V13 Lite)

`index.html` is a browser-playable version featuring:
- Finite shuffled card shoe with 1, 2, 6 or 8 decks
- Three simulated tablemates, dealer hole card and natural-blackjack payout
- Hit, stand and double using virtual credits
- Visible Hi-Lo running / true count with hide-count practice
- Timed counting drills, true-count conversion questions, progress tiers and JSON export
- Responsive casino-styled interface

**Important:** This GitHub version is a streamlined V13 edition. The complete downloadable V12 package created in the ChatGPT session has additional features inherited from V11 (including split/surrender and decision journaling) that have **not** yet been merged here. Full rule-specific strategy validation and browser regression testing are pending.

V13 Lite also adds discard-tray estimation and true-count calculation exercises in `v13-academy.js`. The fully featured V13 source package is provided separately as a downloadable artifact; its complete casino rule set is not yet merged into GitHub.

## Open locally

Download the repo and open `index.html` in a modern browser. Alternatively, serve it using `python3 -m http.server 8000`.

To publish via GitHub Pages, enable Pages using **Deploy from a branch → main → /(root)** in repository Settings.

## Safety

Educational play-money simulator only. No real wagering, prediction guarantee or casino integration.
