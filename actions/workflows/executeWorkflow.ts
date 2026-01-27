"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { browserManager } from "@/lib/browser/BrowserManager";
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

export async function executeWorkflow(workflowId: string): Promise<ExecutionResult> {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: "Unauthenticated",
      logs: [],
    };
  }

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
    },
  });

  const logs: ExecutionLog[] = [];
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

    // Find entry point (LAUNCH_BROWSER)
    const entryNode = nodes.find((node: any) => 
      node.data.type === "LAUNCH_BROWSER"
    );

    if (!entryNode) {
      throw new Error("No entry point found in workflow");
    }

    logs.push({
      timestamp: new Date(),
      level: "info",
      message: "Found entry point: Launch Browser",
      taskType: "LAUNCH_BROWSER",
    });

    // Get website URL from entry node
    const websiteUrl = entryNode.data.inputs?.["Website Url"];

    if (!websiteUrl) {
      throw new Error("Website URL is required for Launch Browser task");
    }

    logs.push({
      timestamp: new Date(),
      level: "info",
      message: `Target URL: ${websiteUrl}`,
      taskType: "LAUNCH_BROWSER",
    });

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

      context.variables["browserPage"] = "active";
    } catch (error: any) {
      throw new Error(`Failed to launch browser: ${error.message}`);
    }

    // Execute connected tasks in order
    const executedTasks = await executeConnectedTasks(
      entryNode,
      nodes,
      edges,
      context,
      logs
    );

    logs.push({
      timestamp: new Date(),
      level: "success",
      message: `Workflow execution completed successfully. Executed ${executedTasks} tasks.`,
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
        output: JSON.stringify({
          executedTasks,
          url: websiteUrl,
          variables: context.variables,
        }),
      },
    });

    return {
      success: true,
      output: {
        executedTasks,
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
  logs: ExecutionLog[]
): Promise<number> {
  let executedCount = 0;

  const connectedEdges = edges.filter((edge) => edge.source === sourceNode.id);

  for (const edge of connectedEdges) {
    const targetNode = allNodes.find((n) => n.id === edge.target);
    if (!targetNode) continue;

    const taskType = targetNode.data.type;
    
    logs.push({
      timestamp: new Date(),
      level: "info",
      message: `Executing task: ${taskType}`,
      taskType,
    });

    try {
      switch (taskType) {
        case "PAGE_TO_HTML":
          if (!context.browserPage) {
            throw new Error("No active browser page");
          }
          const html = await browserManager.getPageHtml(context.browserPage);
          context.variables["pageHtml"] = html.substring(0, 500) + "..."; // Store preview
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
          const selector = targetNode.data.inputs?.["Selector"];
          if (!selector) {
            throw new Error("Selector is required for EXTRACT_TEXT task");
          }
          const texts = await browserManager.extractTextWithSelector(
            context.browserPage,
            selector
          );
          context.variables["extractedText"] = texts;
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
          const clickSelector = targetNode.data.inputs?.["Selector"];
          if (!clickSelector) {
            throw new Error("Selector is required for CLICK_ELEMENT task");
          }
          await browserManager.clickElement(context.browserPage, clickSelector);
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
          const formSelector = targetNode.data.inputs?.["Selector"];
          const formValue = targetNode.data.inputs?.["Value"];
          if (!formSelector || !formValue) {
            throw new Error("Selector and Value are required for FILL_FORM task");
          }
          await browserManager.fillForm(context.browserPage, formSelector, formValue);
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
          const navigateUrl = targetNode.data.inputs?.["URL"];
          if (!navigateUrl) {
            throw new Error("URL is required for NAVIGATE_URL task");
          }
          await browserManager.navigateToUrl(context.browserPage, navigateUrl);
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
          const waitSelector = targetNode.data.inputs?.["Selector"];
          const waitTimeout = targetNode.data.inputs?.["Timeout (ms)"] || "30000";
          if (!waitSelector) {
            throw new Error("Selector is required for WAIT_FOR_ELEMENT task");
          }
          await browserManager.waitForElement(
            context.browserPage,
            waitSelector,
            parseInt(waitTimeout, 10)
          );
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
          const scrollAmount = targetNode.data.inputs?.["Scroll Amount"];
          if (!scrollAmount) {
            throw new Error("Scroll Amount is required for SCROLL_PAGE task");
          }
          await browserManager.scrollPage(context.browserPage, scrollAmount);
          logs.push({
            timestamp: new Date(),
            level: "success",
            message: `Scrolled page: ${scrollAmount}`,
            taskType,
          });
          break;

        case "DELIVER_VIA_WEBHOOK":
          const webhookUrl = targetNode.data.inputs?.["Target URL"];
          const webhookBody = targetNode.data.inputs?.["Body"];
          if (!webhookUrl || !webhookBody) {
            throw new Error("Target URL and Body are required for DELIVER_VIA_WEBHOOK task");
          }
          try {
            const response = await fetch(webhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: webhookBody,
            });
            if (!response.ok) {
              throw new Error(`Webhook failed with status ${response.status}`);
            }
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
          continue;
      }

      executedCount++;

      // Recursively execute connected tasks
      const nestedCount = await executeConnectedTasks(
        targetNode,
        allNodes,
        edges,
        context,
        logs
      );
      executedCount += nestedCount;
    } catch (error: any) {
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
