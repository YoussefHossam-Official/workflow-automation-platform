import mongoose, { Schema, Document } from 'mongoose';
import { EngineLog } from '../types/engine.js';

export interface IExecutionLog extends Document {
  workflowId: string;
  runId: string;
  userId: string;
  logs: EngineLog[];
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  createdAt: Date;
  updatedAt: Date;
}

const EngineLogSchema = new Schema<EngineLog>({
  at: { type: String, required: true },
  stepId: String,
  level: { type: String, enum: ['INFO','WARN','ERROR'], required: true },
  message: { type: String, required: true },
  meta: { type: Schema.Types.Mixed }
}, { _id: false });

const ExecutionLogSchema = new Schema<IExecutionLog>({
  workflowId: { type: String, required: true, index: true },
  runId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  logs: { type: [EngineLogSchema], default: [] },
  status: { type: String, enum: ['SUCCESS','FAILED','RUNNING'], default: 'RUNNING' }
}, { timestamps: true });

export const ExecutionLogModel = mongoose.model<IExecutionLog>('ExecutionLog', ExecutionLogSchema);
