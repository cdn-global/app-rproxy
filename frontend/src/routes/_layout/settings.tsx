import { useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import type { UserPublic } from "../../client"
import {
  PageScaffold,
  PageSection,
  SectionNavigation,
  type SectionNavItem,
} from "../../components/Common/PageLayout"

// --- TanStack Router Route Definition ---
export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
})

function UserSettings() {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  if (!currentUser) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner size={48} />
      </div>
    )
  }

  const roleLabel = currentUser.is_superuser ? "Superuser" : "Member"
  const statusVariant = currentUser.is_active ? "success" : "destructive"

  const navigation: SectionNavItem[] = [
    {
      id: "profile",
      label: "Profile overview",
      description: "Identity, contact, and workspace role details.",
    },
    {
      id: "session",
      label: "Session health",
      description: "Tokens, device coverage, and maintenance notices.",
    },
  ]

  return (
    <PageScaffold
      sidebar={
        <>
          <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/60 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/60 px-4 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-400">
              <span>Account</span>
              <span className="h-1 w-1 rounded-full bg-slate-400" aria-hidden="true" />
              <span>Settings</span>
            </div>
            <div className="mt-5 space-y-3">
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                Personal Workspace
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Review profile details, confirm role eligibility, and keep billing contacts aligned.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <Badge variant="outline">{roleLabel}</Badge>
              <Badge variant={statusVariant}>
                {currentUser.is_active ? "Active" : "Suspended"}
              </Badge>
            </div>
            <div className="mt-6 space-y-3 text-xs text-slate-500 dark:text-slate-500">
              <p>
                Rotating tokens, SCIM sync, and session telemetry live here so you can trace access without leaving the console.
              </p>
              <p>
                Billing actions open in a new tab and reflect instantly across the dashboard and usage alerts.
              </p>
            </div>
          </div>
          <SectionNavigation items={navigation} />
        </>
      }
    >
      <PageSection
        id="profile"
        title="Profile overview"
        description="Identity metadata replicated across the customer workspace."
        actions={
          <Button asChild variant="outline" className="h-10 min-w-[160px] justify-center">
            <Link to="/hosting/billing">Manage Billing</Link>
          </Button>
        }
        contentClassName="grid gap-6 lg:grid-cols-[2fr]"
      >
        <Card className="border border-slate-200/70 bg-white/80 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.65)]">
          <CardHeader>
            <CardTitle className="text-xl">Profile Overview</CardTitle>
            <p className="text-sm text-muted-foreground">
              Core identity fields mirrored across platform services.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <dl className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Full name
                </dt>
                <dd className="text-base font-medium text-foreground">
                  {currentUser.full_name || "N/A"}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Email address
                </dt>
                <dd className="text-base font-medium text-foreground">
                  {currentUser.email}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  User id
                </dt>
                <dd className="text-base font-medium text-foreground font-mono text-xs uppercase tracking-[0.22em]">
                  {currentUser.id}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Access level
                </dt>
                <dd className="text-base font-medium text-foreground">
                  {roleLabel}
                </dd>
              </div>
            </dl>

            <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/60 p-4 text-xs text-muted-foreground dark:border-slate-700/60 dark:bg-slate-900/60">
              Profile editing is coming soon. Contact support if you need to adjust ownership or billing contacts today.
            </div>
          </CardContent>
        </Card>
      </PageSection>

      <PageSection
        id="session"
        title="Session health"
        description="Authentication status, rotation cadence, and maintenance updates."
      >
        <Card className="border border-slate-200/70 bg-white/80 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.65)]">
          <CardHeader>
            <CardTitle className="text-xl">Session Health</CardTitle>
            <p className="text-sm text-muted-foreground">
              Stay signed in across devices with secure rotating tokens.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              You are currently authenticated with a scoped access token linked to your workspace role. If you revoke access, sign back in to regenerate credentials.
            </p>
            <Button variant="outline" size="sm" className="w-full" disabled>
              Update Settings (soon)
            </Button>
          </CardContent>
        </Card>
      </PageSection>
    </PageScaffold>
  )
}

export default UserSettings
