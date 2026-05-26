# Preview Capture Guide

Use three screenshots in the GitHub preview. Keep them focused on the decision flow rather than uploading many separate Ashby files.

## Run Locally

```bash
npm install
npm run db:reset
npm run dev
```

## Screenshots To Capture

1. **Show detail page: full readiness panel**
   - URL: `http://localhost:3000/shows/show_coastal_spell_dispute`
   - Focus: risk score, recommended gate, and top factors.
   - Save as: `docs/previews/preview_show_detail.png`
   - Caption: "Coastal Spell is flagged before settlement because recoup/cap ambiguity, disputed recoup state, and unsupported deal math make the walkthrough unsafe."

2. **Settlement page: full readiness panel**
   - URL: `http://localhost:3000/shows/show_coastal_spell_dispute/settle`
   - Focus: risk factor breakdown and Hold/Proceed gate inside the settlement worksheet.
   - Save as: `docs/previews/preview_settlement_page.png`
   - Caption: "The full readiness gate stays visible inside settlement so Mariana can review the risk breakdown and choose Hold or Proceed while checking the math."

3. **Gate-created state after Hold**
   - URL: `http://localhost:3000/shows/show_coastal_spell_dispute`
   - Action: choose **Hold**, then create the move-forward gate.
   - Save as: `docs/previews/preview_gate_created.png`
   - Caption: "After Mariana chooses Hold, Greenroom creates an audit preview with unresolved blockers, owner actions, and an agent clarification draft."

## Reviewer Notes

- The recommendation is advisory; Mariana still makes the human Hold/Proceed decision.
- The score is a triage signal, not settlement math.
- The score is dynamic: trust signals can lower risk, but unresolved blockers keep the gate in Hold.
- The output is operational: owner action map, audit preview, 2:00am walkthrough notes, and agent clarification draft.
