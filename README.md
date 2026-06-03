# Kiln Upgrades — ROI Tool

Standalone Next.js site hosting the Nicholaisen Kiln Upgrades ROI calculator.

- **Production domain:** `kiln-upgrades.nicholaisen.dk` (TBD)
- **Stack:** Next.js 16 App Router · React 19 · Tailwind CSS v4 · Resend · zod

The wizard, theme, components and visual identity mirror the 6-Side Machining Cell
calculator. The kiln-specific product catalogue and upgrade packages in
`src/features/kiln-upgrades-roi/{products,solutions}.ts` are placeholder data —
swap with real engineering numbers when available.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in RESEND_API_KEY etc. as needed
npm run dev
```

The calculator is served from `/` and posts submissions to `/api/roi/kiln-upgrades`.

You can preview the report email HTML by visiting `/api/roi/kiln-upgrades` directly in
the browser — the GET handler renders a sample report.

## Environment variables

See `.env.example`. In production these are managed in Vercel
(**Project → Settings → Environment Variables**).

| Variable               | Purpose                                                                                  |
|------------------------|------------------------------------------------------------------------------------------|
| `NEXT_PUBLIC_SITE_URL` | Public site URL, used for OG metadata and the default email `from` host.                 |
| `RESEND_API_KEY`       | Resend API key — required for the form to actually send mail.                            |
| `ROI_TO_EMAIL`         | Recipient(s) for ROI submissions. Comma-separated allowed.                               |
| `CONTACT_TO_EMAIL`     | Fallback recipient if `ROI_TO_EMAIL` is unset.                                           |
| `CONTACT_FROM_EMAIL`   | `from` address. Defaults to `website@<host of NEXT_PUBLIC_SITE_URL>`. Must be on a verified Resend domain. |

### Wiring the email up (one-time)

1. Sign in to **resend.com**, create an API key, add it to Vercel as `RESEND_API_KEY`
   for the Production environment (and Preview if you want previews to send mail).
2. Verify the sending domain in Resend (e.g. `nicholaisen.dk`). Until verified you can
   only send to your own Resend account email.
3. Set `CONTACT_FROM_EMAIL` to an address on the verified domain
   (e.g. `kiln-roi@nicholaisen.dk`).
4. Set `ROI_TO_EMAIL` to the inbox(es) that should receive submissions.

Without `RESEND_API_KEY` the API logs the submission and returns `200`, so
dev/preview deployments still keep working — you just won't get an email.

## Project layout

```
src/
  app/
    api/roi/kiln-upgrades/route.ts   POST handler + GET preview of the email
    privacy/page.tsx                 Placeholder privacy page
    layout.tsx                       Root layout, fonts, Footer
    page.tsx                         Calculator page
  components/
    Container.tsx                    Standard width wrapper
    Footer.tsx                       Site footer
  features/
    kiln-upgrades-roi/
      Calculator.tsx                 4-step wizard (kilns → production → upgrade → contact)
      products.ts                    Kiln types — placeholder data
      solutions.ts                   Upgrade packages — placeholder data
      schema.ts                      zod payload schema
  lib/
    cn.ts                            tailwind-merge helper
    site.ts                          Site metadata
  styles/globals.css                 Tailwind v4 theme tokens
public/
  nichomachines-black.png            Brand logo (replace with kiln/Nicholaisen logo as needed)
  products/*.svg                     Kiln type placeholders
  solutions/*.svg                    Upgrade package placeholders
```
