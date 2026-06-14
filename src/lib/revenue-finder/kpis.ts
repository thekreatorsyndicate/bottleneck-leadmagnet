import type { BusinessMetrics, Kpis } from "./types";

const divide = (numerator: number, denominator: number) =>
  denominator > 0 ? numerator / denominator : 0;

export function calculateKpis(metrics: BusinessMetrics): Kpis {
  const clientLifespan = Math.max(metrics.averageClientLifespan, 1);
  const salesOpportunities =
    metrics.salesMotion === "salesCall"
      ? metrics.salesCallsAttended
      : metrics.salesPageVisitors;
  const newClientRevenueThisMonth =
    metrics.averageOfferPrice * metrics.newClientsAcquired;
  const calculatedMonthlyRevenue =
    newClientRevenueThisMonth +
    metrics.monthlyRecurringRevenue +
    metrics.monthlyUpsellRevenue;
  const estimatedActiveClients = Math.max(
    metrics.newClientsAcquired * clientLifespan,
    metrics.newClientsAcquired,
    1,
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

  return {
    calculatedMonthlyRevenue,
    leadToSalesStepRate: divide(
      metrics.salesMotion === "salesCall"
        ? metrics.salesCallsBooked
        : metrics.salesPageVisitors,
      metrics.monthlyLeads,
    ),
    callAttendanceRate: divide(
      metrics.salesCallsAttended,
      metrics.salesCallsBooked,
    ),
    salesStepToClientRate: divide(
      metrics.newClientsAcquired,
      salesOpportunities,
    ),
    clientLtv,
    revenuePerLead: divide(calculatedMonthlyRevenue, metrics.monthlyLeads),
    upsellPercent: divide(metrics.monthlyUpsellRevenue, calculatedMonthlyRevenue),
    estimatedActiveClients,
    monthlyRevenuePerNewClient,
    salesOpportunities,
  };
}
