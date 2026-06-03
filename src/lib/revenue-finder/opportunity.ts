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
        kpis.leadToCallRate *
        Math.max(kpis.callToClientRate, 0.12);
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
      const benchmarkCloseRate = Math.max(primaryScore.benchmark, kpis.callToClientRate);
      const additionalClients =
        metrics.salesCallsAttended *
        positiveDelta(benchmarkCloseRate, kpis.callToClientRate);
      return {
        area: primaryScore.area,
        currentPerformance: `${formatPercent(kpis.callToClientRate)} call to client`,
        benchmarkPerformance: `${formatPercent(benchmarkCloseRate)} call to client`,
        monthlyRevenueLeftOnTable: additionalClients * monthlyClientValue,
        explanation:
          "This estimates the monthly value of closing attended calls at the benchmark rate with the same call volume.",
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
      const benchmarkAttendance = Math.max(
        primaryScore.benchmark,
        kpis.callAttendanceRate,
      );
      const additionalAttendedCalls =
        metrics.salesCallsBooked *
        positiveDelta(benchmarkAttendance, kpis.callAttendanceRate);
      return {
        area: primaryScore.area,
        currentPerformance: `${formatPercent(kpis.callAttendanceRate)} call attendance`,
        benchmarkPerformance: `${formatPercent(benchmarkAttendance)} call attendance`,
        monthlyRevenueLeftOnTable:
          additionalAttendedCalls *
          Math.max(kpis.callToClientRate, 0.18) *
          monthlyClientValue,
        explanation:
          "This estimates the value of reclaiming booked calls that currently fail to become real sales conversations.",
      };
    }
  }
}
