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
  applies?: (metrics: BusinessMetrics, kpis: Kpis) => boolean;
};

const clampScore = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value)));

const ratioScore = (current: number, benchmark: number, higherIsBetter = true) => {
  if (benchmark <= 0 || !Number.isFinite(current)) return 100;
  const ratio = higherIsBetter ? current / benchmark : benchmark / current;
  return clampScore(ratio * 100);
};

export const getSelfServePurchaseBenchmark = (metrics: BusinessMetrics) => {
  if (metrics.averageOfferPrice < 500) return 0.04;
  if (metrics.averageOfferPrice <= 1000) return 0.015;
  if (metrics.averageOfferPrice <= 2000) return 0.0075;
  return 0.003;
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
        : "The offer page is judged against a price-sensitive purchase benchmark, because high-ticket courses and low-ticket products should not be scored the same way.",
  },
  {
    area: "Retention",
    label: (metrics) =>
      metrics.pricingModel === "recurring"
        ? "Client lifespan"
        : "Continuity potential",
    benchmark: (_metrics, goal) => goal.targetLifespanMonths,
    getCurrent: (metrics) => metrics.averageClientLifespan,
    applies: (metrics) =>
      metrics.pricingModel === "recurring" ||
      metrics.salesMotion === "salesCall" ||
      metrics.monthlyUpsellRevenue > 0,
    rationale: (_current, _benchmark, metrics) =>
      metrics.pricingModel === "recurring"
        ? "Client lifespan translates churn into LTV, so recurring offers are benchmarked against a healthier retention window."
        : "Continuity is only scored when the offer has a meaningful post-purchase relationship or expansion path.",
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
    .filter((rule) => rule.applies?.(metrics, kpis) ?? true)
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
