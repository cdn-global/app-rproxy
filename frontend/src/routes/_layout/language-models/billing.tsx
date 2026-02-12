import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import PageScaffold, { PageSection } from "@/components/Common/PageLayout";

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

interface UserUsageSummary {
  user_id: string;
  user_email: string;
  total_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  total_cost: number;
  models_used: string[];
}

function LanguageModelsBillingPage() {
  const [days, setDays] = useState(30);

  const { data: usageData, isLoading } = useQuery<UserUsageSummary>({
    queryKey: ["llm-usage", days],
    queryFn: async () => {
      const baseUrl = window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : `https://${window.location.hostname.replace("-5173", "-8000")}`;

      const response = await fetch(`${baseUrl}/v2/billing/usage/my-usage?days=${days}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch usage data");
      return response.json();
    },
  });

  const billingSummary = useMemo(() => {
    if (!usageData) {
      return {
        totalRequests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        totalCost: 0,
        modelsUsed: [],
      };
    }
    return {
      totalRequests: usageData.total_requests,
      totalInputTokens: usageData.total_input_tokens,
      totalOutputTokens: usageData.total_output_tokens,
      totalTokens: usageData.total_tokens,
      totalCost: usageData.total_cost,
      modelsUsed: usageData.models_used,
    };
  }, [usageData]);

  return (
    <PageScaffold sidebar={null}>
      <div className="space-y-10">
        <PageSection
          id="billing-summary"
          title="Usage & Billing"
          description={`Your LLM usage for the last ${days} days.`}
          actions={
            <div className="flex gap-3">
              <Button variant="outline" asChild className="rounded-full px-4 py-2 text-sm font-semibold">
                <Link to="/language-models">← Back to Models</Link>
              </Button>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
              <Button
                variant="outline"
                onClick={() => setDays(7)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  days === 7
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "border-slate-200/80 bg-white/60 dark:border-slate-700/60 dark:bg-slate-900/60"
                }`}
              >
                7 Days
              </Button>
              <Button
                variant="outline"
                onClick={() => setDays(30)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  days === 30
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "border-slate-200/80 bg-white/60 dark:border-slate-700/60 dark:bg-slate-900/60"
                }`}
              >
                30 Days
              </Button>
              <Button
                variant="outline"
                onClick={() => setDays(90)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  days === 90
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "border-slate-200/80 bg-white/60 dark:border-slate-700/60 dark:bg-slate-900/60"
                }`}
              >
                90 Days
              </Button>
            </div>
          }
        >
        {isLoading ? (
          <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-8 text-center dark:border-slate-700/60 dark:bg-slate-900/70">
            <p className="text-slate-600 dark:text-slate-400">Loading usage data...</p>
          </div>
        ) : (
          <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <SummaryTile
                  label="Total Requests"
                  value={numberFormatter.format(billingSummary.totalRequests)}
                  description="API calls made"
                />
                <SummaryTile
                  label="Input Tokens"
                  value={numberFormatter.format(billingSummary.totalInputTokens)}
                  description="Tokens processed"
                />
                <SummaryTile
                  label="Output Tokens"
                  value={numberFormatter.format(billingSummary.totalOutputTokens)}
                  description="Tokens generated"
                />
                <SummaryTile
                  label="Total Tokens"
                  value={numberFormatter.format(billingSummary.totalTokens)}
                  description="All tokens used"
                />
                <SummaryTile
                  label="Total Cost"
                  value={currencyFormatter.format(billingSummary.totalCost)}
                  description="Billed amount"
                />
              </div>
            </div>
          </div>
        )}
        </PageSection>

        <PageSection
          id="models-used"
          title="Models Used"
          description="Language models you've used during this period."
        >
        {isLoading ? (
          <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-8 text-center dark:border-slate-700/60 dark:bg-slate-900/70">
            <p className="text-slate-600 dark:text-slate-400">Loading models data...</p>
          </div>
        ) : billingSummary.modelsUsed.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200/70 bg-white/95 p-8 text-center dark:border-slate-700/60 dark:bg-slate-900/70">
            <p className="text-slate-600 dark:text-slate-400">
              No models used in the selected time period. Start using LLM models to see usage statistics here.
            </p>
          </div>
        ) : (
          <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
            <div className="p-6">
              <div className="flex flex-wrap gap-3">
                {billingSummary.modelsUsed.map((modelName) => (
                  <div
                    key={modelName}
                    className="rounded-full border border-slate-200/70 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-300"
                  >
                    {modelName}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </PageSection>
      </div>
    </PageScaffold>
  );
}

const SummaryTile = ({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) => (
  <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-[0_18px_40px_-35px_rgba(15,23,42,0.45)] dark:border-slate-700/60 dark:bg-slate-900/60">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
      {label}
    </p>
    <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
  </div>
);

export const Route = createFileRoute("/_layout/language-models/billing")({
  component: LanguageModelsBillingPage,
});
