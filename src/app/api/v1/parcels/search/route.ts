import { NextRequest, NextResponse } from "next/server";
import { searchParcels, DEMO_NOTICE } from "@/lib/domain";
import { parcelSearchQuerySchema } from "@/lib/api-schemas";

export async function GET(request: NextRequest) {
  const parsed = parcelSearchQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_QUERY", message: "Invalid parcel search parameters." } }, { status: 400 });
  const { q, category, maxArea, minArea, minScore } = parsed.data;
  const data = searchParcels(q, category).filter((parcel) => parcel.areaSqFt >= minArea && (!maxArea || parcel.areaSqFt <= maxArea) && parcel.score >= minScore);
  return NextResponse.json({ data, total: data.length, notice: DEMO_NOTICE, dataClassification: "synthetic demonstration" });
}
