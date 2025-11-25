import { Megaphone } from "lucide-react"
import type { FC } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const ComingSoon: FC = () => {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <Alert className="border-slate-200/70 bg-white/80 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/70">
        <Megaphone className="h-5 w-5 text-indigo-500" aria-hidden="true" />
        <div>
          <AlertTitle>Features in development</AlertTitle>
          <AlertDescription>
            We&apos;re polishing this experience right now. Check back soon for the full launch.
          </AlertDescription>
        </div>
      </Alert>
    </div>
  )
}

export default ComingSoon
