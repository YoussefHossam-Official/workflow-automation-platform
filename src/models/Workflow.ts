import mongoose, { Schema, Document } from 'mongoose';
import { StepConfig } from '../types/engine.js';

export interface IWorkflow extends Document {
  name: string;
  description?: string;
  owner: string;
  steps: StepConfig[];
  entryStepId: string;
  createdAt: Date;
  updatedAt: Date;
}

const StepSchema = new Schema<StepConfig>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['TRIGGER','ACTION'], required: true },
  ref: { type: String, required: true },
  next: { type: String, default: null },
  retry: {
    maxAttempts: { type: Number, default: 1 },
    backoffMs: { type: Number, default: 0 }
  },
  stopOnFailure: { type: Boolean, default: true },
  params: { type: Schema.Types.Mixed }
}, { _id: false });

const WorkflowSchema = new Schema<IWorkflow>({
  scheduleCron: { type: String, default: null },
  name: { type: String, required: true },
  description: String,
  owner: { type: String, required: true, index: true },
  steps: { type: [StepSchema], default: [] },
  entryStepId: { type: String, required: true }
}, { timestamps: true });

export const WorkflowModel = mongoose.model<IWorkflow>('Workflow', WorkflowSchema);
