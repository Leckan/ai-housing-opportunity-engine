import { NextResponse } from "next/server";
import { demoJurisdictions } from "@/lib/domain";

export async function GET() {
  return NextResponse.json({ data: demoJurisdictions, dataClassification: "configuration metadata", note: "Target jurisdictions only; source coverage is unverified except for the synthetic Los Angeles County demo sample." });
}
