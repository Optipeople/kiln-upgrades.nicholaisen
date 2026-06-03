export const site = {
  name: "Nicholaisen",
  legalName: "Nicholaisen A/S",
  tagline: "Kiln Upgrades ROI Calculator",
  description:
    "Estimate the energy savings, throughput gains and payback period of a Nicholaisen kiln upgrade.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://kiln-upgrades.nicholaisen.dk",
  email: "info@nicholaisen.dk",
} as const;

export type Site = typeof site;
