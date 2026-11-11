# User-flow suite (`e2e/flows/`)

A small set of click-and-save tests for the screens this release changes,
plus login. Every test is a real round trip or a validation check: fill,
save, find, reload, read back from the API, edit, delete.

## What it covers

| File                      | Tests                                                          |
| ------------------------- | -------------------------------------------------------------- |
| `auth.spec.ts`            | login, wrong password, form validation, logout, session expiry |
| `email-templates.spec.ts` | edit round trip, empty-name validation + Cancel, search/delete |
| `ai-usage.spec.ts`        | dashboard with logged requests, Status filter, ranges          |
| `ai-setup.spec.ts`        | every setup card opens its page                                |
| `ai-mcp.spec.ts`          | MCP server create, Settings edit, deactivate, typed delete     |
| `service-http.spec.ts`    | HTTP service validation, create from cURL import               |
| `scheduler.spec.ts`       | task round trip, validation, Log tab                           |
| `system-pages.spec.ts`    | System Info shows what the backend reports                     |

Known product bugs on develop are not tests here. The bug list lives outside
the repo (`specs/ui-integration-2026-11/flow-known-failures/`).

## Running

The suite WRITES to the backend. It runs only against the seeded gate stack.
It refuses port 8081 and any instance without the `gate_sample_db` service
(`support/env.ts`, `support/api.ts`), for every test. `npm run e2e` skips this
folder unless `E2E_FLOWS=1` is set.

```
E2E_FLOWS=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:<proxy port> \
DF_ADMIN_EMAIL=... DF_ADMIN_PASSWORD=... \
npx playwright test e2e/flows --workers=1
```

`PLAYWRIGHT_BASE_URL` serves the built UI at `/dreamfactory/dist/` and
forwards `/api` to the backend (the gate proxy). Use the
`mcr.microsoft.com/playwright:v1.59.1-jammy` image, one worker.

## Rules

1. Import `test` and `expect` from `./support/test`. That attaches the
   console/network watcher and the cleanup.
2. Name every record with `uniqueName(kind)` and register it with
   `api.track(resource, name)` BEFORE the save (`api.create` tracks for you).
   Cleanup runs after every test; a failed cleanup fails the test.
3. Never modify or delete a seeded `gate_*` record.
4. Wait on real conditions (a response, a URL, visible text). No sleeps.
5. An error provoked on purpose is declared first with `watch.allowHttp` or
   `watch.allowConsole`. An allowance that never matches fails the test.
6. A test earns its place only if it passes on develop, fails for a reason a
   user would care about, and proves something no other test proves. A test
   that fails on a known product bug is not added; it goes in the bug list.
7. Selectors: role, label, visible text first; `data-testid` only where the
   product already ships one. No test hooks under `src/`.
