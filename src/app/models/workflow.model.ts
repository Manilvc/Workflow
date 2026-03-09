export type WorkflowRole = 'holder' | 'issuer' | 'data_collector';

export type StageType = 'data_collection' | 'approval';

export type ApprovalMode = 'sequential' | 'parallel';

export type FieldInputType = 'text' | 'email' | 'date' | 'number' | 'dropdown' | 'file';

export type RequestStatus =
  | 'draft'
  | 'pending'
  | 'waiting_for_holder'
  | 'waiting_for_issuer'
  | 'waiting_for_collector'
  | 'approval_pending'
  | 'completed'
  | 'rejected';

export type ParticipantStatus = 'invited' | 'pending' | 'submitted';

export type ActivityType = 'info' | 'success' | 'warning' | 'error';

export interface WorkflowField {
  id: string;
  name: string;
  inputType: FieldInputType;
  required: boolean;
  validation: string;
  helperText: string;
  options: string[];
}

export interface Approver {
  id: string;
  role: string;
  order: number;
  required: boolean;
}

export interface WorkflowStage {
  id: string;
  name: string;
  type: StageType;
  description: string;
  collectorRole: WorkflowRole | null;
  fields: WorkflowField[];
  approvalMode: ApprovalMode;
  approvers: Approver[];
  collapsed: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  stages: WorkflowStage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  role: WorkflowRole;
  name: string;
  email: string;
  status: ParticipantStatus;
}

export interface ActivityEntry {
  timestamp: Date;
  message: string;
  type: ActivityType;
}

export type StageFlowStatus =
  | 'idle'
  | 'collecting_info'
  | 'request_sent'
  | 'waiting_for_submission'
  | 'deciding_issuer'
  | 'filling_form_self'
  | 'form_submitted'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'completed';

export interface StageFlowState {
  stageId: string;
  status: StageFlowStatus;
  participantName: string;
  participantEmail: string;
  issuerIsSelf: boolean | null;
  formData: Record<string, string>;
}

export interface CredentialRequest {
  id: string;
  subject: string;
  group: string;
  workflowName: string;
  workflow: Workflow;
  currentStageIndex: number;
  status: RequestStatus;
  participants: Participant[];
  activity: ActivityEntry[];
  createdAt: Date;
  assignedTo: string;
  data: Record<string, Record<string, unknown>>;
  stageFlows: Record<string, StageFlowState>;
}

export function createStageFlowState(stageId: string): StageFlowState {
  return {
    stageId,
    status: 'idle',
    participantName: '',
    participantEmail: '',
    issuerIsSelf: null,
    formData: {},
  };
}

export interface NavigationSection {
  id: string;
  label: string;
  icon: string;
}

export const WORKFLOW_ROLES: { value: WorkflowRole; label: string }[] = [
  { value: 'holder', label: 'Holder' },
  { value: 'issuer', label: 'Issuer' },
  { value: 'data_collector', label: 'Data Collector' },
];

export const FIELD_TYPES: { value: FieldInputType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'date', label: 'Date' },
  { value: 'number', label: 'Number' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'file', label: 'File Upload' },
];

export const APPROVER_ROLES: string[] = [
  'Issuer Admin',
  'Compliance Officer',
  'Department Head',
];

export const NAV_SECTIONS: NavigationSection[] = [
  { id: 'subject', label: 'Subject Details', icon: 'person' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'workflow', label: 'Workflow', icon: 'account_tree' },
  { id: 'builder', label: 'Workflow Builder', icon: 'build' },
];

export const REQUEST_STATUS_CONFIG: Record<RequestStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#6b7280' },
  pending: { label: 'Pending', color: '#3b82f6' },
  waiting_for_holder: { label: 'Waiting for Holder', color: '#f59e0b' },
  waiting_for_issuer: { label: 'Waiting for Issuer', color: '#f59e0b' },
  waiting_for_collector: { label: 'Waiting for Data Collector', color: '#f59e0b' },
  approval_pending: { label: 'Approval Pending', color: '#8b5cf6' },
  completed: { label: 'Completed', color: '#10b981' },
  rejected: { label: 'Rejected', color: '#ef4444' },
};

export function createEmptyField(): WorkflowField {
  return {
    id: crypto.randomUUID(),
    name: '',
    inputType: 'text',
    required: true,
    validation: '',
    helperText: '',
    options: [],
  };
}

export function createEmptyStage(index: number): WorkflowStage {
  return {
    id: crypto.randomUUID(),
    name: `Stage ${index + 1}`,
    type: 'data_collection',
    description: '',
    collectorRole: null,
    fields: [],
    approvalMode: 'sequential',
    approvers: [],
    collapsed: false,
  };
}

export function createEmptyApprover(order: number): Approver {
  return {
    id: crypto.randomUUID(),
    role: '',
    order: order,
    required: true,
  };
}

export function createEmptyWorkflow(): Workflow {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    stages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
