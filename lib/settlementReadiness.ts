import type { Agency, Agent, Comp, Deal, Expense, Recoup, Settlement, Show } from "@/db/schema";

export type ReadinessSeverity = "high" | "medium" | "low";
export type ReadinessStatus = "blocked" | "needs_attention" | "ready";
export type ReadinessOwner = "Mariana" | "Marcus" | "Agent" | "Production";
export type RiskCategory = "math" | "data_quality" | "recoup" | "relationship" | "proof" | "trust";
export type RiskPolarity = "risk" | "trust";
export type RiskLevel = "Low" | "Moderate" | "High";

export type ReadinessFinding = {
  id: string;
  severity: ReadinessSeverity;
  title: string;
  evidence: string[];
  whyItMatters: string;
  recommendedAction: string;
  owner: ReadinessOwner;
};

export type ReadinessRiskFactor = {
  findingId: string;
  label: string;
  severity: ReadinessSeverity;
  polarity: RiskPolarity;
  points: number;
  evidence: string[];
  owner: ReadinessOwner;
  category: RiskCategory;
  blocksGate: boolean;
  reason: string;
  requiredAction: string;
};

export type ReadinessTrajectoryStep = {
  id: string;
  label: string;
  dataChange: string;
  score: number;
  riskLevel: RiskLevel;
  gateLabel: string;
  remainingBlockers: number;
  remainingWarnings: number;
  note: string;
};

export type GateRecommendation = {
  decision: "hold" | "proceed_with_context" | "ready";
  label: string;
  tone: "rose" | "amber" | "brand";
  reason: string;
  action: string;
};

export type OwnerBreakdown = {
  owner: ReadinessOwner;
  count: number;
  blockingCount: number;
  label: string;
};

export type RiskSummary = {
  blockers: number;
  warnings: number;
  trustSignals: number;
  ownerBreakdown: OwnerBreakdown[];
  topOwnerText: string;
};

export type ReadinessQualification = {
  label: string;
  condition: string;
  scoreImpact: string;
  gateImpact: string;
  tone: "rose" | "amber" | "brand" | "sky";
};

export type SettlementReadiness = {
  status: ReadinessStatus;
  scoreLabel: string;
  riskScore: number;
  riskMax: number;
  riskLevel: RiskLevel;
  riskFactors: ReadinessRiskFactor[];
  riskSummary: RiskSummary;
  recommendedGate: GateRecommendation;
  scoreExplanation: string;
  scoringModel: string[];
  scoreQualifications: ReadinessQualification[];
  readinessTrajectory: ReadinessTrajectoryStep[];
  dynamicScoreNote: string;
  headline: string;
  summary: string;
  findings: ReadinessFinding[];
  checklist: string[];
  agentClarification: string;
  twoAmWalkthrough: string[];
};

export type SettlementReadinessInput = {
  show?: Show | null;
  agent?: Agent | null;
  agency?: Agency | null;
  deal: Deal | null;
  settlement: Settlement | null;
  expenses: Expense[];
  comps: Comp[];
  recoups: Recoup[];
};

const unsupportedDealTypes = new Set(["vs", "percentage_of_net", "door"]);
const trustSignalFindingIds = new Set([
  "absorbed-costs-visible",
  "clean-signoff-captured",
  "recoup-treatment-documented",
  "recoups-agreed",
]);

export function getSettlementReadiness({
  show,
  agent,
  agency,
  deal,
  settlement,
  expenses,
  comps,
  recoups,
}: SettlementReadinessInput): SettlementReadiness {
  const findings: ReadinessFinding[] = [];
  const notes = deal?.dealNotesFreetext?.toLowerCase() ?? "";
  const internalNotes = show?.internalNotes?.toLowerCase() ?? "";
  const signoff = settlement?.signoffText?.toLowerCase() ?? "";
  const passedThroughExpenses = expenses.filter((e) => !e.absorbedByVenue);
  const absorbedExpenses = expenses.filter((e) => e.absorbedByVenue);
  const marketingRecoups = recoups.filter((r) => r.category === "marketing");
  const disputedRecoups = recoups.filter((r) => r.status === "disputed");

  if (!deal) {
    findings.push({
      id: "missing-deal",
      severity: "high",
      title: "No deal terms captured",
      evidence: ["There is no deal row for this show."],
      whyItMatters:
        "Mariana cannot walk a tour manager through settlement without a shared deal baseline.",
      recommendedAction: "Capture the deal memo before attempting settlement.",
      owner: "Mariana",
    });
  }

  if (deal && unsupportedDealTypes.has(deal.dealType)) {
    findings.push({
      id: "unsupported-deal-math",
      severity: "high",
      title: "In-app math cannot settle this deal type",
      evidence: [`Structured deal type is ${humanizeDealType(deal.dealType)}.`],
      whyItMatters:
        "Mariana will leave Greenroom for a spreadsheet unless the risky assumptions are pulled into the room.",
      recommendedAction:
        "Use this review to make assumptions explicit before calculating the final number off-platform.",
      owner: "Mariana",
    });
  }

  if (deal?.expenseCap != null && marketingRecoups.length > 0) {
    const capPlacement = detectMarketingRecoupCapPlacement(notes);
    if (capPlacement) {
      findings.push({
        id: "recoup-treatment-documented",
        severity: "low",
        title: "Marketing recoup treatment is documented",
        evidence: [
          `Expense cap exists: $${deal.expenseCap.toLocaleString()}.`,
          `Deal notes explicitly place marketing recoup ${capPlacement} the cap.`,
        ],
        whyItMatters:
          "Explicit cap treatment reduces ambiguity before the settlement walkthrough.",
        recommendedAction:
          "Keep the cap treatment visible in the settlement packet so the artist team sees the same interpretation.",
        owner: "Mariana",
      });
    } else {
      findings.push({
        id: "marketing-recoup-cap",
        severity: "high",
        title: "Marketing recoup needs cap placement clarified",
        evidence: [
          `Expense cap exists: $${deal.expenseCap.toLocaleString()}.`,
          `${marketingRecoups.length} marketing recoup line item${marketingRecoups.length === 1 ? "" : "s"} found.`,
          notes.includes("against gross")
            ? "Deal notes include 'against gross', but do not say whether marketing sits inside or outside the cap."
            : "Deal notes do not explicitly say whether marketing is inside or outside the cap.",
        ],
        whyItMatters:
          "This is exactly the Coastal Spell failure mode: two reasonable people can calculate two different payouts.",
        recommendedAction:
          "Ask the agent to confirm: marketing recoup is inside the expense cap or in addition to the cap.",
        owner: "Agent",
      });
    }
  }

  if (disputedRecoups.length > 0) {
    findings.push({
      id: "disputed-recoup",
      severity: "high",
      title: "Recoup is already disputed",
      evidence: disputedRecoups.map((r) => `${r.label}: $${r.amount.toLocaleString()} disputed`),
      whyItMatters:
        "Recoups can stay contested even when the rest of the settlement looks signed.",
      recommendedAction:
        "Separate disputed recoups from agreed math and require explicit signoff on each contested line.",
      owner: "Mariana",
    });
  }

  if (recoups.length > 0 && disputedRecoups.length === 0) {
    findings.push({
      id: "recoups-agreed",
      severity: "low",
      title: "Recoup lines are marked agreed",
      evidence: recoups.map((r) => `${r.label}: $${r.amount.toLocaleString()} ${r.status}`),
      whyItMatters:
        "Agreed recoup status reduces the chance that a line item reopens after signoff.",
      recommendedAction:
        "Keep each agreed recoup visible as a separate sourceable line in the settlement packet.",
      owner: "Mariana",
    });
  }


  const agencyConflict = findAgencyConflict(internalNotes, agency?.name);
  if (agencyConflict) {
    findings.push({
      id: "agent-source-conflict",
      severity: "medium",
      title: "Agent source conflict needs review",
      evidence: [
        `Structured agent is ${agent?.name ?? "unknown"}${agency?.name ? ` at ${agency.name}` : ""}.`,
        `Mariana's notes reference ${agencyConflict}.`,
      ],
      whyItMatters:
        "The person who owns the clarification may not match the structured agent record, which can send the wrong preview or dispute note.",
      recommendedAction:
        "Confirm the current agent/contact for this settlement before sending the clarification draft.",
      owner: "Mariana",
    });
  }

  if (settlement?.status === "disputed" && looksPositive(signoff)) {
    findings.push({
      id: "positive-signoff-disputed-status",
      severity: "high",
      title: "Status says disputed, but signoff sounds positive",
      evidence: [
        `Settlement status is ${settlement.status}.`,
        `Artist-team signoff says: "${settlement.signoffText}"`,
      ],
      whyItMatters:
        "A tour manager may sign under time pressure while an agent reopens the issue later. The product should preserve what is agreed and what remains contested.",
      recommendedAction:
        "Send a clean revision or close the dispute with a note stating which line remains contested.",
      owner: "Mariana",
    });
  } else if (settlement && looksPositive(signoff)) {
    findings.push({
      id: "clean-signoff-captured",
      severity: "low",
      title: "Clean signoff language is captured",
      evidence: [
        `Settlement status is ${settlement.status}.`,
        `Artist-team signoff says: "${settlement.signoffText}"`,
      ],
      whyItMatters:
        "A clear signoff improves the proof trail and helps prevent next-day reinterpretation.",
      recommendedAction:
        "Keep the signoff attached to the final settlement record.",
      owner: "Mariana",
    });
  }

  if (deal?.hospitalityCap != null) {
    const hospitalityPassedThrough = passedThroughExpenses
      .filter((e) => e.category === "hospitality")
      .reduce((sum, e) => sum + e.amount, 0);
    if (hospitalityPassedThrough > deal.hospitalityCap) {
      findings.push({
        id: "hospitality-over-cap",
        severity: "medium",
        title: "Hospitality passed through above cap",
        evidence: [
          `Hospitality cap is $${deal.hospitalityCap.toLocaleString()}.`,
          `Passed-through hospitality is $${hospitalityPassedThrough.toLocaleString()}.`,
        ],
        whyItMatters:
          "Tour managers expect the venue to absorb over-cap hospitality unless the deal says otherwise.",
        recommendedAction:
          "Mark the over-cap amount as absorbed or document why it is passed through.",
        owner: "Production",
      });
    }
  }

  if (absorbedExpenses.length > 0) {
    const totalAbsorbed = absorbedExpenses.reduce((sum, e) => sum + e.amount, 0);
    findings.push({
      id: "absorbed-costs-visible",
      severity: "low",
      title: "Show absorbed costs explicitly",
      evidence: [`$${totalAbsorbed.toLocaleString()} is marked absorbed by venue.`],
      whyItMatters:
        "Calling out absorbed costs builds trust because the artist team sees what the venue is not charging them.",
      recommendedAction:
        "Keep absorbed costs visible in the 2am walkthrough, but separate from passed-through deductions.",
      owner: "Mariana",
    });
  }

  if (deal && notes.includes("vs") && deal.dealType !== "vs") {
    findings.push({
      id: "deal-type-prose-mismatch",
      severity: "high",
      title: "Structured deal type disagrees with prose",
      evidence: [
        `Structured deal type is ${humanizeDealType(deal.dealType)}.`,
        "Deal notes describe a vs deal.",
      ],
      whyItMatters:
        "The system is reading the wrong model even though Mariana's trusted prose says otherwise.",
      recommendedAction:
        "Treat the prose as source of truth and correct the structured deal type before settlement.",
      owner: "Mariana",
    });
  }

  if (deal?.percentage != null) {
    const prosePct = extractProsePercentage(notes);
    if (prosePct != null && Math.abs(prosePct - deal.percentage) > 0.001) {
      findings.push({
        id: "percentage-drift",
        severity: "high",
        title: "Percentage in prose disagrees with structured field",
        evidence: [
          `Structured percentage is ${(deal.percentage * 100).toFixed(0)}%.`,
          `Deal notes mention ${(prosePct * 100).toFixed(0)}%.`,
        ],
        whyItMatters:
          "A stale structured field can silently produce the wrong payout while the prose reflects the real negotiation.",
        recommendedAction:
          "Update the structured percentage or annotate the settlement with the agreed source of truth.",
        owner: "Mariana",
      });
    }
  }

  const compContradictions = comps.filter(
    (c) => !c.countsTowardGross && /count.*gross|gross.*count/i.test(c.notes ?? ""),
  );
  if (compContradictions.length > 0) {
    findings.push({
      id: "comp-gross-contradiction",
      severity: "medium",
      title: "Comp notes contradict gross-counting flag",
      evidence: compContradictions.map(
        (c) => `${c.category}: flag says no, note says "${c.notes}"`,
      ),
      whyItMatters:
        "Comps can move the percentage basis. This should be clarified before final math.",
      recommendedAction:
        "Confirm whether these comps count toward gross and update the settlement basis.",
      owner: "Agent",
    });
  }

  const duplicate = findDuplicateExpense(expenses);
  if (duplicate) {
    findings.push({
      id: "duplicate-expense",
      severity: "medium",
      title: "Possible duplicate expense",
      evidence: [
        `${duplicate.category} - $${duplicate.amount.toLocaleString()} appears more than once with similar description.`,
      ],
      whyItMatters:
        "Duplicate expenses are a simple way to lose trust in an otherwise correct settlement.",
      recommendedAction:
        "Have Production confirm whether the duplicate is valid before the walkthrough.",
      owner: "Production",
    });
  }

  const highCount = findings.filter((f) => f.severity === "high").length;
  const mediumCount = findings.filter((f) => f.severity === "medium").length;
  const status: ReadinessStatus = highCount > 0 ? "blocked" : mediumCount > 0 ? "needs_attention" : "ready";
  const riskFactors = buildRiskFactors(findings);
  const riskScore = calculateRiskScore(riskFactors);
  const riskLevel = determineRiskLevel(riskScore, highCount, mediumCount);
  const riskSummary = buildRiskSummary(riskFactors);
  const recommendedGate = buildGateRecommendation(status, highCount, mediumCount);

  return {
    status,
    scoreLabel: status === "blocked" ? "Not ready" : status === "needs_attention" ? "Needs review" : "Ready",
    riskScore,
    riskMax: 100,
    riskLevel,
    riskFactors,
    riskSummary,
    recommendedGate,
    scoreExplanation: buildScoreExplanation(riskFactors, highCount, mediumCount, riskScore),
    scoringModel: [
      "High-risk blocker = +30 points because it can change payout, reopen a dispute, or force off-platform settlement.",
      "Medium warning = +15 points because it needs confirmation before signoff.",
      "Trust signal = -10 points because clean signoff, documented cap treatment, or visible absorbed costs reduce ambiguity.",
      "The gate is dynamic: changing source data changes factors, score, and Hold/Proceed recommendation.",
    ],
    scoreQualifications: buildScoreQualifications(),
    readinessTrajectory: buildReadinessTrajectory(riskFactors),
    dynamicScoreNote:
      "Readiness is not a static badge. It recalculates from the current deal, recoup, expense, comp, contact, and settlement data each time the page is loaded.",
    headline:
      status === "blocked"
        ? "Resolve the red flags before the 2am walkthrough"
        : status === "needs_attention"
          ? "A few assumptions need review"
          : "No major settlement risks detected",
    summary:
      status === "blocked"
        ? `${highCount} high-risk item${highCount === 1 ? "" : "s"} could create a dispute or force Mariana back into spreadsheet explanations.`
        : status === "needs_attention"
          ? `${mediumCount} medium-risk item${mediumCount === 1 ? "" : "s"} should be confirmed before final signoff.`
          : "The available data is consistent enough for Mariana to focus on the normal line-by-line walkthrough.",
    findings,
    checklist: buildChecklist(findings),
    agentClarification: buildAgentClarification(deal, findings),
    twoAmWalkthrough: buildWalkthrough(findings, recoups, absorbedExpenses),
  };
}

function humanizeDealType(type: string) {
  return type.replace(/_/g, " ");
}

function detectMarketingRecoupCapPlacement(notes: string) {
  if (!notes) return null;
  if (/marketing[^.]{0,80}(outside|outside of|in addition to|additional to|excluded from)[^.]{0,80}cap/.test(notes)) {
    return "outside";
  }
  if (/marketing[^.]{0,80}(inside|included in|within)[^.]{0,80}cap/.test(notes)) {
    return "inside";
  }
  return null;
}

function looksPositive(text: string) {
  return /looks good|ok|okay|sign off|signed|wire|approved|good night/.test(text);
}

function extractProsePercentage(notes: string) {
  const slash = notes.match(/(?:^|[^\d/])(\d{2})\s*\/\s*(\d{2})(?:[^\d/]|$)/);
  if (slash) {
    const first = Number(slash[1]);
    const second = Number(slash[2]);
    if (first + second === 100) return first / 100;
  }
  const pct = notes.match(/(\d{2})\s*%/);
  if (pct) return Number(pct[1]) / 100;
  return null;
}

function findDuplicateExpense(expenses: Expense[]) {
  const seen = new Map<string, Expense>();
  for (const e of expenses) {
    const key = `${e.category}|${e.amount}|${(e.description ?? "").toLowerCase().slice(0, 30)}`;
    const prior = seen.get(key);
    if (prior) return e;
    seen.set(key, e);
  }
  return null;
}

function findAgencyConflict(notes: string, structuredAgencyName?: string | null) {
  if (!notes) return null;
  const structured = structuredAgencyName?.toLowerCase() ?? "";
  const agencies = ["wme", "wasserman", "caa", "paradigm"];
  const mentioned = agencies.find((name) => notes.includes(name));
  if (!mentioned) return null;
  if (structured && structured.includes(mentioned)) return null;
  return mentioned.toUpperCase();
}

function buildRiskFactors(findings: ReadinessFinding[]): ReadinessRiskFactor[] {
  return findings.map((finding) => {
    const polarity: RiskPolarity = trustSignalFindingIds.has(finding.id) ? "trust" : "risk";
    const points = pointsForFinding(finding);

    return {
      findingId: finding.id,
      label: finding.title,
      severity: finding.severity,
      polarity,
      points,
      evidence: finding.evidence,
      owner: finding.owner,
      category: categoryForFinding(finding.id),
      blocksGate: finding.severity === "high" && polarity === "risk",
      reason: reasonForFinding(finding, polarity),
      requiredAction: finding.recommendedAction,
    };
  });
}

function pointsForFinding(finding: ReadinessFinding) {
  if (trustSignalFindingIds.has(finding.id)) return -10;
  if (finding.severity === "high") return 30;
  if (finding.severity === "medium") return 15;
  return 5;
}

function reasonForFinding(finding: ReadinessFinding, polarity: RiskPolarity) {
  if (polarity === "trust") {
    return "Trust signal because this evidence reduces ambiguity and improves the quality of the walkthrough.";
  }
  if (finding.severity === "high") {
    return "High risk because it can change payout, trigger a dispute, or force off-platform settlement.";
  }
  if (finding.severity === "medium") {
    return "Medium risk because it should be confirmed before signoff but is less likely to block settlement alone.";
  }
  return "Low risk because it improves explanation quality but usually does not block settlement.";
}

function categoryForFinding(id: string): RiskCategory {
  if (id.includes("recoup")) return "recoup";
  if (id.includes("agent")) return "relationship";
  if (id.includes("signoff") || id.includes("status")) return "proof";
  if (id.includes("prose") || id.includes("percentage") || id.includes("comp")) return "data_quality";
  if (id.includes("expense") || id.includes("absorbed")) return "trust";
  return "math";
}

function buildRiskSummary(factors: ReadinessRiskFactor[]): RiskSummary {
  const ownerCounts = new Map<ReadinessOwner, { count: number; blockingCount: number }>();
  for (const factor of factors.filter((f) => f.polarity === "risk")) {
    const existing = ownerCounts.get(factor.owner) ?? { count: 0, blockingCount: 0 };
    existing.count += 1;
    if (factor.blocksGate) existing.blockingCount += 1;
    ownerCounts.set(factor.owner, existing);
  }

  const ownerBreakdown = Array.from(ownerCounts.entries())
    .map(([owner, counts]) => ({
      owner,
      count: counts.count,
      blockingCount: counts.blockingCount,
      label: `${counts.count} action${counts.count === 1 ? "" : "s"}`,
    }))
    .sort((a, b) => b.blockingCount - a.blockingCount || b.count - a.count);

  const topOwner = ownerBreakdown[0];

  return {
    blockers: factors.filter((f) => f.severity === "high" && f.polarity === "risk").length,
    warnings: factors.filter((f) => f.severity === "medium" && f.polarity === "risk").length,
    trustSignals: factors.filter((f) => f.polarity === "trust").length,
    ownerBreakdown,
    topOwnerText: topOwner
      ? `${topOwner.owner} owns ${topOwner.count} follow-up${topOwner.count === 1 ? "" : "s"}${topOwner.blockingCount ? `, including ${topOwner.blockingCount} blocker${topOwner.blockingCount === 1 ? "" : "s"}` : ""}.`
      : "No owner follow-ups are required from the detected data.",
  };
}

function calculateRiskScore(factors: ReadinessRiskFactor[]) {
  return scoreSnapshot(factors).score;
}

function scoreSnapshot(factors: ReadinessRiskFactor[]) {
  const blockers = factors.filter((f) => f.blocksGate).length;
  const warnings = factors.filter((f) => f.severity === "medium" && f.polarity === "risk").length;
  const positiveRisk = factors
    .filter((f) => f.polarity === "risk")
    .reduce((sum, factor) => sum + factor.points, 0);
  const trustCredit = factors
    .filter((f) => f.polarity === "trust")
    .reduce((sum, factor) => sum + Math.abs(factor.points), 0);
  const rawScore = positiveRisk - trustCredit;
  const floor = blockers > 0 ? 70 : warnings > 0 ? 30 : 0;
  const score = Math.min(100, Math.max(floor, rawScore, 0));
  const riskLevel = determineRiskLevel(score, blockers, warnings);
  const gateLabel = blockers > 0 ? "Hold" : warnings > 0 ? "Proceed with context" : "Proceed";

  return { score, riskLevel, gateLabel, blockers, warnings };
}

function determineRiskLevel(score: number, highCount: number, mediumCount: number): RiskLevel {
  if (highCount > 0) return "High";
  if (mediumCount > 0) return "Moderate";
  if (score >= 70) return "High";
  if (score >= 30) return "Moderate";
  return "Low";
}

function buildGateRecommendation(
  status: ReadinessStatus,
  highCount: number,
  mediumCount: number,
): GateRecommendation {
  if (status === "blocked") {
    return {
      decision: "hold",
      label: "Recommended: Hold",
      tone: "rose",
      reason: `${highCount} blocker${highCount === 1 ? "" : "s"} can change payout or reopen the dispute after signoff.`,
      action: "Hold final settlement until the owner confirmations are documented, then attach the review to signoff.",
    };
  }
  if (status === "needs_attention") {
    return {
      decision: "proceed_with_context",
      label: "Recommended: Proceed with context",
      tone: "amber",
      reason: `${mediumCount} warning${mediumCount === 1 ? "" : "s"} should be confirmed, but no blocker is detected.`,
      action: "Proceed only if Mariana adds the risk review to the settlement notes.",
    };
  }
  return {
    decision: "ready",
    label: "Recommended: Proceed",
    tone: "brand",
    reason: "The available data is consistent and no high-risk settlement factor was detected.",
    action: "Proceed with the normal line-by-line walkthrough and save the signed statement.",
  };
}

function buildScoreQualifications(): ReadinessQualification[] {
  return [
    {
      label: "Blocker",
      condition: "Unresolved signal can change payout, reopen a dispute, or contradict signoff.",
      scoreImpact: "+30",
      gateImpact: "Hold until owner confirmation is documented.",
      tone: "rose",
    },
    {
      label: "Warning",
      condition: "Signal needs review but is less likely to block settlement by itself.",
      scoreImpact: "+15",
      gateImpact: "Proceed only with context attached to notes.",
      tone: "amber",
    },
    {
      label: "Trust signal",
      condition: "Evidence improves confidence, such as clean signoff or documented cap treatment.",
      scoreImpact: "-10",
      gateImpact: "Lowers risk, but does not override an unresolved blocker.",
      tone: "sky",
    },
  ];
}

function buildScoreExplanation(
  factors: ReadinessRiskFactor[],
  highCount: number,
  mediumCount: number,
  score: number,
) {
  const trustSignals = factors.filter((f) => f.polarity === "trust").length;
  return `Score ${score}/100 from ${highCount} blocker${highCount === 1 ? "" : "s"}, ${mediumCount} warning${mediumCount === 1 ? "" : "s"}, and ${trustSignals} trust signal${trustSignals === 1 ? "" : "s"}. Trust signals can lower risk, but any blocker keeps the recommendation in Hold.`;
}

function buildReadinessTrajectory(factors: ReadinessRiskFactor[]): ReadinessTrajectoryStep[] {
  const steps: ReadinessTrajectoryStep[] = [];

  function addStep(id: string, label: string, dataChange: string, activeFactors: ReadinessRiskFactor[], note: string) {
    const snapshot = scoreSnapshot(activeFactors);
    const signature = `${label}|${snapshot.score}|${snapshot.gateLabel}|${snapshot.blockers}|${snapshot.warnings}`;
    if (steps.some((step) => `${step.label}|${step.score}|${step.gateLabel}|${step.remainingBlockers}|${step.remainingWarnings}` === signature)) {
      return;
    }
    steps.push({
      id,
      label,
      dataChange,
      score: snapshot.score,
      riskLevel: snapshot.riskLevel,
      gateLabel: snapshot.gateLabel,
      remainingBlockers: snapshot.blockers,
      remainingWarnings: snapshot.warnings,
      note,
    });
  }

  addStep(
    "current",
    "Current data",
    "Use the settlement data exactly as loaded.",
    factors,
    "This is the gate Mariana sees before making a decision.",
  );

  const nonMathBlockers = factors.filter((f) => f.blocksGate && f.category !== "math");
  if (nonMathBlockers.length > 0) {
    const afterNonMath = factors.filter((f) => !(f.blocksGate && f.category !== "math"));
    addStep(
      "non-math-blockers-resolved",
      "After contested lines are clarified",
      `Resolve ${listLabels(nonMathBlockers)} in source data.`,
      afterNonMath,
      "The score drops only when disputed lines, status conflicts, or source conflicts are actually resolved.",
    );
  }

  const blockers = factors.filter((f) => f.blocksGate);
  if (blockers.length > 0) {
    const afterAllBlockers = factors.filter((f) => !f.blocksGate);
    addStep(
      "all-blockers-resolved",
      "After all blockers are resolved",
      `Resolve ${listLabels(blockers)} in source data.`,
      afterAllBlockers,
      "At this point the gate can move from Hold to Proceed with context if warnings remain.",
    );
  }

  const riskFactors = factors.filter((f) => f.polarity === "risk");
  if (riskFactors.length > 0) {
    const trustOnly = factors.filter((f) => f.polarity === "trust");
    addStep(
      "risk-cleared",
      "After warnings are documented",
      "Document or clear the remaining risk factors and keep trust signals attached.",
      trustOnly,
      "This is the target state: evidence remains, but unresolved risk is removed.",
    );
  }

  return steps.slice(0, 4);
}

function listLabels(factors: ReadinessRiskFactor[]) {
  const labels = factors.slice(0, 2).map((f) => f.label.toLowerCase());
  const suffix = factors.length > 2 ? ` and ${factors.length - 2} more` : "";
  return `${labels.join(", ")}${suffix}`;
}

function buildChecklist(findings: ReadinessFinding[]) {
  const actionableFindings = findings.filter((f) => !trustSignalFindingIds.has(f.id));
  if (actionableFindings.length === 0) {
    return [
      "Confirm final gross and fees match ticketing.",
      "Keep absorbed costs visible but separate from deductions.",
      "Save the final signed statement back into Greenroom.",
    ];
  }
  return actionableFindings.slice(0, 5).map((f) => `${f.owner}: ${f.recommendedAction}`);
}

function buildAgentClarification(deal: Deal | null, findings: ReadinessFinding[]) {
  const recoupFinding = findings.find((f) => f.id === "marketing-recoup-cap");
  if (recoupFinding && deal?.expenseCap != null) {
    return `Before settlement, can you confirm whether any marketing recoup is included inside the $${deal.expenseCap.toLocaleString()} expense cap, or should it be treated as an additional deduction outside the cap? We want to make sure the settlement statement reflects the same interpretation before show night.`;
  }
  const firstHigh = findings.find((f) => f.severity === "high");
  if (firstHigh) {
    return `Before settlement, can you confirm the following assumption: ${firstHigh.recommendedAction} We want the 2am walkthrough to be a signoff, not a negotiation.`;
  }
  return "No agent clarification needed yet. Send the normal settlement preview once final ticketing and expenses are locked.";
}

function buildWalkthrough(findings: ReadinessFinding[], recoups: Recoup[], absorbedExpenses: Expense[]) {
  const lines = [
    "Start with the deal terms and state which source is controlling: structured fields or deal-note prose.",
    "Separate passed-through deductions from venue-absorbed costs.",
  ];
  if (recoups.length > 0) {
    lines.push("Walk through each recoup as its own signoff line, not as a hidden expense subtotal.");
  }
  if (absorbedExpenses.length > 0) {
    lines.push("Call out absorbed costs to show what the venue is not charging the artist.");
  }
  for (const f of findings.filter((x) => x.severity === "high").slice(0, 2)) {
    lines.push(`Resolve before signature: ${f.title}.`);
  }
  return lines;
}
