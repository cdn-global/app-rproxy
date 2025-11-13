import type React from "react"

import { Button } from "@/components/ui/button"

const ComingSoon: React.FC = () => {
  return (
    <section className="mx-auto max-w-3xl px-6 py-12 text-center">
      <div className="flex flex-col items-center justify-center gap-6">
        <p className="text-sm text-muted-foreground md:text-base">
          Account is not linked to a valid subscription
        </p>
        <Button asChild className="px-6">
          <a
            href="https://ROAMINGPROXY.com/pricing"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore Plans
          </a>
        </Button>
        <p className="text-sm text-muted-foreground md:text-base">
          If you have purchased a subscription, please{" "}
          <a
            href="mailto:support@ROAMINGPROXY.com"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            contact support
          </a>{" "}
          using the same email address used for the purchase.
        </p>
      </div>
    </section>
  )
}

export default ComingSoon
