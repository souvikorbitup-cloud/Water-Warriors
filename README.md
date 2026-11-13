This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Sign-up control

Set `SIGN_UP=false` in `.env.local` or your deployment environment to disable
new account creation through the sign-in page. OTPs will only be sent to
registered email addresses, and unknown email addresses cannot create accounts.
When `SIGN_UP` is unset or set to `true`, sign-up remains enabled.

## Site settings

Set `COLLECTION_NAME=siteSettings` in `.env.local` and in each deployment
environment. The admin appearance and hero banner settings are stored as
separate documents in this MongoDB collection. Plus-plan price and payment
orders also use this collection; coupons are stored separately in the
`coupons` collection. Existing coupon documents are migrated automatically
the first time billing reads or manages coupons.

## Location selection

Set `GOOGLE_STATIC_MAPS_API_KEY` in `.env.local` and each deployment environment
to enable Magic Selection. Restrict this server-side key to the Google Maps
Static Maps API. Checkout map previews load directly from Google Static Maps
using `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`; enable Static Maps API for that key and
restrict it to your site's HTTP referrers.

## Plus checkout

Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env.local` and each
deployment environment to enable Plus-plan payments. Keep both values
server-only; do not use `NEXT_PUBLIC_*` variables. Admins can manage the Plus
price and coupon codes at `/admin/billing`. Coupon expiry dates are inclusive
through the end of the selected date in India time.

## Paid reports

Paid reports use the local Next.js API routes and MongoDB; this project does
not integrate Supabase. In addition to the Plus checkout settings, configure:

- `GOOGLE_GEOCODING_API_KEY` as a separate server-only key with the Google
  Geocoding API enabled. Do not use an HTTP-referrer-restricted key for this
  server request; restrict it to the Geocoding API and, where possible, the
  server's IP address.
- `GEMINI_API_KEY` as a server-only key for hydrogeology analysis.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` with Google Maps Static API enabled and
  restricted to the site's HTTP referrers. Report map images load directly from
  Google Static Maps.
- `BETTER_AUTH_SECRET` for signing the HttpOnly report-access cookie.
- `RAZORPAY_WEBHOOK_SECRET` for signature verification of Razorpay webhooks.

Configure Razorpay to send `payment.captured` and `order.paid` events to
`/api/billing/webhook`. The webhook and checkout verification both create or
reuse a report session only after confirming the payment.

Report sessions are stored in the `reportSessions` MongoDB collection and
analysis results are cached in `reportAnalysisCache` for up to 24 hours. These
collections and indexes are created by Mongoose when the report workflow first
runs. Open-Meteo is used for rainfall data and does not require an API key.

The optional report map type is read from the `siteSettings` collection in a
document with `_id: "report-settings"` and a `map_snapshot_type` value of
`roadmap`, `satellite`, `terrain`, or `hybrid`. If the document or field is
missing, reports use `roadmap`. PDF actions use the browser's print-to-PDF
workflow; no PDF-rendering service is used.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
