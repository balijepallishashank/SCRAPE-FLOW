import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkRateLimitForUser, incrementRateLimitForUser } from "@/lib/rateLimit";
import { stripe } from "../../../../lib/stripe";

export async function POST(request: Request) {
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

    const body = await request.json();
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const packages: Record<string, { credits: number; amount: number; name: string }> = {
      standard: { credits: 100, amount: 10, name: "100 Credits" },
      popular: { credits: 500, amount: 40, name: "500 Credits" },
      premium: { credits: 1000, amount: 70, name: "1000 Credits" },
    };

    const selectedPackage = packages[packageId];

    if (!selectedPackage) {
      return NextResponse.json(
        { error: "Invalid package" },
        { status: 400 }
      );
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: selectedPackage.amount * 100,
            product_data: {
              name: selectedPackage.name,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/billing?success=1` ,
      cancel_url: `${origin}/billing?canceled=1` ,
      metadata: {
        userId,
        credits: String(selectedPackage.credits),
        packageId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error processing purchase:", error);
    return NextResponse.json(
      { error: "Failed to process purchase" },
      { status: 500 }
    );
  }
}
