import { NextRequest, NextResponse } from "next/server";
import { demoHousingIndicators, DEMO_NOTICE } from "@/lib/domain";

export async function GET(request: NextRequest) {
  const geography = request.nextUrl.searchParams.get("geography")?.trim().toLowerCase();
  const data = geography ? demoHousingIndicators.filter((record) => record.geography.toLowerCase().includes(geography)) : demoHousingIndicators;
  return NextResponse.json({ data, dataClassification: "synthetic demonstration", notice: DEMO_NOTICE });
}
