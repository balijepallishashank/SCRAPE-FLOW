"use client";

import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { TaskParam, TaskParamType } from "@/types/task";
import StringParam from "./param/StringParam";
import BrowserInstanceParam from "./param/BrowserInstanceParam";
import { AppNode } from "@/types/appNode";

function NodeParamField({
  param,
  nodeId,
}: {
  param: TaskParam;
  nodeId: string;
}) {
  const { updateNodeData, getNode } = useReactFlow();

  const node = getNode(nodeId) as AppNode | undefined;

  // ✅ ALWAYS return a string (important!)
  const value = (node?.data.inputs?.[param.name] as string) ?? "";

  const updateNodeParamValue = useCallback(
    (newValue: string) => {
      updateNodeData(nodeId, {
        inputs: {
          ...(node?.data.inputs ?? {}),
          [param.name]: newValue,
        },
      });
    },
    [nodeId, updateNodeData, param.name, node?.data.inputs]
  );

  switch (param.type) {
    case TaskParamType.STRING:
      return (
        <StringParam
          param={param}
          value={value}
          updateNodeParamValue={updateNodeParamValue}
        />
      );

    case TaskParamType.BROWSER_INSTANCE:
      return (
        <BrowserInstanceParam
          param={param}
          value={value}
          updateNodeParamValue={updateNodeParamValue}
        />
      );

    default:
      return (
        <div className="w-full">
          <p className="text-xs text-muted-foreground">
            Not implemented: {param.type}
          </p>
        </div>
      );
  }
}

export default NodeParamField;