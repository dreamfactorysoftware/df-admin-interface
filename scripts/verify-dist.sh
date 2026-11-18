#!/usr/bin/env bash
# Check that a built dist directory is complete enough to serve.
#
# CI runs this on a fresh build before it commits dist/ (see
# .github/workflows/dist.yml). It also works on any build output:
#
#   scripts/verify-dist.sh             # checks ./dist
#   scripts/verify-dist.sh /tmp/out    # checks another directory
#
# Checks:
#   1. index.html exists.
#   2. Every local file that index.html references exists: src= and href= on
#      script, link, img and source tags, and url() in the inlined CSS.
#   3. index.html loads a main bundle and a runtime.
#   4. No file in the directory is empty.
#
# This proves the build is whole. It does not prove the build matches the
# source. Only a rebuild can prove that.
#
# ponytail: references are not URL-decoded. A file name that needs %-escapes
# in index.html fails check 2. Decode here if such a file ever appears.
set -euo pipefail

dir="${1:-dist}"
dir="${dir%/}"
index="$dir/index.html"
fail=0

err() {
  echo "FAIL: $*"
  fail=1
}

if [ ! -f "$index" ]; then
  echo "FAIL: $index not found"
  exit 1
fi

strip_quotes='s/^["'\'']//; s/["'\'']$//'
attr='(src|href)=("[^"]*"|'\''[^'\'']*'\'')'

# <base href> is the URL prefix the app is served under. It is not a file.
base="$(grep -oiE '<base[[:space:]][^>]*>' "$index" |
  grep -oE "$attr" | head -n 1 | sed -E "s/^href=//; $strip_quotes" || true)"

refs="$({
  { grep -oiE '<(script|link|img|source)[[:space:]][^>]*>' "$index" |
    grep -oE "$attr" | sed -E "s/^(src|href)=//; $strip_quotes"; } || true
  { grep -oE 'url\([^)]*\)' "$index" |
    sed -E "s/^url\(//; s/\)$//; $strip_quotes"; } || true
} | sort -u)"

external='^([a-zA-Z][a-zA-Z0-9+.-]*:|//|#)'
main_re='^main(\.[0-9a-f]+)?\.js$'
runtime_re='^runtime(\.[0-9a-f]+)?\.js$'
checked=0
has_main=0
has_runtime=0
while IFS= read -r ref; do
  [ -n "$ref" ] || continue
  # External URLs, data: URIs and fragments are not files in dist.
  if [[ "$ref" =~ $external ]]; then
    continue
  fi
  path="${ref%%[?#]*}"
  if [ -n "$base" ] && [ "${path#"$base"}" != "$path" ]; then
    path="${path#"$base"}"
  elif [ "${path#/}" != "$path" ]; then
    echo "skip: $ref (absolute path outside <base href>)"
    continue
  fi
  path="${path#./}"
  checked=$((checked + 1))
  if [ ! -f "$dir/$path" ]; then
    err "index.html references $ref, which is not in $dir"
  fi
  if [[ "$path" =~ $main_re ]]; then has_main=1; fi
  if [[ "$path" =~ $runtime_re ]]; then has_runtime=1; fi
done <<<"$refs"

if [ "$has_main" -eq 0 ]; then err "index.html does not load a main bundle"; fi
if [ "$has_runtime" -eq 0 ]; then err "index.html does not load a runtime"; fi

while IFS= read -r empty; do
  [ -n "$empty" ] || continue
  err "empty file: $empty"
done <<<"$(find "$dir" -type f -empty)"

if [ "$fail" -ne 0 ]; then
  echo "verify-dist: $dir is NOT a usable build"
  exit 1
fi
total="$(find "$dir" -type f | wc -l | tr -d ' ')"
echo "OK: $dir has $total files, all $checked local references in index.html resolve, main and runtime present, no empty files."
