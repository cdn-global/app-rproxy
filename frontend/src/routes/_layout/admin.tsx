import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type UserPublic, UsersService } from "../../client"
import AddUser from "../../components/Admin/AddUser"
import ActionsMenu from "../../components/Common/ActionsMenu"
import {
  PageScaffold,
  PageSection,
  SectionNavigation,
  type SectionNavItem,
} from "../../components/Common/PageLayout"
import Navbar from "../../components/Common/Navbar"
import { PaginationFooter } from "../../components/Common/PaginationFooter"

const usersSearchSchema = z.object({
  page: z.number().catch(1),
})

type UsersSearch = z.infer<typeof usersSearchSchema>

export const Route = createFileRoute("/_layout/admin")({
  component: Admin,
  validateSearch: (search): UsersSearch => usersSearchSchema.parse(search),
})

const PER_PAGE = 5

function getUsersQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      UsersService.readUsers({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["users", { page }],
  }
}

function UsersTable() {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const { page } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const setPage = (nextPage: number) =>
    navigate({
      search: (prev: UsersSearch) => ({ ...prev, page: nextPage }),
    })

  const {
    data: users,
    isPending,
    isPlaceholderData,
  } = useQuery({
    ...getUsersQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const hasNextPage = !isPlaceholderData && (users?.data.length ?? 0) === PER_PAGE
  const hasPreviousPage = page > 1
  const totalUsers = users?.count ?? users?.data.length ?? 0

  useEffect(() => {
    if (hasNextPage) {
      queryClient.prefetchQuery(getUsersQueryOptions({ page: page + 1 }))
    }
  }, [page, queryClient, hasNextPage])

  const skeletonRows = Array.from({ length: 5 })
  const showEmptyState = !isPending && (users?.data.length ?? 0) === 0

  return (
    <Card className="border border-slate-200/70 bg-white/75 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.65)]">
      <CardHeader className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle className="text-xl">Account Directory</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage platform operators, superusers, and billing contacts.
          </p>
        </div>
        <Badge variant="subtle" className="rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em]">
          {totalUsers} team
        </Badge>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Full name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[110px]">Role</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
                <TableHead className="w-[110px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending
                ? skeletonRows.map((_, index) => (
                    <TableRow key={`skeleton-${index}`} className="animate-pulse">
                      {[0, 1, 2, 3, 4].map((cell) => (
                        <TableCell key={cell}>
                          <div className="h-4 w-full rounded bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : showEmptyState
                  ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        No users found. Invite a teammate with the quick actions above.
                      </TableCell>
                    </TableRow>
                  )
                  : users?.data.map((user) => {
                      const isSelf = currentUser?.id === user.id
                      const statusBadgeVariant = user.is_active ? "success" : "destructive"

                      return (
                        <TableRow
                          key={user.id}
                          className={isPlaceholderData ? "opacity-60" : undefined}
                        >
                          <TableCell className="max-w-[240px] truncate font-medium">
                            <span>{user.full_name || "N/A"}</span>
                            {isSelf ? (
                              <Badge variant="outline" className="ml-2 text-xs uppercase tracking-[0.16em]">
                                You
                              </Badge>
                            ) : null}
                          </TableCell>
                          <TableCell className="max-w-[280px] truncate text-muted-foreground">
                            {user.email}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.is_superuser ? "Superuser" : "User"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant} className="gap-2">
                              <span className={`h-2 w-2 rounded-full ${user.is_active ? "bg-emerald-500" : "bg-red-500"}`} aria-hidden="true" />
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <ActionsMenu
                              type="User"
                              value={user}
                              disabled={isSelf}
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
            </TableBody>
          </Table>
        </div>
        <PaginationFooter
          onChangePage={setPage}
          page={page}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
        />
      </CardContent>
    </Card>
  )
}

function Admin() {
  const navigation: SectionNavItem[] = [
    {
      id: "team-actions",
      label: "Team toolkit",
      description: "Invite, elevate, or retire operator access in one place.",
    },
    {
      id: "directory",
      label: "Account directory",
      description: "Browse every workspace identity and audit their status.",
    },
  ]

  return (
    <PageScaffold
      sidebar={
        <>
          <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/60 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/60 px-4 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-400">
              <span>Operations</span>
              <span className="h-1 w-1 rounded-full bg-slate-400" aria-hidden="true" />
              <span>Admin</span>
            </div>
            <div className="mt-5 space-y-3">
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                Team Administration
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Direct operator permissions and remove blockers before they impact production traffic.
              </p>
            </div>
            <div className="mt-6 space-y-3 text-xs text-slate-500 dark:text-slate-500">
              <p>
                Promote superusers for elevated tooling, archive dormant accounts, and confirm billing contacts without leaving this workspace.
              </p>
              <p>
                Activity logs and SCIM provisioning integrate next, mirroring updates across dashboards and audit trails.
              </p>
            </div>
          </div>
          <SectionNavigation items={navigation} />
        </>
      }
    >
      <PageSection
        id="team-actions"
        title="Administration toolkit"
        description="Spin up invites, issue privileges, and coordinate billing ownership."
      >
        <Navbar type="User" addModalAs={AddUser} />
      </PageSection>

      <PageSection
        id="directory"
        title="Account directory"
        description="Audit the full roster, confirm access scopes, and hand off follow-up tasks."
      >
        <UsersTable />
      </PageSection>
    </PageScaffold>
  )
}
