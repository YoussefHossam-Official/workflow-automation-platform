import { StepHandler, StepResult } from '../../types/engine.js';

export const LogAction: StepHandler = {
  async run(ctx, params): Promise<StepResult> {
    const message = String(params?.message ?? 'log');
    ctx.logs.push({ at: new Date().toISOString(), level: 'INFO', message, meta: { data: ctx.data } });
    return { ok: true };
  }
};
