import { NextResponse } from "next/server";
import { calculateFeasibility, defaultFeasibilityInputs, demoParcels } from "@/lib/domain";
import { feasibilityRequestSchema } from "@/lib/api-schemas";

export async function POST(request: Request, context: { params: Promise<unknown> }) {
  const { parcelId } = await context.params as { parcelId: string };
  const parcel = demoParcels.find((candidate) => candidate.id === parcelId || candidate.apn === parcelId);
  if (!parcel) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Demonstration parcel not found." } }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const parsed = feasibilityRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Feasibility inputs are invalid." } }, { status: 400 });
  const inputs = { ...defaultFeasibilityInputs, ...parsed.data, parcelAreaSqFt: parsed.data.parcelAreaSqFt ?? parcel.areaSqFt };
  const result = calculateFeasibility(inputs);
  return NextResponse.json({ data: { parcelId: parcel.id, inputs, result }, dataClassification: "synthetic demonstration", disclaimer: "Illustrative assumptions only; not a valuation, code determination, or development recommendation." });
}
