import { NextResponse } from "next/server";
import { demoJurisdictions, demoRegionalIndicators, DEMO_NOTICE } from "@/lib/domain";

export async function GET() {
  return NextResponse.json({
    data: { scope: "Southern California pilot", indicators: demoRegionalIndicators, jurisdictions: demoJurisdictions },
    dataClassification: "synthetic demonstration placeholders",
    notice: DEMO_NOTICE,
  });
}
