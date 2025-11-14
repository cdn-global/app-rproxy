import type { IconType } from "react-icons"

type AccentVariant = "brand" | "success" | "warning" | "ocean"

export interface DashboardStat {
  label: string
  value: string
  description: string
  icon: IconType
  accent: AccentVariant
}

export interface QuickActionLink {
  label: string
  description: string
  icon: IconType
  to?: string
  href?: string
  onClick?: () => void | Promise<void>
  isLoading?: boolean
}

export interface DisplayedFeature {
  slug: string
  name: string
  description: string
  icon: IconType
  path: string
  gradient?: string
  period?: string
}

export interface ServerNode {
  refIndex?: number
  name: string
  email: string
  ip: string
  version: string
  kernel: string
  status: string
  type: string
  os: string
  username: string
  password: string
  monthlyComputePrice: number
  storageSizeGB: number
  activeSince: string
  hasRotatingIP: boolean
  hasBackup: boolean
  hasMonitoring: boolean
  hasManagedSupport: boolean
  ramGB: number
  vCPUs?: number
}
