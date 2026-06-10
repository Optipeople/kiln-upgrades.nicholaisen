const PACKAGES = [
  {
    name: "Start Smart",
    tagline: "Older control software · fastest payback",
    savings: "€8K–€18K",
    badge: null,
    items: [
      "iDry control system upgrade",
      "Stop & Go software activation",
      "Wireless moisture probe set",
      "Remote monitoring access",
      "OptiCloud platform onboarding",
      "Operator training session",
    ],
    investment: "€6K–€12K",
    payback: "8–14 months",
    featured: false,
  },
  {
    name: "Upgrade Complete",
    tagline: "Full mechanical + software modernisation",
    savings: "€18K–€35K",
    badge: "Most chosen",
    items: [
      "Everything in Start Smart",
      "Inverter installation (all fans)",
      "Tubed fan conversion",
      "Heat recovery system",
      "Annual service contract Year 1",
      "Energy consumption dashboard",
    ],
    investment: "€18K–€28K",
    payback: "10–18 months",
    featured: true,
  },
  {
    name: "Future Ready",
    tagline: "Cloud-connected, AI-ready operation",
    savings: "€30K–€55K",
    badge: null,
    items: [
      "Everything in Upgrade Complete",
      "Multi-kiln cloud fleet management",
      "Spot energy price optimisation",
      "AI drying recipe development",
      "Operator mobile app access",
      "3-year service agreement",
    ],
    investment: "€30K–€45K",
    payback: "12–18 months",
    featured: false,
  },
] as const;

export function Packages() {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.name}
            className="bg-white relative overflow-hidden flex flex-col"
            style={{
              border: pkg.featured
                ? "2px solid var(--color-ink-900)"
                : "1px solid var(--color-paper-dark)",
            }}
          >
            {pkg.badge && (
              <div
                className="absolute top-0 right-0 text-white font-bold uppercase"
                style={{
                  background: "var(--color-tan-500)",
                  fontSize: 10,
                  padding: "3px 10px",
                  letterSpacing: "0.05em",
                }}
              >
                {pkg.badge}
              </div>
            )}

            {/* Head */}
            <div className="px-5 py-4" style={{ background: "var(--color-ink-900)" }}>
              <div
                className="font-bold text-lg uppercase tracking-wide text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {pkg.name}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                {pkg.tagline}
              </div>
            </div>

            {/* Savings */}
            <div
              className="px-5 py-3 text-center"
              style={{
                background: "var(--color-cream-50)",
                borderBottom: "1px solid var(--color-paper-dark)",
              }}
            >
              <span
                className="font-bold block leading-none"
                style={{
                  fontSize: 28,
                  color: "var(--color-ink-900)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {pkg.savings}
              </span>
              <span className="block mt-1" style={{ fontSize: 11, color: "var(--color-ink-300)" }}>
                estimated annual savings
              </span>
            </div>

            {/* Feature list */}
            <div className="px-5 py-4 flex-1">
              <ul className="space-y-0">
                {pkg.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 py-1.5 text-sm"
                    style={{
                      borderBottom: "1px solid var(--color-paper-dark)",
                      color: "var(--color-ink-500)",
                    }}
                  >
                    <span
                      className="font-bold shrink-0 mt-0.5"
                      style={{ color: "var(--color-tan-500)" }}
                    >
                      —
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Payback footer */}
            <div
              className="px-5 py-2.5 text-xs"
              style={{ background: "var(--color-ink-900)", color: "rgba(255,255,255,0.5)" }}
            >
              Investment:{" "}
              <strong style={{ color: "rgba(255,255,255,0.9)" }}>{pkg.investment}</strong> · Payback:{" "}
              <strong style={{ color: "rgba(255,255,255,0.9)" }}>{pkg.payback}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Framing note */}
      <div
        className="mt-5 px-5 py-4"
        style={{
          background: "var(--color-cream-50)",
          borderLeft: "3px solid var(--color-ink-500)",
        }}
      >
        <p
          className="mb-1"
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--color-ink-900)",
          }}
        >
          Framing note
        </p>
        <p className="text-sm" style={{ color: "var(--color-ink-500)" }}>
          Lead with the savings figure from the calculator. Then say: &ldquo;We have three ways to capture
          those savings.&rdquo; Let the customer point. Their choice tells you everything about budget and
          ambition without you having to ask.
        </p>
      </div>
    </div>
  );
}
