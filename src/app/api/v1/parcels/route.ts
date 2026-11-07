import { NextRequest, NextResponse } from "next/server";
import { searchParcels, DEMO_NOTICE } from "@/lib/domain";
import { parcelListQuerySchema } from "@/lib/api-schemas";

export async function GET(request: NextRequest) {
  const parsed = parcelListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_QUERY", message: "Invalid parcel search parameters." } }, { status: 400 });
  const { q, category, page, pageSize } = parsed.data;
  const results = searchParcels(q, category);
  return NextResponse.json({
    data: results.slice((page - 1) * pageSize, page * pageSize),
    pagination: { page, pageSize, total: results.length, hasMore: page * pageSize < results.length },
    dataClassification: "synthetic demonstration",
    notice: DEMO_NOTICE,
  });
}
