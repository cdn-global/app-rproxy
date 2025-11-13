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
  return (
    <div className="px-4 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/60 px-4 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-400">
            <span>Operations</span>
            <span className="h-1 w-1 rounded-full bg-slate-400" aria-hidden="true" />
            <span>Admin</span>
          </div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Team Administration
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Control access, promote superusers, and monitor account activity across the organization.
          </p>
        </header>
        <Navbar type="User" addModalAs={AddUser} />
        <UsersTable />
      </div>
    </div>
  )
}
