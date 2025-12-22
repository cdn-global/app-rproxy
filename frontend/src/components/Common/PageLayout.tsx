import type { ReactNode } from "react"
import type { IconType } from "react-icons"
import { FiArrowUpRight } from "react-icons/fi"

import { cn } from "@/lib/utils"

export type SectionNavItem = {
  id: string
  label: string
  description?: string
  icon?: IconType
}

interface PageScaffoldProps {
  sidebar: ReactNode
  children: ReactNode
  className?: string
}

export const PageScaffold = ({ sidebar, children, className }: PageScaffoldProps) => (
  <div className={cn("px-4 py-12 sm:px-6 lg:px-8", className)}>
    <div className="mx-auto w-full max-w-7xl space-y-12">
      {sidebar ? (
        <div className="space-y-6">
          {sidebar}
        </div>
      ) : null}
      <div className="space-y-16">
        {children}
      </div>
    </div>
  </div>
)

interface SectionNavigationProps {
  items: SectionNavItem[]
  title?: string
}

export const SectionNavigation = ({ items, title = "Jump to" }: SectionNavigationProps) => {
  if (!items.length) return null

  return (
    <nav
      aria-label={title}
      className="rounded-3xl border border-slate-200/70 bg-white/70 p-5 text-sm shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/60 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {items.map(({ id, label, description, icon: Icon }) => (
          <div key={id} className="flex flex-col gap-1">
            <a
              href={`#${id}`}
              className="group inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/60 px-4 py-2 font-medium text-slate-600 transition hover:border-emerald-200/80 hover:bg-white hover:text-slate-900 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-emerald-500/50 dark:hover:text-slate-100"
            >
              {Icon ? <Icon className="h-4 w-4 text-slate-400 transition group-hover:text-emerald-500" /> : null}
              {label}
              <FiArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-emerald-500" />
            </a>
            {description ? (
              <p className="text-xs text-slate-500 dark:text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </nav>
  )
}

interface PageSectionProps {
  id: string
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export const PageSection = ({
  id,
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: PageSectionProps) => {
  return (
    <section id={id} className={cn("scroll-mt-36 space-y-6", className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          {description ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      <div className={cn("space-y-6", contentClassName)}>
        {children}
      </div>
    </section>
  )
}

export default PageScaffold
