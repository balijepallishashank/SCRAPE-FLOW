import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete all failed runs for this user
    const result = await prisma.workflowExecution.deleteMany({
      where: {
        userId,
        status: "FAILED",
      },
    });

    return NextResponse.json(
      {
        message: "Failed runs deleted successfully",
        deletedCount: result.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting failed runs:", error);
    return NextResponse.json(
      { error: "Failed to delete runs" },
      { status: 500 }
    );
  }
}
