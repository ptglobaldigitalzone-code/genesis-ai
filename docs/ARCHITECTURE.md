# Genesis AI — System Architecture

> **Version:** 1.0 (DRAFT — awaiting founder approval)
> **Scope:** v1.0 AI Customer Support Agent → designed to generalize to the full AI Workforce Platform
> **Owner:** CTO · **Date:** 2026-06-26
> **Companion docs:** [FOUNDATION.md](FOUNDATION.md) · [PRD.md](PRD.md)

---

## 0. Architecture Principles (the rules every decision below obeys)

1. **Model-agnostic core.** The platform orchestrates models; no provider is load-bearing. Default to most capable Claude models; swap without rewrites.
2. **Event-sourced truth.** Every agent action is an immutable event. Replay, audit, evals, and future training all derive from one log.
3. **Deterministic shell around non-deterministic core.** LLM calls are wrapped in deterministic validation, retries, idempotency, and guardrails.
4. **Multi-tenant from line one.** `tenant_id` on every row; isolation enforced at the data layer.
5. **Buy the undifferentiated, build the moat.** Buy auth, infra, queues. Build only the agent orchestration + reliability layer.
6. **Start simple, designed to split.** Modular monolith now; clean boundaries so we extract microservices on demand, not on speculation.
7. **Cost & reliability are instrumented, not assumed.** Cost-per-job and action-success-rate are first-class telemetry.

---

## 1. High-Level Design

```
                            ┌──────────────────────────────┐
        Operator / Reviewer │   Web App (React/Next.js)    │
        (browser)           │   Operator console + queues  │
                            └───────────────┬──────────────┘
                                            │ HTTPS
                                            ▼
                              ┌──────────────────────────┐
   External support channel   │       API GATEWAY        │  ◄── AuthN/Z, rate limit,
   (email / help-desk)        │  routing · authz · quotas│      routing, request log
        │  webhooks           └─────────────┬────────────┘
        ▼                                    │
 ┌───────────────┐                           ▼
 │ Channel       │   internal calls  ┌───────────────────────────────────────────┐
 │ Ingress svc   │──────────────────▶│            CORE SERVICES                  │
 │ (webhooks/    │                   │                                           │
 │  email poll)  │                   │  • Identity & Tenant svc                  │
 └──────┬────────┘                   │  • Agent / Workspace svc                  │
        │ enqueue                    │  • Conversation / Ticket svc              │
        ▼                            │  • Knowledge Base svc (ingest + retrieval)│
 ┌───────────────┐                   │  • Workflow Engine (agent orchestration)  │
 │     QUEUE     │  jobs             │  • AI Runtime (model calls + guardrails)  │
 │  (BullMQ /    │◀─────────────────▶│  • Metrics / Cost svc                     │
 │   Redis)      │                   └──────────────┬────────────────────────────┘
 └──────┬────────┘                                  │ emits
        │ workers consume                           ▼
        ▼                              ┌──────────────────────────┐
 ┌───────────────┐   publish events    │        EVENT BUS         │  append-only
 │ Agent Workers │────────────────────▶│  (Postgres outbox →      │  action log =
 │ (AI Runtime + │                     │   Redis Streams / Kafka) │  system of record
 │  Workflow)    │                     └─────────┬────────────────┘
 └───────┬───────┘                               │ consumers
         │ reads/writes                          ▼
         ▼                          metrics · audit · eval capture · feedback loop
 ┌─────────────────────────────────────────────────────────────────┐
 │  DATA LAYER                                                       │
 │  PostgreSQL (tenants, agents, tickets, events) + pgvector (KB)   │
 │  Redis (cache, queue, rate-limit)   Object store (raw docs)      │
 │  Secrets manager (channel creds, API keys)                       │
 └─────────────────────────────────────────────────────────────────┘
                         │ outbound (model-agnostic)
                         ▼
            ┌────────────────────────────┐
            │  Foundation Model providers │  Claude (default) · swappable
            └────────────────────────────┘
```

**The critical request path:** inbound message → Channel Ingress → Queue → Agent Worker (Workflow Engine drives the steps; AI Runtime executes model calls with guardrails; Knowledge Base supplies grounding) → response delivered → every step appended to the Event Bus → Metrics updated.

---

## 2. Microservices (target boundaries + phased rollout)

> **Phased rollout — read this first.** Phase 1 ships these as **modules inside one deployable app** (a modular monolith) plus **one separate worker process** for agent execution. The boundaries below are real (separate code modules, separate DB schemas, no cross-module table access) so extraction to independent services is mechanical when scale demands it. We do **not** run 9 services with 9 pipelines on day one.

| Service | Responsibility | Phase 1 form | Extract when |
|---|---|---|---|
| **Identity & Tenant** | Orgs, users, roles, tenant isolation | Module (+ managed auth provider) | Rarely — stays in core |
| **Agent / Workspace** | Agent config, autonomy level, knowledge links, brand voice | Module | Multi-agent-type growth |
| **Channel Ingress** | Webhooks / email polling, normalize inbound, deliver outbound | Module + lightweight worker | High channel volume / many integrations |
| **Conversation / Ticket** | Threads, messages, status, escalation routing | Module | High write volume |
| **Knowledge Base** | Ingest, chunk, embed, retrieve (RAG) | Module + ingest worker | Heavy ingest load / dedicated vector infra |
| **Workflow Engine** | Orchestrates the agent's multi-step job | Worker (state machine lib) | Long-running / durable execution needs → Temporal |
| **AI Runtime** | Model-agnostic calls, guardrails, retries, cost capture | Library used by workers | Independent scaling of inference load |
| **Metrics / Cost** | Aggregates events → dashboards, cost-per-ticket | Module + event consumer | Analytics scale |
| **Event Bus consumers** | Audit, eval capture, feedback loop, projections | Consumers | Stream volume |

**Inter-service communication:** synchronous = internal HTTP/RPC behind the gateway for request/response; asynchronous = events on the Event Bus + jobs on the Queue for everything agent-related (agent work is async by nature). **Default to async** for agent execution — it's what makes the system reliable under load.

---

## 3. API Gateway

- **Role:** single ingress for all client + webhook traffic. Handles **authentication, authorization, rate limiting / quota (critical — usage billing means abuse = direct cost), request validation, routing, and request logging**.
- **Phase 1:** a thin gateway/BFF layer in the app (e.g., the Next.js/Node API layer or a small Fastify gateway) — no need for heavyweight infra yet.
- **Phase 2+:** dedicated gateway (Kong / cloud-managed API Gateway / Envoy) once we have multiple services and partners hitting public APIs.
- **API style:** REST + JSON for the operator console and webhooks (simple, debuggable). Internal service calls can move to typed RPC later. Public/partner API versioned (`/v1/...`) from day one.
- **Tenant context:** gateway resolves `tenant_id` from the auth token and injects it into every downstream call — no service trusts a client-supplied tenant id.

---

## 4. Database

- **Primary: PostgreSQL.** One battle-tested relational DB for tenants, agents, conversations, events, metrics. Boring on purpose.
- **Multi-tenancy model:** **shared database, shared schema, `tenant_id` on every row, enforced by Postgres Row-Level Security (RLS).** Cheapest to operate, strong isolation when RLS is correct. *Path to harder isolation (schema-per-tenant or DB-per-tenant) reserved for large enterprise customers in Phase 3 — not now.*
- **Vector store: pgvector inside the same Postgres.** Deliberate call: a separate vector DB (Pinecone/Weaviate) is premature ops overhead at our scale. pgvector handles millions of chunks fine and keeps knowledge co-located with tenant data. Extract to a dedicated vector DB only if retrieval scale forces it.
- **Redis:** caching, queue backing store, rate-limit counters, ephemeral state.
- **Object storage (S3-compatible):** raw uploaded documents before chunking; large artifacts.
- **Secrets manager:** channel API keys, provider keys — never in the DB plaintext.
- **Data classes & retention:** PII-bearing conversation data encrypted at rest, tenant-deletable (GDPR-ready). Event log is append-only/immutable.

**Core schema (illustrative, not final):**
```
tenants(id, name, plan, created_at)
users(id, tenant_id, email, role, ...)                 -- role: operator | reviewer
agents(id, tenant_id, name, autonomy_level, voice, ...) -- autonomy: suggest|draft|act_review|autonomous
knowledge_sources(id, tenant_id, agent_id, type, status, ...)
kb_chunks(id, tenant_id, source_id, content, embedding vector, authority, ...)
conversations(id, tenant_id, agent_id, channel, status, ...)
messages(id, tenant_id, conversation_id, role, body, created_at)  -- role: customer|agent|reviewer
events(id, tenant_id, conversation_id, type, payload jsonb, created_at)  -- APPEND ONLY (action log)
feedback(id, tenant_id, conversation_id, reviewer_id, action, edit_diff, ...) -- approve|edit|reject
ticket_costs(id, tenant_id, conversation_id, tokens_in, tokens_out, cost, model)
```
Every table carries `tenant_id`; RLS policies key off it.

---

## 5. Authentication & Authorization

- **Build vs buy = BUY.** We do not hand-roll auth. Use a managed provider (**Clerk / Auth0 / Supabase Auth / WorkOS**). Rationale: auth is a security minefield, fully undifferentiated, and a vendor does it better. (WorkOS/Auth0 also give us enterprise SSO later for free — Phase 3.)
- **AuthN:** email/password or magic link for v1.0; tokens as JWT.
- **AuthZ:** role-based — **Operator** (admin: configure agent, set autonomy, view all) and **Reviewer** (act on review queue). Enforced at the gateway and re-checked in services. Tenant scoping is non-negotiable on every request.
- **Service-to-service:** internal calls authenticated via signed service tokens / mTLS (Phase 2 when split).
- **Channel credentials:** stored in secrets manager, scoped per tenant, rotatable.
- **Roadmap:** SSO/SCIM, granular RBAC, audit-log export → Phase 3 enterprise, posture documented now.

---

## 6. Queue

- **Role:** decouple inbound messages from agent processing. **Agent work is async** — a ticket is enqueued, a worker processes it. This is what gives us reliability, retries, backpressure, and horizontal scale.
- **Phase 1: BullMQ on Redis.** Simple, durable enough, great DX, supports retries/delays/priorities/rate-limits. Right tool at our scale.
- **Phase 2+: managed queue** (SQS / Cloud Tasks) or Kafka if we need higher throughput / stronger durability guarantees.
- **Patterns:** idempotent jobs (each ticket processed exactly-once-effectively via idempotency keys), dead-letter queue for poison messages, per-tenant fairness/rate-limits so one tenant can't starve others, retry with backoff on transient model/infra failures.

---

## 7. AI Runtime

The **model-agnostic execution layer** — the heart of our moat. Wraps every model interaction in deterministic scaffolding.

Responsibilities:
- **Provider abstraction:** uniform interface over Claude (default) and alternates. Per-task model selection — big model for reasoning/drafting, small/cheap model for classification/routing.
- **Prompt assembly:** injects agent config, brand voice, retrieved knowledge (from KB), conversation history, and tool definitions.
- **Guardrails (deterministic):** input/output validation, policy checks (FR-11), grounding enforcement (answers must derive from KB — no fabricated policy), PII minimization before sending to provider.
- **Confidence & escalation:** produce a confidence signal; below threshold or missing-knowledge → escalate to human (FR-10).
- **Reliability:** retries with backoff, timeouts, fallbacks, idempotency, prompt-injection defenses.
- **Tool/Action execution:** controlled, allow-listed actions only; never an unauthorized action — escalate instead.
- **Cost & token capture:** every call records tokens + cost → Metrics (FR-18). Caching (prompt/response) to drive cost-per-job down.
- **Eval hooks:** capability changes run against the eval suite in CI before promotion to higher autonomy.

> The AI Runtime is intentionally the place we **build, not buy**. Everything else we lean on vendors; this is where reliability becomes the product.

---

## 8. Workflow Engine

- **Role:** orchestrates the agent's multi-step job — *classify → retrieve → draft → guardrail-check → decide (send / queue for review / escalate) → deliver → log*. Manages state, branching, human-in-the-loop pauses, and retries across steps.
- **The trust ladder lives here.** The autonomy level (FR-12) is a branch in the workflow: *Suggest* stops after draft; *Draft-for-approval* pauses for reviewer; *Act-with-review* sends then logs for async review; *Autonomous* sends unless low-confidence/flagged.
- **Human-in-the-loop = durable pause.** A workflow can suspend awaiting reviewer action and resume on approval/edit — this must survive restarts.
- **Phase 1:** a lightweight, explicit **state machine** in the worker (e.g., XState-style or a simple typed step runner) backed by DB state. Sufficient and debuggable.
- **Phase 2+: Temporal** (durable execution) when workflows get long-running, span many human pauses, or we need bulletproof resumability and visibility. Designed for this swap now; not paying its complexity tax yet.
- **Why explicit, not "let the LLM decide everything":** determinism around non-determinism. The *control flow* is engineered and testable; the *content* is the model's job. This is how we get reliability evals.

---

## 9. Knowledge Base (RAG)

Two halves: **ingestion** (write path) and **retrieval** (read path).

- **Ingestion pipeline (async worker):** source (uploaded docs / help-center crawl / Q&A CSV — FR-2) → parse → **chunk** (semantic-aware) → **embed** → store in `kb_chunks` (pgvector) with source + **authority** metadata. Re-ingest/refresh supported; operator can curate (FR-3).
- **Retrieval (read path):** on each ticket, embed the query → vector similarity search scoped by `tenant_id` + `agent_id` → optional re-ranking → top-k grounded context handed to AI Runtime. **Hybrid search** (vector + keyword) for precision on names/IDs.
- **Grounding contract:** the agent answers *from retrieved knowledge*; if retrieval is empty/weak, it escalates rather than inventing (ties to FR-9/FR-10).
- **Per-tenant isolation:** retrieval is always tenant-scoped — a hard security boundary, enforced by RLS + query scoping.
- **Feedback loop:** reviewer corrections (FR-13/14) feed back as improved knowledge / preferred answers → compounding data moat (a Foundation principle).

---

## 10. Event Bus

- **Role:** the **append-only action log is the system of record** for everything an agent does — powers replay (FR-16), audit (FR-15), metrics (FR-17), eval capture, and future training data. This is an architectural keystone, not a nice-to-have.
- **Phase 1: Postgres `events` table + transactional outbox pattern → Redis Streams** for fan-out to consumers. Gives us durability (events committed in the same transaction as state changes — no lost events) without standing up Kafka.
- **Phase 2+: Kafka / managed streaming** when event volume or the number of independent consumers justifies it. The outbox pattern means producers don't change when the bus does.
- **Consumers:** Metrics/Cost projector, Audit/replay store, Eval capture, Feedback-loop processor, future ML/training export.
- **Guarantees:** at-least-once delivery + idempotent consumers; events are immutable; ordering preserved per conversation.
- **Why event-sourced:** in an AI product, *being able to explain and replay exactly what the agent did* is both a trust feature (operators audit) and an engineering necessity (debug non-determinism, build evals). We get it for free by making events the source of truth.

---

## 11. Cross-Cutting Concerns

- **Observability:** structured logging, distributed tracing (trace a ticket end-to-end across queue + workers + model calls), metrics dashboards. Plus the domain telemetry: resolution rate, escalation accuracy, cost-per-ticket, action-success-rate.
- **Security:** TLS everywhere, encryption at rest, secrets manager, tenant isolation via RLS, least-privilege service creds, prompt-injection & PII guardrails in AI Runtime, admin audit log. SOC 2 posture documented now, certified when enterprise demands (Phase 3).
- **Deployment:** containers (Docker) on one managed platform to start (e.g., a managed container/serverless host) — **don't run Kubernetes for a pre-revenue product.** Adopt orchestration when service count + scale justify it. IaC from the start so environments are reproducible.
- **Environments:** dev / staging / prod, isolated data. CI runs tests **and evals** before deploy.
- **Scalability path:** stateless services scale horizontally; workers scale by queue depth; Postgres scales via read replicas → partitioning of high-volume tables (`events`, `messages`) → managed/distributed Postgres only if needed. Cost scales with usage by design (and is metered).

---

## 12. Recommended Technology Stack (v1.0 — pragmatic, one team)

| Layer | Choice | Why |
|---|---|---|
| Language | **TypeScript** end-to-end (web + services + workers) | One language = velocity for a small team; add Python only for ML/evals later |
| Web/console | Next.js + React | Fast to build operator console + review queue |
| API/services | Node (Fastify/Nest) | Same language, mature, good for gateway + services |
| DB | **PostgreSQL + pgvector** | One DB for relational + vectors; RLS for tenancy |
| Cache/Queue | **Redis + BullMQ** | Simple, durable-enough jobs at our scale |
| Auth | **Managed (Clerk/Auth0/WorkOS)** | Buy, don't build; SSO-ready for later |
| AI | **Claude (default) via model-agnostic runtime** | Most capable models; swappable core |
| Events | **Postgres outbox → Redis Streams** | Durable events without Kafka overhead |
| Workflow | **State machine lib** (→ Temporal later) | Right-sized durability now |
| Infra | Containers on a managed host + IaC | No premature Kubernetes |
| Object store | S3-compatible | Raw docs |

*(Final stack choices are reversible and open to your preferences/constraints — Open Question #5 in the PRD.)*

---

## 13. Build Sequence (maps to PRD milestones)

1. **M1 (alpha):** Postgres + auth + Agent/Tenant + Knowledge ingest/retrieval + AI Runtime (draft only) + Event log + minimal console. Autonomy: Suggest/Draft.
2. **M2 (beta):** Queue + Channel Ingress (one channel) + Workflow Engine (full trust ladder) + Review queue + Metrics dashboard + evals in CI.
3. **M3 (v1.0):** Autonomous tier gated behind eval thresholds + cost dashboards + <1-day self-serve onboarding + hardening.

---

## 14. Key Architectural Decisions Needing Your Sign-off

1. **Modular monolith first, extract services later** — agreed, or do you want full microservices now? *(Strongly recommend modular-monolith-first.)*
2. **pgvector over a dedicated vector DB** for v1.0 — agreed?
3. **Buy managed auth** (Clerk/Auth0/WorkOS) — agreed?
4. **TypeScript end-to-end** — or do you/your team have a stack preference? *(Reversible, but pick now.)*
5. **Cloud/host preference & any region/compliance constraints?** (PRD Open Q #5 — still open.)

Approve these and the next artifacts are the **detailed data schema + API contracts** and **Sprint 1 backlog** for the build gate.
