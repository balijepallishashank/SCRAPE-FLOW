"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { browserManager } from "@/lib/browser/BrowserManager";
import { fetchWithRetry } from "@/lib/http";
import { checkRateLimitForUser, incrementRateLimitForUser } from "@/lib/rateLimit";
import { Page } from "puppeteer";

export interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  timestamp: Date;
  level: "info" | "error" | "success";
  message: string;
  taskType?: string;
}

interface ExecutionContext {
  browserPage?: Page;
  variables: Record<string, any>;
}

interface PhaseRecord {
  taskType: string;
  status: "pending" | "running" | "completed" | "failed";
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  error?: string;
  creditsConsumed: number;
}

export async function executeWorkflow(workflowId: string): Promise<ExecutionResult> {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "Unauthenticated",
      logs: [],
    };
  }

  const rateLimit = await checkRateLimitForUser(userId, "EXECUTION");

  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. Try again after ${rateLimit.resetAt.toISOString()}.`,
      logs: [
        {
          timestamp: new Date(),
          level: "error",
          message: "Execution rate limit exceeded.",
          taskType: "RATE_LIMIT",
        },
      ],
    };
  }

  await incrementRateLimitForUser(userId, "EXECUTION");

  const workflow = await prisma.workflow.findFirst({
    where: {
      id: workflowId,
      userId,
    },
  });

  if (!workflow) {
    return {
      success: false,
      error: "Workflow not found",
      logs: [],
    };
  }

  // Create execution record
  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId,
      userId,
      status: "RUNNING",
      definition: workflow.definition,
      logs: "[]",
      phases: "[]",
    },
  });

  const logs: ExecutionLog[] = [];
  const phases: PhaseRecord[] = [];
  const context: ExecutionContext = {
    variables: {},
  };
  
  logs.push({
    timestamp: new Date(),
    level: "info",
    message: `Starting execution of workflow: ${workflow.name}`,
  });

  try {
    const definition = JSON.parse(workflow.definition);
    const { nodes, edges } = definition;

    // Validate workflow has nodes
    if (!nodes || nodes.length === 0) {
      throw new Error("Workflow is empty. Please add at least one node to execute it.");
    }

    // Find entry point (LAUNCH_BROWSER)
    const entryNode = nodes.find((node: any) => 
      node.data.type === "LAUNCH_BROWSER"
    );

    if (!entryNode) {
      throw new Error("Workflow must start with a 'Launch Browser' node. Please add it as the first node.");
    }

    logs.push({
      timestamp: new Date(),
      level: "info",
      message: "Found entry point: Launch Browser",
      taskType: "LAUNCH_BROWSER",
    });

    // Get website URL from entry node
    const websiteUrl = entryNode.data.inputs?.["Website Url"];

    if (!websiteUrl || websiteUrl.trim() === "") {
      throw new Error("Please enter a Website URL in the 'Launch Browser' node inputs to execute the workflow.");
    }

    logs.push({
      timestamp: new Date(),
      level: "info",
      message: `Target URL: ${websiteUrl}`,
      taskType: "LAUNCH_BROWSER",
    });

    // Record LAUNCH_BROWSER phase
    const launchPhase: PhaseRecord = {
      taskType: "LAUNCH_BROWSER",
      status: "running",
      inputs: { "Website Url": websiteUrl },
      outputs: {},
      creditsConsumed: 1,
    };
    phases.push(launchPhase);

    // Execute LAUNCH_BROWSER task
    try {
      const page = await browserManager.createPage();
      context.browserPage = page;
      
      await browserManager.navigateToUrl(page, websiteUrl);
      
      logs.push({
        timestamp: new Date(),
        level: "success",
        message: `Browser launched and navigated to ${websiteUrl}`,
        taskType: "LAUNCH_BROWSER",
      });

      launchPhase.status = "completed";
      launchPhase.outputs = { "Web page": "Browser instance active" };
      context.variables["browserPage"] = "active";
    } catch (error: any) {
      launchPhase.status = "failed";
      launchPhase.error = error.message;
      throw new Error(`Failed to launch browser: ${error.message}`);
    }

    // Execute connected tasks in order
    const result = await executeConnectedTasks(
      entryNode,
      nodes,
      edges,
      context,
      logs,
      phases
    );

    logs.push({
      timestamp: new Date(),
      level: "success",
      message: `Workflow execution completed successfully. Executed ${result} tasks.`,
    });

    // Cleanup
    if (context.browserPage) {
      await context.browserPage.close();
    }

    revalidatePath(`/workflow/editor/${workflowId}`);

    // Update execution record
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        logs: JSON.stringify(logs),
        phases: JSON.stringify(phases),
        output: JSON.stringify({
          executedTasks: result,
          url: websiteUrl,
          variables: context.variables,
        }),
      },
    });

    return {
      success: true,
      output: {
        executedTasks: result,
        url: websiteUrl,
        variables: context.variables,
      },
      logs,
    };
  } catch (error: any) {
    // Cleanup on error
    if (context.browserPage) {
      try {
        await context.browserPage.close();
      } catch {}
    }

    logs.push({
      timestamp: new Date(),
      level: "error",
      message: error.message || "Unknown error occurred",
    });

    // Update execution record
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        logs: JSON.stringify(logs),
        phases: JSON.stringify(phases),
        error: error.message,
      },
    });

    return {
      success: false,
      error: error.message,
      logs,
    };
  }
}

async function executeConnectedTasks(
  sourceNode: any,
  allNodes: any[],
  edges: any[],
  context: ExecutionContext,
  logs: ExecutionLog[],
  phases: PhaseRecord[]
): Promise<number> {
  let executedCount = 0;

  const connectedEdges = edges.filter((edge) => edge.source === sourceNode.id);

  for (const edge of connectedEdges) {
    const targetNode = allNodes.find((n) => n.id === edge.target);
    if (!targetNode) continue;

    const taskType = targetNode.data.type;
    const nodeInputs = targetNode.data.inputs || {};
    
    logs.push({
      timestamp: new Date(),
      level: "info",
      message: `Executing task: ${taskType}`,
      taskType,
    });

    // Create phase record
    const phase: PhaseRecord = {
      taskType,
      status: "running",
      inputs: nodeInputs,
      outputs: {},
      creditsConsumed: 1,
    };
    phases.push(phase);

    try {
      switch (taskType) {
        case "PAGE_TO_HTML":
          if (!context.browserPage) {
            throw new Error("No active browser page");
          }
          const html = await browserManager.getPageHtml(context.browserPage);
          context.variables["pageHtml"] = html.substring(0, 500) + "..."; // Store preview
          phase.outputs = { "HTML": html };
          logs.push({
            timestamp: new Date(),
            level: "success",
            message: `HTML extracted (${html.length} characters)`,
            taskType,
          });
          break;

        case "EXTRACT_TEXT":
          if (!context.browserPage) {
            throw new Error("No active browser page");
          }
          const selector = nodeInputs["Selector"];
          if (!selector) {
            throw new Error("Selector is required for EXTRACT_TEXT task");
          }
          const texts = await browserManager.extractTextWithSelector(
            context.browserPage,
            selector
          );
          context.variables["extractedText"] = texts;
          phase.outputs = { "Extracted Text": texts };
          logs.push({
            timestamp: new Date(),
            level: "success",
            message: `Extracted ${texts.length} elements with selector: ${selector}`,
            taskType,
          });
          break;

        case "CLICK_ELEMENT":
          if (!context.browserPage) {
            throw new Error("No active browser page");
          }
          const clickSelector = nodeInputs["Selector"];
          if (!clickSelector) {
            throw new Error("Selector is required for CLICK_ELEMENT task");
          }
          await browserManager.clickElement(context.browserPage, clickSelector);
          phase.outputs = { "Status": "Element clicked successfully" };
          logs.push({
            timestamp: new Date(),
            level: "success",
            message: `Clicked element: ${clickSelector}`,
            taskType,
          });
          break;

        case "FILL_FORM":
          if (!context.browserPage) {
            throw new Error("No active browser page");
          }
          const formSelector = nodeInputs["Selector"];
          const formValue = nodeInputs["Value"];
          if (!formSelector || !formValue) {
            throw new Error("Selector and Value are required for FILL_FORM task");
          }
          await browserManager.fillForm(context.browserPage, formSelector, formValue);
          phase.outputs = { "Status": "Form field filled successfully" };
          logs.push({
            timestamp: new Date(),
            level: "success",
            message: `Filled form field: ${formSelector}`,
            taskType,
          });
          break;

        case "SCREENSHOT":
          if (!context.browserPage) {
            throw new Error("No active browser page");
          }
          const screenshot = await browserManager.takeScreenshot(context.browserPage);
          context.variables["screenshot"] = `${(screenshot as Buffer).length} bytes`;
          phase.outputs = { "Screenshot": `${(screenshot as Buffer).length} bytes captured` };
          logs.push({
            timestamp: new Date(),
            level: "success",
            message: "Screenshot captured",
            taskType,
          });
          break;

        case "NAVIGATE_URL":
          if (!context.browserPage) {
            throw new Error("No active browser page");
          }
          const navigateUrl = nodeInputs["URL"];
          if (!navigateUrl) {
            throw new Error("URL is required for NAVIGATE_URL task");
          }
          await browserManager.navigateToUrl(context.browserPage, navigateUrl);
          phase.outputs = { "URL": navigateUrl, "Status": "Navigation successful" };
          logs.push({
            timestamp: new Date(),
            level: "success",
            message: `Navigated to: ${navigateUrl}`,
            taskType,
          });
          break;

        case "WAIT_FOR_ELEMENT":
          if (!context.browserPage) {
            throw new Error("No active browser page");
          }
          const waitSelector = nodeInputs["Selector"];
          const waitTimeout = nodeInputs["Timeout (ms)"] || "30000";
          if (!waitSelector) {
            throw new Error("Selector is required for WAIT_FOR_ELEMENT task");
          }
          await browserManager.waitForElement(
            context.browserPage,
            waitSelector,
            parseInt(waitTimeout, 10)
          );
          phase.outputs = { "Selector": waitSelector, "Status": "Element appeared" };
          logs.push({
            timestamp: new Date(),
            level: "success",
            message: `Element appeared: ${waitSelector}`,
            taskType,
          });
          break;

        case "SCROLL_PAGE":
          if (!context.browserPage) {
            throw new Error("No active browser page");
          }
          const scrollAmount = nodeInputs["Scroll Amount"];
          if (!scrollAmount) {
            throw new Error("Scroll Amount is required for SCROLL_PAGE task");
          }
          await browserManager.scrollPage(context.browserPage, scrollAmount);
          phase.outputs = { "Scroll Amount": scrollAmount, "Status": "Page scrolled" };
          logs.push({
            timestamp: new Date(),
            level: "success",
            message: `Scrolled page: ${scrollAmount}`,
            taskType,
          });
          break;

        case "DELIVER_VIA_WEBHOOK":
          const webhookUrl = nodeInputs["Target URL"];
          const webhookBody = nodeInputs["Body"];
          if (!webhookUrl || !webhookBody) {
            throw new Error("Target URL and Body are required for DELIVER_VIA_WEBHOOK task");
          }
          try {
            const response = await fetchWithRetry(webhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: webhookBody,
              timeoutMs: Number(process.env.WEBHOOK_TIMEOUT_MS ?? 10000),
              retries: Number(process.env.WEBHOOK_RETRIES ?? 2),
              backoffMs: Number(process.env.WEBHOOK_BACKOFF_MS ?? 500),
            });
            if (!response.ok) {
              throw new Error(`Webhook failed with status ${response.status}`);
            }
            phase.outputs = { "URL": webhookUrl, "Status": `Delivered (${response.status})` };
            logs.push({
              timestamp: new Date(),
              level: "success",
              message: `Webhook delivered to: ${webhookUrl}`,
              taskType,
            });
          } catch (error: any) {
            throw new Error(`Webhook delivery failed: ${error.message}`);
          }
          break;

        default:
          logs.push({
            timestamp: new Date(),
            level: "info",
            message: `Skipped unsupported task type: ${taskType}`,
            taskType,
          });
          phase.status = "completed";
          executedCount++;
          continue;
      }

      phase.status = "completed";
      executedCount++;

      // Recursively execute connected tasks
      const nestedCount = await executeConnectedTasks(
        targetNode,
        allNodes,
        edges,
        context,
        logs,
        phases
      );
      executedCount += nestedCount;
    } catch (error: any) {
      phase.status = "failed";
      phase.error = error.message;
      logs.push({
        timestamp: new Date(),
        level: "error",
        message: `Task failed: ${error.message}`,
        taskType,
      });
      throw error;
    }
  }

  return executedCount;
}
