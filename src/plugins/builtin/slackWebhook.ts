import { StepHandler, StepResult } from '../../types/engine.js';
import axios from 'axios';
import { renderParams } from '../../utils/template.js';

/**
 * Sends a simple message payload to a Slack Incoming Webhook URL.
 * params: { url, text, attachments? }
 */
export const SlackWebhookAction: StepHandler = {
  async run(_ctx, params): Promise<StepResult> {
    try {
      const p = renderParams(params || {}, _ctx.data);
      const url = String(p.url ?? '');
      if (!url) return { ok: false, error: 'Missing url' };
      const payload = { text: p.text ?? '', attachments: p.attachments ?? undefined };
      await axios.post(url, payload, { timeout: 7000 });
      return { ok: true };
    } catch (err:any) {
      return { ok: false, error: String(err?.message || err) };
    }
  }
};
