# Provisioning `/api/mcp` (one-time)

The endpoint's code is done and the build is green. Three infra steps gate the
live demo (per karl-infra #17). Each is reduced to a single paste/command
below. None of them can be done from a CI/agent session — they need secrets
and dashboard access — so they're documented here as a runbook.

## 1. Create the read-only Neon role

Closes the one real security gap: `lookup_nwbfit_user_activity` should not be
able to reach nwb-plan's data through the read/write `neondb_owner` role.

Edit the password in [`db/nwbfit-readonly-role.sql`](../db/nwbfit-readonly-role.sql),
then run it against the nwb-plan **production** database (`neondb`) as an admin
role:

```bash
psql "<neondb_owner connection string>" -f db/nwbfit-readonly-role.sql
```

(or paste it into the Neon SQL Editor). Then build the connection string —
same host as your existing `NWB_POSTGRES_URL`, swapping in the new credentials:

```
postgresql://nwbfit_readonly:<password>@<same-pooler-host>/neondb?sslmode=require
```

That value becomes `NWB_POSTGRES_READONLY_URL` in the next step.

> Even before this role exists, the endpoint is safe: every query runs inside a
> `BEGIN TRANSACTION READ ONLY`, so the `NWB_POSTGRES_URL` fallback cannot
> write. This step removes the *ability* to write at the role level too.

## 2. Fill in the secrets

```bash
cp .env.mcp.example .env.mcp.local
# edit .env.mcp.local with real values:
#   TWILIO_* come from the Mac runner's services/email-triage/.env
#   NWB_POSTGRES_READONLY_URL from step 1
#   MCP_BEARER_TOKEN: openssl rand -hex 32 (reuse the existing one if already set)
```

`.env.mcp.local` is gitignored.

## 3. Push to Vercel + redeploy

```bash
npm i -g vercel && vercel login && vercel link   # pick the command-center project
bash scripts/setup-vercel-env.sh                 # writes production + preview
vercel --prod                                    # or redeploy from the dashboard
```

## 4. Unblock Claude Desktop (auth wall)

`command.93.fyi/api/mcp` sits behind Cloudflare Access **and** Vercel
Deployment Protection, which a bare `Authorization: Bearer` header can't pass.
Pick one:

- **Vercel** — Project → Settings → Deployment Protection → add a *Protection
  Bypass for Automation* token, send it as the `x-vercel-protection-bypass`
  header; **or**
- **Cloudflare** — create an Access *service token* and send the
  `CF-Access-Client-Id` / `CF-Access-Client-Secret` headers.

Verify end to end:

```bash
curl -X POST https://<host>/api/mcp \
  -H "Authorization: Bearer $MCP_BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Expect a JSON-RPC result listing the 5 tools.
