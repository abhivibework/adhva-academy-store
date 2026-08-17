# Adhva Academy Store

Digital storefront for Adhva Academy (Next.js, PostgreSQL, Auth.js). The catalogue starts empty — add products in Admin. No demo data is seeded.

Checkout sells **listed digital** courses and books only (`isListed` and `isDigital`). Physical / hardcopy titles can be stored in Admin but stay unlisted and cannot be purchased.

## Local setup

1. Copy `.env.example` to `.env` and fill in values.
2. Create a PostgreSQL database and set `DATABASE_URL` (Prisma expects Postgres, not SQLite).
3. Generate a long `AUTH_SECRET` (for example `openssl rand -base64 32`).
4. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the first admin user.
5. Add Razorpay and/or Cashfree test keys. Leave a gateway’s keys blank to keep it disabled until they exist.
6. Run:

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

`prisma db seed` creates the admin account and default site settings only — it does not add products.

Open [http://localhost:3000](http://localhost:3000). Sign in with the admin email, then use `/admin` to add listed digital products (with a download file) before they appear in the catalogue.

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Auth.js session secret |
| `APP_URL` | Public site URL (webhooks, download redirects, Cashfree return) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin account |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Razorpay INR checkout |
| `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY` / `CASHFREE_WEBHOOK_SECRET` / `CASHFREE_ENV` | Cashfree PG (`sandbox` or `production`). Webhook HMAC uses `CASHFREE_WEBHOOK_SECRET` if set, otherwise `CASHFREE_SECRET_KEY`. |

## Webhook URLs

Register these in each provider dashboard after the app is publicly reachable (`APP_URL` must match that host). Local webhooks need a tunnel.

- **Razorpay:** `{APP_URL}/api/webhooks/razorpay`  
  Example: `http://localhost:3000/api/webhooks/razorpay`  
  Subscribe to `payment.captured` (and optionally `payment.failed`).
- **Cashfree:** `{APP_URL}/api/webhooks/cashfree`  
  Example: `http://localhost:3000/api/webhooks/cashfree`

Cashfree also returns buyers to `{APP_URL}/api/checkout/return?order_id={order_id}`.

Physical books can be created in Admin but stay off the storefront and cannot be sold at checkout.
