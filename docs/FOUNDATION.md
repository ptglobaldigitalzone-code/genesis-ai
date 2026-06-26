# Genesis AI — Founding Document

> **Status:** DRAFT v0.1 — awaiting founder approval
> **Owner:** CTO
> **Last updated:** 2026-06-26

---

## ⚠️ Core Assumption (override this with one word and I rewrite everything below)

You have not yet told me what Genesis AI does. Rather than invent something generic, I have committed to a **specific, high-upside thesis**. Everything in this document flows from it. If it's wrong, say so and I rebuild the whole document around your thesis — cheaply, because it's just text right now.

**THE THESIS:**
> **Genesis AI is an AI workforce platform.** It lets a business stand up autonomous **AI employees** — agents that do real, end-to-end work (handle support, qualify leads, process documents, run back-office ops) — without hiring engineers. You describe the job; Genesis builds, deploys, supervises, and improves the agent.

**Why this thesis is billion-dollar shaped:**
- The buyer isn't paying for software, they're paying for **labor** — a far larger budget line than SaaS.
- Pricing can scale with *value delivered* (work done), not seats.
- Foundation models (Claude, etc.) make it newly possible; the moat is in orchestration, reliability, and proprietary workflow data — not the model.

**The single most important decision I need from you** is at the bottom: *which vertical we wedge into first.* Read to the end.

---

## 1. Vision

**A world where every business — from a 2-person shop to an enterprise — can hire AI employees as easily as posting a job, and trust them to do the work.**

We are not building "another AI chatbot." We are building the platform on which the next 100 million digital workers are created. Ten years out, "Genesis" is the verb for spinning up an AI worker.

## 2. Mission

**Make autonomous AI work reliable enough to be accountable for real business outcomes — and make creating it require zero engineering.**

Two hard problems, deliberately chosen: (1) **reliability** (agents that don't quietly fail), and (2) **accessibility** (a non-technical operator can build one). Whoever solves both owns the category.

## 3. Core Values

1. **Outcomes over output.** We are paid for work done, not features shipped. We measure ourselves the way our customers do.
2. **Earn trust in increments.** AI doing real work is scary. We expand an agent's autonomy only as it earns it — humans-in-the-loop by default, autonomy as a graduation.
3. **Reliability is the product.** A flashy demo that fails 5% of the time is worthless for labor. Boring dependability is our luxury good.
4. **Honesty about limits.** We tell customers what AI *can't* do yet. Overpromising is how AI startups die.
5. **Speed with reversibility.** Move fast on decisions we can undo; deliberate on one-way doors.
6. **Own the whole result.** Not "we gave you a tool." We are accountable for the agent working in production.

## 4. Product Principles

1. **Job-to-be-done, not features.** The unit of value is a *completed job*, not a dashboard. Every screen answers "is the work getting done?"
2. **Trust ladder, always visible.** Suggest → Draft-for-approval → Act-with-review → Autonomous. Every agent shows where it sits and graduates explicitly.
3. **Observable by default.** Every action an agent takes is logged, replayable, and explainable. No black boxes the operator can't audit.
4. **Graceful failure beats silent failure.** When unsure, the agent escalates to a human — never guesses and hides it.
5. **Time-to-first-value < 1 day.** A new customer must see one real job done by their agent on day one, or we've lost them.
6. **The operator is non-technical.** If it needs a developer, we've failed. Configuration is conversation + examples, not code.
7. **Compounding data moat.** Every supervised correction makes that customer's agent (and our platform) better. We design for the feedback loop.

## 5. Engineering Principles

1. **Reliability is an SLA, not an aspiration.** We define and monitor success rate, escalation rate, and time-to-completion per agent. Regressions page someone.
2. **Model-agnostic core.** We orchestrate models; we are not married to one. Default to the most capable Claude models, but the architecture swaps providers without a rewrite. No vendor owns our roadmap.
3. **Everything an agent does is an event.** Event-sourced action log → audit, replay, debugging, and training data come for free.
4. **Determinism around non-determinism.** LLM calls are non-deterministic; the scaffolding around them (validation, retries, guardrails, idempotency) is rigorously deterministic and tested.
5. **Evals are tests.** No agent capability ships without an eval suite. We treat eval coverage like code coverage. Prompt changes run through CI evals.
6. **Secure multi-tenancy from line one.** Customer data isolation is not a v2 feature. Assume enterprise will audit us.
7. **Cost is a first-class metric.** Token spend per completed job is tracked like latency. An agent that works but costs more than the labor it replaces is a failure.
8. **Boring tech for the boring parts.** Innovate on the agent layer; use proven, well-understood infrastructure for storage, queues, and auth.
9. **Build vs. buy bias = buy, until it's the moat.** We don't build what a vendor does well. We build only the orchestration/reliability layer that is our differentiation.

## 6. Business Model

**We sell digital labor, billed by work performed — a usage-based "AI workforce" model, not seat-based SaaS.**

- **What the customer buys:** AI employees that complete a defined job (resolved tickets, qualified leads, processed invoices).
- **Unit of value:** a *completed job* (or resolution / qualified lead / processed document — defined per use case).
- **Why not seats:** seats cap our upside and misalign incentives. We win when the customer's work volume grows; usage billing captures that automatically.
- **Gross margin structure:** Revenue per job − (model/token cost + infra + human-in-loop review cost). Target **70%+ gross margin** at scale; the path there is driving token-cost-per-job down via caching, smaller models for sub-tasks, and automation of the review step as trust grows.
- **Land-and-expand:** start with one agent doing one job → expand to more jobs, more autonomy, more volume. Net revenue retention is the metric that makes us a billion-dollar company.

## 7. Revenue Strategy

**Three layers, stacked over time:**

1. **Platform fee (base subscription)** — predictable MRR; covers access, supervision dashboard, integrations. Anchors the relationship.
2. **Usage / outcome fee (the engine)** — per completed job. This is where revenue scales super-linearly with customer success. The core of the billion-dollar math.
3. **Expansion (the multiplier)** — more agents, more departments, higher autonomy tiers, premium SLAs, enterprise (SSO, audit, dedicated infra).

**The financial north star: Net Revenue Retention > 130%.** A company that keeps 100 customers and grows each 1.3x/yr compounds to a billion faster than one chasing logos with flat accounts. Land small, expand relentlessly.

**Secondary lever (later):** the supervised-correction data becomes a moat and, potentially, a marketplace of pre-trained vertical agents others can deploy.

## 8. Go-To-Market

**Strategy: Vertical wedge → horizontal platform.** The agent platform space is crowded with generic "build any agent" tools that win no one deeply. We win by being *unbeatable at one job in one industry first*, then expanding.

**Phases:**
- **Phase 0 — Design partners (now → 3 mo):** 3–5 hand-held customers in ONE vertical. We do things that don't scale: build their agents ourselves, learn the workflow cold. Goal: prove one agent reliably does real work and they'd pay.
- **Phase 1 — Productize the wedge (3–9 mo):** turn what we learned into self-serve for that one job/vertical. Pricing live. Goal: repeatable sales, <1 day time-to-value.
- **Phase 2 — Expand within accounts (9–18 mo):** second and third agent types; drive NRR. Same customers, more jobs.
- **Phase 3 — Horizontal platform (18 mo+):** generalize the agent builder so customers (and partners) create their own agents for new jobs.

**Motion:** founder-led sales in Phase 0 (no marketing spend — direct outreach + network). Product-led + inside sales once self-serve works. Enterprise/field sales only when ACVs justify it.

**Distribution wedge to consider:** integration marketplaces (e.g., the help-desk / CRM app store of whatever vertical we pick) for cheap, qualified distribution.

## 9. Competitive Analysis

| Competitor type | Examples (category) | Their strength | Where we win |
|---|---|---|---|
| **Horizontal agent builders** | "Build any AI agent" platforms | Flexible, developer-loved | They're generic → shallow at any one job. We're accountable for outcomes in one vertical, no-code. |
| **Incumbent SaaS adding "AI"** | CRMs, help-desks bolting on AI copilots | Distribution, existing data | Their AI is a feature assisting a human. Ours *does the job*. Bolt-on copilots ≠ autonomous labor. |
| **AI point solutions** | Single-purpose "AI SDR", "AI support" tools | Polished for one task | Locked to one task, one model. We're a platform: many jobs, expansion, model-agnostic. |
| **DIY on raw foundation models** | In-house teams on Claude/OpenAI APIs | Full control, no vendor | Reliability, evals, supervision, and multi-tenancy are *hard*. We sell the 18 months they'd spend building scaffolding. |
| **Consulting / agencies** | AI dev shops | Bespoke, high-touch | Doesn't scale, no compounding product. We productize what they do by hand. |

**Our defensible moat (in order it develops):** (1) reliability engineering + evals others underinvest in, (2) proprietary supervised-workflow data per vertical, (3) deep vertical integrations, (4) switching cost once agents run production work, (5) brand as *the* accountable AI-worker platform.

**Honest risk:** foundation-model vendors move up the stack and the "agent platform" category commoditizes. **Defense:** own the vertical workflow, data, and trust relationship — the parts a model vendor won't go deep on.

## 10. Pricing

**Model: hybrid — platform base + usage, with outcome-aligned tiers.** Illustrative (to be calibrated against the chosen vertical's real labor cost — pricing must undercut the human alternative while protecting margin):

| Tier | Who | Base / mo | Usage | Included | Purpose |
|---|---|---|---|---|---|
| **Starter** | Solopreneur / small team | $99 | $X per completed job after included | 1 agent, 100 jobs/mo | Cheap entry, prove value |
| **Growth** | SMB | $499 | lower $X/job | 3 agents, 1,000 jobs/mo, integrations | The volume tier — land here |
| **Scale** | Mid-market | $2,000+ | volume-discounted | Multiple agents, higher autonomy, priority SLA | Expansion engine |
| **Enterprise** | Large orgs | Custom | Committed-use contract | SSO, audit logs, dedicated infra, custom SLA | High ACV, defensible |

**Pricing principles:**
- **Anchor to labor cost, not software cost.** If an agent does a job a human is paid $5 for, we can charge $1–2 and still be a no-brainer — vastly more than per-seat SaaS would allow.
- **Price floor = our COGS + margin.** Never sell a job below (token + infra + review) cost. Cost-per-job is monitored continuously.
- **Free trial = limited jobs, not limited time.** Let them feel real work get done; that's the conversion event.
- **Expansion is frictionless.** Adding agents/volume should be self-serve and instant. Never let pricing be the reason they don't expand.

## 11. Target Customer

**Primary (Phase 0–2): Small and mid-market businesses (SMB/mid-market) in one chosen vertical**, drowning in repetitive operational work, who can't easily hire or afford more staff and have no engineering team.

- **The buyer:** an ops leader / founder / department head who *feels the pain of headcount* and owns a budget for getting work done.
- **Why SMB/mid-market first, not enterprise:** shorter sales cycles, less procurement friction, faster learning loops, and they feel labor scarcity most acutely. Enterprise comes in Phase 3 once reliability and compliance are proven.
- **Why not consumer:** consumers won't pay for reliability and there's no expansion/NRR engine. The money is in business labor budgets.

**Anti-persona (who we say no to early):** large enterprises with heavy compliance demands (too slow for our learning phase), and "tire-kicker" technical users who want a raw agent SDK (that's a different, lower-margin business).

---

## 🔑 The One Decision I Need From You

Everything above is solid **except** it has a placeholder: **which vertical do we wedge into first?** This is the single highest-leverage decision in the whole company — it determines our first customers, integrations, pricing, and demo. A platform that's "for everyone" on day one is for no one.

**My recommendation — pick a vertical that is (a) repetitive-work-heavy, (b) has clear $-value per job, (c) is underserved by incumbents, (d) you or I can get to first customers in.** Strong candidates:

1. **Customer support** (AI support agent resolving tickets) — huge, clear ROI, easy to measure, crowded but winnable on reliability.
2. **Sales development** (AI SDR qualifying/booking leads) — high $-value per job, buyers pay eagerly.
3. **Back-office document ops** (invoices, claims, onboarding paperwork) — deeply painful, less crowded, very sticky.
4. **A vertical you have an unfair advantage in** — an industry you know, have a network in, or have data for. *This usually beats picking the "biggest" market.*

**Tell me: (1) Is the AI-workforce thesis right, or do you have a different product in mind? (2) Which vertical do we wedge into first?**

Answer those two and I'll: lock this document to v1.0, draft the **north-star technical architecture**, and propose **Sprint 1 scope** for your approval.
