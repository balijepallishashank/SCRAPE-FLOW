import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkWorkflowDefinitions() {
  console.log("🔍 Checking workflow definitions...\n");

  const workflows = await prisma.workflow.findMany({
    select: {
      id: true,
      name: true,
      definition: true,
      status: true,
    },
    take: 5,
  });

  workflows.forEach((workflow) => {
    console.log(`\n📋 Workflow: ${workflow.name}`);
    console.log(`   ID: ${workflow.id}`);
    console.log(`   Status: ${workflow.status}`);
    
    try {
      const def = JSON.parse(workflow.definition || "{}");
      console.log(`   Nodes: ${def.nodes?.length || 0}`);
      console.log(`   Edges: ${def.edges?.length || 0}`);
      
      if (def.nodes && def.nodes.length > 0) {
        const types = def.nodes.map((n: any) => n.data?.type || "unknown");
        console.log(`   Node types: ${types.join(", ")}`);
        
        const hasLaunchBrowser = def.nodes.some((n: any) => n.data?.type === "LAUNCH_BROWSER");
        console.log(`   Has LAUNCH_BROWSER: ${hasLaunchBrowser ? "✅" : "❌"}`);
      } else {
        console.log(`   ❌ No nodes in definition!`);
      }
    } catch (e) {
      console.log(`   ❌ Error parsing definition: ${e}`);
    }
  });
}

checkWorkflowDefinitions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
