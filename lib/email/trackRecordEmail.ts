import { Resend } from "resend";

export interface TrackRecordEmailData {
  ticker: string;
  thesis: string;
  verdict: string;
  priceAtSubmission: number;
  currentPrice: number;
  milestone: number; // 30 | 60 | 90
}

const GOLD = "#c8a45d";
const INK = "#100e0b";
const PAPER = "#ece6d9";
const MUTED = "#9b9486";
const UP = "#7ba890";
const DOWN = "#cb7e68";

function money(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function renderTrackRecordEmail(d: TrackRecordEmailData): {
  subject: string;
  html: string;
} {
  const movePct =
    d.priceAtSubmission > 0
      ? ((d.currentPrice - d.priceAtSubmission) / d.priceAtSubmission) * 100
      : 0;
  const up = movePct >= 0;
  const moveColor = up ? UP : DOWN;
  const moveStr = `${up ? "+" : ""}${movePct.toFixed(1)}%`;

  const subject = `${d.ticker} — your ${d.milestone}-day thesis check-in`;

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${INK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${INK};padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${INK};border:1px solid rgba(236,230,217,0.1);border-radius:16px;overflow:hidden;">
          <tr><td style="padding:28px 32px 0;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:3px;color:${GOLD};text-transform:uppercase;">Market Council</div>
          </td></tr>
          <tr><td style="padding:16px 32px 0;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:${PAPER};font-weight:normal;">
              Your ${d.ticker} thesis at ${d.milestone} days
            </div>
          </td></tr>
          <tr><td style="padding:16px 32px 0;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1px;color:${MUTED};text-transform:uppercase;">Committee verdict</div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:${GOLD};margin-top:4px;">${d.verdict}</div>
          </td></tr>
          <tr><td style="padding:16px 32px 0;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1px;color:${MUTED};text-transform:uppercase;">Thesis</div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${PAPER};margin-top:6px;">${escapeHtml(d.thesis || d.ticker)}</div>
          </td></tr>
          <tr><td style="padding:24px 32px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(236,230,217,0.1);">
              <tr>
                <td style="padding:16px 0;font-family:Arial,Helvetica,sans-serif;">
                  <div style="font-size:11px;color:${MUTED};text-transform:uppercase;letter-spacing:1px;">At submission</div>
                  <div style="font-size:20px;color:${PAPER};margin-top:4px;">${money(d.priceAtSubmission)}</div>
                </td>
                <td style="padding:16px 0;font-family:Arial,Helvetica,sans-serif;">
                  <div style="font-size:11px;color:${MUTED};text-transform:uppercase;letter-spacing:1px;">Now</div>
                  <div style="font-size:20px;color:${PAPER};margin-top:4px;">${money(d.currentPrice)}</div>
                </td>
                <td style="padding:16px 0;font-family:Arial,Helvetica,sans-serif;text-align:right;">
                  <div style="font-size:11px;color:${MUTED};text-transform:uppercase;letter-spacing:1px;">Move</div>
                  <div style="font-size:20px;color:${moveColor};margin-top:4px;font-weight:bold;">${moveStr}</div>
                </td>
              </tr>
            </table>
          </td></tr>
          <tr><td style="padding:8px 32px 28px;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:${MUTED};border-top:1px solid rgba(236,230,217,0.1);padding-top:16px;">
              For informational and educational purposes only — not financial advice.
            </div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject, html };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendTrackRecordEmail(
  to: string,
  data: TrackRecordEmailData
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  const resend = new Resend(key);
  const from = process.env.RESEND_FROM ?? "Market Council <onboarding@resend.dev>";
  const { subject, html } = renderTrackRecordEmail(data);
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) throw new Error(error.message ?? "Email send failed");
}
