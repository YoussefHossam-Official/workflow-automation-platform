import { StepHandler, StepResult } from '../../types/engine.js';

/**
 * Simple conditional check: if ctx.data[field] equals value, ok=true, else ok=false.
 * Combine with stopOnFailure=false to skip next step on false.
 */
export const ConditionalAction: StepHandler = {
  async run(ctx, params): Promise<StepResult> {
    const field = String(params?.field ?? '');
    const value = params?.equals;
    const actual = (ctx.data as any)[field];
    const ok = actual === value;
    return { ok, data: {} };
  }
};
