import React, { type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink, useRouterState } from "@tanstack/react-router"
import { FaGlobe, FaServer } from "react-icons/fa"
import {
  FiBook,
  FiCpu,
  FiDatabase,
  FiGithub,
  FiGlobe,
  FiLogOut,
  FiMail,
  FiPhone,
  FiSettings,
  FiShield,
  FiTwitter,
  FiUsers,
} from "react-icons/fi"
import type { IconType } from "react-icons"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { UserPublic } from "../../client"
import useAuth from "../../hooks/useAuth"

interface NavItem {
  title: string
  icon?: IconType
  path?: string
  onClick?: () => void
  description?: string
  subItems?: { title: string; path: string; description: string }[]
}

const navStructure: NavItem[] = [
  {
    title: "Artificial Intelligence",
    icon: FiCpu,
    subItems: [
      {
        title: "LLM Inference",
        path: "/language-models",
        description: "Manage your language model settings.",
      },
    ],
  },
  {
    title: "Scraping Tools",
    icon: FaGlobe,
    subItems: [
      {
        title: "Roaming IP",
        path: "/web-scraping-tools/https-api",
        description:
          "Access any webpage with our powerful rotating proxy network.",
      },
      {
        title: "SERP API",
        path: "/web-scraping-tools/serp-api",
        description: "Access any webpage with our powerful SERP API.",
      },
    ],
  },
  {
    title: "Hosting",
    icon: FaServer,
    subItems: [
      {
        title: "Managed VPS",
        path: "/hosting",
        description: "Fully managed virtual private servers for your needs.",
      },{
        title: "Managed Compute",
        path: "/compute",
        description: "Deploy and manage your managed cloud functions.",
      },
    //   {
    //     title: "Serverless Compute",
    //     path: "/serverless-compute",
    //     description: "Deploy and manage your serverless cloud functions.",
    //   },

    ],
  },
  {
    title: "Store",
    icon: FiDatabase,
    subItems: [
      {
        title: "File Storage",
        path: "/storage",
        description: "Manage your scalable object storage buckets and files.",
      },
      {
        title: "Managed Database",
        path: "/managed-database",
        description: "Administer your managed relational databases.",
      },
    ],
  },
  
]

const NavItems = () => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { pathname } = useRouterState().location

  const items = React.useMemo(() => {
    const mapped: NavItem[] = [...navStructure]
    if (currentUser?.is_superuser) {
      mapped.push({ title: "Admin", icon: FiUsers, path: "/admin" })
    }
    return mapped
  }, [currentUser])

  const isEnabled = (title: string) => {
    return [
      "Admin",
      "Scraping Tools",
      "Hosting",
      "LLM Inference",
      "Storage",
      "Database",
      "Compute",
      "Infrastructure",
      "Settings",
      "Sign Out",
    ].includes(title)
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-1">
        {items.map((item) => {
          if (item.subItems) {
            return (
              <div key={item.title}>
                <div className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {item.icon && <item.icon className="hidden h-4 w-4" />}
                  <span>{item.title}</span>
                </div>
                <div className="space-y-0.5">
                  {item.subItems.map((subItem) => (
                    <RouterLink
                      key={subItem.path}
                      to={subItem.path}
                      className={cn(
                        "block rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
                        pathname.startsWith(subItem.path)
                          ? "bg-slate-100/80 text-emerald-700 font-semibold dark:bg-slate-800/60 dark:text-emerald-400 border-l-2 border-emerald-500 rounded-l-none pl-[10px]"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200",
                      )}
                    >
                      {subItem.title}
                    </RouterLink>
                  ))}
                </div>
              </div>
            )
          }

          if (item.onClick) {
            return (
              <button
                key={item.title}
                onClick={item.onClick}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200"
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.title}
              </button>
            )
          }

          if (!isEnabled(item.title)) {
            return (
              <Tooltip key={item.title}>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-400/50 cursor-not-allowed">
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.title}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Coming soon</TooltipContent>
              </Tooltip>
            )
          }

          return (
            <RouterLink
              key={item.path}
              to={item.path || "/"}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
                pathname.startsWith(item.path || "/") && item.path !== "/"
                  ? "bg-slate-100/80 text-emerald-700 font-semibold dark:bg-slate-800/60 dark:text-emerald-400 border-l-2 border-emerald-500 rounded-l-none pl-[10px]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200",
              )}
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              {item.title}
            </RouterLink>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

const UserMenu = () => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { logout } = useAuth()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="mt-2 w-full text-left outline-none">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50/80 to-emerald-100/50 p-2.5 transition-all hover:bg-emerald-100/80 hover:shadow-sm dark:border-emerald-500/20 dark:from-emerald-950/40 dark:to-emerald-900/20 dark:hover:from-emerald-900/40">
          <Avatar className="h-9 w-9 border-2 border-white bg-white shadow-sm dark:border-slate-800">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              {currentUser?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-semibold text-emerald-950 dark:text-emerald-50">
              {currentUser?.full_name || currentUser?.email?.split('@')[0]}
            </span>
            <span className="truncate text-xs text-emerald-600/80 dark:text-emerald-400/70">
              Workspace Admin
            </span>
          </div>
          <FiSettings className="h-4 w-4 text-emerald-600/60 dark:text-emerald-400/60" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{currentUser?.full_name}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {currentUser?.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <RouterLink to="/settings">
          <DropdownMenuItem>User Settings</DropdownMenuItem>
        </RouterLink>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>Sign Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const FooterItems = () => (
  <div className="mt-6 flex flex-col gap-6">
    <div className="space-y-3 text-sm">
      <FooterSection title="Resources">
        <FooterLink href="https://ROAMINGPROXY.com/resources/faq" newTab>
          FAQ
        </FooterLink>
        <FooterLink href="https://ROAMINGPROXY.com/contact" newTab>
          Help &amp; Support
        </FooterLink>
        <FooterLink href="https://docs.roamingproxy.com/" newTab>
          API Docs
        </FooterLink>
      </FooterSection>

      <FooterSection title="Governance">
        <FooterLink href="https://ROAMINGPROXY.com/privacy" newTab>
          Privacy Policy
        </FooterLink>
        <FooterLink href="https://ROAMINGPROXY.com/terms" newTab>
          Terms of Service
        </FooterLink>
        <FooterLink href="https://ROAMINGPROXY.com/compliance" newTab>
          Compliance Center
        </FooterLink>
      </FooterSection>

      <FooterSection title="Talk to us">
        <FooterLink href="tel:+18334353873">
          <FiPhone className="h-4 w-4" /> +1 (833) 435-3873
        </FooterLink>
        <FooterLink href="mailto:info@roamingproxy.com">
          <FiMail className="h-4 w-4" /> info@roamingproxy.com
        </FooterLink>
      </FooterSection>
    </div>
  </div>
)

const FooterSection = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <div className="space-y-2">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      {title}
    </p>
    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
      {children}
    </div>
  </div>
)

const FooterLink = ({
  href,
  children,
  newTab,
  className,
}: {
  href: string
  children: ReactNode
  newTab?: boolean
  className?: string
}) => (
  <a
    href={href}
    target={newTab ? "_blank" : undefined}
    rel={newTab ? "noreferrer" : undefined}
    className={`inline-flex items-center gap-2 text-muted-foreground transition hover:text-foreground ${
      className ?? ""
    }`.trim()}
  >
    {children}
  </a>
)

const SocialLink = ({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: ReactNode
}) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    aria-label={label}
    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/70 text-muted-foreground transition hover:border-primary hover:text-foreground"
  >
    {children}
  </a>
)

const SideNav = () => {
  return (
    <aside className="hidden w-full h-full flex-col border-r bg-sidebar p-4 sm:flex">
      <div className="mb-8 pl-2">
        <RouterLink to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex aspect-square h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-600/10">
            <FiShield className="h-6 w-6 fill-current" />
          </div>
          <span className="font-bold tracking-[0.14em] text-base uppercase text-foreground">
            ROAMINGPROXY
          </span>
        </RouterLink>
      </div>
      <div className="flex flex-1 flex-col">
        <NavItems />
      </div>
      <FooterItems />
      <UserMenu />
    </aside>
  )
}

export default SideNav
