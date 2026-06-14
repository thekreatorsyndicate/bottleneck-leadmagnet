import { calculateGoalBenchmarks, calculateKpis } from "./kpis";
import { calculateOpportunityCost } from "./opportunity";
import { generateReport } from "./report";
import { scoreBottlenecks } from "./scoring";
import type { BusinessMetrics, Diagnosis } from "./types";

export function diagnoseBusiness(metrics: BusinessMetrics, goalMrr = 50000): Diagnosis {
  const kpis = calculateKpis(metrics);
  const goal = calculateGoalBenchmarks(metrics, kpis, goalMrr);
  const scores = scoreBottlenecks(metrics, kpis, goal);
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
