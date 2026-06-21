export type BottleneckArea =
  | "Acquisition"
  | "Conversion"
  | "Retention"
  | "Ascension"
  | "Capacity";

export type PricingModel = "oneTime" | "recurring";

export type SalesMotion = "salesCall" | "selfServe";

export type BusinessMetrics = {
  salesMotion: SalesMotion;
  pricingModel: PricingModel;
  monthlyLeads: number;
  salesCallsBooked: number;
  salesCallsAttended: number;
  salesPageVisitors: number;
  newClientsAcquired: number;
  averageOfferPrice: number;
  averageClientLifespan: number;
  monthlyRecurringRevenue: number;
  monthlyUpsellRevenue: number;
};

export type MetricIssue = {
  severity: "error" | "warning";
  message: string;
};

export type Kpis = {
  calculatedMonthlyRevenue: number;
  leadToSalesStepRate: number;
  callAttendanceRate: number;
  salesStepToClientRate: number;
  rawLeadToSalesStepRate: number;
  rawCallAttendanceRate: number;
  rawSalesStepToClientRate: number;
  rawUpsellPercent: number;
  clientLtv: number;
  revenuePerLead: number;
  upsellPercent: number;
  estimatedActiveClients: number;
  monthlyRevenuePerNewClient: number;
  salesOpportunities: number;
};

export type ScoreBreakdown = {
  area: BottleneckArea;
  score: number;
  benchmark: number;
  current: number;
  label: string;
  rationale: string;
};

export type OpportunityCost = {
  area: BottleneckArea;
  currentPerformance: string;
  benchmarkPerformance: string;
  monthlyRevenueLeftOnTable: number;
  explanation: string;
};

export type Report = {
  primaryBottleneck: BottleneckArea;
  whySelected: string;
  revenueImpactEstimate: string;
  recommendedActions: string[];
  roadmap: RoadmapPhase[];
};

export type RoadmapPhase = {
  title: string;
  timeframe: string;
  actions: string[];
};

export type GoalBenchmarks = {
  targetMonthlyRevenue: number;
  targetNewClientsPerMonth: number;
  targetLeadsPerMonth: number;
  targetOpportunitiesPerMonth: number;
  targetCloseRate: number;
  targetLifespanMonths: number;
  targetUpsellPercent: number;
  targetAttendanceRate: number;
  expectedRevenuePerLead: number;
};

export type Diagnosis = {
  metrics: BusinessMetrics;
  kpis: Kpis;
  scores: ScoreBreakdown[];
  primaryScore: ScoreBreakdown;
  opportunityCost: OpportunityCost;
  report: Report;
  issues: MetricIssue[];
};
