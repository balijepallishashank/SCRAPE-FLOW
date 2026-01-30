import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { stripe } from "../../../../lib/stripe";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const credits = Number(session.metadata?.credits || 0);
    const packageId = session.metadata?.packageId;

    if (userId && credits > 0) {
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

      const updatedBalance = await prisma.userBalance.update({
        where: { userId },
        data: { credits: userBalance.credits + credits },
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: "PURCHASE_CREDITS",
          entityType: "UserBalance",
          entityId: userId,
          metadata: JSON.stringify({
            packageId,
            creditsAdded: credits,
            amount: session.amount_total ? session.amount_total / 100 : null,
            newBalance: updatedBalance.credits,
            timestamp: new Date().toISOString(),
          }),
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
