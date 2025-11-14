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

export const PageScaffold = ({ sidebar, children, className }: PageScaffoldProps) => {
  return (
    <div className={cn("px-4 py-12", className)}>
      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(240px,280px)_1fr]">
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {sidebar}
        </aside>
        <div className="space-y-16">
          {children}
        </div>
      </div>
    </div>
  )
}

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
      <ul className="mt-4 space-y-3">
        {items.map(({ id, label, description, icon: Icon }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-transparent px-3 py-2 text-slate-600 transition hover:border-slate-200/70 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-700/60 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
            >
              <span className="flex items-center gap-2 font-medium">
                {Icon ? <Icon className="h-4 w-4 text-slate-400 group-hover:text-indigo-500" /> : null}
                {label}
              </span>
              <FiArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-indigo-500" />
            </a>
            {description ? (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                {description}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
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
    <section id={id} className={cn("scroll-mt-32 space-y-6", className)}>
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
