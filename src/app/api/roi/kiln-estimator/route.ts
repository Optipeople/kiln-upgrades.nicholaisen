import { NextResponse } from "next/server";
import { Resend } from "resend";
import { site } from "@/lib/site";
import { EstimatorSchema } from "@/features/kiln-upgrades-roi/estimator-schema";

// ── constants ─────────────────────────────────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  DK: "Denmark", SE: "Sweden", NO: "Norway", FI: "Finland",
  EE: "Estonia", LV: "Latvia", LT: "Lithuania", PL: "Poland", DE: "Germany",
};

const HEAT_LABELS: Record<string, string> = {
  wood:     "Wood chips boiler (flis / biomass)",
  oil:      "Oil boiler",
  gas:      "Gas boiler",
  electric: "Electric heating",
  heatpump: "Heat pump",
};

const AGE_LABELS: Record<number, string> = {
  1: "Legacy (pre-2015)",
  2: "Mid-gen (2015–2020)",
  3: "Modern (post-2020)",
};

// ── FX (DKK base → local) ─────────────────────────────────────────────────────
const FX: Record<string, number> = {
  DK: 1, SE: 1.44, NO: 1.5, FI: 0.134, EE: 0.134,
  LV: 0.134, LT: 0.134, PL: 0.524, DE: 0.134,
};

function fmtLocal(dkk: number, country: string, currency: string): string {
  const fx = FX[country] ?? 1;
  const v = Math.round(dkk * fx);
  const sym = currency === "EUR" ? "€" : currency === "DKK" ? "DKK " : currency + " ";
  if (v >= 1_000_000) return sym + (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return sym + Math.round(v / 1000) + "K";
  return sym + v;
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']|[^\x20-\x7E]/g, (c) => {
    switch (c) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return `&#${c.codePointAt(0)};`;
    }
  });
}
const e = (s: string | number) => escapeHtml(String(s));

const CSS = {
  body: "margin:0;padding:24px 12px;background:#f5f0e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#1a1d22;",
  card: "background:#fff;border-radius:8px;padding:28px 32px;max-width:700px;margin:0 auto 20px;",
  h1:   "margin:0 0 4px;font-size:22px;color:#0e2238;",
  h2:   "margin:24px 0 10px;font-size:15px;font-weight:700;color:#0e2238;border-bottom:2px solid #0e2238;padding-bottom:4px;",
  lbl:  "color:#5a7c9a;font-size:12px;width:220px;padding:5px 12px 5px 0;vertical-align:top;",
  val:  "color:#0f1115;font-size:13px;padding:5px 0;",
};

function row(label: string, value: string) {
  return `<tr><td style="${CSS.lbl}">${label}</td><td style="${CSS.val}">${value}</td></tr>`;
}
function h2(title: string) {
  return `<h2 style="${CSS.h2}">${title}</h2>`;
}
function tbl(rows: string) {
  return `<table style="border-collapse:collapse;width:100%;">${rows}</table>`;
}

// ── email builder ─────────────────────────────────────────────────────────────

function buildHtml(data: {
  contact: { name: string; email: string; job: string; company?: string };
  kiln: {
    country: string; product: string; kilns: number; m3: number; hours: number;
    price: number; currency: string; fanpow: number; heat: string;
    age: number; inv: boolean; healthScore: number; totalSavingsDkk: number;
  };
  selectedPackage: string | null;
  submittedAt: string;
}): string {
  const { kiln: k, contact: c } = data;
  const countryName = COUNTRY_NAMES[k.country] ?? k.country;
  const sym = k.currency === "EUR" ? "€" : k.currency + " ";

  const elecSavePct = k.inv ? 22 : 38;
  const annualFanEnergy = k.kilns * k.fanpow * k.hours;
  const elecSavingLocal = annualFanEnergy * (elecSavePct / 100) * k.price;

  const pkgRows = [
    { name:"Start Smart",      saveLo:k.totalSavingsDkk*0.45, saveHi:k.totalSavingsDkk*0.65, invLo:k.kilns*28000, invHi:k.kilns*45000 },
    { name:"Upgrade Complete", saveLo:k.totalSavingsDkk*0.70, saveHi:k.totalSavingsDkk*0.95, invLo:k.kilns*65000, invHi:k.kilns*96000 },
    { name:"Future Ready",     saveLo:k.totalSavingsDkk*0.95, saveHi:k.totalSavingsDkk*1.35, invLo:k.kilns*96000, invHi:k.kilns*120000 },
  ].map((p) => {
    const isSelected = data.selectedPackage === p.name;
    const midSav = (p.saveLo + p.saveHi) / 2;
    const pb = midSav > 0 ? (p.invHi / midSav).toFixed(1) : "—";
    return `<tr style="${isSelected ? "background:#fffbf0;font-weight:700;" : ""}border-bottom:1px solid #f0ede6;">
      <td style="${CSS.val}padding:8px 12px 8px 0;">${e(p.name)}${isSelected ? ' <span style="color:#7a5a1a;">✓ Customer choice</span>' : ""}</td>
      <td style="${CSS.val}padding:8px 12px;text-align:right;">${fmtLocal(p.saveLo, k.country, k.currency)}–${fmtLocal(p.saveHi, k.country, k.currency)}/yr</td>
      <td style="${CSS.val}padding:8px 0;text-align:right;">${fmtLocal(p.invLo, k.country, k.currency)}–${fmtLocal(p.invHi, k.country, k.currency)}</td>
      <td style="${CSS.val}padding:8px 0 8px 12px;text-align:right;">~${pb} yr</td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kiln Upgrade Estimator — ${e(c.name)}</title></head>
<body style="${CSS.body}">
<div style="${CSS.card}">
  <h1 style="${CSS.h1}">Kiln Upgrade Estimator</h1>
  <p style="margin:0 0 4px;font-size:13px;color:#7a8a9a;">Sales report — internal use only</p>
  <p style="margin:0;font-size:12px;color:#aaa;">Submitted: ${e(data.submittedAt)}</p>

  ${h2("Contact")}
  ${tbl([
    row("Name",    e(c.name)),
    row("Email",   `<a href="mailto:${e(c.email)}" style="color:#0e2238;">${e(c.email)}</a>`),
    row("Title",   e(c.job)),
    c.company ? row("Company", e(c.company)) : "",
  ].join(""))}

  ${h2("Kiln configuration")}
  ${tbl([
    row("Country",           e(countryName)),
    row("Product",           e(k.product)),
    row("Number of kilns",   e(k.kilns)),
    row("Capacity / kiln",   e(k.m3 + " m³")),
    row("Annual hours",      e(k.hours.toLocaleString("en") + " h / kiln")),
    row("Electricity price", e(`${sym}${k.price.toFixed(2)}/kWh (${k.currency})`)),
    row("Fan motor power",   e(k.fanpow + " kW / kiln")),
    row("Heat source",       e(HEAT_LABELS[k.heat] ?? k.heat)),
    row("Control system",    e(AGE_LABELS[k.age] ?? String(k.age))),
    row("Inverter drives",   k.inv ? "Yes — already fitted" : "No — direct on-line motors"),
  ].join(""))}

  ${h2("Savings estimate")}
  ${tbl([
    row("Kiln health score",    `<strong>${e(k.healthScore)}%</strong>`),
    row("Fan electricity saved",`~${elecSavePct}% · ${sym}${Math.round(elecSavingLocal).toLocaleString("en")}/yr`),
    row("Total saving (DKK ref)",`<strong>DKK ${Math.round(k.totalSavingsDkk).toLocaleString("en")}/yr</strong>`),
    row("Total saving (local)",  `<strong>${fmtLocal(k.totalSavingsDkk, k.country, k.currency)}/yr</strong>`),
  ].join(""))}

  ${h2("Upgrade packages")}
  <table style="border-collapse:collapse;width:100%;margin-top:6px;">
    <thead><tr>
      <th style="text-align:left;font-size:11px;color:#5a7c9a;padding:4px 12px 4px 0;border-bottom:2px solid #ddd;">Package</th>
      <th style="text-align:right;font-size:11px;color:#5a7c9a;padding:4px 12px;border-bottom:2px solid #ddd;">Annual savings</th>
      <th style="text-align:right;font-size:11px;color:#5a7c9a;padding:4px 12px;border-bottom:2px solid #ddd;">Investment</th>
      <th style="text-align:right;font-size:11px;color:#5a7c9a;padding:4px 0 4px 12px;border-bottom:2px solid #ddd;">Payback</th>
    </tr></thead>
    <tbody>${pkgRows}</tbody>
  </table>
  <p style="font-size:11px;color:#aaa;margin-top:8px;">Electricity price pre-filled from typical ${e(countryName)} industrial tariff. Investment ceiling: DKK 120,000/kiln reference. Actual savings require on-site technical assessment.</p>
</div>
</body></html>`;
}

// ── GET preview (dev only) ────────────────────────────────────────────────────

export async function GET() {
  const html = buildHtml({
    contact: { name: "Lars Andersen", email: "lars@savvaerk.dk", job: "Production Manager", company: "Skovs Sawmill" },
    kiln: { country:"EE", product:"lumber", kilns:3, m3:60, hours:6500, price:0.14, currency:"EUR", fanpow:45, heat:"boiler", age:1, inv:false, healthScore:20, totalSavingsDkk:85000 },
    selectedPackage: "Upgrade Complete",
    submittedAt: new Date().toLocaleString("en-GB", { timeZone:"Europe/Copenhagen", dateStyle:"full", timeStyle:"short" }),
  });
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = EstimatorSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the highlighted fields." }, { status: 400 });
  }

  const { website, ...data } = parsed.data;
  if (website) return NextResponse.json({ ok: true }); // honeypot

  const apiKey = process.env.RESEND_API_KEY;
  const toRaw = process.env.ROI_TO_EMAIL ?? process.env.CONTACT_TO_EMAIL ?? site.email;
  const fromRaw =
    process.env.ROI_FROM_EMAIL ??
    process.env.CONTACT_FROM_EMAIL ??
    `Nicholaisen <noreply@updates.${new URL(site.url).hostname.split(".").slice(-2).join(".")}>`;

  const submittedAt = new Date().toLocaleString("en-GB", {
    timeZone: "Europe/Copenhagen",
    dateStyle: "full",
    timeStyle: "short",
  });

  const html = buildHtml({ ...data, submittedAt });

  const pkgLabel = data.selectedPackage ? ` — ${data.selectedPackage}` : "";
  const countryName = COUNTRY_NAMES[data.kiln.country] ?? data.kiln.country;
  const subject = `Kiln Estimator: ${data.contact.name} (${countryName}, ${data.kiln.kilns} kiln${data.kiln.kilns > 1 ? "s" : ""})${pkgLabel}`;

  if (!apiKey) {
    console.info("[kiln-estimator] RESEND_API_KEY not set — skipping email send");
    return NextResponse.json({ ok: true });
  }

  const resend = new Resend(apiKey);
  const toAddresses = toRaw.split(",").map((s) => s.trim()).filter(Boolean);

  try {
    const result = await resend.emails.send({
      from: fromRaw,
      to: toAddresses,
      replyTo: data.contact.email,
      subject,
      html,
    });
    if (result.error) {
      console.error("[kiln-estimator] resend rejected send", result.error, { from: fromRaw, to: toAddresses });
      return NextResponse.json({ error: "Email could not be sent. Please try again." }, { status: 502 });
    }
    console.info("[kiln-estimator] sent", { id: result.data?.id, to: toAddresses });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[kiln-estimator] send error", err);
    return NextResponse.json({ error: "Email could not be sent. Please try again." }, { status: 500 });
  }
}
