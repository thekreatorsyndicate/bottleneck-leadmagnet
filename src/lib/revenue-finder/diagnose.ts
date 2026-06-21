import { calculateGoalBenchmarks, calculateKpis } from "./kpis";
import { calculateOpportunityCost } from "./opportunity";
import { generateReport } from "./report";
import { scoreBottlenecks } from "./scoring";
import { validateMetrics } from "./validation";
import type { BusinessMetrics, Diagnosis } from "./types";

export function diagnoseBusiness(metrics: BusinessMetrics, goalMrr = 50000): Diagnosis {
  goalMrr = Math.min(goalMrr, 999999);
  const issues = validateMetrics(metrics);
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
    issues,
  };
}
