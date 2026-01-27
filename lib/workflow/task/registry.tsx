import { LaunchBrowserTask } from "@/lib/workflow/LaunchBrowser";
import { PageToHtmlTask } from "./PageToHtml";
import { ExtractTextTask } from "./ExtractText";
import { FillFormTask } from "./FillForm";
import { ClickElementTask } from "./ClickElement";
import { ScreenshotTask } from "./Screenshot";
import { NavigateUrlTask } from "./NavigateUrl";
import { WaitForElementTask } from "./WaitForElement";
import { ScrollPageTask } from "./ScrollPage";
import { DeliverViaWebhookTask } from "./DeliverViaWebhook";
import { IfConditionTask } from "./IfCondition";
import { ForEachLoopTask } from "./ForEachLoop";
import { TransformDataTask } from "./TransformData";
import { SetVariableTask } from "./SetVariable";
import { GetVariableTask } from "./GetVariable";
import { TryCatchTask } from "./TryCatch";
import { RetryTask } from "./Retry";
import { StoreDataTask } from "./StoreData";
import { RetrieveDataTask } from "./RetrieveData";
import { ParallelSplitTask } from "./ParallelSplit";
import { ParallelJoinTask } from "./ParallelJoin";
import { CallWorkflowTask } from "./CallWorkflow";
import { EventTriggerTask } from "./EventTrigger";
import { TaskType, WorkflowTask } from "@/types/task";

export const TaskRegistry: Partial<Record<TaskType, WorkflowTask>> = {
  [TaskType.LAUNCH_BROWSER]: LaunchBrowserTask,
  [TaskType.PAGE_TO_HTML]: PageToHtmlTask,
  [TaskType.EXTRACT_TEXT]: ExtractTextTask,
  [TaskType.FILL_FORM]: FillFormTask,
  [TaskType.CLICK_ELEMENT]: ClickElementTask,
  [TaskType.SCREENSHOT]: ScreenshotTask,
  [TaskType.NAVIGATE_URL]: NavigateUrlTask,
  [TaskType.WAIT_FOR_ELEMENT]: WaitForElementTask,
  [TaskType.SCROLL_PAGE]: ScrollPageTask,
  [TaskType.DELIVER_VIA_WEBHOOK]: DeliverViaWebhookTask,
  [TaskType.IF_CONDITION]: IfConditionTask,
  [TaskType.FOR_EACH_LOOP]: ForEachLoopTask,
  [TaskType.TRANSFORM_DATA]: TransformDataTask,
  [TaskType.SET_VARIABLE]: SetVariableTask,
  [TaskType.GET_VARIABLE]: GetVariableTask,
  [TaskType.TRY_CATCH]: TryCatchTask,
  [TaskType.RETRY]: RetryTask,
  [TaskType.STORE_DATA]: StoreDataTask,
  [TaskType.RETRIEVE_DATA]: RetrieveDataTask,
  [TaskType.PARALLEL_SPLIT]: ParallelSplitTask,
  [TaskType.PARALLEL_JOIN]: ParallelJoinTask,
  [TaskType.CALL_WORKFLOW]: CallWorkflowTask,
  [TaskType.EVENT_TRIGGER]: EventTriggerTask,
};
