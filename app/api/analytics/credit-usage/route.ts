import { NextResponse } from "next/server";
import { getCreditUsageData } from "@/actions/analytics/creditUsageActions";

export async function GET() {
  try {
    const data = await getCreditUsageData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch credit usage" },
      { status: 500 }
    );
  }
}
