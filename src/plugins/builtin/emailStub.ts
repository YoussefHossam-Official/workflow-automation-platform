import { StepHandler, StepResult } from '../../types/engine.js';

/**
 * Stub email sender. In real life integrate with nodemailer/SendGrid.
 */
export const EmailStubAction: StepHandler = {
  async run(_ctx, params): Promise<StepResult> {
    const to = String(params?.to ?? '');
    const subject = String(params?.subject ?? '');
    const body = String(params?.body ?? '');
    if (!to) return { ok: false, error: 'Missing to' };
    // Simulate success
    console.log(`[EMAIL] To:${to} | Subject:${subject} | Body:${body}`);
    return { ok: true };
  }
};
