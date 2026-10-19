# BlackEdge controlled-beta release acceptance (Build 41)

**Status: NOT CERTIFIED.** Automated unit tests, browser CI and a live-site smoke test are not substitutes for an actual two-device session. Keep public beta approval blocked until the independent evidence below is completed.

## Record the test environment
- Candidate Git commit SHA:
- Staging deployment URL (not production):
- Cloudflare Worker deployment/version and Durable Object binding:
- Date/time and tester:
- Desktop/browser/version:
- Second independent device/browser/version (not another tab on the first device):
- Network conditions and any reconnect simulation:
- Links to GitHub release, browser visual and live smoke workflows:
- Evidence links (screen recording/screenshots/logs, with credentials redacted):

## Required multiplayer acceptance

Mark each case PASS, FAIL, or NOT RUN and attach evidence. Do not enter PASS without observing the actual behavior.

| ID | Test performed with two independent devices | Result | Evidence |
|---|---|---|---|
| M01 | Device A creates/joins room, B joins same room; both see two seats and presence | NOT RUN | |
| M02 | A hosts/deals; B cannot host-deal; both see synchronized cards and turn order | NOT RUN | |
| M03 | A and B complete a round including hit, stand and settlement; balances match on both | NOT RUN | |
| M04 | During a round disconnect B; other participant can continue, and no round deadlock occurs | NOT RUN | |
| M05 | Reconnect B using existing recovery token; original chips/seat restored without extra seat | NOT RUN | |
| M06 | Disconnect host A between rounds; B becomes host and can deal | NOT RUN | |
| M07 | Try fifth player after four seats fill; join denied; existing players unaffected | NOT RUN | |
| M08 | Leave room voluntarily; expired seat token cannot reclaim released seat | NOT RUN | |
| M09 | Exercise double, split, surrender, insurance and dealer natural rules in representative rounds | NOT RUN | |
| M10 | Refresh/rotate one browser while the other remains connected; no duplicate game commands or lost session | NOT RUN | |
| M11 | Restart staging Durable Object during wagered round; verify interruption/refund and stable checkpoint | NOT RUN | |
| M12 | Validate onboarding, controls, focus/keyboard access, mobile viewport and no sideways overflow | NOT RUN | |
| M13 | Confirm no real-money wagers, purchases, payouts, or prizes are offered | NOT RUN | |

## Certification gate
1. All applicable automated GitHub checks on the exact candidate commit must complete successfully.
2. Staging deployment must be independently identified, healthy, and configured with BLACKJACK_ROOMS binding and required assets.
3. All M01-M13 cases must show PASS with independently reviewable evidence, or a documented approved exception.
4. Record any failures as issues, repair, redeploy staging, and repeat the impacted tests. A source-only fix does not validate a deployment.
5. The owner explicitly approves the beta release after reviewing results. **A green CI badge alone is never release approval.**

## Sign-off
- Candidate SHA / staging version:
- Manual acceptance outcome: **PENDING**
- Open blockers:
- Owner approval and date: **NOT GRANTED**
- Production release authorized: **NO**

Do not put recovery credentials, player tokens, or secrets in public artifacts.
