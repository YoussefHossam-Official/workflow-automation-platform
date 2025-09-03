import cron from 'node-cron';
import { WorkflowModel } from '../models/Workflow.js';
import { Engine } from '../engine/engine.js';
import { connectMongo } from '../db/mongo.js';

export async function startScheduler() {
  await connectMongo();
  // load all workflows with scheduleCron
  const wfs = await WorkflowModel.find({ scheduleCron: { $ne: null } }).lean();
  for (const wf of wfs) {
    try {
      if (cron.validate(wf.scheduleCron)) {
        cron.schedule(wf.scheduleCron, async () => {
          console.log('Scheduled run for workflow', wf._id);
          const engine = new Engine();
          await engine.runWorkflow(wf as any, wf.owner, {});
        });
        console.log('Scheduled workflow', wf._id, wf.scheduleCron);
      } else {
        console.warn('Invalid cron for workflow', wf._id, wf.scheduleCron);
      }
    } catch (err:any) {
      console.error('Scheduler error for', wf._id, err);
    }
  }
}
