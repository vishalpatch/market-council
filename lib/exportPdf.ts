import type { CommitteeResult, Verdict } from "./committee-types";

const PW = 612;   // letter width pts
const PH = 792;   // letter height pts
const M  = 56;    // margin
const CW = PW - M * 2; // content width

function verdictStr(v: Verdict) {
  // Plain text only — jsPDF's standard font can't measure/render glyphs like
  // ▲▼■, which breaks width math and causes right-aligned text to overflow.
  if (v === "BULLISH") return "BULLISH";
  if (v === "BEARISH") return "BEARISH";
  return "NEUTRAL";
}

function verdictRgb(v: Verdict): [number, number, number] {
  if (v === "BULLISH") return [0, 160, 90];
  if (v === "BEARISH") return [200, 50, 70];
  return [120, 120, 120];
}

export async function exportCommitteePdf(
  thesis: string,
  result: CommitteeResult
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  let y = M;

  function newPage() {
    doc.addPage();
    y = M;
  }

  function guard(needed: number) {
    if (y + needed > PH - M) newPage();
  }

  function rule(color: [number, number, number] = [210, 210, 210]) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.5);
    doc.line(M, y, PW - M, y);
    y += 14;
  }

  function label(text: string) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text(text.toUpperCase(), M, y);
    y += 13;
  }

  function body(
    text: string,
    opts: {
      size?: number;
      bold?: boolean;
      color?: [number, number, number];
      x?: number;
      maxW?: number;
    } = {}
  ): number {
    const size = opts.size ?? 10;
    const x = opts.x ?? M;
    const maxW = opts.maxW ?? CW;
    doc.setFontSize(size);
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setTextColor(...(opts.color ?? ([30, 30, 30] as [number, number, number])));
    const lines = doc.splitTextToSize(text, maxW) as string[];
    doc.text(lines, x, y);
    return lines.length;
  }

  // ── Branding header ───────────────────────────────────────────────────
  doc.setFillColor(0, 220, 130);
  doc.rect(M, y - 6, 3, 32, "F");

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text("MARKET COUNCIL", M + 12, y + 10);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("Investment Committee Report", M + 12, y + 24);

  doc.setFontSize(8);
  doc.setTextColor(170, 170, 170);
  doc.text(
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    PW - M,
    y + 10,
    { align: "right" }
  );

  y += 42;
  rule([0, 200, 110]);
  y += 6;

  // ── Thesis ────────────────────────────────────────────────────────────
  label("Thesis Under Review");
  const thesisLines = body(thesis, { size: 11, maxW: CW });
  y += thesisLines * 15 + 10;

  label("AI Summary");
  const summaryLines = body(result.thesisSummary, { size: 10, color: [60, 60, 60] });
  y += summaryLines * 14 + 14;
  rule();
  y += 4;

  // ── Analyst opinions ─────────────────────────────────────────────────
  label("Analyst Opinions");
  y += 4;

  for (const persona of result.personas) {
    guard(90);

    const rgb = verdictRgb(persona.verdict);

    // Name (single column, left-aligned, wrapped to content width)
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    const nameLines = doc.splitTextToSize(persona.name, CW) as string[];
    doc.text(nameLines, M, y);
    y += nameLines.length * 14;

    // Role
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(140, 140, 140);
    const roleLines = doc.splitTextToSize(persona.role, CW) as string[];
    doc.text(roleLines, M, y);
    y += roleLines.length * 12;

    // Verdict + confidence on its own line, left-aligned and colored
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...rgb);
    const vLines = doc.splitTextToSize(
      `${verdictStr(persona.verdict)}  ·  Confidence ${persona.confidence}/10`,
      CW
    ) as string[];
    doc.text(vLines, M, y);
    y += vLines.length * 13 + 3;

    // Reasoning
    const lines = body(persona.reasoning, { size: 9.5, color: [70, 70, 70] });
    y += lines * 13 + 12;

    doc.setDrawColor(225, 225, 225);
    doc.setLineWidth(0.3);
    doc.line(M, y, PW - M, y);
    y += 12;
  }

  y += 4;

  // ── Chairman's verdict ────────────────────────────────────────────────
  guard(140);
  rule([200, 200, 200]);
  y += 4;

  label("Chairman's Verdict");
  y += 2;

  const cRgb = verdictRgb(result.chairman.verdict);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  const titleLines = doc.splitTextToSize("The Chairman  ·  Final Synthesis", CW) as string[];
  doc.text(titleLines, M, y);
  y += titleLines.length * 16 + 2;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...cRgb);
  const cvLines = doc.splitTextToSize(
    `${verdictStr(result.chairman.verdict)}  ·  Score ${result.chairman.overallScore}/100`,
    CW
  ) as string[];
  doc.text(cvLines, M, y);
  y += cvLines.length * 15 + 5;

  label("Recommendation");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...cRgb);
  const recLines = doc.splitTextToSize(result.chairman.recommendation, CW) as string[];
  doc.text(recLines, M, y);
  y += recLines.length * 15 + 6;

  label("Summary");
  const chairLines = body(result.chairman.summary, {
    size: 10,
    color: [60, 60, 60],
  });
  y += chairLines * 14 + 20;

  rule();

  // ── Disclaimer ────────────────────────────────────────────────────────
  guard(28);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  const discLines = doc.splitTextToSize(
    "For informational and educational purposes only. Not financial advice. Past AI analysis does not guarantee future results.",
    CW
  ) as string[];
  doc.text(discLines, M, y);

  const filename = `market-council-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
