export type HarnessSessionStatus = 'active' | 'archived' | 'error';

export type HarnessMessageRole = 'system' | 'user' | 'assistant' | 'tool';

export type HarnessRunTrigger = 'user' | 'automation' | 'retry';

export type HarnessRunStatus =
  | 'queued'
  | 'running'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type HarnessToolKind = 'read' | 'write' | 'destructive' | 'external';

export type HarnessToolCallStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'rejected';

export type HarnessApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired';

export type HarnessRiskLevel = 'low' | 'medium' | 'high';

export type HarnessPlanStepStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'blocked';

export interface HarnessSession {
  id: string;
  title: string | null;
  status: HarnessSessionStatus;
  mode: string;
  latestSummary: string | null;
  contextSnapshot: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface HarnessMessage {
  id: string;
  sessionId: string;
  role: HarnessMessageRole;
  content: string;
  structuredContent: Record<string, unknown>;
  toolName: string | null;
  toolCallId: string | null;
  createdAt: string;
}

export interface HarnessRun {
  id: string;
  sessionId: string;
  trigger: HarnessRunTrigger;
  status: HarnessRunStatus;
  model: string | null;
  userMessageId: string | null;
  resultSummary: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  startedAt: string;
  finishedAt: string | null;
}

export interface HarnessApprovalRequest {
  id: string;
  sessionId: string;
  runId: string | null;
  action: string;
  riskLevel: HarnessRiskLevel;
  reason: string | null;
  proposedInput: Record<string, unknown>;
  status: HarnessApprovalStatus;
  reviewerId: string | null;
  reviewedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface HarnessToolCallLog {
  id: string;
  sessionId: string;
  runId: string | null;
  toolName: string;
  kind: HarnessToolKind;
  status: HarnessToolCallStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  errorMessage: string | null;
  approvalRequestId: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export interface HarnessToolContext {
  sessionId: string;
  runId: string;
  userId?: string | null;
  now: string;
  metadata?: Record<string, unknown>;
}

export interface HarnessToolDefinition<Input = unknown, Output = unknown> {
  name: string;
  description: string;
  kind: HarnessToolKind;
  requiresApproval?: boolean;
  inputSchema?: unknown;
  outputSchema?: unknown;
  execute: (input: Input, context: HarnessToolContext) => Promise<Output>;
}

export interface HarnessKnowledgeSource {
  id: string;
  title: string;
  kind: 'doc' | 'table' | 'config' | 'prompt' | 'memory';
  description: string;
  location: string;
}

export interface HarnessPlanStep {
  id: string;
  title: string;
  status: HarnessPlanStepStatus;
  description?: string;
  toolName?: string;
  dependsOn?: string[];
}

export interface HarnessPlan {
  goal: string;
  steps: HarnessPlanStep[];
}
