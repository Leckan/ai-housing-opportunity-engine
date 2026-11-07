import { NextResponse } from "next/server";
import { demoParcels } from "@/lib/domain";
import { chatRequestSchema } from "@/lib/api-schemas";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_INPUT", message: "A valid message is required." } }, { status: 400 });
  const { message } = parsed.data;
  const selected = demoParcels.find((p) => p.id === parsed.data.parcelId) ?? demoParcels[0];
  const question = message.toLowerCase();
  let answer: string;
  if (question.includes("top") || question.includes("rank")) {
    answer = `The five highest-scoring synthetic sites are ${[...demoParcels].sort((a, b) => b.score - a.score).slice(0, 5).map((p) => `${p.apn} (${p.score}/100)`).join(", ")}. These model outputs are not verified properties or recommendations.`;
  } else if (question.includes("score")) {
    answer = "The demonstration index weights parcel size (30%), housing need indicator (27%), transit context (20%), infrastructure indicator (13%), and a constraint screen (10%). All inputs are synthetic; the model does not use protected characteristics.";
  } else {
    answer = `For ${selected.apn}, the workspace contains a synthetic ${selected.areaSqFt.toLocaleString()} sq ft site, ${selected.category} candidate label, and ${selected.score}/100 demonstration score. Verify ownership, current zoning, title, survey, environmental conditions, utilities, access, market assumptions, and community priorities using authoritative sources before any real decision.`;
  }
  return NextResponse.json({ answer, scope: "synthetic demonstration workspace", citations: [{ title: "Synthetic parcel inventory", id: selected.id }], disclaimer: "AI output is a research aid, not legal, financial, environmental, or entitlement advice." });
}
