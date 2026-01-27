"use client";

import { CreateFlowNode } from "@/lib/workflow/createFlowNode";
import { AppNode } from "@/types/appNode";
import { TaskType, TaskParamType } from "@/types/task";
import { Workflow } from "@prisma/client";
import React, { useCallback, useEffect, useRef, useState, createContext, useContext } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  OnNodesChange,
  OnEdgesChange,
  addEdge,
  Connection,
  Edge,
  ReactFlowInstance,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import NodeComponent from "./nodes/NodeComponents";
import { UpdateWorkflow } from "@/actions/workflows/updateWorkflow";
import { useMutation } from "@tanstack/react-query";
import { TaskRegistry } from "@/lib/workflow/task/registry";
import { validateWorkflow } from "@/lib/workflow/validation";

export type SaveState = "saved" | "saving" | "unsaved";

interface EditorContextType {
  saveState: SaveState;
  validationErrors: Map<string, string[]>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const EditorContext = createContext<EditorContextType>({
  saveState: "saved",
  validationErrors: new Map(),
  undo: () => {},
  redo: () => {},
  canUndo: false,
  canRedo: false,
});

export const useEditorContext = () => useContext(EditorContext);

const nodeTypes = {
  FlowScrapeNode: NodeComponent,
};

const snapGrid: [number, number] = [20, 20];
const fitViewOptions = { padding: 1 };

function FlowEditorInternal({ workflow }: { workflow: Workflow }) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { setViewport, toObject, fitView } = useReactFlow();
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance<AppNode> | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [validationErrors, setValidationErrors] = useState<Map<string, string[]>>(new Map());
  
  // Undo/Redo history
  const [history, setHistory] = useState<Array<{ nodes: AppNode[]; edges: Edge[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedo = useRef(false);

  // Autosave mutation
  const saveMutation = useMutation({
    mutationFn: UpdateWorkflow,
    onMutate: () => {
      setSaveState("saving");
    },
    onSuccess: () => {
      setSaveState("saved");
    },
    onError: (error) => {
      setSaveState("unsaved");
      toast.error("Failed to autosave workflow", {
        description: error.message,
      });
    },
  });

  // Add to history when nodes/edges change (for undo/redo)
  useEffect(() => {
    if (isUndoRedo.current) {
      isUndoRedo.current = false;
      return;
    }

    if (nodes.length === 0 && edges.length === 0) return;

    setSaveState("unsaved");

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
    
    // Keep only last 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    setHistory(newHistory);
  }, [nodes, edges]);

  // Validate nodes on change
  useEffect(() => {
    const errors = validateWorkflow(nodes, edges);
    const errorMap = new Map<string, string[]>();
    
    errors.forEach((error) => {
      if (error.nodeId) {
        const existing = errorMap.get(error.nodeId) || [];
        existing.push(error.message);
        errorMap.set(error.nodeId, existing);
      }
    });
    
    setValidationErrors(errorMap);
  }, [nodes, edges]);

  // Autosave effect - debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nodes.length > 0 || edges.length > 0) {
        const workflowDefinition = JSON.stringify(toObject());
        saveMutation.mutate({
          id: workflow.id,
          definition: workflowDefinition,
        });
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [nodes, edges]); // Only trigger on nodes/edges changes

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      // Edge validation
      if (!params.source || !params.target) return;

      const sourceNode = reactFlowInstance?.getNode(params.source) as AppNode | undefined;
      const targetNode = reactFlowInstance?.getNode(params.target) as AppNode | undefined;

      if (!sourceNode || !targetNode) {
        toast.error("Invalid connection");
        return;
      }

      const sourceTask = TaskRegistry[sourceNode.data.type];
      const targetTask = TaskRegistry[targetNode.data.type];

      if (!sourceTask || !targetTask) {
        toast.error("Invalid task type");
        return;
      }

      // Find the target input parameter
      const targetInput = targetTask.inputs?.find(
        (input) => input.name === params.targetHandle
      );

      if (!targetInput) {
        toast.error("Invalid connection point");
        return;
      }

      // Validate connection based on parameter type
      if (targetInput.type === TaskParamType.BROWSER_INSTANCE) {
        // Only allow connection from LAUNCH_BROWSER task
        if (sourceNode.data.type !== TaskType.LAUNCH_BROWSER) {
          toast.error("Browser instance can only be connected from Launch Browser task");
          return;
        }
      }

      // Check if target already has a connection to this handle
      const existingConnection = edges.find(
        (edge) => edge.target === params.target && edge.targetHandle === params.targetHandle
      );

      if (existingConnection) {
        toast.error("This input already has a connection");
        return;
      }

      setEdges((eds) => addEdge(params, eds));
      toast.success("Connection created");
    },
    [setEdges, reactFlowInstance, edges]
  );

  useEffect(() => {
    const def = workflow?.definition;

    // If definition is not a string or clearly invalid, fall back to a default flow
    let parsed: any | null = null;

    if (typeof def === "string") {
      const trimmed = def.trim();
      // Only attempt to parse if it looks like JSON (object or array)
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          parsed = JSON.parse(def);
        } catch (error) {
          console.error("Failed to parse workflow definition:", error);
          toast.error("Failed to load workflow. Loaded a default empty flow instead.");
        }
      } else {
        console.warn("workflow.definition is a non-JSON string, falling back to default flow.", def);
      }
    } else if (typeof def === "object" && def !== null) {
      parsed = def; // already parsed
    }

    if (!parsed) {
      // fallback initial flow (entry node)
      const fallback = { nodes: [CreateFlowNode(TaskType.LAUNCH_BROWSER)], edges: [] };
      setNodes(fallback.nodes);
      setEdges(fallback.edges as Edge[]);
      // keep viewport as-is
      return;
    }

    const flow = parsed;
    if (flow) {
      setNodes(flow.nodes || []);
      setEdges(flow.edges || []);
      if (flow.viewport) {
        const { x, y, zoom = 1 } = flow.viewport;
        setViewport({ x, y, zoom });
      }
    }
  }, [workflow, setNodes, setEdges, setViewport]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const typetype = event.dataTransfer.getData("application/reactflow");
 
      if (typeof typetype === "undefined" || !typetype || !reactFlowInstance) {
        return;
      }
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode = CreateFlowNode(typetype as TaskType, position);
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // Undo/Redo functions
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedo.current = true;
      const previousState = history[historyIndex - 1];
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  }, [historyIndex, history, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedo.current = true;
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
    }
  }, [historyIndex, history, setNodes, setEdges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Undo: Ctrl+Z (Cmd+Z on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y (Cmd+Shift+Z on Mac)
      if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        redo();
        return;
      }

      // Delete: Delete key only (not Backspace to avoid interfering with text input)
      if (event.key === 'Delete') {
        const selectedNodes = reactFlowInstance?.getNodes().filter(n => n.selected);
        const selectedEdges = reactFlowInstance?.getEdges().filter(e => e.selected);
        
        if (selectedNodes && selectedNodes.length > 0) {
          event.preventDefault();
          setNodes((nds) => nds.filter(n => !n.selected));
          toast.success(`Deleted ${selectedNodes.length} node(s)`);
        }
        
        if (selectedEdges && selectedEdges.length > 0) {
          event.preventDefault();
          setEdges((eds) => eds.filter(e => !e.selected));
          toast.success(`Deleted ${selectedEdges.length} edge(s)`);
        }
        return;
      }

      // Duplicate: Ctrl+D (Cmd+D on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        const selectedNodes = reactFlowInstance?.getNodes().filter(n => n.selected);
        
        if (selectedNodes && selectedNodes.length > 0) {
          const duplicatedNodes = selectedNodes.map(node => {
            const newNode = {
              ...node,
              id: `${node.id}-copy-${Date.now()}`,
              position: {
                x: node.position.x + 50,
                y: node.position.y + 50,
              },
              selected: false,
            };
            return newNode;
          });
          
          setNodes((nds) => [...nds.map(n => ({ ...n, selected: false })), ...duplicatedNodes]);
          toast.success(`Duplicated ${selectedNodes.length} node(s)`);
        }
        return;
      }

      // Fit View: Ctrl+1 (Cmd+1 on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === '1') {
        event.preventDefault();
        fitView();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [reactFlowInstance, undo, redo, setNodes, setEdges, fitView, historyIndex, history]);

  const editorContextValue: EditorContextType = {
    saveState,
    validationErrors,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };

  return (
    <EditorContext.Provider value={editorContextValue}>
      <main
        className="h-full w-full bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950"
        ref={reactFlowWrapper}
      >
        <ReactFlow<AppNode>
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          snapToGrid
          snapGrid={snapGrid}
          fitViewOptions={fitViewOptions}
        >
          <Controls position="top-left" fitViewOptions={fitViewOptions} />
          <Background variant={BackgroundVariant.Dots} gap={14} size={1} color="#e5e5e5" className="dark:opacity-20" />
        </ReactFlow>
      </main>
    </EditorContext.Provider>
  );
}

export default function FlowEditor({ workflow }: { workflow: Workflow }) {
  return (
    <ReactFlowProvider>
      <FlowEditorInternal workflow={workflow} />
    </ReactFlowProvider>
  );
}