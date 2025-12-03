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
  FiTwitter,
  FiUsers,
} from "react-icons/fi"
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
      },{
        title: "Serverless Compute",
        path: "/serverless-compute",
        description: "Deploy and manage your serverless cloud functions.",
      },

    ],
  },
  {
    title: "LLM Inference",
    path: "/language-models",
    description: "Integrate powerful language models into your applications.",
    icon: FiCpu,
  },
  {
    title: "Storage",
    path: "/storage",
    description: "Manage your scalable object storage buckets and files.",
    icon: FiBook,
  },
  {
    title: "Database",
    path: "/database",
    description: "Administer your managed relational databases.",
    icon: FiDatabase,
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
    mapped.push({
      title: "Sign Out",
      icon: FiLogOut,
      onClick: logout,
    })
    return mapped
  }, [currentUser, logout])

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
      <div className="flex flex-1 flex-col gap-2">
        {items.map((item) => {
          if (item.subItems) {
            return (
              <div key={item.title}>
                <div className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground">
                  {item.icon && <item.icon className="h-5 w-5" />}
                  <span>{item.title}</span>
                </div>
                <div className="pl-6">
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
                </div>
              </div>
            )
          }

          if (item.onClick) {
            return (
              <button
                key={item.title}
                onClick={item.onClick}
                className="flex w-full items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                {item.icon && <item.icon className="h-5 w-5" />}
                {item.title}
              </button>
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
    </TooltipProvider>
  )
}

const FooterItems = () => (
  <div className="mt-auto flex flex-col gap-6">
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

    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
        Stay in touch
      </p>
      <div className="flex flex-wrap gap-3">
        <SocialLink href="https://x.com/cobaltdata" label="X">
          <FiTwitter className="h-4 w-4" />
        </SocialLink>
        <SocialLink href="https://github.com/cdn-global" label="GitHub">
          <FiGithub className="h-4 w-4" />
        </SocialLink>
        <SocialLink href="https://cobaltdata.net" label="Cobalt Data">
          <FiGlobe className="h-4 w-4" />
        </SocialLink>
        <SocialLink href="https://docs.roamingproxy.com/" label="Docs">
          <FiBook className="h-4 w-4" />
        </SocialLink>
      </div>
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
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
      {title}
    </p>
    <div className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
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
    className={`inline-flex items-center gap-2 text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 ${
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
    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/70 bg-white/70 text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
  >
    {children}
  </a>
)

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
      <FooterItems />
    </aside>
  )
}

export default SideNav
