import Link from "next/link";
import { Container } from "@/components/Container";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-paper-dark)] bg-[var(--color-paper)]">
      <Container size="default">
        <div className="grid gap-8 py-12 sm:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="text-eyebrow text-[var(--color-tan-500)]">Information</p>
            <address className="mt-3 text-sm not-italic leading-relaxed text-[var(--color-ink-500)]">
              {site.legalName}<br />
              Sønderskovvej 17<br />
              8362 Hørning<br />
              CVR: 19454770
            </address>
          </div>

          <div>
            <p className="text-eyebrow text-[var(--color-slate-500)]">Kontakt</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="tel:+4586924711"
                  className="text-[var(--color-ink-700)] transition-colors hover:text-[var(--color-tan-500)]"
                >
                  T +45 8692 4711
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
