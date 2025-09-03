import { StepHandler, StepResult } from '../../types/engine.js';

/** Merges provided key/values into ctx.data */
export const DataMergeAction: StepHandler = {
  async run(ctx, params): Promise<StepResult> {
    const items = (params?.items ?? {}) as Record<string, unknown>;
    Object.assign(ctx.data, items);
    return { ok: true, data: {} };
  }
};
