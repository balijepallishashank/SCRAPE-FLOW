"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TaskType } from "@/types/task";
import TaskMenuBtn from "./TaskMenuBtn";
import { TaskRegistry } from "@/lib/workflow/task/registry";

const categories: Array<{
  id: string;
  label: string;
  tasks: TaskType[];
}> = [
  {
    id: "interaction",
    label: "User interactions",
    tasks: [
      TaskType.LAUNCH_BROWSER,
      TaskType.NAVIGATE_URL,
      TaskType.FILL_FORM,
      TaskType.CLICK_ELEMENT,
      TaskType.SCROLL_PAGE,
    ],
  },
  {
    id: "extraction",
    label: "Data extraction",
    tasks: [
      TaskType.PAGE_TO_HTML,
      TaskType.EXTRACT_TEXT,
      TaskType.TRANSFORM_DATA,
    ],
  },
  {
    id: "storage",
    label: "Data storage",
    tasks: [TaskType.GET_VARIABLE, TaskType.SET_VARIABLE],
  },
  {
    id: "timing",
    label: "Timing controls",
    tasks: [TaskType.WAIT_FOR_ELEMENT],
  },
  {
    id: "delivery",
    label: "Result delivery",
    tasks: [TaskType.DELIVER_VIA_WEBHOOK],
  },
];

export default function TaskMenu() {
  return (
    <aside className="w-[320px] min-w-[320px] max-w-[320px] border-r border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-950/80 backdrop-blur-md h-full p-4 overflow-auto shadow-inner">
      <Accordion type="multiple" className="w-full" defaultValue={categories.map((c) => c.id)}>
        {categories.map((category) => (
          <AccordionItem key={category.id} value={category.id}>
            <AccordionTrigger className="font-semibold text-sm tracking-wide text-neutral-900 dark:text-white">
              {category.label}
            </AccordionTrigger>

            <AccordionContent className="flex flex-col gap-2">
              {category.tasks.map((task) => (
                <TaskMenuBtn key={task} taskType={task} />
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </aside>
  );
}