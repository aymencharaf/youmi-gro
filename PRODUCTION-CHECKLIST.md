# Youmi Production Checklist

## Phase 1 — Frontend
- React/Vite production build.
- Arabic + French UI.
- Public marketplace and seller storefronts.
- Seller dashboard and admin dashboard.

## Phase 2 — Authentication & roles
- Buyer, merchant and admin accounts.
- Passwords stored with PHP password hashing.
- Server-side merchant ownership checks.
- Suspended merchants cannot use protected merchant endpoints.
- HTTP-only session cookie with SameSite=Lax.

## Phase 3 — Marketplace
- Multi-vendor stores.
- Product CRUD.
- Coupons.
- Orders and order tracking.
- Stock validation.
- Seller subscriptions.
- No commission/withdrawal workflow, as requested.

## Phase 4 — Admin
- Seller activation/suspension.
- Store management.
- Product management.
- Order management.
- Subscription management.
- Dashboard statistics.

## Phase 5 — Hosting
1. Create an InfinityFree MySQL database.
2. Copy `public/config.example.php` to `public/config.php` on the server.
3. Set MySQL credentials and a strong admin username/password.
4. Do not commit `config.php`.
5. Push to GitHub `main` to build/deploy, or upload `dist/` manually.
6. Verify `/api.php?action=status`.

## Phase 6 — Final security checks
- Use HTTPS.
- Change all demo credentials before launch.
- Do not place MySQL passwords or shipping API keys in frontend code.
- Rotate any keys that were previously exposed.
- Test merchant A cannot read/write merchant B.
- Test suspended merchant access.
- Test duplicate order IDs and stock boundaries.
- Test order status updates from both admin and merchant.
- Test subscription changes.
- Back up MySQL before production migrations.

## GitHub Actions secrets
- `INFINITYFREE_FTP_SERVER`
- `INFINITYFREE_FTP_USERNAME`
- `INFINITYFREE_FTP_PASSWORD`
