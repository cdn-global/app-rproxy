import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ItemsService } from "../../client"
import ActionsMenu from "../../components/Common/ActionsMenu"
import {
  PageScaffold,
  PageSection,
  SectionNavigation,
  type SectionNavItem,
} from "../../components/Common/PageLayout"
import Navbar from "../../components/Common/Navbar"
import { PaginationFooter } from "../../components/Common/PaginationFooter"
import AddItem from "../../components/Items/AddItem"
const itemsSearchSchema = z.object({
  page: z.number().catch(1),
})

type ItemsSearch = z.infer<typeof itemsSearchSchema>

export const Route = createFileRoute("/_layout/items")({
  component: Items,
  validateSearch: (search): ItemsSearch => itemsSearchSchema.parse(search),
})

const PER_PAGE = 5

function getItemsQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      ItemsService.readItems({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["items", { page }],
  }
}

function ItemsTable() {
  const queryClient = useQueryClient()
  const { page } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const setPage = (nextPage: number) =>
    navigate({
      search: (prev: ItemsSearch) => ({ ...prev, page: nextPage }),
    })
  const {
    data: items,
    isPending,
    isPlaceholderData,
  } = useQuery({
    ...getItemsQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const hasNextPage = !isPlaceholderData && (items?.data.length ?? 0) === PER_PAGE
  const hasPreviousPage = page > 1
  const totalItems = items?.count ?? items?.data.length ?? 0

  useEffect(() => {
    if (hasNextPage) {
      queryClient.prefetchQuery(getItemsQueryOptions({ page: page + 1 }))
    }
  }, [page, queryClient, hasNextPage])

  const skeletonRows = Array.from({ length: 5 })
  const showEmptyState = !isPending && (items?.data.length ?? 0) === 0

  return (
    <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
      <div className="mb-4 flex items-center justify-end">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em]">
          {totalItems} total
        </Badge>
      </div>
      <div className="overflow-x-auto">
        <Table className="min-w-[680px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending
              ? skeletonRows.map((_, index) => (
                  <TableRow key={`skeleton-${index}`} className="animate-pulse">
                    {[0, 1, 2, 3].map((cell) => (
                      <TableCell key={cell}>
                        <div className="h-4 w-full rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : showEmptyState
                ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                      No items found. Use the quick action above to add your first record.
                    </TableCell>
                  </TableRow>
                )
                : items?.data.map((item) => (
                    <TableRow
                      key={item.id}
                      className={isPlaceholderData ? "opacity-60" : undefined}
                    >
                      <TableCell className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {item.id}
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate font-medium">
                        {item.title}
                      </TableCell>
                      <TableCell className="max-w-[320px] truncate text-muted-foreground">
                        {item.description || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <ActionsMenu type="Item" value={item} />
                      </TableCell>
                    </TableRow>
                  ))}
          </TableBody>
        </Table>
      </div>
      <PaginationFooter
        page={page}
        onChangePage={setPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
      />
    </div>
  )
}

function Items() {
  const navigation: SectionNavItem[] = [
    {
      id: "actions",
      label: "Item toolkit",
      description: "Launch quick create flows and manage catalog inputs.",
    },
    {
      id: "inventory",
      label: "Catalog records",
      description: "Review every stored item, status, and available actions.",
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
              <span>Items</span>
            </div>
            <div className="mt-5 space-y-3">
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                Item Catalog
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Keep the knowledge base synchronized across crawler tooling, API guides, and inline helpers.
              </p>
            </div>
            <div className="mt-6 space-y-3 text-xs text-slate-500 dark:text-slate-500">
              <p>
                Use the toolkit to add or retire entries, then audit their metadata and linked snippets from the catalog section.
              </p>
              <p>
                Pagination keeps results fast; filters and ownership metadata arrive in a coming release.
              </p>
            </div>
          </div>
          <SectionNavigation items={navigation} />
        </>
      }
    >
      <PageSection
        id="actions"
        title="Catalog toolkit"
        description="Trigger creation flows and manage collaborative actions."
      >
        <Navbar type="Item" addModalAs={AddItem} />
      </PageSection>

      <PageSection
        id="inventory"
        title="Catalog inventory"
        description="Inspect every stored item, edit inline, or hand off for automation."
      >
        <ItemsTable />
      </PageSection>
    </PageScaffold>
  )
}
