"use client";

import { Workflow } from "@prisma/client";
import React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import FlowEditor from "@/app/workflow/_components/FlowEditor";
import Topbar from "./nodes/Topbar/Topbar";
import TaskMenu from "./TaskMenu";
import EditorErrorBoundary from "./EditorErrorBoundary";

function Editor({ workflow }: { workflow: Workflow }) {
  return (
    <EditorErrorBoundary>
      <ReactFlowProvider>
        <div className="flex flex-col h-full w-full overflow-hidden">
          <Topbar
            title="Workflow editor"
            subtitle={workflow.name}
            workflowId={workflow.id}
          />
          <section className="flex h-full overflow-auto">
            <TaskMenu />
            <FlowEditor workflow={workflow} />
          </section>
        </div>
      </ReactFlowProvider>
    </EditorErrorBoundary>
  );
}

export default Editor;