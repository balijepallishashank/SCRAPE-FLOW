import cron, { ScheduledTask } from "node-cron";
import prisma from "@/lib/prisma";
import { executeWorkflow } from "@/actions/workflows/executeWorkflow";

class WorkflowScheduler {
  private scheduledTasks: Map<string, ScheduledTask> = new Map();

  async initialize() {
    console.log("🕐 Initializing workflow scheduler...");

    // Load all enabled schedules
    const schedules = await prisma.workflowSchedule.findMany({
      where: {
        enabled: true,
      },
      include: {
        workflow: true,
      },
    });

    schedules.forEach((schedule) => {
      this.scheduleWorkflow(schedule);
    });

    console.log(`✅ Loaded ${schedules.length} scheduled workflows`);
  }

  scheduleWorkflow(schedule: any) {
    // Validate cron expression
    if (!cron.validate(schedule.cronExpression)) {
      console.error(`Invalid cron expression for schedule ${schedule.id}: ${schedule.cronExpression}`);
      return;
    }

    // Remove existing schedule if any
    this.unscheduleWorkflow(schedule.id);

    // Create new scheduled task
    const task = cron.schedule(
      schedule.cronExpression,
      async () => {
        console.log(`⏰ Executing scheduled workflow: ${schedule.workflow.name}`);

        try {
          await executeWorkflow(schedule.workflowId);

          // Update last run time
          await prisma.workflowSchedule.update({
            where: { id: schedule.id },
            data: {
              lastRunAt: new Date(),
            },
          });

          console.log(`✅ Scheduled workflow executed: ${schedule.workflow.name}`);
        } catch (error) {
          console.error(`❌ Error executing scheduled workflow ${schedule.workflow.name}:`, error);
        }
      },
      {
        timezone: schedule.timezone || "UTC",
      }
    );

    this.scheduledTasks.set(schedule.id, task);
    console.log(`📅 Scheduled workflow: ${schedule.workflow.name} (${schedule.cronExpression})`);
  }

  unscheduleWorkflow(scheduleId: string) {
    const task = this.scheduledTasks.get(scheduleId);
    if (task) {
      task.stop();
      this.scheduledTasks.delete(scheduleId);
      console.log(`⏹️ Unscheduled workflow: ${scheduleId}`);
    }
  }

  async refreshSchedules() {
    console.log("🔄 Refreshing workflow schedules...");

    // Stop all current tasks
    this.scheduledTasks.forEach((task) => task.stop());
    this.scheduledTasks.clear();

    // Reload schedules
    await this.initialize();
  }

  stopAll() {
    console.log("🛑 Stopping all scheduled workflows...");
    this.scheduledTasks.forEach((task) => task.stop());
    this.scheduledTasks.clear();
  }
}

export const workflowScheduler = new WorkflowScheduler();
