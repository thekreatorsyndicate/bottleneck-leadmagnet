import type { BusinessMetrics, MetricIssue } from "./types";

const numericMetricLabels: Record<keyof Omit<BusinessMetrics, "salesMotion" | "pricingModel">, string> = {
  monthlyLeads: "Monthly leads",
  salesCallsBooked: "Sales calls booked",
  salesCallsAttended: "Sales calls attended",
  salesPageVisitors: "Sales page / checkout visitors",
  newClientsAcquired: "New clients acquired",
  averageOfferPrice: "Offer price",
  averageClientLifespan: "Average client lifespan",
  monthlyRecurringRevenue: "Monthly recurring revenue",
  monthlyUpsellRevenue: "Monthly upsell revenue",
};

const addIssue = (
  issues: MetricIssue[],
  severity: MetricIssue["severity"],
  message: string,
) => {
  issues.push({ severity, message });
};

export function validateMetrics(metrics: BusinessMetrics): MetricIssue[] {
  const issues: MetricIssue[] = [];

  Object.entries(numericMetricLabels).forEach(([key, label]) => {
    const value = metrics[key as keyof typeof numericMetricLabels];
    if (!Number.isFinite(value)) {
      addIssue(issues, "error", `${label} must be a finite number.`);
    } else if (value < 0) {
      addIssue(issues, "error", `${label} cannot be negative.`);
    }
  });

  if (metrics.salesMotion === "salesCall") {
    if (metrics.salesCallsBooked > metrics.monthlyLeads) {
      addIssue(
        issues,
        "warning",
        "Sales calls booked exceed monthly leads. If calls came from an older lead pool, use the same time window for both numbers.",
      );
    }

    if (metrics.salesCallsAttended > metrics.salesCallsBooked) {
      addIssue(
        issues,
        "error",
        "Sales calls attended cannot exceed sales calls booked.",
      );
    }

    if (metrics.newClientsAcquired > metrics.salesCallsAttended) {
      addIssue(
        issues,
        "error",
        "New clients acquired cannot exceed attended sales calls.",
      );
    }
  } else {
    if (metrics.salesPageVisitors > metrics.monthlyLeads) {
      addIssue(
        issues,
        "warning",
        "Sales page visitors exceed monthly leads. If page traffic includes non-leads, use captured leads and offer-page visitors from the same funnel segment.",
      );
    }

    if (metrics.newClientsAcquired > metrics.salesPageVisitors) {
      addIssue(
        issues,
        "error",
        "New customers acquired cannot exceed sales page or checkout visitors.",
      );
    }
  }

  if (metrics.pricingModel === "recurring") {
    if (metrics.averageOfferPrice <= 0 && metrics.monthlyRecurringRevenue > 0) {
      addIssue(
        issues,
        "warning",
        "Current total MRR is entered, but monthly program price is zero. LTV and opportunity estimates need a monthly price.",
      );
    }

    if (metrics.averageClientLifespan <= 0) {
      addIssue(
        issues,
        "warning",
        "Recurring offers need a client lifespan estimate to calculate LTV from churn or retention.",
      );
    }
  }

  const coreMonthlyRevenue =
    metrics.pricingModel === "recurring"
      ? metrics.monthlyRecurringRevenue
      : metrics.averageOfferPrice * metrics.newClientsAcquired;

  if (metrics.monthlyUpsellRevenue > 0 && coreMonthlyRevenue <= 0) {
    addIssue(
      issues,
      "warning",
      "Upsell revenue is present without core client revenue. The diagnostic will not infer fake active clients from upsells alone.",
    );
  }

  if (metrics.monthlyUpsellRevenue > coreMonthlyRevenue && coreMonthlyRevenue > 0) {
    addIssue(
      issues,
      "warning",
      "Upsell revenue is larger than core monthly revenue. That can be real, but it usually means expansion revenue should be checked against the same month and customer base.",
    );
  }

  return issues;
}
