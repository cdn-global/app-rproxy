import {
  FaCreditCard,
  FaDatabase,
  FaGlobe,
  FaServer,
} from "react-icons/fa"
import type { DashboardStat, ServerNode } from "@/components/Dashboard/types"

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

export function calculateDashboardStats(
  totalRequests: number,
  totalDataGB: number,
  totalMonthlySpend: number,
  servers: ServerNode[],
): DashboardStat[] {
  const connectedServers = servers.filter(
    (server) => server.status === "Connected",
  ).length
  const offlineServers = servers.length - connectedServers

  return [
    {
      label: "Total Requests",
      value: numberFormatter.format(totalRequests),
      description: "Across active API keys",
      icon: FaGlobe,
      accent: "brand",
    },
    {
      label: "Estimated Transfer",
      value: `${decimalFormatter.format(totalDataGB)} GB`,
      description: "Based on current data egress",
      icon: FaDatabase,
      accent: "ocean",
    },
    {
      label: "Monthly Spend",
      value: currencyFormatter.format(totalMonthlySpend),
      description: "Managed compute and add-ons",
      icon: FaCreditCard,
      accent: "warning",
    },
    {
      label: "Connected Servers",
      value: numberFormatter.format(connectedServers),
      description:
        offlineServers > 0
          ? `${offlineServers} awaiting attention`
          : "All systems healthy",
      icon: FaServer,
      accent: "success",
    },
  ]
}
