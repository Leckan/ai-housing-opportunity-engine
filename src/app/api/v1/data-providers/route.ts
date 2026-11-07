import { NextResponse } from "next/server";
import { demoDataSources } from "@/lib/domain";

export async function GET() {
  return NextResponse.json({ data: demoDataSources, dataClassification: "provider configuration", liveConnections: 0 });
}
