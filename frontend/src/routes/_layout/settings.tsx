import { useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import type { UserPublic } from "../../client"

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

  return (
    <div className="px-4 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/60 px-4 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-400">
              <span>Account</span>
              <span className="h-1 w-1 rounded-full bg-slate-400" aria-hidden="true" />
              <span>Settings</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                Personal Workspace
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Review your profile details, confirm account status, and launch into billing when you need to adjust subscriptions.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <Badge variant="outline">{roleLabel}</Badge>
              <Badge variant={statusVariant}>
                {currentUser.is_active ? "Active" : "Suspended"}
              </Badge>
            </div>
          </div>
          <Button asChild variant="outline" className="h-11 min-w-[160px] justify-center">
            <Link to="/hosting/billing">Manage Billing</Link>
          </Button>
        </header>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
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
        </section>
      </div>
    </div>
  )
}

export default UserSettings
