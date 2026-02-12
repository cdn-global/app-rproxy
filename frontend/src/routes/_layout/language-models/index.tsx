import { useMemo, useState } from "react";
import { Link as RouterLink, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FiSearch, FiSettings, FiCpu, FiZap, FiDollarSign, FiKey, FiBarChart2 } from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiBaseUrl, safeJson } from "@/lib/utils";
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
  maximumFractionDigits: 6,
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

interface SourceUsage {
  source: string;
  total_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  total_cost: number;
}

interface UsageSummary {
  total_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  total_cost: number;
  models_used: string[];
  by_source: SourceUsage[];
}

function LanguageModelsIndexPage() {
  const [showInactive, setShowInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: usageData } = useQuery<UsageSummary>({
    queryKey: ["llm-usage-summary"],
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/v2/billing/usage/my-usage?days=30`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch usage");
      return safeJson(response, {
        total_requests: 0, total_input_tokens: 0, total_output_tokens: 0,
        total_tokens: 0, total_cost: 0, models_used: [], by_source: [],
      });
    },
  });

  const { data, isLoading } = useQuery<{ data: InferenceModel[]; count: number }>({
    queryKey: ["inference-models"],
    queryFn: async () => {
      const response = await fetch(`${getApiBaseUrl()}/v2/llm-models/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch models");
      return safeJson(response, { data: [], count: 0 });
    },
  });

  const allModels = data?.data ?? [];

  // Filter models based on showInactive toggle and search
  const models = useMemo(() => {
    let filtered = allModels;

    if (!showInactive) {
      filtered = filtered.filter(m => m.is_active);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        (m.display_name || m.name).toLowerCase().includes(query) ||
        (m.provider || "").toLowerCase().includes(query) ||
        (m.model_id || "").toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allModels, showInactive, searchQuery]);

  const fleetSummary = useMemo(() => {
    if (allModels.length === 0) {
      return { totalModels: 0, activeModels: 0, avgInputPrice: 0, avgOutputPrice: 0, maxContext: 0, providers: [] };
    }
    const activeModels = allModels.filter(m => m.is_active);
    const providers = Array.from(new Set(allModels.map((m) => m.provider || "Anthropic").filter(Boolean)));

    const avgInputPrice = activeModels.length > 0
      ? activeModels.reduce((a, m) => a + (m.input_token_price || 0), 0) / activeModels.length
      : 0;

    const avgOutputPrice = activeModels.length > 0
      ? activeModels.reduce((a, m) => a + (m.output_token_price || 0), 0) / activeModels.length
      : 0;

    return {
      totalModels: allModels.length,
      activeModels: activeModels.length,
      avgInputPrice,
      avgOutputPrice,
      maxContext: Math.max(...allModels.map((m) => m.max_tokens)),
      providers,
    };
  }, [allModels]);

  return (
    <PageScaffold sidebar={null}>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Language Models
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Access leading AI models from multiple providers with transparent pricing and unified API.
          </p>
        </div>

        {/* Overview Cards */}
        <PageSection
          id="overview"
          title="Model Overview"
          description="Configure provider API keys in profile settings to activate models."
          actions={
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2 rounded-full"
              >
                <RouterLink to="/language-models/keys">
                  <FiKey className="h-4 w-4" />
                  <span>REST API Keys</span>
                </RouterLink>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2 rounded-full"
              >
                <RouterLink to="/profile">
                  <FiSettings className="h-4 w-4" />
                  <span>Provider Keys</span>
                </RouterLink>
              </Button>
            </div>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={FiCpu}
              label="Active Models"
              value={numberFormatter.format(fleetSummary.activeModels)}
              description={`${fleetSummary.totalModels} total available`}
              variant="primary"
            />
            <StatCard
              icon={FiZap}
              label="Providers"
              value={numberFormatter.format(fleetSummary.providers.length)}
              description={fleetSummary.providers.slice(0, 2).join(", ")}
              variant="default"
            />
            <StatCard
              icon={FiDollarSign}
              label="Avg Input Price"
              value={`$${(fleetSummary.avgInputPrice).toFixed(2)}`}
              description="Per million tokens"
              variant="default"
            />
            <StatCard
              icon={FiCpu}
              label="Max Context"
              value={`${numberFormatter.format(Math.floor(fleetSummary.maxContext / 1000))}K`}
              description="Tokens per request"
              variant="default"
            />
          </div>
        </PageSection>

        {/* Usage Summary */}
        {usageData && usageData.total_requests > 0 && (
          <PageSection
            id="usage"
            title="Your Usage (Last 30 Days)"
            description="Token consumption and costs across playground and API."
            actions={
              <Button asChild variant="outline" size="sm" className="gap-2 rounded-full">
                <RouterLink to="/language-models/billing">
                  <FiBarChart2 className="h-4 w-4" />
                  <span>Full Report</span>
                </RouterLink>
              </Button>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                icon={FiBarChart2}
                label="Total Requests"
                value={numberFormatter.format(usageData.total_requests)}
                description={`${currencyFormatter.format(usageData.total_cost)} total cost`}
                variant="primary"
              />
              {usageData.by_source.map((src) => (
                <StatCard
                  key={src.source}
                  icon={src.source === "playground" ? FiCpu : FiZap}
                  label={src.source === "playground" ? "Playground" : src.source === "api" ? "REST API" : "Other"}
                  value={numberFormatter.format(src.total_requests)}
                  description={`${currencyFormatter.format(src.total_cost)} cost`}
                  variant="default"
                />
              ))}
            </div>
          </PageSection>
        )}

        {/* Models Table */}
        <PageSection
          id="models"
          title="Available Models"
          description="All usage is metered and billed based on actual token consumption."
        >
          {/* Search and Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={showInactive ? "default" : "outline"}
                size="sm"
                onClick={() => setShowInactive(!showInactive)}
                className="rounded-full"
              >
                {showInactive ? "Show Active Only" : "Show All"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white/95 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/70 bg-slate-50/50 dark:border-slate-700/60 dark:bg-slate-800/30">
                    <TableHead className="font-semibold">Model</TableHead>
                    <TableHead className="font-semibold">Provider</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Pricing (per 1M tokens)</TableHead>
                    <TableHead className="font-semibold">Max Tokens</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-slate-600 dark:border-t-slate-300" />
                          <span className="text-slate-600 dark:text-slate-400">Loading models...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : models.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FiSearch className="h-8 w-8 text-slate-400" />
                          <p className="text-slate-600 dark:text-slate-400">
                            {searchQuery ? "No models match your search" : "No models available"}
                          </p>
                          {!showInactive && (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => setShowInactive(true)}
                              className="text-xs"
                            >
                              Show all models
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    models.map((model) => (
                      <TableRow
                        key={model.id}
                        className="border-slate-200/70 transition-colors hover:bg-slate-50/50 dark:border-slate-700/60 dark:hover:bg-slate-800/30"
                      >
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-slate-900 dark:text-slate-50">
                              {model.display_name || model.name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {model.model_id}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {model.provider || "Anthropic"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              model.is_active
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${model.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                            {model.is_active ? "Active" : "Configure Key"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5 text-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-500 dark:text-slate-400">In:</span>
                              <span className="font-mono font-medium">
                                {currencyFormatter.format(model.input_token_price || 0)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-500 dark:text-slate-400">Out:</span>
                              <span className="font-mono font-medium">
                                {currencyFormatter.format(model.output_token_price || 0)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">
                            {numberFormatter.format(model.max_tokens)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={model.is_active ? "default" : "outline"}
                            size="sm"
                            className="rounded-full"
                            asChild
                            disabled={!model.is_active}
                          >
                            <RouterLink to="/language-models/llm-service" search={{ modelId: model.id }}>
                              {model.is_active ? "Try Model" : "Unavailable"}
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

          {/* Model Count Summary */}
          {!isLoading && models.length > 0 && (
            <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
              Showing {models.length} of {allModels.length} models
            </div>
          )}
        </PageSection>

        {/* Quick Links */}
        <div className="grid gap-4 border-t border-slate-200/60 pt-8 sm:grid-cols-3 dark:border-slate-800">
          <QuickLink
            to="/language-models/billing"
            title="Billing & Usage"
            description="View detailed usage metrics and costs"
          />
          <QuickLink
            to="/language-models/api"
            title="API Documentation"
            description="Integration guides and examples"
          />
          <QuickLink
            to="/language-models/keys"
            title="API Keys"
            description="Manage REST API keys for programmatic access"
          />
        </div>
      </div>
    </PageScaffold>
  );
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  description,
  variant = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  description: string;
  variant?: "default" | "primary";
}) => (
  <div className={`rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${
    variant === "primary"
      ? "border-blue-200/70 bg-gradient-to-br from-blue-50 to-white dark:border-blue-900/30 dark:from-blue-950/30 dark:to-slate-900"
      : "border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-900/60"
  }`}>
    <div className="flex items-center gap-3">
      <div className={`rounded-xl p-2.5 ${
        variant === "primary"
          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
      }`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100 truncate">{value}</p>
        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 truncate">{description}</p>
      </div>
    </div>
  </div>
);

const QuickLink = ({
  to,
  title,
  description,
}: {
  to: string;
  title: string;
  description: string;
}) => (
  <RouterLink
    to={to}
    className="group flex flex-col justify-between space-y-2 rounded-xl border border-slate-200/60 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700"
  >
    <div className="space-y-1">
      <div className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
        {title}
      </div>
      <div className="text-sm text-slate-600 dark:text-slate-400">
        {description}
      </div>
    </div>
  </RouterLink>
);

export const Route = createFileRoute("/_layout/language-models/")({
  component: LanguageModelsIndexPage,
});
