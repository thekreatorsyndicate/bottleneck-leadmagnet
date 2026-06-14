import { formatCurrency } from "./format";
import { generateRoadmap } from "./roadmap";
import type { OpportunityCost, Report, ScoreBreakdown } from "./types";

const actions: Record<string, string[]> = {
  Acquisition: [
    "Increase qualified lead flow before optimizing downstream tactics.",
    "Concentrate messaging around one expensive, urgent client problem.",
    "Add one repeatable non-organic channel such as partner workshops or guest trainings.",
  ],
  Conversion: [
    "Improve pre-call trust with proof, qualification, and clearer expectations.",
    "Standardize the sales call around diagnosis, cost of inaction, and fit.",
    "Install a follow-up sequence for no-shows, maybes, and delayed decisions.",
  ],
  Retention: [
    "Create a first-14-days success milestone clients can feel quickly.",
    "Add client health checks before momentum drops.",
    "Design continuity offers around the next logical business problem.",
  ],
  Ascension: [
    "Map the next problem clients face after the first result.",
    "Introduce client-only upgrade invitations at key delivery milestones.",
    "Package an implementation sprint, audit, or continuation offer.",
  ],
  Capacity: [
    "Clean up booking, confirmation, and reminder systems.",
    "Add light qualification before prospects reach the calendar.",
    "Batch calls and protect delivery blocks before adding more demand.",
  ],
};

const selfServeActions: Partial<Record<string, string[]>> = {
  Conversion: [
    "Sharpen the offer page around one urgent outcome, one clear mechanism, and one next step.",
    "Add proof, risk reversal, and objection handling directly beside the buying decision.",
    "Create a post-click follow-up sequence for visitors who show intent but do not buy.",
  ],
  Capacity: [
    "Reduce friction between the lead capture moment and the offer page.",
    "Add stronger bridges from content, email, or community touchpoints into the buying path.",
    "Check the checkout path on mobile and remove avoidable steps before payment.",
  ],
};

export function generateReport(
  primaryScore: ScoreBreakdown,
  opportunityCost: OpportunityCost,
): Report {
  const estimatedImpact = formatCurrency(
    opportunityCost.monthlyRevenueLeftOnTable,
  );
  const recommendedActions =
    primaryScore.label === "Page to purchase" ||
    primaryScore.label === "Lead to offer page"
      ? selfServeActions[primaryScore.area] ?? actions[primaryScore.area]
      : actions[primaryScore.area];
  const roadmapVariant =
    primaryScore.label === "Page to purchase" ||
    primaryScore.label === "Lead to offer page"
      ? "selfServe"
      : "salesCall";

  return {
    primaryBottleneck: primaryScore.area,
    whySelected: `${primaryScore.area} scored ${primaryScore.score}/100, the lowest area in your diagnostic. ${primaryScore.rationale}`,
    revenueImpactEstimate: `${estimatedImpact}/month in estimated revenue is likely being constrained by this area.`,
    recommendedActions: recommendedActions.slice(0, 3),
    roadmap: generateRoadmap(primaryScore.area, roadmapVariant),
  };
}
