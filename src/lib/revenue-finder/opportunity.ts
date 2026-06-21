import { formatNumber, formatPercent } from "./format";
import type {
  BusinessMetrics,
  Kpis,
  OpportunityCost,
  ScoreBreakdown,
} from "./types";

const positiveDelta = (next: number, current: number) =>
  Math.max(0, next - current);

const conservativeRate = (current: number, fallback: number) =>
  current > 0 ? current : fallback;

export function calculateOpportunityCost(
  metrics: BusinessMetrics,
  kpis: Kpis,
  primaryScore: ScoreBreakdown,
): OpportunityCost {
  const monthlyClientValue = kpis.monthlyRevenuePerNewClient;

  switch (primaryScore.area) {
    case "Acquisition": {
      const benchmarkLeads = Math.max(primaryScore.benchmark, metrics.monthlyLeads);
      const salesStepRate = conservativeRate(
        kpis.leadToSalesStepRate,
        metrics.salesMotion === "salesCall" ? 0.2 : 0.25,
      );
      const attendanceRate =
        metrics.salesMotion === "salesCall"
          ? conservativeRate(kpis.callAttendanceRate, 0.65)
          : 1;
      const closeRate = conservativeRate(
        kpis.salesStepToClientRate,
        metrics.salesMotion === "salesCall" ? 0.15 : primaryScore.benchmark,
      );
      const additionalClients =
        positiveDelta(benchmarkLeads, metrics.monthlyLeads) *
        salesStepRate *
        attendanceRate *
        closeRate;
      return {
        area: primaryScore.area,
        currentPerformance: `${formatNumber(metrics.monthlyLeads)} leads/month`,
        benchmarkPerformance: `${formatNumber(benchmarkLeads)} leads/month`,
        monthlyRevenueLeftOnTable: additionalClients * monthlyClientValue,
        explanation:
          "This estimates the value of bringing lead volume up to the benchmark. When downstream data is missing, it uses conservative funnel assumptions instead of showing zero opportunity.",
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
        kpis.estimatedActiveClients > 0
          ? metrics.monthlyUpsellRevenue / kpis.estimatedActiveClients
          : 0;
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
          metrics.pricingModel === "recurring" ||
          metrics.monthlyUpsellRevenue > 0
            ? metrics.newClientsAcquired *
              positiveDelta(benchmarkLtv, currentLtv) /
              Math.max(benchmarkLifespan, 1)
            : 0,
        explanation:
          metrics.pricingModel === "recurring"
            ? "This estimates how much recurring monthly value improves when each new client stays longer."
            : "For one-time offers, longer delivery only creates new monthly revenue when there is a continuity or expansion path.",
      };
    }
    case "Ascension": {
      const benchmarkUpsellPercent = Math.max(
        primaryScore.benchmark,
        kpis.upsellPercent,
      );
      const coreRevenue = Math.max(
        0,
        kpis.calculatedMonthlyRevenue - metrics.monthlyUpsellRevenue,
      );
      const targetUpsellRevenue =
        benchmarkUpsellPercent >= 1
          ? metrics.monthlyUpsellRevenue
          : (coreRevenue * benchmarkUpsellPercent) /
            Math.max(1 - benchmarkUpsellPercent, 0.01);
      return {
        area: primaryScore.area,
        currentPerformance: `${formatPercent(kpis.upsellPercent)} upsell mix`,
        benchmarkPerformance: `${formatPercent(benchmarkUpsellPercent)} upsell mix`,
        monthlyRevenueLeftOnTable:
          positiveDelta(targetUpsellRevenue, metrics.monthlyUpsellRevenue),
        explanation:
          "This estimates the extra expansion revenue needed for upsells to become the benchmark share of total monthly revenue.",
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
