# Kiln Upgrades — ROI Tool

Standalone Next.js site hosting the Nicholaisen Kiln Upgrades ROI calculator.

- **Production domain:** `kiln-upgrades.nicholaisen.dk` (TBD)
- **Stack:** Next.js 16 App Router · React 19 · Tailwind CSS v4 · Resend

## Local development

```bash
npm install
cp .env.example .env.local   # fill in RESEND_API_KEY etc. as needed
npm run dev
```

The calculator is served from `/` and posts submissions to `/api/roi/kiln-upgrades`.

## Environment variables

See `.env.example`. In production these are managed in Vercel.

## Notes

- Without `RESEND_API_KEY` the API logs the submission and returns 200, so dev/preview deployments keep working.
- This project is a blank canvas scaffolded from the 6-sided-machining-center calculator and shares the same tech stack, theme and layout primitives.
