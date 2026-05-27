import assert from "node:assert/strict";
import { getSettlementReadiness } from "../lib/settlementReadiness";
import type { Agency, Agent, Comp, Deal, Expense, Recoup, Settlement, Show } from "../db/schema";

const date = new Date("2025-03-19T02:00:00Z");

const coastalShow = {
  id: "show_coastal_spell_dispute",
  venueId: "venue_crescent",
  artistId: "artist_coastal_spell",
  date: "2025-03-19",
  status: "settled",
  doorsTime: "19:00",
  setTime: "21:00",
  openerArtistId: null,
  roomConfig: "standing",
  internalNotes:
    "Disputed by WME (Daniel Hwang) on 3/18 over the $900 marketing recoup. Marcus authorized additional $720 to resolve.",
  createdAt: date,
} as Show;

const coastalAgent = {
  id: "agent_sarah_kim",
  name: "Sarah Kim",
  agencyId: "agency_caa",
  email: "sarah@example.com",
  phone: null,
  preferencesNotes: null,
} as Agent;

const coastalAgency = {
  id: "agency_caa",
  name: "CAA",
} as Agency;

const coastalDeal = {
  id: "deal_coastal_spell",
  showId: "show_coastal_spell_dispute",
  dealType: "vs",
  guaranteeAmount: 5000,
  percentage: 0.8,
  percentageBasis: "net",
  expenseCap: 2500,
  hospitalityCap: null,
  bonusesJson: null,
  dealNotesFreetext:
    "$5,000 guarantee vs 80% of net. $2,500 expense cap. $900 marketing recoup against gross.",
  createdAt: date,
} as Deal;

const disputedSettlement = {
  id: "settlement_coastal_spell",
  showId: "show_coastal_spell_dispute",
  status: "disputed",
  draftedAt: date,
  submittedAt: date,
  reviewStartedAt: date,
  signedAt: date,
  disputedAt: date,
  revisedAt: null,
  finalizedAt: null,
  paidAt: null,
  completedAt: null,
  completedByUserId: null,
  grossBoxOffice: 18000,
  netBoxOffice: 15100,
  totalExpenses: 2500,
  totalToArtist: 12285,
  calculationJson: null,
  recoupsJson: null,
  signoffText: "OK - but flag any future marketing recoup deals.",
  notes: "Formal revision not pushed back into system.",
} as Settlement;

const disputedMarketingRecoup = {
  id: "recoup_spotify",
  category: "marketing",
  label: "Spotify pre-show ad spend",
  amount: 900,
  status: "disputed",
} satisfies Recoup;

const coastalSpellReadiness = getSettlementReadiness({
  show: coastalShow,
  agent: coastalAgent,
  agency: coastalAgency,
  deal: coastalDeal,
  settlement: disputedSettlement,
  expenses: [],
  comps: [],
  recoups: [disputedMarketingRecoup],
});

assert.equal(coastalSpellReadiness.status, "blocked");
assert.equal(coastalSpellReadiness.riskLevel, "High");
assert.equal(coastalSpellReadiness.riskScore, 100);
assert.equal(coastalSpellReadiness.recommendedGate.decision, "hold");
assert.ok(coastalSpellReadiness.riskFactors.some((f) => f.findingId === "unsupported-deal-math"));
assert.ok(coastalSpellReadiness.riskFactors.some((f) => f.findingId === "marketing-recoup-cap"));
assert.ok(coastalSpellReadiness.riskFactors.some((f) => f.findingId === "disputed-recoup"));
assert.ok(coastalSpellReadiness.riskFactors.some((f) => f.findingId === "positive-signoff-disputed-status"));
assert.ok(coastalSpellReadiness.riskFactors.some((f) => f.findingId === "agent-source-conflict"));
assert.ok(coastalSpellReadiness.readinessTrajectory.length >= 3);
assert.equal(coastalSpellReadiness.readinessTrajectory[0]?.gateLabel, "Hold");

const clarifiedCoastalReadiness = getSettlementReadiness({
  show: {
    ...coastalShow,
    internalNotes: "Clarification confirmed with Sarah Kim at CAA before settlement.",
  } as Show,
  agent: coastalAgent,
  agency: coastalAgency,
  deal: {
    ...coastalDeal,
    dealNotesFreetext:
      "$5,000 guarantee vs 80% of net. $2,500 expense cap. $900 marketing recoup included inside the expense cap.",
  } as Deal,
  settlement: {
    ...disputedSettlement,
    status: "signed",
    disputedAt: null,
    signoffText: "Signed - marketing recoup included inside the expense cap.",
    notes: "Agent and tour manager confirmed recoup treatment before final signoff.",
  } as Settlement,
  expenses: [],
  comps: [],
  recoups: [{ ...disputedMarketingRecoup, status: "agreed" } satisfies Recoup],
});

assert.equal(clarifiedCoastalReadiness.status, "blocked");
assert.equal(clarifiedCoastalReadiness.recommendedGate.decision, "hold");
assert.ok(clarifiedCoastalReadiness.riskScore < coastalSpellReadiness.riskScore);
assert.ok(clarifiedCoastalReadiness.riskFactors.some((f) => f.findingId === "recoup-treatment-documented"));
assert.ok(clarifiedCoastalReadiness.riskFactors.some((f) => f.findingId === "clean-signoff-captured"));
assert.ok(!clarifiedCoastalReadiness.riskFactors.some((f) => f.findingId === "disputed-recoup"));
assert.ok(!clarifiedCoastalReadiness.riskFactors.some((f) => f.findingId === "positive-signoff-disputed-status"));

const cleanFlatReadiness = getSettlementReadiness({
  show: {
    id: "show_clean_flat",
    venueId: "venue_crescent",
    artistId: "artist_clean",
    date: "2025-03-20",
    status: "settled",
    doorsTime: "19:00",
    setTime: "21:00",
    openerArtistId: null,
    roomConfig: "standing",
    internalNotes: null,
    createdAt: date,
  } as Show,
  agent: null,
  agency: null,
  deal: {
    id: "deal_clean_flat",
    showId: "show_clean_flat",
    dealType: "flat",
    guaranteeAmount: 3000,
    percentage: null,
    percentageBasis: null,
    expenseCap: null,
    hospitalityCap: null,
    bonusesJson: null,
    dealNotesFreetext: "$3,000 flat guarantee.",
    createdAt: date,
  } as Deal,
  settlement: {
    id: "settlement_clean_flat",
    showId: "show_clean_flat",
    status: "signed",
    draftedAt: date,
    submittedAt: date,
    reviewStartedAt: date,
    signedAt: date,
    disputedAt: null,
    revisedAt: null,
    finalizedAt: null,
    paidAt: null,
    completedAt: null,
    completedByUserId: null,
    grossBoxOffice: 5000,
    netBoxOffice: 4500,
    totalExpenses: 0,
    totalToArtist: 3000,
    calculationJson: null,
    recoupsJson: null,
    signoffText: "Signed.",
    notes: null,
  } as Settlement,
  expenses: [] satisfies Expense[],
  comps: [] satisfies Comp[],
  recoups: [] satisfies Recoup[],
});

assert.equal(cleanFlatReadiness.status, "ready");
assert.equal(cleanFlatReadiness.riskScore, 0);
assert.equal(cleanFlatReadiness.recommendedGate.decision, "ready");
assert.ok(cleanFlatReadiness.riskFactors.some((f) => f.findingId === "clean-signoff-captured"));
assert.equal(cleanFlatReadiness.readinessTrajectory.at(-1)?.gateLabel, "Proceed");

console.log("Settlement readiness checks passed.");
