import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

const STORAGE_KEY = "vault";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const record = await prisma.workflowStorage.findUnique({
    where: {
      workflowId_key: {
        workflowId: `credentials:${userId}`,
        key: STORAGE_KEY,
      },
    },
  });

  if (!record) {
    return NextResponse.json({ data: null });
  }

  return NextResponse.json({ data: record.value });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const payload = JSON.stringify(body);

  await prisma.workflowStorage.upsert({
    where: {
      workflowId_key: {
        workflowId: `credentials:${userId}`,
        key: STORAGE_KEY,
      },
    },
    create: {
      workflowId: `credentials:${userId}`,
      userId,
      key: STORAGE_KEY,
      value: payload,
    },
    update: {
      value: payload,
    },
  });

  return NextResponse.json({ ok: true });
}
