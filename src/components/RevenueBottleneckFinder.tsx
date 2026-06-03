"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { diagnoseBusiness } from "@/lib/revenue-finder/diagnose";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/revenue-finder/format";
import type {
  BusinessMetrics,
  Diagnosis,
  PricingModel,
} from "@/lib/revenue-finder/types";

type NumericMetricKey = Exclude<keyof BusinessMetrics, "pricingModel">;

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
  "newClientsAcquired",
  "averageOfferPrice",
  "averageClientLifespan",
  "monthlyRecurringRevenue",
  "monthlyUpsellRevenue",
];

function getFields(pricingModel: PricingModel): MetricField[] {
  const ticketLabel =
    pricingModel === "recurring" ? "Monthly program price" : "Ticket price";

  return [
    {
      key: "monthlyLeads",
      label: "Monthly leads",
      placeholder: "180",
    },
    {
      key: "salesCallsBooked",
      label: "Sales calls booked",
      placeholder: "42",
    },
    {
      key: "salesCallsAttended",
      label: "Sales calls attended",
      placeholder: "31",
    },
    {
      key: "newClientsAcquired",
      label: "New clients acquired",
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
): BusinessMetrics {
  return {
    pricingModel,
    monthlyLeads: Number.parseFloat(values.monthlyLeads) || 0,
    salesCallsBooked: Number.parseFloat(values.salesCallsBooked) || 0,
    salesCallsAttended: Number.parseFloat(values.salesCallsAttended) || 0,
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

function PricingModelToggle({
  value,
  onChange,
}: {
  value: PricingModel;
  onChange: (value: PricingModel) => void;
}) {
  return (
    <div className="border border-ink/12 bg-limewash/35 p-1">
      <div className="grid grid-cols-2 gap-1">
        {[
          { label: "One-time offer", value: "oneTime" as const },
          { label: "Monthly program", value: "recurring" as const },
        ].map((option) => {
          const isSelected = value === option.value;

          return (
            <button
              aria-pressed={isSelected}
              className={`min-h-12 px-3 text-sm font-extrabold transition ${
                isSelected
                  ? "bg-ink text-paper"
                  : "bg-transparent text-spruce hover:bg-paper/70"
              }`}
              key={option.value}
              onClick={() => onChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function KpiStrip({ diagnosis }: { diagnosis: Diagnosis }) {
  const items = [
    {
      label: "Monthly revenue",
      value: formatCurrency(diagnosis.kpis.calculatedMonthlyRevenue),
    },
    {
      label: "Lead -> Call",
      value: formatPercent(diagnosis.kpis.leadToCallRate),
    },
    {
      label: "Call -> Client",
      value: formatPercent(diagnosis.kpis.callToClientRate),
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
    <div className="grid gap-px overflow-hidden border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="bg-paper px-4 py-4">
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
    <section className="space-y-8" aria-live="polite">
      <div className="border border-ink/15 bg-ink text-paper shadow-lifted">
        <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
          <div className="p-6 sm:p-8">
            <p className="text-xs font-extrabold uppercase text-paper/65">
              Primary bottleneck
            </p>
            <h2 className="mt-3 font-display text-5xl font-bold leading-none sm:text-6xl">
              {diagnosis.report.primaryBottleneck}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-paper/82">
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
          <div className="border-t border-paper/12 p-6 lg:border-l lg:border-t-0">
            <p className="text-xs font-extrabold uppercase text-paper/55">
              Diagnosis prepared by
            </p>
            <AgencyMark className="mt-5 aspect-square w-36 border border-paper/12 sm:w-44" />
            <p className="mt-5 text-sm font-bold leading-6 text-paper/68">
              The Kreator Syndicate turns creator expertise into sharper funnels,
              cleaner offers, and measurable revenue systems.
            </p>
          </div>
        </div>
      </div>

      <KpiStrip diagnosis={diagnosis} />

      <div className="grid gap-7 lg:grid-cols-[0.9fr_1.1fr]">
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

      <section className="border-y border-ink/15 py-8">
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

      <section className="space-y-5">
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

      <footer className="grid gap-4 border-t border-ink/15 pt-6 sm:grid-cols-[220px_1fr] sm:items-center">
        <AgencyMark className="aspect-square w-28 border border-ink/10 sm:w-32" />
        <p className="text-sm font-bold leading-6 text-moss sm:text-right">
          Revenue Bottleneck Finder by The Kreator Syndicate.
        </p>
      </footer>
    </section>
  );
}

export function RevenueBottleneckFinder() {
  const [pricingModel, setPricingModel] =
    useState<PricingModel>("oneTime");
  const [values, setValues] =
    useState<Record<NumericMetricKey, string>>(initialValues);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const activeFields = useMemo(
    () => getFields(pricingModel),
    [pricingModel],
  );
  const completedFields = activeFields.filter(
    (field) => values[field.key] !== "",
  ).length;
  const completion = Math.round((completedFields / activeFields.length) * 100);
  const previewMetrics = toMetrics(values, pricingModel);
  const previewMonthlyRevenue =
    previewMetrics.averageOfferPrice * previewMetrics.newClientsAcquired +
    previewMetrics.monthlyRecurringRevenue +
    previewMetrics.monthlyUpsellRevenue;
  const revenueFormulaCopy =
    pricingModel === "recurring"
      ? "Calculated monthly revenue uses monthly program price x new clients + recurring revenue + upsell revenue."
      : "Calculated monthly revenue uses ticket price x new clients + upsell revenue.";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setDiagnosis(diagnoseBusiness(toMetrics(values, pricingModel)));
    window.requestAnimationFrame(() => {
      document.getElementById("report")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-ink/12 pb-5 sm:flex-row sm:items-center sm:justify-between">
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
        <p className="text-sm font-bold text-moss">A 5-minute revenue diagnosis</p>
      </header>

      <section className="grid flex-1 gap-8 py-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:py-12">
        <div className="flex flex-col justify-between gap-8">
          <div>
            <p className="text-xs font-extrabold uppercase text-copper">
              For coaches, consultants, and course creators
            </p>
            <h1 className="mt-4 font-display text-6xl font-bold leading-[0.9] text-ink sm:text-7xl lg:text-8xl">
              Find the revenue leak hiding in plain sight.
            </h1>
            <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-ink/72">
              Enter seven or eight current numbers and get a personalized bottleneck report:
              KPIs, benchmark gap, revenue impact, and a focused 30-day roadmap.
            </p>
            <div className="mt-7 max-w-xl border-l-4 border-ink bg-paper/70 p-5">
              <p className="text-sm font-extrabold uppercase text-ink">
                A Kreator Syndicate diagnostic
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-moss">
                Built for expert-led businesses that need to know exactly which
                part of the funnel deserves the next hour, dollar, or hire.
              </p>
            </div>
          </div>

          <div className="grid gap-4 border-y border-ink/12 py-5 sm:grid-cols-3">
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
        </div>

        <form
          className="border border-ink/15 bg-paper/88 p-5 shadow-lifted sm:p-7"
          onSubmit={handleSubmit}
        >
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase text-copper">
                Diagnostic inputs
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-ink">
                Your current funnel
              </h2>
            </div>
            <p className="text-sm font-bold text-moss">Estimates are fine.</p>
          </div>

          <div className="mb-6 space-y-3">
            <PricingModelToggle
              onChange={(value) => {
                setPricingModel(value);
                setDiagnosis(null);
                setSubmitted(false);
              }}
              value={pricingModel}
            />
            <div className="grid gap-3 border border-ink/10 bg-paper/60 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <p className="text-sm font-bold leading-6 text-moss">
                {revenueFormulaCopy}
              </p>
              <p className="text-2xl font-extrabold text-ink">
                {formatCurrency(previewMonthlyRevenue)}
              </p>
            </div>
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
