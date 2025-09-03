import { Job as MJob, JobModel } from '../models/Job.js';
import { connectMongo } from '../db/mongo.js';
import { Worker, Queue, QueueScheduler } from 'bullmq';
import IORedis from 'ioredis';
import { Engine } from '../engine/engine.js';
import { WorkflowModel } from '../models/Workflow.js';
import { env } from '../config/env.js';

const connection = new IORedis(); // uses default REDIS_URL env if set

const queueName = 'workflow-jobs';
const queue = new Queue(queueName, { connection });
const scheduler = new QueueScheduler(queueName, { connection });

async function processJob(job: any) {
  // job.data contains jobModelId
  const jobId = job.data.jobId;
  const dbJob = await JobModel.findById(jobId).lean();
  if (!dbJob) {
    console.warn('DB job not found:', jobId);
    return;
  }
  const wf = await WorkflowModel.findById(dbJob.workflowId).lean();
  if (!wf) {
    console.warn('Workflow not found for job', dbJob.workflowId);
    return;
  }
  // Build partial workflow starting at step
  const map = new Map((wf as any).steps.map((s:any)=>[s.id,s]));
  const chain: any[] = [];
  let curr: any = dbJob.step;
  while (curr) {
    chain.push(curr);
    curr = curr.next ? map.get(curr.next) : null;
  }
  const wfPartial = { ...wf, steps: chain, entryStepId: dbJob.step.id };
  const engine = new Engine();
  const result = await engine.runWorkflow(wfPartial as any, dbJob.userId, {});
  const j = await JobModel.findById(dbJob._id);
  if (!j) return;
  j.attempt = (j.attempt || 0) + 1;
  j.status = result.ok ? 'COMPLETED' : 'FAILED';
  j.error = result.ok ? undefined : String((result as any).error || 'failed');
  await j.save();
}

async function main() {
  await connectMongo();
  // ensure scheduler/queue exist
  await scheduler.waitUntilReady();
  const worker = new Worker(queueName, async (job) => {
    try {
      await processJob(job);
    } catch (err:any) {
      console.error('Worker error', err);
      throw err;
    }
  }, { connection });

  worker.on('completed', (job) => console.log('job completed', job.id));
  worker.on('failed', (job, err) => console.error('job failed', job.id, err));
  console.log('Worker started, listening to queue:', queueName);
}

main().catch(err=>{ console.error(err); process.exit(1); });
