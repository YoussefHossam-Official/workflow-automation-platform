import { StepHandler, StepResult } from '../../types/engine.js';
import axios from 'axios';
import { renderParams } from '../../utils/template.js';

export const HttpRequestAction: StepHandler = {
  async run(_ctx, params): Promise<StepResult> {
    try {
      const p = renderParams(params || {}, _ctx.data);
      const method = String((p.method ?? 'GET')).toUpperCase();
      const url = String(p.url ?? '');
      const headers = p.headers ?? {};
      const body = p.body ?? undefined;
      if (!url) return { ok: false, error: 'Missing url' };
      const resp = await axios.request({ method, url, headers, data: body, timeout: 10000 });
      return { ok: true, data: { httpStatus: resp.status, httpData: resp.data } };
    } catch (err:any) {
      return { ok: false, error: String(err?.message || err) };
    }
  }
};
