import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkExecutions() {
  console.log("🔍 Checking workflow executions...\n");

  const executions = await prisma.workflowExecution.findMany({
    select: {
      id: true,
      workflowId: true,
      userId: true,
      status: true,
      startedAt: true,
      completedAt: true,
      phases: true,
      workflow: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      startedAt: "desc",
    },
    take: 10,
  });

  if (executions.length === 0) {
    console.log("❌ No executions found in database");
    return;
  }

  console.log(`✅ Found ${executions.length} execution(s):\n`);

  executions.forEach((exec, index) => {
    console.log(`${index + 1}. ${exec.workflow.name}`);
    console.log(`   Execution ID: ${exec.id}`);
    console.log(`   Workflow ID: ${exec.workflowId}`);
    console.log(`   Status: ${exec.status}`);
    console.log(`   Started: ${exec.startedAt?.toLocaleString() || "N/A"}`);
    console.log(`   Completed: ${exec.completedAt?.toLocaleString() || "N/A"}`);
    console.log(`   Has Phases: ${exec.phases ? "✅ Yes" : "❌ No"}`);
    
    if (exec.phases) {
      try {
        const phases = JSON.parse(exec.phases);
        console.log(`   Phases Count: ${phases.length}`);
      } catch (e) {
        console.log(`   Phases: Invalid JSON`);
      }
    }
    
    console.log(`   View URL: /runs/${exec.id}`);
    console.log("");
  });

  // Check the most recent one in detail
  const latest = executions[0];
  if (latest.phases) {
    console.log("\n📋 Latest Execution Phase Details:");
    try {
      const phases = JSON.parse(latest.phases);
      phases.forEach((phase: any, idx: number) => {
        console.log(`\n  Phase ${idx + 1}: ${phase.taskType}`);
        console.log(`    Status: ${phase.status}`);
        console.log(`    Has Inputs: ${phase.inputs ? "✅" : "❌"}`);
        console.log(`    Has Outputs: ${phase.outputs ? "✅" : "❌"}`);
        if (phase.error) {
          console.log(`    Error: ${phase.error}`);
        }
      });
    } catch (e) {
      console.log("  ❌ Error parsing phases JSON");
    }
  }
}

checkExecutions()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
