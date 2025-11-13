import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink, useRouterState } from "@tanstack/react-router"
import { Menu, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { FaGlobe, FaServer } from "react-icons/fa"
import { FiLogOut, FiUsers } from "react-icons/fi"
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
    title: "Managed VPS",
    path: "https://cloud.ROAMINGPROXY.com/hosting",
    description: "Fully managed virtual private servers for your needs.",
    icon: FaServer,
  },
]

const NavGroupDropdown = ({ item }: { item: NavItem }) => {
  const { pathname } = useRouterState().location
  const isGroupActive = item.subItems?.some((sub) => pathname.startsWith(sub.path))

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

  const textColor = "text-muted-foreground"
  const activeClasses = "bg-primary/10 text-primary"
  const hoverClasses = "hover:bg-muted hover:text-foreground"
  const disabledClasses = "cursor-not-allowed text-muted-foreground"

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
            "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            textColor,
            hoverClasses,
            active ? activeClasses : null,
            isMobile ? "w-full justify-start" : undefined,
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
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <Logo
          src="/assets/images/roaming-proxy-network-logo.png"
          alt="Roaming Proxy Logo"
          imgClassName="w-20 md:w-28"
        />
        <div className="hidden md:block">
          <NavItems />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      {isMobileOpen ? (
        <div className="mt-3 px-1 md:hidden">
          <NavItems isMobile onClose={() => setIsMobileOpen(false)} />
        </div>
      ) : null}
    </header>
  )
}

export default TopNav
