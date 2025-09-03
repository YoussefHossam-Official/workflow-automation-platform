import { StepHandler, StepResult } from '../../types/engine.js';

/**
 * This trigger is invoked via HTTP route. The route handler will call the engine directly.
 * The handler here simply passes along any existing context.
 */
export const HttpWebhookTrigger: StepHandler = {
  async run(ctx): Promise<StepResult> {
    // Trigger does nothing, it just starts the workflow. Any data is already in ctx.data
    return { ok: true };
  }
};
