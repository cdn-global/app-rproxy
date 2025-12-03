import React from "react"
import StatHighlights from "./StatHighlights"
import type { DashboardStat } from "./types"

interface UsageInsightsProps {
  stats: DashboardStat[]
}

const UsageInsights: React.FC<UsageInsightsProps> = ({ stats }) => {
  return <StatHighlights stats={stats} />
}

export default UsageInsights
