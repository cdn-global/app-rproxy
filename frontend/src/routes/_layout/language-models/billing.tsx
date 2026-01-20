
import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
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
import { compoundTools, gptOssTools } from "@/data/language-model-tools";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function LanguageModelsBillingPage() {
  const billingSummary = useMemo(() => {
    return languageModels.reduce(
      (acc, model) => {
        acc.totalInputCost += model.inputTokenPrice;
        acc.totalOutputCost += model.outputTokenPrice;
        return acc;
      },
      {
        totalInputCost: 0,
        totalOutputCost: 0,
        totalCost: 0,
      },
    );
  }, []);

  billingSummary.totalCost = billingSummary.totalInputCost + billingSummary.totalOutputCost;

  return (
    <div className="space-y-10 py-10">
      <div className="space-y-8">
        <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
          <div className="space-y-2 border-b border-slate-200/70 p-6 dark:border-slate-700/60">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Billing Summary</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">A summary of your current billing period.</p>
          </div>
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryTile
                label="Total Input Cost"
                value={currencyFormatter.format(billingSummary.totalInputCost)}
                description="Per Million Tokens"
              />
              <SummaryTile
                label="Total Output Cost"
                value={currencyFormatter.format(billingSummary.totalOutputCost)}
                description="Per Million Tokens"
              />
              <SummaryTile
                label="Total Cost"
                value={currencyFormatter.format(billingSummary.totalCost)}
                description="For the current period"
              />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
          <div className="space-y-2 border-b border-slate-200/70 p-6 dark:border-slate-700/60">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Detailed Costs
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Detailed cost breakdown for each language model.
            </p>
          </div>
          <div className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                  <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                    <TableHead>AI Model</TableHead>
                    <TableHead>Input Token Price</TableHead>
                    <TableHead>Output Token Price</TableHead>
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
                      <TableCell>
                        {currencyFormatter.format(model.inputTokenPrice)}
                      </TableCell>
                      <TableCell>
                        {currencyFormatter.format(model.outputTokenPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
          <div className="space-y-2 border-b border-slate-200/70 p-6 dark:border-slate-700/60">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Built-In Tools (Compound)
            </h3>
          </div>
          <div className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                  <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                    <TableHead>Tool</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Parameter</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compoundTools.map((tool) => (
                    <TableRow
                      key={tool.name}
                      className="border-slate-200/70 transition-colors hover:bg-slate-100/60 dark:border-slate-700/60 dark:hover:bg-slate-800/50"
                    >
                      <TableCell className="align-top font-medium text-slate-900 dark:text-slate-50">
                        {tool.name}
                      </TableCell>
                      <TableCell>{tool.price}</TableCell>
                      <TableCell>{tool.parameter}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
          <div className="space-y-2 border-b border-slate-200/70 p-6 dark:border-slate-700/60">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Built-In Tools (GPT-OSS)
            </h3>
          </div>
          <div className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                  <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                    <TableHead>Tool</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Parameter</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gptOssTools.map((tool) => (
                    <TableRow
                      key={tool.name}
                      className="border-slate-200/70 transition-colors hover:bg-slate-100/60 dark:border-slate-700/60 dark:hover:bg-slate-800/50"
                    >
                      <TableCell className="align-top font-medium text-slate-900 dark:text-slate-50">
                        {tool.name}
                      </TableCell>
                      <TableCell>{tool.price}</TableCell>
                      <TableCell>{tool.parameter}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
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
