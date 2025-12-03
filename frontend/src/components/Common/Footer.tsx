import type { ReactNode } from "react"

import {
  FiBook,
  FiGithub,
  FiGlobe,
  FiMail,
  FiPhone,
  FiTwitter,
} from "react-icons/fi"

import Logo from "../Common/Logo"

const Footer = () => {
  return (
    <footer className="border-t bg-background/95 px-4 py-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 text-xs text-slate-500 dark:text-slate-500 sm:flex-row sm:justify-between">
        <p>
          © 2025
          <FooterLink href="https://ROAMINGPROXY.com" newTab className="mx-1">
            ROAMINGPROXY.com
          </FooterLink>
          ·
          <FooterLink href="https://tradevaultllc.com/" newTab className="ml-1">
            Trade Vault LLC
          </FooterLink>
          . All rights reserved.
        </p>
        <p>Roaming Proxy is a registered Trade Vault LLC service.</p>
      </div>
    </footer>
  )
}

const FooterSection = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <div className="space-y-3">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
      {title}
    </p>
    <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400">
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
    className={`inline-flex items-center gap-2 text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 ${className ?? ""}`.trim()}
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
    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white/70 text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
  >
    {children}
  </a>
)

export default Footer
