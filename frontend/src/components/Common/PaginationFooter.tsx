import { Button } from "@/components/ui/button"

type PaginationFooterProps = {
  hasNextPage?: boolean
  hasPreviousPage?: boolean
  onChangePage: (newPage: number) => void
  page: number
}

export function PaginationFooter({
  hasNextPage,
  hasPreviousPage,
  onChangePage,
  page,
}: PaginationFooterProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-end gap-3 text-sm text-muted-foreground">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChangePage(page - 1)}
        disabled={!hasPreviousPage || page <= 1}
      >
        Previous
      </Button>
      <span className="min-w-[110px] text-center">Page {page}</span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChangePage(page + 1)}
        disabled={!hasNextPage}
      >
        Next
      </Button>
    </div>
  )
}
