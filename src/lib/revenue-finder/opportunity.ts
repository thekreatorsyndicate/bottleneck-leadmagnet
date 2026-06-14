import { formatNumber, formatPercent } from "./format";
import type {
  BusinessMetrics,
  Kpis,
  OpportunityCost,
  ScoreBreakdown,
} from "./types";

const positiveDelta = (next: number, current: number) =>
  Math.max(0, next - current);

export function calculateOpportunityCost(
  metrics: BusinessMetrics,
  kpis: Kpis,
  primaryScore: ScoreBreakdown,
): OpportunityCost {
  const monthlyClientValue = Math.max(
    kpis.monthlyRevenuePerNewClient,
    metrics.averageOfferPrice / Math.max(metrics.averageClientLifespan, 1),
  );

  switch (primaryScore.area) {
    case "Acquisition": {
      const benchmarkLeads = Math.max(primaryScore.benchmark, metrics.monthlyLeads);
      const additionalClients =
        positiveDelta(benchmarkLeads, metrics.monthlyLeads) *
        kpis.leadToSalesStepRate *
        (metrics.salesMotion === "salesCall" ? kpis.callAttendanceRate : 1) *
        Math.max(kpis.salesStepToClientRate, metrics.salesMotion === "salesCall" ? 0.12 : 0.02);
      return {
        area: primaryScore.area,
        currentPerformance: `${formatNumber(metrics.monthlyLeads)} leads/month`,
        benchmarkPerformance: `${formatNumber(benchmarkLeads)} leads/month`,
        monthlyRevenueLeftOnTable: additionalClients * monthlyClientValue,
        explanation:
          "This estimates the value of bringing lead volume up to the benchmark while keeping your current funnel mechanics intact.",
      };
    }
    case "Conversion": {
      const benchmarkCloseRate = Math.max(
        primaryScore.benchmark,
        kpis.salesStepToClientRate,
      );
      const additionalClients =
        kpis.salesOpportunities *
        positiveDelta(benchmarkCloseRate, kpis.salesStepToClientRate);
      const currentLabel =
        metrics.salesMotion === "salesCall" ? "call to client" : "page to purchase";
      return {
        area: primaryScore.area,
        currentPerformance: `${formatPercent(kpis.salesStepToClientRate)} ${currentLabel}`,
        benchmarkPerformance: `${formatPercent(benchmarkCloseRate)} ${currentLabel}`,
        monthlyRevenueLeftOnTable: additionalClients * monthlyClientValue,
        explanation:
          metrics.salesMotion === "salesCall"
            ? "This estimates the monthly value of closing attended calls at the benchmark rate with the same call volume."
            : "This estimates the monthly value of converting offer-page visitors at the benchmark rate with the same traffic.",
      };
    }
    case "Retention": {
      const benchmarkLifespan = Math.max(
        primaryScore.benchmark,
        metrics.averageClientLifespan,
      );
      const currentLtv = kpis.clientLtv;
      const monthlyUpsellPerClient =
        metrics.monthlyUpsellRevenue / Math.max(kpis.estimatedActiveClients, 1);
      const benchmarkLtv =
        (metrics.pricingModel === "recurring"
          ? metrics.averageOfferPrice * benchmarkLifespan
          : metrics.averageOfferPrice) +
        monthlyUpsellPerClient * benchmarkLifespan;
      return {
        area: primaryScore.area,
        currentPerformance: `${formatNumber(metrics.averageClientLifespan)} month lifespan`,
        benchmarkPerformance: `${formatNumber(benchmarkLifespan)} month lifespan`,
        monthlyRevenueLeftOnTable:
          metrics.newClientsAcquired *
          positiveDelta(benchmarkLtv, currentLtv) /
          Math.max(benchmarkLifespan, 1),
        explanation:
          "This estimates how much recurring monthly value improves when each new client stays longer.",
      };
    }
    case "Ascension": {
      const benchmarkUpsellPercent = Math.max(
        primaryScore.benchmark,
        kpis.upsellPercent,
      );
      return {
        area: primaryScore.area,
        currentPerformance: `${formatPercent(kpis.upsellPercent)} upsell mix`,
        benchmarkPerformance: `${formatPercent(benchmarkUpsellPercent)} upsell mix`,
        monthlyRevenueLeftOnTable:
          kpis.calculatedMonthlyRevenue *
          positiveDelta(benchmarkUpsellPercent, kpis.upsellPercent),
        explanation:
          "This estimates the extra monthly revenue available if existing clients ascended at the benchmark mix.",
      };
    }
    case "Capacity": {
      const currentCapacity =
        metrics.salesMotion === "salesCall"
          ? kpis.callAttendanceRate
          : kpis.leadToSalesStepRate;
      const benchmarkCapacity = Math.max(primaryScore.benchmark, currentCapacity);
      const additionalSalesOpportunities =
        (metrics.salesMotion === "salesCall"
          ? metrics.salesCallsBooked
          : metrics.monthlyLeads) *
        positiveDelta(benchmarkCapacity, currentCapacity);
      return {
        area: primaryScore.area,
        currentPerformance:
          metrics.salesMotion === "salesCall"
            ? `${formatPercent(kpis.callAttendanceRate)} call attendance`
            : `${formatPercent(kpis.leadToSalesStepRate)} lead to offer page`,
        benchmarkPerformance:
          metrics.salesMotion === "salesCall"
            ? `${formatPercent(benchmarkCapacity)} call attendance`
            : `${formatPercent(benchmarkCapacity)} lead to offer page`,
        monthlyRevenueLeftOnTable:
          additionalSalesOpportunities *
          Math.max(kpis.salesStepToClientRate, metrics.salesMotion === "salesCall" ? 0.18 : 0.02) *
          monthlyClientValue,
        explanation:
          metrics.salesMotion === "salesCall"
            ? "This estimates the value of reclaiming booked calls that currently fail to become real sales conversations."
            : "This estimates the value of moving more captured demand into the offer page or checkout path.",
      };
    }
  }
}
