import prisma from "@/lib/prisma";

export type RateLimitType = "EXECUTION" | "API" | "WEBHOOK";

const RATE_LIMITS: Record<RateLimitType, { limit: number; windowSize: number }> = {
  EXECUTION: { limit: 100, windowSize: 3600 },
  API: { limit: 1000, windowSize: 3600 },
  WEBHOOK: { limit: 500, windowSize: 3600 },
};

export async function checkRateLimitForUser(userId: string, limitType: RateLimitType): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const config = RATE_LIMITS[limitType];
  const now = new Date();

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

  const windowEnd = new Date(rateLimit.windowStart);
  windowEnd.setSeconds(windowEnd.getSeconds() + rateLimit.windowSize);

  if (now > windowEnd) {
    rateLimit = await prisma.rateLimit.update({
      where: { id: rateLimit.id },
      data: {
        count: 0,
        windowStart: now,
      },
    });

    windowEnd.setSeconds(windowEnd.getSeconds() + rateLimit.windowSize);
  }

  const allowed = rateLimit.count < config.limit;
  const remaining = Math.max(0, config.limit - rateLimit.count);

  return {
    allowed,
    remaining,
    resetAt: windowEnd,
  };
}

export async function incrementRateLimitForUser(userId: string, limitType: RateLimitType) {
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
