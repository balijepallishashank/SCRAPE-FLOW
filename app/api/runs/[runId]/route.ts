import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { checkRateLimitForUser, incrementRateLimitForUser } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
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

  const { runId } = await params;

  try {
    // Verify the run belongs to the user
    const run = await prisma.workflowExecution.findFirst({
      where: {
        id: runId,
        userId,
      },
    });

    if (!run) {
      return NextResponse.json(
        { error: "Run not found" },
        { status: 404 }
      );
    }

    // Delete the run
    await prisma.workflowExecution.delete({
      where: { id: runId },
    });

    return NextResponse.json(
      { message: "Run deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting run:", error);
    return NextResponse.json(
      { error: "Failed to delete run" },
      { status: 500 }
    );
  }
}
