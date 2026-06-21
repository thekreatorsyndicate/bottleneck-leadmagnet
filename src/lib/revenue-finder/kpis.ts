import type { BusinessMetrics, GoalBenchmarks, Kpis } from "./types";
import {
  getExpectedAttendanceRate,
  getExpectedCloseRate,
  getExpectedLeadToOpportunityRate,
  getExpectedLifespan,
  getExpectedUpsellPercent,
} from "./benchmarks";

const divide = (numerator: number, denominator: number) =>
  denominator > 0 && Number.isFinite(numerator) && Number.isFinite(denominator)
    ? numerator / denominator
    : 0;

const clampRate = (value: number) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

export function calculateKpis(metrics: BusinessMetrics): Kpis {
  const clientLifespan = Math.max(metrics.averageClientLifespan, 0);
  const salesOpportunities =
    metrics.salesMotion === "salesCall"
      ? metrics.salesCallsAttended
      : metrics.salesPageVisitors;
  const newClientRevenueThisMonth =
    metrics.averageOfferPrice * metrics.newClientsAcquired;
  const calculatedMonthlyRevenue =
    metrics.pricingModel === "recurring"
      ? metrics.monthlyRecurringRevenue + metrics.monthlyUpsellRevenue
      : newClientRevenueThisMonth + metrics.monthlyUpsellRevenue;
  const activeClientsFromMrr = divide(
    metrics.monthlyRecurringRevenue,
    metrics.averageOfferPrice,
  );
  const estimatedActiveClients = Math.max(
    metrics.pricingModel === "recurring" ? activeClientsFromMrr : 0,
    metrics.newClientsAcquired * clientLifespan,
    metrics.newClientsAcquired,
    0,
  );
  const monthlyUpsellPerClient = divide(
    metrics.monthlyUpsellRevenue,
    estimatedActiveClients,
  );
  const coreOfferLtv =
    metrics.pricingModel === "recurring"
      ? metrics.averageOfferPrice * clientLifespan
      : metrics.averageOfferPrice;
  const clientLtv =
    coreOfferLtv + monthlyUpsellPerClient * clientLifespan;
  const monthlyRevenuePerNewClient =
    metrics.averageOfferPrice + monthlyUpsellPerClient;
  const rawLeadToSalesStepRate = divide(
    metrics.salesMotion === "salesCall"
      ? metrics.salesCallsBooked
      : metrics.salesPageVisitors,
    metrics.monthlyLeads,
  );
  const rawCallAttendanceRate = divide(
    metrics.salesCallsAttended,
    metrics.salesCallsBooked,
  );
  const rawSalesStepToClientRate = divide(
    metrics.newClientsAcquired,
    salesOpportunities,
  );
  const rawUpsellPercent = divide(
    metrics.monthlyUpsellRevenue,
    calculatedMonthlyRevenue,
  );

  return {
    calculatedMonthlyRevenue,
    leadToSalesStepRate: clampRate(rawLeadToSalesStepRate),
    callAttendanceRate: clampRate(rawCallAttendanceRate),
    salesStepToClientRate: clampRate(rawSalesStepToClientRate),
    rawLeadToSalesStepRate,
    rawCallAttendanceRate,
    rawSalesStepToClientRate,
    rawUpsellPercent,
    clientLtv,
    revenuePerLead: divide(calculatedMonthlyRevenue, metrics.monthlyLeads),
    upsellPercent: clampRate(rawUpsellPercent),
    estimatedActiveClients,
    monthlyRevenuePerNewClient,
    salesOpportunities,
  };
}

export function calculateGoalBenchmarks(
  metrics: BusinessMetrics,
  kpis: Kpis,
  goalMrr: number,
): GoalBenchmarks {
  const existingRevenue =
    metrics.monthlyRecurringRevenue + metrics.monthlyUpsellRevenue;
  const neededNewClientRevenue = Math.max(
    goalMrr - existingRevenue,
    goalMrr * 0.3,
  );
  const targetNewClientsPerMonth =
    neededNewClientRevenue / Math.max(metrics.averageOfferPrice, 1);

  const expectedCloseRate = getExpectedCloseRate(
    metrics.averageOfferPrice,
    metrics.salesMotion,
  );
  const targetOpportunitiesPerMonth =
    targetNewClientsPerMonth / Math.max(expectedCloseRate, 0.001);

  const expectedLeadToOppRate = getExpectedLeadToOpportunityRate(
    metrics.averageOfferPrice,
    metrics.salesMotion,
  );
  const targetLeadsPerMonth =
    targetOpportunitiesPerMonth / Math.max(expectedLeadToOppRate, 0.001);

  const expectedLifespan =
    metrics.pricingModel === "recurring"
      ? getExpectedLifespan(metrics.averageOfferPrice)
      : 3;
  const expectedUpsellPct = getExpectedUpsellPercent(
    metrics.averageOfferPrice,
  );
  const expectedAttendanceRate = getExpectedAttendanceRate(
    metrics.averageOfferPrice,
    metrics.salesMotion,
  );

  const currentRevenue = kpis.calculatedMonthlyRevenue;
  const mrrRatio =
    currentRevenue > 0
      ? metrics.monthlyRecurringRevenue / currentRevenue
      : 0;
  const efficiencyMultiplier = mrrRatio > 0.5 ? 0.85 : 1.0;

  return {
    targetMonthlyRevenue: goalMrr,
    targetNewClientsPerMonth: Math.round(
      targetNewClientsPerMonth * efficiencyMultiplier,
    ),
    targetLeadsPerMonth: Math.round(
      targetLeadsPerMonth * efficiencyMultiplier,
    ),
    targetOpportunitiesPerMonth: Math.round(
      targetOpportunitiesPerMonth * efficiencyMultiplier,
    ),
    targetCloseRate: expectedCloseRate,
    targetLifespanMonths: expectedLifespan,
    targetUpsellPercent: expectedUpsellPct,
    targetAttendanceRate: expectedAttendanceRate,
    expectedRevenuePerLead: goalMrr / Math.max(targetLeadsPerMonth, 1),
  };
}
