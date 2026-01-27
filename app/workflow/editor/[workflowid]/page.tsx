import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Editor from "@/app/workflow/_components/Editor";

/* ------------------------------------------------------------------ */
/* Workflow Editor Page */
/* ------------------------------------------------------------------ */

export default async function Page({ params }: { params: Promise<{ workflowid: string }> }) {
  const { workflowid } = await params;
  const { userId } = await auth();

  if (!userId) {
    return <div>Unauthenticated</div>;
  }

  // Ensure we filter by the authenticated user
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: workflowid,
      userId,
    },
  });

  if (!workflow) {
    return <div>Workflow not found</div>;
  }

  // Serialize the workflow for client components
  const serializable = JSON.parse(JSON.stringify(workflow));

  return <Editor workflow={serializable} />;
}