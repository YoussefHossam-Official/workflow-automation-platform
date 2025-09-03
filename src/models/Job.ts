import mongoose, { Schema, Document } from 'mongoose';
import { StepConfig } from '../types/engine.js';

export interface IJob extends Document {
  workflowId: string;
  runId: string;
  userId: string;
  step: StepConfig;
  attempt: number;
  status: 'PENDING' | 'FAILED' | 'COMPLETED';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>({
  workflowId: { type: String, required: true, index: true },
  runId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  step: { type: Schema.Types.Mixed, required: true },
  attempt: { type: Number, default: 0 },
  status: { type: String, enum: ['PENDING','FAILED','COMPLETED'], default: 'PENDING' },
  error: String
}, { timestamps: true });

export const JobModel = mongoose.model<IJob>('Job', JobSchema);
