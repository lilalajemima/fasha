#!/usr/bin/env bash
# Run from the repo root after copying the files in:  bash verify.sh
set -u
fail=0
ok()  { printf '  ok    %s\n' "$1"; }
bad() { printf '  FAIL  %s\n' "$1"; fail=1; }
has() { grep -q -- "$2" "$1" 2>/dev/null; }

echo "Files in place"
for f in \
  backend/src/modules/accounts/AccountService.ts \
  backend/src/modules/accounts/UserAdminService.ts \
  backend/src/modules/accounts/accounts.routes.ts \
  frontend/src/pages/Profile.tsx \
  frontend/src/pages/Profile.css \
  frontend/src/pages/admin/Users.tsx \
  frontend/src/components/PasswordGate.tsx \
  frontend/src/lib/image.ts
do
  [ -f "$f" ] && ok "$f" || bad "$f is missing"
done

echo
echo "The pages the merge replaces are gone"
for f in frontend/src/pages/volunteer/Profile.tsx frontend/src/pages/volunteer/Profile.css \
         frontend/src/pages/AccountSettings.tsx
do
  [ -f "$f" ] && bad "$f should be deleted" || ok "$(basename "$f") removed"
done

echo
echo "Schema and wiring"
has backend/prisma/schema.prisma 'enum UserStatus' && ok "UserStatus enum" || bad "schema not updated"
has backend/prisma/schema.prisma 'avatar' && ok "avatar column" || bad "schema not updated"
has backend/src/app.ts 'accountRoutes' && ok "account routes mounted" || bad "app.ts not updated"
has backend/src/middleware/authenticate.ts 'UserStatus.DEACTIVATED' \
  && ok "sessions check the account state" || bad "authenticate.ts not updated"
has backend/src/modules/auth/UserStore.ts 'updateAccount' \
  && ok "the user store takes name, bio and picture" || bad "UserStore.ts not updated"
grep -rq 'updateName' backend/src && bad "something still calls updateName" || ok "no updateName left"
has frontend/src/App.tsx 'pages/Profile' && ok "one profile page for every role" || bad "App.tsx not updated"
has frontend/src/auth/AuthContext.tsx 'refresh' && ok "the top bar can refresh" || bad "AuthContext.tsx not updated"

echo
echo "By hand (APPLY.md)"
has frontend/src/pages/admin/AdminDashboard.tsx "from './Users'" \
  && ok "the Users tab is wired in" || echo "  TODO  add the Users tab to AdminDashboard.tsx"
has backend/scripts/smoke.mjs '/account/password' \
  && ok "the smoke suite covers accounts" || echo "  TODO  paste the account block into smoke.mjs"
ls backend/prisma/migrations 2>/dev/null | grep -q account \
  && ok "a migration exists for the new columns" \
  || echo "  TODO  npm --prefix backend run db:migrate -- --name accounts_and_profiles"

echo
[ "$fail" -eq 0 ] && echo "All checks passed." || echo "Something above failed."
exit "$fail"
