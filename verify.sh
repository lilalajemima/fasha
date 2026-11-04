#!/usr/bin/env bash
fail=0
check() {
  if [ ! -f "$1" ]; then echo "MISSING  $1"; fail=1
  elif grep -q "$2" "$1"; then echo "ok       $1"
  else echo "WRONG    $1  (does not contain: $2)"; fail=1; fi
}

check frontend/public/favicon.svg                        "B91C1C"
check frontend/src/App.tsx                               "DocumentTitle"
check frontend/src/components/DocumentTitle.tsx          "titleFor"
check frontend/src/components/PageHeader.tsx             "page-head--display"
check frontend/src/components/Logo.tsx                   "The wordmark, and nothing else"
check frontend/src/layouts/Shell.tsx                     "nextUmugandaLabel"
check frontend/src/layouts/Shell.css                     "Only the page you are on"
check frontend/src/lib/format.ts                         "export function quantity"
check frontend/src/lib/umuganda.ts                       "export function nextUmuganda"
check frontend/src/lib/types.ts                          "sector: string | null"
check frontend/src/styles/tokens.css                     "ok-line"
check frontend/src/styles/global.css                     "page-head--display"
check frontend/src/styles/workspace.css                  "codepanel__fill--last"
check frontend/src/pages/admin/AdminDashboard.tsx        "No sector recorded"
check frontend/src/pages/manage/Attendance.tsx           "roster__count"
check frontend/src/pages/manage/CalendarMonth.tsx        "calendar__umuganda"
check frontend/src/pages/manage/Applicants.tsx           "quantity("
check frontend/src/pages/manage/Opportunities.tsx        "quantity("
check frontend/src/pages/manage/Deliverables.tsx         "btn--small btn--danger"
check frontend/src/pages/volunteer/Discover.tsx          "listing__date"
check frontend/src/pages/volunteer/Discover.css          "listing__date-day"
check frontend/src/pages/volunteer/MyInitiatives.tsx     "meta(item.sector"
check frontend/src/pages/volunteer/OpportunityDetail.tsx "quantity(item.maxCapacity"
check frontend/src/pages/volunteer/Portfolio.tsx         "Preview of your public portfolio"
check backend/prisma/seed.ts                             "nextUmuganda"
check backend/prisma/cleanup.ts                          "fasha.test"
check backend/src/modules/admin/AdminStore.ts            "sector: string | null"
check backend/src/modules/admin/AdminRepository.ts       "sector: row.sector,"

if grep -rqn "Sector not set\|Date to be confirmed" frontend/src; then
  echo "TO DO    a placeholder string is still being printed:"
  grep -rn "Sector not set\|Date to be confirmed" frontend/src | sed 's/^/           /'
  fail=1
else
  echo "ok       no placeholder strings left"
fi

if grep -q '"db:cleanup"' backend/package.json; then
  echo "ok       backend/package.json has db:cleanup"
else
  echo "TO DO    add to backend/package.json scripts:"
  echo '           "db:cleanup": "ts-node-dev --transpile-only prisma/cleanup.ts",'
  fail=1
fi

if grep -q 'favicon.svg' frontend/index.html; then
  echo "ok       frontend/index.html points at the new favicon"
else
  echo "TO DO    frontend/index.html still has the Vite icon. Replace the icon link with:"
  echo '           <link rel="icon" type="image/svg+xml" href="/favicon.svg" />'
  fail=1
fi

[ $fail -eq 0 ] && echo && echo "All good." || { echo; echo "Fix the lines above before building."; }
exit $fail
