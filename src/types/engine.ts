export type UUID = string;

export type StepKind = 'TRIGGER' | 'ACTION';

export interface RetryPolicy {
  maxAttempts: number;       // includes the first try
  backoffMs: number;         // constant backoff for simplicity
}

export interface BaseStepConfig {
  id: UUID;
  name: string;
  type: StepKind;
  ref: string;               // identifier in registry, e.g., 'http.webhook' or 'utils.delay'
  next?: UUID | null;        // next step id
  retry?: RetryPolicy;
  stopOnFailure?: boolean;   // default true
}

export interface TriggerConfig extends BaseStepConfig {
  type: 'TRIGGER';
  // triggers are externally invoked; payload flows into context
}

export interface ActionConfig extends BaseStepConfig {
  type: 'ACTION';
  // Action-specific configuration bag
  params?: Record<string, unknown>;
}

export type StepConfig = TriggerConfig | ActionConfig;

export interface Workflow {
  _id?: string;
  name: string;
  description?: string;
  owner: string; // user id
  steps: StepConfig[];       // DAG-like but here it's linear via next
  entryStepId: UUID;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExecutionContext {
  workflowId: string;
  runId: UUID;
  userId: string;
  data: Record<string, unknown>; // mutable shared bag
  logs: EngineLog[];
  now(): Date;
}

export interface EngineLog {
  at: string; // ISO date
  stepId?: UUID;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  meta?: Record<string, unknown>;
}

export interface StepResult {
  ok: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export interface StepHandler {
  // Run the step using ctx and params; can read/update ctx.data
  run(ctx: ExecutionContext, params?: Record<string, unknown>): Promise<StepResult>;
}

export interface StepRegistry {
  has(ref: string): boolean;
  get(ref: string): StepHandler;
  register(ref: string, handler: StepHandler): void;
}
