import type { BottleneckArea, BusinessMetrics, Kpis, ScoreBreakdown } from "./types";

type ScoringRule = {
  area: BottleneckArea;
  label: string;
  benchmark: number;
  getCurrent: (metrics: BusinessMetrics, kpis: Kpis) => number;
  rationale: (current: number, benchmark: number) => string;
  higherIsBetter?: boolean;
};

const clampScore = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value)));

const ratioScore = (current: number, benchmark: number, higherIsBetter = true) => {
  if (benchmark <= 0) return 100;
  const ratio = higherIsBetter ? current / benchmark : benchmark / current;
  return clampScore(ratio * 100);
};

const rules: ScoringRule[] = [
  {
    area: "Acquisition",
    label: "Lead volume",
    benchmark: 120,
    getCurrent: (metrics) => metrics.monthlyLeads,
    rationale: (current, benchmark) =>
      `Your lead flow is ${Math.round((current / benchmark) * 100)}% of the V1 benchmark for a steady expert-business funnel.`,
  },
  {
    area: "Conversion",
    label: "Call to client",
    benchmark: 0.3,
    getCurrent: (_metrics, kpis) => kpis.callToClientRate,
    rationale: () =>
      "The sales conversation is where booked demand turns into new client revenue.",
  },
  {
    area: "Retention",
    label: "Client lifespan",
    benchmark: 6,
    getCurrent: (metrics) => metrics.averageClientLifespan,
    rationale: () =>
      "Client lifespan controls how much value each win compounds after the first sale.",
  },
  {
    area: "Ascension",
    label: "Upsell revenue mix",
    benchmark: 0.15,
    getCurrent: (_metrics, kpis) => kpis.upsellPercent,
    rationale: () =>
      "Ascension shows whether existing clients have a clear path into higher-value support.",
  },
  {
    area: "Capacity",
    label: "Call attendance",
    benchmark: 0.88,
    getCurrent: (_metrics, kpis) => kpis.callAttendanceRate,
    rationale: () =>
      "Attendance is a proxy for calendar quality, follow-up discipline, and whether the business can absorb demand cleanly.",
  },
];

export function scoreBottlenecks(
  metrics: BusinessMetrics,
  kpis: Kpis,
): ScoreBreakdown[] {
  return rules
    .map((rule) => {
      const current = rule.getCurrent(metrics, kpis);
      return {
        area: rule.area,
        score: ratioScore(current, rule.benchmark, rule.higherIsBetter),
        benchmark: rule.benchmark,
        current,
        label: rule.label,
        rationale: rule.rationale(current, rule.benchmark),
      };
    })
    .sort((a, b) => a.score - b.score);
}
