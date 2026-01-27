"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

const RATE_LIMITS = {
  EXECUTION: { limit: 100, windowSize: 3600 }, // 100 per hour
  API: { limit: 1000, windowSize: 3600 }, // 1000 per hour
  WEBHOOK: { limit: 500, windowSize: 3600 }, // 500 per hour
};

export async function checkRateLimit(limitType: "EXECUTION" | "API" | "WEBHOOK"): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const config = RATE_LIMITS[limitType];
  const now = new Date();

  // Get or create rate limit record
  let rateLimit = await prisma.rateLimit.findUnique({
    where: {
      userId_limitType: {
        userId,
        limitType,
      },
    },
  });

  if (!rateLimit) {
    rateLimit = await prisma.rateLimit.create({
      data: {
        userId,
        limitType,
        count: 0,
        windowStart: now,
        windowSize: config.windowSize,
      },
    });
  }

  // Check if window has expired
  const windowEnd = new Date(rateLimit.windowStart);
  windowEnd.setSeconds(windowEnd.getSeconds() + rateLimit.windowSize);

  if (now > windowEnd) {
    // Reset window
    rateLimit = await prisma.rateLimit.update({
      where: { id: rateLimit.id },
      data: {
        count: 0,
        windowStart: now,
      },
    });
  }

  const allowed = rateLimit.count < config.limit;
  const remaining = Math.max(0, config.limit - rateLimit.count);

  return {
    allowed,
    remaining,
    resetAt: windowEnd,
  };
}

export async function incrementRateLimit(limitType: "EXECUTION" | "API" | "WEBHOOK") {
  const { userId } = await auth();

  if (!userId) {
    return;
  }

  await prisma.rateLimit.update({
    where: {
      userId_limitType: {
        userId,
        limitType,
      },
    },
    data: {
      count: {
        increment: 1,
      },
    },
  });
}

export async function getRateLimitStatus() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const limits = await Promise.all([
    checkRateLimit("EXECUTION"),
    checkRateLimit("API"),
    checkRateLimit("WEBHOOK"),
  ]);

  return {
    execution: limits[0],
    api: limits[1],
    webhook: limits[2],
  };
}
