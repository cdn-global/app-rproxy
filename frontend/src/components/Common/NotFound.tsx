import { Link } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"

const NotFound = () => {
  return (
    <div className="flex h-[85vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="rounded-full border border-border bg-background/70 px-6 py-2 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground backdrop-blur-sm dark:border-border dark:bg-background/70">
        Lost in space
      </div>
      <h1 className="text-7xl font-semibold tracking-tight text-foreground">
        404
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        We couldn&apos;t find the page you were looking for. It might have been moved or the link is outdated.
      </p>
      <Button asChild variant="outline" className="rounded-full px-6">
        <Link to="/">Return home</Link>
      </Button>
    </div>
  )
}

export default NotFound
