import { NextResponse } from "next/server";
import { Resend } from "resend";
import { site } from "@/lib/site";
import { SubmissionSchema } from "@/features/kiln-upgrades-roi/schema";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']|[^\x20-\x7E]/g, (c) => {
    switch (c) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default:  return `&#${c.codePointAt(0)};`;
    }
  });
}

const e = (s: string | number) => escapeHtml(String(s));

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = SubmissionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the highlighted fields." }, { status: 400 });
  }

  const { website, ...data } = parsed.data;
  if (website) {
    return NextResponse.json({ ok: true });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toRaw = process.env.ROI_TO_EMAIL ?? process.env.CONTACT_TO_EMAIL ?? site.email;
  const to = toRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const from = process.env.CONTACT_FROM_EMAIL ?? `website@${new URL(site.url).host}`;

  const submittedAt = new Date().toLocaleString("da-DK", {
    timeZone: "Europe/Copenhagen",
    dateStyle: "full",
    timeStyle: "short",
  });

  const bodyHtml = `<!DOCTYPE html>
<html lang="da"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px 12px;background:#f5f0e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<div style="background:#fff;border-radius:8px;padding:28px 32px;max-width:560px;margin:0 auto;color:#1a1d22;">
  <h2 style="margin:0 0 16px;font-size:18px;color:#0e2238;">Ny ROI-forespørgsel — Kiln Upgrades</h2>
  <table style="border-collapse:collapse;width:100%;margin-bottom:20px;">
    <tr><td style="color:#5a7c9a;font-size:12px;width:160px;padding:4px 12px 4px 0;">Navn</td><td style="font-size:14px;padding:4px 0;">${e(data.contact.name)}</td></tr>
    <tr><td style="color:#5a7c9a;font-size:12px;padding:4px 12px 4px 0;">Email</td><td style="font-size:14px;padding:4px 0;"><a href="mailto:${e(data.contact.email)}" style="color:#0e2238;">${e(data.contact.email)}</a></td></tr>
    <tr><td style="color:#5a7c9a;font-size:12px;padding:4px 12px 4px 0;">Stilling</td><td style="font-size:14px;padding:4px 0;">${e(data.contact.job)}</td></tr>
    ${data.contact.company ? `<tr><td style="color:#5a7c9a;font-size:12px;padding:4px 12px 4px 0;">Virksomhed</td><td style="font-size:14px;padding:4px 0;">${e(data.contact.company)}</td></tr>` : ""}
  </table>
  <p style="margin:0;font-size:12px;color:#9aa5b4;">Indsendt: ${e(submittedAt)}</p>
</div>
</body></html>`;

  const bodyText = [
    `Ny ROI-forespørgsel — Kiln Upgrades`,
    `Indsendt: ${submittedAt}`,
    ``,
    `Navn:       ${data.contact.name}`,
    `Email:      ${data.contact.email}`,
    `Stilling:   ${data.contact.job}`,
    `Virksomhed: ${data.contact.company ?? "-"}`,
  ].join("\n");

  if (!apiKey) {
    console.info("[kiln-roi] received (no Resend key configured)", { contact: data.contact });
    return NextResponse.json({ ok: true });
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to,
      replyTo: data.contact.email,
      subject: "ROI-forespørgsel (Kiln): " + data.contact.name + (data.contact.company ? " — " + data.contact.company : ""),
      text: bodyText,
      html: bodyHtml,
    });
    if (result.error) {
      console.error("[kiln-roi] resend rejected send", result.error, { from, to });
      return NextResponse.json({ error: "Could not send right now. Please try again or call us." }, { status: 502 });
    }
    console.info("[kiln-roi] sent", { id: result.data?.id, to });
  } catch (err) {
    console.error("[kiln-roi] send failed", err);
    return NextResponse.json({ error: "Could not send right now. Please try again or call us." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
