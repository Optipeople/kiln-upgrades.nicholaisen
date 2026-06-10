"use client";

import { useState } from "react";
import { SavingsCalculator } from "./SavingsCalculator";
import { KilnHealthScore } from "./KilnHealthScore";
import { Packages } from "./Packages";

const TABS = [
  {
    id: "calculator" as const,
    label: "Savings Calculator",
    tag: "Savings Calculator",
    heading: "What is your kiln wasting right now?",
    subheading:
      "Dial in your operation. The result is your specific savings potential — energy and quality combined.",
  },
  {
    id: "health-score" as const,
    label: "Kiln Health Score",
    tag: "Kiln Health Score",
    heading: "How efficient is your kiln today?",
    subheading: "Five questions. Two minutes. Your specific savings potential revealed at the end.",
  },
  {
    id: "packages" as const,
    label: "Upgrade Packages",
    tag: "Upgrade Packages",
    heading: "Three levels. Every customer has a home.",
    subheading:
      "Always present all three simultaneously. The customer's choice reveals their ambition.",
  },
];

type TabId = (typeof TABS)[number]["id"];

export function QualifyTabs() {
  const [active, setActive] = useState<TabId>("calculator");
  const current = TABS.find((t) => t.id === active)!;

  return (
    <div>
      {/* Tab bar */}
      <div
        className="flex overflow-x-auto mb-8"
        style={{ borderBottom: "1px solid var(--color-paper-dark)" }}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className="px-5 py-3 text-sm font-semibold uppercase tracking-wide whitespace-nowrap transition-all cursor-pointer"
              style={{
                color: isActive ? "var(--color-ink-900)" : "var(--color-ink-300)",
                borderBottom: isActive ? "2px solid var(--color-tan-500)" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Section header */}
      <div className="mb-6">
        <span
          className="inline-block mb-2 text-white px-2 py-1"
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            background: "var(--color-ink-900)",
          }}
        >
          {current.tag}
        </span>
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--color-ink-900)" }}
        >
          {current.heading}
        </h2>
        <p className="text-sm mt-1 max-w-xl" style={{ color: "var(--color-ink-500)" }}>
          {current.subheading}
        </p>
      </div>

      {/* Tab content */}
      {active === "calculator" && <SavingsCalculator />}
      {active === "health-score" && <KilnHealthScore />}
      {active === "packages" && <Packages />}
    </div>
  );
}
