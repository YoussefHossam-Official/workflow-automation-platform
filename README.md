# Workflow Automation Platform 

## Quick Intro

This is a full backend project written in **TypeScript + Node.js + Express + MongoDB**. It features an engine that executes "Workflows" (execution chains of Triggers and Actions), with **templating** (Mustache), **Retry + Queue** (BullMQ + Redis), and a **Scheduler** (node-cron). The goal is to provide a strong MVP that demonstrates System Design and complex Business Logic.

---

## Table of Contents

1. Overview
2. System Components (Architecture)
3. Models / Data
4. Data Flow Step by Step
5. Templating
6. Retry / Queue / Worker
7. Scheduler (cron)
8. Plugins (How to add new Actions/Triggers)
9. API Endpoints & curl examples
10. Local Setup (Quick Start)
11. Production & Security Notes
12. Testing & Extensions
13. Future Roadmap
14. License

---

## 1) Overview

* Users can build Workflows: sequences of Steps (each Step is either a TRIGGER or an ACTION).
* Entry Step is usually a TRIGGER (e.g., `http.webhook` or `schedule.cron`).
* Each Action executes, returns a result (or fails), and the Engine proceeds to the `next` step.
* On failure, Retry policies are applied, and Jobs are recorded in MongoDB and retried via Worker.
* Every Execution is logged in ExecutionLog in MongoDB.

---

## 2) System Components (Architecture)

* **API Server (Express)**: Entry points to manage Workflows, Auth, and public webhooks.
* **MongoDB (Mongoose)**: Stores Users, Workflows, ExecutionLogs, Jobs.
* **Engine**: The core logic; reads Workflows and executes steps.
* **Registry**: Stores registered Plugins (Actions & Triggers). Each plugin has a `ref` (e.g. `http.request`).
* **Templating**: Mustache-based variable substitution in step params.
* **Queue + Worker**: BullMQ + Redis handle failed jobs and retries outside of request lifecycle.
* **Scheduler**: node-cron triggers Workflows based on cron expressions.
* **Client skeleton**: React + Vite starter for Dashboard UI.

---

## 3) Models / Data

* **UserModel**: `{ email, passwordHash, role }`
* **WorkflowModel**: `{ name, description, owner, steps[], entryStepId, scheduleCron? }`

  * `steps`: array of `StepConfig`: `id, name, type('TRIGGER'|'ACTION'), ref, params?, next?, retry?, stopOnFailure?`
* **ExecutionLogModel**: logs each run: `workflowId, runId, userId, logs[], status`
* **JobModel**: failed step representation: `{ workflowId, runId, userId, step, attempt, status, error }`

---

## 4) Data Flow (Execution)

1. User creates a Workflow via API.
2. Trigger fires (webhook or scheduler) and provides initial data.
3. Engine starts from `entryStepId` and loops:

   * Fetch Step from Workflow.
   * Fetch Handler from Registry via `ref`.
   * Render params using Mustache with `ctx.data`.
   * Execute `handler.run(ctx, params)`.
   * On success: merge `result.data` into `ctx.data` and move to `next`.
   * On failure: create Job in DB and push to Queue for retry (based on retry policy).
4. ExecutionLog updated with final status (SUCCESS/FAILED).

---

## 5) Templating

* Uses **Mustache**.
* Supports `{{data.someField}}` or simple `{{someKey}}` from context.

**Example:**

```json
{
  "ref": "http.request",
  "params": {
    "method": "POST",
    "url": "https://api.example.com/users/{{data.userId}}/notify",
    "body": { "email": "{{data.email}}", "name": "{{data.name}}" }
  }
}
```

* `renderParams` recursively replaces template strings.

---

## 6) Retry / Queue / Worker

* Each Step can define `retry`: `{ maxAttempts, backoffMs }`.
* On failure after attempts, Job is created in MongoDB and pushed to BullMQ queue.
* Worker picks Job and retries it (running partial workflow starting at failed step).
* Worker updates Job status (`PENDING`, `FAILED`, `COMPLETED`).

---

## 7) Scheduler (cron)

* If Workflow has `scheduleCron` and server runs with `START_SCHEDULER=1`, scheduler registers it.
* Each cron event triggers `engine.runWorkflow(wf, wf.owner, {})`.

---

## 8) Plugins — Adding new Action/Trigger

Use Registry (`Registry.register(ref, handler)`).

Handler implements `StepHandler`:

```ts
export interface StepHandler {
  run(ctx: ExecutionContext, params?: Record<string, unknown>): Promise<StepResult>;
}
```

**Example:**

```ts
import { StepHandler } from '../../types/engine.js';

export const MyCustomAction: StepHandler = {
  async run(ctx, params) {
    // custom logic
    return { ok: true, data: { foo: 'bar' } };
  }
};

// register in src/plugins/index.ts
Registry.register('my.action', MyCustomAction);
```

---

## 9) API Endpoints & curl Examples

Base URL: `http://localhost:4000`

### Auth

* `POST /api/auth/register` `{ email, password }` → token
* `POST /api/auth/login` `{ email, password }` → token

### Workflows (Bearer Token)

* `POST /api/workflows` create
* `GET /api/workflows` list
* `GET /api/workflows/:id` get one
* `PUT /api/workflows/:id` update
* `DELETE /api/workflows/:id` delete
* `POST /api/workflows/:id/execute` manual run (body.data = initial data)
* `GET /api/workflows/:id/logs` execution logs
* `GET /api/workflows/:id/jobs` jobs
* `POST /api/workflows/jobs/:jobId/retry` retry job

### Public Webhook

* `POST /api/hooks/:workflowId` triggers workflow if entry step is `http.webhook`.

**Examples:**

```bash
# Register
curl -X POST http://localhost:4000/api/auth/register -H 'Content-Type: application/json' -d '{"email":"me@example.com","password":"abc123"}'

# Trigger workflow via webhook
curl -X POST http://localhost:4000/api/hooks/<WORKFLOW_ID> -H 'Content-Type: application/json' -d '{"email":"user@example.com","name":"Ali"}'
```

---

## 10) Local Setup — Quick Start

1. Install dependencies:

```bash
npm install
```

2. Prepare `.env`:

```bash
cp .env.example .env
# edit values if needed
```

3. Start Mongo + Redis (Docker):

```bash
docker run -d --name mongo -p 27017:27017 mongo:7
docker run -d --name redis -p 6379:6379 redis:7
```

4. Seed admin user (optional): `npm run seed`
5. Run server (dev): `npm run dev`
6. Run Worker (separate terminal): `npm run worker`
7. Enable Scheduler: set `START_SCHEDULER=1` in `.env`.

---

## 11) Production & Security Notes

* **Secrets**: keep `JWT_SECRET` and API keys in env variables/Secret Manager.
* **Webhook Auth**: validate requests with signatures/secrets.
* **Rate-limiting**: add limits to public endpoints.
* **Persistent Queue**: ensure Redis persistence + backup.
* **Observability**: add metrics/tracing (Prometheus, Grafana, OpenTelemetry).
* **Validation**: use Zod (already integrated) for Workflow JSON + params.
* **Template injection**: sanitize values substituted in templates.

---

## 12) Testing & Extensions

* Unit tests: Jest or Vitest.
* Integration tests: run Mongo & Redis during tests.
* New Integrations: Gmail (OAuth), Slack (OAuth), Telegram, Stripe.
* UI: drag-and-drop Workflow builder.

---

## 13) Future Roadmap

* Full Dashboard UI (visual workflow builder + live logs).
* DAG support (branching, conditional routing).
* Advanced templating (helpers, sandboxed scripts, WASM).
* Integrated Secrets Manager.
* Multi-tenant support + per-user rate limits.
* Plugin Marketplace.

---

## 14) License

Experimental project — use for learning/dev. Add your preferred license (e.g., MIT).

---

