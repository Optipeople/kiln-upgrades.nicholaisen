"use client";

import { useState } from "react";

const QUESTIONS = [
  {
    q: "1. How old is your kiln control system?",
    opts: [
      { label: "Before 2010", pts: 5 },
      { label: "2010–2017", pts: 12 },
      { label: "2018 or newer", pts: 18 },
    ],
  },
  {
    q: "2. Do your fans run at variable speed (inverters installed)?",
    opts: [
      { label: "No, fixed speed", pts: 3 },
      { label: "Some kilns", pts: 10 },
      { label: "Yes, all kilns", pts: 20 },
    ],
  },
  {
    q: "3. Does your system use Stop & Go or intelligent drying cycle management?",
    opts: [
      { label: "No, standard cycles", pts: 2 },
      { label: "Not sure", pts: 8 },
      { label: "Yes, running Stop & Go", pts: 20 },
    ],
  },
  {
    q: "4. Do you have heat recovery on your kiln exhaust?",
    opts: [
      { label: "No heat recovery", pts: 3 },
      { label: "Basic extraction only", pts: 8 },
      { label: "Full heat recovery system", pts: 20 },
    ],
  },
  {
    q: "5. Can you monitor your kiln energy consumption in real time?",
    opts: [
      { label: "No monitoring", pts: 2 },
      { label: "Monthly readings only", pts: 7 },
      { label: "Live dashboard / cloud platform", pts: 15 },
    ],
  },
] as const;

const MAX_POSSIBLE = 93;

function scoreColor(score: number): string {
  if (score < 40) return "#8B1A0A";
  if (score < 65) return "var(--color-tan-500)";
  return "#166534";
}

export function KilnHealthScore() {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  function handleAnswer(qi: number, pts: number) {
    setAnswers((prev) => ({ ...prev, [qi]: pts }));
  }

  const totalPts = Object.values(answers).reduce((a, b) => a + b, 0);
  const score = Math.round((totalPts / MAX_POSSIBLE) * 100);
  const answered = Object.keys(answers).length;
  const gap = MAX_POSSIBLE - totalPts;
  const savingsRounded = Math.round((gap * 420) / 500) * 500;
  const color = scoreColor(score);
  const blocks = Array.from({ length: 10 }, (_, i) => i < Math.round(score / 10));

  const revealText =
    score < 40
      ? "Your kilns are running significantly below modern efficiency standards. A full upgrade package would likely pay back within 12 months — structured so savings begin covering the cost from month one."
      : score < 65
        ? "Your kilns have a solid foundation but are missing key efficiency upgrades. A targeted intervention on control software and fans delivers strong savings with minimal disruption."
        : "Your kilns are already performing well. The next level is cloud-connected optimisation — AI-assisted drying recipes and spot energy price scheduling could add another 10–15% on top of what you already save.";

  return (
    <div className="bg-white border p-6" style={{ borderColor: "var(--color-paper-dark)" }}>
      {/* Score header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3
            className="font-bold text-lg uppercase tracking-wide"
            style={{ color: "var(--color-ink-900)", fontFamily: "var(--font-display)" }}
          >
            Kiln Health Score
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-ink-500)" }}>
            Answer 5 questions to reveal your savings
          </p>
        </div>
        <div className="text-right">
          <div
            className="font-bold leading-none transition-all duration-300"
            style={{
              fontSize: 48,
              color: answered > 0 ? color : "var(--color-ink-900)",
              fontFamily: "var(--font-display)",
            }}
          >
            {score}
          </div>
          <div className="text-xs" style={{ color: "var(--color-ink-300)" }}>
            /100
          </div>
        </div>
      </div>

      {/* Score meter */}
      <div className="flex gap-1 mb-6">
        {blocks.map((filled, i) => (
          <div
            key={i}
            className="flex-1 h-7 border transition-all duration-300"
            style={{
              background: filled ? color : "var(--color-cream-50)",
              borderColor: filled ? "transparent" : "var(--color-paper-dark)",
            }}
          />
        ))}
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {QUESTIONS.map((q, qi) => (
          <div
            key={qi}
            className="p-4"
            style={{
              background: "var(--color-cream-50)",
              borderLeft: `3px solid ${answers[qi] !== undefined ? "var(--color-ink-900)" : "var(--color-paper-dark)"}`,
            }}
          >
            <p className="text-sm font-medium mb-2.5" style={{ color: "var(--color-ink-900)" }}>
              {q.q}
            </p>
            <div className="flex gap-2 flex-wrap">
              {q.opts.map((opt) => {
                const selected = answers[qi] === opt.pts;
                return (
                  <button
                    key={opt.label}
                    onClick={() => handleAnswer(qi, opt.pts)}
                    className="px-3 py-1.5 text-xs border font-medium cursor-pointer transition-all"
                    style={{
                      background: selected ? "var(--color-ink-900)" : "white",
                      color: selected ? "white" : "var(--color-ink-700)",
                      borderColor: selected ? "var(--color-ink-900)" : "var(--color-paper-dark)",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Savings reveal */}
      {answered >= 5 && (
        <div
          className="mt-5 p-7 text-center"
          style={{
            background: "var(--color-ink-900)",
            borderTop: "3px solid var(--color-tan-500)",
            animation: "fadeUp 0.4s ease",
          }}
        >
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }} className="mb-1">
            Your estimated annual savings potential
          </p>
          <span
            className="font-bold block leading-none"
            style={{ fontSize: 60, color: "var(--color-tan-500)", fontFamily: "var(--font-display)" }}
          >
            €{savingsRounded.toLocaleString("en")}+/year
          </span>
          <p className="mt-1" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            per year — covered entirely by the upgrade
          </p>
          <p
            className="mt-4 pt-4 text-sm leading-relaxed text-left"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.8)",
            }}
          >
            {revealText}
          </p>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
