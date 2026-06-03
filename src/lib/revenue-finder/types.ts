export type BottleneckArea =
  | "Acquisition"
  | "Conversion"
  | "Retention"
  | "Ascension"
  | "Capacity";

export type PricingModel = "oneTime" | "recurring";

export type BusinessMetrics = {
  pricingModel: PricingModel;
  monthlyLeads: number;
  salesCallsBooked: number;
  salesCallsAttended: number;
  newClientsAcquired: number;
  averageOfferPrice: number;
  averageClientLifespan: number;
  monthlyRecurringRevenue: number;
  monthlyUpsellRevenue: number;
};

export type Kpis = {
  calculatedMonthlyRevenue: number;
  leadToCallRate: number;
  callAttendanceRate: number;
  callToClientRate: number;
  clientLtv: number;
  revenuePerLead: number;
  upsellPercent: number;
  estimatedActiveClients: number;
  monthlyRevenuePerNewClient: number;
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

export type Diagnosis = {
  metrics: BusinessMetrics;
  kpis: Kpis;
  scores: ScoreBreakdown[];
  primaryScore: ScoreBreakdown;
  opportunityCost: OpportunityCost;
  report: Report;
};
