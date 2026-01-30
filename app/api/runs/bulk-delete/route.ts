import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { checkRateLimitForUser, incrementRateLimitForUser } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

  const body = await request.json().catch(() => null);
  const runIds = body?.runIds as string[] | undefined;

  if (!runIds || runIds.length === 0) {
    return NextResponse.json({ error: "No run IDs provided" }, { status: 400 });
  }

  try {
    const result = await prisma.workflowExecution.deleteMany({
      where: {
        id: { in: runIds },
        userId,
      },
    });

    return NextResponse.json(
      { message: "Runs deleted successfully", deletedCount: result.count },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting runs:", error);
    return NextResponse.json({ error: "Failed to delete runs" }, { status: 500 });
  }
}
