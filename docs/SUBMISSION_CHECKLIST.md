# Submission Checklist

## Required Submission

- Final PDF memo: `Mabruk_Sheikh_Clipboard_Greenroom_Settlement_Readiness_Gate.pdf`
- Public GitHub fork link
- Loom walkthrough link

## GitHub Review Path

```text
/shows/show_coastal_spell_dispute
/shows/show_coastal_spell_dispute/settle
```

## Commands To Run Before Submitting

```bash
npm install
npm run db:reset
npx tsc --noEmit
npm run lint
npm run test:readiness
npm run build
```

## Ashby Notes Template

```text
Submission artifacts:

PDF memo: attached.

GitHub fork:
https://github.com/Public-Temp/greenroom-starter

Branch:
settlement-readiness-risk-gate

Pull request:
https://github.com/Public-Temp/greenroom-starter/pull/1

Loom walkthrough:
<PASTE_LOOM_URL>

Demo routes:
- /shows/show_coastal_spell_dispute
- /shows/show_coastal_spell_dispute/settle

Prototype summary:
I built a Settlement Readiness Gate for the Greenroom settlement workflow. The feature computes a risk score from settlement factors, recommends Hold or Proceed, surfaces evidence and owner actions, and gives Mariana a human-controlled decision point before settlement moves forward.

Validation run:
- npx tsc --noEmit
- npm run lint
- npm run test:readiness
- npm run build
```

## Email Guidance

Do not send a separate thank-you email after submission. Only email if the portal upload fails, the Notes field drops the links, or there is a real process/access issue.
