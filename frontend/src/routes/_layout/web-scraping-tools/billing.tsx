import { createFileRoute } from "@tanstack/react-router"
import { FiCreditCard } from "react-icons/fi"

import PageScaffold, { PageSection } from "../../../components/Common/PageLayout"
import UsageInsights from "../../../components/Dashboard/UsageInsights"
import ChartsSection from "../../../components/Dashboard/ChartsSection"
import { calculateDashboardStats } from "../../../lib/dashboardUtils"

const WebScrapingToolsBillingPage = () => {
  return (
    <PageScaffold sidebar={null}>
      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
          <FiCreditCard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Billing & Usage
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your subscription and review detailed usage metrics.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <PageSection
            id="analytics"
            title="Usage Analytics & Insights"
            description="An overview of your recent API usage and performance."
        >
            <div className="flex flex-col gap-6">
            <UsageInsights stats={calculateDashboardStats(1, 2, 3, [])} />
            <ChartsSection />
            </div>
        </PageSection>
      </div>
    </PageScaffold>
  )
}

export const Route = createFileRoute('/_layout/web-scraping-tools/billing')({
  component: WebScrapingToolsBillingPage,
})

export default WebScrapingToolsBillingPage
