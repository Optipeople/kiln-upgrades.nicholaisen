"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type FormEvent,
  type ReactNode,
  type Ref,
} from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

// ── Step ──────────────────────────────────────────────────────────────────────
// 0–5: wizard   6: contact   7: thank you
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

// ── Countries ─────────────────────────────────────────────────────────────────
type CountryKey = "dk" | "se" | "no" | "fi" | "ee" | "lv" | "lt" | "pl" | "de";

interface Country {
  name: string;
  currency: string;
  sym: string;
  fxRate: number;
  fxLabel: string;
  elecPrice: number;  // local currency / kWh
  woodPrice: number;  // wood chips (flis) local currency / kWh
  oilPrice: number;   // heating oil local currency / kWh
  gasPrice: number;   // natural gas local currency / kWh
}

// Prices in local currency / kWh.  Wood ≈ 0.35 DKK eq · Oil ≈ 0.85 DKK eq · Gas as before.
const COUNTRIES: Record<CountryKey, Country> = {
  dk: { name: "Denmark",   currency: "DKK", sym: "DKK ", fxRate: 1,     fxLabel: "base currency",     elecPrice: 1.40, woodPrice: 0.35, oilPrice: 0.85, gasPrice: 0.65 },
  se: { name: "Sweden",    currency: "SEK", sym: "SEK ", fxRate: 1.44,  fxLabel: "1 DKK = 1.44 SEK",  elecPrice: 1.20, woodPrice: 0.50, oilPrice: 1.22, gasPrice: 0.55 },
  no: { name: "Norway",    currency: "NOK", sym: "NOK ", fxRate: 1.50,  fxLabel: "1 DKK = 1.50 NOK",  elecPrice: 0.80, woodPrice: 0.53, oilPrice: 1.28, gasPrice: 0.50 },
  fi: { name: "Finland",   currency: "EUR", sym: "€",    fxRate: 0.134, fxLabel: "1 DKK = 0.134 EUR", elecPrice: 0.13, woodPrice: 0.047, oilPrice: 0.114, gasPrice: 0.08 },
  ee: { name: "Estonia",   currency: "EUR", sym: "€",    fxRate: 0.134, fxLabel: "1 DKK = 0.134 EUR", elecPrice: 0.14, woodPrice: 0.040, oilPrice: 0.114, gasPrice: 0.09 },
  lv: { name: "Latvia",    currency: "EUR", sym: "€",    fxRate: 0.134, fxLabel: "1 DKK = 0.134 EUR", elecPrice: 0.15, woodPrice: 0.038, oilPrice: 0.114, gasPrice: 0.08 },
  lt: { name: "Lithuania", currency: "EUR", sym: "€",    fxRate: 0.134, fxLabel: "1 DKK = 0.134 EUR", elecPrice: 0.13, woodPrice: 0.038, oilPrice: 0.114, gasPrice: 0.08 },
  pl: { name: "Poland",    currency: "PLN", sym: "PLN ", fxRate: 0.524, fxLabel: "1 DKK = 0.524 PLN", elecPrice: 0.72, woodPrice: 0.18,  oilPrice: 0.45,  gasPrice: 0.35 },
  de: { name: "Germany",   currency: "EUR", sym: "€",    fxRate: 0.134, fxLabel: "1 DKK = 0.134 EUR", elecPrice: 0.20, woodPrice: 0.047, oilPrice: 0.114, gasPrice: 0.12 },
};

// ── Emission factors ──────────────────────────────────────────────────────────
interface EmissionFactors {
  electricity: number;  // grid gCO₂eq/kWh (country-specific)
  heatpump: number;     // electricity / COP 3.2
}

const EMISSION_FACTORS: Record<CountryKey, EmissionFactors> = {
  dk: { electricity: 172, heatpump: 54  },
  se: { electricity:  13, heatpump:  4  },
  no: { electricity:  26, heatpump:  8  },
  fi: { electricity:  98, heatpump: 31  },
  ee: { electricity: 390, heatpump: 122 },
  lv: { electricity: 125, heatpump: 39  },
  lt: { electricity: 185, heatpump: 58  },
  pl: { electricity: 705, heatpump: 220 },
  de: { electricity: 385, heatpump: 120 },
};

/** Combustion emission factors — fixed, not country-specific (gCO₂eq/kWh) */
const FUEL_EMISSIONS = {
  wood:  30,   // biogenic wood chips / flis
  oil:  265,   // heating oil
  gas:  205,   // natural gas
} as const;

// ── Products ──────────────────────────────────────────────────────────────────
type ProductKey = "lumber" | "flooring" | "furniture" | "pallets";

const PRODUCTS: { key: ProductKey; label: string; sub: string }[] = [
  { key: "lumber",    label: "Sawn lumber",          sub: "Boards, planks, beams"   },
  { key: "flooring",  label: "Flooring / panels",    sub: "Parquet, engineered"     },
  { key: "furniture", label: "Furniture components", sub: "Solid wood blanks"       },
  { key: "pallets",   label: "Pallets / packaging",  sub: "ISPM 15 treatment"       },
];

// ── Age labels ────────────────────────────────────────────────────────────────
const KILN_AGE_LABELS: Record<1 | 2 | 3, string> = {
  1: "Legacy (built before 2000)",
  2: "Standard (2000–2015)",
  3: "Modern (post-2015)",
};

const CTRL_AGE_LABELS: Record<1 | 2 | 3, string> = {
  1: "Legacy (pre-2015)",
  2: "Mid-gen (2015–2020)",
  3: "Modern (post-2020)",
};
const CTRL_AGE_DESCS: Record<1 | 2 | 3, string> = {
  1: "Pre-2015 system — full upgrade scope. Stop & Go, wireless probes and inverters not yet available.",
  2: "Partial upgrade scope — inverters and wireless probes deliver the strongest gains.",
  3: "Recent system — cloud and AI optimisation unlock the next savings layer.",
};

// ── Heat source ───────────────────────────────────────────────────────────────
type HeatSource = "wood" | "oil" | "gas" | "electric" | "heatpump";

const HEAT_OPTS: { value: HeatSource; label: string; sub: string }[] = [
  { value: "wood",     label: "Wood chips boiler (flis / biomass)", sub: "Low fuel cost · biogenic carbon"   },
  { value: "oil",      label: "Oil boiler",                         sub: "High fuel cost · high emissions"  },
  { value: "gas",      label: "Gas boiler",                         sub: "Medium fuel cost · lower emissions" },
  { value: "electric", label: "Electric heating",                   sub: "Electricity savings dominant"     },
  { value: "heatpump", label: "Heat pump",                          sub: "Combined savings · COP 3.2"       },
];

// ── Savings + CO₂ calculation ─────────────────────────────────────────────────
function calcSavings(s: {
  country: CountryKey; kilns: number; m3: number; fanpow: number; hours: number;
  inv: boolean; heat: HeatSource; age: 1 | 2 | 3;
  kilnAge: 1 | 2 | 3; heatRecov: boolean; tunnelFan: boolean;
  stopAndGo: boolean; remoteCtrl: boolean;
  materialValueDkk: number; wastePercent: number; cycles: number; cycleHours: number;
}) {
  const co = COUNTRIES[s.country];
  const ef = EMISSION_FACTORS[s.country];

  const annualFanEnergy = s.kilns * s.fanpow * s.hours;
  const elecSavePct     = s.inv ? 0.22 : s.tunnelFan ? 0.32 : 0.38;
  const elecSavingDKK   = annualFanEnergy * elecSavePct * (co.elecPrice / co.fxRate);

  // Fuel price in DKK/kWh.
  // Heat pump: thermal output = COP × electrical input, so cost per kWh thermal = elecPrice / COP.
  const fuelPriceDkk =
    s.heat === "wood"     ? co.woodPrice / co.fxRate :
    s.heat === "oil"      ? co.oilPrice  / co.fxRate :
    s.heat === "gas"      ? co.gasPrice  / co.fxRate :
    s.heat === "heatpump" ? (co.elecPrice / co.fxRate) / 3.2 :
    s.heat === "electric" ? co.elecPrice / co.fxRate : 0;

  // Annual thermal load: kilns × cycles × capacity × 280 kWh/m³ per cycle
  const annualThermalKwh = s.kilns * s.cycles * s.m3 * 280;
  const isCombustion     = s.heat === "wood" || s.heat === "oil" || s.heat === "gas";
  const heatSavePct      =
    isCombustion          ? (s.heatRecov ? 0.15 : 0.22) :
    s.heat === "heatpump" ? (s.heatRecov ? 0.10 : 0.16) :
    s.heat === "electric" ? (s.heatRecov ? 0.12 : 0.18) : 0;
  const thermSavingDKK   = annualThermalKwh * heatSavePct * fuelPriceDkk;

  const totalDKK = elecSavingDKK + thermSavingDKK;

  // Health score — normalised: worst possible configuration = 0%, best = 100%
  const kilnAgeScore  = [15, 50, 80][s.kilnAge - 1]!;
  const ctrlAgeScore  = [15, 50, 80][s.age     - 1]!;
  const invScore      = s.inv        ? 75 : 15;
  const heatScore     = s.heatRecov  ? 75 : 25;
  const tunnelScore   = s.tunnelFan  ? 75 : 25;
  const stopGoScore   = s.stopAndGo  ? 75 : 25;
  const remoteScore   = s.remoteCtrl ? 75 : 25;
  const rawHealthScore = (kilnAgeScore + ctrlAgeScore + invScore + heatScore + tunnelScore + stopGoScore + remoteScore) / 7;
  const HEALTH_RAW_MAX = (80 + 80 + 75 + 75 + 75 + 75 + 75) / 7; // ≈ 76.4 — best achievable average
  const health = Math.min(100, Math.max(0, Math.round((rawHealthScore / HEALTH_RAW_MAX) * 100)));

  const elecSavedKwh   = annualFanEnergy * elecSavePct;
  const currentFanCO2t = (annualFanEnergy * ef.electricity) / 1_000_000;
  const savedFanCO2t   = (elecSavedKwh   * ef.electricity) / 1_000_000;

  const heatEmFactor =
    s.heat === "wood"     ? FUEL_EMISSIONS.wood :
    s.heat === "oil"      ? FUEL_EMISSIONS.oil  :
    s.heat === "gas"      ? FUEL_EMISSIONS.gas  :
    s.heat === "heatpump" ? ef.heatpump         : ef.electricity;
  const currentHeatCO2t = (annualThermalKwh * heatEmFactor) / 1_000_000;
  const savedHeatCO2t   = currentHeatCO2t * heatSavePct;

  // Quality savings — capped by current waste rate; zero if Stop & Go already fitted
  const annualThroughputM3 = s.kilns * s.cycles * s.m3;
  const qualityGainLoPct   = s.stopAndGo ? 0 : Math.min(0.02, s.wastePercent / 100);
  const qualityGainHiPct   = s.stopAndGo ? 0 : Math.min(0.05, s.wastePercent / 100);
  const qualitySavingLoDkk = annualThroughputM3 * s.materialValueDkk * qualityGainLoPct;
  const qualitySavingHiDkk = annualThroughputM3 * s.materialValueDkk * qualityGainHiPct;

  // Cost per drying cycle per kiln
  const elecPriceDkk         = co.elecPrice / co.fxRate;
  const cycleElecCostDkk     = s.fanpow * s.cycleHours * elecPriceDkk;
  const cycleThermalCostDkk  = fuelPriceDkk > 0 ? s.m3 * 280 * fuelPriceDkk : 0;
  const costPerCycleDkk      = cycleElecCostDkk + cycleThermalCostDkk;
  const costPerCycleAfterDkk =
    cycleElecCostDkk * (1 - elecSavePct) +
    cycleThermalCostDkk * (1 - heatSavePct);
  const savingPerCycleDkk    = costPerCycleDkk - costPerCycleAfterDkk;

  return {
    totalDKK, elecSavePct, health, fuelPriceDkk, heatSavePct, isCombustion,
    savedFanCO2t, savedHeatCO2t, currentFanCO2t, heatEmFactor,
    totalSavedCO2t: savedFanCO2t + savedHeatCO2t,
    qualitySavingLoDkk, qualitySavingHiDkk, annualThroughputM3,
    costPerCycleDkk, costPerCycleAfterDkk, savingPerCycleDkk,
    cycleElecCostDkk, cycleThermalCostDkk,
  };
}

function fmtLocal(dkk: number, co: Country): string {
  const v = Math.round(dkk * co.fxRate);
  if (v >= 1_000_000) return co.sym + (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000)     return co.sym + Math.round(v / 1000) + "K";
  return co.sym + v;
}

function calcPackages(totalDKK: number, kilns: number) {
  return [
    {
      name: "Start Smart", tag: "Control + sensors",
      saveLo: totalDKK * 0.45, saveHi: totalDKK * 0.65,
      invLo: kilns * 28000, invHi: kilns * 45000, featured: false,
      items: ["iDry control system upgrade", "Stop & Go software activation",
              "Wireless moisture probes", "Remote monitoring & app access",
              "OptiCloud platform onboarding", "Operator training session"],
    },
    {
      name: "Upgrade Complete", tag: "Mechanical + software",
      saveLo: totalDKK * 0.70, saveHi: totalDKK * 0.95,
      invLo: kilns * 65000, invHi: kilns * 96000, featured: true,
      items: ["Everything in Start Smart", "Inverter drives on all fans",
              "Tubed fan conversion", "Heat recovery system",
              "Service contract year 1", "Energy consumption dashboard"],
    },
    {
      name: "Future Ready", tag: "Cloud-connected + AI",
      saveLo: totalDKK * 0.95, saveHi: totalDKK * 1.35,
      invLo: kilns * 96000, invHi: kilns * 120000, featured: false,
      items: ["Everything in Upgrade Complete", "Multi-kiln cloud fleet management",
              "Spot energy price optimisation", "AI-assisted drying recipes",
              "Operator mobile app", "3-year service agreement"],
    },
  ] as const;
}

type Contact = { name: string; email: string; job: string; company: string };
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// ─────────────────────────────────────────────────────────────────────────────
export function KilnUpgradesRoiCalculator() {
  const [step, setStep] = useState<Step>(0);

  const [country,    setCountry]    = useState<CountryKey>("dk");
  const [product,    setProduct]    = useState<ProductKey | null>(null);
  const [kilns,      setKilns]      = useState(3);
  const [m3,         setM3]         = useState(60);
  const [cycles,     setCycles]     = useState(20);
  const [cycleHours, setCycleHours] = useState(240);
  const [fanpow,     setFanpow]     = useState(45);
  const [heat,       setHeat]       = useState<HeatSource>("wood");
  const [kilnAge,    setKilnAge]    = useState<1 | 2 | 3>(1);
  const [age,        setAge]        = useState<1 | 2 | 3>(1);
  const [inv,        setInv]        = useState(false);
  const [heatRecov,    setHeatRecov]    = useState(false);
  const [tunnelFan,    setTunnelFan]    = useState(false);
  const [stopAndGo,    setStopAndGo]    = useState(false);
  const [remoteCtrl,      setRemoteCtrl]      = useState(false);
  const [materialValueDkk,setMaterialValueDkk] = useState(2500); // DKK/m³
  const [wastePercent,    setWastePercent]     = useState(8);    // %
  const [selectedPkg,setSelectedPkg]= useState<string | null>(null);

  const [contact,    setContact]    = useState<Contact>({ name: "", email: "", job: "", company: "" });
  const [website,    setWebsite]    = useState("");
  const [errors,     setErrors]     = useState<Partial<Record<keyof Contact, boolean>>>({});
  const [formError,  setFormError]  = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const topRef     = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const co    = COUNTRIES[country];
  const ef    = EMISSION_FACTORS[country];
  const hours = Math.min(cycles * cycleHours, 8760);

  const goTo = useCallback((next: Step) => {
    setStep(next);
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      headingRef.current?.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => { if (step !== 6) setFormError(null); }, [step]);

  const savings  = useMemo(
    () => calcSavings({ country, kilns, m3, fanpow, hours, inv, heat, age, kilnAge, heatRecov, tunnelFan, stopAndGo, remoteCtrl, materialValueDkk, wastePercent, cycles, cycleHours }),
    [country, kilns, m3, fanpow, hours, inv, heat, age, kilnAge, heatRecov, tunnelFan, stopAndGo, remoteCtrl, materialValueDkk, wastePercent, cycles, cycleHours],
  );
  const packages = useMemo(() => calcPackages(savings.totalDKK, kilns), [savings.totalDKK, kilns]);

  const firstName = (contact.name.trim().split(/\s+/)[0] || "there").trim();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name  = contact.name.trim();
    const email = contact.email.trim();
    const job   = contact.job.trim();
    const next  = { name: !name, email: !emailOk(email), job: !job };
    setErrors(next);
    if (Object.values(next).some(Boolean)) { setFormError("Please complete all fields with a valid email."); return; }
    setFormError(null);
    setSubmitting(true);

    const payload = {
      contact: { name, email, job, company: contact.company.trim() || undefined },
      kiln: {
        country: country.toUpperCase(),
        product: product ?? "unspecified",
        kilns, m3, hours,
        price: co.elecPrice, currency: co.currency,
        fanpow, heat, age, inv,
        healthScore: savings.health,
        totalSavingsDkk: Math.round(savings.totalDKK),
      },
      selectedPackage: selectedPkg,
      website,
    };

    try {
      const res = await fetch("/api/roi/kiln-estimator", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setFormError(data.error ?? "Could not submit right now. Please try again.");
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
      goTo(7);
    } catch {
      setFormError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCountry("dk"); setProduct(null);
    setKilns(3); setM3(60); setCycles(20); setCycleHours(240);
    setFanpow(45); setHeat("wood");
    setKilnAge(1); setAge(1); setInv(false); setHeatRecov(false); setTunnelFan(false);
    setStopAndGo(false); setRemoteCtrl(false);
    setMaterialValueDkk(2500); setWastePercent(8);
    setSelectedPkg(null);
    setContact({ name: "", email: "", job: "", company: "" });
    setErrors({}); setFormError(null);
  };

  return (
    <div ref={topRef}>

      {/* Progress bar */}
      {step <= 5 && (
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-ink-300)" }}>
            Step {step + 1} of 6
          </p>
          <div className="flex gap-1.5">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{
                  background: i < step ? "var(--color-tan-500)" : i === step ? "var(--color-ink-900)" : "var(--color-paper-dark)",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 0: Country ──────────────────────────────────────────────────────── */}
      {step === 0 && (
        <StepShell headingRef={headingRef}
          eyebrow="Step 1 of 6 — Location"
          title={<>Where are your kilns <em className="not-italic" style={{ color: "var(--color-tan-500)" }}>located?</em></>}
          description="Select your market. Energy prices, gas prices, and CO₂ emission factors are pre-configured per country — you will see the full picture on the results page."
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.keys(COUNTRIES) as CountryKey[]).map((k) => {
              const c   = COUNTRIES[k];
              const isSel = country === k;
              return (
                <button key={k} type="button" onClick={() => setCountry(k)}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-all hover:shadow-sm",
                    isSel ? "border-[var(--color-navy-900)] bg-[var(--color-cream-50)] shadow-sm"
                          : "border-[var(--color-paper-dark)] bg-white hover:border-[var(--color-navy-500)]",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <p className="font-semibold text-sm" style={{ color: "var(--color-ink-900)" }}>{c.name}</p>
                    {isSel && <Check className="size-4 shrink-0" style={{ color: "var(--color-tan-500)" }} />}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-8 flex justify-end">
            <PrimaryButton onClick={() => goTo(1)}>Next <ArrowRight className="size-4" aria-hidden /></PrimaryButton>
          </div>
        </StepShell>
      )}

      {/* ── 1: Product ──────────────────────────────────────────────────────── */}
      {step === 1 && (
        <StepShell headingRef={headingRef}
          eyebrow="Step 2 of 6 — Product"
          title="What do you dry?"
          description="Select the primary product type dried in your kilns."
        >
          <div className="grid grid-cols-2 gap-3">
            {PRODUCTS.map(({ key, label, sub }) => {
              const isSel = product === key;
              return (
                <button key={key} type="button" onClick={() => setProduct(key)}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-all hover:shadow-sm",
                    isSel ? "border-[var(--color-navy-900)] bg-[var(--color-cream-50)] shadow-sm"
                          : "border-[var(--color-paper-dark)] bg-white hover:border-[var(--color-navy-500)]",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--color-ink-900)" }}>{label}</p>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--color-ink-300)" }}>{sub}</p>
                    </div>
                    {isSel && <Check className="size-4 shrink-0 mt-0.5" style={{ color: "var(--color-tan-500)" }} />}
                  </div>
                </button>
              );
            })}
          </div>
          <NavRow onBack={() => goTo(0)} onNext={() => goTo(2)}
            nextDisabled={!product} nextDisabledHint="Select a product type to continue" />
        </StepShell>
      )}

      {/* ── 2: Capacity ─────────────────────────────────────────────────────── */}
      {step === 2 && (
        <StepShell headingRef={headingRef}
          eyebrow="Step 3 of 6 — Capacity"
          title="Kiln fleet capacity"
          description="Tell us how many kilns you operate and how intensively they run. This drives the annual throughput and energy baseline."
        >
          <SliderRow label="Number of kilns"                  value={kilns}      display={String(kilns)}                                                        min={1}  max={12}  step={1}  onChange={setKilns}      />
          <SliderRow label="Capacity per kiln (m³)"           value={m3}         display={`${m3} m³`}                                                           min={20} max={300} step={10} onChange={setM3}         />
          <SliderRow label="Drying cycles per kiln / year"    value={cycles}     display={`${cycles} cycles`}                                                   min={1}  max={365} step={1}  onChange={setCycles}     />
          <SliderRow label="Hours per drying cycle"           value={cycleHours} display={`${cycleHours} h (${(cycleHours / 24).toFixed(1)} days)`}             min={12} max={600} step={6}  onChange={setCycleHours} />

          {cycles * cycleHours > 8760 ? (
            <div className="mb-5 rounded-md px-4 py-3 text-sm"
              style={{ background: "#fff4e5", border: "1px solid #f59e0b", color: "#92400e" }}>
              <p className="font-semibold">Combination exceeds annual maximum</p>
              <p className="mt-0.5 text-xs">
                {cycles} cycles × {cycleHours} h = {(cycles * cycleHours).toLocaleString("en")} h — a year has at most 8,760 h.
                Calculation uses 8,760 h. Reduce the number of cycles or hours per cycle.
              </p>
            </div>
          ) : (
            <div className="mb-5 flex items-center justify-between rounded-md px-4 py-2.5 text-sm"
              style={{ background: "var(--color-cream-50)", border: "1px solid var(--color-paper-dark)" }}>
              <span style={{ color: "var(--color-ink-500)" }}>Annual operating hours / kiln (derived)</span>
              <span className="font-semibold" style={{ color: "var(--color-ink-900)" }}>
                {hours.toLocaleString("en")} h
              </span>
            </div>
          )}

          <NavRow onBack={() => goTo(1)} onNext={() => goTo(3)} />
        </StepShell>
      )}

      {/* ── 3: Condition + Quality ──────────────────────────────────────────── */}
      {step === 3 && (
        <StepShell headingRef={headingRef}
          eyebrow="Step 4 of 6 — Condition"
          title="Kiln condition & quality"
          description="Describe the current state of your kiln system. These inputs determine your health score, upgrade potential, and quality gain estimate."
        >
          <SectionLabel>Current kiln configuration</SectionLabel>

          {/* Kiln age */}
          <SliderRow label="Kiln age" value={kilnAge} display={KILN_AGE_LABELS[kilnAge]}
            min={1} max={3} step={1} onChange={(v) => setKilnAge(v as 1 | 2 | 3)} />

          {/* Control system age */}
          <SliderRow label="Control system age" value={age} display={CTRL_AGE_LABELS[age]}
            min={1} max={3} step={1} onChange={(v) => setAge(v as 1 | 2 | 3)} />

          <div className="mb-5 rounded-r-md border-l-4 p-3 text-sm leading-relaxed"
            style={{ background: "var(--color-cream-50)", borderLeftColor: "var(--color-tan-500)", color: "var(--color-ink-500)" }}>
            {CTRL_AGE_DESCS[age]}
          </div>

          {/* Heat recovery */}
          <YesNoRow
            label="Heat recovery installed?"
            name="heatRecov"
            value={heatRecov}
            onChange={setHeatRecov}
            noLabel="No" noSub="High thermal saving potential"
            yesLabel="Yes — already fitted" yesSub="Reduced thermal saving potential"
          />

          {/* Inverter drives */}
          <YesNoRow
            label="Inverter drives on fans?"
            name="inv"
            value={inv}
            onChange={setInv}
            noLabel="No — direct on-line motors" noSub="High upgrade impact"
            yesLabel="Yes — already fitted" yesSub="Reduced upgrade impact"
          />

          {/* Fan power */}
          <SliderRow label="Fan motor power per kiln (kW)" value={fanpow} display={`${fanpow} kW`}
            min={10} max={150} step={5} onChange={setFanpow} />

          {/* Tunnel technology */}
          <YesNoRow
            label="Tunnel-technology ventilation?"
            name="tunnelFan"
            value={tunnelFan}
            onChange={setTunnelFan}
            noLabel="No — conventional fan layout" noSub="Full upgrade scope"
            yesLabel="Yes — tunnel fans installed" yesSub="Reduced fan upgrade scope"
          />

          {/* Stop and Go */}
          <YesNoRow
            label="Automated wood-condition drying (Stop & Go)?"
            name="stopAndGo"
            value={stopAndGo}
            onChange={setStopAndGo}
            noLabel="No — time-based drying programme" noSub="High software upgrade potential"
            yesLabel="Yes — Stop & Go active"         yesSub="Software layer already in place"
          />

          {/* Remote control */}
          <YesNoRow
            label="Real-time remote kiln control?"
            name="remoteCtrl"
            value={remoteCtrl}
            onChange={setRemoteCtrl}
            noLabel="No — on-site operation only"    noSub="Remote monitoring adds significant value"
            yesLabel="Yes — remote access installed" yesSub="Connectivity layer in place"
          />

          {/* Live health score */}
          <div className="rounded-lg border p-5" style={{ borderColor: "var(--color-paper-dark)", background: "white" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold" style={{ color: "var(--color-ink-900)" }}>Kiln health score</p>
              <p className="text-xl font-bold" style={{ color: "var(--color-tan-500)" }}>{savings.health}%</p>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-paper-dark)" }}>
              <div className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${savings.health}%`,
                  background: savings.health < 40 ? "#C0601A" : savings.health < 65 ? "#BA7517" : "#3B6D11",
                }}
              />
            </div>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--color-ink-500)" }}>
              {savings.health < 40
                ? "Significant upgrade potential — payback likely under 14 months."
                : savings.health < 65
                  ? "Moderate scope — targeted software and fan upgrades deliver strong ROI."
                  : "Good baseline — cloud and spot-energy optimisation add the next savings layer."}
            </p>
          </div>

          {/* ── Quality section ─────────────────────────────────────────── */}
          <div className="mt-8">
            <SectionLabel>Quality</SectionLabel>
          </div>

          <SliderRow
            label="Dried material value"
            value={materialValueDkk}
            display={`${co.sym}${Math.round(materialValueDkk * co.fxRate).toLocaleString("en")} / m³`}
            min={200} max={10000} step={100}
            onChange={setMaterialValueDkk}
          />

          <SliderRow
            label="Current waste / reject rate"
            value={wastePercent}
            display={`${wastePercent}%`}
            min={1} max={25} step={0.5}
            onChange={setWastePercent}
          />

          <div className="mb-5 rounded-md px-4 py-3 text-sm"
            style={{ background: "var(--color-cream-50)", border: "1px solid var(--color-paper-dark)" }}>
            {stopAndGo ? (
              <>
                <p className="font-semibold mb-1" style={{ color: "var(--color-ink-900)" }}>
                  Stop &amp; Go already active
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-ink-500)" }}>
                  Moisture-condition drying is already reducing your reject rates.
                  Further quality gains are available through remote optimisation and AI-assisted drying recipes.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold mb-1" style={{ color: "var(--color-ink-900)" }}>
                  Quality improvement potential with Stop &amp; Go
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-ink-500)" }}>
                  Moisture-condition-based drying reduces over-drying and rejects by up to 2–5%,
                  capped at your current reject rate of {wastePercent}%.
                  At {co.sym}{Math.round(materialValueDkk * co.fxRate).toLocaleString("en")}/m³,
                  the estimated annual quality gain is{" "}
                  <strong style={{ color: "var(--color-ink-900)" }}>
                    {fmtLocal(savings.qualitySavingLoDkk, co)}–{fmtLocal(savings.qualitySavingHiDkk, co)} / yr
                  </strong>{" "}
                  across {kilns} kiln{kilns > 1 ? "s" : ""}.
                </p>
              </>
            )}
          </div>

          <NavRow onBack={() => goTo(2)} onNext={() => goTo(4)} />
        </StepShell>
      )}

      {/* ── 4: Energy ───────────────────────────────────────────────────────── */}
      {step === 4 && (
        <StepShell headingRef={headingRef}
          eyebrow="Step 5 of 6 — Energy"
          title="Energy configuration"
          description={`Primary heat source for your kilns in ${co.name}. Energy prices are pre-configured from country data and will appear on the results page.`}
        >
          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold" style={{ color: "var(--color-ink-900)" }}>Primary heat source</p>
            <div className="space-y-2">
              {HEAT_OPTS.map(({ value, label, sub }) => (
                <label key={value}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3.5 cursor-pointer transition-all",
                    heat === value
                      ? "border-[var(--color-navy-900)] bg-[var(--color-cream-50)]"
                      : "border-[var(--color-paper-dark)] bg-white hover:border-[var(--color-navy-500)]",
                  )}
                >
                  <input type="radio" name="heat" value={value} checked={heat === value}
                    onChange={() => setHeat(value)} style={{ accentColor: "var(--color-navy-900)" }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-ink-900)" }}>{label}</p>
                    <p className="text-xs" style={{ color: "var(--color-ink-300)" }}>{sub}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <NavRow onBack={() => goTo(3)} onNext={() => goTo(5)} />
        </StepShell>
      )}

      {/* ── 5: Results ──────────────────────────────────────────────────────── */}
      {step === 5 && (
        <StepShell headingRef={headingRef}
          eyebrow="Step 6 of 6 — Results"
          title={<>Your <em className="not-italic" style={{ color: "var(--color-tan-500)" }}>upgrade potential</em></>}
          description={`With ${kilns} kiln${kilns > 1 ? "s" : ""} in ${co.name}, here is what three upgrade levels deliver — in ${co.currency}.`}
        >
          {/* Pills */}
          {(() => {
            const fuelLabel =
              heat === "wood"     ? `${co.sym}${co.woodPrice.toFixed(3)}/kWh wood chips` :
              heat === "oil"      ? `${co.sym}${co.oilPrice.toFixed(2)}/kWh oil`         :
              heat === "gas"      ? `${co.sym}${co.gasPrice.toFixed(2)}/kWh gas`         :
              heat === "heatpump" ? `${co.sym}${(co.elecPrice / 3.2).toFixed(3)}/kWh (heat pump thermal)` :
              heat === "electric" ? `${co.sym}${co.elecPrice.toFixed(2)}/kWh electric heat` : null;
            const pills = [
              co.name, co.currency,
              `${co.sym}${co.elecPrice.toFixed(2)}/kWh electricity`,
              ...(fuelLabel ? [fuelLabel] : []),
              ...(co.fxRate !== 1 ? [`${co.fxLabel} (fixed ref. Jun 2025)`] : []),
            ];
            return (
              <div className="flex flex-wrap gap-2 mb-6">
                {pills.map((pill) => (
                  <span key={pill} className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
                    style={{ borderColor: "var(--color-paper-dark)", color: "var(--color-ink-500)", background: "white" }}>
                    {pill}
                  </span>
                ))}
              </div>
            );
          })()}

          {/* Financial metrics */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <MetricCard label="Annual savings (est.)"  value={`${fmtLocal(savings.totalDKK, co)}/yr`}           sub="across all kilns" />
            <MetricCard label="Electricity saving"     value={`${Math.round(savings.elecSavePct * 100)}% less`} sub="Stop & Go + inverters" />
            <MetricCard label="Thermal saving"
              value={savings.heatSavePct > 0 ? `~${Math.round(savings.heatSavePct * 100)}% less` : "N/A"}
              sub={savings.isCombustion ? "fuel consumption" : heat === "heatpump" ? "heat pump load" : heat === "electric" ? "heating load" : "no thermal system"} />
          </div>

          {/* Cost per drying cycle */}
          <div className="mb-6 rounded-xl border p-5" style={{ borderColor: "var(--color-paper-dark)", background: "var(--color-cream-50)" }}>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-ink-900)" }}>
              Cost per drying cycle — per kiln
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <MetricCard
                label="Electricity now"
                value={fmtLocal(savings.cycleElecCostDkk, co)}
                sub={`${cycleHours} h × ${fanpow} kW`}
              />
              {savings.cycleThermalCostDkk > 0 && (
                <MetricCard
                  label="Heat energy now"
                  value={fmtLocal(savings.cycleThermalCostDkk, co)}
                  sub={`${m3} m³ × 280 kWh/m³`}
                />
              )}
              <MetricCard
                label="Total cost now"
                value={fmtLocal(savings.costPerCycleDkk, co)}
                sub="per cycle / kiln"
              />
              <MetricCard
                label="After upgrade"
                value={fmtLocal(savings.costPerCycleAfterDkk, co)}
                sub={`saving ${fmtLocal(savings.savingPerCycleDkk, co)}/cycle`}
              />
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: "var(--color-ink-300)" }}>
              Electricity: {fanpow} kW × {cycleHours} h × {co.sym}{co.elecPrice.toFixed(2)}/kWh.
              {savings.cycleThermalCostDkk > 0
                ? ` Heat: ${m3} m³ × 280 kWh/m³ × ${co.sym}${
                    heat === "wood"     ? co.woodPrice.toFixed(3) :
                    heat === "oil"      ? co.oilPrice.toFixed(2)  :
                    heat === "gas"      ? co.gasPrice.toFixed(2)  :
                    heat === "heatpump" ? (co.elecPrice / 3.2).toFixed(3) :
                                         co.elecPrice.toFixed(2)
                  }/kWh.`
                : ""}
            </p>
          </div>

          {/* CO₂ */}
          <div className="mb-6 rounded-xl border p-5" style={{ borderColor: "var(--color-paper-dark)", background: "var(--color-cream-50)" }}>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-ink-900)" }}>
              CO₂ impact of upgrade
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <MetricCard label="Fan electricity — now"  value={`${savings.currentFanCO2t.toFixed(1)} t/yr`}
                sub={`${ef.electricity} gCO₂/kWh grid`} />
              <MetricCard label="Saved — electricity"   value={`${savings.savedFanCO2t.toFixed(1)} t/yr`}
                sub={`${Math.round(savings.elecSavePct * 100)}% fan energy reduction`} />
              {savings.savedHeatCO2t > 0.05 && (
                <MetricCard
                  label={`Saved — ${heat === "wood" ? "wood boiler" : heat === "oil" ? "oil boiler" : heat === "gas" ? "gas boiler" : heat === "electric" ? "electric heat" : "heat pump"}`}
                  value={`${savings.savedHeatCO2t.toFixed(1)} t/yr`}
                  sub={heat === "heatpump"
                    ? `${ef.heatpump} gCO₂/kWh · COP 3.2`
                    : heat === "electric"
                      ? `${ef.electricity} gCO₂/kWh · grid`
                      : `${savings.heatEmFactor} gCO₂/kWh · ${heat} combustion`} />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 border-t" style={{ borderColor: "var(--color-paper-dark)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-ink-900)" }}>
                Total: <strong style={{ color: "var(--color-tan-500)" }}>{savings.totalSavedCO2t.toFixed(1)} t CO₂eq/yr</strong>
              </p>
              {savings.totalSavedCO2t >= 1 && (
                <p className="text-xs" style={{ color: "var(--color-ink-500)" }}>
                  ≈ {Math.round(savings.totalSavedCO2t / 2.3)} passenger cars off the road per year
                </p>
              )}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed" style={{ color: "var(--color-ink-300)" }}>
              Thermal load estimated at {kilns} × {cycles} cycles × {m3} m³ × 280 kWh/m³.
              {heat === "wood"     ? " Wood chips (biogenic): 30 gCO₂/kWh."  : ""}
              {heat === "oil"      ? " Heating oil: 265 gCO₂/kWh."           : ""}
              {heat === "gas"      ? " Natural gas: 205 gCO₂/kWh."           : ""}
              {heat === "heatpump" ? " Heat pump COP 3.2 assumed."            : ""}
              {heat === "electric" ? " Direct electric resistance heating."   : ""}
            </p>
          </div>

          {/* Quality impact */}
          <div className="mb-6 rounded-xl border p-5" style={{ borderColor: "var(--color-paper-dark)", background: "var(--color-cream-50)" }}>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-ink-900)" }}>
              Quality impact — Stop &amp; Go
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <MetricCard
                label="Annual throughput"
                value={`${savings.annualThroughputM3.toLocaleString("en")} m³`}
                sub={`${kilns} kiln${kilns > 1 ? "s" : ""} × ${cycles} cycles × ${m3} m³`}
              />
              <MetricCard
                label="Material value"
                value={`${co.sym}${Math.round(materialValueDkk * co.fxRate).toLocaleString("en")}/m³`}
                sub="dried product"
              />
              <MetricCard
                label="Current reject rate"
                value={`${wastePercent}%`}
                sub="of throughput"
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 border-t" style={{ borderColor: "var(--color-paper-dark)" }}>
              {stopAndGo ? (
                <p className="text-sm font-semibold" style={{ color: "var(--color-ink-900)" }}>
                  Stop &amp; Go already active —{" "}
                  <strong style={{ color: "var(--color-tan-500)" }}>quality benefit in your current baseline</strong>
                </p>
              ) : (
                <p className="text-sm font-semibold" style={{ color: "var(--color-ink-900)" }}>
                  Quality gain:{" "}
                  <strong style={{ color: "var(--color-tan-500)" }}>
                    {fmtLocal(savings.qualitySavingLoDkk, co)}–{fmtLocal(savings.qualitySavingHiDkk, co)} / yr
                  </strong>
                </p>
              )}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed" style={{ color: "var(--color-ink-300)" }}>
              {stopAndGo
                ? "Stop & Go is active — moisture-condition drying already reduces reject rates. Further gains come from remote optimisation and AI-assisted drying recipes."
                : wastePercent < 5
                  ? `Gain capped at current reject rate of ${wastePercent}%: Stop & Go reduces over-drying and rejects up to that ceiling. Not included in energy savings above.`
                  : "Assumes 2–5% better material utilisation through moisture-condition-based drying (Stop & Go). Not included in energy savings figures above."}
            </p>
          </div>

          {/* Packages */}
          <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-ink-900)" }}>
            Three ways to capture these savings
          </p>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            {packages.map((pkg) => {
              const isSel = selectedPkg === pkg.name;
              const mid   = (pkg.saveLo + pkg.saveHi) / 2;
              const pb    = mid > 0 ? (pkg.invHi / mid).toFixed(1) : "—";
              return (
                <button key={pkg.name} type="button"
                  onClick={() => setSelectedPkg(isSel ? null : pkg.name)}
                  className={cn(
                    "relative rounded-xl border-2 p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5",
                    isSel
                      ? "border-[var(--color-navy-900)] bg-[var(--color-cream-50)] shadow-sm"
                      : pkg.featured
                        ? "border-[var(--color-navy-900)]/35 bg-white"
                        : "border-[var(--color-paper-dark)] bg-white hover:border-[var(--color-navy-500)]",
                  )}
                >
                  {pkg.featured && !isSel && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--color-navy-900)] px-3 py-0.5 text-[10px] font-semibold text-white">
                      Most chosen
                    </span>
                  )}
                  {isSel && (
                    <span className="absolute right-3 top-3 inline-flex size-5 items-center justify-center rounded-full bg-[var(--color-navy-900)] text-white">
                      <Check className="size-3" />
                    </span>
                  )}
                  <p className="pr-7 font-bold text-sm leading-snug" style={{ color: "var(--color-ink-900)" }}>{pkg.name}</p>
                  <p className="mt-0.5 mb-3 text-[10px]" style={{ color: "var(--color-ink-300)" }}>{pkg.tag}</p>
                  <div className="h-px mb-3" style={{ background: "var(--color-paper-dark)" }} />
                  <p className="font-bold text-lg leading-none" style={{ color: "var(--color-ink-900)" }}>
                    {fmtLocal(pkg.saveLo, co)}–{fmtLocal(pkg.saveHi, co)}
                  </p>
                  <p className="mb-3 text-[10px]" style={{ color: "var(--color-ink-300)" }}>estimated annual savings</p>
                  <ul className="mb-4 space-y-1">
                    {pkg.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs" style={{ color: "var(--color-ink-500)" }}>
                        <span className="shrink-0 font-bold" style={{ color: "var(--color-tan-500)" }}>—</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="border-t pt-2.5 text-xs" style={{ borderColor: "var(--color-paper-dark)", color: "var(--color-ink-500)" }}>
                    Investment: <strong style={{ color: "var(--color-ink-900)" }}>{fmtLocal(pkg.invLo, co)}–{fmtLocal(pkg.invHi, co)}</strong>
                    <br />Payback: <strong style={{ color: "var(--color-ink-900)" }}>~{pb} yr</strong>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Disclaimer */}
          <p className="mb-6 text-xs leading-relaxed" style={{ color: "var(--color-ink-300)" }}>
            <strong style={{ color: "var(--color-ink-500)" }}>Reference prices:</strong>{" "}
            electricity {co.sym}{co.elecPrice.toFixed(2)}/kWh
            {heat === "wood" ? ` · wood chips ${co.sym}${co.woodPrice.toFixed(3)}/kWh` : ""}
            {heat === "oil"  ? ` · oil ${co.sym}${co.oilPrice.toFixed(2)}/kWh`         : ""}
            {heat === "gas"  ? ` · gas ${co.sym}${co.gasPrice.toFixed(2)}/kWh`         : ""}
            {heat === "heatpump" ? ` · heat pump effective thermal ${co.sym}${(co.elecPrice / 3.2).toFixed(3)}/kWh` : ""}
            {" "}· {co.name} typical industrial.
            {co.fxRate !== 1 ? ` Converted from DKK at ${co.fxLabel} (fixed rate, Jun 2025).` : ""}
            {" "}<strong style={{ color: "var(--color-ink-500)" }}>Actual savings require on-site technical assessment.</strong>
          </p>

          {/* CTA */}
          <div className="rounded-lg border p-5" style={{ borderColor: "var(--color-paper-dark)", background: "white" }}>
            <p className="mb-4 text-sm leading-relaxed" style={{ color: "var(--color-ink-500)" }}>
              These are your numbers. A 30-minute conversation with our team pressure-tests them against your
              actual operation — free, no commitment.
            </p>
            <div className="flex flex-wrap gap-3">
              <SecondaryButton onClick={() => goTo(4)}><ArrowLeft className="size-4" aria-hidden /> Back</SecondaryButton>
              <PrimaryButton   onClick={() => goTo(6)}>Get in touch <ArrowRight className="size-4" aria-hidden /></PrimaryButton>
            </div>
          </div>
        </StepShell>
      )}

      {/* ── 6: Contact ──────────────────────────────────────────────────────── */}
      {step === 6 && (
        <StepShell headingRef={headingRef}
          eyebrow="Get in Touch"
          title={<>Let&apos;s turn this into a <em className="not-italic" style={{ color: "var(--color-tan-500)" }}>real proposal</em></>}
          description="No commitment required. Fill in your details and a Nicholaisen specialist will send you the full calculation and reach out to answer any questions."
        >
          <form onSubmit={handleSubmit} noValidate className="grid gap-4">
            <TextField id="contactName"    label="Full name"   required autoComplete="name"
              placeholder="Jane Doe"           value={contact.name}    type="text"
              onChange={(v) => { setContact((c) => ({ ...c, name: v }));    if (errors.name)  setErrors((e) => ({ ...e, name:  false })); }}
              invalid={!!errors.name}    errorMessage={errors.name    ? "Please enter your name."       : undefined} />
            <TextField id="contactEmail"   label="Work email"  required autoComplete="email"
              placeholder="jane@company.com"   value={contact.email}   type="email"
              onChange={(v) => { setContact((c) => ({ ...c, email: v }));   if (errors.email) setErrors((e) => ({ ...e, email: false })); }}
              onBlur={(v) => { if (v.trim() && !emailOk(v.trim())) setErrors((e) => ({ ...e, email: true })); }}
              invalid={!!errors.email}   errorMessage={errors.email   ? "Enter a valid email address."  : undefined} />
            <TextField id="contactJob"     label="Job title"   required autoComplete="organization-title"
              placeholder="Production Manager" value={contact.job}     type="text"
              onChange={(v) => { setContact((c) => ({ ...c, job: v }));     if (errors.job)   setErrors((e) => ({ ...e, job:   false })); }}
              invalid={!!errors.job}     errorMessage={errors.job     ? "Please enter your job title."  : undefined} />
            <TextField id="contactCompany" label="Company"              autoComplete="organization"
              placeholder="Optional"           value={contact.company} type="text"
              onChange={(v) => setContact((c) => ({ ...c, company: v }))} />

            <div className="hidden" aria-hidden>
              <label htmlFor="website">Website</label>
              <input id="website" type="text" tabIndex={-1} autoComplete="off"
                value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>

            {formError && <p className="text-sm text-[#b3261e]" role="alert">{formError}</p>}

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <SecondaryButton type="button" onClick={() => goTo(5)}><ArrowLeft className="size-4" aria-hidden /> Back</SecondaryButton>
              <PrimaryButton type="submit" disabled={submitting} aria-busy={submitting || undefined}>
                {submitting
                  ? <><Loader2 className="size-4 animate-spin" aria-hidden />Sending…</>
                  : <>Request proposal <ArrowRight className="size-4" aria-hidden /></>}
              </PrimaryButton>
            </div>
          </form>
        </StepShell>
      )}

      {/* ── 7: Thank you ────────────────────────────────────────────────────── */}
      {step === 7 && (
        <StepShell headingRef={headingRef}
          eyebrow="Submission Received"
          title={<>Thank you, <em className="not-italic" style={{ color: "var(--color-tan-500)" }}>{firstName}!</em></>}
          description={<>Your request has been received. A Nicholaisen specialist will contact{" "}
            <strong style={{ color: "var(--color-ink-900)" }}>{contact.email || "you"}</strong>{" "}
            to take the conversation further.</>}
        >
          <div className="mb-8 rounded-md border p-5 text-sm leading-relaxed"
            style={{ borderColor: "var(--color-paper-dark)", borderLeft: "4px solid var(--color-navy-900)", color: "var(--color-ink-500)" }}>
            <strong style={{ color: "var(--color-ink-900)" }}>What happens next?</strong><br />
            We will review your kiln data and selected upgrade package, then reach out within 1–2 business
            days to discuss your specific case, answer questions, and prepare a priced proposal matched to
            your actual requirements.
          </div>
          <PrimaryButton onClick={() => { resetForm(); goTo(0); }}>Submit another</PrimaryButton>
        </StepShell>
      )}
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function StepShell({ eyebrow, title, description, children, headingRef }: {
  eyebrow: string; title: ReactNode; description: ReactNode;
  children: ReactNode; headingRef?: Ref<HTMLHeadingElement>;
}) {
  return (
    <div className="animate-[fadeUp_.35s_ease_forwards]">
      <p style={{ color: "var(--color-tan-500)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {eyebrow}
      </p>
      <h2 ref={headingRef} tabIndex={-1} className="mt-3 font-bold text-balance outline-none"
        style={{ fontSize: "clamp(1.5rem,4vw,2rem)", color: "var(--color-ink-900)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
        {title}
      </h2>
      <p className="mt-4 max-w-xl text-base leading-relaxed" style={{ color: "var(--color-ink-500)" }}>
        {description}
      </p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-ink-900)" }}>
      {children}
    </p>
  );
}

function SliderRow({ label, value, display, min, max, step, onChange }: {
  label: string; value: number; display: string;
  min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  return (
    <div className="mb-5">
      <div className="flex justify-between items-baseline mb-1.5">
        <label className="text-sm" style={{ color: "var(--color-ink-500)" }}>{label}</label>
        <span className="text-base font-semibold" style={{ color: "var(--color-ink-900)" }}>{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 cursor-pointer" style={{ accentColor: "var(--color-navy-900)" }} />
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-paper-dark)", background: "white" }}>
      <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--color-ink-300)" }}>{label}</p>
      <p className="text-lg font-bold leading-tight" style={{ color: "var(--color-ink-900)" }}>{value}</p>
      <p className="mt-1 text-[10px]" style={{ color: "var(--color-ink-300)" }}>{sub}</p>
    </div>
  );
}

function NavRow({ onBack, onNext, nextDisabled, nextDisabledHint }: {
  onBack: () => void; onNext: () => void; nextDisabled?: boolean; nextDisabledHint?: string;
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <SecondaryButton onClick={onBack}><ArrowLeft className="size-4" aria-hidden /> Back</SecondaryButton>
      <PrimaryButton onClick={onNext} disabled={nextDisabled} title={nextDisabled ? nextDisabledHint : undefined}>
        Next <ArrowRight className="size-4" aria-hidden />
      </PrimaryButton>
      {nextDisabled && nextDisabledHint && (
        <p className="text-xs" style={{ color: "var(--color-ink-300)" }}>{nextDisabledHint}</p>
      )}
    </div>
  );
}

function TextField({ id, label, value, onChange, onBlur, required, type = "text",
  autoComplete, placeholder, invalid, errorMessage }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  onBlur?: (v: string) => void; required?: boolean; type?: string;
  autoComplete?: string; placeholder?: string; invalid?: boolean; errorMessage?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold" style={{ color: "var(--color-ink-900)" }}>
        {label}
        {required && <span className="ml-1" style={{ color: "var(--color-tan-500)" }}>*</span>}
      </label>
      <input id={id} type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur ? (e) => onBlur(e.target.value) : undefined}
        autoComplete={autoComplete} placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid && errorMessage ? `${id}-error` : undefined}
        className={cn(
          "w-full rounded-md border px-3.5 py-2.5 text-[0.95rem] outline-none transition-colors focus:ring-2 focus:ring-[var(--color-navy-900)]/15",
          invalid
            ? "border-[#b3261e] focus:border-[#b3261e] focus:ring-[#b3261e]/15"
            : "border-[var(--color-paper-dark)] focus:border-[var(--color-navy-900)]",
        )}
        style={{ background: "var(--color-paper)", color: "var(--color-ink-900)" }}
      />
      {invalid && errorMessage && (
        <p id={`${id}-error`} className="text-xs text-[#b3261e]">{errorMessage}</p>
      )}
    </div>
  );
}

function PrimaryButton({ children, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} {...props}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-[0.95rem] font-medium transition-all",
        "hover:opacity-85 hover:shadow-sm active:translate-y-px",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50 disabled:hover:shadow-none disabled:active:translate-y-0",
        props.className,
      )}
      style={{ background: "var(--color-navy-900)", color: "var(--color-cream-50)" }}
    >{children}</button>
  );
}

function SecondaryButton({ children, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} {...props}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md border px-5 text-[0.95rem] font-medium transition-colors",
        "hover:bg-[var(--color-paper-dark)]/40 disabled:opacity-50 disabled:cursor-not-allowed",
        props.className,
      )}
      style={{ borderColor: "var(--color-paper-dark)", color: "var(--color-ink-900)", background: "transparent", borderWidth: 1.5 }}
    >{children}</button>
  );
}

function YesNoRow({ label, name, value, onChange, noLabel, noSub, yesLabel, yesSub }: {
  label: string; name: string; value: boolean; onChange: (v: boolean) => void;
  noLabel: string; noSub: string; yesLabel: string; yesSub: string;
}) {
  return (
    <div className="mb-5">
      <p className="mb-3 text-sm font-semibold" style={{ color: "var(--color-ink-900)" }}>{label}</p>
      <div className="space-y-2">
        {([
          { val: false, lbl: noLabel,  sub: noSub  },
          { val: true,  lbl: yesLabel, sub: yesSub },
        ] as const).map(({ val, lbl, sub }) => (
          <label key={String(val)}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3.5 cursor-pointer transition-all",
              value === val
                ? "border-[var(--color-navy-900)] bg-[var(--color-cream-50)]"
                : "border-[var(--color-paper-dark)] bg-white hover:border-[var(--color-navy-500)]",
            )}
          >
            <input type="radio" name={name} value={String(val)} checked={value === val}
              onChange={() => onChange(val)} style={{ accentColor: "var(--color-navy-900)" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-ink-900)" }}>{lbl}</p>
              <p className="text-xs" style={{ color: "var(--color-ink-300)" }}>{sub}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
