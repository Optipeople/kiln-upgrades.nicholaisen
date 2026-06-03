import Link from "next/link";
import { Container } from "@/components/Container";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-paper-dark)] bg-[var(--color-paper)]">
      <Container size="default">
        <div className="grid gap-8 py-12 sm:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="text-eyebrow text-[var(--color-tan-500)]">{site.legalName}</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--color-ink-500)]">
              {site.description}
            </p>
            <p className="mt-4 text-xs text-[var(--color-slate-500)]">
              CVR · DK-12345678 &nbsp;·&nbsp; Industrivej 1, 8700 Horsens, Denmark
            </p>
          </div>

          <div>
            <p className="text-eyebrow text-[var(--color-slate-500)]">Tools</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-[var(--color-ink-700)] transition-colors hover:text-[var(--color-tan-500)]"
                >
                  Kiln Upgrades ROI
                </Link>
              </li>
              <li>
                <a
                  href="https://6-sided-machining-center.nichomachines.com/"
                  className="text-[var(--color-ink-700)] transition-colors hover:text-[var(--color-tan-500)]"
                >
                  6-Side Machining ROI
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-eyebrow text-[var(--color-slate-500)]">Company</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="https://nicholaisen.dk/"
                  className="text-[var(--color-ink-700)] transition-colors hover:text-[var(--color-tan-500)]"
                >
                  nicholaisen.dk
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="text-[var(--color-ink-700)] transition-colors hover:text-[var(--color-tan-500)]"
                >
                  {site.email}
                </a>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-[var(--color-ink-700)] transition-colors hover:text-[var(--color-tan-500)]"
                >
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--color-paper-dark)] py-6 text-xs text-[var(--color-slate-500)]">
          © {new Date().getFullYear()} {site.legalName}. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
