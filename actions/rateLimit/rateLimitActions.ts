"use server";

import { auth } from "@clerk/nextjs/server";
import {
  checkRateLimitForUser,
  incrementRateLimitForUser,
  RateLimitType,
} from "@/lib/rateLimit";

export async function checkRateLimit(limitType: RateLimitType): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return checkRateLimitForUser(userId, limitType);
}

export async function incrementRateLimit(limitType: RateLimitType) {
  const { userId } = await auth();

  if (!userId) {
    return;
  }

  await incrementRateLimitForUser(userId, limitType);
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
