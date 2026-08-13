#!/usr/bin/env bash
# publish.sh - build the admin UI and it's live. That's the whole pipeline.
#
# How publishing works here:
#   - dist/ is COMMITTED to this repo. That's the repo convention (consumers
#     install the built artifact via composer). Don't gitignore it, don't
#     fight it - commit dist/ with your source changes.
#   - This package directory is bind-mounted into df-development-web-1 at
#     /opt/dreamfactory/public/dreamfactory, so the moment `ng build` writes
#     dist/, nginx at http://localhost:8081/dreamfactory/dist/ serves it.
#     No docker cp, no container restart, no deploy step.
#   - Caching: nginx sends `Cache-Control: no-store` for dist/index.html
#     (see df-development/docker/dreamfactory.conf), and Angular hashes all
#     chunk filenames. A plain browser reload picks up the new build; if you
#     still see stale UI, the nginx header is missing (container predates the
#     config) - hard refresh and check `curl -sI .../dist/index.html`.

set -euo pipefail
cd "$(dirname "$0")/.."

NODE_OPTIONS=--max-old-space-size=4096 npx ng build --configuration production

main_js=$(ls dist/main.*.js | head -1)
echo ""
echo "Published: ${main_js} -> http://localhost:8081/dreamfactory/dist/ serves it immediately (bind-mount, no restart needed)."
