import type { ServerNode } from "@/components/Dashboard/types"

export interface ComputeServer extends ServerNode {
  fullMonthlyComputePrice: number
  isTrial: boolean
}

export const computeServers: ComputeServer[] = [
  {
    name: "compute-01-NYC-FID-8core-ssd",
    email: "apis.popov@gmail.com",
    ip: "100.100.95.59",
    version: "1.82.0",
    kernel: "Linux 6.8.0-57-generic",
    status: "Connected",
    type: "VPS",
    os: "debian",
    username: "user",
    password: "5660",
    monthlyComputePrice: 11.4,
    fullMonthlyComputePrice: 11.4,
    storageSizeGB: 120,
    activeSince: "2025-07-01",
    hasRotatingIP: false,
    hasBackup: true,
    hasMonitoring: true,
    hasManagedSupport: false,
    vCPUs: 1,
    ramGB: 2,
    isTrial: false,
  },
  {
    name: "compute-02-NYC-MTM-16core-ssd",
    email: "apis.popov@gmail.com",
    ip: "100.140.50.60",
    version: "1.88.0",
    kernel: "Linux 6.8.0-62-generic",
    status: "Connected",
    type: "VPS",
    os: "debian",
    username: "user",
    password: "5660",
    monthlyComputePrice: 449,
    fullMonthlyComputePrice: 449,
    storageSizeGB: 100,
    activeSince: "2025-09-01",
    hasRotatingIP: false,
    hasBackup: false,
    hasMonitoring: false,
    hasManagedSupport: false,
    vCPUs: 16,
    ramGB: 64,
    isTrial: false,
  },
]
