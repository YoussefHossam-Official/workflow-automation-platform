import { StepHandler, StepResult } from '../../types/engine.js';

export const DelayAction: StepHandler = {
  async run(_ctx, params): Promise<StepResult> {
    const ms = Number(params?.ms ?? 0);
    await new Promise(res => setTimeout(res, ms));
    return { ok: true };
  }
};
