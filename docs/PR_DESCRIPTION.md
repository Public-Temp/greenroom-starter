# PR Description: Settlement Readiness Gate

## Summary

This PR adds a focused **Settlement Readiness Gate** to Greenroom's show detail and settlement flows. The feature turns messy settlement signals into a risk score, a recommended gate, and a human Hold/Proceed decision before Mariana enters the 2:00am settlement walkthrough.

The product bet is intentionally narrow: settlement is not only a calculator problem. It is a trust workflow where ambiguous assumptions, recoup treatment, expense caps, comps, and signoff contradictions become expensive when they surface too late.

## Why This Slice

Coastal Spell is the clearest proving ground. The show combines a guarantee-vs-percentage deal, a marketing recoup, an expense cap, a disputed recoup line, and a status/signoff mismatch.

I chose this slice instead of a universal settlement calculator because the case asks for a sharp, defensible cut. The feature prevents the trust-breaking moment earlier, while still keeping human approval in the loop.

## What Changed

- Added `lib/settlementReadiness.ts`
  - Computes readiness status, risk score, severity factors, trust signals, owner breakdown, recommended gate, dynamic score trajectory, checklist, 2:00am walkthrough notes, and agent clarification draft.
  - Detects unsupported deal math, marketing-recoup/cap ambiguity, disputed recoups, signoff/status contradictions, agent-source conflict, hospitality cap overruns, comp contradictions, duplicate expenses, and prose-vs-structured-field drift.

- Added `components/settlement/settlement-readiness-panel.tsx`
  - Shows blocker/warning/trust-signal tiles, score bar, recommended Hold/Proceed gate, top risk factors, dynamic score preview, owner action map, audit preview, factor breakdown, checklist, and copyable agent clarification draft.

- Updated `app/shows/[id]/page.tsx`
  - Adds the full readiness panel to the show detail page so risk is visible before settlement.

- Updated `app/shows/[id]/settle/page.tsx`
  - Adds the full interactive readiness panel inside the settlement page so the breakdown and Hold/Proceed gate remain visible at the decision moment.

- Added `scripts/check-settlement-readiness.ts`
  - Lightweight regression coverage for the readiness engine.

## Preview

Recommended demo routes:

```text
/shows/show_coastal_spell_dispute
/shows/show_coastal_spell_dispute/settle
```

Preview screenshots:

- `docs/previews/preview_show_detail.png`
- `docs/previews/preview_settlement_page.png`
- `docs/previews/preview_gate_created.png`

## How To Test

```bash
npm install
npm run db:reset
npx tsc --noEmit
npm run lint
npm run test:readiness
npm run build
npm run dev
```

## Validation Completed

- TypeScript passes.
- Readiness model test passes.
- Production build passes.
- Lint passes with only pre-existing seed-data warnings in `db/seed.ts`.

## Deliberate Cuts

- Full settlement calculator for every deal type.
- External LLM/API dependency.
- Persistent gate writes to the database.
- Agent portal.
- Accounting integration.
- Full dispute-management workflow.

These were cut because the highest-leverage prototype is the decision moment before settlement moves forward, not every downstream workflow.

## Production Next Steps

1. Persist gate decisions and audit snapshots.
2. Add LLM-assisted extraction for ambiguous deal language from deal notes and email threads.
3. Add a pre-show agent clarification workflow.
4. Track outcome metrics: disputed settlements per 100 shows, next-day agent questions, average settlement walkthrough time, Hold override rate, and percentage of settlements with complete evidence packets.
