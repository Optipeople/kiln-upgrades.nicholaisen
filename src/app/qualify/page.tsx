import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/Container";
import { QualifyTabs } from "@/features/baltic/QualifyTabs";

export const metadata: Metadata = {
  title: "Savings Calculator & Kiln Health Score",
  description:
    "Qualify your kiln upgrade potential — savings calculator, health score, and upgrade packages.",
  alternates: { canonical: "/qualify" },
  openGraph: {
    title: "Savings Calculator & Kiln Health Score — Nicholaisen",
    description: "Savings calculator, kiln health score, and upgrade packages.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function QualifyPage() {
  return (
    <section className="pt-6 pb-20 lg:pt-8 lg:pb-28">
      <Container size="default">
        <div className="mb-8 flex justify-start">
          <a
            href="https://nicholaisen.dk/"
            className="group inline-flex items-center gap-1.5 rounded-md text-sm font-medium transition-colors"
            style={{ color: "var(--color-ink-500)" }}
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            nicholaisen.dk
          </a>
        </div>

        <div className="mb-10 flex items-center justify-center">
          <a
            href="https://nicholaisen.dk/"
            aria-label="Back to Nicholaisen.dk"
            className="inline-block rounded-sm transition-opacity hover:opacity-80"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/nicholaisen-logo.svg"
              alt="Nicholaisen"
              className="h-24 w-auto"
            />
          </a>
        </div>

        <QualifyTabs />

        <p
          className="mt-16 text-center text-xs tracking-wide"
          style={{ color: "#555" }}
        >
          Nicholaisen · Kiln Upgrade Campaign · For indicative purposes only
        </p>
      </Container>
    </section>
  );
}
