# Genesis AI — Master Product Requirements Document

> **Version:** 1.0 · **Status:** Company source of truth (DRAFT pending founder sign-off on thesis + wedge)
> **Author:** Product (CTO acting PM) · **Date:** 2026-06-26
> **Scope:** The entire Genesis AI product — the AI Workforce Platform. The v1.0 build slice lives in [PRD.md](PRD.md); this is the company-wide North Star.
> **Companion docs:** [FOUNDATION.md](FOUNDATION.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [AI-EMPLOYEE-HANDBOOK.md](AI-EMPLOYEE-HANDBOOK.md) · [ENGINEERING-BIBLE.md](ENGINEERING-BIBLE.md)

> **Working assumptions this document is built on** (one founder decision flips them): the product thesis is an **AI Workforce Platform**, and the first wedge is **customer support**. Stated plainly here because a source of truth cannot be vague.

---

## 1. Executive Summary

Every business runs on repetitive operational work — answering customers, qualifying leads, processing documents. That work is done by people, and people don't scale: hiring is slow, expensive, and capped by budget. Foundation models made it newly possible to automate *judgment work*, not just rules — but the tools on the market are either dumb deflection bots or "copilots" that still leave a human doing the job.

**Genesis AI is an AI Workforce Platform: businesses hire autonomous "AI employees" that do real, end-to-end work — with human oversight that shrinks as trust is earned.** You describe the job; Genesis builds, deploys, supervises, and continuously improves the AI worker. We don't sell software seats. We sell *work done*, billed by outcome.

We enter through a single wedge — **AI customer support agents** — where ROI is obvious and measurable, then expand across jobs and departments within each account. The business compounds through net revenue retention: land one agent, grow to a workforce.

**Why now:** models crossed the capability threshold for real work; labor is scarce and expensive; and no one has won the "reliable, no-code, accountable AI worker" position. **Why us:** we treat reliability as the product and build the orchestration + evaluation layer that turns non-deterministic models into dependable employees — the part incumbents and DIY teams underinvest in.

**The prize:** the platform on which the next hundred million digital workers are created.

---

## 2. Problem Statement

**Businesses cannot scale operational labor at the speed and cost their growth demands.**

- Hiring is slow (weeks to months), expensive (fully-loaded cost far above salary), and hard to retain for repetitive roles (high churn in support, SDR, back-office).
- Outsourcing trades cost for quality and control.
- Existing software automates *rules*, not *judgment* — so the hard 80% of real work still needs a human.
- The first wave of "AI" tools disappointed: deflection bots frustrate customers, and copilots only assist a human who is still the bottleneck. Neither is accountable for the outcome.

The result: ops leaders are stuck choosing between **growing headcount they can't afford** or **drowning in a backlog that degrades customer experience**. There is no accessible way to add reliable capacity that actually *completes* the work.

**The gap Genesis fills:** a way to deploy AI workers that do the job end-to-end, reliably enough to be trusted, with oversight a non-technical operator controls — and that gets better every week.

---

## 3. Vision

**A world where every business can hire AI employees as easily as posting a job, and trust them to do the work.**

Ten years out, spinning up a digital worker is a normal Tuesday decision for any operator, and "Genesis" is the verb for it. The constraint on what a company can do stops being "how many people can we hire" and becomes "what work do we want done."

---

## 4. Mission

**Make autonomous AI work reliable enough to be accountable for real business outcomes — and make creating it require zero engineering.**

Two deliberately hard problems: **reliability** (workers that don't quietly fail) and **accessibility** (a non-technical operator can build and supervise one). Whoever solves both owns the category.

---

## 5. Product Goals

1. **Time-to-value in under a day.** A non-technical operator goes from signup to a real job done by their AI employee on day one.
2. **Reliability you can sell as labor.** Measurable success rate and escalation accuracy high enough that customers trust the agent with production work.
3. **Earned autonomy.** A trust model that lets agents graduate from supervised to autonomous as they prove themselves — making AI-doing-real-work safe to adopt.
4. **Outcome-aligned economics.** Cost-per-completed-job low enough that we price below the human alternative and still hold healthy margin.
5. **Land-and-expand built in.** Adding agents, jobs, and volume is frictionless — the product itself drives net revenue retention.
6. **Compounding quality.** Every human correction makes the agent better; the product improves with use.
7. **Trust through transparency.** Operators can see, audit, and replay everything an agent does.

---

## 6. Non-Goals

What Genesis deliberately is **not** — now and as a matter of positioning:

- **Not a chatbot / deflection tool.** We complete work; we don't deflect tickets to dead ends.
- **Not a developer agent framework / SDK.** Our buyer is a non-technical operator, not an engineer wiring agents. (Different, lower-margin business.)
- **Not a horizontal "build any agent for anything" toolkit on day one.** We win a wedge deeply first; generalization is earned, not assumed.
- **Not a human-staffing / BPO service.** We are a product, not an agency. No humans-for-hire behind the curtain.
- **Not a foundation-model company.** We orchestrate models; we don't train our own frontier models.
- **Not consumer.** The value (and the willingness to pay for reliability) lives in business labor budgets.

---

## 7. Target Market

**Primary (entry): SMB and mid-market businesses with high-volume, repetitive operational work and no engineering team to automate it themselves.** Initial wedge vertical: **customer support**.

- **Why this segment first:** they feel labor scarcity most acutely, buy faster (shorter cycles, less procurement friction), and give us faster learning loops than enterprise.
- **Beachhead buyer:** an ops/support leader or founder who owns a "get the work done" budget and is measured on backlog, response time, and cost.

**Market framing (directional, to be hardened with bottoms-up data):**
- **TAM** — global business spend on the *labor* Genesis can perform (support, SDR, back-office ops). This is a *labor* budget, not a software budget — orders of magnitude larger than seat-based SaaS for the same function.
- **SAM** — SMB/mid-market in target regions, in jobs we support, reachable via self-serve + inside sales.
- **SOM (24-month)** — design-partner vertical → adjacent jobs in the same accounts.

**Expansion path:** customer support → adjacent jobs (SDR, back-office) → up-market to enterprise → horizontal platform. Each step reuses the same trust, reliability, and supervision spine.

---

## 8. User Personas

**1. Olivia — the Operator (primary buyer & admin).**
Head of Support / Ops lead / founder at a 20–500 person company. Non-technical but tech-comfortable. Drowning in volume, can't hire fast enough, judged on response time, CSAT, and cost. **Wants:** capacity she can trust without managing more headcount. **Fears:** an AI that says something wrong to a customer and blows up her reputation. **Wins when:** backlog shrinks, CSAT holds, and she didn't have to hire.

**2. Ravi — the Reviewer (human-in-the-loop).**
A support/ops team member who supervises the AI's drafts, approves/edits, and handles escalations. **Wants:** the AI to handle the boring 70% so he focuses on hard cases. **Fears:** the tool creating more review work than it saves. **Wins when:** he's approving good drafts in seconds, not rewriting them.

**3. The End Customer (beneficiary, never the user).**
The company's own customer. Never sees Genesis. **Wants:** a fast, correct answer. **Wins when:** their issue is resolved quickly — and they can't tell it wasn't a great human agent.

**4. (Later) The Executive Buyer — VP/COO at mid-market/enterprise.**
Enters as accounts scale. **Wants:** ROI, reliability data, security/compliance. **Wins when:** Genesis is a board-level cost-and-capacity story, not a tool.

---

## 9. Jobs To Be Done

Framed as the progress users are trying to make ("When… I want to… so I can…"):

- **JTBD-1 (Operator):** *When my support volume outgrows my team, I want to add capacity that actually resolves tickets — without hiring — so I can keep response times and CSAT high while controlling cost.*
- **JTBD-2 (Operator):** *When I adopt an AI worker, I want to control how much it does on its own and watch it prove itself, so I can trust it without risking a bad customer experience.*
- **JTBD-3 (Reviewer):** *When the AI drafts a response, I want to approve or fix it in seconds and have my fix teach it, so my effort compounds instead of repeats.*
- **JTBD-4 (Operator):** *When something goes wrong, I want to see exactly what the agent did and why, so I can trust, audit, and correct it.*
- **JTBD-5 (Operator, expansion):** *When the first agent works, I want to put AI on the next job too, so I scale the wins across my operation.*

**The deeper job:** *"Help me grow the business without the work growing my headcount."*

---

## 10. Pain Points

| # | Pain (today) | Who feels it | Cost of the pain |
|---|---|---|---|
| P1 | Can't hire fast/cheap enough for repetitive work | Operator | Backlogs, slow response, burnout, lost customers |
| P2 | Existing AI tools deflect or only assist — human still does the job | Operator/Reviewer | "AI" that doesn't reduce real workload |
| P3 | Fear of AI saying something wrong to a customer | Operator | Blocks adoption entirely |
| P4 | No visibility into what the AI did / why | Operator | Can't trust, can't audit, can't fix |
| P5 | Setting up automation needs engineers | Operator | Tool never gets deployed |
| P6 | Tools don't improve with use; same mistakes repeat | Reviewer | Wasted correction effort |
| P7 | Pricing tied to seats/usage that doesn't match value | Operator/Exec | Hard to justify ROI |
| P8 | Knowledge is scattered; AI answers from nothing | Operator | Wrong or generic answers |

Genesis is designed so that **every core feature kills a specific pain** (mapped in §11).

---

## 11. Core Features

> Capability-level (PM view). Engineering breakdown lives in [PRD.md](PRD.md) / [ARCHITECTURE.md](ARCHITECTURE.md).

1. **No-Code Agent Creation** *(kills P5)* — stand up an AI employee for a job by describing it, no engineering. Pick the job, set the voice, go live in under a day.
2. **Knowledge Ingestion & Grounding** *(kills P8, P3)* — feed the agent your docs, help center, and past tickets; answers are grounded in *your* knowledge, never fabricated.
3. **The Trust Ladder** *(kills P3)* — operator-controlled autonomy: Suggest → Draft-for-approval → Act-with-review → Autonomous. The agent earns its way up on proven performance. *This is the feature that makes adoption safe.*
4. **Human-in-the-Loop Review Queue** *(kills P2, P6)* — drafts flow to a reviewer who approves/edits in seconds; every correction trains the agent.
5. **Autonomous Resolution** *(kills P1, P2)* — at higher trust, the agent resolves end-to-end, unsupervised except on low-confidence cases.
6. **Smart Escalation** *(kills P3)* — when unsure, missing knowledge, or asked for an out-of-bounds action, the agent escalates *with context* instead of guessing.
7. **Full Observability & Replay** *(kills P4)* — every action logged, explainable, and replayable; nothing the operator can't audit.
8. **Outcome Dashboard** *(kills P7)* — resolution rate, escalation accuracy, CSAT, and cost-per-job, so ROI is self-evident.
9. **Continuous Improvement Loop** *(kills P6)* — the agent (and the platform) gets better with every supervised interaction — our compounding moat.
10. **Expansion to New Jobs** *(kills P1 at scale)* — add more agents and more job types within the same account.

---

## 12. Functional Requirements

> Product-level "the system must…" statements. Numbered for traceability; engineering-level FRs are in [PRD.md](PRD.md).

- **PFR-1 — Onboarding:** The platform must let a non-technical operator create an AI employee for a supported job and configure its brand voice.
- **PFR-2 — Knowledge:** The platform must ingest the operator's knowledge (documents, help-center, past Q&A), let them curate it, and ground agent answers in it.
- **PFR-3 — Channel:** The platform must receive work items from at least one business channel and deliver the agent's responses back through it.
- **PFR-4 — Reasoning:** The agent must interpret each work item, retrieve relevant knowledge, and produce a grounded response or action.
- **PFR-5 — Trust Ladder:** The operator must be able to set and change the agent's autonomy level, and the system must behave accordingly at each level.
- **PFR-6 — Review:** The platform must provide a queue where a reviewer can approve, edit, or reject agent output, and must capture those decisions as learning signal.
- **PFR-7 — Escalation:** The agent must escalate to a human (with context) when confidence is low, knowledge is missing, the request is out of bounds, or a human is requested.
- **PFR-8 — Guardrails:** The system must prevent unauthorized actions and resist manipulation (prompt-injection), escalating instead of acting.
- **PFR-9 — Observability:** The platform must log every agent action and let the operator replay any work item end-to-end.
- **PFR-10 — Metrics:** The platform must report resolution rate, escalation accuracy, volume, CSAT, and cost-per-job per agent.
- **PFR-11 — Multi-tenancy:** The platform must isolate each customer's data and knowledge completely.
- **PFR-12 — Roles:** The platform must support at least Operator (admin) and Reviewer roles.
- **PFR-13 — Improvement:** The platform must use captured corrections to improve future agent performance.
- **PFR-14 — Expansion:** The platform must let an operator add additional agents/jobs within their account.

---

## 13. Non-Functional Requirements

- **NFR-1 — Reliability:** Agent action success ≥ 99%; the platform treats reliability as an SLA, not an aspiration. Graceful, visible failure over silent failure.
- **NFR-2 — Trust & Safety:** No fabricated facts/policy; guardrails enforced deterministically; conservative defaults (new agents start supervised).
- **NFR-3 — Security:** Strict tenant isolation, encryption in transit and at rest, secrets in a vault, least-privilege access. Enterprise-audit-ready posture from the start.
- **NFR-4 — Privacy/Compliance:** PII minimized and deletable; GDPR-ready; SOC 2 posture documented now, certified when enterprise demand justifies.
- **NFR-5 — Performance:** Responses within latency acceptable for the channel; async processing so load never blocks intake.
- **NFR-6 — Scalability:** Horizontal scale with volume; the architecture scales from one design partner to thousands of tenants without redesign.
- **NFR-7 — Cost efficiency:** Cost-per-job instrumented and optimized; must stay below price with a path to ≥70% gross margin.
- **NFR-8 — Usability:** A non-technical operator can run the product unaided. Time-to-first-value < 1 day.
- **NFR-9 — Auditability:** Every agent decision is explainable and replayable.
- **NFR-10 — Availability:** Production uptime target ≥ 99.9% for the operator console and processing pipeline.

---

## 14. User Stories

**Operator**
- US-1: *As an operator, I want to create an AI support agent and connect my knowledge, so it can start handling tickets.*
- US-2: *As an operator, I want to set my agent's autonomy level, so I control how much it does on its own.*
- US-3: *As an operator, I want a dashboard of resolution rate, escalations, CSAT, and cost, so I can trust and tune the agent.*
- US-4: *As an operator, I want to replay any conversation, so I can audit what the agent did and why.*
- US-5: *As an operator, I want to raise autonomy as the agent proves itself, so I capture more value safely.*
- US-6: *As an operator, I want to add a second agent for another job, so I scale the wins.*

**Reviewer**
- US-7: *As a reviewer, I want agent drafts in a queue I can approve or edit fast, so I clear volume without rewriting.*
- US-8: *As a reviewer, I want my edits to teach the agent, so I stop seeing the same mistakes.*
- US-9: *As a reviewer, I want clear escalations with context, so I can resolve hard cases quickly.*

**End Customer (experienced, not operated)**
- US-10: *As a customer, I want a fast, correct answer, so my issue is resolved without friction.*

---

## 15. Acceptance Criteria

Representative, in Given/When/Then. (Full set tracked per story in delivery.)

- **AC for US-1:** *Given* an operator with knowledge sources, *when* they create an agent and ingest knowledge, *then* the agent is live and can produce a grounded draft for a relevant question within the same session (TTV < 1 day).
- **AC for US-2/US-5:** *Given* an agent at "Draft-for-approval," *when* the operator raises autonomy, *then* the agent's send behavior changes accordingly — and "Autonomous" is only selectable once the agent meets the published reliability threshold.
- **AC for US-7:** *Given* an agent in "Draft-for-approval," *when* a ticket arrives, *then* a draft appears in the review queue and is not sent until a reviewer approves.
- **AC for US-8:** *Given* a reviewer edits a draft, *when* a similar ticket later arrives, *then* the correction measurably influences the new response.
- **AC for Escalation (PFR-7/8):** *Given* a customer asks for a refund beyond policy or attempts a prompt-injection, *when* the agent processes it, *then* the agent escalates (does not act), regardless of autonomy level, with context attached.
- **AC for US-4 (PFR-9):** *Given* any handled work item, *when* the operator opens it, *then* they see the full ordered trail of what the agent saw, retrieved, and decided.
- **AC for US-3 (PFR-10):** *Given* handled volume, *when* the operator opens the dashboard, *then* resolution rate, escalation rate, and cost-per-job are shown and reconcile with the underlying log.

**Global gate:** no feature is "accepted" without evidence (test/eval) that it behaves as specified — and no AI capability graduates to higher autonomy without passing its eval suite ([ENGINEERING-BIBLE.md](ENGINEERING-BIBLE.md) §8).

---

## 16. Success Metrics

**North Star Metric: Work Successfully Completed by AI employees** (e.g., tickets resolved at acceptable quality) — it captures customer value *and* our revenue engine in one number.

**Acquisition & activation**
- Time-to-first-value (signup → first real job handled): **< 1 day**
- Activation rate (new accounts reaching first resolved job)

**Core product quality**
- **Resolution rate** (handled without human edit): target ≥ 50% in design-partner phase, climbing
- **Assisted rate** (used with minor edit): ≥ 30%
- **Escalation accuracy** (correct escalations, low false-confidence): ≥ 95%
- **CSAT** on agent-handled work: ≥ parity with human
- **Action success / reliability:** ≥ 99%

**Business**
- **Net Revenue Retention (the company-defining metric): > 130%**
- Cost-per-completed-job < price, on a path to **≥ 70% gross margin**
- Expansion rate (accounts adding agents/jobs)
- Logo retention / churn

**Trust (leading indicator of expansion)**
- % of agents that graduate to higher autonomy over time

---

## 17. Pricing Strategy

**Principle: price against the cost of labor, not the cost of software.** If an AI employee does a job a human is paid for, we can charge a fraction of that and still be a no-brainer — far above what per-seat SaaS could capture.

**Model: hybrid platform fee + usage/outcome fee, with expansion built in.**
1. **Platform base** — predictable subscription for access + supervision console + integrations (anchors the relationship).
2. **Usage/outcome fee** — per completed job; revenue scales super-linearly with customer success (the engine).
3. **Expansion** — more agents, more jobs, higher autonomy tiers, premium SLA, enterprise (SSO/audit/dedicated infra).

**Tiers (illustrative; calibrate to the wedge's real labor cost):** Starter (solo/small) → Growth (SMB, the land tier) → Scale (mid-market, the expansion engine) → Enterprise (custom, committed-use).

**Guardrails:**
- **Floor = our COGS + margin.** Never price a job below (model + infra + review) cost.
- **Free trial = limited *jobs*, not limited *time*** — conversion happens when they feel real work get done.
- **Expansion must be frictionless** — pricing is never the reason an account doesn't grow.

*(Full economic model in [FOUNDATION.md](FOUNDATION.md) §6–§10.)*

---

## 18. Risks

| # | Risk | Type | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Agent gives wrong/harmful answers → trust collapse | Product/Trust | Existential | Grounding, deterministic guardrails, conservative default autonomy, escalation, evals-as-gates |
| R2 | Reliability too low to sell as "labor" | Product | Existential | Reliability-as-SLA, start supervised, measure relentlessly, graduate on proof |
| R3 | Cost-per-job > price → no margin | Business | High | Cost instrumentation, model tiering, caching, review automation as trust grows |
| R4 | Foundation-model vendor risk (price/limits/policy) or they move up-stack | Strategic | High | Model-agnostic core; own the vertical workflow, data, and trust relationship |
| R5 | Category commoditizes (generic agent builders) | Market | High | Win a wedge deeply; proprietary supervised-workflow data; switching cost once in production |
| R6 | Slow adoption due to fear of AI in front of customers | GTM | High | Trust ladder + transparency + design-partner proof; conservative defaults |
| R7 | Can't land design partners → no learning loop | GTM | High | Founder-led outreach; pick a wedge where we have access/advantage |
| R8 | Scope creep into "full platform" too early → never ship | Execution | High | Hard non-goals; wedge discipline; staged roadmap |
| R9 | Regulatory/compliance (PII, GDPR, AI disclosure) | Legal | Medium-High | Privacy-by-design, disclosure policy, compliance posture documented from day one |
| R10 | Key-person / single-founder execution risk | Org | Medium | Documented source-of-truth (this stack), early hiring against the moat (AI reliability) |

---

## 19. Future Roadmap

Outcome-framed phases (not dates — gated by learning and proof):

- **Phase 0 — Prove the wedge (now):** 3–5 design partners in customer support. Prove an AI employee reliably resolves real tickets and they'll pay. *Exit:* reliability + willingness-to-pay validated.
- **Phase 1 — Productize the wedge:** self-serve onboarding < 1 day, full trust ladder, dashboard, evals-in-CI gating autonomy. *Exit:* repeatable sales, healthy unit economics.
- **Phase 2 — Expand within accounts:** second/third job types (e.g., SDR, back-office), drive NRR > 130%. *Exit:* expansion engine proven.
- **Phase 3 — Go horizontal & up-market:** generalize agent creation so customers (and partners) build their own AI employees for new jobs; enterprise (SSO, audit, dedicated infra, SOC 2). *Exit:* platform, not point solution.
- **Phase 4 — The workforce ecosystem:** marketplace of pre-trained vertical agents; partners and integrations; the supervised-workflow data moat becomes a network effect. *Vision realized:* "Genesis" is the verb for hiring a digital worker.

---

## Appendix — Open Decisions (must close to lift this from DRAFT to v1.0)

1. Confirm the **thesis** (AI Workforce Platform) — or redirect.
2. Confirm the **wedge** (customer support) — or choose another (SDR / back-office).
3. First **channel** (email/shared inbox vs. a specific help-desk a design partner uses).
4. Access to **3–5 design partners** — who?
5. Hard **constraints**: region, compliance, budget, AI-disclosure policy.

*This document is the company's single source of truth. Changes go through the owner; material strategic shifts should be reflected here first, then cascade to the companion docs.*
