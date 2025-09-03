import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { WorkflowModel } from '../models/Workflow.js';
import { Engine } from '../engine/engine.js';

/**
 * Public webhook endpoint to trigger workflows whose first step is http.webhook
 * POST /api/hooks/:workflowId
 * Body is used as initial data
 */
const router = Router();

router.post('/:workflowId', asyncHandler(async (req, res) => {
  const wf = await WorkflowModel.findById(req.params.workflowId).lean();
  if (!wf) return res.status(404).json({ message: 'Not found' });

  // Validate first step is a trigger http.webhook
  const entry = (wf as any).steps.find((s:any)=> s.id === wf.entryStepId);
  if (!entry || entry.type !== 'TRIGGER' || entry.ref !== 'http.webhook') {
    return res.status(400).json({ message: 'Workflow entry is not an http webhook trigger' });
  }

  const engine = new Engine();
  const result = await engine.runWorkflow(wf as any, wf.owner, req.body || {});
  res.json(result);
}));

export default router;
