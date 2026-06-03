import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/Container";
import { KilnUpgradesRoiCalculator } from "@/features/kiln-upgrades-roi/Calculator";

export const metadata: Metadata = {
  title: "Kiln Upgrades ROI Calculator",
  description:
    "Estimate the energy savings, throughput gains and payback period of a Nicholaisen kiln upgrade.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Kiln Upgrades ROI Calculator — Nicholaisen",
    description:
      "Estimate the energy savings, throughput gains and payback period of a Nicholaisen kiln upgrade.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return (
    <section className="pt-6 pb-20 lg:pt-8 lg:pb-28">
      <Container size="default">
        <div className="mb-8 flex justify-start">
          <a
            href="https://nicholaisen.dk/"
            className="group inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-[var(--color-ink-500)] transition-colors hover:text-[var(--color-tan-500)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tan-500)]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            nicholaisen.dk
          </a>
        </div>
        <div className="mb-10 flex items-center justify-center">
          <a
            href="https://nicholaisen.dk/"
            aria-label="Back to Nicholaisen.dk"
            className="inline-block rounded-sm transition-opacity hover:opacity-80 focus-visible:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-tan-500)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/nicholaisen-black.png"
              alt="Nicholaisen"
              className="h-16 w-auto"
            />
          </a>
        </div>
        <KilnUpgradesRoiCalculator />
        <p
          className="mt-16 text-center text-xs tracking-wide"
          style={{ color: "#555" }}
        >
          Nicholaisen · Kiln Upgrades ROI Estimator · For indicative purposes only
        </p>
      </Container>
    </section>
  );
}
