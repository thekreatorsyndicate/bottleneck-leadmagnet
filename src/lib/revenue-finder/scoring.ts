import type { BottleneckArea, BusinessMetrics, Kpis, ScoreBreakdown } from "./types";

type ScoringRule = {
  area: BottleneckArea;
  label: (metrics: BusinessMetrics) => string;
  benchmark: (metrics: BusinessMetrics) => number;
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
    benchmark: () => 120,
    getCurrent: (metrics) => metrics.monthlyLeads,
    rationale: (current, benchmark) =>
      `Your lead flow is ${Math.round((current / benchmark) * 100)}% of the V1 benchmark for a steady expert-business funnel.`,
  },
  {
    area: "Conversion",
    label: (metrics) =>
      metrics.salesMotion === "salesCall" ? "Call to client" : "Page to purchase",
    benchmark: (metrics) => (metrics.salesMotion === "salesCall" ? 0.3 : 0.05),
    getCurrent: (_metrics, kpis) => kpis.salesStepToClientRate,
    rationale: (_current, _benchmark, metrics) =>
      metrics.salesMotion === "salesCall"
        ? "The sales conversation is where booked demand turns into new client revenue."
        : "The offer page is where captured demand turns into buyers without a sales conversation.",
  },
  {
    area: "Retention",
    label: () => "Client lifespan",
    benchmark: () => 6,
    getCurrent: (metrics) => metrics.averageClientLifespan,
    rationale: () =>
      "Client lifespan controls how much value each win compounds after the first sale.",
  },
  {
    area: "Ascension",
    label: () => "Upsell revenue mix",
    benchmark: () => 0.15,
    getCurrent: (_metrics, kpis) => kpis.upsellPercent,
    rationale: () =>
      "Ascension shows whether existing clients have a clear path into higher-value support.",
  },
  {
    area: "Capacity",
    label: (metrics) =>
      metrics.salesMotion === "salesCall" ? "Call attendance" : "Lead to offer page",
    benchmark: (metrics) => (metrics.salesMotion === "salesCall" ? 0.88 : 0.45),
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
): ScoreBreakdown[] {
  return rules
    .map((rule) => {
      const benchmark = rule.benchmark(metrics);
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
