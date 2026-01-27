"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function getFeatureFlags() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const flags = await prisma.featureFlag.findMany({
    where: { enabled: true },
  });

  // Filter flags based on enabledFor and rollout percentage
  const enabledFlags: Record<string, boolean> = {};

  for (const flag of flags) {
    let isEnabled = flag.enabled;

    // Check if user is in enabledFor list
    if (flag.enabledFor) {
      try {
        const enabledList = JSON.parse(flag.enabledFor);
        if (Array.isArray(enabledList) && enabledList.length > 0) {
          isEnabled = enabledList.includes(userId);
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    // Check rollout percentage
    if (isEnabled && flag.rolloutPercentage < 100) {
      // Simple hash-based rollout
      const hash = userId.split("").reduce((acc, char) => {
        return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
      }, 0);
      const percentage = Math.abs(hash) % 100;
      isEnabled = percentage < flag.rolloutPercentage;
    }

    enabledFlags[flag.name] = isEnabled;
  }

  return enabledFlags;
}

export async function isFeatureEnabled(featureName: string): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags[featureName] || false;
}

export async function createFeatureFlag(data: {
  name: string;
  description?: string;
  enabled?: boolean;
  rolloutPercentage?: number;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // TODO: Add admin permission check

  return await prisma.featureFlag.create({
    data: {
      name: data.name,
      description: data.description,
      enabled: data.enabled ?? false,
      rolloutPercentage: data.rolloutPercentage ?? 0,
    },
  });
}

export async function updateFeatureFlag(
  flagId: string,
  data: {
    enabled?: boolean;
    rolloutPercentage?: number;
    enabledFor?: string[];
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // TODO: Add admin permission check

  return await prisma.featureFlag.update({
    where: { id: flagId },
    data: {
      enabled: data.enabled,
      rolloutPercentage: data.rolloutPercentage,
      enabledFor: data.enabledFor ? JSON.stringify(data.enabledFor) : undefined,
    },
  });
}

export async function getAllFeatureFlags() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // TODO: Add admin permission check

  return await prisma.featureFlag.findMany({
    orderBy: { name: "asc" },
  });
}
