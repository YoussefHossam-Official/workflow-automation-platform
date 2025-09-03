import Mustache from 'mustache';

export function renderTemplate(template: string, data: Record<string, unknown>) {
  try {
    return Mustache.render(template, data);
  } catch (err:any) {
    throw new Error('Template render error: ' + (err.message || err));
  }
}

// Recursively render any string values inside an object
export function renderParams(params: any, data: Record<string, unknown>): any {
  if (params == null) return params;
  if (typeof params === 'string') {
    return renderTemplate(params, data);
  }
  if (Array.isArray(params)) return params.map(p => renderParams(p, data));
  if (typeof params === 'object') {
    const out:any = {};
    for (const k of Object.keys(params)) {
      out[k] = renderParams(params[k], data);
    }
    return out;
  }
  return params;
}
