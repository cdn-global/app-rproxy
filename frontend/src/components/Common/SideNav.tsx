import React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink, useRouterState } from "@tanstack/react-router"
import { FaGlobe, FaServer } from "react-icons/fa"
import { FiLogOut, FiUsers, FiSettings, FiDatabase } from "react-icons/fi"
import type { IconType } from "react-icons"

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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

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
    title: "Scraping Tools",
    icon: FaGlobe,
    subItems: [
      {
        title: "Roaming IP",
        path: "/web-scraping-tools/https-api",
        description: "Access any webpage with our powerful rotating proxy network.",
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
      },
      {
        title: "Serverless Compute",
        path: "/services/serverless-compute",
        description: "Run your code without provisioning or managing servers.",
      },
    ],
  },
  {
    title: "LLM Inference API",
    path: "/services/llm-inference-api",
    description: "Integrate powerful language models into your applications.",
    icon: FiDatabase,
  },
  {
    title: "Settings",
    path: "/settings",
    description: "Manage your workspace settings.",
    icon: FiSettings,
  },
]

const NavItems = () => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { pathname } = useRouterState().location
  const { logout } = useAuth()

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
      "LLM Inference API",
      "Settings",
    ].includes(title)
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          if (item.subItems) {
            return (
              <Accordion type="single" collapsible key={item.title}>
                <AccordionItem value={item.title} className="border-none">
                  <AccordionTrigger className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:no-underline">
                    {item.icon && <item.icon className="h-5 w-5" />}
                    <span>{item.title}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pl-6">
                    {item.subItems.map((subItem) => (
                      <RouterLink
                        key={subItem.path}
                        to={subItem.path}
                        className={cn(
                          "block rounded-md px-4 py-2 text-sm font-medium",
                          pathname.startsWith(subItem.path)
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {subItem.title}
                      </RouterLink>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )
          }

          if (!isEnabled(item.title)) {
            return (
              <Tooltip key={item.title}>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed">
                    {item.icon && <item.icon className="h-5 w-5" />}
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
                "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium",
                pathname.startsWith(item.path || "/")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {item.icon && <item.icon className="h-5 w-5" />}
              {item.title}
            </RouterLink>
          )
        })}
      </div>
      <div className="mt-auto">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          <FiLogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </TooltipProvider>
  )
}

const SideNav = () => {
  return (
    <aside className="hidden w-64 flex-col border-r bg-background p-4 sm:flex">
      <div className="mb-4">
        <Logo
          src="/assets/images/roaming-proxy-network-logo.png"
          alt="Roaming Proxy Logo"
          imgClassName="w-24"
        />
      </div>
      <NavItems />
    </aside>
  )
}

export default SideNav
