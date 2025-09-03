import { Registry } from '../engine/registry.js';
import { DelayAction } from './builtin/delay.js';
import { LogAction } from './builtin/log.js';
import { HttpWebhookTrigger } from './builtin/httpWebhookTrigger.js';
import { DataMergeAction } from './builtin/dataMerge.js';
import { ConditionalAction } from './builtin/conditional.js';
import { EmailStubAction } from './builtin/emailStub.js';

/** Register all built-in plugins here */
export function registerBuiltinPlugins() {
  Registry.register('http.webhook', HttpWebhookTrigger);
  Registry.register('utils.delay', DelayAction);
  Registry.register('utils.log', LogAction);
  Registry.register('data.merge', DataMergeAction);
  Registry.register('flow.conditional', ConditionalAction);
  Registry.register('email.stub', EmailStubAction);
}

import { HttpRequestAction } from './builtin/httpRequest.js';
import { SlackWebhookAction } from './builtin/slackWebhook.js';

export function registerBuiltinPlugins() {
  Registry.register('http.webhook', HttpWebhookTrigger);
  Registry.register('utils.delay', DelayAction);
  Registry.register('utils.log', LogAction);
  Registry.register('data.merge', DataMergeAction);
  Registry.register('flow.conditional', ConditionalAction);
  Registry.register('email.stub', EmailStubAction);

  // New actions
  Registry.register('http.request', HttpRequestAction);
  Registry.register('slack.webhook', SlackWebhookAction);
}
