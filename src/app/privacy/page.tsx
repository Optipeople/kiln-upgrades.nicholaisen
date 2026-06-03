import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/Container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How we handle the personal data submitted via the Kiln Upgrades ROI Calculator.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <section className="pt-6 pb-20 lg:pt-8 lg:pb-28">
      <Container size="narrow">
        <div className="mb-8 flex justify-start">
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-[var(--color-ink-500)] transition-colors hover:text-[var(--color-tan-500)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tan-500)]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            Back to calculator
          </Link>
        </div>

        <p className="text-eyebrow text-[var(--color-tan-500)]">Legal</p>
        <h1 className="mt-3 text-display-3 text-balance">Privacy</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-ink-500)]">
          This page summarises how {site.legalName} processes the personal data you provide via
          the Kiln Upgrades ROI Calculator. It is a placeholder — replace with your official policy.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-[var(--color-ink-700)]">
          <section>
            <h2 className="mb-2 text-base font-semibold text-[var(--color-ink-900)]">
              What we collect
            </h2>
            <p>
              When you submit the ROI form we receive your name, email, job title and (optionally) company,
              along with the production figures you enter. The figures are used to compile an internal
              sales report that helps us prepare your proposal.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[var(--color-ink-900)]">
              How we use it
            </h2>
            <p>
              We use your contact details to follow up on your enquiry. The production data and the
              calculation report are stored alongside your enquiry and accessed only by the sales and
              engineering team handling your case.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[var(--color-ink-900)]">
              How long we keep it
            </h2>
            <p>
              We retain enquiry data for as long as needed to handle your case plus a reasonable period
              afterwards for record-keeping and statutory obligations. You can request deletion at any time.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-[var(--color-ink-900)]">
              Your rights
            </h2>
            <p>
              You have the right to access, correct or request deletion of your personal data. To exercise
              any of these rights, contact us at{" "}
              <a href={`mailto:${site.email}`} className="text-[var(--color-tan-500)] underline">
                {site.email}
              </a>
              .
            </p>
          </section>
        </div>
      </Container>
    </section>
  );
}
