import { NextResponse } from "next/server";
import { demoParcels, DEMO_NOTICE } from "@/lib/domain";

export async function GET(_request: Request, context: { params: Promise<unknown> }) {
  const { parcelId } = await context.params as { parcelId: string };
  const parcel = demoParcels.find((candidate) => candidate.id === parcelId || candidate.apn === parcelId);
  if (!parcel) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Demonstration parcel not found." } }, { status: 404 });
  return NextResponse.json({ data: parcel, dataClassification: "synthetic demonstration", notice: DEMO_NOTICE });
}
