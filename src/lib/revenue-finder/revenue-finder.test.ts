import { describe, expect, it } from "vitest";
import { diagnoseBusiness } from "./diagnose";
import { calculateGoalBenchmarks, calculateKpis } from "./kpis";
import { calculateOpportunityCost } from "./opportunity";
import { getSelfServePurchaseBenchmark, scoreBottlenecks } from "./scoring";
import type { BusinessMetrics } from "./types";
import { validateMetrics } from "./validation";

const baseMetrics: BusinessMetrics = {
  salesMotion: "salesCall",
  pricingModel: "oneTime",
  monthlyLeads: 100,
  salesCallsBooked: 20,
  salesCallsAttended: 15,
  salesPageVisitors: 0,
  newClientsAcquired: 4,
  averageOfferPrice: 1000,
  averageClientLifespan: 3,
  monthlyRecurringRevenue: 0,
  monthlyUpsellRevenue: 0,
};

describe("revenue finder calculations", () => {
  it("flags impossible call attendance and caps diagnostic rates", () => {
    const metrics = {
      ...baseMetrics,
      salesCallsBooked: 10,
      salesCallsAttended: 20,
    };

    const issues = validateMetrics(metrics);
    const kpis = calculateKpis(metrics);

    expect(issues.some((issue) => issue.severity === "error")).toBe(true);
    expect(kpis.rawCallAttendanceRate).toBe(2);
    expect(kpis.callAttendanceRate).toBe(1);
  });

  it("flags self-serve customers that exceed page visitors", () => {
    const metrics: BusinessMetrics = {
      ...baseMetrics,
      salesMotion: "selfServe",
      monthlyLeads: 100,
      salesCallsBooked: 0,
      salesCallsAttended: 0,
      salesPageVisitors: 10,
      newClientsAcquired: 20,
    };

    const issues = validateMetrics(metrics);
    const kpis = calculateKpis(metrics);

    expect(issues.some((issue) => issue.severity === "error")).toBe(true);
    expect(kpis.rawSalesStepToClientRate).toBe(2);
    expect(kpis.salesStepToClientRate).toBe(1);
  });

  it("does not double count new clients inside recurring MRR", () => {
    const kpis = calculateKpis({
      ...baseMetrics,
      pricingModel: "recurring",
      averageOfferPrice: 1000,
      newClientsAcquired: 5,
      monthlyRecurringRevenue: 20000,
    });

    expect(kpis.calculatedMonthlyRevenue).toBe(20000);
  });

  it("does not infer fake active clients or LTV from upsell-only revenue", () => {
    const kpis = calculateKpis({
      ...baseMetrics,
      monthlyLeads: 0,
      salesCallsBooked: 0,
      salesCallsAttended: 0,
      newClientsAcquired: 0,
      averageOfferPrice: 0,
      averageClientLifespan: 0,
      monthlyUpsellRevenue: 5000,
    });

    expect(kpis.estimatedActiveClients).toBe(0);
    expect(kpis.clientLtv).toBe(0);
    expect(kpis.monthlyRevenuePerNewClient).toBe(0);
  });

  it("uses price-sensitive self-serve purchase benchmarks", () => {
    const lowTicket = getSelfServePurchaseBenchmark({
      ...baseMetrics,
      salesMotion: "selfServe",
      averageOfferPrice: 99,
    });
    const highTicket = getSelfServePurchaseBenchmark({
      ...baseMetrics,
      salesMotion: "selfServe",
      averageOfferPrice: 2500,
    });

    expect(lowTicket).toBe(0.04);
    expect(highTicket).toBe(0.003);
  });

  it("skips retention scoring for one-time self-serve offers without continuity data", () => {
    const metrics: BusinessMetrics = {
      ...baseMetrics,
      salesMotion: "selfServe",
      monthlyLeads: 100,
      salesCallsBooked: 0,
      salesCallsAttended: 0,
      salesPageVisitors: 50,
      newClientsAcquired: 2,
      averageClientLifespan: 0,
    };
    const kpis = calculateKpis(metrics);
    const scores = scoreBottlenecks(
      metrics,
      kpis,
      calculateGoalBenchmarks(metrics, kpis, 50000),
    );

    expect(scores.some((score) => score.area === "Retention")).toBe(false);
  });

  it("uses conservative downstream assumptions for acquisition opportunity when rates are missing", () => {
    const metrics: BusinessMetrics = {
      ...baseMetrics,
      monthlyLeads: 0,
      salesCallsBooked: 0,
      salesCallsAttended: 0,
      newClientsAcquired: 0,
    };
    const diagnosis = diagnoseBusiness(metrics);
    const opportunityCost = calculateOpportunityCost(
      metrics,
      diagnosis.kpis,
      diagnosis.primaryScore,
    );

    expect(diagnosis.primaryScore.area).toBe("Conversion");
    expect(opportunityCost.monthlyRevenueLeftOnTable).toBeGreaterThanOrEqual(0);
  });

  it("flags downstream bottleneck instead of acquisition when conversion is terrible", () => {
    const metrics: BusinessMetrics = {
      ...baseMetrics,
      monthlyLeads: 500,
      salesCallsBooked: 100,
      salesCallsAttended: 65,
      newClientsAcquired: 2,
      averageOfferPrice: 2000,
      monthlyRecurringRevenue: 0,
      monthlyUpsellRevenue: 0,
    };
    const diagnosis = diagnoseBusiness(metrics, 50000);

    const isAcquisition = diagnosis.primaryScore.area === "Acquisition";
    const conversionScore = diagnosis.scores.find((s) => s.area === "Conversion");
    
    expect(isAcquisition).toBe(false);
    expect(conversionScore?.score).toBeLessThan(70);
  });

  it("flags acquisition as bottleneck only when downstream metrics are healthy", () => {
    const metrics: BusinessMetrics = {
      ...baseMetrics,
      monthlyLeads: 100,
      salesCallsBooked: 80,
      salesCallsAttended: 55,
      newClientsAcquired: 12,
      averageOfferPrice: 1000,
    };
    const diagnosis = diagnoseBusiness(metrics, 50000);

    const downstreamAreas = ["Conversion", "Retention", "Ascension", "Capacity"];
    const downstreamScores = diagnosis.scores.filter((s) =>
      downstreamAreas.includes(s.area),
    );
    const allDownstreamHealthy = downstreamScores.every((s) => s.score >= 70);

    if (allDownstreamHealthy) {
      expect(diagnosis.primaryScore.area).toBe("Acquisition");
    }
  });
});
