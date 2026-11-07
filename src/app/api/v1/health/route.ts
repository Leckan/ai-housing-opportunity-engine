import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    mode: "demonstration",
    dataClassification: "synthetic",
    services: { parcels: "demo provider", zoning: "fictional sample library", ai: "deterministic demo responses" },
  });
}
