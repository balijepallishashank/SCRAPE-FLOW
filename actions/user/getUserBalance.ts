"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function getUserBalance() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Get or create user balance
  let userBalance = await prisma.userBalance.findUnique({
    where: { userId },
  });

  if (!userBalance) {
    userBalance = await prisma.userBalance.create({
      data: {
        userId,
        credits: 1000,
      },
    });
  }

  return userBalance.credits;
}
