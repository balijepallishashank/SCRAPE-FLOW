import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { packageId, credits, amount } = body;

    if (!packageId || !credits || amount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current user balance
    let userBalance = await prisma.userBalance.findUnique({
      where: { userId },
    });

    if (!userBalance) {
      userBalance = await prisma.userBalance.create({
        data: {
          userId,
          credits: 0,
        },
      });
    }

    // Update balance with new credits
    const updatedBalance = await prisma.userBalance.update({
      where: { userId },
      data: {
        credits: userBalance.credits + credits,
      },
    });

    // Create audit log for the purchase
    await prisma.auditLog.create({
      data: {
        userId,
        action: "PURCHASE_CREDITS",
        entityType: "UserBalance",
        entityId: userId,
        metadata: JSON.stringify({
          packageId,
          creditsAdded: credits,
          amount,
          newBalance: updatedBalance.credits,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      newBalance: updatedBalance.credits,
      creditsAdded: credits,
    });
  } catch (error) {
    console.error("Error processing purchase:", error);
    return NextResponse.json(
      { error: "Failed to process purchase" },
      { status: 500 }
    );
  }
}
