# Genesis AI — Product Requirements Document

> **Version:** 1.0 (DRAFT — awaiting founder approval)
> **Product:** Genesis AI — AI Workforce Platform
> **v1.0 Scope:** AI Customer Support Agent (the wedge)
> **Owner:** CTO · **Date:** 2026-06-26
> **Companion doc:** [FOUNDATION.md](FOUNDATION.md)

---

## 0. Document Control

| Field | Value |
|---|---|
| Status | DRAFT v1.0 — needs approval |
| Approvers | Founder (you) |
| Assumed wedge | AI Customer Support Agent *(override changes use-case specifics, not structure)* |
| Out-of-scope guard | Anything not listed in §7 is explicitly **not** in v1.0 |

---

## 1. Summary

Genesis AI v1.0 delivers a **no-code AI Customer Support Agent** that a non-technical operator can stand up in under a day. The agent ingests a company's knowledge (docs, FAQs, past tickets), connects to one support channel, and **autonomously drafts or sends resolutions** to incoming customer questions — under a visible **trust ladder** with human-in-the-loop by default. Every action is logged, replayable, and measurable.

v1.0 is not the full platform. It is the **smallest thing that proves the core thesis**: *can an AI agent reliably do real support work, observably, such that a business will pay for resolved tickets?*

## 2. Problem Statement

SMBs and mid-market companies are drowning in repetitive customer support volume. Hiring doesn't scale, outsourcing is low-quality, and existing "AI" support tools are either (a) dumb deflection bots that frustrate customers, or (b) copilots that only *assist* a human agent who still does the work. No accessible product lets a non-technical operator deploy an agent that **actually resolves tickets end-to-end, reliably, with oversight they trust.**

## 3. Goals & Non-Goals

### Goals (v1.0)
- G1 — A non-technical operator can create, train, and deploy a support agent in **< 1 day** (time-to-first-value).
- G2 — The agent **resolves real tickets** at measurable quality, with human-in-the-loop oversight.
- G3 — Every agent action is **observable, auditable, and replayable**.
- G4 — Prove the **economics**: cost-per-resolved-ticket < the price we can charge < the human alternative.
- G5 — Establish the **trust-ladder** UX as the product's spine.

### Non-Goals (explicitly NOT v1.0)
- N1 — Multiple agent types / verticals (support only).
- N2 — Multi-channel at launch (one channel only — see §7).
- N3 — Full self-serve billing automation (manual/early-stage billing acceptable in MVP).
- N4 — Customer-built custom agents / general agent builder (Phase 3 vision).
- N5 — Enterprise features: SSO, dedicated infra, advanced RBAC (Phase 3).
- N6 — Voice/phone support (text only).

## 4. Success Metrics (KPIs)

| Metric | Definition | v1.0 Target |
|---|---|---|
| **Resolution rate** | Tickets fully resolved by agent w/o human edit | ≥ 50% (design-partner phase) |
| **Assisted rate** | Tickets where agent draft was sent with minor edit | ≥ 30% |
| **Escalation accuracy** | Agent correctly escalates when unsure (low false-confidence) | ≥ 95% |
| **CSAT on agent-handled** | Customer satisfaction on agent-resolved tickets | ≥ parity with human |
| **Time-to-first-value** | Signup → first real ticket handled | < 1 day |
| **Cost per resolved ticket** | (tokens + infra + review) / resolved ticket | < price charged, ≥70% margin path |
| **Reliability** | Agent uptime + successful action completion | ≥ 99% action success |

## 5. Target Users / Personas

- **Primary — "Operator" (the buyer & admin):** support lead / ops manager / founder at an SMB. Non-technical. Owns the agent: trains it, sets its autonomy level, reviews its work, watches the metrics. *The product is built for this person.*
- **Secondary — "Reviewer" (human-in-the-loop):** a support staffer who approves/edits agent drafts and handles escalations.
- **End beneficiary — "Customer":** the company's own customer who receives the agent's response. Never sees Genesis branding; experiences a fast, correct answer.

## 6. Key Use Cases / User Stories

- **US1 (Operator):** As an operator, I connect my knowledge sources and support channel so the agent can learn my business and start handling tickets.
- **US2 (Operator):** As an operator, I set the agent's autonomy level (Suggest / Draft / Act-with-review / Autonomous) so I control how much it does unsupervised.
- **US3 (Reviewer):** As a reviewer, I see the agent's drafted replies in a queue, edit/approve/reject them, and my edits teach the agent.
- **US4 (Agent behavior):** When a ticket arrives, the agent retrieves relevant knowledge, drafts a grounded answer, and either sends it or routes it for review per the autonomy level.
- **US5 (Agent behavior):** When the agent is not confident or the request needs a human/policy/action it can't take, it **escalates** with context instead of guessing.
- **US6 (Operator):** As an operator, I see a dashboard of resolution rate, escalations, cost, and CSAT so I can trust and tune the agent.
- **US7 (Operator/Auditor):** As an operator, I can open any ticket and replay exactly what the agent saw, retrieved, and decided.

## 7. Functional Requirements (v1.0 scope)

> Each requirement is traceable. **MUST** = in v1.0. **SHOULD** = if time permits. **WON'T** = explicitly deferred.

### A. Onboarding & Knowledge
- **FR-1 (MUST):** Operator can create an account and an "Agent" workspace.
- **FR-2 (MUST):** Operator can ingest knowledge from: (a) uploaded documents (PDF/text/markdown), (b) a help-center URL/sitemap crawl, (c) a CSV of past Q&A. → builds the agent's knowledge base (RAG).
- **FR-3 (MUST):** Operator can edit/curate the knowledge base (add, remove, mark authoritative).
- **FR-4 (SHOULD):** Operator can define brand voice/tone via examples and a short instruction.

### B. Channel Integration
- **FR-5 (MUST):** Connect **one** support channel for v1.0. **Recommended: email/shared inbox** (simplest, universal) — alternative: a single help-desk integration (e.g., one of Zendesk/Intercom/Freshdesk) if a design partner requires it.
- **FR-6 (MUST):** Inbound tickets/messages are received, queued, and attributed to a conversation thread.
- **FR-7 (MUST):** Outbound agent responses are delivered back through the same channel.

### C. The Agent (core)
- **FR-8 (MUST):** On each inbound ticket, the agent: classifies intent → retrieves relevant knowledge → drafts a grounded response → decides action per autonomy level.
- **FR-9 (MUST):** Responses are **grounded** — answers cite/derive from the knowledge base; the agent does not fabricate policy.
- **FR-10 (MUST):** **Confidence + escalation:** the agent produces a confidence signal and escalates to a human when below threshold, when the request requires an action it cannot take, or when knowledge is missing.
- **FR-11 (MUST):** **Guardrails:** the agent refuses/escalates on out-of-scope, sensitive, or risky requests (refunds beyond policy, legal, abuse) rather than acting.

### D. Trust Ladder & Human-in-the-Loop
- **FR-12 (MUST):** Per-agent **autonomy level**, operator-controlled:
  1. *Suggest* — drafts internal only, never sends.
  2. *Draft-for-approval* — drafts go to review queue; human sends.
  3. *Act-with-review* — agent sends, human reviews after (sampled/async).
  4. *Autonomous* — agent sends, review only on low-confidence/flagged.
- **FR-13 (MUST):** **Review queue** UI: reviewer sees drafts, can approve/edit/reject; edits and rejections are captured as feedback.
- **FR-14 (SHOULD):** Captured corrections improve future responses (feedback loop into retrieval/prompting).

### E. Observability & Trust
- **FR-15 (MUST):** **Action log** — every agent decision (input seen, knowledge retrieved, draft, action taken) is recorded as an event.
- **FR-16 (MUST):** **Replay** — operator can open any conversation and see the full reasoning trail.
- **FR-17 (MUST):** **Dashboard** — resolution rate, assisted rate, escalation rate, volume, cost, CSAT (if available).
- **FR-18 (MUST):** **Cost visibility** — token/cost per ticket tracked and surfaced.

### F. Platform basics
- **FR-19 (MUST):** Secure multi-tenant data isolation (each customer's knowledge/tickets strictly separated).
- **FR-20 (MUST):** Basic auth (email/password or magic link) + roles: Operator (admin), Reviewer.
- **FR-21 (WON'T - deferred):** SSO, SCIM, custom RBAC, white-label, multi-agent, billing automation.

## 8. Key User Flows (high level)

1. **Setup flow:** Sign up → create agent → ingest knowledge → connect channel → set autonomy = *Draft-for-approval* (safe default) → go live.
2. **Ticket flow:** Inbound ticket → agent retrieves + drafts → (per autonomy) send or queue → reviewer acts → response delivered → logged → metrics update.
3. **Trust graduation flow:** Operator watches resolution + escalation accuracy → raises autonomy level as confidence grows.
4. **Audit flow:** Operator opens any ticket → replays agent reasoning → corrects knowledge if needed.

## 9. Technical & Architecture Constraints (summary — full architecture is a separate doc)

- **Model-agnostic orchestration layer.** Default to most capable Claude models for reasoning; smaller/cheaper models for classification/sub-tasks. Provider swappable.
- **RAG** over per-tenant knowledge base (vector store + retrieval).
- **Event-sourced action log** as the system of record for agent behavior (powers replay, audit, evals, future training).
- **Deterministic scaffolding** around non-deterministic model calls: validation, retries, idempotency, guardrails.
- **Eval harness** for agent quality, run in CI on prompt/logic changes (FR-8–FR-11 must have evals before "Autonomous" tier ships).
- **Async/queue-based** ticket processing for reliability and throughput.
- Cost-per-ticket instrumented from day one.

*(Detailed system design, DB schema, and API contracts will be delivered as the Architecture Document for separate approval — per our process, not bundled into the PRD.)*

## 10. Data Requirements

- **Tenant data:** organizations, users/roles, agents, autonomy settings.
- **Knowledge data:** documents, chunks, embeddings, source/authority metadata.
- **Conversation data:** tickets, messages, threads, channel metadata.
- **Action/event log:** immutable record of every agent step (input, retrieval, draft, decision, outcome).
- **Feedback data:** reviewer edits/approvals/rejections (training signal).
- **Metrics data:** per-ticket cost, resolution status, CSAT.
- **Retention/PII:** customer support content contains PII — must be encrypted at rest/in transit, tenant-isolated, deletable on request (GDPR-readiness even pre-certification).

## 11. Security & Compliance Requirements

- **SEC-1:** Strict tenant isolation — no cross-tenant data access, enforced at the data layer.
- **SEC-2:** Encryption in transit (TLS) and at rest.
- **SEC-3:** Secrets/credentials (channel API keys) stored in a secrets manager, never in plaintext.
- **SEC-4:** PII handling: minimize, encrypt, support deletion. Don't send more customer data to models than needed.
- **SEC-5:** Audit log of administrative actions.
- **SEC-6:** Guardrails preventing the agent from taking unauthorized actions (e.g., issuing refunds, making promises) — escalate instead.
- **SEC-7 (roadmap, not v1.0):** SOC 2 readiness posture documented now; certification when enterprise demand justifies.

## 12. Assumptions & Dependencies

- **A1:** Foundation-model API access (Claude / provider) — core dependency; we monitor cost & rate limits.
- **A2:** Vector store / embedding infrastructure.
- **A3:** The chosen channel's API access (email infra or one help-desk's API).
- **A4:** 3–5 design-partner customers willing to co-build in the wedge vertical.
- **A5:** The wedge is **customer support** (override changes use-case specifics in §6–§8).

## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Agent gives wrong/harmful answers | Trust collapse | Grounding (FR-9), guardrails (FR-11), conservative default autonomy, escalation (FR-10) |
| Reliability too low to sell as "labor" | No product | Evals-as-tests, start at low autonomy, measure relentlessly (§4) |
| Cost-per-ticket > price | No margin | Cost instrumentation FR-18, model tiering, caching |
| Foundation-model vendor risk (price/limits/policy) | Existential dependency | Model-agnostic core (§9) |
| Scope creep into "full platform" | Never ship | Hard non-goals (§3), deferred list (FR-21) |
| Design partners hard to land | No learning loop | Founder-led outreach now; pick wedge where we have access |

## 14. Release Plan (high level)

- **M0 — Design partners signed** (wedge confirmed, 3–5 partners).
- **M1 — Internal alpha:** ingest → draft → review queue → log (autonomy: Suggest/Draft only). We operate it for partners by hand.
- **M2 — Closed beta:** channel integration live, dashboard, Act-with-review tier, evals in CI.
- **M3 — v1.0:** self-serve onboarding < 1 day, Autonomous tier gated behind eval thresholds, cost + metrics dashboards.

## 15. Open Questions (need founder input)

1. **Is the AI-workforce thesis confirmed**, or different product? *(blocks v1.0 lock)*
2. **Confirm the wedge vertical** — customer support (assumed) or another? *(blocks §6–§8 specifics)*
3. **Which channel for FR-5** — generic email/shared inbox, or a specific help-desk a design partner already uses?
4. **Do we have access to 3–5 design partners?** Who? *(determines M0 timeline)*
5. **Any hard constraints** — region, compliance, budget ceiling, existing tech preferences?

---

*Next artifact after approval: the **Technical Architecture Document** (system design, data schema, API contracts) for a separate review gate.*
