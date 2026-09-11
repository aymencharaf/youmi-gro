# Youmi Admin / Multi-Vendor phase

## Roles
- admin: manages the whole marketplace.
- merchant: owns only their store/products/orders.
- buyer: storefront/customer role.

## Admin API
`/admin-api.php?action=dashboard`
`/admin-api.php?action=merchants`
`/admin-api.php?action=stores`
`/admin-api.php?action=orders`
`POST /admin-api.php?action=set_merchant_status`
`POST /admin-api.php?action=set_order_status`

The endpoint requires a PHP session whose user role is `admin`.

## Database
Run `database_admin_migration.sql` once in InfinityFree phpMyAdmin.

## Production rule
Do not expose database credentials in React/Vite variables. Keep them in the server-side PHP config.

## Recommended next UI connection
Connect the existing admin dashboard screens to these endpoints rather than localStorage. Every mutation must be authorized server-side.
