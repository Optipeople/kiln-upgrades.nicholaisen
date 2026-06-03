/**
 * ROI Calculator — Kiln Upgrade Packages
 *
 * Add one entry per upgrade package in the SOLUTIONS array.
 * Each product id must match the id field in products.ts.
 * processingTimeSec: machine time in seconds per piece (0 = product not processed in this upgrade).
 *
 * In the kiln context, "processingTimeSec" represents the time per cycle/batch unit
 * after the upgrade is installed. Tune to your actual data.
 *
 * automationOptions: optional add-ons that improve OEE and/or reduce operator load.
 */

export type AutomationOption = {
  /** Short name shown in UI */
  name: string;
  /** Description shown beneath the name */
  description: string;
  /** Add-on price in EUR */
  priceEur: number;
  /** OEE boost in percentage points (e.g. 8 = +8 pp) */
  oeeBoostPct: number;
  /** Reduction in operator count (e.g. 0.5 = half FTE) */
  operatorReduction: number;
};

export type SolutionVariant = {
  /** Package name, e.g. "Insulation & Sealing Upgrade" */
  name: string;

  /** Short description shown on step 3 — what defines this package */
  description: string;

  /** Optional package image — path relative to /public, e.g. "/solutions/insulation.svg" */
  image?: string;

  /** Expected OEE in percent (0–100) */
  oeePercent: number;

  /** Operators required to run the upgraded kiln */
  operators: number;

  /** Investment price in EUR (excl. automation add-ons) */
  investmentEur: number;

  /** Machine time in seconds per unit for each product id */
  processingTimeSec: Record<string, number>;

  /** Optional automation add-ons */
  automationOptions?: AutomationOption[];
};

// ──────────────────────────────────────────────────────────────────────────────
// Placeholder upgrade packages — replace numbers with real engineering data.
// ──────────────────────────────────────────────────────────────────────────────

export const SOLUTIONS: SolutionVariant[] = [
  {
    name: "Insulation & Sealing Upgrade",
    description:
      "Replace door seals, top up wall insulation and refit vents. Lowest-cost path to immediate energy savings.",
    image: "/solutions/insulation-upgrade.svg",
    oeePercent: 65,
    operators: 1,
    investmentEur: 35_000,
    processingTimeSec: {
      "Lumber Kiln — Small":      60,
      "Lumber Kiln — Medium":     90,
      "Lumber Kiln — Large":     120,
      "Pre-Drying Chamber":      150,
      "Veneer Dryer":             45,
      "Steam Conditioning Kiln":  75,
      "Brick Tunnel Kiln":       180,
      "Ceramic Shuttle Kiln":     90,
      "Continuous Drying Line":  120,
    },
    automationOptions: [
      {
        name: "Real-time Energy Monitoring",
        description: "Sensor pack + dashboard for live kWh/m³ tracking and anomaly alerts.",
        priceEur: 8_000,
        oeeBoostPct: 4,
        operatorReduction: 0,
      },
    ],
  },

  {
    name: "Heat Recovery System",
    description:
      "Add a heat-exchanger loop to recapture exhaust energy and pre-heat incoming air. Significant fuel savings.",
    image: "/solutions/heat-recovery.svg",
    oeePercent: 72,
    operators: 1,
    investmentEur: 85_000,
    processingTimeSec: {
      "Lumber Kiln — Small":      50,
      "Lumber Kiln — Medium":     75,
      "Lumber Kiln — Large":     100,
      "Pre-Drying Chamber":      125,
      "Veneer Dryer":             38,
      "Steam Conditioning Kiln":  62,
      "Brick Tunnel Kiln":       150,
      "Ceramic Shuttle Kiln":     75,
      "Continuous Drying Line":  100,
    },
    automationOptions: [
      {
        name: "Real-time Energy Monitoring",
        description: "Sensor pack + dashboard for live kWh/m³ tracking and anomaly alerts.",
        priceEur: 8_000,
        oeeBoostPct: 4,
        operatorReduction: 0,
      },
      {
        name: "Automated Damper Control",
        description: "Closed-loop airflow control tuned by load and ambient conditions.",
        priceEur: 18_000,
        oeeBoostPct: 6,
        operatorReduction: 0.25,
      },
    ],
  },

  {
    name: "Smart Control & Monitoring Suite",
    description:
      "Replace legacy PLCs with modern controllers and a unified SCADA. Recipe-driven schedules and remote oversight.",
    image: "/solutions/smart-control.svg",
    oeePercent: 78,
    operators: 1,
    investmentEur: 140_000,
    processingTimeSec: {
      "Lumber Kiln — Small":      42,
      "Lumber Kiln — Medium":     63,
      "Lumber Kiln — Large":      85,
      "Pre-Drying Chamber":      105,
      "Veneer Dryer":             32,
      "Steam Conditioning Kiln":  52,
      "Brick Tunnel Kiln":       125,
      "Ceramic Shuttle Kiln":     63,
      "Continuous Drying Line":   85,
    },
    automationOptions: [
      {
        name: "Predictive Maintenance Add-on",
        description: "Vibration + thermal sensors with ML-based failure prediction.",
        priceEur: 22_000,
        oeeBoostPct: 5,
        operatorReduction: 0.25,
      },
      {
        name: "Automated Damper Control",
        description: "Closed-loop airflow control tuned by load and ambient conditions.",
        priceEur: 18_000,
        oeeBoostPct: 6,
        operatorReduction: 0.25,
      },
    ],
  },

  {
    name: "Full Modernization Package",
    description:
      "End-to-end overhaul: insulation, heat recovery, smart controls and automated loading. Maximum throughput per kWh.",
    image: "/solutions/full-modernization.svg",
    oeePercent: 88,
    operators: 1,
    investmentEur: 240_000,
    processingTimeSec: {
      "Lumber Kiln — Small":      32,
      "Lumber Kiln — Medium":     48,
      "Lumber Kiln — Large":      65,
      "Pre-Drying Chamber":       80,
      "Veneer Dryer":             24,
      "Steam Conditioning Kiln":  40,
      "Brick Tunnel Kiln":        95,
      "Ceramic Shuttle Kiln":     48,
      "Continuous Drying Line":   65,
    },
    automationOptions: [],
  },
];
