#!/usr/bin/env bash
# Lighthouse over the public pages, on a phone and on a laptop, three runs each.
#
#   ./scripts/lighthouse.sh                                  the deployed site
#   ./scripts/lighthouse.sh http://localhost:8081            the Docker build
#   RUNS=5 ./scripts/lighthouse.sh

set -e

BASE="${1:-https://fasha-frontend.vercel.app}"
RUNS="${RUNS:-3}"
OUT="lighthouse-results"
PAGES="${PAGES:-/signin /signup /privacy}"

mkdir -p "$OUT"
rm -f "$OUT"/*.json "$OUT"/*.html

echo "Target   $BASE"
echo "Runs     $RUNS per page per device"
echo

for path in $PAGES; do
  name=$(echo "${path#/}" | tr '/' '-')
  [ -z "$name" ] && name="home"

  for form in mobile desktop; do
    preset=""
    [ "$form" = "desktop" ] && preset="--preset=desktop"

    for run in $(seq 1 "$RUNS"); do
      echo "  $form  $path  run $run"
      npx lighthouse "$BASE$path" $preset \
        --quiet \
        --chrome-flags="--headless=new" \
        --only-categories=performance,accessibility,best-practices,seo \
        --output=json --output=html \
        --output-path="$OUT/$form-$name-$run"
    done
  done
done

echo
node scripts/lighthouse-summary.mjs "$OUT"