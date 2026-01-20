
import { useMemo } from "react";
import { Link as RouterLink, createFileRoute } from "@tanstack/react-router";
import { FiArrowUpRight } from "react-icons/fi";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { languageModels } from "@/data/language-models";
import PageScaffold, { PageSection } from "../../../components/Common/PageLayout";

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function LanguageModelsIndexPage() {
  const fleetSummary = useMemo(() => {
    return languageModels.reduce(
      (acc, model) => {
        acc.totalModels += 1;
        acc.totalSpeed += model.speed;
        acc.avgInputPrice += model.inputTokenPrice;
        acc.avgOutputPrice += model.outputTokenPrice;
        return acc;
      },
      {
        totalModels: 0,
        totalSpeed: 0,
        avgInputPrice: 0,
        avgOutputPrice: 0,
      },
    );
  }, []);

  fleetSummary.avgInputPrice /= fleetSummary.totalModels;
  fleetSummary.avgOutputPrice /= fleetSummary.totalModels;

  return (
    <PageScaffold sidebar={null}>
    <div className="space-y-10">
      <div className="space-y-8">
        <PageSection
          id="fleet"
          title="Fleet intelligence"
          description="Summaries of capacity, health, and monthly run rate."
          actions={
            <Button
              asChild
              variant="outline"
              className="gap-2 rounded-full border-slate-200/80 bg-white/60 px-5 py-2 text-sm font-semibold shadow-sm transition hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
            >
              <RouterLink to="billing">
                <span>Open billing cycle</span>
                <FiArrowUpRight className="h-4 w-4" />
              </RouterLink>
            </Button>
          }
        >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryTile
                label="Total models"
                value={numberFormatter.format(fleetSummary.totalModels)}
                description="All models active"
              />
              <SummaryTile
                label="Avg Speed (Tokens/Second)"
                value={numberFormatter.format(fleetSummary.totalSpeed / fleetSummary.totalModels)}
                description="Across all models"
              />
              <SummaryTile
                label="Avg Input Token Price"
                value={currencyFormatter.format(fleetSummary.avgInputPrice)}
                description="Per Million Tokens"
              />
              <SummaryTile
                label="Avg Output Token Price"
                value={currencyFormatter.format(fleetSummary.avgOutputPrice)}
                description="Per Million Tokens"
              />
            </div>
        </PageSection>

        <PageSection
          id="models"
          title="AI Model"
          description="Pricing will be slightly upcharged for geo location and other support"
        >
        <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
          <div className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                  <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                    <TableHead>AI Model</TableHead>
                    <TableHead>Current Speed(Tokens per Second)</TableHead>
                    <TableHead>Input Token Price(Per Million Tokens)</TableHead>
                    <TableHead>Output Token Price(Per Million Tokens)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {languageModels.map((model) => (
                    <TableRow
                      key={model.name}
                      className="border-slate-200/70 transition-colors hover:bg-slate-100/60 dark:border-slate-700/60 dark:hover:bg-slate-800/50"
                    >
                      <TableCell className="align-top font-medium text-slate-900 dark:text-slate-50">
                        {model.name}
                      </TableCell>
                      <TableCell>{model.speed} TPS</TableCell>
                      <TableCell>
                        {currencyFormatter.format(model.inputTokenPrice)} ({model.tokensPerDollarInput})
                      </TableCell>
                      <TableCell>
                        {currencyFormatter.format(model.outputTokenPrice)} ({model.tokensPerDollarOutput})
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full border-slate-300/80 px-3 py-1 text-xs font-semibold hover:border-slate-400"
                          asChild
                        >
                          <RouterLink to={`/language-models/${encodeURIComponent(model.name)}`}>
                            Try Now
                          </RouterLink>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
