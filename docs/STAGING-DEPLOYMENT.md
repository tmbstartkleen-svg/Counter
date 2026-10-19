# Isolated beta staging environment (Build 42)

The production Cloudflare Worker is named `counter` and uses `wrangler.jsonc`. The separate configuration `wrangler.staging.jsonc` names `counter-beta-staging` and includes its own Durable Object namespace migration, static assets, and `BLACKJACK_ROOMS` binding.

## Verify before any deployment
```sh
npm run check
npx wrangler deploy --config wrangler.staging.jsonc --dry-run
```

## Authorized staging deployment only
```sh
npx wrangler deploy --config wrangler.staging.jsonc
```

This deployment command is **not** run automatically by this build; it requires confirmed Cloudflare permissions and an explicit deployment decision. Avoid plain `npm run deploy`, which targets the production configuration.

After staging deployment, record the actual URL, account, version and commit in `docs/BETA-ACCEPTANCE.md`. Verify `/api/health`, two independent browser/device WebSocket room connections, recovery and seat transitions, and each M01-M13 gate.

Never mark release certification completed based on the Wrangler dry-run, live production smoke checks or automated unit tests alone. Do not submit tokens or recovery secrets into public reports.
