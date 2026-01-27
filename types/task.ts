export enum TaskType {
  LAUNCH_BROWSER = "LAUNCH_BROWSER",
  PAGE_TO_HTML = "PAGE_TO_HTML",
  EXTRACT_TEXT = "EXTRACT_TEXT",
  FILL_FORM = "FILL_FORM",
  CLICK_ELEMENT = "CLICK_ELEMENT",
  SCREENSHOT = "SCREENSHOT",
  NAVIGATE_URL = "NAVIGATE_URL",
  WAIT_FOR_ELEMENT = "WAIT_FOR_ELEMENT",
  SCROLL_PAGE = "SCROLL_PAGE",
  DELIVER_VIA_WEBHOOK = "DELIVER_VIA_WEBHOOK",
  IF_CONDITION = "IF_CONDITION",
  FOR_EACH_LOOP = "FOR_EACH_LOOP",
  TRANSFORM_DATA = "TRANSFORM_DATA",
  SET_VARIABLE = "SET_VARIABLE",
  GET_VARIABLE = "GET_VARIABLE",
  TRY_CATCH = "TRY_CATCH",
  RETRY = "RETRY",
  STORE_DATA = "STORE_DATA",
  RETRIEVE_DATA = "RETRIEVE_DATA",
  PARALLEL_SPLIT = "PARALLEL_SPLIT",
  PARALLEL_JOIN = "PARALLEL_JOIN",
  CALL_WORKFLOW = "CALL_WORKFLOW",
  EVENT_TRIGGER = "EVENT_TRIGGER",
}

export enum TaskParamType {
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  BROWSER_INSTANCE = "BROWSER_INSTANCE",
} 

export interface TaskParam {
  name: string;
  type: TaskParamType;
  helperText?: string;
  required?: boolean;
  hideHandle?: boolean;
  value?: string;
  [key: string]: any;
} 

export interface WorkflowTask {
  type: TaskType;
  label: string;
  description?: string;
  icon: (props: any) => JSX.Element;
  isEntryPoint?: boolean;
  inputs: TaskParam[];
  // Optional outputs exposed by the task for downstream nodes
  outputs?: Array<{ name: string; type?: string; helperText?: string }>;
  // Optional credit cost per execution
  credits?: number;
}

