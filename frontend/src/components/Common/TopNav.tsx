import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink, useRouterState } from "@tanstack/react-router"
import { Menu, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { FaGlobe, FaSearch, FaServer } from "react-icons/fa"
import { FiLogOut, FiUsers, FiSettings } from "react-icons/fi"
import type { IconType } from "react-icons"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { UserPublic } from "../../client"
import useAuth from "../../hooks/useAuth"
import Logo from "../Common/Logo"

interface NavItem {
  title: string
  icon?: IconType
  path?: string
  onClick?: () => void
  description?: string
  subItems?: { title: string; path: string; description: string }[]
}

interface NavItemsProps {
  onClose?: () => void
  isMobile?: boolean
}

const navStructure: NavItem[] = [
  {
    title: "Roaming IP",
    path: "/web-scraping-tools/https-api",
    description: "Access any webpage with our powerful rotating proxy network.",
    icon: FaGlobe,
  },
  {
    title: "SERP API",
    path: "/web-scraping-tools/serp-api",
    description: "Access any webpage with our powerful SERP API.",
    icon: FaSearch,
  },
  {
    title: "Managed VPS",
    path: "/hosting",
    description: "Fully managed virtual private servers for your needs.",
    icon: FaServer,
  },
  {
    title: "Settings",
    path: "/settings",
    description: "Manage your workspace settings.",
    icon: FiSettings,
  },
]

const NavGroupDropdown = ({ item }: { item: NavItem }) => {
  const { pathname } = useRouterState().location
  const isGroupActive = item.subItems?.some((sub) =>
    pathname.startsWith(sub.path),
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors",
            isGroupActive ? "text-primary" : "text-muted-foreground",
            "hover:text-primary",
          )}
          aria-label={`Open ${item.title} menu`}
        >
          {item.icon ? <item.icon className="h-5 w-5" /> : null}
          <span>{item.title}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72">
        {item.subItems?.map((subItem) => (
          <DropdownMenuItem asChild key={subItem.title}>
            <RouterLink to={subItem.path} className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">
                {subItem.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {subItem.description}
              </span>
            </RouterLink>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const NavItems = ({ onClose, isMobile = false }: NavItemsProps) => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { pathname } = useRouterState().location
  const { logout } = useAuth()

  const items = useMemo(() => {
    const mapped: NavItem[] = [...navStructure]
    if (currentUser?.is_superuser && !mapped.some((item) => item.title === "Admin")) {
      mapped.push({ title: "Admin", icon: FiUsers, path: "/admin" })
    }
    mapped.push({ title: "Sign Out", icon: FiLogOut, onClick: logout })
    return mapped
  }, [currentUser, logout])

  const isEnabled = (title: string) => {
    return [
      "Admin",
      "Roaming IP",
      "SERP API",
      "User Agents",
      "Settings",
      "Sign Out",
      "Managed VPS",
    ].includes(title)
  }

  const textColor = "text-slate-600 dark:text-slate-300"
  const activeClasses =
    "border-indigo-200/80 bg-indigo-500/15 text-indigo-700 shadow-sm dark:border-indigo-500/40 dark:text-indigo-100"
  const hoverClasses =
    "hover:border-slate-200/80 hover:bg-slate-100/70 hover:text-slate-900 dark:hover:border-slate-700/60 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
  const disabledClasses =
    "cursor-not-allowed text-slate-400 dark:text-slate-600"

  const handleNavClick = (handler?: () => void) => {
    return () => {
      handler?.()
      onClose?.()
    }
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex items-center",
          isMobile ? "flex-col gap-2" : "gap-4",
        )}
      >
        {items.map((item) => {
          const hasSubItems = item.subItems?.length
          const isExternal = item.path?.startsWith("http")
          const active = item.path ? pathname.startsWith(item.path) : false

          if (hasSubItems && item.subItems) {
            return (
              <NavGroupDropdown key={item.title} item={item} />
            )
          }

          if (!isEnabled(item.title) && !item.onClick) {
            return (
              <Tooltip key={item.title}>
                <TooltipTrigger asChild>
                  <span className={cn("inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium", disabledClasses)}>
                    {item.icon ? <item.icon className="h-5 w-5" /> : null}
                    {item.title}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Coming soon</TooltipContent>
              </Tooltip>
            )
          }

          const baseClasses = cn(
            "inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-sm font-medium transition-colors",
            textColor,
            hoverClasses,
            active ? activeClasses : null,
            isMobile ? "w-full justify-start" : "shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] dark:shadow-[0_10px_30px_-20px_rgba(15,23,42,0.8)]",
          )

          if (item.onClick) {
            return (
              <button
                key={item.title}
                type="button"
                className={baseClasses}
                onClick={handleNavClick(item.onClick)}
              >
                {item.icon ? <item.icon className="h-5 w-5" /> : null}
                {item.title}
              </button>
            )
          }

          if (item.path && isExternal) {
            return (
              <a
                key={item.title}
                href={item.path}
                target="_blank"
                rel="noreferrer"
                className={baseClasses}
                onClick={handleNavClick()}
              >
                {item.icon ? <item.icon className="h-5 w-5" /> : null}
                {item.title}
              </a>
            )
          }

          return (
            <RouterLink
              key={item.title}
              to={item.path ?? "/"}
              className={baseClasses}
              onClick={handleNavClick()}
            >
              {item.icon ? <item.icon className="h-5 w-5" /> : null}
              {item.title}
            </RouterLink>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

const TopNav = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { location } = useRouterState()

  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname])

  return (
    <header className="z-50 border-b border-transparent bg-gradient-to-b from-white/90 via-white/70 to-transparent px-4 py-4 backdrop-blur-xl supports-[backdrop-filter]:bg-white/65 dark:from-slate-950/80 dark:via-slate-950/60">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo
            src="/assets/images/roaming-proxy-network-logo.png"
            alt="Roaming Proxy Logo"
            imgClassName="w-16 md:w-24"
          />
        </div>
        <div className="hidden md:flex">
          <div className="rounded-full border border-slate-200/70 bg-white/60 px-2 py-1 shadow-[0_14px_50px_-32px_rgba(15,23,42,0.6)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/60 dark:shadow-[0_14px_50px_-28px_rgba(15,23,42,0.85)]">
            <NavItems />
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full border border-slate-200/70 bg-white/70 shadow-sm transition hover:border-slate-300 hover:bg-white md:hidden dark:border-slate-700/60 dark:bg-slate-900/70 dark:hover:border-slate-600"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      {isMobileOpen ? (
        <div className="mt-4 md:hidden">
          <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-3 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70">
            <NavItems isMobile onClose={() => setIsMobileOpen(false)} />
          </div>
        </div>
      ) : null}
    </header>
  )
}

export default TopNav
