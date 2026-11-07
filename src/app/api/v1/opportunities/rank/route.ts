import { NextRequest, NextResponse } from "next/server";
import { demoParcels } from "@/lib/domain";
import { rankQuerySchema } from "@/lib/api-schemas";

export async function GET(request: NextRequest) {
  const parsed = rankQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_QUERY", message: "Invalid ranking parameters." } }, { status: 400 });
  const { minScore, limit } = parsed.data;
  const data = demoParcels.filter((p) => p.score >= minScore).toSorted((a, b) => b.score - a.score).slice(0, limit);
  return NextResponse.json({ data, total: data.length, weights: { parcelSize: 0.3, housingNeed: 0.27, transit: 0.2, infrastructure: 0.13, constraintScreen: 0.1 }, dataClassification: "synthetic demonstration" });
}
