import React from "react";
import RunsPageHeaderActions from "./RunsPageHeaderActions";

interface RunsHeaderProps {
  runsCount: number;
}

export default function RunsPageHeader({ runsCount }: RunsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Workflow Runs</h1>
        <p className="text-muted-foreground">
          View execution history and logs ({runsCount} total)
        </p>
      </div>

      <RunsPageHeaderActions />
    </div>
  );
}
