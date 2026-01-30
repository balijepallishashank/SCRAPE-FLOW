import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkWorkflows() {
  console.log("🔍 Checking all workflows in database...\n");

  const workflows = await prisma.workflow.findMany({
    select: {
      id: true,
      name: true,
      userId: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (workflows.length === 0) {
    console.log("❌ No workflows found in database");
    return;
  }

  console.log(`✅ Found ${workflows.length} workflow(s):\n`);
  
  workflows.forEach((workflow, index) => {
    console.log(`${index + 1}. ${workflow.name}`);
    console.log(`   ID: ${workflow.id}`);
    console.log(`   User ID: ${workflow.userId}`);
    console.log(`   Status: ${workflow.status}`);
    console.log(`   Created: ${workflow.createdAt.toLocaleString()}`);
    console.log("");
  });

  // Check for the specific example workflow
  const exampleWorkflow = workflows.find(w => w.name === "Example Web Scraper");
  if (exampleWorkflow) {
    console.log("🎯 Example Web Scraper found!");
    console.log(`   Access URL: /workflow/editor/${exampleWorkflow.id}`);
  } else {
    console.log("⚠️  Example Web Scraper not found");
  }
}

checkWorkflows()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
