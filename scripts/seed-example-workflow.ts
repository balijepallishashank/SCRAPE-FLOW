import { PrismaClient } from "@prisma/client";
import { TaskType } from "../types/task";

const prisma = new PrismaClient();

async function seedExampleWorkflow() {
  console.log("🌱 Seeding example workflow...");

  // Get the first user (you'll need to replace this with actual user ID)
  const users = await prisma.$queryRaw<Array<{ userId: string }>>`
    SELECT DISTINCT userId FROM Workflow LIMIT 1
  `;

  if (!users || users.length === 0) {
    console.error("❌ No users found. Please sign in first to create a user.");
    return;
  }

  const userId = users[0].userId;
  console.log(`✅ Found user: ${userId}`);

  // Check if example workflow already exists
  const existingWorkflow = await prisma.workflow.findFirst({
    where: {
      userId,
      name: "Example Web Scraper",
    },
  });

  if (existingWorkflow) {
    console.log("⚠️  Example workflow already exists. Deleting old version...");
    await prisma.workflow.delete({
      where: { id: existingWorkflow.id },
    });
  }

  // Create a complete workflow with proper node connections
  const workflowDefinition = {
    nodes: [
      {
        id: "node_1",
        type: "FlowScrapeNode",
        position: { x: 100, y: 100 },
        data: {
          type: TaskType.LAUNCH_BROWSER,
          inputs: {
            "Website Url": "https://example.com",
          },
        },
      },
      {
        id: "node_2",
        type: "FlowScrapeNode",
        position: { x: 100, y: 250 },
        data: {
          type: TaskType.NAVIGATE_URL,
          inputs: {
            URL: "https://example.com",
          },
        },
      },
      {
        id: "node_3",
        type: "FlowScrapeNode",
        position: { x: 100, y: 400 },
        data: {
          type: TaskType.WAIT_FOR_ELEMENT,
          inputs: {
            Selector: "body",
            "Timeout (ms)": "5000",
          },
        },
      },
      {
        id: "node_4",
        type: "FlowScrapeNode",
        position: { x: 100, y: 550 },
        data: {
          type: TaskType.EXTRACT_TEXT,
          inputs: {
            Html: "",
            Selector: "h1",
          },
        },
      },
      {
        id: "node_5",
        type: "FlowScrapeNode",
        position: { x: 100, y: 700 },
        data: {
          type: TaskType.PAGE_TO_HTML,
          inputs: {
            "Web page": "",
          },
        },
      },
      {
        id: "node_6",
        type: "FlowScrapeNode",
        position: { x: 450, y: 550 },
        data: {
          type: TaskType.TRANSFORM_DATA,
          inputs: {
            "Input Data": "",
            "Transformation Type": "trim",
            Options: "",
          },
        },
      },
      {
        id: "node_7",
        type: "FlowScrapeNode",
        position: { x: 450, y: 750 },
        data: {
          type: TaskType.DELIVER_VIA_WEBHOOK,
          inputs: {
            "Target URL": "https://webhook.site/unique-id",
            Body: '{"title": "{{TRANSFORM_DATA}}"}',
          },
        },
      },
    ],
    edges: [
      {
        id: "edge_1_2",
        source: "node_1",
        target: "node_2",
        sourceHandle: "Web page",
        targetHandle: "Web page",
      },
      {
        id: "edge_2_3",
        source: "node_2",
        target: "node_3",
        sourceHandle: "Web page",
        targetHandle: "Web page",
      },
      {
        id: "edge_3_4",
        source: "node_3",
        target: "node_5",
        sourceHandle: "Web page",
        targetHandle: "Web page",
      },
      {
        id: "edge_4_5",
        source: "node_5",
        target: "node_4",
        sourceHandle: "HTML",
        targetHandle: "Html",
      },
      {
        id: "edge_4_6",
        source: "node_4",
        target: "node_6",
        sourceHandle: "Extracted Text",
        targetHandle: "Input Data",
      },
      {
        id: "edge_6_7",
        source: "node_6",
        target: "node_7",
        sourceHandle: "Transformed Data",
        targetHandle: "Body",
      },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
  };

  // Create the workflow
  const workflow = await prisma.workflow.create({
    data: {
      userId,
      name: "Example Web Scraper",
      description: "A complete example workflow that scrapes a website, extracts text from the H1 tag, captures the full HTML, transforms the data, and sends it via webhook.",
      status: "PUBLISHED",
      definition: JSON.stringify(workflowDefinition),
      isTemplate: true,
      templateCategory: "Web Scraping",
    },
  });

  console.log(`✅ Example workflow created successfully!`);
  console.log(`   ID: ${workflow.id}`);
  console.log(`   Name: ${workflow.name}`);
  console.log(`   Status: ${workflow.status}`);
  console.log(`\n📝 Workflow Details:`);
  console.log(`   - Launches a browser`);
  console.log(`   - Navigates to example.com`);
  console.log(`   - Waits for page to load`);
  console.log(`   - Extracts H1 text`);
  console.log(`   - Gets full page HTML`);
  console.log(`   - Transforms data into JSON`);
  console.log(`   - Delivers to webhook`);
  console.log(`\n🔗 Access it at: /workflow/editor/${workflow.id}`);
}

seedExampleWorkflow()
  .catch((error) => {
    console.error("❌ Error seeding example workflow:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
