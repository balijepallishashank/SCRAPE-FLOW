export enum WorkflowStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
}

export type Workflow = {
  definition: any;
  id: string;
  name: string;
};