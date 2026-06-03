import type { BottleneckArea, RoadmapPhase } from "./types";

const roadmaps: Record<BottleneckArea, RoadmapPhase[]> = {
  Acquisition: [
    {
      title: "Clarify demand",
      timeframe: "Days 1-7",
      actions: [
        "Pick one high-intent audience segment and one expensive problem.",
        "Rewrite the lead magnet promise around a measurable business outcome.",
      ],
    },
    {
      title: "Install a weekly lead rhythm",
      timeframe: "Weeks 2-3",
      actions: [
        "Publish three conversion-focused posts or emails per week.",
        "Add one partner, podcast, or workshop channel to create non-organic lead flow.",
      ],
    },
    {
      title: "Tighten capture",
      timeframe: "Week 4",
      actions: [
        "Create a single opt-in path with a call-to-action tied to diagnosis results.",
      ],
    },
  ],
  Conversion: [
    {
      title: "Fix the decision path",
      timeframe: "Days 1-7",
      actions: [
        "Define the top three objections that appear before, during, and after calls.",
        "Add proof and expectation-setting before the booking page.",
      ],
    },
    {
      title: "Upgrade the sales call",
      timeframe: "Weeks 2-3",
      actions: [
        "Use a call scorecard with problem cost, urgency, authority, and fit.",
        "End every qualified call with one clear recommendation and one next step.",
      ],
    },
    {
      title: "Recover near misses",
      timeframe: "Week 4",
      actions: [
        "Create a seven-day follow-up sequence for no-shows, maybes, and delayed decisions.",
      ],
    },
  ],
  Retention: [
    {
      title: "Map early value",
      timeframe: "Days 1-7",
      actions: [
        "Identify the first visible win clients should reach within 14 days.",
        "Create a simple onboarding checklist around that milestone.",
      ],
    },
    {
      title: "Reduce drift",
      timeframe: "Weeks 2-3",
      actions: [
        "Add client health checks at the halfway point of the engagement.",
        "Document the two moments where clients most often stall and add intervention prompts.",
      ],
    },
    {
      title: "Create continuity",
      timeframe: "Week 4",
      actions: [
        "Design a continuation option that naturally follows the first outcome.",
      ],
    },
  ],
  Ascension: [
    {
      title: "Find the next problem",
      timeframe: "Days 1-7",
      actions: [
        "List the problems clients face after they get the first promised result.",
        "Choose one ascension offer that is easier to buy than a brand-new offer.",
      ],
    },
    {
      title: "Place the invitation",
      timeframe: "Weeks 2-3",
      actions: [
        "Add ascension checkpoints at delivery milestones, not only at the end.",
        "Create a client-only audit, upgrade, or implementation sprint.",
      ],
    },
    {
      title: "Measure expansion",
      timeframe: "Week 4",
      actions: [
        "Track upsell revenue by client segment so the strongest path becomes obvious.",
      ],
    },
  ],
  Capacity: [
    {
      title: "Protect the calendar",
      timeframe: "Days 1-7",
      actions: [
        "Add confirmation, reminder, and reschedule flows for every booked call.",
        "Remove low-intent calendar links from broad audience touchpoints.",
      ],
    },
    {
      title: "Qualify before calls",
      timeframe: "Weeks 2-3",
      actions: [
        "Add a short application question set that filters urgency, budget, and fit.",
        "Route weak-fit prospects to an automated nurture path.",
      ],
    },
    {
      title: "Create operating slack",
      timeframe: "Week 4",
      actions: [
        "Batch sales calls into two dedicated blocks and reserve delivery time before adding more lead volume.",
      ],
    },
  ],
};

export function generateRoadmap(area: BottleneckArea) {
  return roadmaps[area];
}
