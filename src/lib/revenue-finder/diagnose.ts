import { calculateKpis } from "./kpis";
import { calculateOpportunityCost } from "./opportunity";
import { generateReport } from "./report";
import { scoreBottlenecks } from "./scoring";
import type { BusinessMetrics, Diagnosis } from "./types";

export function diagnoseBusiness(metrics: BusinessMetrics): Diagnosis {
  const kpis = calculateKpis(metrics);
  const scores = scoreBottlenecks(metrics, kpis);
  const primaryScore = scores[0];
  const opportunityCost = calculateOpportunityCost(metrics, kpis, primaryScore);
  const report = generateReport(primaryScore, opportunityCost);

  return {
    metrics,
    kpis,
    scores,
    primaryScore,
    opportunityCost,
    report,
  };
}
