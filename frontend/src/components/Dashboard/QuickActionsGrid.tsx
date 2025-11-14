import { Link as RouterLink } from "@tanstack/react-router"
import { FiArrowUpRight } from "react-icons/fi"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import type { QuickActionLink } from "./types"

interface QuickActionsGridProps {
  actions: QuickActionLink[]
}

const QuickActionsGrid = ({ actions }: QuickActionsGridProps) => {
  if (actions.length === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-slate-100/70 p-6 text-slate-700 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200">
        <h3 className="text-sm font-semibold">No quick actions available</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Activate additional products or contact support to enable shortcuts for your workspace.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {actions.map((action) => (
        <Card
          key={action.label}
          className="group h-full rounded-[24px] border border-slate-200/70 bg-white/95 shadow-[0_20px_44px_-28px_rgba(15,23,42,0.46)] backdrop-blur-xl transition duration-200 hover:-translate-y-1.5 hover:shadow-[0_32px_60px_-30px_rgba(15,23,42,0.52)] dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-[0_28px_64px_-34px_rgba(15,23,42,0.7)]"
        >
          <CardContent className="flex h-full flex-col gap-3 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
              <action.icon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                {action.label}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {action.description}
              </p>
            </div>
            <div className="mt-4">{renderActionButton(action)}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

const renderActionButton = (action: QuickActionLink) => {
  if (action.to) {
    return (
      <Button
        asChild
        variant="outline"
        className="gap-2 rounded-full px-5 py-2 text-sm font-semibold"
      >
        <RouterLink to={action.to}>
          <span>Open</span>
          <FiArrowUpRight className="h-4 w-4" />
        </RouterLink>
      </Button>
    )
  }

  if (action.href) {
    return (
      <Button
        asChild
        variant="outline"
        className="gap-2 rounded-full px-5 py-2 text-sm font-semibold"
      >
        <a href={action.href} target="_blank" rel="noopener noreferrer">
          <span>View docs</span>
          <FiArrowUpRight className="h-4 w-4" />
        </a>
      </Button>
    )
  }

  return (
    <Button
      onClick={action.onClick}
      isLoading={action.isLoading}
      variant="outline"
      className="gap-2 rounded-full px-5 py-2 text-sm font-semibold"
    >
      <span>Launch</span>
      <FiArrowUpRight className="h-4 w-4" />
    </Button>
  )
}

export default QuickActionsGrid
