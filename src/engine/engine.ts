import { v4 as uuidv4 } from 'uuid';
import { ExecutionContext, StepConfig, Workflow, StepHandler, StepResult } from '../types/engine.js';
import { Registry } from './registry.js';
import { ExecutionLogModel } from '../models/ExecutionLog.js';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { JobModel } from '../models/Job.js';

function nowISO() { return new Date().toISOString(); }

const redisConn = new IORedis();
const jobQueue = new Queue('workflow-jobs', { connection: redisConn });

export class Engine {
  async runWorkflow(workflow: Workflow, userId: string, initialData: Record<string, unknown> = {}) {
    const runId = uuidv4();
    const ctx: ExecutionContext = {
      workflowId: String(workflow._id || ''),
      runId,
      userId,
      data: { ...initialData },
      logs: [],
      now: () => new Date()
    };

    await ExecutionLogModel.create({
      workflowId: ctx.workflowId, runId, userId, logs: [], status: 'RUNNING'
    });

    const stepById = new Map<string, StepConfig>();
    workflow.steps.forEach(s => stepById.set(s.id, s));

    let currentId: string | null = workflow.entryStepId;
    try {
      while (currentId) {
        const step = stepById.get(currentId);
        if (!step) throw new Error(`Step not found: ${currentId}`);

        const handler = Registry.get(step.ref) as StepHandler;
        const retry = step.retry || { maxAttempts: 1, backoffMs: 0 };
        const stopOnFailure = step.stopOnFailure ?? true;

        let attempt = 0;
        let result: StepResult | null = null;
        let error: any = null;

        while (attempt < retry.maxAttempts) {
          attempt++;
          try {
            ctx.logs.push({ at: nowISO(), stepId: step.id, level: 'INFO', message: `Running ${step.ref} (attempt ${attempt})` });
            result = await handler.run(ctx, (step as any).params);
            if (result.ok) break;
            else throw new Error(result.error || 'Step failed');
          } catch (err:any) {
            error = err;
            ctx.logs.push({ at: nowISO(), stepId: step.id, level: 'ERROR', message: `Error: ${err.message || err}`, meta: { attempt } });
            if (attempt < retry.maxAttempts && retry.backoffMs > 0) {
              await new Promise(r => setTimeout(r, retry.backoffMs));
            }
          }
        }

        if (!result || !result.ok) {
          // Save Job for retry
          const createdJob = await JobModel.create({
            workflowId: ctx.workflowId, runId, userId,
            step, attempt, status: 'FAILED', error: String(error?.message || error)
          });
          // push to queue for background retry processing
          try { await jobQueue.add('job-'+String(createdJob._id), { jobId: String(createdJob._id) }); } catch(err){ console.warn('Queue push failed', err); }
          if (stopOnFailure) throw error || new Error('Step failed');
          else currentId = step.next || null;
        } else {
          // Merge any returned data
          if (result.data) Object.assign(ctx.data, result.data);
          currentId = step.next || null;
        }
      }

      await ExecutionLogModel.updateOne(
        { workflowId: ctx.workflowId, runId },
        { $set: { status: 'SUCCESS', logs: ctx.logs } }
      );
      return { ok: true, runId, data: ctx.data };
    } catch (err:any) {
      await ExecutionLogModel.updateOne(
        { workflowId: ctx.workflowId, runId },
        { $set: { status: 'FAILED', logs: ctx.logs.concat([{ at: nowISO(), level: 'ERROR', message: String(err?.message || err) }]) } }
      );
      return { ok: false, runId, error: String(err?.message || err) };
    }
  }
}
