"use client";

import { useState, useMemo } from "react";

interface CalcState {
  kilns: number;
  fanPow: number;
  hours: number;
  price: number;
  age: 1 | 2 | 3;
  hasInv: boolean;
  m3: number;
  priceM3: number;
  wasteRate: number;
}

function calcResults(s: CalcState) {
  const baseCost = s.kilns * s.fanPow * s.hours * s.price;
  const sgPct = s.age === 1 ? 0.38 : s.age === 2 ? 0.3 : 0.18;
  const sgSavings = baseCost * sgPct;
  const invPct = s.hasInv ? 0 : 0.22;
  const invSavings = baseCost * (1 - sgPct) * invPct;
  const heatSavings = baseCost * 0.06;
  const wasteSavings = s.m3 * s.priceM3 * (s.wasteRate / 100) * 0.6;
  const downstreamSavings = s.m3 * s.priceM3 * 0.015;
  const total = sgSavings + invSavings + heatSavings + wasteSavings + downstreamSavings;
  const invest = total < 15000 ? total * 0.7 : total < 30000 ? total * 0.75 : total * 0.8;
  const paybackMonths = total > 0 ? Math.round((invest / total) * 12) : 0;
  const paybackPct = Math.min(100, Math.round((paybackMonths / 24) * 100));
  return { baseCost, sgSavings, sgPct, invSavings, heatSavings, wasteSavings, downstreamSavings, total, invest, paybackMonths, paybackPct };
}

function fmt(v: number) {
  return "€" + Math.round(v).toLocaleString("en");
}

function SliderField({
  label, value, display, min, max, step, onChange, hints,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hints?: string[];
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1">
        <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-ink-500)" }}>
          {label}
        </label>
        <span className="text-sm font-bold" style={{ color: "var(--color-tan-500)" }}>
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        style={{ accentColor: "var(--color-tan-500)" }}
      />
      {hints && (
        <div className="flex justify-between mt-0.5" style={{ fontSize: 10, color: "var(--color-ink-300)" }}>
          {hints.map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex justify-between items-center py-2 text-sm"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
    >
      <span style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

export function SavingsCalculator() {
  const [s, setS] = useState<CalcState>({
    kilns: 2,
    fanPow: 24,
    hours: 6500,
    price: 0.14,
    age: 1,
    hasInv: false,
    m3: 3000,
    priceM3: 180,
    wasteRate: 4,
  });

  const r = useMemo(() => calcResults(s), [s]);

  function set<K extends keyof CalcState>(k: K, v: CalcState[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }

  const ageLabels: Record<1 | 2 | 3, string> = {
    1: "Pre-2010",
    2: "2010–2015",
    3: "2015–2020",
  };

  const barAfterPct = r.baseCost > 0 ? Math.max(5, Math.round(((r.baseCost - r.total) / r.baseCost) * 100)) : 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* ── Inputs ── */}
      <div className="bg-white border p-6" style={{ borderColor: "var(--color-paper-dark)" }}>
        <h3
          className="font-bold text-base uppercase tracking-wide mb-5 pb-3"
          style={{
            color: "var(--color-ink-900)",
            borderBottom: "2px solid var(--color-ink-900)",
            fontFamily: "var(--font-display)",
          }}
        >
          Kiln profile
        </h3>

        <SliderField
          label="Number of kilns"
          value={s.kilns}
          display={String(s.kilns)}
          min={1}
          max={8}
          step={1}
          onChange={(v) => set("kilns", v)}
        />
        <SliderField
          label="Fan power per kiln"
          value={s.fanPow}
          display={`${s.fanPow} kW`}
          min={8}
          max={60}
          step={2}
          onChange={(v) => set("fanPow", v)}
        />
        <SliderField
          label="Annual operating hours per kiln"
          value={s.hours}
          display={s.hours.toLocaleString("en")}
          min={2000}
          max={8200}
          step={100}
          onChange={(v) => set("hours", v)}
        />
        <SliderField
          label="Electricity price (€/kWh)"
          value={s.price}
          display={`€${s.price.toFixed(2)}`}
          min={0.08}
          max={0.28}
          step={0.01}
          onChange={(v) => set("price", v)}
        />
        <SliderField
          label="Control system vintage"
          value={s.age}
          display={ageLabels[s.age]}
          min={1}
          max={3}
          step={1}
          onChange={(v) => set("age", v as 1 | 2 | 3)}
          hints={["Pre-2010", "2010–2015", "2015–2020"]}
        />
        <SliderField
          label="Inverters installed?"
          value={s.hasInv ? 1 : 0}
          display={s.hasInv ? "Yes" : "No"}
          min={0}
          max={1}
          step={1}
          onChange={(v) => set("hasInv", v === 1)}
          hints={["No", "Yes"]}
        />

        <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--color-paper-dark)" }}>
          <p
            className="mb-4"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-ink-900)",
            }}
          >
            Quality savings inputs
          </p>
          <SliderField
            label="Annual throughput (m³ dried)"
            value={s.m3}
            display={`${s.m3.toLocaleString("en")} m³`}
            min={500}
            max={20000}
            step={250}
            onChange={(v) => set("m3", v)}
          />
          <SliderField
            label="Average timber value (€/m³)"
            value={s.priceM3}
            display={`€${s.priceM3}`}
            min={60}
            max={500}
            step={10}
            onChange={(v) => set("priceM3", v)}
          />
          <SliderField
            label="Current crack / waste rate"
            value={s.wasteRate}
            display={`${s.wasteRate}%`}
            min={1}
            max={10}
            step={0.5}
            onChange={(v) => set("wasteRate", v)}
            hints={["1% good", "5% typical", "10% poor"]}
          />
        </div>
      </div>

      {/* ── Results ── */}
      <div className="p-6 text-white" style={{ background: "var(--color-ink-900)" }}>
        <h3
          className="font-bold text-base uppercase tracking-wide mb-4 pb-3"
          style={{
            color: "var(--color-tan-500)",
            borderBottom: "1px solid rgba(255,255,255,0.15)",
            fontFamily: "var(--font-display)",
          }}
        >
          Savings potential
        </h3>

        <ResultRow label="Current annual energy cost" value={fmt(r.baseCost)} />
        <ResultRow label="Stop & Go software savings" value={`${fmt(r.sgSavings)} (${Math.round(r.sgPct * 100)}%)`} />
        <ResultRow
          label="Inverter upgrade savings"
          value={s.hasInv ? "Already installed" : `${fmt(r.invSavings)} (22%)`}
        />
        <ResultRow label="Heat recovery benefit" value={`${fmt(r.heatSavings)} (6%)`} />

        <p
          className="pt-3 pb-1"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-tan-500)" }}
        >
          Quality savings
        </p>
        <ResultRow
          label="Waste reduction (cracks / rejects)"
          value={`${fmt(r.wasteSavings)} (${Math.round(0.6 * s.wasteRate * 10) / 10}% waste)`}
        />
        <ResultRow label="Downstream efficiency gain" value={`${fmt(r.downstreamSavings)} (1.5% yield gain)`} />

        {/* Total */}
        <div
          className="flex justify-between items-center py-3 mt-1"
          style={{ borderTop: "1px solid rgba(255,255,255,0.2)" }}
        >
          <span className="text-sm font-semibold text-white">Total annual savings</span>
          <span className="font-bold text-2xl" style={{ color: "var(--color-tan-500)", fontFamily: "var(--font-display)" }}>
            {fmt(r.total)}
          </span>
        </div>

        <ResultRow label="Estimated upgrade investment" value={fmt(r.invest)} />
        <ResultRow label="Monthly savings from day 1" value={`${fmt(r.total / 12)}/month`} />

        {/* Payback bar */}
        <div className="mt-4">
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }} className="mb-1.5">
            Payback period:{" "}
            <strong className="text-white">{r.paybackMonths} months</strong>
          </p>
          <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${r.paybackPct}%`, background: "var(--color-tan-500)" }}
            />
          </div>
        </div>

        {/* Simple bar chart */}
        {r.baseCost > 0 && (
          <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }} className="mb-3">
              Annual energy cost comparison
            </p>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between mb-1" style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                  <span>Before upgrade</span>
                  <span>{fmt(r.baseCost)}</span>
                </div>
                <div className="h-6 w-full" style={{ background: "var(--color-tan-500)" }} />
              </div>
              <div>
                <div className="flex justify-between mb-1" style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                  <span>After upgrade</span>
                  <span>{fmt(Math.max(0, r.baseCost - r.total))}</span>
                </div>
                <div
                  className="h-6 border transition-all duration-500"
                  style={{
                    width: `${barAfterPct}%`,
                    background: "#1e3a52",
                    borderColor: "rgba(255,255,255,0.15)",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Data note */}
        <p
          className="mt-4 leading-relaxed pl-3"
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            borderLeft: "2px solid var(--color-tan-500)",
          }}
        >
          <strong style={{ color: "rgba(255,255,255,0.7)" }}>Data basis:</strong> Stop &amp; Go: 30–40% electrical
          savings documented. Inverter: 22% fan energy reduction. Quality: 60% waste reduction from stress
          elimination. Downstream: 1.5% yield gain. Calibrated against monitored Baltic production kilns.
        </p>
      </div>
    </div>
  );
}
