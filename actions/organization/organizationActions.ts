"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createOrganization(data: {
  name: string;
  description?: string;
  plan?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const org = await prisma.organization.create({
    data: {
      name: data.name,
      description: data.description,
      ownerId: userId,
      plan: data.plan || "free",
      members: {
        create: {
          userId,
          role: "OWNER",
          canCreateWorkflow: true,
          canEditWorkflow: true,
          canDeleteWorkflow: true,
          canExecuteWorkflow: true,
          canManageTeam: true,
        },
      },
    },
    include: {
      members: true,
    },
  });

  revalidatePath("/settings/team");
  return org;
}

export async function getUserOrganizations() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return await prisma.organization.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      members: {
        select: {
          id: true,
          userId: true,
          role: true,
        },
      },
      _count: {
        select: {
          members: true,
          workflows: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function inviteMember(data: {
  orgId: string;
  userId: string;
  role: "ADMIN" | "MEMBER" | "VIEWER";
  permissions?: {
    canCreateWorkflow?: boolean;
    canEditWorkflow?: boolean;
    canDeleteWorkflow?: boolean;
    canExecuteWorkflow?: boolean;
    canManageTeam?: boolean;
  };
}) {
  const { userId: currentUserId } = await auth();
  if (!currentUserId) throw new Error("Unauthorized");

  // Check if current user has permission to invite
  const currentMember = await prisma.organizationMember.findUnique({
    where: {
      orgId_userId: {
        orgId: data.orgId,
        userId: currentUserId,
      },
    },
  });

  if (!currentMember || !currentMember.canManageTeam) {
    throw new Error("You don't have permission to invite members");
  }

  const member = await prisma.organizationMember.create({
    data: {
      orgId: data.orgId,
      userId: data.userId,
      role: data.role,
      canCreateWorkflow: data.permissions?.canCreateWorkflow ?? true,
      canEditWorkflow: data.permissions?.canEditWorkflow ?? (data.role !== "VIEWER"),
      canDeleteWorkflow: data.permissions?.canDeleteWorkflow ?? false,
      canExecuteWorkflow: data.permissions?.canExecuteWorkflow ?? true,
      canManageTeam: data.permissions?.canManageTeam ?? (data.role === "ADMIN"),
    },
  });

  revalidatePath("/settings/team");
  return member;
}

export async function removeMember(orgId: string, userId: string) {
  const { userId: currentUserId } = await auth();
  if (!currentUserId) throw new Error("Unauthorized");

  // Check if current user has permission
  const currentMember = await prisma.organizationMember.findUnique({
    where: {
      orgId_userId: {
        orgId,
        userId: currentUserId,
      },
    },
  });

  if (!currentMember || !currentMember.canManageTeam) {
    throw new Error("You don't have permission to remove members");
  }

  await prisma.organizationMember.delete({
    where: {
      orgId_userId: {
        orgId,
        userId,
      },
    },
  });

  revalidatePath("/settings/team");
}

export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: "ADMIN" | "MEMBER" | "VIEWER",
  permissions?: {
    canCreateWorkflow?: boolean;
    canEditWorkflow?: boolean;
    canDeleteWorkflow?: boolean;
    canExecuteWorkflow?: boolean;
    canManageTeam?: boolean;
  }
) {
  const { userId: currentUserId } = await auth();
  if (!currentUserId) throw new Error("Unauthorized");

  // Check if current user has permission
  const currentMember = await prisma.organizationMember.findUnique({
    where: {
      orgId_userId: {
        orgId,
        userId: currentUserId,
      },
    },
  });

  if (!currentMember || !currentMember.canManageTeam) {
    throw new Error("You don't have permission to update member roles");
  }

  const updated = await prisma.organizationMember.update({
    where: {
      orgId_userId: {
        orgId,
        userId,
      },
    },
    data: {
      role,
      ...permissions,
    },
  });

  revalidatePath("/settings/team");
  return updated;
}
