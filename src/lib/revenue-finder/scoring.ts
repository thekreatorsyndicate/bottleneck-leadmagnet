import type { BottleneckArea, BusinessMetrics, GoalBenchmarks, Kpis, ScoreBreakdown } from "./types";

type ScoringRule = {
  area: BottleneckArea;
  label: (metrics: BusinessMetrics) => string;
  benchmark: (metrics: BusinessMetrics, goal: GoalBenchmarks) => number;
  getCurrent: (metrics: BusinessMetrics, kpis: Kpis) => number;
  rationale: (
    current: number,
    benchmark: number,
    metrics: BusinessMetrics,
  ) => string;
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
    label: () => "Lead volume",
    benchmark: (_metrics, goal) => goal.targetLeadsPerMonth,
    getCurrent: (metrics) => metrics.monthlyLeads,
    rationale: (current, benchmark) =>
      `You need ~${Math.round(benchmark)} leads/month to hit your goal. You're getting ${Math.round(current)}.`,
  },
  {
    area: "Conversion",
    label: (metrics) =>
      metrics.salesMotion === "salesCall" ? "Call to client" : "Page to purchase",
    benchmark: (_metrics, goal) => goal.targetCloseRate,
    getCurrent: (_metrics, kpis) => kpis.salesStepToClientRate,
    rationale: (_current, _benchmark, metrics) =>
      metrics.salesMotion === "salesCall"
        ? "The sales conversation is where booked demand turns into new client revenue."
        : "The offer page is where captured demand turns into buyers without a sales conversation.",
  },
  {
    area: "Retention",
    label: () => "Client lifespan",
    benchmark: (_metrics, goal) => goal.targetLifespanMonths,
    getCurrent: (metrics) => metrics.averageClientLifespan,
    rationale: () =>
      "Client lifespan controls how much value each win compounds after the first sale.",
  },
  {
    area: "Ascension",
    label: () => "Upsell revenue mix",
    benchmark: (_metrics, goal) => goal.targetUpsellPercent,
    getCurrent: (_metrics, kpis) => kpis.upsellPercent,
    rationale: () =>
      "Ascension shows whether existing clients have a clear path into higher-value support.",
  },
  {
    area: "Capacity",
    label: (metrics) =>
      metrics.salesMotion === "salesCall" ? "Call attendance" : "Lead to offer page",
    benchmark: (_metrics, goal) => goal.targetAttendanceRate,
    getCurrent: (metrics, kpis) =>
      metrics.salesMotion === "salesCall"
        ? kpis.callAttendanceRate
        : kpis.leadToSalesStepRate,
    rationale: (_current, _benchmark, metrics) =>
      metrics.salesMotion === "salesCall"
        ? "Attendance is a proxy for calendar quality, follow-up discipline, and whether the business can absorb demand cleanly."
        : "Offer-page flow shows whether people who enter your audience or funnel actually reach the buying moment.",
  },
];

export function scoreBottlenecks(
  metrics: BusinessMetrics,
  kpis: Kpis,
  goal: GoalBenchmarks,
): ScoreBreakdown[] {
  return rules
    .map((rule) => {
      const benchmark = rule.benchmark(metrics, goal);
      const current = rule.getCurrent(metrics, kpis);
      return {
        area: rule.area,
        score: ratioScore(current, benchmark, rule.higherIsBetter),
        benchmark,
        current,
        label: rule.label(metrics),
        rationale: rule.rationale(current, benchmark, metrics),
      };
    })
    .sort((a, b) => a.score - b.score);
}
