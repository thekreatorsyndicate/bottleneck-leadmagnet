"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { diagnoseBusiness } from "@/lib/revenue-finder/diagnose";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/revenue-finder/format";
import type {
  BusinessMetrics,
  Diagnosis,
  PricingModel,
  SalesMotion,
} from "@/lib/revenue-finder/types";

type NumericMetricKey = Exclude<
  keyof BusinessMetrics,
  "pricingModel" | "salesMotion"
>;

type MetricField = {
  key: NumericMetricKey;
  label: string;
  prefix?: string;
  suffix?: string;
  placeholder: string;
};

const numericMetricKeys: NumericMetricKey[] = [
  "monthlyLeads",
  "salesCallsBooked",
  "salesCallsAttended",
  "salesPageVisitors",
  "newClientsAcquired",
  "averageOfferPrice",
  "averageClientLifespan",
  "monthlyRecurringRevenue",
  "monthlyUpsellRevenue",
];

function getFields(
  pricingModel: PricingModel,
  salesMotion: SalesMotion,
): MetricField[] {
  const ticketLabel =
    pricingModel === "recurring" ? "Monthly program price" : "Ticket price";
  const acquisitionLabel =
    salesMotion === "salesCall" ? "Monthly leads" : "Monthly leads / subscribers";
  const customerLabel =
    salesMotion === "salesCall" ? "New clients acquired" : "New customers acquired";

  return [
    {
      key: "monthlyLeads",
      label: acquisitionLabel,
      placeholder: "180",
    },
    ...(salesMotion === "salesCall"
      ? [
          {
            key: "salesCallsBooked" as const,
            label: "Sales calls booked",
            placeholder: "42",
          },
          {
            key: "salesCallsAttended" as const,
            label: "Sales calls attended",
            placeholder: "31",
          },
        ]
      : [
          {
            key: "salesPageVisitors" as const,
            label: "Sales page / checkout visitors",
            placeholder: "72",
          },
        ]),
    {
      key: "newClientsAcquired",
      label: customerLabel,
      placeholder: "6",
    },
    {
      key: "averageOfferPrice",
      label: ticketLabel,
      prefix: "$",
      placeholder: "3500",
    },
    {
      key: "averageClientLifespan",
      label: "Average client lifespan",
      suffix: "months",
      placeholder: "4",
    },
    ...(pricingModel === "recurring"
      ? [
          {
            key: "monthlyRecurringRevenue" as const,
            label: "Monthly recurring revenue",
            prefix: "$",
            placeholder: "12000",
          },
        ]
      : []),
    {
      key: "monthlyUpsellRevenue",
      label: "Monthly upsell revenue",
      prefix: "$",
      placeholder: "2500",
    },
  ];
}

const initialValues = numericMetricKeys.reduce(
  (values, field) => ({
    ...values,
    [field]: "",
  }),
  {} as Record<NumericMetricKey, string>,
);

function toMetrics(
  values: Record<NumericMetricKey, string>,
  pricingModel: PricingModel,
  salesMotion: SalesMotion,
): BusinessMetrics {
  return {
    salesMotion,
    pricingModel,
    monthlyLeads: Number.parseFloat(values.monthlyLeads) || 0,
    salesCallsBooked: Number.parseFloat(values.salesCallsBooked) || 0,
    salesCallsAttended: Number.parseFloat(values.salesCallsAttended) || 0,
    salesPageVisitors: Number.parseFloat(values.salesPageVisitors) || 0,
    newClientsAcquired: Number.parseFloat(values.newClientsAcquired) || 0,
    averageOfferPrice: Number.parseFloat(values.averageOfferPrice) || 0,
    averageClientLifespan:
      Number.parseFloat(values.averageClientLifespan) || 0,
    monthlyRecurringRevenue:
      pricingModel === "recurring"
        ? Number.parseFloat(values.monthlyRecurringRevenue) || 0
        : 0,
    monthlyUpsellRevenue: Number.parseFloat(values.monthlyUpsellRevenue) || 0,
  };
}

function getScoreTone(score: number) {
  if (score < 45) return "bg-copper";
  if (score < 75) return "bg-brass";
  return "bg-moss";
}

function AgencyMark({
  className = "",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={`bg-ink ${className}`}>
      <Image
        alt="The Kreator Syndicate"
        className="h-full w-full object-contain"
        height={501}
        priority={priority}
        src="/kreator-syndicate-logo.png"
        width={500}
      />
    </div>
  );
}

function MetricInput({
  field,
  value,
  onChange,
}: {
  field: MetricField;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="group block">
      <span className="mb-2 block text-sm font-bold text-spruce">
        {field.label}
      </span>
      <span className="flex min-h-14 items-center gap-2 border-b border-ink/20 bg-paper/45 px-1 transition group-focus-within:border-copper">
        {field.prefix ? (
          <span className="text-base font-extrabold text-moss">{field.prefix}</span>
        ) : null}
        <input
          className="number-input h-14 w-full bg-transparent text-lg font-extrabold text-ink placeholder:text-ink/25"
          inputMode="decimal"
          min={0}
          name={field.key}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          required
          step="any"
          type="number"
          value={value}
        />
        {field.suffix ? (
          <span className="whitespace-nowrap text-xs font-extrabold uppercase text-moss/70">
            {field.suffix}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function SetupQuestionnaire({
  pricingModel,
  salesMotion,
  onPricingModelChange,
  onSalesMotionChange,
  onComplete,
}: {
  pricingModel: PricingModel;
  salesMotion: SalesMotion;
  onPricingModelChange: (value: PricingModel) => void;
  onSalesMotionChange: (value: SalesMotion) => void;
  onComplete: (goalMrr: string) => void;
}) {
  const [step, setStep] = useState<"salesMotion" | "pricingModel" | "goalMrr">(
    "salesMotion",
  );
  const [localGoalMrr, setLocalGoalMrr] = useState("50000");
  const stepNumber = step === "salesMotion" ? 1 : step === "pricingModel" ? 2 : 3;
  const progress = step === "salesMotion" ? 33 : step === "pricingModel" ? 66 : 100;
  const question =
    step === "salesMotion"
      ? "How do people buy from you?"
      : step === "pricingModel"
        ? "How is the core offer priced?"
        : "What's your monthly revenue goal?";
  const support =
    step === "salesMotion"
      ? "Choose the path that best matches how new revenue usually happens today."
      : step === "pricingModel"
        ? "This lets the diagnostic compare your revenue against the right funnel model."
        : "This helps us back-calculate the leads, conversions, and retention you need to hit your target.";
  const options =
    step === "salesMotion"
      ? [
          {
            label: "Through sales calls",
            value: "salesCall" as const,
            description:
              "Prospects book a call, attend, and become clients after a conversation.",
          },
          {
            label: "Without sales calls",
            value: "selfServe" as const,
            description:
              "People buy from a page, checkout, webinar, email, or automated funnel.",
          },
        ]
      : [
          {
            label: "One-time offer",
            value: "oneTime" as const,
            description:
              "A single payment, pay-in-full program, course, sprint, or package.",
          },
          {
            label: "Monthly program",
            value: "recurring" as const,
            description:
              "A membership, retainer, continuity program, subscription, or recurring offer.",
          },
        ];

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between border-b border-ink/12 pb-5">
        <div className="flex items-center gap-4">
          <AgencyMark
            className="aspect-square w-16 border border-ink/10 sm:w-20"
            priority
          />
          <div>
            <p className="text-sm font-extrabold uppercase text-spruce">
              The Revenue Bottleneck Finder<span aria-hidden="true">™</span>
            </p>
            <p className="mt-1 text-sm font-bold text-moss">
              Diagnostic setup
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-extrabold text-moss">
            {stepNumber}/3
          </p>
          <p className="mt-1 hidden text-xs font-bold text-moss/70 sm:block">
            Setup takes 20 seconds
          </p>
        </div>
      </header>

      <section className="flex flex-1 items-start justify-center pt-10 sm:pt-14 lg:pt-16">
        <div className="w-full max-w-4xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-copper">
              Revenue diagnostic setup
            </p>
            <h1 className="mt-4 font-display text-5xl font-bold leading-[0.96] text-ink sm:text-6xl">
              {question}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base font-bold leading-7 text-moss">
              {support}
            </p>
          </div>

          <div className="mx-auto mt-9 max-w-2xl">
            <div className="mb-6 h-1 bg-ink/10">
            <div
              className="h-full bg-copper transition-all"
                style={{ width: `${progress}%` }}
            />
          </div>

            {step === "goalMrr" ? (
              <div className="mx-auto max-w-sm text-center">
                <div className="flex items-center justify-center border-b border-ink/20">
                  <span className="text-3xl font-extrabold text-moss">$</span>
                  <input
                    className="number-input h-16 w-full bg-transparent text-center text-3xl font-extrabold text-ink placeholder:text-ink/25"
                    inputMode="decimal"
                    min={0}
                    max={999999}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || Number.parseFloat(val) <= 999999) {
                        setLocalGoalMrr(val);
                      }
                    }}
                    placeholder="50000"
                    type="number"
                    value={localGoalMrr}
                    autoFocus
                  />
                </div>
                <p className="mt-3 text-sm font-bold text-ink/50">Your ideal monthly recurring revenue target</p>
                <button
                  className="mt-8 flex min-h-14 w-full items-center justify-center bg-ink px-6 text-base font-extrabold text-paper transition hover:bg-spruce"
                  onClick={() => onComplete(localGoalMrr)}
                  type="button"
                >
                  Continue to inputs
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {options.map((option) => (
                    <button
                      className={`min-h-56 border p-6 text-center transition duration-200 hover:-translate-y-0.5 hover:border-copper hover:bg-paper active:translate-y-0 ${
                        (step === "salesMotion" && salesMotion === option.value) ||
                        (step === "pricingModel" && pricingModel === option.value)
                          ? "border-ink bg-paper shadow-lifted"
                          : "border-ink/12 bg-paper/72"
                      }`}
                      key={option.value}
                      onClick={() => {
                        if (step === "salesMotion") {
                          onSalesMotionChange(option.value as SalesMotion);
                          setStep("pricingModel");
                          return;
                        }

                        onPricingModelChange(option.value as PricingModel);
                        setStep("goalMrr");
                      }}
                      type="button"
                    >
                      <span className="block text-2xl font-extrabold text-ink">
                        {option.label}
                      </span>
                      <span className="mx-auto mt-3 block max-w-xs text-base font-semibold leading-7 text-moss">
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>

                {step === "pricingModel" ? (
                  <button
                    className="mx-auto mt-6 block text-sm font-extrabold text-moss transition hover:text-copper"
                    onClick={() => setStep("salesMotion")}
                    type="button"
                  >
                    Back to sales motion
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function KpiStrip({ diagnosis }: { diagnosis: Diagnosis }) {
  const isSelfServe = diagnosis.metrics.salesMotion === "selfServe";
  const items = [
    {
      label: "Monthly revenue",
      value: formatCurrency(diagnosis.kpis.calculatedMonthlyRevenue),
    },
    {
      label: isSelfServe ? "Lead -> Page" : "Lead -> Call",
      value: formatPercent(diagnosis.kpis.leadToSalesStepRate),
    },
    {
      label: isSelfServe ? "Page -> Buyer" : "Call -> Client",
      value: formatPercent(diagnosis.kpis.salesStepToClientRate),
    },
    {
      label: "Client LTV",
      value: formatCurrency(diagnosis.kpis.clientLtv),
    },
    {
      label: "Revenue / Lead",
      value: formatCurrency(diagnosis.kpis.revenuePerLead),
    },
    {
      label: "Upsell %",
      value: formatPercent(diagnosis.kpis.upsellPercent),
    },
  ];

  return (
    <div className="mx-auto grid max-w-6xl gap-px overflow-hidden border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="bg-paper px-4 py-5 text-center">
          <p className="text-xs font-extrabold uppercase text-moss/75">
            {item.label}
          </p>
          <p className="mt-2 text-xl font-extrabold text-ink">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function ScoreBoard({ diagnosis }: { diagnosis: Diagnosis }) {
  const orderedScores = useMemo(
    () =>
      [...diagnosis.scores].sort((a, b) =>
        a.area.localeCompare(b.area),
      ),
    [diagnosis.scores],
  );

  return (
    <div className="space-y-4">
      {orderedScores.map((score) => (
        <div key={score.area} className="grid gap-3 sm:grid-cols-[130px_1fr_48px] sm:items-center">
          <div>
            <p className="text-sm font-extrabold text-ink">{score.area}</p>
            <p className="text-xs font-bold text-moss/70">{score.label}</p>
          </div>
          <div className="h-3 overflow-hidden bg-ink/10">
            <div
              className={`h-full ${getScoreTone(score.score)}`}
              style={{ width: `${score.score}%` }}
            />
          </div>
          <p className="text-left text-sm font-extrabold text-ink sm:text-right">
            {score.score}
          </p>
        </div>
      ))}
    </div>
  );
}

function ResultsPanel({ diagnosis }: { diagnosis: Diagnosis }) {
  return (
    <section className="space-y-10 report-fade-in" aria-live="polite">
      <div className="mx-auto max-w-6xl border border-ink/15 bg-ink text-paper shadow-lifted">
        <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
          <div className="p-6 text-center sm:p-8 lg:text-left">
            <p className="text-xs font-extrabold uppercase text-paper/65">
              Primary bottleneck
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold leading-[0.98] sm:text-6xl">
              {diagnosis.report.primaryBottleneck}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-paper/82 lg:mx-0">
              {diagnosis.report.whySelected}
            </p>
            <div className="mt-7 border-t border-paper/18 pt-6">
              <p className="text-sm font-bold text-paper/65">Estimated monthly opportunity</p>
              <p className="mt-2 text-4xl font-extrabold leading-tight text-paper sm:text-5xl">
                {formatCurrency(diagnosis.opportunityCost.monthlyRevenueLeftOnTable)}
              </p>
              <p className="mt-3 text-sm leading-6 text-paper/72">
                {diagnosis.opportunityCost.explanation}
              </p>
            </div>
          </div>
          <div className="border-t border-paper/12 p-6 text-center lg:border-l lg:border-t-0 lg:text-left">
            <p className="text-xs font-extrabold uppercase text-paper/55">
              Diagnosis prepared by
            </p>
            <AgencyMark className="mx-auto mt-5 aspect-square w-36 border border-paper/12 sm:w-44 lg:mx-0" />
            <p className="mt-5 text-sm font-bold leading-6 text-paper/68">
              The Kreator Syndicate turns creator expertise into sharper funnels,
              cleaner offers, and measurable revenue systems.
            </p>
          </div>
        </div>
      </div>

      <section className="text-center">
        <h3 className="text-3xl font-extrabold text-ink">Your KPI dashboard</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm font-bold leading-6 text-moss">
          The fastest read on where revenue is created, delayed, and lost.
        </p>
        <div className="mt-6">
          <KpiStrip diagnosis={diagnosis} />
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="border border-ink/12 bg-paper/82 p-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase text-copper">
                Scoring
              </p>
              <h3 className="mt-2 text-2xl font-extrabold text-ink">Bottleneck map</h3>
            </div>
            <p className="text-sm font-bold text-moss">0-100</p>
          </div>
          <ScoreBoard diagnosis={diagnosis} />
        </section>

        <section className="border border-ink/12 bg-paper/82 p-6">
          <p className="text-xs font-extrabold uppercase text-copper">
            Benchmark gap
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="border-l-4 border-ink/20 pl-4">
              <p className="text-sm font-bold text-moss">Current performance</p>
              <p className="mt-1 text-xl font-extrabold text-ink">
                {diagnosis.opportunityCost.currentPerformance}
              </p>
            </div>
            <div className="border-l-4 border-copper pl-4">
              <p className="text-sm font-bold text-moss">Benchmark performance</p>
              <p className="mt-1 text-xl font-extrabold text-ink">
                {diagnosis.opportunityCost.benchmarkPerformance}
              </p>
            </div>
          </div>
          <p className="mt-6 text-base leading-7 text-ink/72">
            {diagnosis.report.revenueImpactEstimate}
          </p>
        </section>
      </div>

      <section className="mx-auto max-w-6xl border-y border-ink/15 py-8">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="text-xs font-extrabold uppercase text-copper">
              Next best moves
            </p>
            <h3 className="mt-2 font-display text-4xl font-bold leading-tight text-ink">
              Focus here before adding more complexity.
            </h3>
          </div>
          <ol className="grid gap-3">
            {diagnosis.report.recommendedActions.map((action, index) => (
              <li
                className="grid grid-cols-[40px_1fr] items-start gap-4 bg-limewash/45 p-4"
                key={action}
              >
                <span className="flex size-10 items-center justify-center bg-ink text-sm font-extrabold text-paper">
                  {index + 1}
                </span>
                <span className="pt-1 text-base font-bold leading-7 text-ink">
                  {action}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase text-copper">
              30-day roadmap
            </p>
            <h3 className="mt-2 text-3xl font-extrabold text-ink">
              {diagnosis.report.primaryBottleneck} repair plan
            </h3>
          </div>
          <p className="max-w-sm text-sm font-bold leading-6 text-moss">
            Built from the lowest scoring area, not a generic growth checklist.
          </p>
        </div>
        <div className="grid gap-px overflow-hidden border border-ink/10 bg-ink/10 lg:grid-cols-3">
          {diagnosis.report.roadmap.map((phase) => (
            <article key={phase.title} className="bg-paper p-5">
              <p className="text-xs font-extrabold uppercase text-copper">
                {phase.timeframe}
              </p>
              <h4 className="mt-3 text-xl font-extrabold text-ink">{phase.title}</h4>
              <ul className="mt-4 space-y-3">
                {phase.actions.map((action) => (
                  <li className="text-sm font-semibold leading-6 text-ink/74" key={action}>
                    {action}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <footer className="mx-auto grid max-w-6xl gap-4 border-t border-ink/15 pt-6 sm:grid-cols-[220px_1fr] sm:items-center">
        <AgencyMark className="aspect-square w-28 border border-ink/10 sm:w-32" />
        <p className="text-sm font-bold leading-6 text-moss sm:text-right">
          Revenue Bottleneck Finder by The Kreator Syndicate.
        </p>
      </footer>
    </section>
  );
}

export function RevenueBottleneckFinder() {
  const [salesMotion, setSalesMotion] =
    useState<SalesMotion>("salesCall");
  const [pricingModel, setPricingModel] =
    useState<PricingModel>("oneTime");
  const [values, setValues] =
    useState<Record<NumericMetricKey, string>>(initialValues);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [goalMrr, setGoalMrr] = useState("50000");

  const activeFields = useMemo(
    () => getFields(pricingModel, salesMotion),
    [pricingModel, salesMotion],
  );
  const completedFields = activeFields.filter(
    (field) => values[field.key] !== "",
  ).length;
  const completion = Math.round((completedFields / activeFields.length) * 100);
  const previewMetrics = toMetrics(values, pricingModel, salesMotion);
  const previewMonthlyRevenue =
    previewMetrics.averageOfferPrice * previewMetrics.newClientsAcquired +
    previewMetrics.monthlyRecurringRevenue +
    previewMetrics.monthlyUpsellRevenue;
  const inputCountCopy = salesMotion === "salesCall" ? "seven or eight" : "six or seven";
  const revenueFormulaCopy =
    pricingModel === "recurring"
      ? "Calculated monthly revenue uses monthly program price x new clients + recurring revenue + upsell revenue."
      : "Calculated monthly revenue uses ticket price x new clients + upsell revenue.";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setDiagnosis(diagnoseBusiness(toMetrics(values, pricingModel, salesMotion), Number.parseFloat(goalMrr) || 50000));
    window.requestAnimationFrame(() => {
      document.getElementById("report")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  if (!setupComplete) {
    return (
      <SetupQuestionnaire
        onComplete={(value) => {
          setGoalMrr(value);
          setDiagnosis(null);
          setSubmitted(false);
          setSetupComplete(true);
        }}
        onPricingModelChange={setPricingModel}
        onSalesMotionChange={setSalesMotion}
        pricingModel={pricingModel}
        salesMotion={salesMotion}
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col px-4 py-5 page-fade-in sm:px-6 lg:px-8">
        <style jsx>{`
          .topbar-bg {
            background: rgba(247, 243, 234, 0.88);
          }
        `}</style>
        <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-ink/12 topbar-bg pb-5 pt-1 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <AgencyMark
            className="aspect-square w-20 border border-ink/10 sm:w-24"
            priority
          />
          <div>
            <p className="text-sm font-extrabold uppercase text-spruce">
              The Revenue Bottleneck Finder<span aria-hidden="true">™</span>
            </p>
            <p className="mt-1 text-sm font-bold text-moss">
              By The Kreator Syndicate
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <p className="text-sm font-bold text-moss">A 5-minute revenue diagnosis</p>
          <button
            className="border border-copper/45 bg-paper/70 px-4 py-3 text-left transition hover:border-copper hover:bg-limewash/40 sm:text-right"
            onClick={() => {
              setDiagnosis(null);
              setSubmitted(false);
              setSetupComplete(false);
            }}
            type="button"
          >
            <span className="block text-xs font-extrabold uppercase text-copper">
              Change business type
            </span>
            <span className="mt-1 block text-sm font-extrabold text-spruce">
              {salesMotion === "salesCall" ? "Sales calls" : "No sales calls"} /{" "}
              {pricingModel === "recurring" ? "Monthly program" : "One-time offer"}
            </span>
          </button>
        </div>
      </header>

      <section className="flex flex-1 flex-col items-center gap-8 py-8 lg:py-12">
        <div className="w-full max-w-4xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-copper">
            For coaches, consultants, and course creators
          </p>
          <h1 className="mx-auto mt-4 max-w-4xl font-display text-5xl font-bold leading-[0.95] text-ink sm:text-6xl lg:text-7xl">
            Find the revenue leak hiding in plain sight.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-ink/72">
            Enter {inputCountCopy} current numbers. Get KPIs, a bottleneck diagnosis,
            revenue impact, and a focused 30-day plan.
          </p>
          <div className="mx-auto mt-7 max-w-2xl border border-ink/12 bg-paper/72 p-5">
            <p className="text-sm font-extrabold uppercase text-ink">
              A Kreator Syndicate diagnostic
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm font-bold leading-6 text-moss">
              Built for expert-led businesses deciding what to fix before spending
              more on traffic, team, or tooling.
            </p>
          </div>
        </div>

        <div className="grid w-full max-w-3xl gap-4 border-y border-ink/12 py-5 text-center sm:grid-cols-3">
          <div>
            <p className="text-3xl font-extrabold text-ink">{completion}%</p>
            <p className="mt-1 text-sm font-bold text-moss">Inputs complete</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-ink">6</p>
            <p className="mt-1 text-sm font-bold text-moss">KPIs calculated</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-ink">30</p>
            <p className="mt-1 text-sm font-bold text-moss">Day roadmap</p>
          </div>
        </div>

        <form
          className="w-full max-w-4xl border border-ink/15 bg-paper/88 p-5 shadow-lifted sm:p-7"
          onSubmit={handleSubmit}
        >
          <div className="mb-6 text-center">
            <p className="text-xs font-extrabold uppercase text-copper">
              Diagnostic inputs
            </p>
            <h2 className="mt-2 text-3xl font-extrabold text-ink">
              Your current funnel
            </h2>
            <p className="mt-2 text-sm font-bold text-moss">Estimates are fine.</p>
          </div>

          <div className="mb-6 grid gap-3 border border-ink/10 bg-paper/60 p-4 text-center sm:grid-cols-[1fr_auto] sm:items-center sm:text-left">
            <p className="text-sm font-bold leading-6 text-moss">
              {revenueFormulaCopy}
            </p>
            <p className="text-2xl font-extrabold text-ink">
              {formatCurrency(previewMonthlyRevenue)}
            </p>
          </div>

          <div className="mb-6 grid gap-3 border border-dashed border-ink/15 bg-limewash/20 p-4 text-center sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4 sm:text-left">
            <p className="text-sm font-bold leading-6 text-moss">
              Benchmarks are back-calculated from your monthly revenue goal
            </p>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-moss">$</span>
              <input
                className="number-input h-10 w-28 border border-ink/15 bg-paper px-2 text-center text-lg font-extrabold text-ink"
                inputMode="decimal"
                min={0}
                max={999999}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || Number.parseFloat(val) <= 999999) {
                    setGoalMrr(val);
                  }
                }}
                type="number"
                value={goalMrr}
              />
              <span className="text-xs font-bold text-moss/70">/mo</span>
            </div>
            <p className="text-xs font-bold text-ink/40">Adjustable</p>
          </div>

          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {activeFields.map((field) => (
              <MetricInput
                field={field}
                key={field.key}
                onChange={(value) =>
                  setValues((current) => ({ ...current, [field.key]: value }))
                }
                value={values[field.key]}
              />
            ))}
          </div>

          <button
            className="mt-8 flex min-h-14 w-full items-center justify-center bg-ink px-6 text-base font-extrabold text-paper transition hover:bg-spruce"
            type="submit"
          >
            Generate my bottleneck report
          </button>

          {submitted ? (
            <p className="mt-4 text-sm font-bold text-moss">
              Report generated from {formatNumber(completedFields)} entered metrics.
            </p>
          ) : null}
        </form>
      </section>

      <section id="report" className="pb-12">
        {diagnosis ? (
          <ResultsPanel diagnosis={diagnosis} />
        ) : (
          <div className="border border-dashed border-ink/25 px-5 py-8 text-center">
            <p className="text-sm font-extrabold uppercase text-copper">
              Your report will appear here
            </p>
            <p className="mx-auto mt-3 max-w-xl text-base font-semibold leading-7 text-moss">
              The engine compares acquisition, conversion, retention, ascension,
              and capacity, then returns the lowest scoring area as the primary
              bottleneck.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
