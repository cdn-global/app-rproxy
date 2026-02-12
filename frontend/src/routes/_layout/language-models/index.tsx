
import { useMemo, useState } from "react";
import { Link as RouterLink, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FiArrowUpRight } from "react-icons/fi";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageScaffold, { PageSection } from "../../../components/Common/PageLayout";

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

interface InferenceModel {
  id: string;
  name: string;
  provider?: string;
  provider_id?: string;
  model_id: string;
  display_name?: string;
  capabilities?: string[];
  pricing_per_1k_tokens?: number;
  input_token_price?: number;
  output_token_price?: number;
  max_tokens: number;
  is_active: boolean;
}

function LanguageModelsIndexPage() {
  const [showInactive, setShowInactive] = useState(false);

  const { data, isLoading } = useQuery<{ data: InferenceModel[]; count: number }>({
    queryKey: ["inference-models"],
    queryFn: async () => {
      // Get base URL from window location or OpenAPI config
      const baseUrl = window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : `https://${window.location.hostname.replace("-5173", "-8000")}`;

      // Always fetch all models - backend will compute is_active based on API keys
      const url = `${baseUrl}/v2/llm-models/`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch models");
      return response.json();
    },
  });

  const allModels = data?.data ?? [];

  // Filter models based on showInactive toggle
  const models = useMemo(() => {
    if (showInactive) {
      return allModels;
    }
    return allModels.filter(m => m.is_active);
  }, [allModels, showInactive]);

  const fleetSummary = useMemo(() => {
    if (allModels.length === 0) {
      return { totalModels: 0, activeModels: 0, avgPricePer1k: 0, maxContext: 0, providers: 0 };
    }
    const activeModels = allModels.filter(m => m.is_active);
    const providers = new Set(allModels.map((m) => m.provider).filter(Boolean));
    const avgPrice = activeModels.length > 0
      ? activeModels.reduce((a, m) => a + (m.pricing_per_1k_tokens || m.input_token_price || 0), 0) / activeModels.length
      : 0;
    return {
      totalModels: allModels.length,
      activeModels: activeModels.length,
      avgPricePer1k: avgPrice,
      maxContext: Math.max(...allModels.map((m) => m.max_tokens)),
      providers: providers.size,
    };
  }, [allModels]);

  return (
    <PageScaffold sidebar={null}>
    <div className="space-y-10">
      <div className="space-y-8">
        <PageSection
          id="fleet"
          title="Fleet intelligence"
          description="Active models are those with configured API keys. Configure your keys in profile settings."
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowInactive(!showInactive)}
                className="gap-2 rounded-full border-slate-200/80 bg-white/60 px-5 py-2 text-sm font-semibold shadow-sm transition hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
              >
                {showInactive ? "Show Active Only" : "Show All Models"}
              </Button>
              <Button
                asChild
                variant="outline"
                className="gap-2 rounded-full border-slate-200/80 bg-white/60 px-5 py-2 text-sm font-semibold shadow-sm transition hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
              >
                <RouterLink to="api">
                  <span>API Docs</span>
                  <FiArrowUpRight className="h-4 w-4" />
                </RouterLink>
              </Button>
              <Button
                asChild
                variant="outline"
                className="gap-2 rounded-full border-slate-200/80 bg-white/60 px-5 py-2 text-sm font-semibold shadow-sm transition hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
              >
                <RouterLink to="billing">
                  <span>Billing</span>
                  <FiArrowUpRight className="h-4 w-4" />
                </RouterLink>
              </Button>
            </div>
          }
        >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryTile
                label="Active models"
                value={numberFormatter.format(fleetSummary.activeModels)}
                description={`${fleetSummary.totalModels} total models`}
              />
              <SummaryTile
                label="Providers"
                value={numberFormatter.format(fleetSummary.providers)}
                description="OpenAI, Anthropic, HuggingFace"
              />
              <SummaryTile
                label="Avg price / 1K tokens"
                value={currencyFormatter.format(fleetSummary.avgPricePer1k)}
                description="Across all models"
              />
              <SummaryTile
                label="Max context"
                value={`${numberFormatter.format(fleetSummary.maxContext / 1000)}K`}
                description="Largest context window"
              />
            </div>
        </PageSection>

        <PageSection
          id="models"
          title="AI Models"
          description="Pricing will be slightly upcharged for geo location and other support"
        >
        <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
          <div className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                  <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                    <TableHead>Model</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Capabilities</TableHead>
                    <TableHead>Price / 1K tokens</TableHead>
                    <TableHead>Max Tokens</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : models.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No models available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    models.map((model) => (
                      <TableRow
                        key={model.id}
                        className="border-slate-200/70 transition-colors hover:bg-slate-100/60 dark:border-slate-700/60 dark:hover:bg-slate-800/50"
                      >
                        <TableCell className="align-top font-medium text-slate-900 dark:text-slate-50">
                          {model.display_name || model.name}
                        </TableCell>
                        <TableCell className="capitalize">{model.provider || "Anthropic"}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              model.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {model.is_active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {model.capabilities && model.capabilities.length > 0 ? (
                              model.capabilities.map((cap) => (
                                <span
                                  key={cap}
                                  className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                >
                                  {cap}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">Text generation</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {currencyFormatter.format(
                            (model.pricing_per_1k_tokens || model.input_token_price || 0) / 1000
                          )}
                        </TableCell>
                        <TableCell>{numberFormatter.format(model.max_tokens)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full border-slate-300/80 px-3 py-1 text-xs font-semibold hover:border-slate-400"
                            asChild
                            disabled={!model.is_active}
                          >
                            <RouterLink to="/language-models/llm-service" search={{ modelId: model.id }}>
                              Try Now
                            </RouterLink>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        </PageSection>
      </div>
            <div className="mt-10 border-t border-slate-200/60 pt-10 dark:border-slate-800">
              <div className="mb-6 space-y-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Jump to
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Quick links to page sections.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <RouterLink
                  to="/"
                  className="group flex flex-col justify-between space-y-2 rounded-xl border border-slate-200/60 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Workspace
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Subscriptions, average usage, and quick billing actions.
                    </div>
                  </div>
                </RouterLink>

                <a
                  href="#analytics"
                  className="group flex flex-col justify-between space-y-2 rounded-xl border border-slate-200/60 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Usage insights
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Traffic, spend, and throughput metrics.
                    </div>
                  </div>
                </a>

                <RouterLink
                  to="/"
                  className="group flex flex-col justify-between space-y-2 rounded-xl border border-slate-200/60 bg-white/50 p-4 transition-all hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Tool directory
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Explore every workspace module in one place.
                    </div>
                  </div>
                </RouterLink>
              </div>
            </div>
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

export const Route = createFileRoute("/_layout/language-models/")({
  component: LanguageModelsIndexPage,
});
