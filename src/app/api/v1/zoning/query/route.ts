import { NextResponse } from "next/server";
import { answerDemoQuestion, demoZoningEvidence } from "@/lib/domain";
import { zoningQuerySchema } from "@/lib/api-schemas";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = zoningQuerySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_INPUT", message: "A valid zoning question is required." } }, { status: 400 });
  const { question, parcelId } = parsed.data;
  return NextResponse.json({
    answer: answerDemoQuestion(question),
    evidence: demoZoningEvidence,
    parcelId: parcelId ?? null,
    confidence: "low",
    dataClassification: "fictional demonstration excerpts",
    disclaimer: "This result is fictional and does not describe adopted zoning rules. Verify with the relevant local planning authority.",
  });
}
