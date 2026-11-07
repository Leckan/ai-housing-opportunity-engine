import { NextResponse } from "next/server";
import { demoParcels, DEMO_NOTICE } from "@/lib/domain";
import { reportRequestSchema } from "@/lib/api-schemas";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = reportRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_INPUT", message: "A valid parcelId and optional format are required." } }, { status: 400 });
  const parcel = demoParcels.find((p) => p.id === parsed.data.parcelId || p.apn === parsed.data.parcelId);
  if (!parcel) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Demonstration parcel was not found." } }, { status: 404 });
  const report = { title: "AHOE Demonstration Property Brief", notice: DEMO_NOTICE, generatedAt: new Date().toISOString(), parcel, disclaimer: "Synthetic property and indicator records. Not legal, financial, engineering, environmental, or entitlement advice." };
  if (parsed.data.format === "csv") {
    const rows = [
      "field,value",
      `parcel_id,${parcel.id}`,
      `apn,${parcel.apn}`,
      `site_label,${parcel.address}`,
      `city,${parcel.city}`,
      `area_sq_ft,${parcel.areaSqFt}`,
      `opportunity_score,${parcel.score}`,
      `category,${parcel.category}`,
      `confidence,${parcel.confidence}`,
      "data_classification,synthetic demonstration data",
    ];
    return new NextResponse(rows.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename=ahoe-${parcel.apn.toLowerCase()}-demo.csv` } });
  }
  return NextResponse.json({ data: report, format: parsed.data.format, dataClassification: "synthetic demonstration" });
}
