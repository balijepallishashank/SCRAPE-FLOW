import { NextResponse } from "next/server";
import { getCreditUsageData } from "@/actions/analytics/creditUsageActions";
import { auth } from "@clerk/nextjs/server";
import { checkRateLimitForUser, incrementRateLimitForUser } from "@/lib/rateLimit";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkRateLimitForUser(userId, "API");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", resetAt: rateLimit.resetAt.toISOString() },
        { status: 429 }
      );
    }

    await incrementRateLimitForUser(userId, "API");

    const data = await getCreditUsageData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch credit usage" },
      { status: 500 }
    );
  }
}
