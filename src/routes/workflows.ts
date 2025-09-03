import { Router } from 'express';
import { z } from 'zod';
import asyncHandler from 'express-async-handler';
import { v4 as uuidv4 } from 'uuid';
import { WorkflowModel } from '../models/Workflow.js';
import { requireAuth } from '../middlewares/auth.js';
import { Engine } from '../engine/engine.js';
import { ExecutionLogModel } from '../models/ExecutionLog.js';
import { JobModel } from '../models/Job.js';

const router = Router();
router.use(requireAuth);

const workflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  entryStepId: z.string().uuid(),
  steps: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    type: z.enum(['TRIGGER','ACTION']),
    ref: z.string(),
    next: z.string().uuid().nullable().optional(),
    stopOnFailure: z.boolean().optional(),
    retry: z.object({
      maxAttempts: z.number().int().min(1),
      backoffMs: z.number().int().min(0)
    }).optional(),
    params: z.record(z.any()).optional()
  }))
});

router.post('/', asyncHandler(async (req, res) => {
  const body = workflowSchema.parse(req.body);
  const userId = (req as any).user.id as string;
  const wf = await WorkflowModel.create({ ...body, owner: userId });
  res.json(wf);
}));

router.get('/', asyncHandler(async (req, res) => {
  const userId = (req as any).user.id as string;
  const list = await WorkflowModel.find({ owner: userId }).lean();
  res.json(list);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const userId = (req as any).user.id as string;
  const wf = await WorkflowModel.findOne({ _id: req.params.id, owner: userId });
  if (!wf) return res.status(404).json({ message: 'Not found' });
  res.json(wf);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const body = workflowSchema.parse(req.body);
  const userId = (req as any).user.id as string;
  const wf = await WorkflowModel.findOneAndUpdate({ _id: req.params.id, owner: userId }, body, { new: true });
  if (!wf) return res.status(404).json({ message: 'Not found' });
  res.json(wf);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const userId = (req as any).user.id as string;
  await WorkflowModel.deleteOne({ _id: req.params.id, owner: userId });
  res.json({ ok: true });
}));

// Manually execute a workflow with initial data
router.post('/:id/execute', asyncHandler(async (req, res) => {
  const userId = (req as any).user.id as string;
  const wf = await WorkflowModel.findOne({ _id: req.params.id, owner: userId }).lean();
  if (!wf) return res.status(404).json({ message: 'Not found' });

  const engine = new Engine();
  const result = await engine.runWorkflow(wf as any, userId, req.body?.data || {});
  res.json(result);
}));

// Logs
router.get('/:id/logs', asyncHandler(async (req, res) => {
  const logs = await ExecutionLogModel.find({ workflowId: req.params.id }).sort({ createdAt: -1 }).lean();
  res.json(logs);
}));

// Jobs: list failed + retry
router.get('/:id/jobs', asyncHandler(async (req, res) => {
  const jobs = await JobModel.find({ workflowId: req.params.id }).sort({ createdAt: -1 }).lean();
  res.json(jobs);
}));

router.post('/jobs/:jobId/retry', asyncHandler(async (req, res) => {
  const job = await JobModel.findById(req.params.jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });

  // On retry, we simply re-run the specific step with same context minimalistically (fresh runId)
  const wf = await WorkflowModel.findById(job.workflowId).lean();
  if (!wf) return res.status(404).json({ message: 'Workflow not found for job' });

  // Reconstruct a minimal workflow starting at failed step
  const start = job.step;
  const map = new Map((wf as any).steps.map((s:any)=>[s.id,s]));
  // chain from this step onwards
  const chain: any[] = [];
  let curr: any = start;
  while (curr) {
    chain.push(curr);
    curr = curr.next ? map.get(curr.next) : null;
  }

  const wfPartial = { ...wf, steps: chain, entryStepId: start.id };
  const engine = new Engine();
  const result = await engine.runWorkflow(wfPartial as any, job.userId, {});
  job.status = result.ok ? 'COMPLETED' : 'FAILED';
  job.attempt += 1;
  job.error = result.ok ? undefined : String((result as any).error || 'failed');
  await job.save();

  res.json({ retried: true, result });
}));

export default router;
