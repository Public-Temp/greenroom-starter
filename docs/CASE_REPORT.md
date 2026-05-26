# Case Report: Settlement Readiness Risk Gate

This document is the repo companion to the case-study memo/PRD. It explains the product decision, how to review the prototype, and how the code maps to the case narrative.

## Summary

This prototype adds a **Settlement Readiness Risk Gate** to Greenroom. It helps Mariana identify risky settlement assumptions before the late-night signoff conversation, understand why those risks matter, and choose whether to **Hold** or **Proceed**.

The product bet is that settlement trust breaks before the final arithmetic. Ambiguous deal language, disputed recoups, comps, expense caps, and signoff mismatches create the conditions for a dispute. The prototype makes those risks visible earlier, while still leaving the final move-forward decision to the operator.

The readiness score is dynamic. Risk factors raise the score, trust signals lower it, and the gate only improves when the underlying deal, recoup, expense, contact, or settlement data is clarified.

## Primary Scenario

Use the Coastal Spell dispute as the main walkthrough:

```text
/shows/show_coastal_spell_dispute
/shows/show_coastal_spell_dispute/settle
```

The readiness model marks this show as high risk because the case combines:

- unsupported `vs` deal math;
- marketing recoup and expense-cap ambiguity;
- a disputed recoup line item;
- disputed settlement status despite positive signoff text;
- source conflict between deal notes and structured agency data.

## What Changed In The Product

### 1. Risk Factor Calculation

The show detail page now surfaces a risk factor calculation before the normal deal details. It shows the readiness status, total risk score, and top risk highlights directly in the row so Mariana can see the issue without opening a separate report.

### 2. Risk Breakdown

The breakdown explains each risk factor with evidence, why it matters, owner, and required action. This makes the recommendation auditable instead of asking the user to trust a black-box score.

### 3. Dynamic Score Preview

The panel shows how readiness changes as source data is fixed. For example, clarifying disputed recoup treatment can lower the score, but unresolved blockers still keep the gate in Hold.

### 4. Move-Forward Gate

The system recommends a gate, but it does not silently decide. Mariana must choose **Hold** or **Proceed**. Until she chooses, the state remains **Decision required**.

### 5. Settlement Workflow Context

The settlement page includes the full interactive readiness panel so the risk context, risk factor breakdown, and Hold/Proceed gate remain available while Mariana works through the settlement.

## Preview Path

Start the app:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000/shows/show_coastal_spell_dispute
http://localhost:3000/shows/show_coastal_spell_dispute/settle
```

Expected review flow:

1. Open the Coastal Spell show detail page.
2. Review the Settlement readiness panel.
3. Check the top risk factor highlights.
4. Open the risk factor breakdown.
5. Review the dynamic score preview.
6. Choose Hold or Proceed in the move-forward gate.
7. Open the settlement workflow and confirm the risk factor breakdown and Hold/Proceed gate remain available.

## Implementation Map

| File | Purpose |
|---|---|
| `lib/settlementReadiness.ts` | Readiness model, risk scoring, findings, owner actions, checklist, and clarification copy. |
| `components/settlement/settlement-readiness-panel.tsx` | UI for risk score, highlights, dynamic score preview, breakdown, Hold/Proceed gate, and supporting review sections. |
| `app/shows/[id]/page.tsx` | Adds the full readiness panel to show detail. |
| `app/shows/[id]/settle/page.tsx` | Adds the full interactive readiness panel to settlement. |
| `scripts/check-settlement-readiness.ts` | Regression check for Coastal Spell and a clean flat-deal scenario. |

## Risk Model

The model currently checks for:

- unsupported deal math, especially `vs` and percentage-of-net deals;
- marketing recoup and expense-cap ambiguity;
- disputed recoup line items;
- disputed status with positive signoff text;
- source conflicts between prose and structured data;
- hospitality cap overruns;
- comp gross-counting contradictions;
- possible duplicate expenses;
- structured deal fields that drift from trusted prose;
- trust signals such as documented recoup treatment, clean signoff, agreed recoups, and visible absorbed costs.

Scoring is intentionally simple:

| Signal | Points | Meaning |
|---|---:|---|
| High-risk blocker | +30 | Can change payout, reopen a dispute, or force off-platform settlement. |
| Medium warning | +15 | Needs confirmation before signoff. |
| Trust signal | -10 | Reduces ambiguity, but does not override an unresolved blocker. |

The score is capped at 100. A blocker keeps the recommendation in Hold even when trust signals reduce the numeric score. The score is a triage signal for human review, not settlement math.

## AI Boundary

This prototype uses deterministic logic so reviewers can inspect and run it locally. In production, AI can help parse messy deal prose, compare prose against structured fields, detect ambiguous clauses, and draft clarification language. Human approval remains the final decision point.

## Metrics To Validate

- disputed settlements per 100 shows;
- next-day agent questions;
- settlement walkthrough time;
- Hold override rate;
- evidence packet completeness.

## Validation

Run:

```bash
npx tsc --noEmit
npm run lint
npm run test:readiness
npm run build
```

`npm run test:readiness` checks that:

- Coastal Spell is blocked/high risk and recommends Hold;
- clarified Coastal Spell data lowers risk while unresolved unsupported math still blocks the gate;
- a clean flat-deal settlement remains ready.

Known note: lint may report existing warnings in `db/seed.ts`; this feature should not introduce lint errors.

## Scope Decisions

This prototype intentionally does not include:

- persisted Hold/Proceed decisions;
- a full settlement calculator rewrite;
- external AI calls;
- an agent-facing portal;
- payment or accounting integrations;
- receipt upload workflows.

Those are future product decisions. This case-study slice focuses on risk calculation, evidence, and the human move-forward gate.
