# Laravel 13 Compatibility Notes

This repo is the **Angular 16 admin UI** for DreamFactory. It is a frontend-only
package and has no PHP / Laravel runtime dependency. As part of the
DreamFactory Laravel 11 -> 13 upgrade campaign (Waves 0-5), this package was
audited for compatibility against the L13 backend.

## Audit result: L13-transparent

**No code changes are required for the UI to function against the Laravel 13
backend.** This document captures why, so future contributors don't need to
re-derive it.

### What was audited

1. **API endpoints** consumed by the UI (`src/app/shared/constants/urls.ts`
   and call sites grepped under `src/`). All paths live under `/api/v2/...`
   and are served by `df-core` / `df-user` / `df-system`, which are upgraded
   to L13 as composer-only bumps with no route or contract changes.
2. **Auth endpoints**: `/api/v2/system/admin/session`, `/api/v2/user/session`,
   `/api/v2/system/admin/password`, `/api/v2/user/password`,
   `/api/v2/user/register`. All unchanged.
3. **Error envelope**: the UI's HTTP interceptors
   (`src/app/shared/interceptors/error.interceptor.ts`,
   `src/app/shared/interceptors/snackbar.interceptor.ts`) and many feature
   components consume DreamFactory's custom error envelope:
   ```json
   { "error": { "message": "...", "code": 400, "context": { ... } } }
   ```
   This envelope is produced by `df-core`'s exception handler, **not** by
   Laravel's default JSON error formatter. Default-Laravel JSON error shape
   changes between L11 and L13 (`message` / `exception` / `file` keys) do not
   reach this UI.
4. **Composer coupling**: `composer.json` declares only
   `dreamfactory/installer: *`, a Composer installer plugin that stages the
   built `dist/` artifact into the host app's public dir. There is no
   Laravel framework dependency here.

### What was NOT audited (out of scope)

- **Angular 16 modernization**: Angular 16 reached end-of-life in November
  2024. The UI will continue to function against L13, but Angular itself
  should be modernized in a separate track (Angular 17 / 18 / 19), decoupled
  from the L13 upgrade.
- **Backend-driven UI features** (e.g., new admin screens for L13-specific
  features): none are planned for the L13 upgrade — Waves 0-5 are mechanical
  framework bumps, not feature work.

## Campaign tracking

This package is recorded in the campaign as **L13-transparent: docs-only
alignment PR**. See the corresponding shift/laravel-13 PRs in sibling
DreamFactory packages for the broader upgrade context.
