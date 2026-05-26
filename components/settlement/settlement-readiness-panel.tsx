"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  Calculator,
  CheckCircle2,
  CircleStop,
  ClipboardCheck,
  ClipboardList,
  Copy,
  FileSearch,
  Mail,
  Moon,
  PlayCircle,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlainBadge } from "@/components/ui/badge";
import type { SettlementReadiness } from "@/lib/settlementReadiness";

const severityVariant = {
  high: "rose",
  medium: "amber",
  low: "sky",
} as const;

const categoryLabels = {
  math: "Math model",
  data_quality: "Data quality",
  recoup: "Recoup",
  relationship: "Relationship",
  proof: "Proof trail",
  trust: "Trust signal",
} as const;

export function SettlementReadinessPanel({
  readiness,
  compact = false,
}: {
  readiness: SettlementReadiness;
  compact?: boolean;
}) {
  const [decision, setDecision] = useState<"hold" | "proceed" | null>(null);
  const [gateCreated, setGateCreated] = useState(false);
  const [gateCreatedAt, setGateCreatedAt] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const Icon = readiness.status === "ready" ? CheckCircle2 : AlertTriangle;
  const accent =
    readiness.status === "blocked"
      ? "rose"
      : readiness.status === "needs_attention"
        ? "amber"
        : "brand";
  const scoreTone =
    readiness.riskLevel === "High"
      ? "text-rose-700"
      : readiness.riskLevel === "Moderate"
        ? "text-amber-700"
        : "text-brand-700";
  const blockingFactors = useMemo(
    () => readiness.riskFactors.filter((factor) => factor.severity === "high"),
    [readiness.riskFactors],
  );
  const topFactors = readiness.riskFactors.slice(0, 3);
  const gateTone =
    decision === "hold"
      ? "rose"
      : decision === "proceed"
        ? "brand"
        : "default";

  async function copyClarificationDraft() {
    try {
      await navigator.clipboard.writeText(readiness.agentClarification);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  function createGate() {
    setGateCreated(true);
    setGateCreatedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  }

  return (
    <Card accent={accent} className={compact ? "" : "mb-6"}>
      <CardHeader>
        <div>
          <div className="flex items-center gap-2">
            <Icon
              className={`h-4 w-4 ${
                readiness.status === "ready"
                  ? "text-brand-700"
                  : readiness.status === "blocked"
                    ? "text-rose-700"
                    : "text-amber-700"
              }`}
            />
            <CardTitle>Settlement readiness</CardTitle>
          </div>
          <CardDescription>{readiness.headline}</CardDescription>
        </div>
        <PlainBadge
          variant={
            readiness.status === "blocked"
              ? "rose"
              : readiness.status === "needs_attention"
                ? "amber"
                : "brand"
          }
        >
          {readiness.scoreLabel}
        </PlainBadge>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-[13px] text-ink-600 leading-relaxed">
          {readiness.summary}
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <MetricTile
            label="Blockers"
            value={String(readiness.riskSummary.blockers)}
            helper="Can change payout or reopen dispute"
            variant="rose"
          />
          <MetricTile
            label="Warnings"
            value={String(readiness.riskSummary.warnings)}
            helper="Need confirmation before signoff"
            variant="amber"
          />
          <MetricTile
            label="Trust signals"
            value={String(readiness.riskSummary.trustSignals)}
            helper="Improve walkthrough confidence"
            variant="sky"
          />
        </div>

        <div
          className={`rounded-lg p-4 ring-1 ${
            readiness.recommendedGate.tone === "rose"
              ? "bg-rose-50/50 ring-rose-200/70"
              : readiness.recommendedGate.tone === "amber"
                ? "bg-amber-50/50 ring-amber-200/70"
                : "bg-brand-50/40 ring-brand-200/70"
          }`}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/70 ring-1 ring-white">
                <Sparkles className="h-4 w-4 text-ink-600" />
              </div>
              <div>
                <div className="eyebrow mb-1 text-[10px] text-ink-500">
                  Gate recommendation
                </div>
                <div className="text-[14px] font-semibold text-ink-900">
                  {readiness.recommendedGate.label}
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-600">
                  {readiness.recommendedGate.reason} {readiness.recommendedGate.action}
                </p>
              </div>
            </div>
            <PlainBadge variant={readiness.recommendedGate.tone}>
              Human approves
            </PlainBadge>
          </div>
        </div>

        <div className="rounded-lg border border-ink-100 bg-white">
          <div className="grid grid-cols-[44px_1fr] border-b border-ink-100">
            <div className="flex items-start justify-center border-r border-ink-100 bg-canvas-soft py-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-[11px] font-semibold text-white">
                1
              </span>
            </div>
            <div className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-canvas-soft ring-1 ring-ink-100">
                    <Calculator className="h-4 w-4 text-ink-600" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-ink-900">
                      Risk factor calculation
                    </div>
                    <div className="text-[12px] text-ink-500">
                      {readiness.riskLevel} risk - based on {" "}
                      {readiness.riskFactors.length} settlement factor
                      {readiness.riskFactors.length === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="min-w-[132px]">
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <span
                        className={`text-[22px] font-semibold leading-none ${scoreTone}`}
                      >
                        {readiness.riskScore}
                      </span>
                      <span className="text-[11px] text-ink-400">
                        / {readiness.riskMax}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                      <div
                        className={`h-full rounded-full ${
                          readiness.riskLevel === "High"
                            ? "bg-rose-500"
                            : readiness.riskLevel === "Moderate"
                              ? "bg-amber-500"
                              : "bg-brand-600"
                        }`}
                        style={{ width: `${Math.max(6, readiness.riskScore)}%` }}
                      />
                    </div>
                  </div>
                  {!compact && (
                    <a
                      href="#risk-factor-calculation"
                      className="inline-flex items-center gap-1.5 rounded-md bg-ink-900 px-3 py-2 text-[12px] font-medium text-white transition hover:bg-ink-700"
                    >
                      Risk factor breakdown{" "}
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-ink-500">
                {readiness.scoreExplanation}
              </p>
              {topFactors.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
                  {topFactors.map((factor) => (
                    <div
                      key={factor.findingId}
                      className="rounded-md bg-canvas-soft px-3 py-2 ring-1 ring-ink-100"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-ink-900">
                          {formatPoints(factor.points)}
                        </span>
                        <PlainBadge variant={severityVariant[factor.severity]}>
                          {factor.severity}
                        </PlainBadge>
                      </div>
                      <div className="text-[11.5px] leading-snug text-ink-600">
                        {factor.label}
                      </div>
                      <div className="mt-1 text-[10.5px] text-ink-400">
                        {categoryLabels[factor.category]} - {factor.owner}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {!compact && (
            <div className="grid grid-cols-[44px_1fr]">
              <div className="flex items-start justify-center border-r border-ink-100 bg-canvas-soft py-4">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                    decision === null
                      ? "bg-white text-ink-500 ring-1 ring-ink-200"
                      : decision === "hold"
                        ? "bg-rose-600 text-white"
                        : "bg-brand-700 text-white"
                  }`}
                >
                  2
                </span>
              </div>
              <div className="p-4">
                <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-canvas-soft ring-1 ring-ink-100">
                      <PlayCircle className="h-4 w-4 text-ink-600" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-ink-900">
                        Move-forward approval gate
                      </div>
                      <div className="text-[12px] text-ink-500">
                        The system recommends a gate, but Mariana must choose Hold or Proceed.
                      </div>
                    </div>
                  </div>
                  <PlainBadge variant={gateCreated ? gateTone : "default"}>
                    {gateCreated
                      ? decision === "hold"
                        ? "Hold gate created"
                        : "Proceed gate created"
                      : decision === null
                        ? "Decision required"
                        : "Ready to create"}
                  </PlainBadge>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDecision("hold");
                      setGateCreated(false);
                      setGateCreatedAt(null);
                    }}
                    className={`rounded-lg border p-4 text-left transition ${
                      decision === "hold"
                        ? "border-rose-300 bg-rose-50/70 ring-2 ring-rose-200"
                        : "border-ink-100 bg-canvas-soft hover:border-rose-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CircleStop className="h-4 w-4 text-rose-700" />
                      <span className="text-[13px] font-semibold text-ink-900">
                        Hold
                      </span>
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed text-ink-600">
                      Block final settlement until unresolved risk factors have owner confirmation.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDecision("proceed");
                      setGateCreated(false);
                      setGateCreatedAt(null);
                    }}
                    className={`rounded-lg border p-4 text-left transition ${
                      decision === "proceed"
                        ? "border-brand-300 bg-brand-50/70 ring-2 ring-brand-200"
                        : "border-ink-100 bg-canvas-soft hover:border-brand-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-brand-700" />
                      <span className="text-[13px] font-semibold text-ink-900">
                        Proceed
                      </span>
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed text-ink-600">
                      Continue settlement and attach this risk review as signoff context.
                    </p>
                  </button>
                </div>

                <div className="mt-4 rounded-lg bg-canvas-soft p-4">
                  <div className="text-[12px] font-semibold text-ink-900">
                    Gate summary
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-600">
                    {decision === "hold"
                      ? `Hold because ${blockingFactors.length || readiness.riskFactors.length} risk factor${(blockingFactors.length || readiness.riskFactors.length) === 1 ? "" : "s"} need owner confirmation before final settlement.`
                      : decision === "proceed"
                        ? "Proceed with the risk review attached as settlement context."
                        : "No gate selected yet. Choose Hold or Proceed after reviewing the risk factor breakdown."}
                  </p>
                  {decision === "hold" && blockingFactors.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {blockingFactors.slice(0, 3).map((factor) => (
                        <li
                          key={factor.findingId}
                          className="text-[11.5px] leading-relaxed text-ink-600"
                        >
                          - {factor.label}: {factor.requiredAction}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    disabled={!decision}
                    onClick={createGate}
                    className="mt-4 inline-flex min-h-9 items-center justify-center rounded-md bg-ink-900 px-3 text-[12px] font-medium text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Create move-forward gate
                  </button>
                  {gateCreated && (
                    <div className="mt-3 rounded-md bg-white px-3 py-2 text-[12px] leading-relaxed text-ink-700 ring-1 ring-brand-200">
                      <div className="font-medium text-ink-900">
                        Gate created{gateCreatedAt ? ` at ${gateCreatedAt}` : ""}: {" "}
                        {decision === "hold" ? "Hold settlement" : "Proceed with context"}
                      </div>
                      <div className="mt-1 text-ink-500">
                        Prototype audit preview: production would persist reviewer, timestamp, decision, unresolved blockers, and attached clarification draft.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {!compact && readiness.readinessTrajectory.length > 1 && (
          <div className="rounded-lg bg-white p-4 ring-1 ring-ink-100">
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="eyebrow text-[10px] text-ink-500">
                  Readiness changes with the data
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-ink-500">
                  {readiness.dynamicScoreNote} This preview shows the intended operating behavior: the gate only improves when blockers are fixed in the source record.
                </p>
              </div>
              <PlainBadge variant="sky">Dynamic score</PlainBadge>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
              {readiness.readinessTrajectory.map((step) => (
                <div
                  key={step.id}
                  className="rounded-md bg-canvas-soft p-3 ring-1 ring-ink-100"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] font-semibold text-ink-900">
                      {step.label}
                    </div>
                    <PlainBadge
                      variant={
                        step.gateLabel === "Hold"
                          ? "rose"
                          : step.gateLabel === "Proceed with context"
                            ? "amber"
                            : "brand"
                      }
                    >
                      {step.gateLabel}
                    </PlainBadge>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-[20px] font-semibold leading-none text-ink-900">
                      {step.score}
                    </span>
                    <span className="text-[10.5px] text-ink-400">/100</span>
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-ink-500">
                    {step.dataChange}
                  </p>
                  <p className="mt-2 text-[10.5px] leading-snug text-ink-400">
                    {step.remainingBlockers} blocker{step.remainingBlockers === 1 ? "" : "s"}, {step.remainingWarnings} warning{step.remainingWarnings === 1 ? "" : "s"} remain.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {readiness.riskSummary.ownerBreakdown.length > 0 && !compact && (
          <div className="rounded-lg bg-white p-4 ring-1 ring-ink-100">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-ink-400" />
                <div className="eyebrow text-[10px] text-ink-500">
                  Owner action map
                </div>
              </div>
              <span className="text-[11.5px] text-ink-500">
                {readiness.riskSummary.topOwnerText}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
              {readiness.riskSummary.ownerBreakdown.map((owner) => (
                <div
                  key={owner.owner}
                  className="rounded-md bg-canvas-soft px-3 py-2 ring-1 ring-ink-100"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-ink-900">
                      {owner.owner}
                    </span>
                    <PlainBadge variant={owner.blockingCount ? "rose" : "default"}>
                      {owner.label}
                    </PlainBadge>
                  </div>
                  <p className="mt-1 text-[11.5px] text-ink-500">
                    {owner.blockingCount
                      ? `${owner.blockingCount} blocking item${owner.blockingCount === 1 ? "" : "s"}`
                      : "No blocking item"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {readiness.findings.length > 0 && (
          <div className="space-y-3">
            {readiness.findings.slice(0, 3).map((finding) => (
              <div
                key={finding.id}
                className="rounded-lg border border-ink-100 bg-canvas-soft p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <PlainBadge variant={severityVariant[finding.severity]}>
                        {finding.severity}
                      </PlainBadge>
                      <span className="text-[13px] font-semibold text-ink-900">
                        {finding.title}
                      </span>
                    </div>
                    <p className="text-[12px] text-ink-500 leading-relaxed mt-2">
                      {finding.whyItMatters}
                    </p>
                  </div>
                  <PlainBadge variant="default">{finding.owner}</PlainBadge>
                </div>
                {!compact && (
                  <>
                    <ul className="mt-3 space-y-1.5">
                      {finding.evidence.map((item) => (
                        <li
                          key={item}
                          className="text-[11.5px] text-ink-500 leading-relaxed"
                        >
                          - {item}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 rounded-md bg-white ring-1 ring-ink-100 px-3 py-2 text-[12px] text-ink-700 leading-relaxed">
                      <span className="font-medium">Next action:</span>{" "}
                      {finding.recommendedAction}
                    </div>
                  </>
                )}
              </div>
            ))}
            {!compact && readiness.findings.length > 3 && (
              <div className="rounded-lg border border-ink-100 bg-white px-4 py-3 text-[12px] text-ink-500">
                {readiness.findings.length - 3} more factor
                {readiness.findings.length - 3 === 1 ? "" : "s"} are included
                in the calculation below.
              </div>
            )}
          </div>
        )}

        {!compact && (
          <>
            <div
              id="risk-factor-calculation"
              className="rounded-lg ring-1 ring-ink-100 bg-white p-4 scroll-mt-8"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Calculator className="h-3.5 w-3.5 text-ink-400" />
                    <div className="eyebrow text-[10px] text-ink-500">
                      Risk factor breakdown
                    </div>
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-ink-500">
                    The prototype scores each detected settlement signal by severity and polarity. Risk factors raise the score; trust signals lower it. When the underlying data changes, the score and gate recompute.
                  </p>
                </div>
                <PlainBadge
                  variant={
                    readiness.riskLevel === "High"
                      ? "rose"
                      : readiness.riskLevel === "Moderate"
                        ? "amber"
                        : "brand"
                  }
                >
                  {readiness.riskScore}/{readiness.riskMax}
                </PlainBadge>
              </div>
              <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                {readiness.scoringModel.map((rule) => (
                  <div
                    key={rule}
                    className="rounded-md bg-canvas-soft px-3 py-2 text-[11.5px] leading-relaxed text-ink-500"
                  >
                    {rule}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {readiness.riskFactors.length > 0 ? (
                  readiness.riskFactors.map((factor) => (
                    <details
                      key={factor.findingId}
                      className="group rounded-md bg-canvas-soft px-3 py-2 open:bg-white open:ring-1 open:ring-ink-100"
                    >
                      <summary className="grid cursor-pointer list-none grid-cols-[72px_1fr_18px] gap-3">
                        <div className="flex items-center gap-2 text-[12px] font-semibold text-ink-900">
                          <ShieldAlert
                            className={`h-3.5 w-3.5 ${
                              factor.severity === "high"
                                ? "text-rose-700"
                                : factor.severity === "medium"
                                  ? "text-amber-700"
                                  : "text-sky-700"
                            }`}
                          />
                          {formatPoints(factor.points)}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[12px] font-medium text-ink-900">
                              {factor.label}
                            </span>
                            <PlainBadge variant={severityVariant[factor.severity]}>
                              {factor.severity}
                            </PlainBadge>
                            <PlainBadge variant="default">{factor.owner}</PlainBadge>
                            <PlainBadge variant="sky">{categoryLabels[factor.category]}</PlainBadge>
                          </div>
                          <p className="mt-1 text-[11.5px] leading-relaxed text-ink-500">
                            {factor.reason}
                          </p>
                        </div>
                        <ArrowDownRight className="mt-1 h-3.5 w-3.5 text-ink-400 transition-transform group-open:rotate-45" />
                      </summary>
                      <div className="mt-3 grid grid-cols-1 gap-3 border-t border-ink-100 pt-3 md:grid-cols-2">
                        <div>
                          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                            <FileSearch className="h-3.5 w-3.5" />
                            Data supporting this factor
                          </div>
                          <ul className="space-y-1.5">
                            {factor.evidence.map((item) => (
                              <li
                                key={item}
                                className="text-[11.5px] leading-relaxed text-ink-600"
                              >
                                - {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                            Required before Hold/Proceed
                          </div>
                          <p className="rounded-md bg-canvas-soft px-3 py-2 text-[11.5px] leading-relaxed text-ink-700">
                            {factor.requiredAction}
                          </p>
                        </div>
                      </div>
                    </details>
                  ))
                ) : (
                  <div className="rounded-md bg-canvas-soft px-3 py-2 text-[12px] text-ink-600">
                    No scored risk factors detected. Continue normal settlement review.
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="rounded-lg ring-1 ring-ink-100 bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="h-3.5 w-3.5 text-ink-400" />
                  <div className="eyebrow text-[10px] text-ink-500">
                    Before show night checklist
                  </div>
                </div>
                <ul className="space-y-2">
                  {readiness.checklist.map((item) => (
                    <li
                      key={item}
                      className="text-[12px] text-ink-700 leading-relaxed"
                    >
                      - {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg ring-1 ring-ink-100 bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="h-3.5 w-3.5 text-ink-400" />
                  <div className="eyebrow text-[10px] text-ink-500">
                    2am walkthrough focus
                  </div>
                </div>
                <ul className="space-y-2">
                  {readiness.twoAmWalkthrough.map((item) => (
                    <li
                      key={item}
                      className="text-[12px] text-ink-700 leading-relaxed"
                    >
                      - {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}

        <div className="rounded-lg bg-brand-50/30 ring-1 ring-brand-200/50 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-brand-700" />
              <div className="eyebrow text-[10px] text-brand-800">
                Agent clarification draft
              </div>
            </div>
            {!compact && (
              <button
                type="button"
                onClick={copyClarificationDraft}
                className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[11px] font-medium text-brand-800 ring-1 ring-brand-200 transition hover:bg-brand-50"
              >
                <Copy className="h-3 w-3" />
                {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy failed" : "Copy draft"}
              </button>
            )}
          </div>
          <p className="text-[12.5px] text-ink-700 leading-relaxed">
            {readiness.agentClarification}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatPoints(points: number) {
  return points > 0 ? `+${points}` : String(points);
}

function MetricTile({
  label,
  value,
  helper,
  variant,
}: {
  label: string;
  value: string;
  helper: string;
  variant: "rose" | "amber" | "sky";
}) {
  const tone = {
    rose: "text-rose-700 bg-rose-50 ring-rose-200/70",
    amber: "text-amber-700 bg-amber-50 ring-amber-200/70",
    sky: "text-sky-700 bg-sky-50 ring-sky-200/70",
  }[variant];

  return (
    <div className={`rounded-lg p-3 ring-1 ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium uppercase tracking-wide opacity-80">
          {label}
        </div>
        <ClipboardCheck className="h-3.5 w-3.5 opacity-70" />
      </div>
      <div className="mt-1 text-[22px] font-semibold leading-none">{value}</div>
      <div className="mt-1 text-[11.5px] leading-snug opacity-80">{helper}</div>
    </div>
  );
}
