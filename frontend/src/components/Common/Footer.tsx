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
    <footer className="border-t border-transparent bg-gradient-to-b from-transparent via-white/85 to-white/95 px-4 py-12 backdrop-blur-xl dark:via-slate-950/70 dark:to-slate-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <div className="rounded-[32px] border border-slate-200/70 bg-white/85 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.75)]">
          <div className="grid gap-8 text-sm text-slate-600 dark:text-slate-400 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
            <div className="space-y-4">
              <Logo
                src="/assets/images/roaming-proxy-network-logo.png"
                alt="Roaming Proxy Logo"
                imgClassName="w-24"
              />
              <p className="max-w-sm text-sm leading-relaxed">
                Enterprise-grade proxy infrastructure, scraping APIs, and managed VPS orchestration under one pane of glass.
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-500">
                <span className="rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-400">
                  Since 2019
                </span>
                <span>New York · EU · APAC</span>
              </div>
            </div>

            <FooterSection title="Talk to us">
              <FooterLink href="tel:+18334353873">
                <FiPhone className="h-4 w-4" /> +1 (833) 435-3873
              </FooterLink>
              <FooterLink href="mailto:info@roamingproxy.com">
                <FiMail className="h-4 w-4" /> info@roamingproxy.com
              </FooterLink>
            </FooterSection>

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
        </div>

        <div className="flex flex-col items-center gap-2 text-xs text-slate-500 dark:text-slate-500 md:flex-row md:justify-between">
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
